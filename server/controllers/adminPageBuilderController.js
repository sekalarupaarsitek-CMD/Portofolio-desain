/**
 * SEKALARUPA STUDIO - Admin Visual Page Builder Controller
 * PRD Reference: Section 8 (Hybrid Visual Page Builder) & Section 10.3
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');
const { DEFAULT_LANDING_PAGE_SCHEMA } = require('../db/landingPageSchema');

function generateId(prefix = 'page') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * List all website pages
 */
function getPages(req, res) {
  try {
    const pages = all(
      `SELECT p.*,
              tid.title as title_id, tid.slug as slug_id, tid.publication_status as status_id,
              ten.title as title_en, ten.slug as slug_en, ten.publication_status as status_en
       FROM pages p
       LEFT JOIN page_translations tid ON p.id = tid.page_id AND tid.locale = 'id'
       LEFT JOIN page_translations ten ON p.id = ten.page_id AND ten.locale = 'en'
       ORDER BY p.is_system_page DESC, p.created_at ASC`
    );

    return res.json({ success: true, data: pages });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Page Builder Data for a specific page & locale
 */
function getPageBuilderData(req, res) {
  try {
    const { id } = req.params;
    const locale = req.query.locale === 'en' ? 'en' : 'id';

    const page = get('SELECT * FROM pages WHERE id = ? OR page_key = ?', [id, id]);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const translation = get(
      'SELECT * FROM page_translations WHERE page_id = ? AND locale = ?',
      [page.id, locale]
    ) || {};

    let content = null;
    if (translation.content_json) {
      try {
        content = JSON.parse(translation.content_json);
      } catch (e) {
        content = translation.content_json;
      }
    }

    // Get versions history (PRD Section 8.9)
    const versions = all(
      `SELECT v.id, v.version_number, v.notes, v.created_at, p.full_name as created_by_name
       FROM page_versions v
       LEFT JOIN admin_profiles p ON v.created_by = p.user_id
       WHERE v.page_id = ? AND v.locale = ?
       ORDER BY v.version_number DESC
       LIMIT 20`,
      [page.id, locale]
    );

    return res.json({
      success: true,
      data: {
        pageId: page.id,
        pageKey: page.page_key,
        pageType: page.page_type,
        isSystemPage: Boolean(page.is_system_page),
        locale,
        title: translation.title || page.page_key,
        slug: translation.slug || page.page_key,
        seoTitle: translation.seo_title || '',
        seoDescription: translation.seo_description || '',
        publicationStatus: translation.publication_status || 'draft',
        publishedAt: translation.published_at,
        updatedAt: translation.updated_at,
        content: content || { version: 1, layout: 'section-based-grid', sections: [] },
        versions
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Save Visual Page Builder Content (Draft or Publish)
 * Creates automatic version snapshot in page_versions (PRD Section 8.9 & 10.3)
 */
function saveBuilderContent(req, res) {
  try {
    const { id } = req.params;
    const { locale = 'id', content, title, seoTitle, seoDescription, action = 'draft', notes } = req.body;

    const page = get('SELECT * FROM pages WHERE id = ? OR page_key = ?', [id, id]);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const contentJson = typeof content === 'object' ? JSON.stringify(content) : content;

    // Check existing translation
    const existingTrans = get(
      'SELECT id FROM page_translations WHERE page_id = ? AND locale = ?',
      [page.id, locale]
    );

    const publicationStatus = action === 'publish' ? 'published' : 'draft';
    const publishedAt = action === 'publish' ? new Date().toISOString() : null;

    if (existingTrans) {
      run(
        `UPDATE page_translations
         SET content_json = ?,
             title = COALESCE(?, title),
             seo_title = COALESCE(?, seo_title),
             seo_description = COALESCE(?, seo_description),
             publication_status = ?,
             published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [contentJson, title || null, seoTitle || null, seoDescription || null, publicationStatus, publicationStatus, existingTrans.id]
      );
    } else {
      run(
        `INSERT INTO page_translations
         (id, page_id, locale, title, slug, content_json, seo_title, seo_description, publication_status, published_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          generateId('pt'),
          page.id,
          locale,
          title || page.page_key,
          page.page_key,
          contentJson,
          seoTitle || '',
          seoDescription || '',
          publicationStatus,
          publishedAt
        ]
      );
    }

    // Determine next version number
    const lastVersion = get(
      'SELECT MAX(version_number) as max_v FROM page_versions WHERE page_id = ? AND locale = ?',
      [page.id, locale]
    );
    const nextVersion = (lastVersion?.max_v || 0) + 1;

    // Store version snapshot
    const versionId = generateId('pv');
    run(
      `INSERT INTO page_versions (id, page_id, locale, content_snapshot, version_number, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        versionId,
        page.id,
        locale,
        contentJson,
        nextVersion,
        notes || (action === 'publish' ? `Published Version ${nextVersion}` : `Autosaved Draft ${nextVersion}`),
        req.user?.id || null
      ]
    );

    logActivity(req.user?.id, action === 'publish' ? 'PUBLISH_PAGE' : 'SAVE_PAGE_BUILDER_DRAFT', 'pages', page.id, {
      locale,
      version: nextVersion,
      pageKey: page.page_key
    });

    return res.json({
      success: true,
      message: action === 'publish' ? 'Page published successfully!' : 'Page builder draft saved.',
      versionNumber: nextVersion,
      publicationStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Restore previous version from page_versions (PRD Section 8.9)
 */
function restoreVersion(req, res) {
  try {
    const { id, versionId } = req.params;

    const version = get('SELECT * FROM page_versions WHERE id = ?', [versionId]);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version record not found' });
    }

    run(
      `UPDATE page_translations
       SET content_json = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE page_id = ? AND locale = ?`,
      [version.content_snapshot, version.page_id, version.locale]
    );

    logActivity(req.user?.id, 'RESTORE_PAGE_VERSION', 'page_versions', versionId, {
      versionNumber: version.version_number
    });

    return res.json({
      success: true,
      message: `Version ${version.version_number} restored successfully.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create a new custom page
 */
function createPage(req, res) {
  try {
    const { pageKey, titleId, titleEn } = req.body;
    if (!pageKey || !pageKey.trim()) {
      return res.status(400).json({ success: false, error: 'Page key/slug is required.' });
    }

    const cleanKey = pageKey.toLowerCase().replace(/[^a-z0-9-_]/g, '-').trim();
    const existing = get('SELECT id FROM pages WHERE page_key = ?', [cleanKey]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Page key already exists.' });
    }

    const pId = generateId('page');
    run(
      'INSERT INTO pages (id, page_key, page_type, is_system_page) VALUES (?, ?, ?, 0)',
      [pId, cleanKey, 'custom']
    );

    const initialSchema = JSON.stringify({
      version: 1,
      layout: 'section-based-grid',
      sections: [
        {
          id: `sec-${Date.now()}`,
          type: 'section',
          props: { background: '#F5F3EE', paddingTop: 80, paddingBottom: 80 },
          elements: [
            {
              id: `elem-head-${Date.now()}`,
              type: 'heading',
              content: { id: titleId || cleanKey, en: titleEn || cleanKey }
            }
          ]
        }
      ]
    });

    run(
      `INSERT INTO page_translations (id, page_id, locale, title, slug, content_json, publication_status)
       VALUES (?, ?, 'id', ?, ?, ?, 'draft')`,
      [generateId('pt'), pId, titleId || cleanKey, cleanKey, initialSchema]
    );

    run(
      `INSERT INTO page_translations (id, page_id, locale, title, slug, content_json, publication_status)
       VALUES (?, ?, 'en', ?, ?, ?, 'draft')`,
      [generateId('pt'), pId, titleEn || cleanKey, cleanKey, initialSchema]
    );

    logActivity(req.user?.id, 'CREATE_PAGE', 'pages', pId, { pageKey: cleanKey });

    return res.status(201).json({ success: true, message: 'Page created successfully', id: pId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Reset page to default landing page schema template
 */
function resetDefaultTemplate(req, res) {
  try {
    const { id } = req.params;
    const locale = req.query.locale === 'en' ? 'en' : 'id';
    const page = get('SELECT * FROM pages WHERE id = ? OR page_key = ?', [id, id]);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const schemaStr = JSON.stringify(DEFAULT_LANDING_PAGE_SCHEMA);
    run(
      `UPDATE page_translations
       SET content_json = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE page_id = ? AND locale = ?`,
      [schemaStr, page.id, locale]
    );

    logActivity(req.user?.id, 'RESET_PAGE_TEMPLATE', 'pages', page.id, { locale });

    return res.json({ success: true, message: 'Landing page schema reset to default template.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getPages,
  getPageBuilderData,
  saveBuilderContent,
  restoreVersion,
  createPage,
  resetDefaultTemplate
};
