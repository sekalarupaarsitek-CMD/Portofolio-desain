/**
 * SEKALARUPA STUDIO - Default Landing Page Visual Builder Schema
 * Faithfully mirrors all sections, content, and layout of index.html
 * PRD Reference: Sections 5.1, 5.2, 8, and 10.3
 */

const DEFAULT_LANDING_PAGE_SCHEMA = {
  version: 1,
  layout: 'canva-hybrid-grid',
  canvasSettings: {
    backgroundColor: '#F5F3EE',
    primaryColor: '#1E2221',
    accentColor: '#8B7355',
    fontHeading: 'Playfair Display',
    fontBody: 'Plus Jakarta Sans',
    freeDragMode: false
  },
  sections: [
    // 1. Header Navigation Bar
    {
      id: 'sec-header',
      type: 'header',
      title: 'Header & Main Navigation',
      props: {
        background: 'rgba(245, 243, 238, 0.95)',
        textColor: '#1E2221',
        paddingTop: 16,
        paddingBottom: 16,
        sticky: true
      },
      elements: [
        {
          id: 'elem-header-brand',
          type: 'brand',
          content: {
            title: 'SEKALARUPA',
            sub: 'STUDIO'
          },
          props: { fontSize: 20, letterSpacing: '0.12em' }
        },
        {
          id: 'elem-header-nav',
          type: 'navigation',
          content: {
            links: [
              { labelId: 'Beranda', labelEn: 'Home', url: '#home' },
              { labelId: 'Tentang', labelEn: 'About', url: '#about' },
              { labelId: 'Portofolio', labelEn: 'Portfolio', url: '#portfolio' },
              { labelId: 'Layanan', labelEn: 'Services', url: '#services' },
              { labelId: 'Filosofi', labelEn: 'Philosophy', url: '#philosophy' },
              { labelId: 'Deliverables', labelEn: 'Deliverables', url: '#deliverables' },
              { labelId: 'Tahapan', labelEn: 'Process', url: '#process' },
              { labelId: 'Kontak', labelEn: 'Contact', url: '#inquiry' }
            ]
          }
        },
        {
          id: 'elem-header-cta',
          type: 'button',
          content: {
            id: 'Mulai Proyek →',
            en: 'Start a Project →'
          },
          props: {
            variant: 'primary',
            url: '#inquiry'
          }
        }
      ]
    },

    // 2. Hero Section
    {
      id: 'sec-hero',
      type: 'hero',
      title: 'Hero Section (Beranda)',
      props: {
        background: '#1E2221',
        backgroundImage: 'assets/images/hero-architecture.jpg',
        overlayOpacity: 0.86,
        paddingTop: 110,
        paddingBottom: 80,
        textColor: '#FFFFFF'
      },
      elements: [
        {
          id: 'elem-hero-badge',
          type: 'badge',
          content: {
            badgeId: 'Studio Arsitektur & Desain',
            badgeEn: 'Architecture & Design Studio',
            philosophyId: 'Tatar Rupa Mawa Bagja',
            philosophyEn: 'Tatar Rupa Mawa Bagja'
          },
          props: { posX: 0, posY: 0 }
        },
        {
          id: 'elem-hero-headline',
          type: 'heading',
          content: {
            id: 'Create a Home that brings happiness.',
            en: 'Create a Home that brings happiness.'
          },
          props: {
            fontSize: 48,
            highlightWord: 'brings happiness.',
            maxWidth: 620,
            posX: 0,
            posY: 0
          }
        },
        {
          id: 'elem-hero-sub',
          type: 'paragraph',
          content: {
            id: 'Thoughtful architecture and design shaped by people, place, and purpose. Perancangan hunian modern tropis fungsional di pedesaan maupun perkotaan.',
            en: 'Thoughtful architecture and design shaped by people, place, and purpose. Functional contemporary sanctuaries across rural and urban landscapes.'
          },
          props: {
            fontSize: 16,
            maxWidth: 580,
            posX: 0,
            posY: 0
          }
        },
        {
          id: 'elem-hero-ctas',
          type: 'cta_group',
          content: {
            btn1: { id: 'Jelajahi Karya', en: 'Explore Works', url: '#portfolio' },
            btn2: { id: 'Konsultasi Proyek →', en: 'Consult Project →', url: '#inquiry' }
          },
          props: { posX: 0, posY: 0 }
        },
        {
          id: 'elem-hero-visual',
          type: 'hero_visual_card',
          content: {
            image: 'assets/images/hero-night-residence.jpg',
            projectTitle: 'Nocturne Pine Pavilion',
            location: 'Lembang, Bandung',
            area: '520 m²',
            typology: 'Highland Sanctuary'
          },
          props: { posX: 0, posY: 0 }
        },
        {
          id: 'elem-hero-ribbon',
          type: 'ribbon_stats',
          content: {
            items: [
              { numId: '100% Desain Kustom', numEn: '100% Custom Design', descId: 'Sesuai kebutuhan & karakter lahan unik Anda', descEn: 'Tailored to your bespoke site contours and lifestyle' },
              { numId: 'Pedesaan & Perkotaan', numEn: 'Rural & Urban', descId: 'Jangkauan perancangan seluruh wilayah Indonesia', descEn: 'Nationwide coverage across Indonesia' },
              { numId: '6 Disiplin Desain', numEn: '6 Design Disciplines', descId: 'Arsitektur, interior, fasad hingga visualisasi 3D', descEn: 'Architecture, interior, facade to 3D visualization' },
              { numId: 'Handover Lengkap', numEn: 'Full Handover', descId: 'Gambar kerja, RAB, hingga photobook hardcover', descEn: 'Technical drawings, budget plan & luxury photobook' }
            ]
          },
          props: { background: 'rgba(255,255,255,0.06)' }
        }
      ]
    },

    // 3. Studio Introduction & Core Values
    {
      id: 'sec-about',
      type: 'about_values',
      title: 'Tentang Studio & Nilai Utama',
      props: {
        background: '#F5F3EE',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-about-tag',
          type: 'tag',
          content: { id: 'Tentang Studio', en: 'About Studio' }
        },
        {
          id: 'elem-about-title',
          type: 'heading',
          content: {
            id: 'Arsitektur yang Bernyawa, Menghormati Alam & Memuliakan Kehidupan.',
            en: 'Living Architecture, Honoring Nature & Elevating Everyday Living.'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-about-narrative',
          type: 'narrative',
          content: {
            leadId: 'SEKALARUPA STUDIO merupakan studio arsitektur yang berfokus pada perancangan hunian modern, fungsional, dan estetis di pedesaan maupun perkotaan di seluruh nusantara.',
            leadEn: 'SEKALARUPA STUDIO is an architectural practice specializing in bespoke contemporary residences balancing functional utility and timeless aesthetics across Indonesia.',
            bodyId: 'Kami percaya bahwa setiap ruang memiliki cerita dan karakter tersendiri. Berakar pada filosofi lokal Tatar Rupa Mawa Bagja, setiap garis rancang kami ditujukan untuk menghadirkan kebahagiaan sejati bagi pemiliknya.',
            bodyEn: 'We believe every sanctuary embodies a distinct narrative and character. Rooted in the timeless Sundanese wisdom of Tatar Rupa Mawa Bagja, every architectural stroke fosters peace and genuine joy.'
          }
        },
        {
          id: 'elem-about-quote',
          type: 'quote_card',
          content: {
            quoteId: 'Tatar Rupa Mawa Bagja.',
            quoteEn: 'Tatar Rupa Mawa Bagja.',
            authorId: 'Menciptakan ruang dan hunian yang membawa kebahagiaan',
            authorEn: 'Designing spaces and settlements that bring genuine happiness and harmony'
          }
        },
        {
          id: 'elem-about-values-grid',
          type: 'values_grid',
          content: {
            values: [
              { num: '01', titleId: 'Contextual Design', titleEn: 'Contextual Design', descId: 'Desain lahir dari karakter lingkungan, kontur tapak, dan iklim tropis setempat.', descEn: 'Bespoke designs shaped by local microclimates, topography, and cultural context.' },
              { num: '02', titleId: 'Functional Aesthetics', titleEn: 'Functional Aesthetics', descId: 'Keseimbangan harmonis antara fungsi kenyamanan ruang dan estetika visual yang abadi.', descEn: 'Harmonious balance between spatial utility, acoustic calmness, and visual beauty.' },
              { num: '03', titleId: 'Timeless Design', titleEn: 'Timeless Design', descId: 'Mengutamakan desain elegan yang bertahan melintasi waktu tanpa kehilangan karakternya.', descEn: 'Enduring architecture crafted with honest materials that age gracefully over generations.' },
              { num: '04', titleId: 'Human-Centered Approach', titleEn: 'Human-Centered Approach', descId: 'Menempatkan kebahagiaan, kenyamanan, dan kehangatan penghuni di pusat perancangan.', descEn: 'Placing family well-being, tactile serenity, and joyful living at the core of every space.' }
            ]
          }
        }
      ]
    },

    // 4. Portfolio Showcase
    {
      id: 'sec-portfolio',
      type: 'portfolio',
      title: 'Portofolio Pilihan (Asymmetric Grid)',
      props: {
        background: '#FAF8F5',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-portfolio-tag',
          type: 'tag',
          content: { id: 'Portofolio Pilihan', en: 'Featured Portfolio' }
        },
        {
          id: 'elem-portfolio-title',
          type: 'heading',
          content: {
            id: 'Karya Arsitektur & Ruang Terpilih',
            en: 'Selected Architectural & Spatial Works'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-portfolio-sub',
          type: 'paragraph',
          content: {
            id: 'Koleksi perancangan hunian privat, paviliun peristirahatan, interior hangat, dan ruang komersial kontemporer.',
            en: 'A curated collection of private sanctuaries, countryside pavilions, warm tactile interiors, and commercial spaces.'
          }
        },
        {
          id: 'elem-portfolio-filters',
          type: 'filter_pills',
          content: {
            filters: [
              { key: 'all', labelId: 'Semua Karya', labelEn: 'All Works' },
              { key: 'architecture', labelId: 'Arsitektur', labelEn: 'Architecture' },
              { key: 'interior', labelId: 'Interior', labelEn: 'Interior' },
              { key: 'exterior', labelId: 'Eksterior', labelEn: 'Exterior' },
              { key: 'commercial', labelId: 'Komersial', labelEn: 'Commercial' }
            ]
          }
        },
        {
          id: 'elem-portfolio-dynamic-grid',
          type: 'dynamic_projects_grid',
          props: {
            limit: 6,
            asymmetricalLayout: true,
            showMeta: true
          }
        }
      ]
    },

    // 5. Services Section
    {
      id: 'sec-services',
      type: 'services',
      title: 'Layanan Desain Multi-Disiplin',
      props: {
        background: '#F5F3EE',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-services-tag',
          type: 'tag',
          content: { id: 'Layanan Desain', en: 'Design Services' }
        },
        {
          id: 'elem-services-title',
          type: 'heading',
          content: {
            id: 'Keahlian Perancangan Multi-Disiplin',
            en: 'Comprehensive Multi-Disciplinary Practice'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-services-sub',
          type: 'paragraph',
          content: {
            id: 'Setiap proyek memiliki keunikan tersendiri. Kami menyediakan layanan kustom yang fleksibel sesuai kebutuhan spesifik Anda.',
            en: 'Every project possesses singular characteristics. We tailor each engagement to your specific requirements.'
          }
        },
        {
          id: 'elem-services-dynamic-grid',
          type: 'dynamic_services_grid',
          props: { columns: 3 }
        },
        {
          id: 'elem-services-notice',
          type: 'construction_notice',
          content: {
            titleId: 'Catatan Mengenai Pembangunan Fisik (Konstruksi)',
            titleEn: 'Notice Regarding Physical Construction',
            bodyId: 'Fokus utama SEKALARUPA STUDIO adalah jasa perancangan dan perencanaan desain komprehensif. Untuk pelaksanaan fisik / pembangunan konstruksi di lapangan, studio dapat memberikan konsultasi dan koordinasi langsung sesuai kesepakatan proyek.',
            bodyEn: 'SEKALARUPA STUDIO primarily focuses on comprehensive architectural planning and design. For on-site physical construction execution, our team provides consultation and field supervision based on custom project agreements.'
          }
        }
      ]
    },

    // 6. Philosophy Section
    {
      id: 'sec-philosophy',
      type: 'philosophy',
      title: 'Filosofi Tatar Rupa Mawa Bagja',
      props: {
        background: '#191918',
        textColor: '#FFFFFF',
        paddingTop: 100,
        paddingBottom: 100
      },
      elements: [
        {
          id: 'elem-philo-tag',
          type: 'tag',
          content: { id: 'Filosofi Desain', en: 'Design Philosophy' }
        },
        {
          id: 'elem-philo-headline',
          type: 'heading',
          content: { id: 'Tatar Rupa Mawa Bagja', en: 'Tatar Rupa Mawa Bagja' },
          props: { fontSize: 44, color: '#D8CBB8' }
        },
        {
          id: 'elem-philo-sub',
          type: 'paragraph',
          content: {
            id: 'Menciptakan ruang dan tata hunian yang membawa kebahagiaan.',
            en: 'Designing spaces and settlements that bring genuine happiness and harmony.'
          },
          props: { fontSize: 18, color: '#FFFFFF' }
        },
        {
          id: 'elem-philo-body',
          type: 'paragraph',
          content: {
            id: 'Dalam kebudayaan Nusantara, tata ruang bukan sekadar dinding dan atap. Tatar Rupa adalah seni menata wujud fisik agar selaras dengan ritme alam dan denyut kehidupan penghuni. Mawa Bagja adalah tujuannya: menghadirkan kebahagiaan mendalam, ketenangan batin saat pulang ke rumah, dan kehangatan abadi bagi generasi yang bertumbuh di dalamnya.',
            en: 'In Indonesian philosophy, spatial planning transcends walls and roofs. Tatar Rupa is the noble art of harmonizing physical form with natural rhythms. Mawa Bagja is its ultimate purpose: evoking profound contentment, emotional sanctuary upon returning home, and enduring warmth for generations.'
          },
          props: { fontSize: 15, color: '#C4C0B6', lineHeight: 1.8 }
        },
        {
          id: 'elem-philo-visual',
          type: 'philosophy_visual',
          content: {
            image: 'assets/images/project-facade-detail.jpg',
            quote: 'Setiap ruang memiliki cerita dan karakter tersendiri yang lahir dari manusia dan alam sekitarnya.'
          }
        }
      ]
    },

    // 7. Deliverables & Handover
    {
      id: 'sec-deliverables',
      type: 'deliverables',
      title: 'Output & Standar Penyerahan',
      props: {
        background: '#FAF8F5',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-deliv-tag',
          type: 'tag',
          content: { id: 'Output & Standar Penyerahan', en: 'Deliverables & Standards' }
        },
        {
          id: 'elem-deliv-title',
          type: 'heading',
          content: {
            id: 'Apa yang Anda Dapatkan dalam Setiap Proyek',
            en: 'Comprehensive Deliverables Included in Every Project'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-deliv-sub',
          type: 'paragraph',
          content: {
            id: 'Setiap proyek diselesaikan dengan paket dokumen profesional, visualisasi fotorealistik, dan buku eksklusif cetak.',
            en: 'Every project concludes with professional technical drawings, photorealistic perspectives, and an exclusive hardcover photobook.'
          }
        },
        {
          id: 'elem-deliv-showcase',
          type: 'deliverables_layout',
          content: {
            boxes: [
              {
                titleId: 'Pengembangan Desain',
                titleEn: 'Design Development',
                items: ['Alternatif denah tata ruang fungsional', 'Alternatif desain fasad & massa bangunan', 'Moodboard material & pencahayaan']
              },
              {
                titleId: 'Visualisasi 3D',
                titleEn: '3D Visualization',
                items: ['Render eksterior resolusi ultra tinggi', 'Render setiap ruangan interior', 'Video cinematic walkthrough 2-3 menit']
              },
              {
                titleId: 'Dokumentasi Teknis',
                titleEn: 'Technical Documentation',
                items: ['Master file 3D SketchUp (.skp) rapi', 'Gambar kerja denah, tampak & potongan (DED)', 'Rencana Anggaran Biaya (RAB)']
              },
              {
                titleId: 'Penyerahan Hasil',
                titleEn: 'Handover & Archive',
                items: ['Digital Cloud Archive (Google Drive)', 'PDF master presentation lengkap', 'Hardcover Photobook eksklusif cetak']
              }
            ],
            photobookImage: 'assets/images/deliverables-photobook.jpg',
            photobookTitle: 'Buku Hardcover Eksklusif',
            photobookDesc: 'Setiap klien menerima cinderamata photobook mewah yang mendokumentasikan karya rancangan hunian Anda.'
          }
        }
      ]
    },

    // 8. Design Process Timeline
    {
      id: 'sec-process',
      type: 'process',
      title: 'Tahapan Kerja & Metodologi',
      props: {
        background: '#F5F3EE',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-process-tag',
          type: 'tag',
          content: { id: 'Metodologi Kerja', en: 'Design Methodology' }
        },
        {
          id: 'elem-process-title',
          type: 'heading',
          content: {
            id: 'Tahapan Menghadirkan Ruang Impian Anda',
            en: 'Step-by-Step Design Journey'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-process-sub',
          type: 'paragraph',
          content: {
            id: 'Langkah terstruktur dan transparan dari awal diskusi hingga penyerahan berkas siap bangun.',
            en: 'A transparent, collaborative workflow from initial visioning to final construction-ready handover.'
          }
        },
        {
          id: 'elem-process-timeline',
          type: 'process_timeline',
          content: {
            steps: [
              { num: '01', titleId: 'Konsultasi Awal & Penyelaman Kebutuhan', titleEn: 'Discovery & Consultation', descId: 'Diskusi intensif mengenai impian ruang, gaya hidup keluarga, budget, dan analisis orientasi lahan.', descEn: 'In-depth consultation covering your vision, spatial requirements, lifestyle patterns, and site contour study.' },
              { num: '02', titleId: 'Konsep Desain & Alternatif Denah', titleEn: 'Spatial Concept & Layouts', descId: 'Eksplorasi zonasi denah 2D, hubungan antar-ruang, sirkulasi udara alami, dan bukaan pencahayaan.', descEn: 'Developing functional 2D zoning floor plans, natural daylighting cross-ventilation strategies.' },
              { num: '03', titleId: 'Pengembangan Massa 3D & Material', titleEn: '3D Form & Material Studies', descId: 'Visualisasi 3D fotorealistik siang dan malam, pengujian tekstur material, fasad, dan tata lanskap.', descEn: 'High-fidelity 3D modeling exploring daytime and twilight atmospheres, tactile material palettes.' },
              { num: '04', titleId: 'Dokumentasi Gambar Kerja DED & RAB', titleEn: 'Technical DED & Cost Estimation', descId: 'Penyusunan gambar kerja teknis komprehensif (Arsitektur, Struktur, MEP) dan estimasi biaya konstruksi.', descEn: 'Comprehensive construction drawings (Architectural, Structural, MEP) and detailed Bill of Quantities.' },
              { num: '05', titleId: 'Penyerahan Berkas & Hardcover Book', titleEn: 'Project Handover & Photobook', descId: 'Serah terima seluruh berkas digital master cloud dan pengiriman buku photobook hardcover eksklusif.', descEn: 'Final handover via digital cloud repository and direct delivery of the luxury commemorative photobook.' }
            ]
          }
        }
      ]
    },

    // 9. Interactive Inquiry & WhatsApp Generator
    {
      id: 'sec-inquiry',
      type: 'inquiry',
      title: 'Formulir Konsultasi & Generator WhatsApp',
      props: {
        background: '#FAF8F5',
        textColor: '#1E2221',
        paddingTop: 90,
        paddingBottom: 90
      },
      elements: [
        {
          id: 'elem-inquiry-tag',
          type: 'tag',
          content: { id: 'Mulai Proyek Anda', en: 'Start Your Journey' }
        },
        {
          id: 'elem-inquiry-title',
          type: 'heading',
          content: {
            id: 'Mari Bicarakan Ruang Impian Anda',
            en: 'Let Us Shape Your Dream Sanctuary'
          },
          props: { fontSize: 36 }
        },
        {
          id: 'elem-inquiry-sub',
          type: 'paragraph',
          content: {
            id: 'Isi formulir ringkas di bawah ini. Sistem kami akan menyusun pesan kebutuhan proyek Anda dan membukanya langsung di WhatsApp untuk berdiskusi dengan tim studio.',
            en: 'Fill in the brief form. Our system formats your requirements and launches direct WhatsApp consultation with our principal architects.'
          }
        },
        {
          id: 'elem-inquiry-interactive-card',
          type: 'inquiry_interactive_card',
          props: {
            studioPhone: '087857523074',
            studioWa: '6287857523074'
          }
        }
      ]
    },

    // 10. Footer Section
    {
      id: 'sec-footer',
      type: 'footer',
      title: 'Footer & Informasi Kontak',
      props: {
        background: '#191918',
        textColor: '#FFFFFF',
        paddingTop: 70,
        paddingBottom: 30
      },
      elements: [
        {
          id: 'elem-footer-brand',
          type: 'footer_brand',
          content: {
            brandName: 'SEKALARUPA STUDIO',
            tagline: 'Create a Home that brings happiness.',
            sundanesePhilosophy: 'Tatar Rupa Mawa Bagja.',
            location: 'Bandung & Nationwide (Indonesia)',
            whatsapp: '087857523074',
            instagram: '@sekalarupa.arsitek'
          }
        }
      ]
    }
  ]
};

module.exports = {
  DEFAULT_LANDING_PAGE_SCHEMA
};
