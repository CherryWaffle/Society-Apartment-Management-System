import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import Joi from 'joi';

const router = express.Router();

// All member routes require MEMBER role
router.use(authenticate);
router.use(requireRole('MEMBER'));

// Validation schemas
const requestVisitorSchema = Joi.object({
  visitorName: Joi.string().min(2).required(),
  visitorPhone: Joi.string().required(),
  visitorEmail: Joi.string().email().optional(),
  purpose: Joi.string().min(3).required(),
  expectedDate: Joi.date().required(),
  expectedTime: Joi.string().required()
});

const raiseComplaintSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(10).required(),
  category: Joi.string().valid('PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER').required()
});

// Helper: Get member's society ID and unit ID
async function getMemberSocietyAndUnit(userId) {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) return { societyId: null, unitId: null };

  const { data: unit } = await supabaseAdmin
    .from('society_units')
    .select('id, society_id')
    .eq('member_id', profile.id)
    .single();

  return {
    societyId: unit?.society_id || null,
    unitId: unit?.id || null
  };
}

/**
 * GET /api/member/bills
 * Get own maintenance bills
 */
router.get('/bills', async (req, res) => {
  try {
    const { status } = req.query;
    const { societyId, unitId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId || !unitId) {
      return res.json({ bills: [] });
    }

    let query = supabaseAdmin
      .from('maintenance_bills')
      .select('*')
      .eq('society_id', societyId)
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: bills, error: billsError } = await query;

    if (billsError) throw billsError;

    const formattedBills = (bills || []).map(bill => ({
      id: bill.id,
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
    console.error('Get bills error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bills'
    });
  }
});

/**
 * GET /api/member/bills/:billId
 * Get bill details
 */
router.get('/bills/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const { societyId, unitId } = await getMemberSocietyAndUnit(req.user.id);
    if (!societyId || !unitId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'You are not assigned to a unit yet. Ask your society board to add you.'
      });
    }

    const { data: bill, error: billError } = await supabaseAdmin
      .from('maintenance_bills')
      .select(`
        *,
        society_units!maintenance_bills_unit_id_fkey (
          unit_number,
          unit_type
        ),
        payment_transactions (*)
      `)
      .eq('id', billId)
      .eq('society_id', societyId)
      .eq('unit_id', unitId)
      .single();

    if (billError || !bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found'
      });
    }

    res.json({
      id: bill.id,
      month: bill.month,
      year: bill.year,
      amount: parseFloat(bill.amount),
      status: bill.status,
      dueDate: bill.due_date,
      paidDate: bill.paid_date,
      unitNumber: bill.society_units?.unit_number,
      unitType: bill.society_units?.unit_type,
      paymentTransaction: bill.payment_transactions?.[0] || null
    });
  } catch (error) {
    console.error('Get bill details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bill details'
    });
  }
});

/**
 * POST /api/member/bills/:billId/pay
 * Pay maintenance bill
 */
router.post('/bills/:billId/pay', async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod = 'ONLINE' } = req.body;
    const { societyId, unitId } = await getMemberSocietyAndUnit(req.user.id);
    if (!societyId || !unitId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'You are not assigned to a unit yet.'
      });
    }

    // Get bill
    const { data: bill, error: billError } = await supabaseAdmin
      .from('maintenance_bills')
      .select('*')
      .eq('id', billId)
      .eq('society_id', societyId)
      .eq('unit_id', unitId)
      .single();

    if (billError || !bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found'
      });
    }

    if (bill.status === 'PAID') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Bill already paid'
      });
    }

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        bill_id: billId,
        amount: bill.amount,
        payment_method: paymentMethod,
        status: 'SUCCESS',
        transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update bill status
    const { error: updateError } = await supabaseAdmin
      .from('maintenance_bills')
      .update({
        status: 'PAID',
        paid_date: new Date().toISOString()
      })
      .eq('id', billId);

    if (updateError) throw updateError;

    res.json({
      transactionId: transaction.id,
      billId: bill.id,
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      paymentDate: transaction.payment_date
    });
  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Payment failed'
    });
  }
});

/**
 * GET /api/member/payment-history
 * Get payment history
 */
router.get('/payment-history', async (req, res) => {
  try {
    const { societyId, unitId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId || !unitId) {
      return res.json({ payments: [] });
    }

    // Get all paid bills with transactions
    const { data: bills, error: billsError } = await supabaseAdmin
      .from('maintenance_bills')
      .select(`
        id,
        month,
        year,
        amount,
        payment_transactions!inner (
          id,
          payment_method,
          status,
          payment_date
        )
      `)
      .eq('society_id', societyId)
      .eq('unit_id', unitId)
      .eq('status', 'PAID')
      .order('created_at', { ascending: false });

    if (billsError) throw billsError;

    const payments = (bills || []).map(bill => ({
      id: bill.payment_transactions[0].id,
      billId: bill.id,
      month: bill.month,
      year: bill.year,
      amount: parseFloat(bill.amount),
      paymentMethod: bill.payment_transactions[0].payment_method,
      status: bill.payment_transactions[0].status,
      paymentDate: bill.payment_transactions[0].payment_date
    }));

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch payment history'
    });
  }
});

/**
 * POST /api/member/visitors
 * Request visitor pass
 */
router.post('/visitors', async (req, res) => {
  try {
    const { error, value } = requestVisitorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { societyId } = await getMemberSocietyAndUnit(req.user.id);
    if (!societyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You are not assigned to a unit yet. Ask your society board to add you.'
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: visitor, error: visitorError } = await supabaseAdmin
      .from('visitor_passes')
      .insert({
        society_id: societyId,
        requested_by: profile.id,
        visitor_name: value.visitorName,
        visitor_phone: value.visitorPhone,
        visitor_email: value.visitorEmail,
        purpose: value.purpose,
        expected_date: value.expectedDate,
        expected_time: value.expectedTime,
        status: 'PENDING'
      })
      .select()
      .single();

    if (visitorError) throw visitorError;

    res.status(201).json({
      id: visitor.id,
      visitorName: visitor.visitor_name,
      visitorPhone: visitor.visitor_phone,
      purpose: visitor.purpose,
      expectedDate: visitor.expected_date,
      expectedTime: visitor.expected_time,
      status: visitor.status,
      createdAt: visitor.created_at
    });
  } catch (error) {
    console.error('Request visitor error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to request visitor pass'
    });
  }
});

/**
 * GET /api/member/visitors
 * List own visitor passes
 */
router.get('/visitors', async (req, res) => {
  try {
    const { status } = req.query;
    const { societyId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId) {
      return res.json({ visitors: [] });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let query = supabaseAdmin
      .from('visitor_passes')
      .select('*')
      .eq('society_id', societyId)
      .eq('requested_by', profile.id)
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
 * GET /api/member/notices
 * List notices
 */
router.get('/notices', async (req, res) => {
  try {
    const { category } = req.query;
    const { societyId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId) {
      return res.json({ notices: [] });
    }

    let query = supabaseAdmin
      .from('notices')
      .select('*')
      .eq('society_id', societyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    const { data: notices, error: noticesError } = await query;

    if (noticesError) throw noticesError;

    const formattedNotices = (notices || []).map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      createdAt: notice.created_at
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
 * GET /api/member/notices/:noticeId
 * Get notice details
 */
router.get('/notices/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { societyId } = await getMemberSocietyAndUnit(req.user.id);
    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'You are not assigned to a unit yet.'
      });
    }

    const { data: notice, error: noticeError } = await supabaseAdmin
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .eq('society_id', societyId)
      .eq('is_active', true)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notice not found'
      });
    }

    res.json({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      createdAt: notice.created_at
    });
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notice'
    });
  }
});

/**
 * POST /api/member/complaints
 * Raise complaint
 */
router.post('/complaints', async (req, res) => {
  try {
    const { error, value } = raiseComplaintSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { societyId } = await getMemberSocietyAndUnit(req.user.id);
    if (!societyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You are not assigned to a unit yet. Ask your society board to add you.'
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from('complaints')
      .insert({
        society_id: societyId,
        raised_by: profile.id,
        title: value.title,
        description: value.description,
        category: value.category,
        status: 'OPEN'
      })
      .select()
      .single();

    if (complaintError) throw complaintError;

    // Handle photos if provided (for now, just return complaint without photos)
    // Photo upload would require Supabase Storage integration

    res.status(201).json({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      photos: [],
      createdAt: complaint.created_at
    });
  } catch (error) {
    console.error('Raise complaint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to raise complaint'
    });
  }
});

/**
 * GET /api/member/complaints
 * List own complaints
 */
router.get('/complaints', async (req, res) => {
  try {
    const { status } = req.query;
    const { societyId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId) {
      return res.json({ complaints: [] });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let query = supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('society_id', societyId)
      .eq('raised_by', profile.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: complaints, error: complaintsError } = await query;

    if (complaintsError) throw complaintsError;

    const formattedComplaints = (complaints || []).map(complaint => ({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      createdAt: complaint.created_at
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
 * GET /api/member/complaints/:complaintId
 * Get complaint details
 */
router.get('/complaints/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { societyId } = await getMemberSocietyAndUnit(req.user.id);

    if (!societyId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'You are not assigned to a unit yet.'
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        user_profiles!complaints_assigned_to_fkey (
          full_name
        )
      `)
      .eq('id', complaintId)
      .eq('society_id', societyId)
      .eq('raised_by', profile.id)
      .single();

    if (complaintError || !complaint) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Complaint not found'
      });
    }

    // Get complaint photos
    const { data: photos } = await supabaseAdmin
      .from('complaint_photos')
      .select('photo_url')
      .eq('complaint_id', complaintId);

    res.json({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      assignedTo: complaint.assigned_to ? {
        name: complaint.user_profiles?.full_name
      } : null,
      resolutionNotes: complaint.resolution_notes,
      photos: (photos || []).map(p => p.photo_url),
      createdAt: complaint.created_at,
      updatedAt: complaint.updated_at
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch complaint'
    });
  }
});

export default router;
