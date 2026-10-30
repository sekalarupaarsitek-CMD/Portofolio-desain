/**
 * SEKALARUPA STUDIO - Public API Controller
 * PRD Reference: Section 5 (IA), 6 (Inquiry System), 9 (Multilingual), 10 (Database)
 * Provides read-only access to published content with bilingual translations.
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');

/**
 * Get Site Info, Navigation, Settings & Design Tokens
 */
function getSiteInfo(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';

    // Site settings
    const settingsRows = all('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    for (const r of settingsRows) {
      try {
        settings[r.setting_key] = JSON.parse(r.setting_value);
      } catch (e) {
        settings[r.setting_key] = r.setting_value;
      }
    }

    // Theme tokens
    const themeRows = all('SELECT theme_key, theme_value FROM theme_settings');
    const theme = {};
    for (const r of themeRows) {
      try {
        theme[r.theme_key] = JSON.parse(r.theme_value);
      } catch (e) {
        theme[r.theme_key] = r.theme_value;
      }
    }

    // Navigation menu items
    const navItemsRows = all(
      `SELECT i.* FROM navigation_items i
       JOIN navigation_menus m ON i.menu_id = m.id
       WHERE m.menu_key = 'main-nav' AND i.is_active = 1
       ORDER BY i.sort_order ASC`
    );

    const navigation = navItemsRows.map(item => {
      let labels = {};
      try {
        labels = JSON.parse(item.label_translations);
      } catch (e) {
        labels = { id: item.label_translations, en: item.label_translations };
      }
      return {
        id: item.id,
        label: labels[locale] || labels.id || item.url,
        url: item.url,
        target: item.target
      };
    });

    return res.json({
      success: true,
      data: {
        brand: {
          name: settings.brand_name || 'SEKALARUPA STUDIO',
          shortName: settings.short_name || 'SEKALARUPA',
          tagline: locale === 'en' ? settings.tagline_en : settings.tagline_id,
          philosophy: locale === 'en' ? settings.philosophy_en : settings.philosophy_id,
          sundanesePhilosophy: settings.sundanese_philosophy || 'Tatar Rupa Mawa Bagja',
          sundaneseMeaning: locale === 'en' ? settings.sundanese_meaning_en : settings.sundanese_meaning_id,
          whatsapp: settings.whatsapp || '087857523074',
          whatsappIntl: settings.whatsapp_intl || '+62 878-5752-3074',
          whatsappNumberOnly: settings.whatsapp_number_only || '6287857523074',
          instagram: settings.instagram || '@sekalarupa.arsitek',
          instagramUrl: settings.instagram_url || 'https://instagram.com/sekalarupa.arsitek',
          email: settings.email || 'contact@sekalarupa.com',
          location: settings.location || 'Bandung & Nationwide (Indonesia)',
          established: settings.established || '2026'
        },
        navigation,
        theme,
        seo: {
          defaultTitle: settings.seo_default_title,
          defaultDescription: settings.seo_default_description
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Published Projects with bilingual translation & relations
 */
function getProjects(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';
    const categorySlug = req.query.category;
    const isFeatured = req.query.featured;
    const limit = parseInt(req.query.limit, 10) || 50;

    let sql = `
      SELECT p.*,
             t.title, t.tagline, t.description, t.design_concept, t.seo_title, t.seo_description
      FROM projects p
      LEFT JOIN project_translations t ON p.id = t.project_id AND t.locale = ?
      WHERE p.is_published = 1
    `;
    const params = [locale];

    if (categorySlug && categorySlug !== 'all') {
      sql += `
        AND p.id IN (
          SELECT pc.project_id FROM project_categories pc
          JOIN categories c ON pc.category_id = c.id
          WHERE c.slug = ?
        )
      `;
      params.push(categorySlug);
    }

    if (isFeatured !== undefined) {
      sql += ' AND p.is_featured = ?';
      params.push(parseInt(isFeatured, 10) ? 1 : 0);
    }

    sql += ' ORDER BY p.sort_order ASC, p.created_at DESC LIMIT ?';
    params.push(limit);

    const rows = all(sql, params);

    // Populate categories, media, and deliverables for each project
    const projects = rows.map(p => {
      const categories = all(
        `SELECT c.id, c.name, c.slug, c.category_type
         FROM categories c
         JOIN project_categories pc ON c.id = pc.category_id
         WHERE pc.project_id = ?`,
        [p.id]
      );

      const media = all(
        `SELECT m.id, m.storage_path, m.file_name, m.alt_text, pm.media_role, pm.sort_order
         FROM media_assets m
         JOIN project_media pm ON m.id = pm.media_id
         WHERE pm.project_id = ?
         ORDER BY pm.sort_order ASC`,
        [p.id]
      );

      const deliverables = all(
        `SELECT d.id, d.name, d.description, d.category, pd.custom_description
         FROM deliverables d
         JOIN project_deliverables pd ON d.id = pd.deliverable_id
         WHERE pd.project_id = ?
         ORDER BY pd.sort_order ASC`,
        [p.id]
      );

      return {
        id: p.id,
        slug: p.slug,
        title: p.title || p.slug,
        tagline: p.tagline,
        projectType: p.project_type,
        status: p.status,
        locationType: p.location_type,
        location: p.location,
        year: p.year,
        landArea: p.land_area,
        buildingArea: p.building_area,
        isFeatured: Boolean(p.is_featured),
        sortOrder: p.sort_order,
        coverImage: p.cover_image,
        description: p.description,
        designConcept: p.design_concept,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        categories,
        categoryNames: categories.map(c => c.name),
        categoryKeys: categories.map(c => c.slug),
        media,
        deliverables: deliverables.map(d => d.custom_description || d.name)
      };
    });

    return res.json({
      success: true,
      total: projects.length,
      data: projects
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Single Project by Slug
 */
function getProjectBySlug(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';
    const { slug } = req.params;

    const project = get(
      `SELECT p.*,
              t.title, t.tagline, t.description, t.design_concept, t.seo_title, t.seo_description
       FROM projects p
       LEFT JOIN project_translations t ON p.id = t.project_id AND t.locale = ?
       WHERE p.slug = ? AND p.is_published = 1`,
      [locale, slug]
    );

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const categories = all(
      `SELECT c.id, c.name, c.slug, c.category_type
       FROM categories c
       JOIN project_categories pc ON c.id = pc.category_id
       WHERE pc.project_id = ?`,
      [project.id]
    );

    const media = all(
      `SELECT m.id, m.storage_path, m.file_name, m.alt_text, pm.media_role, pm.sort_order
       FROM media_assets m
       JOIN project_media pm ON m.id = pm.media_id
       WHERE pm.project_id = ?
       ORDER BY pm.sort_order ASC`,
      [project.id]
    );

    const deliverables = all(
      `SELECT d.id, d.name, d.description, d.category, pd.custom_description
       FROM deliverables d
       JOIN project_deliverables pd ON d.id = pd.deliverable_id
       WHERE pd.project_id = ?
       ORDER BY pd.sort_order ASC`,
      [project.id]
    );

    // Next & Previous projects
    const nextProject = get(
      'SELECT slug, cover_image FROM projects WHERE is_published = 1 AND sort_order > ? ORDER BY sort_order ASC LIMIT 1',
      [project.sort_order]
    );
    const prevProject = get(
      'SELECT slug, cover_image FROM projects WHERE is_published = 1 AND sort_order < ? ORDER BY sort_order DESC LIMIT 1',
      [project.sort_order]
    );

    return res.json({
      success: true,
      data: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        tagline: project.tagline,
        projectType: project.project_type,
        status: project.status,
        locationType: project.location_type,
        location: project.location,
        year: project.year,
        landArea: project.land_area,
        buildingArea: project.building_area,
        isFeatured: Boolean(project.is_featured),
        coverImage: project.cover_image,
        description: project.description,
        designConcept: project.design_concept,
        seoTitle: project.seo_title,
        seoDescription: project.seo_description,
        categories,
        media,
        deliverables,
        navigation: {
          next: nextProject ? nextProject.slug : null,
          prev: prevProject ? prevProject.slug : null
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Published Services
 */
function getServices(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';

    const rows = all(
      `SELECT s.*,
              t.title, t.slug, t.description, t.scope_of_work
       FROM services s
       LEFT JOIN service_translations t ON s.id = t.service_id AND t.locale = ?
       WHERE s.is_published = 1 AND s.is_active = 1
       ORDER BY s.sort_order ASC`,
      [locale]
    );

    const services = rows.map(s => {
      let scopeList = [];
      if (s.scope_of_work) {
        scopeList = s.scope_of_work.split(';').map(item => item.trim()).filter(Boolean);
      }

      return {
        id: s.service_key,
        serviceKey: s.service_key,
        title: s.title,
        slug: s.slug,
        description: s.description,
        scopeOfWork: scopeList,
        coverImage: s.cover_image,
        sortOrder: s.sort_order
      };
    });

    return res.json({
      success: true,
      total: services.length,
      data: services
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Portfolio Categories
 */
function getCategories(req, res) {
  try {
    const categories = all(
      'SELECT id, name, slug, category_type, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Deliverables Catalog
 */
function getDeliverables(req, res) {
  try {
    const deliverables = all(
      'SELECT id, name, description, category, sort_order FROM deliverables WHERE is_active = 1 ORDER BY category ASC, sort_order ASC'
    );
    return res.json({ success: true, data: deliverables });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Published Journal Posts
 */
function getJournal(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';
    const posts = all(
      `SELECT p.*, t.title, t.slug, t.excerpt, t.content, t.seo_title, t.seo_description, c.name as category_name
       FROM journal_posts p
       LEFT JOIN journal_translations t ON p.id = t.post_id AND t.locale = ?
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.publication_status = 'published'
       ORDER BY p.published_at DESC`,
      [locale]
    );

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Dynamic Page Builder Content (PRD Section 8 & 10.3)
 */
function getPageBySlug(req, res) {
  try {
    const locale = req.query.locale === 'en' ? 'en' : 'id';
    const { slug } = req.params;

    const page = get(
      `SELECT p.*, t.title, t.slug, t.content_json, t.seo_title, t.seo_description, t.publication_status
       FROM pages p
       JOIN page_translations t ON p.id = t.page_id
       WHERE (p.page_key = ? OR t.slug = ?) AND t.locale = ? AND t.publication_status = 'published'`,
      [slug, slug, locale]
    );

    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    let parsedContent = null;
    try {
      parsedContent = JSON.parse(page.content_json);
    } catch (e) {
      parsedContent = page.content_json;
    }

    return res.json({
      success: true,
      data: {
        pageKey: page.page_key,
        title: page.title,
        slug: page.slug,
        seoTitle: page.seo_title,
        seoDescription: page.seo_description,
        content: parsedContent
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Submit Project Inquiry (PRD Section 6)
 */
function submitInquiry(req, res) {
  try {
    const { clientName, whatsapp, email, location, serviceKey, landArea, buildingArea, timeline, description } = req.body;

    if (!clientName || !whatsapp || !location || !serviceKey) {
      return res.status(400).json({
        success: false,
        error: 'Nama lengkap, nomor WhatsApp, lokasi tapak, dan pilihan layanan wajib diisi.'
      });
    }

    const inqId = `inq_${crypto.randomBytes(8).toString('hex')}`;
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const referenceCode = `SKL-${dateCode}-${randCode}`;

    // Format WhatsApp message according to PRD Section 6.3
    const waText = [
      `Halo SEKALARUPA STUDIO,`,
      `Saya tertarik berkonsultasi mengenai perancangan proyek arsitektur/desain.`,
      ``,
      `*Detail Konsultasi Proyek:*`,
      `• *Kode Ref:* ${referenceCode}`,
      `• *Nama Klien:* ${clientName.trim()}`,
      `• *Nomor Kontak:* ${whatsapp.trim()}`,
      `• *Lokasi Proyek:* ${location.trim()}`,
      `• *Layanan:* ${serviceKey}`,
      landArea ? `• *Estimasi Luas Lahan:* ${landArea.trim()}` : null,
      buildingArea ? `• *Estimasi Luas Bangunan:* ${buildingArea.trim()}` : null,
      timeline ? `• *Target Waktu / Tahun:* ${timeline.trim()}` : null,
      description ? `• *Catatan / Deskripsi Ruang:* ${description.trim()}` : null,
      ``,
      `Mohon informasi lebih lanjut mengenai proses konsultasi, tahapan desain, dan jadwal diskusi dengan tim SEKALARUPA. Terima kasih.`
    ]
      .filter(line => line !== null)
      .join('\n');

    // Get studio whatsapp number from settings
    const waSetting = get("SELECT setting_value FROM site_settings WHERE setting_key = 'whatsapp_number_only'");
    const studioWaNumber = waSetting ? waSetting.setting_value : '6287857523074';
    const waUrl = `https://wa.me/${studioWaNumber}?text=${encodeURIComponent(waText)}`;

    run(
      `INSERT INTO project_inquiries
       (id, reference_code, client_name, whatsapp, email, location, service_key, land_area, building_area, timeline, description, wa_message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        inqId,
        referenceCode,
        clientName.trim(),
        whatsapp.trim(),
        email ? email.trim() : '',
        location.trim(),
        serviceKey,
        landArea ? landArea.trim() : '',
        buildingArea ? buildingArea.trim() : '',
        timeline ? timeline.trim() : '',
        description ? description.trim() : '',
        waText
      ]
    );

    return res.json({
      success: true,
      message: 'Inquiry successfully registered.',
      referenceCode,
      waUrl,
      waMessage: waText
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSiteInfo,
  getProjects,
  getProjectBySlug,
  getServices,
  getCategories,
  getDeliverables,
  getJournal,
  getPageBySlug,
  submitInquiry
};
