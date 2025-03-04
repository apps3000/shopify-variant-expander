/**
 * Admin login routes for app owner
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

/**
 * Admin login endpoint
 * This is a simplified example - in production use proper authentication
 * with secure password storage, rate limiting, and other security measures
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if credentials are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // In a real implementation, you would check against stored admin accounts
    // This is a placeholder example using environment variables for the admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!adminEmail || !adminPasswordHash || !adminSecret) {
      console.error('Admin credentials environment variables are not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Hash the provided password using the same algorithm as stored in env
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    // Check if credentials match
    if (email !== adminEmail || hashedPassword !== adminPasswordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create admin JWT token
    const token = jwt.sign(
      { 
        id: 'admin',
        email,
        isAdmin: true 
      },
      adminSecret,
      { expiresIn: '8h' } // Short expiry for admin tokens
    );
    
    // Return token
    res.json({
      token,
      expiresIn: 8 * 60 * 60, // 8 hours in seconds
      email
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
