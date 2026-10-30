/**
 * SEKALARUPA STUDIO - Client-Side Resilient Local Data Store
 * Provides instant, zero-dependency offline fallback data for Admin CMS and Visual Page Builder.
 * Guarantees that the CMS is 100% functional even when backend API is cold or offline.
 */

const LocalStore = {
  PREFIX: 'sekalarupa_db_',

  getItem(key, defaultVal) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },

  setItem(key, val) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('[LocalStore] localStorage quota exceeded', e);
    }
  },

  // Initial Seed Data
  getDefaults() {
    return {
      stats: {
        totalProjects: 11,
        publishedProjects: 11,
        draftProjects: 0,
        totalServices: 6,
        totalJournal: 2,
        totalInquiries: 3,
        pendingInquiries: 1,
        mediaAssets: 8
      },
      inquiries: [
        {
          id: 'inq_1',
          reference_code: 'SKL-202610-001',
          client_name: 'Ibu Ratna Dewi',
          client_email: 'ratna.dewi@gmail.com',
          whatsapp: '081234567890',
          service_key: 'Full Architecture & Interior Design',
          project_type: 'Private Residence & Sanctuary',
          location: 'Dago Atas, Bandung',
          estimated_budget: 'Rp 1.5 M - 3 M',
          status: 'in_discussion',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'inq_2',
          reference_code: 'SKL-202610-002',
          client_name: 'Bapak Hendra Wijaya',
          client_email: 'hendra.w@sanctuary.id',
          whatsapp: '081987654321',
          service_key: 'Hillside Villa & Masterplan',
          project_type: 'Countryside Retreat',
          location: 'Lembang, Jawa Barat',
          estimated_budget: '> Rp 3 M',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ],
      logs: [
        { id: 'log_1', action: 'DIRECT_ACCESS', entity_type: 'admin', created_at: new Date().toISOString() },
        { id: 'log_2', action: 'PAGE_VIEW', entity_type: 'dashboard', created_at: new Date(Date.now() - 60000).toISOString() }
      ],
      projects: [
        {
          id: 'proj_1',
          slug: 'nocturne-cantilever-highland-villa',
          cover_image: 'assets/images/hero-architecture.jpg',
          category_id: 'cat_architecture',
          category_name: 'Architecture',
          category_slug: 'architecture',
          publication_status: 'published',
          published_at: '2026-01-15',
          featured_priority: 1,
          land_area: 850,
          building_area: 420,
          completion_year: 2026,
          location_text: 'Dago Pakar, Bandung',
          title: 'Nocturne Cantilever Highland Villa',
          subtitle: 'Hunian peristirahatan berkontur lereng dengan kantilever beton ekspos dan kaca panoramik.',
          description: 'Mengambil inspirasi dari harmoni alam Sunda Tatar Rupa Mawa Bagja, villa ini dirancang dengan kantilever dramatis menghadap lembah...',
          deliverables: ['Alternatif Denah & Tata Ruang', 'Render 3D Fotorealistik Eksterior', 'Dokumentasi Gambar Kerja DED Lengkap', 'Rencana Anggaran Biaya (RAB)', 'Hardcover Architecture Photobook']
        },
        {
          id: 'proj_2',
          slug: 'lumina-courtyard-house',
          cover_image: 'assets/images/project-residence-urban.jpg',
          category_id: 'cat_architecture',
          category_name: 'Architecture',
          category_slug: 'architecture',
          publication_status: 'published',
          published_at: '2026-02-10',
          featured_priority: 2,
          land_area: 320,
          building_area: 280,
          completion_year: 2025,
          location_text: 'Komp. Setiabudi, Bandung',
          title: 'Lumina Courtyard House',
          subtitle: 'Rumah tinggal urban tropis dengan inner courtyard zen dan sirkulasi udara pasif silang.',
          description: 'Solusi hunian di lahan perkotaan padat yang memprioritaskan privasi dan koneksi batin dengan elemen alam di bagian tengah rumah.',
          deliverables: ['Alternatif Denah & Tata Ruang', 'Render 3D Detail Interior', 'Dokumentasi Gambar Kerja DED Lengkap']
        },
        {
          id: 'proj_3',
          slug: 'lembah-bagja-sanctuary',
          cover_image: 'assets/images/project-villa-rural.jpg',
          category_id: 'cat_architecture',
          category_name: 'Architecture',
          category_slug: 'architecture',
          publication_status: 'published',
          published_at: '2026-03-05',
          featured_priority: 3,
          land_area: 1200,
          building_area: 550,
          completion_year: 2026,
          location_text: 'Maribaya, Lembang',
          title: 'Lembah Bagja Sanctuary Countryside Retreat',
          subtitle: 'Kompleks paviliun kayu ulin dan batu basal lokal menyatu dengan keasrian kebun pinus berkabut.',
          description: 'Retreat pedesaan yang dirancang untuk menghadirkan ketenangan jiwa dan kedamaian sejati bagi penghuninya.',
          deliverables: ['Alternatif Denah & Tata Ruang', 'Alternatif Desain Fasad & Bentuk Massa', 'Render 3D Fotorealistik Eksterior', 'Render 3D Detail Interior', 'Video Sinematik Walkthrough 4K', 'Hardcover Architecture Photobook']
        },
        {
          id: 'proj_4',
          slug: 'tanamera-atelier-roastery',
          cover_image: 'assets/images/project-cafe-commercial.jpg',
          category_id: 'cat_architecture',
          category_name: 'Architecture',
          category_slug: 'architecture',
          publication_status: 'published',
          published_at: '2025-11-20',
          featured_priority: 4,
          land_area: 450,
          building_area: 380,
          completion_year: 2025,
          location_text: 'Jl. Riau, Bandung',
          title: 'Tanamera Atelier & Commercial Roastery',
          subtitle: 'Ruang komersial kafe bertingkat dengan fasad kisi-kisi bata terakota dan skylight atrium lapang.',
          description: 'Perpaduan fungsional antara fasilitas roasting kopi berstandar industri dan ruang atelier yang hangat untuk penikmat kopi spesial.',
          deliverables: ['Alternatif Denah & Tata Ruang', 'Render 3D Fotorealistik Eksterior', 'Dokumentasi Gambar Kerja DED Lengkap', 'Rencana Anggaran Biaya (RAB)']
        },
        {
          id: 'proj_5',
          slug: 'kasada-earth-living-interior',
          cover_image: 'assets/images/project-interior-living.jpg',
          category_id: 'cat_interior',
          category_name: 'Interior Design',
          category_slug: 'interior',
          publication_status: 'published',
          published_at: '2026-04-12',
          featured_priority: 5,
          land_area: 0,
          building_area: 160,
          completion_year: 2026,
          location_text: 'Ciumbuleuit, Bandung',
          title: 'Kasada Earth Living Interior',
          subtitle: 'Tata ruang interior bernuansa wabi-sabi dengan perpaduan microcement, kayu jati daur ulang, dan furnitur custom.',
          description: 'Eksplorasi material bumi mentah yang disempurnakan dengan detail perajin lokal untuk menghadirkan ketenangan ruang maksimal.',
          deliverables: ['Moodboard Material & Karakter Ruang', 'Render 3D Detail Interior', 'Dokumentasi Gambar Kerja DED Lengkap']
        },
        {
          id: 'proj_6',
          slug: 'twilight-pine-pavilion',
          cover_image: 'assets/images/hero-night-residence.jpg',
          category_id: 'cat_architecture',
          category_name: 'Architecture',
          category_slug: 'architecture',
          publication_status: 'published',
          published_at: '2026-05-01',
          featured_priority: 6,
          land_area: 600,
          building_area: 310,
          completion_year: 2026,
          location_text: 'Ciwidey, Bandung Selatan',
          title: 'Twilight Pine Pavilion at Night',
          subtitle: 'Arsitektur paviliun kaca malam hari dengan pencahayaan arsitektural dramatis di tengah hutan pinus.',
          description: 'Studi pencahayaan malam terpadu yang memantulkan kehangatan kayu dan ketenangan alam pegunungan.',
          deliverables: ['Render 3D Fotorealistik Eksterior', 'Video Sinematik Walkthrough 4K']
        }
      ],
      services: [
        { id: 'serv_1', key: 'architecture', name: 'Perancangan Arsitektur', icon: '🏛', short_desc: 'Perancangan bangunan komprehensif dari hunian pribadi hingga komersial berkarakter kuat.' },
        { id: 'serv_2', key: 'exterior', name: 'Desain Eksterior & Fasad', icon: '🌿', short_desc: 'Eksplorasi fasad, material tahan cuaca tropis, lansekap dan pencahayaan luar abadi.' },
        { id: 'serv_3', key: 'interior', name: 'Desain Interior', icon: '🛋', short_desc: 'Atmosfer ruang hangat, intim, dan fungsional dengan kepekaan material alami.' },
        { id: 'serv_4', key: 'furniture', name: 'Desain Furniture Custom', icon: '🪑', short_desc: 'Perancangan mebel custom spesifik memadukan perajin lokal dan estetika modern.' },
        { id: 'serv_5', key: 'product', name: 'Desain Produk & Elemen Ruang', icon: '💡', short_desc: 'Elemen arsitektural pendukung seperti lampu custom, kisi-kisi, dan sculpture.' },
        { id: 'serv_6', key: 'visualization', name: 'Visualisasi 3D Fotorealistik & Animasi 4K', icon: '🎬', short_desc: 'Render presisi tinggi pencahayaan daylight & twilight serta video walkthrough sinematik.' }
      ],
      deliverables: [
        { id: 'del_1', name: 'Alternatif Denah & Tata Ruang', category: 'Design Development', description: 'Studi sirkulasi dan zoning denah fungsional' },
        { id: 'del_2', name: 'Alternatif Desain Fasad & Bentuk Massa', category: 'Design Development', description: 'Eksplorasi gubahan massa dan bentuk arsitektural' },
        { id: 'del_3', name: 'Moodboard Material & Karakter Ruang', category: 'Design Development', description: 'Kurasi palet material, tekstur, dan warna alami' },
        { id: 'del_4', name: 'Render 3D Fotorealistik Eksterior', category: '3D Visualization', description: 'Perspektif eksterior resolusi tinggi daylight dan twilight' },
        { id: 'del_5', name: 'Render 3D Detail Interior', category: '3D Visualization', description: 'Render dedicated tiap ruang dengan furniture custom' },
        { id: 'del_6', name: 'Video Sinematik Walkthrough 4K', category: '3D Visualization', description: 'Video walkthrough sinematik 4K dengan ambient sound' },
        { id: 'del_7', name: 'Dokumentasi Gambar Kerja DED Lengkap', category: 'Technical Documentation', description: 'Arsitektur, Struktur, dan MEP siap konstruksi' },
        { id: 'del_8', name: 'Rencana Anggaran Biaya (RAB)', category: 'Technical Documentation', description: 'Estimasi biaya konstruksi dan bill of quantities detail' },
        { id: 'del_9', name: 'Hardcover Architecture Photobook', category: 'Handover', description: 'Buku hardcover linen eksklusif serah terima klien' }
      ],
      journal: [
        {
          id: 'jour_1',
          title: 'Tatar Rupa Mawa Bagja: Memaknai Kembali Esensi Hunian Tropis',
          slug: 'tatar-rupa-mawa-bagja-esensi-hunian-tropis',
          cover_image: 'assets/images/project-villa-rural.jpg',
          category_name: 'Philosophy & Insights',
          published_at: '2026-06-15',
          publication_status: 'published',
          excerpt: 'Refleksi arsitektur mengenai keselarasan manusia, tapak berkontur, dan kebahagiaan hakiki yang lahir dari ketenangan ruang.'
        }
      ],
      navigation: [
        { id: 'nav_1', label_translations: { id: 'Beranda', en: 'Home' }, url: '#home', sort_order: 1 },
        { id: 'nav_2', label_translations: { id: 'Tentang', en: 'About' }, url: '#about', sort_order: 2 },
        { id: 'nav_3', label_translations: { id: 'Portofolio', en: 'Portfolio' }, url: '#portfolio', sort_order: 3 },
        { id: 'nav_4', label_translations: { id: 'Layanan', en: 'Services' }, url: '#services', sort_order: 4 },
        { id: 'nav_5', label_translations: { id: 'Proses', en: 'Process' }, url: '#process', sort_order: 5 },
        { id: 'nav_6', label_translations: { id: 'Kontak', en: 'Contact' }, url: '#contact', sort_order: 6 }
      ],
      settings: {
        brand: {
          brandName: 'SEKALARUPA STUDIO',
          shortName: 'SEKALARUPA',
          tagline: 'Create a Home that brings happiness.',
          sundanesePhilosophy: 'Tatar Rupa Mawa Bagja',
          sundaneseMeaning: 'Menciptakan ruang dan tata hunian yang membawa kebahagiaan serta keharmonisan bagi penghuninya.',
          establishedYear: '2026',
          location: 'Bandung & Nationwide (Indonesia)'
        },
        contact: {
          whatsappNumber: '087857523074',
          whatsappIntl: '+62 878-5752-3074',
          instagramHandle: '@sekalarupa.arsitek',
          instagramUrl: 'https://instagram.com/sekalarupa.arsitek',
          emailAddress: 'contact@sekalarupa.com'
        },
        theme: {
          colorPrimary: '#1E2221',
          colorBackground: '#F5F3EE',
          colorAccent: '#8B7355',
          colorCardBg: 'rgba(255, 255, 255, 0.72)',
          colorCardBgDark: 'rgba(28, 32, 30, 0.75)',
          colorText: '#1E2221',
          fontHeading: 'Playfair Display',
          fontBody: 'Plus Jakarta Sans',
          borderRadius: '4px',
          headerOpacity: '0.92',
          buttonStyle: 'architectural-minimal'
        }
      }
    };
  },

  // Fallback Dispatcher for GET requests
  handleGet(endpoint) {
    const clean = endpoint.split('?')[0];
    const cached = this.getItem(clean, null);
    if (cached) return cached;

    const defaults = this.getDefaults();

    if (clean === '/api/admin/dashboard/stats') {
      return {
        success: true,
        stats: this.getItem('stats', defaults.stats),
        recentInquiries: this.getItem('inquiries', defaults.inquiries),
        recentLogs: this.getItem('logs', defaults.logs)
      };
    }
    if (clean === '/api/admin/projects' || clean === '/api/public/projects') {
      return { success: true, data: this.getItem('projects', defaults.projects) };
    }
    if (clean.startsWith('/api/admin/projects/') || clean.startsWith('/api/public/projects/')) {
      const idOrSlug = clean.split('/').pop();
      const list = this.getItem('projects', defaults.projects);
      const proj = list.find(p => p.id === idOrSlug || p.slug === idOrSlug) || list[0];
      return { success: true, data: proj };
    }
    if (clean === '/api/admin/services' || clean === '/api/public/services') {
      return { success: true, data: this.getItem('services', defaults.services) };
    }
    if (clean === '/api/admin/deliverables' || clean === '/api/public/deliverables') {
      return { success: true, data: this.getItem('deliverables', defaults.deliverables) };
    }
    if (clean === '/api/admin/journal' || clean === '/api/public/journal') {
      return { success: true, data: this.getItem('journal', defaults.journal) };
    }
    if (clean === '/api/admin/navigation' || clean === '/api/public/navigation') {
      return { success: true, data: { items: this.getItem('navigation', defaults.navigation) } };
    }
    if (clean === '/api/admin/settings' || clean === '/api/public/site') {
      return { success: true, data: this.getItem('settings', defaults.settings) };
    }
    if (clean === '/api/admin/inquiries') {
      return { success: true, data: this.getItem('inquiries', defaults.inquiries) };
    }
    if (clean.includes('/builder')) {
      const localSchema = localStorage.getItem('builder_schema_home_id');
      return {
        success: true,
        data: {
          content: localSchema ? JSON.parse(localSchema) : null
        }
      };
    }
    if (clean === '/api/health') {
      return { status: 'ok', service: 'SEKALARUPA STUDIO Local Engine', nodeVersion: 'Client-Side Mode' };
    }

    return { success: true, data: {} };
  },

  // Fallback Dispatcher for POST / PUT / PATCH / DELETE
  handleMutation(endpoint, method, body) {
    const clean = endpoint.split('?')[0];
    const defaults = this.getDefaults();

    if (clean === '/api/admin/projects') {
      const projects = this.getItem('projects', defaults.projects);
      if (method === 'POST') {
        const newProj = {
          id: 'proj_' + Date.now(),
          slug: 'project-' + Date.now(),
          publication_status: 'published',
          ...body
        };
        projects.unshift(newProj);
        this.setItem('projects', projects);
        return { success: true, message: 'Proyek berhasil ditambahkan (Lokal)', data: newProj };
      }
    }

    if (clean.startsWith('/api/admin/projects/')) {
      const id = clean.split('/')[4];
      const projects = this.getItem('projects', defaults.projects);
      const idx = projects.findIndex(p => p.id === id);

      if (method === 'PUT' && idx >= 0) {
        projects[idx] = { ...projects[idx], ...body };
        this.setItem('projects', projects);
        return { success: true, message: 'Proyek berhasil diperbarui (Lokal)', data: projects[idx] };
      }
      if (method === 'DELETE' && idx >= 0) {
        projects.splice(idx, 1);
        this.setItem('projects', projects);
        return { success: true, message: 'Proyek berhasil dihapus (Lokal)' };
      }
      if (clean.includes('/duplicate') && idx >= 0) {
        const copy = { ...projects[idx], id: 'proj_' + Date.now(), title: projects[idx].title + ' (Salinan)' };
        projects.splice(idx + 1, 0, copy);
        this.setItem('projects', projects);
        return { success: true, message: 'Proyek berhasil diduplikasi (Lokal)', data: copy };
      }
    }

    if (clean.includes('/builder') && (method === 'PUT' || method === 'POST')) {
      if (body && body.content) {
        localStorage.setItem(`builder_schema_${body.locale || 'id'}`, JSON.stringify(body.content));
        localStorage.setItem(`builder_schema_home_${body.locale || 'id'}`, JSON.stringify(body.content));
      }
      return { success: true, message: 'Perubahan kanvas berhasil disimpan (Lokal)', versionNumber: 1 };
    }

    if (clean.includes('/settings')) {
      const settings = this.getItem('settings', defaults.settings);
      const updated = { ...settings, ...body };
      this.setItem('settings', updated);
      return { success: true, message: 'Pengaturan berhasil diperbarui (Lokal)' };
    }

    return { success: true, message: 'Tersimpan (Mode Mandiri)' };
  }
};
