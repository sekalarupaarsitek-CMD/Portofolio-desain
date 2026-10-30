/**
 * SEKALARUPA STUDIO - Admin Activity Logger Service
 * PRD Reference: Section 10.2 (admin_activity_logs) & Section 12
 */

const crypto = require('crypto');
const { run, all } = require('../db');

function logActivity(adminId, action, entityType, entityId = null, details = null) {
  try {
    const logId = `log_${crypto.randomBytes(8).toString('hex')}`;
    const detailsStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;

    run(
      `INSERT INTO admin_activity_logs (id, admin_id, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [logId, adminId || null, action, entityType, entityId, detailsStr]
    );
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
}

function getRecentLogs(limit = 20) {
  return all(
    `SELECT l.*, p.full_name as admin_name, p.email as admin_email
     FROM admin_activity_logs l
     LEFT JOIN admin_profiles p ON l.admin_id = p.user_id
     ORDER BY l.created_at DESC
     LIMIT ?`,
    [limit]
  );
}

module.exports = {
  logActivity,
  getRecentLogs
};
