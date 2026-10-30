/**
 * SEKALARUPA STUDIO - Admin Media Library Controller
 * PRD Reference: Section 7.4 (Media Library) & Section 8.7 (Image Editing)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'med') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * List media assets
 */
function getAllMedia(req, res) {
  try {
    const { folderId, search } = req.query;

    let sql = `
      SELECT m.*, f.name as folder_name
      FROM media_assets m
      LEFT JOIN media_folders f ON m.folder_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (folderId && folderId !== 'all') {
      sql += ' AND m.folder_id = ?';
      params.push(folderId);
    }

    if (search) {
      sql += ' AND (m.file_name LIKE ? OR m.alt_text LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    sql += ' ORDER BY m.uploaded_at DESC';

    const media = all(sql, params);
    return res.json({ success: true, total: media.length, data: media });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Upload single or multiple files
 */
function uploadMedia(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const { folderId, altText } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided for upload.' });
    }

    const uploadedAssets = [];

    for (const f of files) {
      const assetId = generateId('media');
      const storagePath = `uploads/${f.filename}`;

      run(
        `INSERT INTO media_assets (id, file_name, storage_path, file_type, file_size, alt_text, folder_id, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          assetId,
          f.originalname,
          storagePath,
          f.mimetype,
          f.size,
          altText || f.originalname.replace(/\.[^/.]+$/, ''),
          folderId || null
        ]
      );

      uploadedAssets.push({
        id: assetId,
        fileName: f.originalname,
        storagePath,
        fileType: f.mimetype,
        fileSize: f.size,
        altText: altText || f.originalname
      });
    }

    logActivity(req.user?.id, 'UPLOAD_MEDIA', 'media_assets', uploadedAssets[0]?.id, {
      count: uploadedAssets.length
    });

    return res.status(201).json({
      success: true,
      message: `${uploadedAssets.length} file(s) uploaded successfully.`,
      data: uploadedAssets
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update media metadata (alt text, file name, folder)
 */
function updateMedia(req, res) {
  try {
    const { id } = req.params;
    const { altText, fileName, folderId } = req.body;

    const existing = get('SELECT * FROM media_assets WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    run(
      `UPDATE media_assets
       SET alt_text = COALESCE(?, alt_text),
           file_name = COALESCE(?, file_name),
           folder_id = COALESCE(?, folder_id)
       WHERE id = ?`,
      [altText !== undefined ? altText : null, fileName || null, folderId !== undefined ? folderId : null, id]
    );

    logActivity(req.user?.id, 'UPDATE_MEDIA_METADATA', 'media_assets', id, { altText, fileName });

    return res.json({ success: true, message: 'Media updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete media asset with safety check (PRD Section 7.4)
 */
function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const media = get('SELECT * FROM media_assets WHERE id = ?', [id]);
    if (!media) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    // Check usage across projects, services, journal
    const usedInProjects = all(
      `SELECT p.id, p.slug, tid.title as title_id
       FROM project_media pm
       JOIN projects p ON pm.project_id = p.id
       LEFT JOIN project_translations tid ON p.id = tid.project_id AND tid.locale = 'id'
       WHERE pm.media_id = ?`,
      [id]
    );

    const usedInServices = all('SELECT service_key FROM services WHERE cover_media_id = ?', [id]);
    const usedInJournal = all('SELECT id FROM journal_posts WHERE cover_media_id = ?', [id]);

    const usages = [];
    if (usedInProjects.length > 0) {
      usages.push(`Digunakan pada ${usedInProjects.length} proyek (${usedInProjects.map(p => p.title_id || p.slug).join(', ')})`);
    }
    if (usedInServices.length > 0) {
      usages.push(`Digunakan sebagai cover pada layanan: ${usedInServices.map(s => s.service_key).join(', ')}`);
    }
    if (usedInJournal.length > 0) {
      usages.push(`Digunakan pada ${usedInJournal.length} artikel jurnal`);
    }

    if (usages.length > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        warning: true,
        message: 'File ini masih digunakan di konten website. Konfirmasi jika Anda tetap ingin menghapusnya.',
        usages
      });
    }

    // Delete physically if in uploads/ folder
    if (media.storage_path && media.storage_path.startsWith('uploads/')) {
      const fullPath = path.resolve(__dirname, '../../', media.storage_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('[Media Delete] Could not unlink file:', e.message);
        }
      }
    }

    run('DELETE FROM media_assets WHERE id = ?', [id]);

    logActivity(req.user?.id, 'DELETE_MEDIA', 'media_assets', id, {
      fileName: media.file_name
    });

    return res.json({ success: true, message: 'Media asset removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get media folders
 */
function getFolders(req, res) {
  try {
    const folders = all(
      `SELECT f.*, count(m.id) as media_count
       FROM media_folders f
       LEFT JOIN media_assets m ON f.id = m.folder_id
       GROUP BY f.id
       ORDER BY f.name ASC`
    );
    return res.json({ success: true, data: folders });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create media folder
 */
function createFolder(req, res) {
  try {
    const { name, parentFolderId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Folder name is required.' });
    }

    const folderId = `folder_${crypto.randomBytes(8).toString('hex')}`;
    run('INSERT INTO media_folders (id, name, parent_folder_id) VALUES (?, ?, ?)', [
      folderId,
      name.trim(),
      parentFolderId || null
    ]);

    logActivity(req.user?.id, 'CREATE_MEDIA_FOLDER', 'media_folders', folderId, { name });

    return res.status(201).json({
      success: true,
      data: { id: folderId, name: name.trim(), parentFolderId: parentFolderId || null }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete media folder
 */
function deleteFolder(req, res) {
  try {
    const { id } = req.params;
    run('UPDATE media_assets SET folder_id = NULL WHERE folder_id = ?', [id]);
    run('DELETE FROM media_folders WHERE id = ?', [id]);

    logActivity(req.user?.id, 'DELETE_MEDIA_FOLDER', 'media_folders', id);

    return res.json({ success: true, message: 'Folder deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  getFolders,
  createFolder,
  deleteFolder
};
