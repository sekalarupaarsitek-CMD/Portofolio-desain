/**
 * SEKALARUPA STUDIO - Main Interactive Controller
 * PRD Reference: Sections 5.1, 5.2, 6 (Inquiry System), 9 (Multilingual)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current active language & theme
  let currentLang = 'id';
  let activeFilter = 'all';
  let currentTheme = localStorage.getItem('sekalarupa-theme') || 'light';

  // DOM Elements
  const header = document.querySelector('.site-header');
  const langBtns = document.querySelectorAll('.lang-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectsGrid = document.getElementById('projectsGrid');
  const servicesGrid = document.getElementById('servicesGrid');
  const processTimeline = document.getElementById('processTimeline');
  const valuesGrid = document.getElementById('valuesGrid');

  // Theme & Opacity elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
  const mobileThemeLabel = document.getElementById('mobileThemeLabel');
  const bgOpacitySlider = document.getElementById('bgOpacitySlider');
  const opacityValDisplay = document.getElementById('opacityValDisplay');

  // Inquiry Form & WhatsApp Preview elements
  const inquiryForm = document.getElementById('inquiryForm');
  const waPreviewBox = document.getElementById('waPreviewBox');
  const sendWaBtn = document.getElementById('sendWaBtn');
  const servicePillLabels = document.querySelectorAll('.service-pill-label');

  // Modal elements
  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBody = document.getElementById('modalBody');

  // Mobile Drawer elements
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  /* --------------------------------------------------------------------------
     Theme Management (Mode Terang & Mode Gelap)
     -------------------------------------------------------------------------- */
  function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sekalarupa-theme', theme);

    updateThemeButtonText();
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }

  function updateThemeButtonText() {
    if (themeLabel) {
      if (currentTheme === 'light') {
        themeLabel.textContent = currentLang === 'id' ? 'Mode Gelap' : 'Dark Mode';
      } else {
        themeLabel.textContent = currentLang === 'id' ? 'Mode Terang' : 'Light Mode';
      }
    }
    if (mobileThemeLabel) {
      if (currentTheme === 'light') {
        mobileThemeLabel.textContent = currentLang === 'id' ? 'Ganti ke Mode Gelap' : 'Switch to Dark Mode';
      } else {
        mobileThemeLabel.textContent = currentLang === 'id' ? 'Ganti ke Mode Terang' : 'Switch to Light Mode';
      }
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (mobileThemeToggleBtn) {
    mobileThemeToggleBtn.addEventListener('click', toggleTheme);
  }

  /* --------------------------------------------------------------------------
     Hero Background Opacity Control
     -------------------------------------------------------------------------- */
  if (bgOpacitySlider && opacityValDisplay) {
    bgOpacitySlider.addEventListener('input', (e) => {
      const val = e.target.value;
      const alpha = (val / 100).toFixed(2);
      document.documentElement.style.setProperty('--hero-bg-overlay-opacity', alpha);
      opacityValDisplay.textContent = `${val}%`;
    });
  }

  /* --------------------------------------------------------------------------
     1. Header Scroll & ScrollSpy
     -------------------------------------------------------------------------- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateScrollSpy();
  });

  function updateScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      const navLink = document.querySelector(`.desktop-nav a[href="#${id}"]`);

      if (navLink) {
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.desktop-nav a').forEach(a => a.classList.remove('active'));
          navLink.classList.add('active');
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. Language Switcher (ID <-> EN)
     -------------------------------------------------------------------------- */
  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    // Update buttons
    langBtns.forEach(btn => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update all static i18n text
    const dict = SITE_DATA.i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Re-render dynamic sections with the new language
    renderValues();
    renderProjects();
    renderServices();
    renderProcess();
    updateWhatsAppPreview();
    updateThemeButtonText();
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  /* --------------------------------------------------------------------------
     3. Render Core Brand Values (PRD 1.2 & 5.2 Section 2)
     -------------------------------------------------------------------------- */
  function renderValues() {
    if (!valuesGrid) return;
    valuesGrid.innerHTML = '';

    SITE_DATA.values.forEach(v => {
      const card = document.createElement('div');
      card.className = 'value-card';
      const desc = currentLang === 'id' ? v.descId : v.descEn;
      card.innerHTML = `
        <div class="value-number">${v.num}</div>
        <div class="value-title">${v.titleId}</div>
        <div class="value-subtitle">${v.subtitleId}</div>
        <p class="value-desc">${desc}</p>
      `;
      valuesGrid.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
     4. Render Projects & Asymmetrical Layout (PRD 5.2 Section 3 & 5.3)
     -------------------------------------------------------------------------- */
  const layoutSpans = ['span-7', 'span-5', 'span-6', 'span-6', 'span-5', 'span-7'];

  function renderProjects() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';

    const filtered = SITE_DATA.projects.filter(p => {
      if (activeFilter === 'all') return true;
      return p.categoryKey.toLowerCase() === activeFilter.toLowerCase();
    });

    filtered.forEach((p, idx) => {
      const spanClass = layoutSpans[idx % layoutSpans.length];
      const card = document.createElement('article');
      card.className = `project-card ${spanClass}`;
      card.setAttribute('data-id', p.id);

      const desc = currentLang === 'id' ? p.descriptionId : p.descriptionEn;

      card.innerHTML = `
        <div class="project-thumb-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy" />
          <span class="project-category-badge">${p.category}</span>
        </div>
        <div class="project-content">
          <div class="project-meta-row">
            <span>${p.location}</span>
            <span>${p.year}</span>
          </div>
          <h3 class="project-card-title">${p.title}</h3>
          <p class="project-card-tagline">${p.tagline}</p>
          <div class="project-specs-list">
            <div class="project-spec-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span>${p.typology}</span>
            </div>
            <div class="project-spec-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="m3 9 18 0"/><path d="m9 3 0 18"/></svg>
              <span>${p.buildingArea}</span>
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openProjectModal(p);
      });

      projectsGrid.appendChild(card);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderProjects();
    });
  });

  /* --------------------------------------------------------------------------
     5. Render Services (PRD 5.2 Section 4 & 4.1)
     -------------------------------------------------------------------------- */
  function renderServices() {
    if (!servicesGrid) return;
    servicesGrid.innerHTML = '';

    const btnLabel = currentLang === 'id' ? 'Konsultasi Layanan Ini' : 'Consult This Service';

    SITE_DATA.services.forEach(s => {
      const card = document.createElement('div');
      card.className = 'service-card';

      const title = currentLang === 'id' ? s.titleId : s.titleEn;
      const desc = currentLang === 'id' ? s.descId : s.descEn;
      const scopeList = currentLang === 'id' ? s.scopeId : s.scopeEn;

      const scopeHtml = scopeList.map(item => `<li>${item}</li>`).join('');

      card.innerHTML = `
        <div class="service-card-top">
          <span class="service-num">${s.num}</span>
          <h3 class="service-title">${title}</h3>
          <p class="service-desc">${desc}</p>
          <ul class="service-scope-list">
            ${scopeHtml}
          </ul>
        </div>
        <div class="service-card-bottom">
          <button class="btn btn-outline btn-sm consult-service-btn" data-service="${s.id}">
            ${btnLabel} &rarr;
          </button>
        </div>
      `;

      const consultBtn = card.querySelector('.consult-service-btn');
      if (consultBtn) {
        consultBtn.addEventListener('click', () => {
          selectServiceAndScroll(s.id);
        });
      }

      servicesGrid.appendChild(card);
    });
  }

  function selectServiceAndScroll(serviceId) {
    // Check corresponding pill in inquiry form
    servicePillLabels.forEach(label => {
      const checkbox = label.querySelector('input');
      if (checkbox.value === serviceId) {
        checkbox.checked = true;
        label.classList.add('checked');
      }
    });

    updateWhatsAppPreview();

    // Scroll to inquiry section
    const inquirySec = document.getElementById('inquiry');
    if (inquirySec) {
      inquirySec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* --------------------------------------------------------------------------
     6. Render Design Process (PRD 5.2 Section 7)
     -------------------------------------------------------------------------- */
  function renderProcess() {
    if (!processTimeline) return;
    processTimeline.innerHTML = '';

    SITE_DATA.processSteps.forEach(p => {
      const stepCard = document.createElement('div');
      stepCard.className = 'process-card';

      const title = currentLang === 'id' ? p.titleId : p.titleEn;
      const desc = currentLang === 'id' ? p.descId : p.descEn;

      stepCard.innerHTML = `
        <div class="process-step-num">${p.step}</div>
        <h4 class="process-title">${title}</h4>
        <p class="process-desc">${desc}</p>
      `;

      processTimeline.appendChild(stepCard);
    });
  }

  /* --------------------------------------------------------------------------
     7. Project Quick-View Modal
     -------------------------------------------------------------------------- */
  function openProjectModal(p) {
    if (!projectModal || !modalBody) return;

    const desc = currentLang === 'id' ? p.descriptionId : p.descriptionEn;
    const deliverablesList = p.deliverables.map(d => `
      <li>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${d}
      </li>
    `).join('');

    const consultText = currentLang === 'id' ? 'Konsultasi Proyek Serupa' : 'Inquire Similar Project';

    modalBody.innerHTML = `
      <img src="${p.image}" alt="${p.title}" class="modal-project-img" />
      <div class="modal-project-header">
        <div class="modal-project-meta">
          <span>${p.category}</span>
          <span>•</span>
          <span>${p.location}</span>
          <span>•</span>
          <span>Tahun ${p.year}</span>
        </div>
        <h2 class="modal-project-title">${p.title}</h2>
        <p class="modal-project-tagline">${p.tagline}</p>
      </div>

      <p class="modal-project-desc">${desc}</p>

      <div class="modal-specs-grid">
        <div class="modal-spec-col">
          <div class="modal-spec-label">Typology</div>
          <div class="modal-spec-val">${p.typology}</div>
        </div>
        <div class="modal-spec-col">
          <div class="modal-spec-label">Site Area</div>
          <div class="modal-spec-val">${p.siteArea}</div>
        </div>
        <div class="modal-spec-col">
          <div class="modal-spec-label">Building Area</div>
          <div class="modal-spec-val">${p.buildingArea}</div>
        </div>
        <div class="modal-spec-col">
          <div class="modal-spec-label">Status</div>
          <div class="modal-spec-val">Completed / Built</div>
        </div>
      </div>

      <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: var(--accent-charcoal);">
        ${currentLang === 'id' ? 'Output & Deliverables Proyek Ini:' : 'Project Deliverables Included:'}
      </h4>
      <ul class="modal-deliverables-list">
        ${deliverablesList}
      </ul>

      <div style="text-align: right; margin-top: 20px;">
        <button class="btn btn-primary" id="modalInquireBtn">
          ${consultText} &rarr;
        </button>
      </div>
    `;

    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Hook the Inquire button inside modal
    document.getElementById('modalInquireBtn')?.addEventListener('click', () => {
      closeProjectModal();
      selectServiceAndScroll(p.categoryKey);
    });
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        closeProjectModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeMobileDrawer();
    }
  });

  /* --------------------------------------------------------------------------
     8. Project Inquiry Form & WhatsApp Generator (PRD Section 6)
     -------------------------------------------------------------------------- */
  // Toggle checkbox style for service pills
  servicePillLabels.forEach(label => {
    const input = label.querySelector('input');
    label.addEventListener('click', () => {
      setTimeout(() => {
        if (input.checked) {
          label.classList.add('checked');
        } else {
          label.classList.remove('checked');
        }
        updateWhatsAppPreview();
      }, 10);
    });
  });

  // Listen to input changes to update preview in real-time
  if (inquiryForm) {
    inquiryForm.addEventListener('input', updateWhatsAppPreview);
    inquiryForm.addEventListener('change', updateWhatsAppPreview);
  }

  function getFormData() {
    const name = document.getElementById('clientName')?.value.trim() || '';
    const email = document.getElementById('clientEmail')?.value.trim() || '';
    const phone = document.getElementById('clientPhone')?.value.trim() || '';
    const projectType = document.getElementById('projectType')?.value || '';
    const location = document.getElementById('projectLocation')?.value.trim() || '';
    const landArea = document.getElementById('landArea')?.value.trim() || '';
    const buildingArea = document.getElementById('buildingArea')?.value.trim() || '';
    const budget = document.getElementById('estimatedBudget')?.value || '';
    const construction = document.getElementById('constructionRequirement')?.value || '';
    const refLink = document.getElementById('referenceLink')?.value.trim() || '';
    const notes = document.getElementById('projectNotes')?.value.trim() || '';

    // Selected services
    const checkedServices = [];
    document.querySelectorAll('.service-pill-label input:checked').forEach(cb => {
      checkedServices.push(cb.getAttribute('data-name') || cb.value);
    });

    return {
      name, email, phone,
      services: checkedServices.join(', ') || (currentLang === 'id' ? '[Belum Dipilih]' : '[Not Selected]'),
      projectType, location, landArea, buildingArea, budget, construction, refLink, notes
    };
  }

  function composeWhatsAppMessage(data) {
    if (currentLang === 'id') {
      let msg = `Halo SEKALARUPA STUDIO,\n\nSaya ingin berkonsultasi mengenai perancangan proyek desain.\n\n`;
      msg += `Nama: ${data.name || '[Nama Anda]'}\n`;
      msg += `Kontak: ${data.phone || '[Nomor Telepon]'}${data.email ? ' | ' + data.email : ''}\n`;
      msg += `Layanan: ${data.services}\n`;
      msg += `Tipe Proyek: ${data.projectType || '[Pilih Tipe Proyek]'}\n`;
      msg += `Lokasi Proyek: ${data.location || '[Lokasi / Kota]'}\n`;
      if (data.landArea) msg += `Luas Lahan: ${data.landArea} m²\n`;
      if (data.buildingArea) msg += `Luas Bangunan: ${data.buildingArea} m²\n`;
      if (data.budget) msg += `Estimasi Budget: ${data.budget}\n`;
      if (data.construction) msg += `Kebutuhan Konstruksi: ${data.construction}\n`;
      if (data.refLink) msg += `Tautan Referensi: ${data.refLink}\n`;
      msg += `\nDeskripsi Kebutuhan:\n${data.notes || '[Ceritakan konsep dan impian ruang Anda]'}\n\n`;
      msg += `Saya ingin mendiskusikan proyek ini lebih lanjut.\nTerima kasih.`;
      return msg;
    } else {
      let msg = `Hello SEKALARUPA STUDIO,\n\nI would like to discuss a design project.\n\n`;
      msg += `Name: ${data.name || '[Your Name]'}\n`;
      msg += `Contact: ${data.phone || '[Phone Number]'}${data.email ? ' | ' + data.email : ''}\n`;
      msg += `Service: ${data.services}\n`;
      msg += `Project Type: ${data.projectType || '[Select Project Type]'}\n`;
      msg += `Location: ${data.location || '[Location / City]'}\n`;
      if (data.landArea) msg += `Land Area: ${data.landArea} m²\n`;
      if (data.buildingArea) msg += `Building Area: ${data.buildingArea} m²\n`;
      if (data.budget) msg += `Budget: ${data.budget}\n`;
      if (data.construction) msg += `Construction Requirement: ${data.construction}\n`;
      if (data.refLink) msg += `Reference Link: ${data.refLink}\n`;
      msg += `\nProject Description:\n${data.notes || '[Describe your space vision and requirements]'}\n\n`;
      msg += `I would like to discuss this project further.\nThank you.`;
      return msg;
    }
  }

  function updateWhatsAppPreview() {
    if (!waPreviewBox) return;
    const data = getFormData();
    const msg = composeWhatsAppMessage(data);
    waPreviewBox.textContent = msg;
  }

  // Handle WhatsApp Submission (PRD Section 6.1 & 6.3)
  if (sendWaBtn) {
    sendWaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const data = getFormData();

      // Basic validation
      if (!data.name) {
        alert(currentLang === 'id' ? 'Mohon masukkan Nama Lengkap Anda.' : 'Please enter your Full Name.');
        document.getElementById('clientName')?.focus();
        return;
      }
      if (!data.phone) {
        alert(currentLang === 'id' ? 'Mohon masukkan nomor WhatsApp / Telepon Anda.' : 'Please enter your WhatsApp/Phone number.');
        document.getElementById('clientPhone')?.focus();
        return;
      }

      // Save to backend database and open WhatsApp
      const payload = {
        clientName: data.name,
        whatsapp: data.phone,
        email: data.email,
        location: data.location || 'Indonesia',
        serviceKey: data.services,
        landArea: data.landArea,
        buildingArea: data.buildingArea,
        timeline: data.projectType,
        description: data.notes
      };

      // Asynchronously submit to backend
      fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.waUrl) {
          window.open(res.waUrl, '_blank', 'noopener,noreferrer');
        } else {
          // Fallback direct URL
          const rawMsg = composeWhatsAppMessage(data);
          const encodedMsg = encodeURIComponent(rawMsg);
          const targetPhone = SITE_DATA.brand.whatsappNumberOnly;
          window.open(`https://wa.me/${targetPhone}?text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
        }
      })
      .catch(() => {
        // Offline fallback
        const rawMsg = composeWhatsAppMessage(data);
        const encodedMsg = encodeURIComponent(rawMsg);
        const targetPhone = SITE_DATA.brand.whatsappNumberOnly;
        window.open(`https://wa.me/${targetPhone}?text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
      });
    });
  }

  /* --------------------------------------------------------------------------
     9. Mobile Drawer Menu
     -------------------------------------------------------------------------- */
  function openMobileDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileDrawer);
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeMobileDrawer);
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileDrawer);
  });

  /* --------------------------------------------------------------------------
     10. Initial Bootstrapping
     -------------------------------------------------------------------------- */
  setTheme(currentTheme);
  setLanguage('id');

  if (bgOpacitySlider && opacityValDisplay) {
    const defaultVal = currentTheme === 'dark' ? 78 : 86;
    bgOpacitySlider.value = defaultVal;
    opacityValDisplay.textContent = `${defaultVal}%`;
    document.documentElement.style.setProperty('--hero-bg-overlay-opacity', (defaultVal / 100).toFixed(2));
  }

  // Synchronize with backend API if server is running
  async function loadDynamicBackendData() {
    try {
      const res = await fetch(`/api/public/projects?locale=${currentLang}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        SITE_DATA.projects = data.data.map(p => ({
          id: p.slug,
          title: p.title,
          tagline: p.tagline,
          category: p.categories?.[0]?.name || p.projectType,
          categoryKey: p.categories?.[0]?.slug || 'architecture',
          location: p.location,
          year: p.year,
          siteArea: p.landArea || '-',
          buildingArea: p.buildingArea || '-',
          typology: p.projectType,
          image: p.coverImage,
          featured: p.isFeatured,
          descriptionId: p.description,
          descriptionEn: p.description,
          deliverables: p.deliverables || []
        }));
        renderProjects();
      }
    } catch (e) {
      // Offline fallback silent
    }
  }

  loadDynamicBackendData();
});
