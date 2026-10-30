/**
 * SEKALARUPA STUDIO - Database Seeder
 * Populates real initial data from PRD and SITE_DATA into the 22+ relational tables.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { get, run, all } = require('./index');

function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

async function seedDatabase() {
  console.log('[Seeder] Checking if database needs initial seeding...');

  // Check if categories or projects exist
  const existingProjects = get('SELECT count(*) as count FROM projects');
  if (existingProjects && existingProjects.count > 0) {
    console.log(`[Seeder] Database already populated with ${existingProjects.count} projects. Skipping seed.`);
    return;
  }

  console.log('[Seeder] Populating initial Sekalarupa Studio data...');

  // 1. Media Folders & Media Assets
  const folderArchId = generateId('folder');
  const folderIntId = generateId('folder');
  const folderBrandId = generateId('folder');

  run('INSERT INTO media_folders (id, name) VALUES (?, ?)', [folderArchId, 'Architecture']);
  run('INSERT INTO media_folders (id, name) VALUES (?, ?)', [folderIntId, 'Interior']);
  run('INSERT INTO media_folders (id, name) VALUES (?, ?)', [folderBrandId, 'Brand Assets']);

  const initialImages = [
    { file: 'hero-architecture.jpg', folder: folderArchId, alt: 'Nocturne Cantilever Highland Villa' },
    { file: 'hero-night-residence.jpg', folder: folderArchId, alt: 'Twilight Pine Pavilion at Night' },
    { file: 'project-residence-urban.jpg', folder: folderArchId, alt: 'Lumina Courtyard House' },
    { file: 'project-villa-rural.jpg', folder: folderArchId, alt: 'Lembah Bagja Sanctuary Countryside' },
    { file: 'project-cafe-commercial.jpg', folder: folderArchId, alt: 'Tanamera Atelier & Roastery' },
    { file: 'project-interior-living.jpg', folder: folderIntId, alt: 'Kasada Earth Living Interior' },
    { file: 'project-facade-detail.jpg', folder: folderArchId, alt: 'The Terracotta Pavilion Facade' },
    { file: 'deliverables-photobook.jpg', folder: folderBrandId, alt: 'Exclusive Hardcover Photobook Handover' }
  ];

  const mediaMap = {};
  for (const img of initialImages) {
    const assetId = generateId('media');
    const storagePath = `assets/images/${img.file}`;
    const fullPath = path.resolve(__dirname, `../../${storagePath}`);
    let size = 0;
    if (fs.existsSync(fullPath)) {
      size = fs.statSync(fullPath).size;
    }
    run(
      `INSERT INTO media_assets (id, file_name, storage_path, file_type, file_size, alt_text, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [assetId, img.file, storagePath, 'image/jpeg', size, img.alt, img.folder]
    );
    mediaMap[img.file] = assetId;
  }

  // 2. Categories (PRD Section 4.1 & 10.2)
  const categoriesData = [
    { name: 'Architecture', slug: 'architecture', type: 'portfolio', order: 1 },
    { name: 'Exterior Design', slug: 'exterior', type: 'portfolio', order: 2 },
    { name: 'Interior Design', slug: 'interior', type: 'portfolio', order: 3 },
    { name: 'Furniture Design', slug: 'furniture', type: 'portfolio', order: 4 },
    { name: 'Product Design', slug: 'product-design', type: 'portfolio', order: 5 },
    { name: '3D Visualization', slug: '3d-visualization', type: 'portfolio', order: 6 },
    { name: 'Philosophy & Insights', slug: 'journal-insights', type: 'journal', order: 7 }
  ];

  const catMap = {};
  for (const cat of categoriesData) {
    const catId = generateId('cat');
    run(
      'INSERT INTO categories (id, name, slug, category_type, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [catId, cat.name, cat.slug, cat.type, cat.order]
    );
    catMap[cat.slug] = catId;
  }

  // 3. Deliverables (PRD Section 4.2 & 10.2)
  const deliverablesData = [
    { name: 'Alternatif Denah & Tata Ruang', desc: 'Functional floor plan layout alternatives with circulation study', cat: 'Design Development' },
    { name: 'Alternatif Desain Fasad & Bentuk Massa', desc: 'Building facade, volume, and massing design explorations', cat: 'Design Development' },
    { name: 'Moodboard Material & Karakter Ruang', desc: 'Curated natural material, color palette, and texture selection', cat: 'Design Development' },
    { name: 'Analisis Tapak & Mikroklimat Pasif', desc: 'Sun path, wind flow, and topography microclimate analysis', cat: 'Design Development' },
    { name: 'Render 3D Fotorealistik Eksterior', desc: 'High-resolution photorealistic daylight and twilight exterior perspectives', cat: '3D Visualization' },
    { name: 'Render 3D Detail Interior', desc: 'Dedicated 3D renders for every living space with custom furniture and lighting', cat: '3D Visualization' },
    { name: 'Video Sinematik Walkthrough 4K', desc: '2 to 3-minute cinematic 4K video walkthrough with ambient sound', cat: '3D Visualization' },
    { name: 'Dokumentasi Gambar Kerja DED Lengkap', desc: 'Comprehensive detailed engineering drawings (Arsitektur, Struktur, MEP)', cat: 'Technical Documentation' },
    { name: 'Rencana Anggaran Biaya (RAB)', desc: 'Accurate construction cost estimation and bill of quantities', cat: 'Technical Documentation' },
    { name: 'Hardcover Architecture Photobook', desc: 'Luxury printed hardcover linen photobook delivered directly to client', cat: 'Handover' }
  ];

  const delivMap = {};
  for (const d of deliverablesData) {
    const dId = generateId('deliv');
    run(
      'INSERT INTO deliverables (id, name, description, category, is_active) VALUES (?, ?, ?, ?, 1)',
      [dId, d.name, d.desc, d.cat]
    );
    delivMap[d.name] = dId;
  }

  // 4. Services & Translations (PRD Section 4.1 & 10.2)
  const servicesData = [
    {
      key: 'architecture',
      cover: 'hero-architecture.jpg',
      order: 1,
      idTitle: 'Perancangan Arsitektur',
      enTitle: 'Architecture Design',
      idDesc: 'Perancangan arsitektur dan tata ruang bangunan komprehensif, mulai dari hunian pribadi, villa, hingga bangunan komersial berkarakter kuat dan fungsional.',
      enDesc: 'Comprehensive architectural and spatial planning from bespoke private homes and hillside villas to character-rich commercial buildings.',
      idScope: 'Analisis tapak, konteks lingkungan & iklim tropis; Pengembangan konsep & alternatif denah ruang; Perancangan bentuk massa bangunan 3D fotorealistik; Gambar kerja detail arsitektur lengkap (DED)',
      enScope: 'Site analysis, environmental context & tropical microclimate; Concept development & spatial zoning alternatives; Photorealistic 3D massing and architectural forms; Complete technical detailed engineering drawings (DED)'
    },
    {
      key: 'exterior',
      cover: 'project-facade-detail.jpg',
      order: 2,
      idTitle: 'Desain Eksterior & Fasad',
      enTitle: 'Exterior & Facade Design',
      idDesc: 'Eksplorasi fasad, pemilihan material alam yang tahan cuaca tropis, serta penataan lansekap dan pencahayaan luar bangunan yang berkarakter abadi.',
      enDesc: 'Facade exploration, weather-resilient tropical materials selection, landscape articulation, and architectural exterior lighting with timeless character.',
      idScope: 'Studi pencahayaan alami & kisi-kisi peneduh matahari; Komposisi material dinding, batu alam & kayu; Detail konstruksi fasad arsitektural; Desain lighting malam hari yang elegan',
      enScope: 'Daylight harvesting study & shading louvers; Composition of textured concrete, local stone & timber; Architectural facade construction details; Atmospheric nighttime lighting design'
    },
    {
      key: 'interior',
      cover: 'project-interior-living.jpg',
      order: 3,
      idTitle: 'Desain Interior',
      enTitle: 'Interior Design',
      idDesc: 'Penciptaan atmosfer ruang yang intim, hangat, dan fungsional dengan kepekaan material alami, sirkulasi lapang, dan pencahayaan bernuansa relaksasi.',
      enDesc: 'Creating intimate, serene, and functional indoor atmospheres with tactile natural materials, seamless circulation, and soothing ambient lighting.',
      idScope: 'Penataan zonasi ruang & ergonomi sirkulasi; Pemilihan palet warna, tekstur & finishing; Desain ceiling, dinding akustik & mood lighting; Koordinasi detail custom built-in cabinetry',
      enScope: 'Spatial zoning & ergonomic human circulation; Curated color palettes, textures & bespoke finishes; Ceiling, acoustic wall details & mood lighting; Coordination for custom built-in cabinetry'
    },
    {
      key: 'furniture',
      cover: 'project-interior-living.jpg',
      order: 4,
      idTitle: 'Desain Furniture Custom',
      enTitle: 'Custom Furniture Design',
      idDesc: 'Perancangan mebel custom yang dirancang spesifik untuk dimensi dan kebutuhan ruang Anda, memadukan keahlian perajin kayu lokal dan estetika modern.',
      enDesc: 'Tailor-made furniture designed specifically for the dimensions and character of your sanctuary, uniting local artisanal joinery with contemporary minimalism.',
      idScope: 'Gambar kerja fabrikasi mebel detail & skala 1:1; Pemilihan jenis kayu solid jati, mahoni & finishing; Pemilihan busa premium & kain pelapis upholstery; Supervisi langsung proses pembuatan ke workshop perajin',
      enScope: 'Detailed fabrication drawings & 1:1 joinery cuts; Selection of solid aged teak, mahogany & natural finishes; Premium ergonomic foam & tactile upholstery textiles; Direct workshop supervision and quality control'
    },
    {
      key: 'product-design',
      cover: 'project-facade-detail.jpg',
      order: 5,
      idTitle: 'Desain Produk & Objek Desain',
      enTitle: 'Product & Object Design',
      idDesc: 'Pengembangan objek arsitektural, elemen dekoratif kriya, lampu gantung bespoke, hingga produk arsitektur berskala personal.',
      enDesc: 'Design of architectural objects, artisan decorative crafts, bespoke sculptural pendant lighting, and personal-scale design products.',
      idScope: 'Riset kebutuhan pengguna & eksplorasi material; Modeling 3D digital & prototyping fisik; Detail sambungan teknis & perakitan presisi; Panduan spesifikasi produksi & kemasan',
      enScope: 'User research & tactile material exploration; Digital 3D modeling & physical prototyping; Precision technical connection & assembly details; Production specification & curated packaging'
    },
    {
      key: '3d-visualization',
      cover: 'hero-night-residence.jpg',
      order: 6,
      idTitle: 'Visualisasi 3D Fotorealistik',
      enTitle: '3D Photorealistic Visualization',
      idDesc: 'Presentasi visual kelas atas berupa render statis resolusi tinggi dan animasi video sinematik yang menangkap nuansa cahaya matahari, bayangan, dan tekstur asli.',
      enDesc: 'High-end visual presentation comprising ultra-high-resolution still renders and cinematic video walkthroughs capturing genuine sunlight, shadows, and textures.',
      idScope: 'Modeling 3D presisi berdasarkan dokumen arsitektur; Texturing material fotorealistik beresolusi tinggi; Pengaturan lighting siang, senja (twilight) & malam; Produksi video cinematic 4K lengkap tata musik ambient',
      enScope: 'Precision 3D modeling from architectural drawings; Ultra-high-resolution photorealistic material mapping; Daylight, twilight & nighttime lighting scenarios; 4K cinematic video production with ambient sound design'
    }
  ];

  for (const s of servicesData) {
    const sId = generateId('serv');
    const coverMediaId = mediaMap[s.cover] || null;
    const coverImgPath = `assets/images/${s.cover}`;
    run(
      `INSERT INTO services (id, service_key, cover_media_id, cover_image, sort_order, is_active, is_published)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [sId, s.key, coverMediaId, coverImgPath, s.order]
    );

    // ID translation
    run(
      `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
       VALUES (?, ?, 'id', ?, ?, ?, ?)`,
      [generateId('st'), sId, s.idTitle, s.key, s.idDesc, s.idScope]
    );

    // EN translation
    run(
      `INSERT INTO service_translations (id, service_id, locale, title, slug, description, scope_of_work)
       VALUES (?, ?, 'en', ?, ?, ?, ?)`,
      [generateId('st'), sId, s.enTitle, s.key, s.enDesc, s.enScope]
    );
  }

  // 5. Projects & Translations (PRD Section 10.2 & SITE_DATA)
  const projectsData = [
    {
      slug: 'nocturne-residence',
      projectType: 'Architecture',
      status: 'Concept',
      locationType: 'Highland / Sanctuary',
      location: 'Lembang Highlands, Bandung',
      year: '2026',
      landArea: '850 m²',
      buildingArea: '520 m²',
      isFeatured: 1,
      sortOrder: 1,
      cover: 'hero-night-residence.jpg',
      gallery: ['hero-night-residence.jpg', 'hero-architecture.jpg'],
      categorySlugs: ['architecture', '3d-visualization'],
      idTitle: 'Nocturne Pine Pavilion',
      idTagline: 'Twilight Cantilever Highland Residence',
      idDesc: 'Hunian dua lantai di kawasan perbukitan pinus Lembang yang dirancang menyatu dengan kabut dan suasana malam pegunungan. Menggabungkan kantilever beton geometris, kisi-kisi kayu solid, dan pencahayaan arsitektural malam hari (ambient uplighting) yang dramatis, hangat, dan menghadirkan kedamaian sejati.',
      idConcept: 'Dialog antara geometri kokoh dan kelembutan alam tropis pegunungan. Struktur kantilever lantai atas membentang menembus kanopi pepohonan pinus, meminimalkan jejak galian tanah berkontur.',
      enTitle: 'Nocturne Pine Pavilion',
      enTagline: 'Twilight Cantilever Highland Residence',
      enDesc: 'A two-story cantilevered highland sanctuary nestled among pine trees in Lembang, crafted in dialogue with mountain mist and tranquil twilight. Integrating geometric board-formed concrete, solid timber screening, and dramatic architectural uplighting that creates serene warmth and lasting peace.',
      enConcept: 'A harmonic dialogue between sculptural geometry and the soft mountain breeze. The upper floor cantilevers boldly into the pine canopy to minimize ground disturbance on steep contours.',
      delivs: ['Alternatif Denah & Tata Ruang', 'Render 3D Fotorealistik Eksterior', 'Video Sinematik Walkthrough 4K', 'Dokumentasi Gambar Kerja DED Lengkap', 'Rencana Anggaran Biaya (RAB)', 'Hardcover Architecture Photobook']
    },
    {
      slug: 'lumina-courtyard',
      projectType: 'Architecture',
      status: 'Completed',
      locationType: 'Urban Context',
      location: 'South Jakarta',
      year: '2025',
      landArea: '420 m²',
      buildingArea: '385 m²',
      isFeatured: 1,
      sortOrder: 2,
      cover: 'project-residence-urban.jpg',
      gallery: ['project-residence-urban.jpg', 'project-interior-living.jpg'],
      categorySlugs: ['architecture', 'interior'],
      idTitle: 'Lumina Courtyard House',
      idTagline: 'Urban Biophilic Living Sanctuary',
      idDesc: 'Hunian dua lantai di tengah kepadatan perkotaan Jakarta yang dirancang dengan orientasi ke dalam (introverted courtyard). Menggabungkan beton ekspos bertekstur, kisi-kisi kayu jati vertikal, dan bukaan kaca masif yang menghadirkan ventilasi silang optimal serta pencahayaan alami tanpa mengorbankan privasi keluarga.',
      idConcept: 'Menciptakan mikroklimat privat di dalam hunian urban melalui inner courtyard bervegetasi tropis lebat yang menyuplai udara sejuk ke seluruh ruangan.',
      enTitle: 'Lumina Courtyard House',
      enTagline: 'Urban Biophilic Living Sanctuary',
      enDesc: 'A two-story urban sanctuary amidst Jakarta\'s density, designed with an introverted courtyard philosophy. Harmonizing board-formed concrete, vertical teak louvers, and expansive glazed openings that invite continuous cross-ventilation and natural daylight while preserving intimate family privacy.',
      enConcept: 'Fostering an internal microclimate through a verdant tropical courtyard acting as the lungs of the house, filtering city noise and heat.',
      delivs: ['Alternatif Denah & Tata Ruang', 'Render 3D Fotorealistik Eksterior', 'Render 3D Detail Interior', 'Dokumentasi Gambar Kerja DED Lengkap', 'Hardcover Architecture Photobook']
    },
    {
      slug: 'lembah-bagja',
      projectType: 'Architecture',
      status: 'Completed',
      locationType: 'Rural Sanctuary',
      location: 'Sukabumi / West Java',
      year: '2025',
      landArea: '1,850 m²',
      buildingArea: '520 m²',
      isFeatured: 1,
      sortOrder: 3,
      cover: 'project-villa-rural.jpg',
      gallery: ['project-villa-rural.jpg'],
      categorySlugs: ['architecture', 'exterior'],
      idTitle: 'Lembah Bagja Sanctuary',
      idTagline: 'Hillside Countryside Retreat',
      idDesc: 'Manifestasi nyata dari filosofi Tatar Rupa Mawa Bagja. Sebuah paviliun peristirahatan di lereng bukit dengan terasering persawahan. Menggunakan konstruksi kayu daur ulang berbentang lebar, pondasi batu alam kali setempat, dan kolam refleksi air yang menciptakan ketenangan batin serta kesejukan mikroklimat alami.',
      idConcept: 'Menghargai garis kontur bumi dengan massa bangunan berundak yang tidak mendominasi pemandangan alam perdesaan Sunda.',
      enTitle: 'Lembah Bagja Sanctuary',
      enTagline: 'Hillside Countryside Retreat',
      enDesc: 'A true manifestation of the "Tatar Rupa Mawa Bagja" philosophy. A hillside retreat pavilion overlooking layered rice terraces. Utilizing reclaimed timber structural frames, locally quarried river stone bases, and tranquil reflection pools that foster serenity and passive microclimate cooling.',
      enConcept: 'Honoring natural topography with stepped building pavilions that harmonize quietly within the rural Sundanese terraced landscape.',
      delivs: ['Analisis Tapak & Mikroklimat Pasif', 'Render 3D Fotorealistik Eksterior', 'Dokumentasi Gambar Kerja DED Lengkap', 'Hardcover Architecture Photobook']
    },
    {
      slug: 'kasada-living',
      projectType: 'Interior',
      status: 'Completed',
      locationType: 'Hillside Residence',
      location: 'Dago Atas, Bandung',
      year: '2025',
      landArea: '600 m²',
      buildingArea: '450 m²',
      isFeatured: 0,
      sortOrder: 4,
      cover: 'project-interior-living.jpg',
      gallery: ['project-interior-living.jpg'],
      categorySlugs: ['interior', 'furniture'],
      idTitle: 'Kasada Earth Living',
      idTagline: 'Warm Earth & Tactile Serenity',
      idDesc: 'Perancangan interior ruang keluarga, ruang makan, dan lounge santai dengan palet warna tanah (earth tones), plesteran semen kapur alami, furniture kayu jati solid buatan perajin lokal, dan karpet serat rami yang mengundang ketenangan.',
      idConcept: 'Kesederhanaan yang merayakan tekstur alami material dan kenyamanan haptic bagi setiap sentuhan penghuni.',
      enTitle: 'Kasada Earth Living',
      enTagline: 'Warm Earth & Tactile Serenity',
      enDesc: 'Interior curation for family living, dining, and tranquil salon spaces utilizing warm earth tones, lime-plaster surfaces, bespoke solid teak furniture by local craftsmen, and raw jute rugs that invite mindful living.',
      enConcept: 'Simplicity that celebrates natural tactile textures and haptic comfort for everyday moments.',
      delivs: ['Moodboard Material & Karakter Ruang', 'Render 3D Detail Interior', 'Dokumentasi Gambar Kerja DED Lengkap']
    },
    {
      slug: 'tanamera-roastery',
      projectType: 'Commercial',
      status: 'Completed',
      locationType: 'Commercial Hub',
      location: 'Riau Street Heritage, Bandung',
      year: '2024',
      landArea: '750 m²',
      buildingArea: '680 m²',
      isFeatured: 0,
      sortOrder: 5,
      cover: 'project-cafe-commercial.jpg',
      gallery: ['project-cafe-commercial.jpg'],
      categorySlugs: ['architecture', 'interior'],
      idTitle: 'Tanamera Atelier & Roastery',
      idTagline: 'Adaptive Reuse Heritage Commercial Cafe',
      idDesc: 'Revitalisasi bangunan kolonial cagar budaya menjadi ruang roastery kopi modern, area kerja komunal, dan galeri desain. Mempertahankan struktur bata merah ekspos dan rangka atap kayu lawas yang dipadukan dengan kaca baja industrial minimalis.',
      idConcept: 'Jembatan waktu antara memori historis bangunan masa lalu dan dinamika gaya hidup kreatif kontemporer.',
      enTitle: 'Tanamera Atelier & Roastery',
      enTagline: 'Adaptive Reuse Heritage Commercial Cafe',
      enDesc: 'Adaptive reuse of a heritage colonial residence transformed into a contemporary specialty coffee roastery, communal work lounge, and design gallery. Preserving original exposed clay bricks and heritage timber roof trusses beside sleek steel-framed glazing.',
      enConcept: 'A chronological bridge between the historic memory of Bandung\'s colonial era and contemporary creative lifestyle.',
      delivs: ['Alternatif Denah & Tata Ruang', 'Render 3D Fotorealistik Eksterior', 'Render 3D Detail Interior', 'Dokumentasi Gambar Kerja DED Lengkap']
    },
    {
      slug: 'terracotta-pavilion',
      projectType: 'Exterior',
      status: 'Concept',
      locationType: 'Rural / Tropical',
      location: 'Ubud Foothills, Bali',
      year: '2026',
      landArea: '1,200 m²',
      buildingArea: '480 m²',
      isFeatured: 0,
      sortOrder: 6,
      cover: 'project-facade-detail.jpg',
      gallery: ['project-facade-detail.jpg'],
      categorySlugs: ['exterior', 'architecture'],
      idTitle: 'The Terracotta Pavilion',
      idTagline: 'Earthen Screen & Tropical Light Studies',
      idDesc: 'Eksperimen fasad bernafas (breathing skin facade) menggunakan modul bata terakota bakar custom dengan celah sudut terukur. Menghasilkan bayangan geometris menawan di lantai teraso sekaligus menurunkan suhu ruang secara pasif hingga 4 derajat Celsius.',
      idConcept: 'Pemanfaatan material terakota lokal sebagai solusi pendinginan pasif alami yang estetik dan ramah lingkungan.',
      enTitle: 'The Terracotta Pavilion',
      enTagline: 'Earthen Screen & Tropical Light Studies',
      enDesc: 'A breathing skin facade exploration using custom perforated terracotta clay blocks angled to catch trade breezes. Casting intricate shifting sun patterns while passively dropping indoor temperatures by 4 degrees Celsius.',
      enConcept: 'Harnessing humble local terracotta as a sustainable, zero-energy passive climate filter with strong architectural character.',
      delivs: ['Alternatif Desain Fasad & Bentuk Massa', 'Analisis Tapak & Mikroklimat Pasif', 'Render 3D Fotorealistik Eksterior']
    },
    {
      slug: 'resonance-villa',
      projectType: 'Architecture',
      status: 'Concept',
      locationType: 'Highland Sanctuary',
      location: 'Ciwidey Valley, West Java',
      year: '2026',
      landArea: '2,400 m²',
      buildingArea: '720 m²',
      isFeatured: 0,
      sortOrder: 7,
      cover: 'hero-architecture.jpg',
      gallery: ['hero-architecture.jpg'],
      categorySlugs: ['architecture', '3d-visualization'],
      idTitle: 'Resonance Master Villa',
      idTagline: 'Tea Plantation Horizon Estate',
      idDesc: 'Villa peristirahatan keluarga besar di tengah hamparan perkebunan teh Ciwidey dengan panorama horizon 180 derajat. Memadukan atap pelana modern asimetris, ruang komunal terbuka tanpa sekat, dan perapian gantung dari baja tempa.',
      idConcept: 'Arsitektur yang mengalir membuka diri ke arah lanskap kebun teh yang berkabut, menghadirkan kehangatan di tengah udara dingin dataran tinggi.',
      enTitle: 'Resonance Master Villa',
      enTagline: 'Tea Plantation Horizon Estate',
      enDesc: 'A generational private family estate perched atop tea plantations in Ciwidey offering unbroken 180-degree horizon views. Characterized by asymmetric modern gables, seamless column-free communal spaces, and a sculptural suspended steel hearth.',
      enConcept: 'Architecture that opens generously toward the mist-clad tea fields, celebrating hearth, togetherness, and highland peace.',
      delivs: ['Analisis Tapak & Mikroklimat Pasif', 'Render 3D Fotorealistik Eksterior', 'Render 3D Detail Interior', 'Hardcover Architecture Photobook']
    }
  ];

  for (const p of projectsData) {
    const pId = generateId('proj');
    const coverPath = `assets/images/${p.cover}`;
    run(
      `INSERT INTO projects (id, slug, project_type, status, location_type, location, year, land_area, building_area, is_featured, sort_order, is_published, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [pId, p.slug, p.projectType, p.status, p.locationType, p.location, p.year, p.landArea, p.buildingArea, p.isFeatured, p.sortOrder, coverPath]
    );

    // Translations
    run(
      `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
       VALUES (?, ?, 'id', ?, ?, ?, ?, ?, ?)`,
      [generateId('pt'), pId, p.idTitle, p.idTagline, p.idDesc, p.idConcept, `${p.idTitle} | Sekalarupa Studio`, p.idDesc.substring(0, 150)]
    );

    run(
      `INSERT INTO project_translations (id, project_id, locale, title, tagline, description, design_concept, seo_title, seo_description)
       VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?)`,
      [generateId('pt'), pId, p.enTitle, p.enTagline, p.enDesc, p.enConcept, `${p.enTitle} | Sekalarupa Studio`, p.enDesc.substring(0, 150)]
    );

    // Categories
    for (const cSlug of p.categorySlugs) {
      const cId = catMap[cSlug];
      if (cId) {
        run('INSERT OR IGNORE INTO project_categories (id, project_id, category_id) VALUES (?, ?, ?)', [generateId('pc'), pId, cId]);
      }
    }

    // Media
    p.gallery.forEach((gFile, idx) => {
      const mId = mediaMap[gFile];
      if (mId) {
        run('INSERT INTO project_media (id, project_id, media_id, media_role, sort_order) VALUES (?, ?, ?, ?, ?)', [
          generateId('pm'),
          pId,
          mId,
          idx === 0 ? 'cover' : 'gallery',
          idx
        ]);
      }
    });

    // Deliverables
    p.delivs.forEach((dName, idx) => {
      const dId = delivMap[dName];
      if (dId) {
        run('INSERT OR IGNORE INTO project_deliverables (id, project_id, deliverable_id, sort_order) VALUES (?, ?, ?, ?)', [
          generateId('pd'),
          pId,
          dId,
          idx
        ]);
      }
    });
  }

  // 6. Navigation Menus & Items (PRD Section 5.1 & 10.2)
  const navMenuId = generateId('menu');
  run('INSERT INTO navigation_menus (id, menu_key, title) VALUES (?, ?, ?)', [navMenuId, 'main-nav', 'Main Navigation']);

  const navItems = [
    { labelId: 'Beranda', labelEn: 'Home', url: '#home', order: 1 },
    { labelId: 'Tentang', labelEn: 'About', url: '#about', order: 2 },
    { labelId: 'Portofolio', labelEn: 'Portfolio', url: '#portfolio', order: 3 },
    { labelId: 'Layanan', labelEn: 'Services', url: '#services', order: 4 },
    { labelId: 'Proses', labelEn: 'Process', url: '#process', order: 5 },
    { labelId: 'Kontak', labelEn: 'Contact', url: '#contact', order: 6 }
  ];

  for (const item of navItems) {
    run(
      `INSERT INTO navigation_items (id, menu_id, label_translations, url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [generateId('nav'), navMenuId, JSON.stringify({ id: item.labelId, en: item.labelEn }), item.url, item.order]
    );
  }

  // 7. Site Settings & Theme Settings (PRD Section 7.9, 7.10, 10.2)
  const siteSettings = {
    brand_name: 'SEKALARUPA STUDIO',
    short_name: 'SEKALARUPA',
    tagline_id: 'Create a Home that brings happiness.',
    tagline_en: 'Create a Home that brings happiness.',
    sundanese_philosophy: 'Tatar Rupa Mawa Bagja',
    sundanese_meaning_id: 'Menciptakan ruang dan tata hunian yang membawa kebahagiaan.',
    sundanese_meaning_en: 'Designing spaces and settlements that bring genuine happiness and harmony.',
    whatsapp: '087857523074',
    whatsapp_intl: '+62 878-5752-3074',
    whatsapp_number_only: '6287857523074',
    instagram: '@sekalarupa.arsitek',
    instagram_url: 'https://instagram.com/sekalarupa.arsitek',
    email: 'contact@sekalarupa.com',
    location: 'Bandung & Nationwide (Indonesia)',
    established: '2026',
    default_language: 'id',
    supported_languages: 'id,en',
    seo_default_title: 'SEKALARUPA STUDIO | Architecture, Interior & Design Visualization',
    seo_default_description: 'SEKALARUPA STUDIO merupakan studio arsitektur yang berfokus pada perancangan hunian modern, fungsional, dan estetis di pedesaan maupun perkotaan di seluruh Indonesia. Tatar Rupa Mawa Bagja.'
  };

  for (const [key, val] of Object.entries(siteSettings)) {
    run(
      'INSERT OR REPLACE INTO site_settings (id, setting_key, setting_value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [generateId('set'), key, typeof val === 'object' ? JSON.stringify(val) : String(val)]
    );
  }

  const themeSettings = {
    color_primary: '#1E2221',
    color_background: '#F5F3EE',
    color_accent: '#8B7355',
    color_card_bg: 'rgba(255, 255, 255, 0.72)',
    color_card_bg_dark: 'rgba(28, 32, 30, 0.75)',
    color_text: '#1E2221',
    font_heading: 'Playfair Display',
    font_body: 'Plus Jakarta Sans',
    border_radius: '4px',
    header_opacity: '0.92',
    button_style: 'architectural-minimal'
  };

  for (const [key, val] of Object.entries(themeSettings)) {
    run(
      'INSERT OR REPLACE INTO theme_settings (id, theme_key, theme_value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [generateId('thm'), key, typeof val === 'object' ? JSON.stringify(val) : String(val)]
    );
  }

  // 8. System Pages & Initial Visual Page Builder Data (PRD Section 8 & 10.3)
  const { DEFAULT_LANDING_PAGE_SCHEMA } = require('./landingPageSchema');
  const homePageId = generateId('page');
  run(
    'INSERT INTO pages (id, page_key, page_type, is_system_page) VALUES (?, ?, ?, 1)',
    [homePageId, 'home', 'landing']
  );

  const homeBuilderSchema = DEFAULT_LANDING_PAGE_SCHEMA;

  run(
    `INSERT INTO page_translations (id, page_id, locale, title, slug, content_json, seo_title, seo_description, publication_status, published_at)
     VALUES (?, ?, 'id', ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)`,
    [
      generateId('pt'),
      homePageId,
      'Beranda',
      'home',
      JSON.stringify(homeBuilderSchema),
      'SEKALARUPA STUDIO | Architecture & Design',
      'Create a Home that brings happiness. Tatar Rupa Mawa Bagja.',
    ]
  );

  run(
    `INSERT INTO page_translations (id, page_id, locale, title, slug, content_json, seo_title, seo_description, publication_status, published_at)
     VALUES (?, ?, 'en', ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)`,
    [
      generateId('pt'),
      homePageId,
      'Home',
      'home',
      JSON.stringify(homeBuilderSchema),
      'SEKALARUPA STUDIO | Architecture & Design',
      'Create a Home that brings happiness. Tatar Rupa Mawa Bagja.'
    ]
  );

  // Initial page version
  run(
    `INSERT INTO page_versions (id, page_id, locale, content_snapshot, version_number, notes)
     VALUES (?, ?, 'id', ?, 1, 'Initial seeded homepage builder layout')`,
    [generateId('pv'), homePageId, JSON.stringify(homeBuilderSchema)]
  );

  // 9. Initial Journal Post (PRD Section 7.7)
  const journalId = generateId('jour');
  run(
    `INSERT INTO journal_posts (id, cover_image, category_id, publication_status, published_at)
     VALUES (?, ?, ?, 'published', CURRENT_TIMESTAMP)`,
    [journalId, 'assets/images/project-villa-rural.jpg', catMap['journal-insights']]
  );

  run(
    `INSERT INTO journal_translations (id, post_id, locale, title, slug, excerpt, content, seo_title, seo_description)
     VALUES (?, ?, 'id', ?, ?, ?, ?, ?, ?)`,
    [
      generateId('jt'),
      journalId,
      'Tatar Rupa Mawa Bagja: Memaknai Kembali Esensi Hunian Tropis',
      'tatar-rupa-mawa-bagja-esensi-hunian-tropis',
      'Refleksi arsitektur mengenai keselarasan manusia, tapak berkontur, dan kebahagiaan hakiki yang lahir dari ketenangan ruang.',
      'Dalam kosmologi budaya Sunda, ungkapan Tatar Rupa Mawa Bagja menyimpan kedalaman filosofis: tata ruang dan rupa hunian yang membawa kebahagiaan serta berkah bagi penghuninya. Di era modern yang serba terburu-buru, Sekalarupa Studio kembali menempatkan esensi ini sebagai kompas utama dalam setiap guratan denah dan bentuk massa bangunan...',
      'Tatar Rupa Mawa Bagja | Jurnal Sekalarupa Studio',
      'Refleksi arsitektur mengenai keselarasan manusia, tapak berkontur, dan kebahagiaan hakiki.'
    ]
  );

  run(
    `INSERT INTO journal_translations (id, post_id, locale, title, slug, excerpt, content, seo_title, seo_description)
     VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?)`,
    [
      generateId('jt'),
      journalId,
      'Tatar Rupa Mawa Bagja: Redefining Tropical Living and Serenity',
      'tatar-rupa-mawa-bagja-tropical-serenity',
      'An architectural reflection on human harmony, hillside topography, and the profound happiness born of spatial peace.',
      'In traditional Sundanese wisdom, Tatar Rupa Mawa Bagja conveys a timeless truth: creating spatial arrangements and architecture that bring genuine joy and harmony to human life. In our fast-paced contemporary era, Sekalarupa Studio grounds each design journey in this timeless philosophy...',
      'Tatar Rupa Mawa Bagja | Sekalarupa Studio Journal',
      'An architectural reflection on human harmony and spatial peace.'
    ]
  );

  console.log('[Seeder] Database seeding completed successfully!');
}

module.exports = {
  seedDatabase
};

if (require.main === module) {
  seedDatabase();
}
