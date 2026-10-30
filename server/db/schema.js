/**
 * SEKALARUPA STUDIO - Database Schema Definitions
 * PRD Reference: Section 10 (Database Architecture)
 * Supports SQLite (native node:sqlite) and provides SQL DDL statements.
 */

const SQL_SCHEMA = `
-- 1. Admin Users & Profiles
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'administrator',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- 2. Website Pages & Translations
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  page_key TEXT UNIQUE NOT NULL,
  page_type TEXT DEFAULT 'standard',
  is_system_page INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_translations (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_json TEXT,
  seo_title TEXT,
  seo_description TEXT,
  publication_status TEXT DEFAULT 'draft',
  published_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, locale),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  content_snapshot TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_type TEXT DEFAULT 'portfolio',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Media Folders & Media Assets
CREATE TABLE IF NOT EXISTS media_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_folder_id) REFERENCES media_folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  alt_text TEXT DEFAULT '',
  folder_id TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL
);

-- 5. Projects & Translations
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  project_type TEXT DEFAULT 'Architecture',
  status TEXT DEFAULT 'Concept',
  location_type TEXT DEFAULT 'Highland / Rural',
  location TEXT,
  year TEXT,
  land_area TEXT,
  building_area TEXT,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  cover_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_translations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  design_concept TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(project_id, locale),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  UNIQUE(project_id, category_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_media (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  media_role TEXT DEFAULT 'gallery',
  sort_order INTEGER DEFAULT 0,
  alt_text TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE CASCADE
);

-- 6. Services & Translations
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  service_key TEXT UNIQUE NOT NULL,
  cover_media_id TEXT,
  cover_image TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_translations (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  UNIQUE(service_id, locale),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 7. Deliverables & Project Deliverables
CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Design Development',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_deliverables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  deliverable_id TEXT NOT NULL,
  custom_description TEXT,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(project_id, deliverable_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
);

-- 8. Journal Posts & Translations
CREATE TABLE IF NOT EXISTS journal_posts (
  id TEXT PRIMARY KEY,
  cover_media_id TEXT,
  cover_image TEXT,
  category_id TEXT,
  author_id TEXT,
  publication_status TEXT DEFAULT 'draft',
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES admin_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS journal_translations (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(post_id, locale),
  FOREIGN KEY (post_id) REFERENCES journal_posts(id) ON DELETE CASCADE
);

-- 9. Navigation Menus & Navigation Items
CREATE TABLE IF NOT EXISTS navigation_menus (
  id TEXT PRIMARY KEY,
  menu_key TEXT UNIQUE NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL,
  parent_id TEXT,
  label_translations TEXT NOT NULL,
  url TEXT NOT NULL,
  target TEXT DEFAULT '_self',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE SET NULL
);

-- 10. Site Settings & Theme Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theme_settings (
  id TEXT PRIMARY KEY,
  theme_key TEXT UNIQUE NOT NULL,
  theme_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Project Inquiries (Section 6)
CREATE TABLE IF NOT EXISTS project_inquiries (
  id TEXT PRIMARY KEY,
  reference_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  service_key TEXT NOT NULL,
  land_area TEXT,
  building_area TEXT,
  timeline TEXT,
  description TEXT,
  wa_message TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(is_published, is_featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_project_translations_locale ON project_translations(project_id, locale);
CREATE INDEX IF NOT EXISTS idx_pages_key ON pages(page_key);
CREATE INDEX IF NOT EXISTS idx_page_translations_slug ON page_translations(locale, slug);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_ref ON project_inquiries(reference_code);
`;

module.exports = {
  SQL_SCHEMA
};
