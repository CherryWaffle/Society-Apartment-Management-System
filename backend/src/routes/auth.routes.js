import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.middleware.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('MEMBER', 'BOARD_MEMBER', 'SUPER_ADMIN').default('MEMBER')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { email, password, fullName, phone, role } = value;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        error: 'Registration Failed',
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        error: 'Registration Failed',
        message: 'User creation failed'
      });
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        phone: phone,
        role: role
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin?.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({
        error: 'Registration Failed',
        message: 'Failed to create user profile'
      });
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError || !data.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('user_id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      fullName: profile.full_name,
      phone: profile.phone,
      role: profile.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user'
    });
  }
});

export default router;
