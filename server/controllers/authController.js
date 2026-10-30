/**
 * SEKALARUPA STUDIO - Authentication Controller
 * PRD Reference: Section 7 (Admin Dashboard), 12 (Security), 23.6 (First Admin Setup)
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { get, run, all } = require('../db');
const { generateToken } = require('../middleware/auth');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'usr') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Check if the application requires first-time admin setup
 */
function getSetupStatus(req, res) {
  try {
    const adminCountRow = get('SELECT count(*) as count FROM admin_users');
    const adminCount = adminCountRow ? adminCountRow.count : 0;
    return res.json({
      success: true,
      setupRequired: adminCount === 0,
      adminCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Setup the very first administrator (PRD Section 23.6)
 */
async function setupInitialAdmin(req, res) {
  try {
    const adminCountRow = get('SELECT count(*) as count FROM admin_users');
    if (adminCountRow && adminCountRow.count > 0) {
      return res.status(403).json({
        success: false,
        error: 'Initial setup has already been completed. Please log in.'
      });
    }

    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = generateId('usr');
    const profileId = generateId('prof');
    const cleanEmail = email.toLowerCase().trim();

    run(
      'INSERT INTO admin_users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [userId, cleanEmail, passwordHash, 'superadmin']
    );

    run(
      'INSERT INTO admin_profiles (id, user_id, full_name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [profileId, userId, fullName.trim(), cleanEmail, phone ? phone.trim() : '']
    );

    logActivity(userId, 'SETUP_INITIAL_ADMIN', 'admin_users', userId, {
      email: cleanEmail,
      fullName
    });

    const token = generateToken({
      userId,
      email: cleanEmail,
      role: 'superadmin'
    });

    return res.json({
      success: true,
      message: 'Initial administrator account created successfully.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        role: 'superadmin'
      },
      profile: {
        id: profileId,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : ''
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Admin Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = get('SELECT * FROM admin_users WHERE email = ?', [cleanEmail]);

    // If user not found and database has no admins at all, seed default admin and re-query
    if (!user) {
      const adminCountRow = get('SELECT count(*) as count FROM admin_users');
      if (!adminCountRow || adminCountRow.count === 0) {
        try {
          const { seedDatabase } = require('../db/seed');
          await seedDatabase();
          user = get('SELECT * FROM admin_users WHERE email = ?', [cleanEmail]);
        } catch (seedErr) {
          console.error('[Auth Auto-Seed Error]', seedErr.message);
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const profile = get('SELECT * FROM admin_profiles WHERE user_id = ?', [user.id]) || {};

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    logActivity(user.id, 'LOGIN', 'auth', user.id, { email: user.email });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get current authenticated user profile
 */
function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

/**
 * Update Profile
 */
function updateProfile(req, res) {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const userId = req.user.id;

    run(
      `UPDATE admin_profiles
       SET full_name = COALESCE(?, full_name),
           phone = COALESCE(?, phone),
           avatar_url = COALESCE(?, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [fullName || null, phone || null, avatarUrl || null, userId]
    );

    logActivity(userId, 'UPDATE_PROFILE', 'admin_profiles', userId, { fullName, phone });

    const updatedProfile = get('SELECT * FROM admin_profiles WHERE user_id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updatedProfile
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Change Password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long.'
      });
    }

    const user = get('SELECT password_hash FROM admin_users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password does not match.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    run(
      'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, userId]
    );

    logActivity(userId, 'CHANGE_PASSWORD', 'admin_users', userId);

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSetupStatus,
  setupInitialAdmin,
  login,
  getMe,
  updateProfile,
  changePassword
};
