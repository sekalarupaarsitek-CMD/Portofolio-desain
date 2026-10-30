/**
 * SEKALARUPA STUDIO - Data & Bilingual Translations Dictionary
 * Product: Architecture Portfolio Website
 * PRD Reference: SEKALARUPA STUDIO PRD v1.0
 */

const SITE_DATA = {
  brand: {
    name: "SEKALARUPA STUDIO",
    shortName: "SEKALARUPA",
    taglineEn: "Create a Home that brings happiness.",
    taglineId: "Create a Home that brings happiness.",
    philosophyEn: "Thoughtful architecture and design shaped by people, place, and purpose.",
    philosophyId: "Perancangan arsitektur dan ruang yang lahir dari manusia, konteks tempat, dan makna mendalam.",
    sundanesePhilosophy: "Tatar Rupa Mawa Bagja",
    sundaneseMeaningId: "Menciptakan ruang dan tata hunian yang membawa kebahagiaan.",
    sundaneseMeaningEn: "Designing spaces and settlements that bring genuine happiness and harmony.",
    whatsapp: "087857523074",
    whatsappIntl: "+62 878-5752-3074",
    whatsappNumberOnly: "6287857523074",
    instagram: "@sekalarupa.arsitek",
    instagramUrl: "https://instagram.com/sekalarupa.arsitek",
    location: "Bandung & Nationwide (Indonesia)",
    established: "2026",
  },

  projects: [
    {
      id: "nocturne-residence",
      title: "Nocturne Pine Pavilion",
      tagline: "Twilight Cantilever Highland Residence",
      category: "Architecture",
      categoryKey: "architecture",
      location: "Lembang Highlands, Bandung",
      year: "2026",
      siteArea: "850 m²",
      buildingArea: "520 m²",
      typology: "Private Modern Residence (Highland Sanctuary)",
      image: "assets/images/hero-night-residence.jpg",
      featured: true,
      descriptionId: "Hunian dua lantai di kawasan perbukitan pinus Lembang yang dirancang menyatu dengan kabut dan suasana malam pegunungan. Menggabungkan kantilever beton geometris, kisi-kisi kayu solid, dan pencahayaan arsitektural malam hari (ambient uplighting) yang dramatis, hangat, dan menghadirkan kedamaian sejati.",
      descriptionEn: "A two-story cantilevered highland sanctuary nestled among pine trees in Lembang, crafted in dialogue with mountain mist and tranquil twilight. Integrating geometric board-formed concrete, solid timber screening, and dramatic architectural uplighting that creates serene warmth and lasting peace.",
      deliverables: [
        "Site Contour & Microclimate Analysis",
        "Architectural Lighting & Night Facade Design",
        "3D Twilight Photorealistic Perspectives",
        "Cinematic 4K Night Walkthrough",
        "Gambar Kerja DED Lengkap & RAB",
        "Hardcover Luxury Photobook Handover"
      ]
    },
    {
      id: "lumina-courtyard",
      title: "Lumina Courtyard House",
      tagline: "Urban Biophilic Living Sanctuary",
      category: "Architecture",
      categoryKey: "architecture",
      location: "South Jakarta",
      year: "2025",
      siteArea: "420 m²",
      buildingArea: "385 m²",
      typology: "Private Residential (Urban)",
      image: "assets/images/project-residence-urban.jpg",
      featured: true,
      descriptionId: "Hunian dua lantai di tengah kepadatan perkotaan Jakarta yang dirancang dengan orientasi ke dalam (introverted courtyard). Menggabungkan beton ekspos bertekstur, kisi-kisi kayu jati vertikal, dan bukaan kaca masif yang menghadirkan ventilasi silang optimal serta pencahayaan alami tanpa mengorbankan privasi keluarga.",
      descriptionEn: "A two-story urban sanctuary amidst Jakarta's density, designed with an introverted courtyard philosophy. Harmonizing board-formed concrete, vertical teak louvers, and expansive glazed openings that invite continuous cross-ventilation and natural daylight while preserving intimate family privacy.",
      deliverables: [
        "Alternatif Denah & Tata Ruang",
        "3D Exterior & Interior Visualization",
        "Video Cinematic 4K Walkthrough",
        "Dokumentasi Gambar Kerja Lengkap (DED)",
        "Rencana Anggaran Biaya (RAB)",
        "Hardcover Architecture Photobook"
      ]
    },
    {
      id: "lembah-bagja",
      title: "Lembah Bagja Sanctuary",
      tagline: "Hillside Countryside Retreat",
      category: "Architecture",
      categoryKey: "architecture",
      location: "Sukabumi / West Java",
      year: "2025",
      siteArea: "1,850 m²",
      buildingArea: "520 m²",
      typology: "Sanctuary Villa (Rural Context)",
      image: "assets/images/project-villa-rural.jpg",
      featured: true,
      descriptionId: "Manifestasi nyata dari filosofi Tatar Rupa Mawa Bagja. Sebuah paviliun peristirahatan di lereng bukit dengan terasering persawahan. Menggunakan konstruksi kayu daur ulang berbentang lebar, pondasi batu alam kali setempat, dan kolam refleksi air yang menciptakan ketenangan batin serta kesejukan mikroklimat alami.",
      descriptionEn: "A true manifestation of the 'Tatar Rupa Mawa Bagja' philosophy. A hillside retreat pavilion overlooking layered rice terraces. Utilizing reclaimed timber structural frames, locally quarried river stone bases, and tranquil reflection pools that foster serenity and passive microclimate cooling.",
      deliverables: [
        "Site Masterplan & Contour Analysis",
        "Passive Solar & Climate Optimization Study",
        "3D Photorealistic Exterior & Landscape Renders",
        "Detail Konstruksi Kayu Tradisional-Modern",
        "Gambar Kerja Arsitektur & MEP",
        "Hardcover Photobook Handover"
      ]
    },
    {
      id: "kasada-living",
      title: "Kasada Earth Living",
      tagline: "Warm Minimalist Interior Residence",
      category: "Interior",
      categoryKey: "interior",
      location: "Bandung, West Java",
      year: "2024",
      siteArea: "300 m²",
      buildingArea: "240 m²",
      typology: "Residential Interior & Furniture",
      image: "assets/images/project-interior-living.jpg",
      featured: true,
      descriptionId: "Perancangan interior ruang keluarga terbuka yang memadukan kehangatan plester kapur alami (limewash), furnitur kayu solid custom berbahan jati lokal, dan koneksi langsung dengan taman air tropis. Menghadirkan suasana tenang untuk beristirahat dan berkumpul bersama keluarga tercinta.",
      descriptionEn: "An open-plan residential living interior uniting warm artisanal limewash finishes, bespoke solid teak joinery, and an unobstructed connection to an intimate tropical water courtyard. Crafted to evoke quiet contemplation and warm family gathering.",
      deliverables: [
        "Interior Spatial Layout & Moodboard",
        "Custom Built-in Furniture Drawings",
        "Lighting Design & Fixture Schedule",
        "Photorealistic 360° Interior Renders",
        "Material Specifications & Finishing Codes"
      ]
    },
    {
      id: "tanamera-atelier",
      title: "Tanamera Atelier & Roastery",
      tagline: "Sensory Architectural Cafe",
      category: "Commercial",
      categoryKey: "commercial",
      location: "Riau Heritage Area, Bandung",
      year: "2025",
      siteArea: "450 m²",
      buildingArea: "310 m²",
      typology: "Hospitality & Commercial Roastery",
      image: "assets/images/project-cafe-commercial.jpg",
      featured: true,
      descriptionId: "Revitalisasi ruang komersial menjadi kafe dan ruang sangrai kopi dengan pengalaman spasial yang mendalam. Menampilkan meja bar monolitik dari batu pahat kasar, lantai terakota hangat, atap skylight terbuka, dan lanskap tropis rimbun yang menjadi oase bagi para penikmat kopi kota.",
      descriptionEn: "A hospitality space celebrating artisanal coffee culture through tactile materiality. Featuring a hand-chiseled monolithic stone coffee bar, warm terracotta floor paving, open skylights, and lush courtyard foliage creating an urban sensory oasis.",
      deliverables: [
        "Commercial Zoning & Customer Flow Study",
        "Barista Bar Ergonomic & Custom Counter Design",
        "Acoustic & Natural Ventilation Design",
        "Cinematic Promo Walkthrough Video",
        "Full Architectural & Mechanical Working Drawings"
      ]
    },
    {
      id: "terracotta-pavilion",
      title: "The Terracotta Pavilion",
      tagline: "Sculptural Breeze Block Facade Detail",
      category: "Exterior",
      categoryKey: "exterior",
      location: "Yogyakarta",
      year: "2024",
      siteArea: "500 m²",
      buildingArea: "410 m²",
      typology: "Residential Exterior & Facade",
      image: "assets/images/project-facade-detail.jpg",
      featured: true,
      descriptionId: "Eksplorasi fasad arsitektural menggunakan dinding roster terakota custom yang disusun secara dinamis. Menghasilkan bayangan geometris menawan saat tersorot matahari pagi dan menyaring terik tropis menjadi cahaya lembut yang nyaman di dalam hunian.",
      descriptionEn: "An architectural facade study featuring dynamically arranged terracotta breeze-block screens. Casting poetic geometric shadows under morning tropical sunlight while effectively filtering solar glare into soft ambient indoor light.",
      deliverables: [
        "Solar Path & Shadow Simulation Study",
        "Custom Roster Module Detailing",
        "Facade Structural Attachment Drawings",
        "High-Resolution 3D Daytime & Night Renders"
      ]
    },
    {
      id: "resonance-villa",
      title: "Resonance Master Villa",
      tagline: "Timeless Tropical Modern Architecture",
      category: "Architecture",
      categoryKey: "architecture",
      location: "Dago Highland, Bandung",
      year: "2025",
      siteArea: "680 m²",
      buildingArea: "480 m²",
      typology: "Private Modern Residence",
      image: "assets/images/hero-architecture.jpg",
      featured: true,
      descriptionId: "Karya arsitektur utama SEKALARUPA STUDIO yang menyeimbangkan kemewahan modern dengan kehangatan elemen alami Indonesia. Kolam cermin air, dinding beton cetak papan, dan koridor kayu jati menciptakan harmoni antara ruang dalam dan lanskap luar.",
      descriptionEn: "SEKALARUPA STUDIO's flagship residential commission harmonizing modern luxury with authentic natural Indonesian elements. Mirror water pools, board-marked concrete, and teak wood breezeways create seamless dialogue between interior and nature.",
      deliverables: [
        "Masterplan & Alternatif Denah Komprehensif",
        "Visualisasi 3D Eksterior & Interior 360",
        "Video Cinematic Walkthrough",
        "Dokumentasi Gambar Kerja DED Lengkap",
        "Hardcover Luxury Photobook Handover"
      ]
    }
  ],

  services: [
    {
      id: "architecture",
      num: "01",
      titleId: "Perancangan Arsitektur",
      titleEn: "Architecture Design",
      descId: "Perancangan arsitektur dan tata ruang bangunan komprehensif, mulai dari hunian pribadi, villa, hingga bangunan komersial berkarakter kuat dan fungsional.",
      descEn: "Comprehensive architectural and spatial planning from bespoke private homes and hillside villas to character-rich commercial buildings.",
      scopeId: [
        "Analisis tapak, konteks lingkungan & iklim tropis",
        "Pengembangan konsep & alternatif denah ruang",
        "Perancangan bentuk massa bangunan 3D fotorealistik",
        "Gambar kerja detail arsitektur lengkap (DED)"
      ],
      scopeEn: [
        "Site analysis, environmental context & tropical microclimate",
        "Concept development & spatial zoning alternatives",
        "Photorealistic 3D massing and architectural forms",
        "Complete technical detailed engineering drawings (DED)"
      ]
    },
    {
      id: "exterior",
      num: "02",
      titleId: "Desain Fasad & Eksterior",
      titleEn: "Exterior & Facade Design",
      descId: "Transformasi tampilan luar bangunan, perancangan fasad modern, integrasi kisi-kisi angin, terasering lanskap, dan pencahayaan arsitektural malam hari.",
      descEn: "Exterior transformation, modern sculptural facade design, breeze-block screening, landscape integration, and architectural night lighting.",
      scopeId: [
        "Perancangan ulang atau perancangan baru fasad bangunan",
        "Kombinasi material estetis (batu alam, kayu jati, beton, terakota)",
        "Studi bayangan matahari & ventilasi alami fasad",
        "Integrasi pencahayaan aksen eksterior (lighting design)"
      ],
      scopeEn: [
        "New building facades or facade refurbishment",
        "Harmonious tactile materials (stone, teak, concrete, terracotta)",
        "Sun-path shading and natural breeze filtration",
        "Architectural exterior accent lighting integration"
      ]
    },
    {
      id: "interior",
      num: "03",
      titleId: "Perancangan Interior",
      titleEn: "Interior Design",
      descId: "Perancangan ruang dalam yang hangat, ergonomis, dan penuh ketenangan batin. Memaksimalkan kenyamanan sehari-hari penghuni dengan sentuhan material alami.",
      descEn: "Interior spatial design delivering warmth, ergonomic comfort, and quiet sanctuary through curated natural textures and human-centered flow.",
      scopeId: [
        "Penataan tata letak furnitur & sirkulasi ruang",
        "Pemilihan palet warna, limewash, dan material finishing",
        "Desain sistem pencahayaan bertingkat (ambient, task, accent)",
        "Visualisasi 3D interior sudut demi sudut"
      ],
      scopeEn: [
        "Spatial layout optimization & ergonomic flow",
        "Color schemes, natural limewash & tactile finishing curation",
        "Layered lighting schemes (ambient, task, accent)",
        "High-definition 3D photorealistic interior renderings"
      ]
    },
    {
      id: "furniture",
      num: "04",
      titleId: "Desain Furniture Custom",
      titleEn: "Custom Furniture Design",
      descId: "Kreasi perabot dan furnitur custom yang disesuaikan secara presisi dengan dimensi ruangan, fungsi spesifik, dan material kayu berkualitas tinggi.",
      descEn: "Bespoke custom furniture and cabinetry tailored with precision to room dimensions, ergonomics, and heirloom-grade solid woodcraft.",
      scopeId: [
        "Desain meja makan solid, credenza, dan lemari built-in",
        "Gambar kerja detail pertukangan kayu (shop drawings)",
        "Spesifikasi material kayu jati, hardware, dan pelapis",
        "Pengawasan proporsi dan detail sambungan kayu"
      ],
      scopeEn: [
        "Custom dining tables, credenzas, and integrated cabinetry",
        "Detailed joinery working shop drawings",
        "Teak timber, brass hardware, and textile specifications",
        "Proportion verification and craftsmanship detailing"
      ]
    },
    {
      id: "product",
      num: "05",
      titleId: "Desain Produk & Objek",
      titleEn: "Product & Object Design",
      descId: "Eksplorasi objek desain arsitektural, modul roster custom, elemen pintu artistik, dan fitting arsitektur bernilai estetika tinggi.",
      descEn: "Exploration of architectural product objects, custom breeze blocks, sculptural hardware, and signature design pieces.",
      scopeId: [
        "Pengembangan prototipe modul dinding roster/breeze block",
        "Desain handle pintu custom & aksen dekoratif",
        "Riset material lokal ramah lingkungan",
        "Dokumentasi spesifikasi fabrikasi produk"
      ],
      scopeEn: [
        "Custom breeze block module prototyping",
        "Signature door pull handles & architectural hardware",
        "Sustainable local material research",
        "Fabrication specification documentation"
      ]
    },
    {
      id: "visualization",
      num: "06",
      titleId: "Visualisasi 3D & Sinematik",
      titleEn: "3D Visualization & Cinematic",
      descId: "Visualisasi fotorealistik tingkat tinggi dan video animasi sinematik yang menghidupkan rancangan sebelum proses pembangunan dimulai.",
      descEn: "High-end photorealistic rendering and 4K cinematic video walkthroughs bringing architectural visions vividly to life before construction.",
      scopeId: [
        "Render eksterior dan interior resolusi ultra tinggi",
        "Simulasi pencahayaan matahari, senja, dan malam hari",
        "Video walkthrough sinematik berdurasi 2 hingga 3 menit",
        "File model digital 3D (.skp) yang terstruktur rapi"
      ],
      scopeEn: [
        "Ultra-high-definition exterior & interior renderings",
        "Daylight, dusk twilight, and evening lighting simulations",
        "Cinematic video walkthrough (2 to 3 minutes duration)",
        "Clean, structured 3D digital model files (.skp)"
      ]
    }
  ],

  deliverables: [
    {
      category: "Design Development",
      categoryTitleId: "Pengembangan Desain",
      categoryTitleEn: "Design Development",
      itemsId: [
        "Alternatif denah tata ruang fungsional",
        "Alternatif desain fasad & bentuk massa bangunan",
        "Moodboard material, warna & karakter ruang"
      ],
      itemsEn: [
        "Functional floor plan layout alternatives",
        "Building facade & massing design explorations",
        "Curated material, color & texture moodboards"
      ]
    },
    {
      category: "3D Visualization",
      categoryTitleId: "Visualisasi 3D & Sinematik",
      categoryTitleEn: "3D Visualization & Cinematic",
      itemsId: [
        "Render 3D fotorealistik tampak eksterior",
        "Render 3D detail setiap ruangan interior",
        "Video cinematic walkthrough berdurasi 2-3 menit"
      ],
      itemsEn: [
        "Photorealistic 3D exterior architecture perspectives",
        "Dedicated 3D renders for every major interior space",
        "2-3 minute cinematic video walkthrough"
      ]
    },
    {
      category: "Technical Documentation",
      categoryTitleId: "Dokumentasi Teknis (DED)",
      categoryTitleEn: "Technical Documentation (DED)",
      itemsId: [
        "File digital 3D SketchUp (.skp) terorganisir",
        "Gambar kerja denah, tampak, potongan arsitektur",
        "Gambar detail struktural & instalasi MEP",
        "Rencana Anggaran Biaya (RAB) estimasi pelaksanaan"
      ],
      itemsEn: [
        "Organized 3D SketchUp (.skp) master model",
        "Full architectural plans, elevations & section cuts",
        "Structural detail drawings & MEP engineering plans",
        "Detailed bill of quantities & cost estimate (RAB)"
      ]
    },
    {
      category: "Handover",
      categoryTitleId: "Penyerahan Hasil Proyek",
      categoryTitleEn: "Handover Deliverables",
      itemsId: [
        "Penyimpanan cloud digital melalui Google Drive",
        "Dokumen PDF buku panduan perancangan lengkap",
        "Buku Photobook Hardcover eksklusif dikirim ke alamat klien"
      ],
      itemsEn: [
        "Full digital cloud archive via Google Drive",
        "High-resolution comprehensive PDF design book",
        "Exclusive Hardcover Photobook delivered directly to client"
      ]
    }
  ],

  processSteps: [
    {
      step: "01",
      titleId: "Konsultasi & Karakter Lahan",
      titleEn: "Consultation & Site Context",
      descId: "Kami mendengarkan impian dan kebutuhan Anda secara mendalam, meneliti karakter lahan di pedesaan maupun perkotaan, orientasi iklim tropis, serta batasan anggaran.",
      descEn: "We listen deeply to your lifestyle desires, analyzing rural or urban site context, tropical microclimate orientations, and investment objectives."
    },
    {
      step: "02",
      titleId: "Eksplorasi Konsep & Tata Ruang",
      titleEn: "Concept & Spatial Zoning",
      descId: "Menyusun sketsa awal, alternatif denah fungsional, dan moodboard material untuk menemukan komposisi ruang terbaik yang menyeimbangkan fungsi dan estetika.",
      descEn: "Developing initial sketches, functional zoning options, and tactile moodboards to discover the optimal balance of purpose, light, and comfort."
    },
    {
      step: "03",
      titleId: "Visualisasi 3D Fotorealistik",
      titleEn: "3D Visualization & Refinement",
      descId: "Rancangan dihadirkan dalam visual 3D beresolusi tinggi dan simulasi pencahayaan alami, memberikan gambaran nyata suasana hunian sebelum dibangun.",
      descEn: "Transforming concepts into high-resolution 3D renders and natural lighting simulations, offering complete clarity of your future sanctuary."
    },
    {
      step: "04",
      titleId: "Gambar Kerja Teknis & RAB",
      titleEn: "Technical Drawings & Bill of Quantities",
      descId: "Penyusunan gambar kerja arsitektur, struktur, dan MEP secara presisi, disertai estimasi Rencana Anggaran Biaya (RAB) yang terukur dan realistis.",
      descEn: "Drafting rigorous architectural, structural, and MEP engineering drawings accompanied by realistic, structured budget estimations (RAB)."
    },
    {
      step: "05",
      titleId: "Penyerahan Berkas & Photobook",
      titleEn: "Handover & Hardcover Photobook",
      descId: "Penyerahan berkas digital lengkap melalui Google Drive, dokumen cetak, serta cinderamata eksklusif Photobook Hardcover karya rancang Anda.",
      descEn: "Delivering complete digital archives, print-ready documents, and an exclusive keepsake Hardcover Photobook celebrating your bespoke design."
    }
  ],

  values: [
    {
      num: "01",
      titleId: "Contextual Design",
      subtitleId: "Desain Kontekstual",
      descId: "Setiap desain lahir dari karakter lahan, budaya setempat, dan interaksi manusia dengan lingkungan pedesaan maupun perkotaan.",
      descEn: "Every design is born from site character, local culture, and human interaction within both rural tranquility and urban vibrancy."
    },
    {
      num: "02",
      titleId: "Functional Aesthetics",
      subtitleId: "Estetika Fungsional",
      descId: "Keindahan sejati hadir ketika kenyamanan, efisiensi sirkulasi, dan fungsi praktis menyatu selaras tanpa pemborosan ruang.",
      descEn: "True beauty emerges when daily comfort, effortless circulation, and practical utility unite without superfluous excess."
    },
    {
      num: "03",
      titleId: "Timeless Design",
      subtitleId: "Desain Abadi",
      descId: "Mengutamakan proporsi yang elegan dan material alami yang menua dengan anggun, tidak mudah usang oleh tren sesaat.",
      descEn: "Prioritizing timeless proportions and authentic materials that age gracefully, immune to fleeting seasonal trends."
    },
    {
      num: "04",
      titleId: "Human-Centered Approach",
      subtitleId: "Berpusat pada Kebahagiaan",
      descId: "Menempatkan kebahagiaan, kehangatan keluarga, dan kesehatan penghuni sebagai inti dari seluruh keputusan perancangan.",
      descEn: "Centering homeowner joy, intimate family warmth, and holistic wellbeing at the heart of every spatial choice."
    }
  ],

  i18n: {
    id: {
      navHome: "Beranda",
      navPortfolio: "Portofolio",
      navServices: "Layanan",
      navPhilosophy: "Filosofi",
      navDeliverables: "Deliverables",
      navProcess: "Tahapan Kerja",
      navContact: "Kontak",
      navStartProject: "Mulai Proyek",

      heroBadge: "Studio Arsitektur & Desain",
      heroHeadline: "Menciptakan Hunian yang Membawa Kebahagiaan.",
      heroSubheadline: "Perancangan arsitektur dan ruang fungsional yang lahir dari manusia, konteks lingkungan, dan estetika timeless.",
      heroCtaExplore: "Jelajahi Karya",
      heroCtaStart: "Konsultasi Proyek",
      heroStats1: "100% Desain Kustom",
      heroStats1Desc: "Sesuai kebutuhan & karakter lahan unik Anda",
      heroStats2: "Pedesaan & Perkotaan",
      heroStats2Desc: "Jangkauan perancangan seluruh wilayah Indonesia",
      heroStats3: "6 Disiplin Desain",
      heroStats3Desc: "Arsitektur, interior, fasad hingga visualisasi 3D",
      heroStats4: "Handover Lengkap",
      heroStats4Desc: "Gambar kerja, RAB, hingga photobook hardcover",

      introTag: "Tentang Studio",
      introTitle: "Arsitektur yang Bernyawa, Menghormati Alam & Memuliakan Kehidupan.",
      introParagraph1: "SEKALARUPA STUDIO merupakan studio arsitektur yang berfokus pada perancangan hunian modern, fungsional, dan estetis. Kami melayani kebutuhan desain untuk lanskap pedesaan yang asri maupun perkotaan yang dinamis di seluruh nusantara.",
      introParagraph2: "Kami percaya bahwa setiap ruang memiliki cerita dan karakter tersendiri. Berakar pada filosofi lokal Tatar Rupa Mawa Bagja, setiap garis rancang kami ditujukan untuk menghadirkan kebahagiaan sejati bagi pemiliknya.",

      worksTag: "Portofolio Pilihan",
      worksTitle: "Karya Arsitektur & Ruang Terpilih",
      worksSubtitle: "Koleksi perancangan hunian privat, paviliun peristirahatan, interior hangat, dan ruang komersial kontemporer.",
      filterAll: "Semua Karya",
      filterArch: "Arsitektur",
      filterInterior: "Interior",
      filterExterior: "Eksterior",
      filterCommercial: "Komersial",
      btnViewDetail: "Lihat Detail Proyek",

      servicesTag: "Layanan Desain",
      servicesTitle: "Keahlian Perancangan Multi-Disiplin",
      servicesSubtitle: "Setiap proyek memiliki keunikan tersendiri. Kami menyediakan layanan kustom yang fleksibel sesuai kebutuhan spesifik Anda.",
      btnConsultService: "Konsultasi Layanan Ini",
      constructionNoteTitle: "Catatan Mengenai Pembangunan Fisik (Konstruksi)",
      constructionNoteBody: "Fokus utama SEKALARUPA STUDIO adalah jasa perancangan dan perencanaan desain komprehensif. Untuk pelaksanaan fisik / pembangunan konstruksi di lapangan, studio dapat memberikan konsultasi dan koordinasi langsung sesuai kesepakatan proyek.",

      philosophyTag: "Filosofi Desain",
      philosophyTitle: "Tatar Rupa Mawa Bagja",
      philosophySubtitle: "Menciptakan ruang dan tata hunian yang membawa kebahagiaan.",
      philosophyBody1: "Dalam kebudayaan Nusantara, tata ruang bukan sekadar dinding dan atap. Tatar Rupa adalah seni menata wujud fisik agar selaras dengan ritme alam dan denyut kehidupan penghuni.",
      philosophyBody2: "Mawa Bagja adalah tujuannya: menghadirkan kebahagiaan mendalam, ketenangan batin saat pulang ke rumah, dan kehangatan abadi bagi generasi yang bertumbuh di dalamnya.",

      deliverablesTag: "Output & Standar Penyerahan",
      deliverablesTitle: "Apa yang Anda Dapatkan dalam Setiap Proyek",
      deliverablesSubtitle: "Setiap proyek diselesaikan dengan paket dokumen profesional, visualisasi fotorealistik, dan buku eksklusif cetak.",

      processTag: "Metodologi Kerja",
      processTitle: "Tahapan Menghadirkan Ruang Impian Anda",
      processSubtitle: "Langkah terstruktur dan transparan dari awal diskusi hingga penyerahan berkas siap bangun.",

      inquiryTag: "Mulai Proyek Anda",
      inquiryTitle: "Mari Bicarakan Ruang Impian Anda",
      inquirySubtitle: "Isi formulir ringkas di bawah ini. Sistem kami akan menyusun pesan kebutuhan proyek Anda dan membukanya langsung di WhatsApp untuk berdiskusi dengan tim studio.",
      formName: "Nama Lengkap *",
      formEmail: "Alamat Email *",
      formPhone: "Nomor WhatsApp / Telepon *",
      formServices: "Layanan yang Dibutuhkan * (Pilih satu atau lebih)",
      formType: "Tipe Proyek *",
      formLocation: "Lokasi Proyek (Kota / Karakter Lahan) *",
      formLandArea: "Estimasi Luas Lahan (m²)",
      formBuildingArea: "Estimasi Luas Bangunan (m²)",
      formBudget: "Estimasi Rencana Anggaran Desain",
      formConstruction: "Kebutuhan Layanan Konstruksi?",
      formRefLink: "Tautan Referensi (Pinterest, IG, Google Drive)",
      formNotes: "Ceritakan Kebutuhan & Impian Hunian Anda *",
      formSummaryHeader: "Pratinjau Pesan WhatsApp Otomatis:",
      btnSendWa: "Kirim via WhatsApp Resmi",
      formNotice: "Pesan akan dibuka di aplikasi WhatsApp atau WhatsApp Web Anda untuk Anda tinjau sebelum menekan tombol Kirim.",

      footerDesc: "Studio arsitektur berdedikasi menciptakan hunian modern, fungsional, dan estetis yang menghadirkan kebahagiaan.",
      footerQuickLinks: "Tautan Cepat",
      footerServices: "Layanan",
      footerContact: "Hubungi Studio",
      footerCopyright: "Hak Cipta Dilindungi Undang-Undang. SEKALARUPA STUDIO.",
      badgeOfficialWa: "WhatsApp Resmi: 087857523074",
      themeLight: "Mode Terang",
      themeDark: "Mode Gelap",
      bgOpacityLabel: "Opacity Latar:"
    },

    en: {
      navHome: "Home",
      navPortfolio: "Portfolio",
      navServices: "Services",
      navPhilosophy: "Philosophy",
      navDeliverables: "Deliverables",
      navProcess: "Process",
      navContact: "Contact",
      navStartProject: "Start a Project",

      heroBadge: "Architecture & Design Studio",
      heroHeadline: "Create a Home that brings happiness.",
      heroSubheadline: "Thoughtful architecture and functional design shaped by people, environmental context, and timeless aesthetics.",
      heroCtaExplore: "Explore Our Works",
      heroCtaStart: "Start a Project",
      heroStats1: "100% Tailored Design",
      heroStats1Desc: "Customized to your personal lifestyle & unique site",
      heroStats2: "Rural & Urban Context",
      heroStats2Desc: "Crafting architectural spaces across Indonesia",
      heroStats3: "6 Multi-Disciplines",
      heroStats3Desc: "Architecture, interiors, facades through 3D renders",
      heroStats4: "Complete Handover",
      heroStats4Desc: "Working drawings, BOQ, and hardcover photobook",

      introTag: "About The Studio",
      introTitle: "Living Architecture that Honors Nature & Elevates Everyday Life.",
      introParagraph1: "SEKALARUPA STUDIO is an architectural and spatial design practice dedicated to creating modern, functional, and deeply aesthetic dwellings. We cater to serene countryside landscapes as well as vibrant urban settings across Indonesia.",
      introParagraph2: "We believe every space has its own unique story and soul. Rooted in the philosophy 'Tatar Rupa Mawa Bagja', every architectural stroke we draw is guided by a singular mission: to bring authentic happiness to those who inhabit it.",

      worksTag: "Featured Portfolio",
      worksTitle: "Selected Architectural Works",
      worksSubtitle: "A curated curation of private residences, sanctuary villas, tactile interiors, and contemporary commercial venues.",
      filterAll: "All Works",
      filterArch: "Architecture",
      filterInterior: "Interior",
      filterExterior: "Exterior",
      filterCommercial: "Commercial",
      btnViewDetail: "View Project Details",

      servicesTag: "Design Services",
      servicesTitle: "Multi-Disciplinary Design Expertise",
      servicesSubtitle: "Each project is unique. We provide tailored scopes crafted specifically around your personal aspirations and site characteristics.",
      btnConsultService: "Consult This Service",
      constructionNoteTitle: "Notice Regarding Construction Services",
      constructionNoteBody: "SEKALARUPA STUDIO focuses primarily on comprehensive architectural and spatial design. For physical on-site construction, direct consultation and coordination can be arranged following custom project agreements.",

      philosophyTag: "Design Philosophy",
      philosophyTitle: "Tatar Rupa Mawa Bagja",
      philosophySubtitle: "Designing spaces and settlements that bring genuine happiness.",
      philosophyBody1: "In Indonesian architectural wisdom, space is far more than physical walls and roofs. 'Tatar Rupa' is the noble craft of shaping form so that it breathes in harmony with natural rhythms and the homeowner's lifestyle.",
      philosophyBody2: "'Mawa Bagja' is its true calling: cultivating enduring joy, a tranquil retreat to return to at dusk, and lasting warmth for generations growing within.",

      deliverablesTag: "Output & Handover Standard",
      deliverablesTitle: "What You Receive in Every Commission",
      deliverablesSubtitle: "Every design is delivered with rigorous technical documentation, photorealistic visual assets, and a bespoke print edition.",

      processTag: "Our Process",
      processTitle: "The Journey to Bringing Your Vision to Life",
      processSubtitle: "A structured, transparent workflow from initial conversation through to construction-ready documentation.",

      inquiryTag: "Start Your Project",
      inquiryTitle: "Let's Discuss Your Dream Space",
      inquirySubtitle: "Fill out the project brief form below. Our system will compose a structured project brief and open it directly in WhatsApp for an immediate consultation with our studio team.",
      formName: "Full Name *",
      formEmail: "Email Address *",
      formPhone: "WhatsApp / Phone Number *",
      formServices: "Services Needed * (Select one or more)",
      formType: "Project Type *",
      formLocation: "Project Location (City / Site Context) *",
      formLandArea: "Estimated Land Area (m²)",
      formBuildingArea: "Estimated Building Area (m²)",
      formBudget: "Estimated Design Budget Range",
      formConstruction: "Construction Service Needed?",
      formRefLink: "Reference Link (Pinterest, IG, Google Drive)",
      formNotes: "Describe Your Project Vision & Needs *",
      formSummaryHeader: "Live WhatsApp Message Preview:",
      btnSendWa: "Send via Official WhatsApp",
      formNotice: "This will open in your WhatsApp or WhatsApp Web for you to review before pressing Send.",

      footerDesc: "Architecture studio dedicated to creating modern, functional, and aesthetically timeless homes that bring happiness.",
      footerQuickLinks: "Quick Links",
      footerServices: "Services",
      footerContact: "Studio Contact",
      footerCopyright: "All Rights Reserved. SEKALARUPA STUDIO.",
      badgeOfficialWa: "Official WhatsApp: 087857523074",
      themeLight: "Light Mode",
      themeDark: "Dark Mode",
      bgOpacityLabel: "Backdrop Opacity:"
    }
  }
};
