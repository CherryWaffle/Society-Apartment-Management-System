import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import Joi from 'joi';

const router = express.Router();

// All board routes require BOARD_MEMBER role
router.use(authenticate);
router.use(requireRole('BOARD_MEMBER'));

// Validation schemas
const addMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  unitNumber: Joi.string().required(),
  unitType: Joi.string().valid('1BHK', '2BHK', '3BHK', '4BHK').required(),
  floorNumber: Joi.number().integer().min(0).required()
});

const generateMaintenanceSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).required(),
  dueDate: Joi.date().required()
});

const createNoticeSchema = Joi.object({
  title: Joi.string().min(3).required(),
  content: Joi.string().min(10).required(),
  category: Joi.string().valid('GENERAL', 'MAINTENANCE', 'EVENT', 'EMERGENCY').required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM')
});

const updateComplaintStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
  assignedTo: Joi.string().uuid().optional(),
  resolutionNotes: Joi.string().optional()
});

// Helper: Get board member's society ID
async function getBoardMemberSociety(userId) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return null;

  const { data: boardMember } = await supabase
    .from('society_board_members')
    .select('society_id')
    .eq('board_member_id', profile.id)
    .single();

  return boardMember?.society_id || null;
}

/**
 * GET /api/board/society
 * Get own society details
 */
router.get('/society', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found for this board member'
      });
    }

    const { data: society } = await supabase
      .from('societies')
      .select('*')
      .eq('id', societyId)
      .single();

    if (!society) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    // Get board members count
    const { count: boardMembersCount } = await supabase
      .from('society_board_members')
      .select('*', { count: 'exact', head: true })
      .eq('society_id', societyId);

    // Get total members count
    const { count: membersCount } = await supabase
      .from('society_units')
      .select('*', { count: 'exact', head: true })
      .eq('society_id', societyId)
      .eq('is_occupied', true);

    res.json({
      id: society.id,
      name: society.name,
      address: society.address,
      city: society.city,
      pincode: society.pincode,
      totalUnits: society.total_units,
      boardMembers: boardMembersCount || 0,
      totalMembers: membersCount || 0
    });
  } catch (error) {
    console.error('Get society error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch society'
    });
  }
});

/**
 * GET /api/board/members
 * List society members
 */
router.get('/members', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { data: units } = await supabase
      .from('society_units')
      .select(`
        id,
        unit_number,
        unit_type,
        floor_number,
        member_id,
        user_profiles!society_units_member_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq('society_id', societyId)
      .eq('is_occupied', true);

    const members = (units || []).map(unit => ({
      id: unit.user_profiles?.id,
      fullName: unit.user_profiles?.full_name,
      phone: unit.user_profiles?.phone,
      unitNumber: unit.unit_number,
      unitType: unit.unit_type,
      floorNumber: unit.floor_number
    }));

    res.json({ members });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch members'
    });
  }
});

/**
 * POST /api/board/members
 * Add society member
 */
router.post('/members', async (req, res) => {
  try {
    const { error, value } = addMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { userId, unitNumber, unitType, floorNumber } = value;

    // Verify user profile exists
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    if (!userProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    if (userProfile.role !== 'MEMBER') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User must have MEMBER role'
      });
    }

    // Check if unit already exists
    const { data: existingUnit } = await supabase
      .from('society_units')
      .select('id')
      .eq('society_id', societyId)
      .eq('unit_number', unitNumber)
      .single();

    let unit;
    if (existingUnit) {
      // Update existing unit
      const { data: updatedUnit } = await supabase
        .from('society_units')
        .update({
          member_id: userProfile.id,
          is_occupied: true
        })
        .eq('id', existingUnit.id)
        .select()
        .single();
      unit = updatedUnit;
    } else {
      // Create new unit
      const { data: newUnit, error: unitError } = await supabase
        .from('society_units')
        .insert({
          society_id: societyId,
          unit_number: unitNumber,
          unit_type: unitType,
          floor_number: floorNumber,
          member_id: userProfile.id,
          is_occupied: true
        })
        .select()
        .single();

      if (unitError) throw unitError;
      unit = newUnit;
    }

    res.status(201).json({
      id: userProfile.id,
      unitNumber: unit.unit_number,
      unitType: unit.unit_type,
      floorNumber: unit.floor_number
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add member'
    });
  }
});

/**
 * POST /api/board/maintenance/generate
 * Generate monthly maintenance bills
 */
router.post('/maintenance/generate', async (req, res) => {
  try {
    const { error, value } = generateMaintenanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { month, year, dueDate } = value;

    // Get all occupied units
    const { data: units } = await supabase
      .from('society_units')
      .select('id, member_id, unit_type')
      .eq('society_id', societyId)
      .eq('is_occupied', true);

    if (!units || units.length === 0) {
      return res.json({
        message: 'No occupied units found',
        billsGenerated: 0
      });
    }

    // Calculate maintenance amount based on unit type (example rates)
    const unitRates = {
      '1BHK': 3000,
      '2BHK': 5000,
      '3BHK': 7000,
      '4BHK': 10000
    };

    const bills = units.map(unit => ({
      society_id: societyId,
      unit_id: unit.id,
      member_id: unit.member_id,
      month,
      year,
      amount: unitRates[unit.unit_type] || 5000,
      status: 'PENDING',
      due_date: dueDate
    }));

    // Check if bills already exist for this month/year
    const { data: existingBills } = await supabase
      .from('maintenance_bills')
      .select('unit_id')
      .eq('society_id', societyId)
      .eq('month', month)
      .eq('year', year);

    const existingUnitIds = new Set((existingBills || []).map(b => b.unit_id));
    const newBills = bills.filter(bill => !existingUnitIds.has(bill.unit_id));

    if (newBills.length === 0) {
      return res.json({
        message: 'Bills already generated for this month',
        billsGenerated: 0
      });
    }

    const { error: insertError } = await supabase
      .from('maintenance_bills')
      .insert(newBills);

    if (insertError) throw insertError;

    res.json({
      message: 'Maintenance bills generated successfully',
      billsGenerated: newBills.length
    });
  } catch (error) {
    console.error('Generate maintenance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate maintenance bills'
    });
  }
});

/**
 * GET /api/board/maintenance
 * List all maintenance bills
 */
router.get('/maintenance', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { status, month, year } = req.query;

    let query = supabase
      .from('maintenance_bills')
      .select(`
        id,
        month,
        year,
        amount,
        status,
        due_date,
        paid_date,
        created_at,
        society_units!maintenance_bills_unit_id_fkey (
          unit_number
        ),
        user_profiles!maintenance_bills_member_id_fkey (
          full_name
        )
      `)
      .eq('society_id', societyId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (month) query = query.eq('month', parseInt(month));
    if (year) query = query.eq('year', parseInt(year));

    const { data: bills, error: billsError } = await query;

    if (billsError) throw billsError;

    const formattedBills = (bills || []).map(bill => ({
      id: bill.id,
      unitNumber: bill.society_units?.unit_number,
      memberName: bill.user_profiles?.full_name,
      month: bill.month,
      year: bill.year,
      amount: parseFloat(bill.amount),
      status: bill.status,
      dueDate: bill.due_date,
      paidDate: bill.paid_date,
      createdAt: bill.created_at
    }));

    res.json({ bills: formattedBills });
  } catch (error) {
    console.error('List maintenance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch maintenance bills'
    });
  }
});

/**
 * GET /api/board/visitors
 * List visitor pass requests
 */
router.get('/visitors', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { status } = req.query;

    let query = supabase
      .from('visitor_passes')
      .select(`
        id,
        visitor_name,
        visitor_phone,
        visitor_email,
        purpose,
        expected_date,
        expected_time,
        status,
        approved_at,
        entry_logged_at,
        created_at,
        user_profiles!visitor_passes_requested_by_fkey (
          full_name,
          society_units!inner (
            unit_number
          )
        )
      `)
      .eq('society_id', societyId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: visitors, error: visitorsError } = await query;

    if (visitorsError) throw visitorsError;

    const formattedVisitors = (visitors || []).map(visitor => ({
      id: visitor.id,
      visitorName: visitor.visitor_name,
      visitorPhone: visitor.visitor_phone,
      visitorEmail: visitor.visitor_email,
      purpose: visitor.purpose,
      expectedDate: visitor.expected_date,
      expectedTime: visitor.expected_time,
      status: visitor.status,
      approvedAt: visitor.approved_at,
      entryLoggedAt: visitor.entry_logged_at,
      requestedBy: {
        name: visitor.user_profiles?.full_name,
        unitNumber: visitor.user_profiles?.society_units?.[0]?.unit_number
      },
      createdAt: visitor.created_at
    }));

    res.json({ visitors: formattedVisitors });
  } catch (error) {
    console.error('List visitors error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch visitor passes'
    });
  }
});

/**
 * PUT /api/board/visitors/:visitorId/approve
 * Approve visitor pass
 */
router.put('/visitors/:visitorId/approve', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);

    // Get board member profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: visitor, error: updateError } = await supabase
      .from('visitor_passes')
      .update({
        status: 'APPROVED',
        approved_by: profile.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', visitorId)
      .eq('society_id', societyId)
      .select()
      .single();

    if (updateError || !visitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Visitor pass not found'
      });
    }

    res.json({
      id: visitor.id,
      status: visitor.status,
      approvedAt: visitor.approved_at
    });
  } catch (error) {
    console.error('Approve visitor error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to approve visitor pass'
    });
  }
});

/**
 * PUT /api/board/visitors/:visitorId/reject
 * Reject visitor pass
 */
router.put('/visitors/:visitorId/reject', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);

    const { data: visitor, error: updateError } = await supabase
      .from('visitor_passes')
      .update({
        status: 'REJECTED'
      })
      .eq('id', visitorId)
      .eq('society_id', societyId)
      .select()
      .single();

    if (updateError || !visitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Visitor pass not found'
      });
    }

    res.json({
      id: visitor.id,
      status: visitor.status,
      updatedAt: visitor.updated_at
    });
  } catch (error) {
    console.error('Reject visitor error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reject visitor pass'
    });
  }
});

/**
 * POST /api/board/visitors/:visitorId/log-entry
 * Log visitor entry
 */
router.post('/visitors/:visitorId/log-entry', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);

    const { data: visitor, error: updateError } = await supabase
      .from('visitor_passes')
      .update({
        entry_logged_at: new Date().toISOString()
      })
      .eq('id', visitorId)
      .eq('society_id', societyId)
      .select()
      .single();

    if (updateError || !visitor) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Visitor pass not found'
      });
    }

    res.json({
      id: visitor.id,
      entryLoggedAt: visitor.entry_logged_at
    });
  } catch (error) {
    console.error('Log entry error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to log visitor entry'
    });
  }
});

/**
 * POST /api/board/notices
 * Create notice
 */
router.post('/notices', async (req, res) => {
  try {
    const { error, value } = createNoticeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const societyId = await getBoardMemberSociety(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .insert({
        society_id: societyId,
        posted_by: profile.id,
        title: value.title,
        content: value.content,
        category: value.category,
        priority: value.priority,
        is_active: true
      })
      .select()
      .single();

    if (noticeError) throw noticeError;

    res.status(201).json({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isActive: notice.is_active,
      createdAt: notice.created_at
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create notice'
    });
  }
});

/**
 * GET /api/board/notices
 * List notices
 */
router.get('/notices', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    const { category, isActive } = req.query;

    let query = supabase
      .from('notices')
      .select(`
        id,
        title,
        content,
        category,
        priority,
        is_active,
        created_at,
        updated_at,
        user_profiles!notices_posted_by_fkey (
          full_name
        )
      `)
      .eq('society_id', societyId)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');

    const { data: notices, error: noticesError } = await query;

    if (noticesError) throw noticesError;

    const formattedNotices = (notices || []).map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isActive: notice.is_active,
      postedBy: notice.user_profiles?.full_name,
      createdAt: notice.created_at,
      updatedAt: notice.updated_at
    }));

    res.json({ notices: formattedNotices });
  } catch (error) {
    console.error('List notices error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notices'
    });
  }
});

/**
 * PUT /api/board/notices/:noticeId
 * Update notice
 */
router.put('/notices/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);

    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.content) updateData.content = req.body.content;
    if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;

    const { data: notice, error: updateError } = await supabase
      .from('notices')
      .update(updateData)
      .eq('id', noticeId)
      .eq('society_id', societyId)
      .select()
      .single();

    if (updateError || !notice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notice not found'
      });
    }

    res.json({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      isActive: notice.is_active,
      updatedAt: notice.updated_at
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notice'
    });
  }
});

/**
 * DELETE /api/board/notices/:noticeId
 * Delete notice
 */
router.delete('/notices/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);

    const { error: deleteError } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId)
      .eq('society_id', societyId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete notice'
    });
  }
});

/**
 * GET /api/board/complaints
 * List all complaints
 */
router.get('/complaints', async (req, res) => {
  try {
    const societyId = await getBoardMemberSociety(req.user.id);
    const { status, category } = req.query;

    let query = supabase
      .from('complaints')
      .select(`
        id,
        title,
        description,
        category,
        status,
        created_at,
        updated_at,
        user_profiles!complaints_raised_by_fkey (
          full_name,
          society_units!inner (
            unit_number
          )
        )
      `)
      .eq('society_id', societyId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data: complaints, error: complaintsError } = await query;

    if (complaintsError) throw complaintsError;

    const formattedComplaints = (complaints || []).map(complaint => ({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      raisedBy: {
        name: complaint.user_profiles?.full_name,
        unitNumber: complaint.user_profiles?.society_units?.[0]?.unit_number
      },
      createdAt: complaint.created_at,
      updatedAt: complaint.updated_at
    }));

    res.json({ complaints: formattedComplaints });
  } catch (error) {
    console.error('List complaints error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch complaints'
    });
  }
});

/**
 * PUT /api/board/complaints/:complaintId/status
 * Update complaint status
 */
router.put('/complaints/:complaintId/status', async (req, res) => {
  try {
    const { error, value } = updateComplaintStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { complaintId } = req.params;
    const societyId = await getBoardMemberSociety(req.user.id);
    const { status, assignedTo, resolutionNotes } = value;

    const updateData = {
      status,
      resolution_notes: resolutionNotes
    };

    if (assignedTo) updateData.assigned_to = assignedTo;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: complaint, error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', complaintId)
      .eq('society_id', societyId)
      .select()
      .single();

    if (updateError || !complaint) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Complaint not found'
      });
    }

    res.json({
      id: complaint.id,
      status: complaint.status,
      assignedTo: complaint.assigned_to,
      resolutionNotes: complaint.resolution_notes,
      updatedAt: complaint.updated_at
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update complaint'
    });
  }
});

export default router;
