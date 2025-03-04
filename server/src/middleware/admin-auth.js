/**
 * Authentication middleware for app owner admin routes
 * This middleware ensures only authorized app owners can access admin routes
 */
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    // Get authentication header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin authorization token is required' });
    }
    
    // Extract the token
    const token = authHeader.substring(7);
    
    // Verify the JWT token using the admin secret
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!adminSecret) {
      console.error('ADMIN_JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    try {
      // Verify admin token
      const payload = jwt.verify(token, adminSecret);
      
      // Check if token is for admin role
      if (!payload.isAdmin) {
        return res.status(403).json({ error: 'Not authorized as admin' });
      }
      
      // Attach admin info to the request
      req.admin = {
        id: payload.id,
        email: payload.email
      };
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Invalid or expired admin token' });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
