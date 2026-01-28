import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware to verify Supabase JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check user role
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get user profile to check role
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, user_id, full_name, phone, role')
        .eq('user_id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User profile not found'
        });
      }

      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      req.userRole = profile.role;
      req.userProfile = profile;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Role verification failed'
      });
    }
  };
};
