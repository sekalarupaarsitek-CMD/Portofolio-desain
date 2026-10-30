/**
 * SEKALARUPA STUDIO - Admin Services & Deliverables Controller
 * PRD Reference: Section 7.5 (Services Manager) & Section 7.6 (Deliverables Manager)
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'serv') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * List all services for admin
 */
function getAllServices(req, res) {
  try {
    const services = all(
      `SELECT s.*,
              tid.title as title_id, tid.description as desc_id, tid.scope_of_work as scope_id,
              ten.title as title_en, ten.description as desc_en, ten.scope_of_work as scope_en
       FROM services s
       LEFT JOIN service_translations tid ON s.id = tid.service_id AND tid.locale = 'id'
       LEFT JOIN service_translations ten ON s.id = ten.service_id AND ten.locale = 'en'
       ORDER BY s.sort_order ASC`
    );

    const formatted = services.map(s => ({
      id: s.id,
      serviceKey: s.service_key,
      titleId: s.title_id || s.service_key,
      titleEn: s.title_en || s.service_key,
      descId: s.desc_id,
      descEn: s.desc_en,
      scopeId: s.scope_id,
      scopeEn: s.scope_en,
      coverImage: s.cover_image,
      sortOrder: s.sort_order,
      isActive: Boolean(s.is_active),
      isPublished: Boolean(s.is_published)
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Service by ID
 */
function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = get('SELECT * FROM services WHERE id = ?', [id]);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const transId = get("SELECT * FROM service_translations WHERE service_id = ? AND locale = 'id'", [id]) || {};
    const transEn = get("SELECT * FROM service_translations WHERE service_id = ? AND locale = 'en'", [id]) || {};

    return res.json({
      success: true,
      data: {
        ...service,
        isActive: Boolean(service.is_active),
        isPublished: Boolean(service.is_published),
        translations: {
          id: transId,
          en: transEn
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create Service
 */
function createService(req, res) {
  try {
    const { serviceKey, coverImage, sortOrder, isActive, isPublished, translations } = req.body;

    const sId = generateId('serv');
    const cleanKey = (serviceKey || translations?.en?.title || 'service')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .trim();

    run(
      `INSERT INTO services (id, service_key, cover_image, sort_order, is_active, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [sId, cleanKey, coverImage || null, sortOrder !== undefined ? parseInt(sortOrder, 10) : 0, isActive ? 1 : 0, isPublished ? 1 : 0]
    );

    if (translations?.id) {
      run(
        `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
         VALUES (?, ?, 'id', ?, ?, ?, ?)`,
        [
          generateId('st'),
          sId,
          translations.id.title,
          cleanKey,
          translations.id.description || '',
          translations.id.scopeOfWork || ''
        ]
      );
    }

    if (translations?.en) {
      run(
        `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
         VALUES (?, ?, 'en', ?, ?, ?, ?)`,
        [
          generateId('st'),
          sId,
          translations.en.title,
          cleanKey,
          translations.en.description || '',
          translations.en.scopeOfWork || ''
        ]
      );
    }

    logActivity(req.user?.id, 'CREATE_SERVICE', 'services', sId, { serviceKey: cleanKey });

    return res.status(201).json({ success: true, message: 'Service created successfully', serviceId: sId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Service
 */
function updateService(req, res) {
  try {
    const { id } = req.params;
    const { serviceKey, coverImage, sortOrder, isActive, isPublished, translations } = req.body;

    const existing = get('SELECT * FROM services WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    run(
      `UPDATE services
       SET service_key = COALESCE(?, service_key),
           cover_image = COALESCE(?, cover_image),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active),
           is_published = COALESCE(?, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        serviceKey || null,
        coverImage || null,
        sortOrder !== undefined ? parseInt(sortOrder, 10) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        isPublished !== undefined ? (isPublished ? 1 : 0) : null,
        id
      ]
    );

    // Update ID translation
    if (translations?.id) {
      const existingId = get("SELECT id FROM service_translations WHERE service_id = ? AND locale = 'id'", [id]);
      if (existingId) {
        run(
          `UPDATE service_translations
           SET title = COALESCE(?, title),
               description = COALESCE(?, description),
               scope_of_work = COALESCE(?, scope_of_work)
           WHERE id = ?`,
          [translations.id.title ?? null, translations.id.description ?? null, translations.id.scopeOfWork ?? null, existingId.id]
        );
      } else {
        run(
          `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
           VALUES (?, ?, 'id', ?, ?, ?, ?)`,
          [generateId('st'), id, translations.id.title ?? '', existing.service_key, translations.id.description ?? '', translations.id.scopeOfWork ?? '']
        );
      }
    }

    // Update EN translation
    if (translations?.en) {
      const existingEn = get("SELECT id FROM service_translations WHERE service_id = ? AND locale = 'en'", [id]);
      if (existingEn) {
        run(
          `UPDATE service_translations
           SET title = COALESCE(?, title),
               description = COALESCE(?, description),
               scope_of_work = COALESCE(?, scope_of_work)
           WHERE id = ?`,
          [translations.en.title ?? null, translations.en.description ?? null, translations.en.scopeOfWork ?? null, existingEn.id]
        );
      } else {
        run(
          `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
           VALUES (?, ?, 'en', ?, ?, ?, ?)`,
          [generateId('st'), id, translations.en.title ?? '', existing.service_key, translations.en.description ?? '', translations.en.scopeOfWork ?? '']
        );
      }
    }

    logActivity(req.user?.id, 'UPDATE_SERVICE', 'services', id, { serviceKey: existing.service_key });

    return res.json({ success: true, message: 'Service updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete Service
 */
function deleteService(req, res) {
  try {
    const { id } = req.params;
    run('DELETE FROM services WHERE id = ?', [id]);
    logActivity(req.user?.id, 'DELETE_SERVICE', 'services', id);
    return res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
