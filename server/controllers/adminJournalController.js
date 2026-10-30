/**
 * SEKALARUPA STUDIO - Admin Journal Articles Controller
 * PRD Reference: Section 7.7 (Journal Manager) & Section 10.2
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'jour') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getAllJournal(req, res) {
  try {
    const posts = all(
      `SELECT p.*,
              tid.title as title_id, tid.slug as slug_id, tid.excerpt as excerpt_id,
              ten.title as title_en, ten.slug as slug_en, ten.excerpt as excerpt_en,
              c.name as category_name
       FROM journal_posts p
       LEFT JOIN journal_translations tid ON p.id = tid.post_id AND tid.locale = 'id'
       LEFT JOIN journal_translations ten ON p.id = ten.post_id AND ten.locale = 'en'
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function getJournalById(req, res) {
  try {
    const { id } = req.params;
    const post = get('SELECT * FROM journal_posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const transId = get("SELECT * FROM journal_translations WHERE post_id = ? AND locale = 'id'", [id]) || {};
    const transEn = get("SELECT * FROM journal_translations WHERE post_id = ? AND locale = 'en'", [id]) || {};

    return res.json({
      success: true,
      data: {
        ...post,
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

function createJournal(req, res) {
  try {
    const { coverImage, categoryId, publicationStatus, translations } = req.body;
    const jId = generateId('jour');

    run(
      `INSERT INTO journal_posts (id, cover_image, category_id, publication_status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        jId,
        coverImage || 'assets/images/project-villa-rural.jpg',
        categoryId || null,
        publicationStatus || 'draft',
        publicationStatus === 'published' ? new Date().toISOString() : null
      ]
    );

    if (translations?.id) {
      const slugId = (translations.id.slug || translations.id.title || 'artikel')
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .trim();
      run(
        `INSERT INTO journal_translations (id, post_id, locale, title, slug, excerpt, content, seo_title, seo_description)
         VALUES (?, ?, 'id', ?, ?, ?, ?, ?, ?)`,
        [
          generateId('jt'),
          jId,
          translations.id.title,
          slugId,
          translations.id.excerpt || '',
          translations.id.content || '',
          translations.id.seoTitle || `${translations.id.title} | Sekalarupa Studio`,
          translations.id.seoDescription || (translations.id.excerpt || '').substring(0, 160)
        ]
      );
    }

    if (translations?.en) {
      const slugEn = (translations.en.slug || translations.en.title || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .trim();
      run(
        `INSERT INTO journal_translations (id, post_id, locale, title, slug, excerpt, content, seo_title, seo_description)
         VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?)`,
        [
          generateId('jt'),
          jId,
          translations.en.title,
          slugEn,
          translations.en.excerpt || '',
          translations.en.content || '',
          translations.en.seoTitle || `${translations.en.title} | Sekalarupa Studio`,
          translations.en.seoDescription || (translations.en.excerpt || '').substring(0, 160)
        ]
      );
    }

    logActivity(req.user?.id, 'CREATE_JOURNAL', 'journal_posts', jId, {
      title: translations?.id?.title || translations?.en?.title
    });

    return res.status(201).json({ success: true, message: 'Article created successfully', id: jId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateJournal(req, res) {
  try {
    const { id } = req.params;
    const { coverImage, categoryId, publicationStatus, translations } = req.body;

    const existing = get('SELECT * FROM journal_posts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    let publishedAt = existing.published_at;
    if (publicationStatus === 'published' && !existing.published_at) {
      publishedAt = new Date().toISOString();
    }

    run(
      `UPDATE journal_posts
       SET cover_image = COALESCE(?, cover_image),
           category_id = COALESCE(?, category_id),
           publication_status = COALESCE(?, publication_status),
           published_at = COALESCE(?, published_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [coverImage || null, categoryId || null, publicationStatus || null, publishedAt, id]
    );

    // Update translations
    if (translations?.id) {
      const existingId = get("SELECT id FROM journal_translations WHERE post_id = ? AND locale = 'id'", [id]);
      if (existingId) {
        run(
          `UPDATE journal_translations
           SET title = COALESCE(?, title),
               slug = COALESCE(?, slug),
               excerpt = COALESCE(?, excerpt),
               content = COALESCE(?, content),
               seo_title = COALESCE(?, seo_title),
               seo_description = COALESCE(?, seo_description)
           WHERE id = ?`,
          [
            translations.id.title ?? null,
            translations.id.slug ?? null,
            translations.id.excerpt ?? null,
            translations.id.content ?? null,
            translations.id.seoTitle ?? null,
            translations.id.seoDescription ?? null,
            existingId.id
          ]
        );
      }
    }

    if (translations?.en) {
      const existingEn = get("SELECT id FROM journal_translations WHERE post_id = ? AND locale = 'en'", [id]);
      if (existingEn) {
        run(
          `UPDATE journal_translations
           SET title = COALESCE(?, title),
               slug = COALESCE(?, slug),
               excerpt = COALESCE(?, excerpt),
               content = COALESCE(?, content),
               seo_title = COALESCE(?, seo_title),
               seo_description = COALESCE(?, seo_description)
           WHERE id = ?`,
          [
            translations.en.title ?? null,
            translations.en.slug ?? null,
            translations.en.excerpt ?? null,
            translations.en.content ?? null,
            translations.en.seoTitle ?? null,
            translations.en.seoDescription ?? null,
            existingEn.id
          ]
        );
      }
    }

    logActivity(req.user?.id, 'UPDATE_JOURNAL', 'journal_posts', id);

    return res.json({ success: true, message: 'Article updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function deleteJournal(req, res) {
  try {
    const { id } = req.params;
    run('DELETE FROM journal_posts WHERE id = ?', [id]);
    logActivity(req.user?.id, 'DELETE_JOURNAL', 'journal_posts', id);
    return res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllJournal,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal
};
