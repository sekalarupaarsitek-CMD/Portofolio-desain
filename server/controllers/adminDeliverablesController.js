/**
 * SEKALARUPA STUDIO - Admin Deliverables Controller
 * PRD Reference: Section 4.2 (Service Deliverables) & Section 7.6 (Deliverables Manager)
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'deliv') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getAllDeliverables(req, res) {
  try {
    const deliverables = all('SELECT * FROM deliverables ORDER BY category ASC, sort_order ASC');
    return res.json({ success: true, data: deliverables });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function createDeliverable(req, res) {
  try {
    const { name, description, category, sortOrder, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Deliverable name is required.' });
    }

    const dId = generateId('deliv');
    run(
      'INSERT INTO deliverables (id, name, description, category, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [dId, name.trim(), description || '', category || 'Design Development', sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1]
    );

    logActivity(req.user?.id, 'CREATE_DELIVERABLE', 'deliverables', dId, { name });

    return res.status(201).json({ success: true, message: 'Deliverable created', id: dId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateDeliverable(req, res) {
  try {
    const { id } = req.params;
    const { name, description, category, sortOrder, isActive } = req.body;

    run(
      `UPDATE deliverables
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name || null,
        description !== undefined ? description : null,
        category || null,
        sortOrder !== undefined ? parseInt(sortOrder, 10) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id
      ]
    );

    logActivity(req.user?.id, 'UPDATE_DELIVERABLE', 'deliverables', id, { name });

    return res.json({ success: true, message: 'Deliverable updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function deleteDeliverable(req, res) {
  try {
    const { id } = req.params;
    run('DELETE FROM deliverables WHERE id = ?', [id]);
    logActivity(req.user?.id, 'DELETE_DELIVERABLE', 'deliverables', id);
    return res.json({ success: true, message: 'Deliverable deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable
};
