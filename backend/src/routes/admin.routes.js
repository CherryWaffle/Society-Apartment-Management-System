import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import Joi from 'joi';

const router = express.Router();

// All admin routes require SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

// Validation schemas
const createSocietySchema = Joi.object({
  name: Joi.string().min(2).required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  pincode: Joi.string().required(),
  totalUnits: Joi.number().integer().min(1).required()
});

const assignBoardMemberSchema = Joi.object({
  boardMemberId: Joi.string().uuid().required(),
  designation: Joi.string().valid('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'MEMBER').default('MEMBER')
});

/**
 * GET /api/admin/societies
 * List all societies
 */
router.get('/societies', async (req, res) => {
  try {
    const { data: societies, error } = await supabaseAdmin
      .from('societies')
      .select('id, name, address, city, pincode, total_units, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ societies: societies || [] });
  } catch (error) {
    console.error('List societies error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch societies'
    });
  }
});

/**
 * POST /api/admin/societies
 * Create a new society
 */
router.post('/societies', async (req, res) => {
  try {
    const { error, value } = createSocietySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { name, address, city, pincode, totalUnits } = value;

    // Get admin profile ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Admin profile not found'
      });
    }

    const { data: society, error: createError } = await supabaseAdmin
      .from('societies')
      .insert({
        name,
        address,
        city,
        pincode,
        total_units: totalUnits,
        created_by: profile.id
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    res.status(201).json({
      id: society.id,
      name: society.name,
      address: society.address,
      city: society.city,
      pincode: society.pincode,
      totalUnits: society.total_units,
      createdAt: society.created_at
    });
  } catch (error) {
    console.error('Create society error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create society'
    });
  }
});

/**
 * POST /api/admin/societies/:societyId/board-members
 * Assign a board member to a society
 */
router.post('/societies/:societyId/board-members', async (req, res) => {
  try {
    const { error, value } = assignBoardMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { societyId } = req.params;
    const { boardMemberId, designation } = value;

    // Verify society exists
    const { data: society } = await supabaseAdmin
      .from('societies')
      .select('id')
      .eq('id', societyId)
      .single();

    if (!society) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Society not found'
      });
    }

    // Verify board member profile exists and has BOARD_MEMBER role
    const { data: boardMember } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role')
      .eq('id', boardMemberId)
      .single();

    if (!boardMember) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Board member profile not found'
      });
    }

    if (boardMember.role !== 'BOARD_MEMBER') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User does not have BOARD_MEMBER role'
      });
    }

    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('society_board_members')
      .insert({
        society_id: societyId,
        board_member_id: boardMemberId,
        designation: designation
      })
      .select()
      .single();

    if (assignError) {
      if (assignError.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Board member already assigned to this society'
        });
      }
      throw assignError;
    }

    res.status(201).json({
      id: assignment.id,
      societyId: assignment.society_id,
      boardMemberId: assignment.board_member_id,
      designation: assignment.designation,
      assignedAt: assignment.assigned_at
    });
  } catch (error) {
    console.error('Assign board member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign board member'
    });
  }
});

export default router;
