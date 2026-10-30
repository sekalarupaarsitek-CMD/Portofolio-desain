/**
 * SEKALARUPA STUDIO - Authentication & Authorization Middleware
 * PRD Reference: Section 11 & 12 (Security Requirements)
 */

const jwt = require('jsonwebtoken');
const { get } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'sekalarupa-studio-architecture-jwt-secret-key-2026';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Authorization header missing.'
    });
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication session.'
    });
  }

  // Fetch admin user and profile
  const user = get('SELECT id, email, role, created_at FROM admin_users WHERE id = ?', [decoded.userId]);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Administrator account not found.'
    });
  }

  const profile = get('SELECT * FROM admin_profiles WHERE user_id = ?', [decoded.userId]);

  req.user = {
    ...user,
    profile: profile || {}
  };

  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireAuth
};
