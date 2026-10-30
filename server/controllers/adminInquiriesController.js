/**
 * SEKALARUPA STUDIO - Admin Project Inquiries Controller
 * PRD Reference: Section 6 (Project Inquiry System)
 */

const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function getAllInquiries(req, res) {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM project_inquiries WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const inquiries = all(sql, params);

    return res.json({ success: true, total: inquiries.length, data: inquiries });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateInquiryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = get('SELECT * FROM project_inquiries WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }

    run(
      `UPDATE project_inquiries
       SET status = COALESCE(?, status),
           notes = COALESCE(?, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status || null, notes !== undefined ? notes : null, id]
    );

    logActivity(req.user?.id, 'UPDATE_INQUIRY_STATUS', 'project_inquiries', id, { status });

    return res.json({ success: true, message: 'Inquiry updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function deleteInquiry(req, res) {
  try {
    const { id } = req.params;
    run('DELETE FROM project_inquiries WHERE id = ?', [id]);
    logActivity(req.user?.id, 'DELETE_INQUIRY', 'project_inquiries', id);
    return res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllInquiries,
  updateInquiryStatus,
  deleteInquiry
};
