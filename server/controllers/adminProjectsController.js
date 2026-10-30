/**
 * SEKALARUPA STUDIO - Admin Projects Controller
 * PRD Reference: Section 7.3 (Portfolio Manager) & Section 10.2
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'proj') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * List all projects for admin
 */
function getAllProjects(req, res) {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT p.*,
             tid.title as title_id, tid.tagline as tagline_id,
             ten.title as title_en, ten.tagline as tagline_en
      FROM projects p
      LEFT JOIN project_translations tid ON p.id = tid.project_id AND tid.locale = 'id'
      LEFT JOIN project_translations ten ON p.id = ten.project_id AND ten.locale = 'en'
      WHERE 1=1
    `;
    const params = [];

    if (status === 'published') {
      sql += ' AND p.is_published = 1';
    } else if (status === 'draft') {
      sql += ' AND p.is_published = 0';
    }

    if (search) {
      sql += ' AND (tid.title LIKE ? OR ten.title LIKE ? OR p.slug LIKE ? OR p.location LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY p.sort_order ASC, p.created_at DESC';

    const rows = all(sql, params);

    const projects = rows.map(p => {
      const categories = all(
        `SELECT c.id, c.name, c.slug FROM categories c
         JOIN project_categories pc ON c.id = pc.category_id
         WHERE pc.project_id = ?`,
        [p.id]
      );
      const mediaCount = get('SELECT count(*) as count FROM project_media WHERE project_id = ?', [p.id])?.count || 0;

      return {
        id: p.id,
        slug: p.slug,
        titleId: p.title_id || p.slug,
        titleEn: p.title_en || p.slug,
        taglineId: p.tagline_id,
        taglineEn: p.tagline_en,
        projectType: p.project_type,
        status: p.status,
        location: p.location,
        year: p.year,
        landArea: p.land_area,
        buildingArea: p.building_area,
        isFeatured: Boolean(p.is_featured),
        isPublished: Boolean(p.is_published),
        sortOrder: p.sort_order,
        coverImage: p.cover_image,
        categories,
        mediaCount,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      };
    });

    return res.json({ success: true, data: projects });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get project by ID with full bilingual translations & relationships
 */
function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const project = get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const transId = get("SELECT * FROM project_translations WHERE project_id = ? AND locale = 'id'", [id]) || {};
    const transEn = get("SELECT * FROM project_translations WHERE project_id = ? AND locale = 'en'", [id]) || {};

    const categories = all(
      `SELECT c.id, c.name, c.slug FROM categories c
       JOIN project_categories pc ON c.id = pc.category_id
       WHERE pc.project_id = ?`,
      [id]
    );

    const media = all(
      `SELECT m.id, m.storage_path, m.file_name, m.alt_text, pm.media_role, pm.sort_order
       FROM media_assets m
       JOIN project_media pm ON m.id = pm.media_id
       WHERE pm.project_id = ?
       ORDER BY pm.sort_order ASC`,
      [id]
    );

    const deliverables = all(
      `SELECT d.id, d.name, d.category, pd.custom_description, pd.sort_order
       FROM deliverables d
       JOIN project_deliverables pd ON d.id = pd.deliverable_id
       WHERE pd.project_id = ?
       ORDER BY pd.sort_order ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...project,
        isFeatured: Boolean(project.is_featured),
        isPublished: Boolean(project.is_published),
        translations: {
          id: transId,
          en: transEn
        },
        categoryIds: categories.map(c => c.id),
        categories,
        media,
        deliverableIds: deliverables.map(d => d.id),
        deliverables
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create new project
 */
function createProject(req, res) {
  try {
    const {
      slug,
      projectType,
      status,
      locationType,
      location,
      year,
      landArea,
      buildingArea,
      isFeatured,
      isPublished,
      coverImage,
      sortOrder,
      translations,
      categoryIds,
      mediaIds,
      deliverableIds
    } = req.body;

    const projectId = generateId('proj');
    const cleanSlug = (slug || translations?.en?.title || translations?.id?.title || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check slug uniqueness
    const existing = get('SELECT id FROM projects WHERE slug = ?', [cleanSlug]);
    const finalSlug = existing ? `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}` : cleanSlug;

    run(
      `INSERT INTO projects (
        id, slug, project_type, status, location_type, location, year,
        land_area, building_area, is_featured, sort_order, is_published, cover_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        projectId,
        finalSlug,
        projectType || 'Architecture',
        status || 'Concept',
        locationType || 'Urban',
        location || '',
        year || String(new Date().getFullYear()),
        landArea || '',
        buildingArea || '',
        isFeatured ? 1 : 0,
        sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isPublished ? 1 : 0,
        coverImage || 'assets/images/hero-architecture.jpg'
      ]
    );

    // Save ID translation
    if (translations?.id) {
      run(
        `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
         VALUES (?, ?, 'id', ?, ?, ?, ?, ?, ?)`,
        [
          generateId('pt'),
          projectId,
          translations.id.title || finalSlug,
          translations.id.tagline || '',
          translations.id.description || '',
          translations.id.designConcept || '',
          translations.id.seoTitle || `${translations.id.title} | Sekalarupa Studio`,
          translations.id.seoDescription || (translations.id.description || '').substring(0, 160)
        ]
      );
    }

    // Save EN translation
    if (translations?.en) {
      run(
        `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
         VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?)`,
        [
          generateId('pt'),
          projectId,
          translations.en.title || finalSlug,
          translations.en.tagline || '',
          translations.en.description || '',
          translations.en.designConcept || '',
          translations.en.seoTitle || `${translations.en.title} | Sekalarupa Studio`,
          translations.en.seoDescription || (translations.en.description || '').substring(0, 160)
        ]
      );
    }

    // Assign categories
    if (Array.isArray(categoryIds)) {
      for (const catId of categoryIds) {
        run('INSERT OR IGNORE INTO project_categories (id, project_id, category_id) VALUES (?, ?, ?)', [
          generateId('pc'),
          projectId,
          catId
        ]);
      }
    }

    // Assign media
    if (Array.isArray(mediaIds)) {
      mediaIds.forEach((mId, idx) => {
        run('INSERT INTO project_media (id, project_id, media_id, media_role, sort_order) VALUES (?, ?, ?, ?, ?)', [
          generateId('pm'),
          projectId,
          mId,
          idx === 0 ? 'cover' : 'gallery',
          idx
        ]);
      });
    }

    // Assign deliverables
    if (Array.isArray(deliverableIds)) {
      deliverableIds.forEach((delivId, idx) => {
        run('INSERT OR IGNORE INTO project_deliverables (id, project_id, deliverable_id, sort_order) VALUES (?, ?, ?, ?)', [
          generateId('pd'),
          projectId,
          delivId,
          idx
        ]);
      });
    }

    logActivity(req.user?.id, 'CREATE_PROJECT', 'projects', projectId, {
      title: translations?.id?.title || translations?.en?.title,
      slug: finalSlug
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      projectId,
      slug: finalSlug
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update project
 */
function updateProject(req, res) {
  try {
    const { id } = req.params;
    const {
      slug,
      projectType,
      status,
      locationType,
      location,
      year,
      landArea,
      buildingArea,
      isFeatured,
      isPublished,
      coverImage,
      sortOrder,
      translations,
      categoryIds,
      mediaIds,
      deliverableIds
    } = req.body;

    const existing = get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    run(
      `UPDATE projects
       SET slug = COALESCE(?, slug),
           project_type = COALESCE(?, project_type),
           status = COALESCE(?, status),
           location_type = COALESCE(?, location_type),
           location = COALESCE(?, location),
           year = COALESCE(?, year),
           land_area = COALESCE(?, land_area),
           building_area = COALESCE(?, building_area),
           is_featured = COALESCE(?, is_featured),
           is_published = COALESCE(?, is_published),
           cover_image = COALESCE(?, cover_image),
           sort_order = COALESCE(?, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        slug || null,
        projectType || null,
        status || null,
        locationType || null,
        location || null,
        year || null,
        landArea || null,
        buildingArea || null,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
        isPublished !== undefined ? (isPublished ? 1 : 0) : null,
        coverImage || null,
        sortOrder !== undefined ? parseInt(sortOrder, 10) : null,
        id
      ]
    );

    // Update translations
    if (translations?.id) {
      const existingId = get("SELECT id FROM project_translations WHERE project_id = ? AND locale = 'id'", [id]);
      if (existingId) {
        run(
          `UPDATE project_translations
           SET title = COALESCE(?, title),
               tagline = COALESCE(?, tagline),
               description = COALESCE(?, description),
               design_concept = COALESCE(?, design_concept),
               seo_title = COALESCE(?, seo_title),
               seo_description = COALESCE(?, seo_description)
           WHERE id = ?`,
          [
            translations.id.title ?? null,
            translations.id.tagline ?? null,
            translations.id.description ?? null,
            translations.id.designConcept ?? null,
            translations.id.seoTitle ?? null,
            translations.id.seoDescription ?? null,
            existingId.id
          ]
        );
      } else {
        run(
          `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
           VALUES (?, ?, 'id', ?, ?, ?, ?, ?, ?)`,
          [
            generateId('pt'),
            id,
            translations.id.title ?? '',
            translations.id.tagline ?? '',
            translations.id.description ?? '',
            translations.id.designConcept ?? '',
            translations.id.seoTitle ?? '',
            translations.id.seoDescription ?? ''
          ]
        );
      }
    }

    if (translations?.en) {
      const existingEn = get("SELECT id FROM project_translations WHERE project_id = ? AND locale = 'en'", [id]);
      if (existingEn) {
        run(
          `UPDATE project_translations
           SET title = COALESCE(?, title),
               tagline = COALESCE(?, tagline),
               description = COALESCE(?, description),
               design_concept = COALESCE(?, design_concept),
               seo_title = COALESCE(?, seo_title),
               seo_description = COALESCE(?, seo_description)
           WHERE id = ?`,
          [
            translations.en.title ?? null,
            translations.en.tagline ?? null,
            translations.en.description ?? null,
            translations.en.designConcept ?? null,
            translations.en.seoTitle ?? null,
            translations.en.seoDescription ?? null,
            existingEn.id
          ]
        );
      } else {
        run(
          `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
           VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?)`,
          [
            generateId('pt'),
            id,
            translations.en.title ?? '',
            translations.en.tagline ?? '',
            translations.en.description ?? '',
            translations.en.designConcept ?? '',
            translations.en.seoTitle ?? '',
            translations.en.seoDescription ?? ''
          ]
        );
      }
    }

    // Refresh categories if provided
    if (Array.isArray(categoryIds)) {
      run('DELETE FROM project_categories WHERE project_id = ?', [id]);
      for (const catId of categoryIds) {
        run('INSERT INTO project_categories (id, project_id, category_id) VALUES (?, ?, ?)', [
          generateId('pc'),
          id,
          catId
        ]);
      }
    }

    // Refresh media if provided
    if (Array.isArray(mediaIds)) {
      run('DELETE FROM project_media WHERE project_id = ?', [id]);
      mediaIds.forEach((mId, idx) => {
        run('INSERT INTO project_media (id, project_id, media_id, media_role, sort_order) VALUES (?, ?, ?, ?, ?)', [
          generateId('pm'),
          id,
          mId,
          idx === 0 ? 'cover' : 'gallery',
          idx
        ]);
      });
    }

    // Refresh deliverables if provided
    if (Array.isArray(deliverableIds)) {
      run('DELETE FROM project_deliverables WHERE project_id = ?', [id]);
      deliverableIds.forEach((delivId, idx) => {
        run('INSERT INTO project_deliverables (id, project_id, deliverable_id, sort_order) VALUES (?, ?, ?, ?)', [
          generateId('pd'),
          id,
          delivId,
          idx
        ]);
      });
    }

    logActivity(req.user?.id, 'UPDATE_PROJECT', 'projects', id, { slug: existing.slug });

    return res.json({ success: true, message: 'Project updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete project
 */
function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const project = get('SELECT slug FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    run('DELETE FROM projects WHERE id = ?', [id]);

    logActivity(req.user?.id, 'DELETE_PROJECT', 'projects', id, { slug: project.slug });

    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Duplicate project (PRD Section 7.3)
 */
function duplicateProject(req, res) {
  try {
    const { id } = req.params;
    const original = get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const newId = generateId('proj');
    const newSlug = `${original.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;

    run(
      `INSERT INTO projects (
        id, slug, project_type, status, location_type, location, year,
        land_area, building_area, is_featured, sort_order, is_published, cover_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        newId,
        newSlug,
        original.project_type,
        'Concept',
        original.location_type,
        original.location,
        original.year,
        original.land_area,
        original.building_area,
        (original.sort_order || 0) + 1,
        original.cover_image
      ]
    );

    // Copy translations
    const translations = all('SELECT * FROM project_translations WHERE project_id = ?', [id]);
    for (const t of translations) {
      run(
        `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('pt'),
          newId,
          t.locale,
          `${t.title} (Copy)`,
          t.tagline,
          t.description,
          t.design_concept,
          `${t.title} (Copy)`,
          t.seo_description
        ]
      );
    }

    // Copy categories
    const categories = all('SELECT category_id FROM project_categories WHERE project_id = ?', [id]);
    for (const c of categories) {
      run('INSERT INTO project_categories (id, project_id, category_id) VALUES (?, ?, ?)', [
        generateId('pc'),
        newId,
        c.category_id
      ]);
    }

    // Copy media
    const media = all('SELECT media_id, media_role, sort_order FROM project_media WHERE project_id = ?', [id]);
    for (const m of media) {
      run('INSERT INTO project_media (id, project_id, media_id, media_role, sort_order) VALUES (?, ?, ?, ?, ?)', [
        generateId('pm'),
        newId,
        m.media_id,
        m.media_role,
        m.sort_order
      ]);
    }

    // Copy deliverables
    const deliverables = all('SELECT deliverable_id, custom_description, sort_order FROM project_deliverables WHERE project_id = ?', [id]);
    for (const d of deliverables) {
      run('INSERT INTO project_deliverables (id, project_id, deliverable_id, custom_description, sort_order) VALUES (?, ?, ?, ?, ?)', [
        generateId('pd'),
        newId,
        d.deliverable_id,
        d.custom_description,
        d.sort_order
      ]);
    }

    logActivity(req.user?.id, 'DUPLICATE_PROJECT', 'projects', newId, {
      fromId: id,
      newSlug
    });

    return res.json({
      success: true,
      message: 'Project duplicated successfully as draft',
      newId,
      newSlug
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Toggle Publish / Featured status
 */
function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    const { isPublished, isFeatured } = req.body;

    const project = get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (isPublished !== undefined) {
      run('UPDATE projects SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        isPublished ? 1 : 0,
        id
      ]);
      logActivity(req.user?.id, isPublished ? 'PUBLISH_PROJECT' : 'UNPUBLISH_PROJECT', 'projects', id);
    }

    if (isFeatured !== undefined) {
      run('UPDATE projects SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        isFeatured ? 1 : 0,
        id
      ]);
      logActivity(req.user?.id, 'TOGGLE_FEATURED_PROJECT', 'projects', id, { isFeatured });
    }

    return res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Duplicate an existing project with all translations, categories, and media
 */
function duplicateProject(req, res) {
  try {
    const { id } = req.params;
    const existing = get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const newId = generateId('proj');
    const newSlug = `${existing.slug}-copy-${Date.now().toString().slice(-4)}`;

    run(
      `INSERT INTO projects (id, slug, project_type, status, location_type, location, year, land_area, building_area, is_featured, is_published, cover_image, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        newId,
        newSlug,
        existing.project_type,
        existing.status,
        existing.location_type,
        existing.location,
        existing.year,
        existing.land_area,
        existing.building_area,
        existing.is_featured,
        existing.cover_image,
        (existing.sort_order || 0) + 1
      ]
    );

    // Duplicate translations
    const translations = all('SELECT * FROM project_translations WHERE project_id = ?', [id]);
    for (const t of translations) {
      run(
        `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('pt'),
          newId,
          t.locale,
          `${t.title} (Copy)`,
          t.tagline,
          t.description,
          t.design_concept,
          t.seo_title,
          t.seo_description
        ]
      );
    }

    // Duplicate categories
    const categories = all('SELECT * FROM project_categories WHERE project_id = ?', [id]);
    for (const c of categories) {
      run('INSERT INTO project_categories (project_id, category_id) VALUES (?, ?)', [newId, c.category_id]);
    }

    // Duplicate media
    const media = all('SELECT * FROM project_media WHERE project_id = ?', [id]);
    for (const m of media) {
      run(
        'INSERT INTO project_media (id, project_id, media_asset_id, is_cover, is_hero, sort_order, caption_translations) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          generateId('pm'),
          newId,
          m.media_asset_id,
          m.is_cover,
          m.is_hero,
          m.sort_order,
          m.caption_translations
        ]
      );
    }

    logActivity(req.user?.id, 'DUPLICATE_PROJECT', 'projects', newId, { originalId: id });

    return res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      projectId: newId,
      slug: newSlug
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  toggleStatus
};
