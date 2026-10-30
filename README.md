# SEKALARUPA STUDIO - BACKEND & CMS ARCHITECTURE
### Architecture Portfolio Website, Content Management System & Hybrid Visual Page Builder
**PRD Version:** 1.0 | **Platform:** Node.js, Express, SQLite (Local) & Supabase PostgreSQL (Cloud Production)

---

## 1. Arsitektur Sistem (System Architecture)

Website dan sistem backend SEKALARUPA STUDIO dirancang sesuai spesifikasi dokumen [prd.md](file:///e:/WEBSITE/PORTOFOLIO/prd.md) dengan arsitektur 3 lapis:

1. **Public Website Frontend** (`/`):
   - Arsitektur editorial minimalis bertema tropis hangat (*warm minimal* `#F5F3EE`) & mode gelap (*tactile dark* `#1E2221`).
   - Dynamic data synchronization dari database API (`/api/public/...`) dengan fallback offline otomatis ke `js/data.js`.
   - Bilingual language switching (Bahasa Indonesia & English).
   - Form konsultasi proyek terintegrasi database & WhatsApp link generator.

2. **Admin Dashboard & Visual Page Builder UI** (`/admin/`):
   - Single Page Application (SPA) mandiri dengan autentikasi berbasis JWT token.
   - **Portfolio Manager:** CRUD proyek, upload galeri, duplikasi proyek, toggle status publikasi/draft, penentuan proyek unggulan (*featured*).
   - **Hybrid Visual Page Builder (Canva-Style):** WYSIWYG live layout editor dengan grid responsif (Desktop, Tablet, Mobile), manajemen layer, palette elemen (Hero, Teks, Project Grid, Services Grid), autosave, versioning snapshot, dan publish langsung ke website publik.
   - **Services & Deliverables Manager:** Pengelolaan 6 layanan studio dan katalog output proyek per kategori.
   - **Media Assets Library:** Pengelolaan aset visual dengan validasi tipe file (JPG, PNG, WebP, SVG, MP4), folder organisasi, dan pencegahan penghapusan file yang sedang digunakan (*usage safety check*).
   - **Journal Manager:** Publikasi artikel wawasan arsitektur dan filosofi Sunda (*Tatar Rupa Mawa Bagja*).
   - **Inquiries Inbox:** Pelacakan formulir konsultasi klien dengan tombol kontak WhatsApp langsung.
   - **Theme & Design Tokens:** Pengaturan warna, font, dan radius tanpa mengubah CSS.
   - **Backup & Disaster Recovery:** Ekspor & impor database snapshot JSON satu klik.

3. **Backend API & Database Layer** (`server/`):
   - RESTful API engine menggunakan Express.js 5.
   - Skema database 22 tabel relasional sesuai PRD Bab 10.
   - Didukung secara lokal melalui engine native `node:sqlite` (zero-dependency, WAL mode, foreign key enforcement) dan skema cloud PostgreSQL melalui Supabase dengan Row Level Security (RLS) policies.

---

## 2. Struktur Direktori Proyek

```
WEBSITE/PORTOFOLIO/
├── assets/
│   └── images/                     # Aset foto arsitektur & render resolusi tinggi
├── admin/                          # Admin Dashboard & Canva-Style Page Builder SPA
│   ├── css/
│   │   └── admin.css               # Architectural styling untuk admin dashboard
│   ├── js/
│   │   ├── admin.js                # SPA Controller, Auth, & CRUD handlers
│   │   └── builder.js              # Interactive visual page builder engine
│   └── index.html                  # Admin portal entrypoint
├── css/
│   └── style.css                   # Stylesheet website publik
├── database/
│   └── sekalarupa.db               # SQLite database file (WAL mode)
├── js/
│   ├── data.js                     # Kamus data awal & terjemahan bilingual
│   └── main.js                     # Interactive controller website publik
├── server/
│   ├── config/                     # Konfigurasi server & JWT
│   ├── controllers/                # 11 REST controllers untuk seluruh modul
│   │   ├── adminBackupController.js
│   │   ├── adminDashboardController.js
│   │   ├── adminDeliverablesController.js
│   │   ├── adminInquiriesController.js
│   │   ├── adminJournalController.js
│   │   ├── adminMediaController.js
│   │   ├── adminNavigationController.js
│   │   ├── adminPageBuilderController.js
│   │   ├── adminProjectsController.js
│   │   ├── adminServicesController.js
│   │   ├── adminSettingsController.js
│   │   ├── authController.js
│   │   └── publicController.js
│   ├── db/
│   │   ├── index.js                # Koneksi database & query helper
│   │   ├── schema.js               # SQL DDL 22 tabel relasional
│   │   └── seed.js                 # Seeder data studio dari PRD
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification & role authorization
│   │   └── upload.js               # Multer upload handler & type safety
│   ├── routes/
│   │   ├── adminRoutes.js          # Protected admin endpoints
│   │   ├── authRoutes.js           # Setup & login endpoints
│   │   └── publicRoutes.js         # Public read-only endpoints
│   ├── services/
│   │   └── activityLog.js          # Audit trail logger (admin_activity_logs)
│   └── index.js                    # Express app server entrypoint
├── supabase/
│   └── migrations/
│       └── 20261030000000_init_sekalarupa.sql  # Supabase PostgreSQL DDL + RLS
├── uploads/                        # File media yang diunggah melalui Media Library
├── .env.example                    # Template variabel lingkungan
├── .env                            # Variabel lingkungan aktif
├── index.html                      # Website publik SEKALARUPA STUDIO
├── package.json                    # Dependencies & npm scripts
└── prd.md                          # Dokumen Spesifikasi Produk (PRD v1.0)
```

---

## 3. Database Schema (22 Core Relational Tables)

Tabel-tabel di bawah ini diimplementasikan secara identik pada database lokal SQLite dan script migrasi PostgreSQL/Supabase:

| # | Nama Tabel | Deskripsi & Relasi |
|---|---|---|
| 1 | `admin_users` | Autentikasi administrator (email, bcrypt password_hash, role) |
| 2 | `admin_profiles` | Profil lengkap admin (full_name, phone, avatar_url, user_id FK) |
| 3 | `pages` | Metadata halaman website (page_key, page_type, is_system_page) |
| 4 | `page_translations` | Konten halaman per bahasa (locale: id/en, content_json, status) |
| 5 | `page_versions` | Snapshot riwayat revisi Visual Page Builder untuk rollback |
| 6 | `projects` | Data entitas proyek (slug, year, land_area, building_area, is_featured) |
| 7 | `project_translations` | Judul, tagline, deskripsi, konsep desain, SEO per bahasa |
| 8 | `categories` | Kategori portofolio (Architecture, Interior, Exterior, dsb.) |
| 9 | `project_categories` | Tabel pivot relasi many-to-many proyek ke kategori |
| 10 | `media_assets` | Metadata file gambar/video (dimensions, size, mime, alt_text) |
| 11 | `media_folders` | Manajemen folder penyimpanan aset visual |
| 12 | `project_media` | Relasi galeri foto & cover image pada setiap proyek |
| 13 | `services` | 6 kategori layanan studio (Architecture, Interior, 3D, dsb.) |
| 14 | `service_translations` | Judul layanan, deskripsi narasi, dan rincian scope of work |
| 15 | `deliverables` | Katalog standar dokumen output proyek |
| 16 | `project_deliverables` | Deliverables yang berlaku khusus untuk proyek tertentu |
| 17 | `journal_posts` | Artikel publikasi wawasan studio & filosofi desain |
| 18 | `journal_translations` | Konten artikel, kutipan excerpt, slug, dan SEO per bahasa |
| 19 | `navigation_menus` | Identitas menu navigasi website (`main-nav`) |
| 20 | `navigation_items` | Daftar tautan navigasi, sort order, dan label bilingual |
| 21 | `site_settings` | Informasi global studio (nama, WhatsApp, Instagram, email) |
| 22 | `theme_settings` | Design tokens visual (warna latar, warna aksen, font serif/sans) |
| 23 | `admin_activity_logs` | Catatan audit trail setiap aksi admin (create, update, delete, publish) |
| 24 | `project_inquiries` | Arsip data formulir konsultasi klien dari website publik |

---

## 4. Cara Menjalankan Server (Local Development)

### Prasyarat
- Node.js versi 20+ atau 24+ (Node 24 memiliki native SQLite engine).

### Langkah Menjalankan
1. **Instalasi Dependencies:**
   ```bash
   npm install
   ```

2. **Inisialisasi & Seeding Database (Opsional - otomatis dijalankan saat start):**
   ```bash
   npm run seed
   ```

3. **Menjalankan Server:**
   ```bash
   npm start
   # atau untuk mode auto-reload file watcher:
   npm run dev
   ```

4. **Akses Aplikasi:**
   - **Website Publik:** `http://localhost:5000/`
   - **Admin CMS & Builder:** `http://localhost:5000/admin/`
   - **Health Check API:** `http://localhost:5000/api/health`

---

## 5. Panduan Administrator Pertama (First Admin Setup)

Sesuai instruksi PRD Bab 23.6, akun administrator pertama **tidak menggunakan kredensial hardcoded** di source code:
1. Buka `http://localhost:5000/admin/` pada browser Anda.
2. Jika database baru pertama kali digunakan, sistem secara otomatis menampilkan formulir **Setup Administrator Awal**.
3. Masukkan Nama Lengkap, Email, Password (minimal 8 karakter), dan nomor WhatsApp.
4. Klik **Inisialisasi & Buka Dashboard**. Akun superadmin akan disimpan dengan enkripsi password `bcrypt` (10 rounds) dan Anda langsung masuk ke dashboard dengan sesi JWT yang aman.

*(Jika sudah diinisialisasi pada pengujian sebelumnya, akun pengujian default adalah `admin@sekalarupa.com` dengan password `AdminPassword2026!`)*

---

## 6. Daftar Endpoint REST API

### A. Public API (Read-Only & Published Content)
- `GET /api/public/site?locale=id` — Info branding, kontak, WhatsApp, navigasi, dan tema.
- `GET /api/public/projects?locale=id&category=all&featured=1` — Daftar proyek yang dipublikasikan.
- `GET /api/public/projects/:slug?locale=id` — Detail satu proyek beserta galeri dan deliverables.
- `GET /api/public/services?locale=id` — Daftar 6 layanan aktif dengan scope of work.
- `GET /api/public/categories` — Kategori portofolio aktif.
- `GET /api/public/deliverables` — Katalog deliverables.
- `GET /api/public/journal?locale=id` — Artikel jurnal yang telah dipublikasikan.
- `GET /api/public/pages/:slug?locale=id` — Layout JSON untuk Visual Page Builder.
- `POST /api/public/inquiries` — Pengajuan formulir konsultasi klien, menghasilkan kode referensi (`SKL-20261030-xxxx`) dan link WhatsApp otomatis.

### B. Admin API (Protected - Wajib Header `Authorization: Bearer <TOKEN>`)
- `GET /api/admin/dashboard/stats` — Metrik proyek, draft, konsultasi, dan log terkini.
- `GET|POST /api/admin/projects` — List dan tambah proyek baru.
- `GET|PUT|DELETE /api/admin/projects/:id` — Detail, edit, dan hapus proyek.
- `POST /api/admin/projects/:id/duplicate` — Duplikasi proyek menjadi draft.
- `PATCH /api/admin/projects/:id/status` — Quick toggle status publish & featured.
- `GET|POST|PUT|DELETE /api/admin/services` — Manajemen layanan arsitektur.
- `GET|POST|PUT|DELETE /api/admin/deliverables` — Manajemen katalog output.
- `GET|POST /api/admin/media/upload` — Multi-file media upload (JPG, PNG, WebP, SVG, MP4).
- `DELETE /api/admin/media/:id` — Hapus aset media (dilengkapi pencegahan jika file sedang dipakai di proyek/layanan).
- `GET|POST|DELETE /api/admin/media-folders` — Manajemen folder media.
- `GET|POST|PUT|DELETE /api/admin/journal` — Manajemen artikel jurnal.
- `GET|POST|PUT|DELETE /api/admin/navigation/items` — Manajemen menu navigasi.
- `GET|PUT /api/admin/pages/:id/builder` — Load & simpan draft / publish Visual Page Builder.
- `POST /api/admin/pages/:id/versions/:versionId/restore` — Rollback ke versi halaman sebelumnya.
- `GET|PUT /api/admin/settings/site` — Pengaturan kontak, nomor WA, dan SEO.
- `GET|PUT /api/admin/settings/theme` — Pengaturan token warna dan tipografi.
- `GET|PUT|DELETE /api/admin/inquiries` — Manajemen inbox konsultasi klien.
- `GET /api/admin/backup/export` — Unduh cadangan database lengkap dalam format JSON.
- `POST /api/admin/backup/import` — Impor dan pulihkan database dari file JSON.

---

## 7. Deployment ke Supabase & Cloud Hosting

Untuk penerapan ke tahap produksi cloud:
1. Buat project baru pada [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** pada dashboard Supabase.
3. Jalankan script migrasi yang telah disediakan di:
   [supabase/migrations/20261030000000_init_sekalarupa.sql](file:///e:/WEBSITE/PORTOFOLIO/supabase/migrations/20261030000000_init_sekalarupa.sql)
4. Buat Storage Bucket bernama `sekalarupa-media` dengan akses publik untuk media visual.
5. Konfigurasikan file `.env` pada platform hosting Anda (misal Vercel / Railway / Render) dengan variabel:
   ```env
   PORT=5000
   JWT_SECRET=rahasia-kunci-jwt-studio-anda
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   ```
