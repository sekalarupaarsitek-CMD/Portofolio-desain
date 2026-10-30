-- ============================================================================
-- SEKALARUPA STUDIO - Supabase PostgreSQL Initial Migration
-- PRD Reference: Section 10 (Database Architecture), Section 12 (Security)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Website Pages & Translations
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  page_type TEXT DEFAULT 'standard',
  is_system_page BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.page_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_json JSONB DEFAULT '{}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  publication_status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(page_id, locale)
);

CREATE TABLE IF NOT EXISTS public.page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  content_snapshot JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_type TEXT DEFAULT 'portfolio',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Media Folders & Assets
CREATE TABLE IF NOT EXISTS public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  alt_text TEXT DEFAULT '',
  folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Projects & Translations
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  project_type TEXT DEFAULT 'Architecture',
  status TEXT DEFAULT 'Concept',
  location_type TEXT DEFAULT 'Highland / Rural',
  location TEXT,
  year TEXT,
  land_area TEXT,
  building_area TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  design_concept TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(project_id, locale)
);

CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(project_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  media_role TEXT DEFAULT 'gallery',
  sort_order INTEGER DEFAULT 0,
  alt_text TEXT
);

-- 6. Services & Translations
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT UNIQUE NOT NULL,
  cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  cover_image TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  UNIQUE(service_id, locale)
);

-- 7. Deliverables & Project Deliverables
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Design Development',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  custom_description TEXT,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(project_id, deliverable_id)
);

-- 8. Journal Posts & Translations
CREATE TABLE IF NOT EXISTS public.journal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  cover_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  publication_status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.journal_posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(post_id, locale)
);

-- 9. Navigation Menus & Items
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key TEXT UNIQUE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE SET NULL,
  label_translations JSONB NOT NULL,
  url TEXT NOT NULL,
  target TEXT DEFAULT '_self',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 10. Site Settings & Theme Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key TEXT UNIQUE NOT NULL,
  theme_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Admin Activity Logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Project Inquiries
CREATE TABLE IF NOT EXISTS public.project_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (PRD Section 12)
-- ============================================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_inquiries ENABLE ROW LEVEL SECURITY;

-- Public can read published projects, services, categories, settings, navigation, journal
CREATE POLICY "Public can view published projects" ON public.projects FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view project translations" ON public.project_translations FOR SELECT USING (true);
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view project categories" ON public.project_categories FOR SELECT USING (true);
CREATE POLICY "Public can view published services" ON public.services FOR SELECT USING (is_published = true AND is_active = true);
CREATE POLICY "Public can view service translations" ON public.service_translations FOR SELECT USING (true);
CREATE POLICY "Public can view active deliverables" ON public.deliverables FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view project deliverables" ON public.project_deliverables FOR SELECT USING (true);
CREATE POLICY "Public can view media assets" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Public can view published journal" ON public.journal_posts FOR SELECT USING (publication_status = 'published');
CREATE POLICY "Public can view journal translations" ON public.journal_translations FOR SELECT USING (true);
CREATE POLICY "Public can view navigation items" ON public.navigation_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view navigation menus" ON public.navigation_menus FOR SELECT USING (true);
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public can view theme settings" ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY "Public can view published page translations" ON public.page_translations FOR SELECT USING (publication_status = 'published');
CREATE POLICY "Public can submit inquiries" ON public.project_inquiries FOR INSERT WITH CHECK (true);

-- Authenticated admins have full CRUD on everything
CREATE POLICY "Admin full access admin_profiles" ON public.admin_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access pages" ON public.pages FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access page_translations" ON public.page_translations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access page_versions" ON public.page_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access media_folders" ON public.media_folders FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access media_assets" ON public.media_assets FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access projects" ON public.projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access project_translations" ON public.project_translations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access project_categories" ON public.project_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access project_media" ON public.project_media FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access services" ON public.services FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access service_translations" ON public.service_translations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access deliverables" ON public.deliverables FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access project_deliverables" ON public.project_deliverables FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access journal_posts" ON public.journal_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access journal_translations" ON public.journal_translations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access navigation_menus" ON public.navigation_menus FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access navigation_items" ON public.navigation_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access site_settings" ON public.site_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access theme_settings" ON public.theme_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access admin_activity_logs" ON public.admin_activity_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access project_inquiries" ON public.project_inquiries FOR ALL TO authenticated USING (true);
