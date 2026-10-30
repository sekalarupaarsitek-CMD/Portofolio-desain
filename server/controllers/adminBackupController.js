/**
 * SEKALARUPA STUDIO - Backup & Disaster Recovery Controller
 * PRD Reference: Section 17.5 (Backup and Recovery)
 */

const { all, run } = require('../db');
const { logActivity } = require('../services/activityLog');

const BACKUP_TABLES = [
  'pages',
  'page_translations',
  'page_versions',
  'categories',
  'media_folders',
  'media_assets',
  'projects',
  'project_translations',
  'project_categories',
  'project_media',
  'services',
  'service_translations',
  'deliverables',
  'project_deliverables',
  'journal_posts',
  'journal_translations',
  'navigation_menus',
  'navigation_items',
  'site_settings',
  'theme_settings',
  'project_inquiries'
];

function exportDatabase(req, res) {
  try {
    const backupData = {
      app: 'SEKALARUPA STUDIO CMS',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: {}
    };

    for (const table of BACKUP_TABLES) {
      try {
        backupData.tables[table] = all(`SELECT * FROM ${table}`);
      } catch (e) {
        backupData.tables[table] = [];
      }
    }

    logActivity(req.user?.id, 'EXPORT_DATABASE_BACKUP', 'system', 'backup', {
      tablesCount: Object.keys(backupData.tables).length
    });

    res.setHeader('Content-Disposition', `attachment; filename="sekalarupa-backup-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.json(backupData);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function importDatabase(req, res) {
  try {
    const { backup } = req.body;
    if (!backup || !backup.tables) {
      return res.status(400).json({ success: false, error: 'Invalid backup file format.' });
    }

    for (const [table, rows] of Object.entries(backup.tables)) {
      if (!BACKUP_TABLES.includes(table) || !Array.isArray(rows)) continue;

      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col]);

        const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        try {
          run(sql, values);
        } catch (e) {
          console.warn(`[Import Backup Warning] Table ${table}:`, e.message);
        }
      }
    }

    logActivity(req.user?.id, 'IMPORT_DATABASE_BACKUP', 'system', 'backup');

    return res.json({ success: true, message: 'Database imported successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  exportDatabase,
  importDatabase
};
