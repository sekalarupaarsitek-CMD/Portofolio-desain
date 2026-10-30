/**
 * SEKALARUPA STUDIO - Canva-Style Flexible Visual Page Builder Engine
 * PRD Reference: Section 8 (Hybrid Visual Page Builder) & Section 10.3
 * 
 * Features:
 * - 100% tailored to Sekalarupa Studio Landing Page (index.html)
 * - Canva-style bounding box, resize handles, and floating action toolbar
 * - Flexible drag & shift movement (transform offsets posX, posY)
 * - Section reordering (Up/Down and drag)
 * - Live double-click inline text editing (contenteditable)
 * - Canvas workspace Pan & Zoom (40% - 200%, Fit, 100%)
 * - Viewport switcher (Desktop 1280px, Tablet 768px, Mobile 375px)
 * - 4 Left sidebar drawers: Sections Catalog, Element Palette, Layers Tree, Global Settings
 * - Live Properties Inspector with bilingual ID/EN content editing
 * - Full Undo/Redo & Autosave integration
 */

const BuilderEngine = {
  pageKey: 'home',
  locale: 'id',
  viewport: 'desktop',
  zoom: 1.0,
  isPanMode: false,
  isPanning: false,
  freeDragMode: true,
  panStartX: 0,
  panStartY: 0,
  scrollStartX: 0,
  scrollStartY: 0,

  selectedSectionIndex: null,
  selectedElementIndex: null,
  activeTab: 'sections',

  schema: {
    version: 1,
    layout: 'canva-hybrid-grid',
    canvasSettings: {
      backgroundColor: '#F5F3EE',
      primaryColor: '#1E2221',
      accentColor: '#8B7355',
      fontHeading: 'Playfair Display',
      fontBody: 'Plus Jakarta Sans',
      freeDragMode: true
    },
    sections: []
  },

  history: [],
  historyIndex: -1,
  isDirty: false,
  autosaveTimer: null,

  // Dragging state
  isDragging: false,
  dragTarget: null, // { type: 'section'|'element', sIdx, eIdx }
  dragStartX: 0,
  dragStartY: 0,
  initialPosX: 0,
  initialPosY: 0,

  async init(pageKey = 'home', locale = 'id') {
    this.pageKey = pageKey;
    this.locale = locale;
    await this.loadPage();
    this.bindEvents();
    this.bindTabs();
    this.renderSectionsCatalog();
    this.render();
  },

  /* --------------------------------------------------------------------------
     1. Data Loading & Persistence
     -------------------------------------------------------------------------- */
  async loadPage() {
    try {
      this.setAutosaveStatus('Memuat halaman dari database...', 'saving');
      const res = await AdminAPI.get(`/api/admin/pages/${this.pageKey}/builder?locale=${this.locale}`);
      if (res.success && res.data) {
        this.schema = res.data.content || { version: 1, layout: 'canva-hybrid-grid', sections: [] };
        if (!this.schema.sections) this.schema.sections = [];
        this.recordHistory('Muat Halaman');
        this.setAutosaveStatus('✓ Tersimpan di database', 'saved');
      }
    } catch (err) {
      console.error('[Builder Load Error]', err);
      AdminApp.showToast('Gagal memuat builder: ' + err.message, 'error');
      this.setAutosaveStatus('Gagal memuat', '');
    }
  },

  async save(action = 'draft', isSilent = false) {
    try {
      this.setAutosaveStatus('Menyimpan perubahan...', 'saving');
      const res = await AdminAPI.put(`/api/admin/pages/${this.pageKey}/builder`, {
        locale: this.locale,
        content: this.schema,
        action,
        notes: action === 'publish' ? 'Dipublikasikan langsung melalui Canva Visual Builder' : 'Draft autosave visual builder'
      });

      if (res.success) {
        this.isDirty = false;
        const msg = action === 'publish' ? `✓ Dipublikasikan (v${res.versionNumber})` : `✓ Tersimpan sebagai Draft (v${res.versionNumber})`;
        this.setAutosaveStatus(msg, 'saved');
        if (!isSilent) {
          AdminApp.showToast(action === 'publish' ? 'Halaman utama berhasil dipublikasikan secara langsung!' : 'Draft perubahan kanvas berhasil disimpan.');
        }
      }
    } catch (err) {
      console.error('[Builder Save Error]', err);
      this.setAutosaveStatus('Gagal menyimpan', '');
      if (!isSilent) AdminApp.showToast('Gagal menyimpan: ' + err.message, 'error');
    }
  },

  triggerAutosave() {
    this.setAutosaveStatus('Perubahan belum tersimpan...', 'saving');
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.save('draft', true);
    }, 2200);
  },

  setAutosaveStatus(text, stateClass = '') {
    const el = document.getElementById('builderAutosaveStatus');
    if (el) {
      el.textContent = text;
      el.className = 'builder-status-pill ' + stateClass;
    }
  },

  recordHistory(action) {
    this.isDirty = true;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({
      action,
      snapshot: JSON.parse(JSON.stringify(this.schema)),
      timestamp: Date.now()
    });
    this.historyIndex = this.history.length - 1;
    this.triggerAutosave();
  },

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.schema = JSON.parse(JSON.stringify(this.history[this.historyIndex].snapshot));
      this.render();
      AdminApp.showToast(`Undo: ${this.history[this.historyIndex].action}`);
    } else {
      AdminApp.showToast('Tidak ada riwayat untuk di-undo', 'info');
    }
  },

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.schema = JSON.parse(JSON.stringify(this.history[this.historyIndex].snapshot));
      this.render();
      AdminApp.showToast(`Redo: ${this.history[this.historyIndex].action}`);
    } else {
      AdminApp.showToast('Sudah pada versi terbaru', 'info');
    }
  },

  /* --------------------------------------------------------------------------
     2. Event Listeners & UI Binding
     -------------------------------------------------------------------------- */
  bindEvents() {
    // Viewport switchers
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setViewport(btn.dataset.device);
      };
    });

    // Toolbar Buttons
    const saveDraftBtn = document.getElementById('builderSaveDraftBtn');
    if (saveDraftBtn) saveDraftBtn.onclick = () => this.save('draft');

    const publishBtn = document.getElementById('builderPublishBtn');
    if (publishBtn) publishBtn.onclick = () => this.save('publish');

    const undoBtn = document.getElementById('builderUndoBtn');
    if (undoBtn) undoBtn.onclick = () => this.undo();

    const redoBtn = document.getElementById('builderRedoBtn');
    if (redoBtn) redoBtn.onclick = () => this.redo();

    const historyBtn = document.getElementById('builderHistoryBtn');
    if (historyBtn) historyBtn.onclick = () => this.openHistoryModal();

    const localeSelect = document.getElementById('builderLocaleSelect');
    if (localeSelect) {
      localeSelect.value = this.locale;
      localeSelect.onchange = (e) => {
        this.locale = e.target.value;
        this.loadPage().then(() => this.render());
      };
    }

    // Zoom & Pan Workspace Controls
    const zoomInBtn = document.getElementById('canvaZoomInBtn');
    if (zoomInBtn) zoomInBtn.onclick = () => this.setZoom(this.zoom + 0.1);

    const zoomOutBtn = document.getElementById('canvaZoomOutBtn');
    if (zoomOutBtn) zoomOutBtn.onclick = () => this.setZoom(this.zoom - 0.1);

    const zoom100Btn = document.getElementById('canvaZoom100Btn');
    if (zoom100Btn) zoom100Btn.onclick = () => this.setZoom(1.0);

    const zoomFitBtn = document.getElementById('canvaZoomFitBtn');
    if (zoomFitBtn) zoomFitBtn.onclick = () => this.fitCanvas();

    const panToolBtn = document.getElementById('canvaPanToolBtn');
    if (panToolBtn) {
      panToolBtn.onclick = () => {
        this.isPanMode = !this.isPanMode;
        panToolBtn.classList.toggle('active', this.isPanMode);
        const wrapper = document.getElementById('builderCanvasWrapper');
        if (wrapper) wrapper.classList.toggle('pan-mode', this.isPanMode);
      };
    }

    const freeDragToggle = document.getElementById('canvaFreeDragToggle');
    if (freeDragToggle) {
      freeDragToggle.onclick = () => {
        this.freeDragMode = !this.freeDragMode;
        freeDragToggle.classList.toggle('active', this.freeDragMode);
        AdminApp.showToast(this.freeDragMode ? 'Mode Bebas Aktif: Elemen dapat digeser fleksibel' : 'Mode Rapi Aktif: Elemen mengikuti susunan dokumen');
        this.render();
      };
    }

    // Workspace Pan Dragging
    const wrapper = document.getElementById('builderCanvasWrapper');
    if (wrapper) {
      wrapper.onmousedown = (e) => {
        if (this.isPanMode) {
          this.isPanning = true;
          this.panStartX = e.clientX;
          this.panStartY = e.clientY;
          this.scrollStartX = wrapper.scrollLeft;
          this.scrollStartY = wrapper.scrollTop;
          e.preventDefault();
        }
      };

      window.addEventListener('mousemove', (e) => {
        if (this.isPanning) {
          const dx = e.clientX - this.panStartX;
          const dy = e.clientY - this.panStartY;
          wrapper.scrollLeft = this.scrollStartX - dx;
          wrapper.scrollTop = this.scrollStartY - dy;
        }

        // Handle Active Element Dragging
        if (this.isDragging && this.dragTarget) {
          this.handleElementDragMove(e);
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isPanning) this.isPanning = false;
        if (this.isDragging) this.endElementDrag();
      });
    }

    // Palette Items Click to Add Element
    document.querySelectorAll('#builderPaneElements .palette-item').forEach(item => {
      item.onclick = () => {
        const elType = item.dataset.element;
        this.addElement(elType);
      };
    });

    // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Escape, Delete)
    window.onkeydown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.key === 'Escape') {
        this.deselectAll();
      } else if (e.key === 'Delete' && (this.selectedSectionIndex !== null || this.selectedElementIndex !== null)) {
        if (this.selectedElementIndex !== null) {
          this.deleteElement(this.selectedSectionIndex, this.selectedElementIndex);
        } else if (this.selectedSectionIndex !== null) {
          this.deleteSection(this.selectedSectionIndex);
        }
      }
    };
  },

  bindTabs() {
    const tabBtns = document.querySelectorAll('.builder-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        this.activeTab = tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.builder-tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById('builderPane' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (pane) pane.classList.add('active');

        if (tab === 'layers') this.renderLayersTree();
        if (tab === 'settings') this.renderGlobalSettings();
      };
    });
  },

  setViewport(device) {
    this.viewport = device;
    const canvas = document.getElementById('builderCanvas');
    if (!canvas) return;
    canvas.className = 'builder-canvas';
    if (device === 'tablet') canvas.classList.add('device-tablet');
    if (device === 'mobile') canvas.classList.add('device-mobile');
  },

  setZoom(val) {
    val = Math.max(0.4, Math.min(2.0, parseFloat(val.toFixed(2))));
    this.zoom = val;
    const container = document.getElementById('builderCanvasContainer');
    const display = document.getElementById('canvaZoomDisplay');
    if (container) container.style.transform = `scale(${val})`;
    if (display) display.textContent = `${Math.round(val * 100)}%`;
  },

  fitCanvas() {
    const wrapper = document.getElementById('builderCanvasWrapper');
    if (!wrapper) return;
    const availableWidth = wrapper.clientWidth - 80;
    const targetWidth = this.viewport === 'mobile' ? 375 : this.viewport === 'tablet' ? 768 : 1280;
    const optimalZoom = Math.min(1.0, availableWidth / targetWidth);
    this.setZoom(optimalZoom);
  },

  deselectAll() {
    this.selectedSectionIndex = null;
    this.selectedElementIndex = null;
    this.render();
  },

  /* --------------------------------------------------------------------------
     3. Left Sidebar: Landing Page Sections Catalog
     -------------------------------------------------------------------------- */
  renderSectionsCatalog() {
    const container = document.getElementById('builderSectionsCatalog');
    if (!container) return;

    const catalog = [
      {
        type: 'header',
        title: 'Header & Main Nav',
        desc: 'Navigasi sticky, logo Sekalarupa Studio, dan tombol Mulai Proyek',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>'
      },
      {
        type: 'hero',
        title: 'Hero Cover (Beranda)',
        desc: 'Full-bleed architecture image, Tatar Rupa pill, headline, ribbon stats',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      },
      {
        type: 'about_values',
        title: 'Tentang & 4 Nilai Utama',
        desc: 'Narasi editorial filosofi Tatar Rupa Mawa Bagja & 4 core brand values',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      },
      {
        type: 'portfolio_showcase',
        title: 'Portofolio Karya',
        desc: 'Filter karya arsitektur, interior, eksterior & visual card asimetris',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
      },
      {
        type: 'services_offerings',
        title: 'Layanan Desain Studio',
        desc: '6 lingkup jasa arsitektur, interior, fasad & nota klarifikasi konstruksi',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
      },
      {
        type: 'philosophy_statement',
        title: 'Filosofi Tatar Rupa',
        desc: 'Statement arsitektur bernyawa, makna mendalam, dan roster screen',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'
      },
      {
        type: 'deliverables_grid',
        title: 'Output & Deliverables',
        desc: 'Visualisasi 3D, dokumen teknis, master SKP & hardcover photobook',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
      },
      {
        type: 'process_timeline',
        title: 'Tahapan Metodologi Kerja',
        desc: '5 milestone terstruktur dari diskusi awal hingga penyerahan berkas',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
      },
      {
        type: 'inquiry_generator',
        title: 'Inquiry & WhatsApp Form',
        desc: 'Form kebutuhan klien & generator pesan WhatsApp otomatis',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      },
      {
        type: 'footer',
        title: 'Footer Studio',
        desc: 'Brand identitas, tautan cepat, sosial media dan hak cipta',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="15" width="18" height="6" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>'
      },
      {
        type: 'custom_section',
        title: 'Section Custom Baru',
        desc: 'Section bebas untuk menata heading, paragraf, gambar dan tombol sendiri',
        icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
      }
    ];

    container.innerHTML = catalog.map(item => `
      <div class="section-catalog-card" onclick="BuilderEngine.addSection('${item.type}')">
        <div class="section-catalog-icon">${item.icon}</div>
        <div style="flex: 1;">
          <div class="section-catalog-title">${item.title}</div>
          <div class="section-catalog-desc">${item.desc}</div>
        </div>
        <button class="btn btn-xs btn-outline" style="flex-shrink:0;">+ Tambah</button>
      </div>
    `).join('');
  },

  /* --------------------------------------------------------------------------
     4. Main Canvas Rendering
     -------------------------------------------------------------------------- */
  render() {
    const canvas = document.getElementById('builderCanvas');
    if (!canvas) return;

    canvas.innerHTML = '';

    if (!this.schema.sections || this.schema.sections.length === 0) {
      canvas.innerHTML = `
        <div style="padding: 6rem 2rem; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">✦</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--text-main); margin-bottom: 0.5rem;">Kanvas Halaman Masih Kosong</h3>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem;">Pilih section dari panel sebelah kiri atau muat template landing page Sekalarupa Studio.</p>
          <button class="btn btn-primary" onclick="BuilderEngine.resetToLandingPageTemplate()">Muat Template Lengkap Landing Page</button>
        </div>
      `;
      this.renderLayersTree();
      this.renderProperties();
      return;
    }

    // Render all sections
    this.schema.sections.forEach((section, sIdx) => {
      const secWrapper = document.createElement('div');
      const isSecSelected = (this.selectedSectionIndex === sIdx && this.selectedElementIndex === null);

      secWrapper.className = `canva-block canva-section-block ${isSecSelected ? 'canva-selected' : ''}`;
      secWrapper.dataset.sectionIdx = sIdx;
      secWrapper.id = section.id || `sec-${sIdx}`;

      // Section-level transform positioning
      const posX = section.props?.posX || 0;
      const posY = section.props?.posY || 0;
      if (posX !== 0 || posY !== 0) {
        secWrapper.style.transform = `translate(${posX}px, ${posY}px)`;
      }

      // Canva Resize Handles (for section height/padding)
      secWrapper.innerHTML = `
        <div class="canva-handle canva-handle-tl" data-handle="tl"></div>
        <div class="canva-handle canva-handle-tr" data-handle="tr"></div>
        <div class="canva-handle canva-handle-br" data-handle="br"></div>
        <div class="canva-handle canva-handle-bl" data-handle="bl"></div>
        <div class="canva-handle-edge canva-handle-t" data-handle="t"></div>
        <div class="canva-handle-edge canva-handle-b" data-handle="b"></div>

        <!-- Floating Action Toolbar for Section -->
        <div class="canva-action-toolbar" id="toolbar-sec-${sIdx}">
          <span class="canva-toolbar-btn canva-drag-handle" title="Tahan & geser untuk memindahkan posisi section">
            ✥ Geser Section
          </span>
          <button class="canva-toolbar-btn" title="Pindah ke Atas" onclick="BuilderEngine.moveSection(${sIdx}, -1); event.stopPropagation();">↑</button>
          <button class="canva-toolbar-btn" title="Pindah ke Bawah" onclick="BuilderEngine.moveSection(${sIdx}, 1); event.stopPropagation();">↓</button>
          <button class="canva-toolbar-btn" title="Duplikasi Section" onclick="BuilderEngine.duplicateSection(${sIdx}); event.stopPropagation();">❐</button>
          <button class="canva-toolbar-btn" title="Reset Posisi (0,0)" onclick="BuilderEngine.resetPosition(${sIdx}); event.stopPropagation();">↺ 0,0</button>
          <button class="canva-toolbar-btn" style="color: #FF8A8A;" title="Hapus Section" onclick="BuilderEngine.deleteSection(${sIdx}); event.stopPropagation();">🗑</button>
          <span class="canva-coord-tag">X: ${posX}px, Y: ${posY}px</span>
        </div>
      `;

      // Render Section Inner HTML based on authentic Landing Page fidelity
      const innerContent = this.renderSectionContent(section, sIdx);
      secWrapper.appendChild(innerContent);

      // Section Click Selection
      secWrapper.onclick = (e) => {
        e.stopPropagation();
        this.selectSection(sIdx);
      };

      // Drag Handle Mousedown for Section
      const dragHandle = secWrapper.querySelector('.canva-drag-handle');
      if (dragHandle) {
        dragHandle.onmousedown = (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.startElementDrag(e, sIdx, null);
        };
      }

      canvas.appendChild(secWrapper);
    });

    this.renderLayersTree();
    this.renderProperties();
  },

  /* --------------------------------------------------------------------------
     5. Authentic Landing Page Section Content Renderers
     -------------------------------------------------------------------------- */
  renderSectionContent(section, sIdx) {
    const wrapper = document.createElement('div');
    const p = section.props || {};

    wrapper.style.paddingTop = (p.paddingTop ?? 70) + 'px';
    wrapper.style.paddingBottom = (p.paddingBottom ?? 70) + 'px';
    wrapper.style.backgroundColor = p.background || '#F5F3EE';
    wrapper.style.color = p.textColor || '#1E2221';
    wrapper.style.position = 'relative';

    if (p.backgroundImage) {
      const op = p.overlayOpacity !== undefined ? p.overlayOpacity : 0.85;
      wrapper.style.backgroundImage = `linear-gradient(rgba(30,34,33,${op}), rgba(30,34,33,${op})), url(${p.backgroundImage})`;
      wrapper.style.backgroundSize = 'cover';
      wrapper.style.backgroundPosition = 'center';
      wrapper.style.color = '#FFFFFF';
    }

    // 1. Header Navigation Section
    if (section.type === 'header') {
      wrapper.style.paddingTop = '14px';
      wrapper.style.paddingBottom = '14px';
      wrapper.style.backgroundColor = p.background || 'rgba(245, 243, 238, 0.98)';
      wrapper.style.borderBottom = '1px solid rgba(0,0,0,0.06)';

      wrapper.innerHTML = `
        <div class="container" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="brand-logo canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="brand-title" style="font-family:var(--font-serif); font-weight:700; font-size:1.2rem; letter-spacing:0.12em; color:var(--text-main);" data-editable="true" data-field="brand">${section.elements?.[0]?.content?.title || 'SEKALARUPA'}</span>
            <span class="brand-sub" style="font-size:0.68rem; letter-spacing:0.2em; color:var(--accent-color); margin-left:4px;">${section.elements?.[0]?.content?.sub || 'STUDIO'}</span>
          </div>

          <div class="nav-links" style="display:flex; gap:1.75rem; align-items:center;">
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-main); cursor:pointer;">Beranda</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Tentang</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Portofolio</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Layanan</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Filosofi</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Deliverables</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-muted); cursor:pointer;">Kontak</span>
          </div>

          <div class="canva-block" ${this.elemAttrs(sIdx, 2)}>
            <span class="btn btn-primary btn-sm" style="pointer-events:none;">${this.getLocalizedText(section.elements?.[2]?.content, 'Mulai Proyek →')}</span>
          </div>
        </div>
      `;
      return wrapper;
    }

    // 2. Hero Section
    if (section.type === 'hero') {
      const badge = section.elements?.find(e => e.id === 'elem-hero-badge') || section.elements?.[0];
      const headline = section.elements?.find(e => e.id === 'elem-hero-headline') || section.elements?.[1];
      const subhead = section.elements?.find(e => e.id === 'elem-hero-subheadline') || section.elements?.[2];

      wrapper.className = 'hero-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="hero-grid">
            <!-- Left Hero Content Column -->
            <div class="hero-content">
              <div class="hero-badge-wrap canva-block" ${this.elemAttrs(sIdx, 0)}>
                <span class="hero-badge" data-editable="true">${this.getLocalizedText(badge?.content?.badgeId || badge?.content, 'Studio Arsitektur & Desain')}</span>
                <span class="hero-philosophy-pill">${this.getLocalizedText(badge?.content?.philosophyId || 'Tatar Rupa Mawa Bagja')}</span>
              </div>

              <h1 class="hero-headline canva-block" ${this.elemAttrs(sIdx, 1)} data-editable="true" style="${this.elemTransform(headline)}">
                ${this.getLocalizedText(headline?.content, 'Create a Home that <span class="highlight-word">brings happiness.</span>')}
              </h1>

              <p class="hero-subheadline canva-block" ${this.elemAttrs(sIdx, 2)} data-editable="true" style="${this.elemTransform(subhead)}">
                ${this.getLocalizedText(subhead?.content, 'Thoughtful architecture and design shaped by people, place, and purpose.')}
              </p>

              <div class="hero-ctas canva-block" ${this.elemAttrs(sIdx, 3)}>
                <span class="btn btn-primary" style="pointer-events:none;">Jelajahi Karya</span>
                <span class="btn btn-outline" style="pointer-events:none; color:#FFFFFF; border-color:rgba(255,255,255,0.4);">Konsultasi Proyek &rarr;</span>
              </div>
            </div>

            <!-- Right Hero Visual Frame -->
            <div class="hero-visual canva-block" ${this.elemAttrs(sIdx, 4)}>
              <div class="hero-image-frame">
                <img src="assets/images/hero-night-residence.jpg" alt="Nocturne Pine Pavilion" />
              </div>
              <div class="hero-image-card">
                <div class="hero-card-project-title">Nocturne Pine Pavilion</div>
                <div class="hero-card-meta">
                  <span>Lembang, Bandung</span> • <span>520 m²</span> • <span>Highland Sanctuary</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Studio Highlights Ribbon -->
          <div class="hero-ribbon" style="margin-top: 3.5rem;">
            <div class="ribbon-grid">
              <div class="ribbon-item">
                <div class="ribbon-item-num">100% Desain Kustom</div>
                <div class="ribbon-item-desc">Sesuai kebutuhan & karakter lahan unik Anda</div>
              </div>
              <div class="ribbon-item">
                <div class="ribbon-item-num">Pedesaan & Perkotaan</div>
                <div class="ribbon-item-desc">Jangkauan perancangan seluruh wilayah Indonesia</div>
              </div>
              <div class="ribbon-item">
                <div class="ribbon-item-num">6 Disiplin Desain</div>
                <div class="ribbon-item-desc">Arsitektur, interior, fasad hingga visualisasi 3D</div>
              </div>
              <div class="ribbon-item">
                <div class="ribbon-item-num">Handover Lengkap</div>
                <div class="ribbon-item-desc">Gambar kerja, RAB, hingga photobook hardcover</div>
              </div>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 3. About & 4 Core Values Section
    if (section.type === 'about_values') {
      const titleElem = section.elements?.[0];
      const leadElem = section.elements?.[1];
      const quoteElem = section.elements?.[2];

      wrapper.className = 'intro-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="intro-editorial-grid">
            <div class="canva-block" ${this.elemAttrs(sIdx, 0)} style="${this.elemTransform(titleElem)}">
              <span class="section-tag">Tentang Studio</span>
              <h2 class="section-title" data-editable="true">
                ${this.getLocalizedText(titleElem?.content, 'Arsitektur yang Bernyawa, Menghormati Alam & Memuliakan Kehidupan.')}
              </h2>
            </div>
            <div class="intro-narrative">
              <p class="text-editorial-lead canva-block" ${this.elemAttrs(sIdx, 1)} data-editable="true" style="${this.elemTransform(leadElem)}">
                ${this.getLocalizedText(leadElem?.content, 'SEKALARUPA STUDIO merupakan studio arsitektur yang berfokus pada perancangan hunian modern, fungsional, dan estetis.')}
              </p>
              <div class="intro-quote-card canva-block" ${this.elemAttrs(sIdx, 2)} style="${this.elemTransform(quoteElem)}">
                <div class="intro-quote-text" data-editable="true">"${this.getLocalizedText(quoteElem?.content?.quote || quoteElem?.content, 'Tatar Rupa Mawa Bagja.')}"</div>
                <div class="intro-quote-author">Menciptakan ruang dan hunian yang membawa kebahagiaan</div>
              </div>
            </div>
          </div>

          <!-- 4 Core Brand Values Grid -->
          <div class="values-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1.5rem; margin-top:3rem;">
            <div class="value-card" style="background:#FFF; padding:1.75rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:600;">01</span>
              <h4 style="margin:0.5rem 0 0.4rem; font-size:1.1rem;">Kontekstual & Selaras Alam</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.6;">Menghargai topografi, iklim tropis, dan orientasi cahaya matahari.</p>
            </div>
            <div class="value-card" style="background:#FFF; padding:1.75rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:600;">02</span>
              <h4 style="margin:0.5rem 0 0.4rem; font-size:1.1rem;">Fungsional & Keseharian</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.6;">Setiap sudut dirancang untuk mendukung ritme hidup nyata penghuni.</p>
            </div>
            <div class="value-card" style="background:#FFF; padding:1.75rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:600;">03</span>
              <h4 style="margin:0.5rem 0 0.4rem; font-size:1.1rem;">Estetika Bertumbuh</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.6;">Material alami yang menua dengan anggun seiring berjalannya waktu.</p>
            </div>
            <div class="value-card" style="background:#FFF; padding:1.75rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:600;">04</span>
              <h4 style="margin:0.5rem 0 0.4rem; font-size:1.1rem;">Transparansi & Kejelasan</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.6;">Dokumentasi gambar kerja mendalam dan perhitungan biaya terukur.</p>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 4. Featured Portfolio Showcase Section
    if (section.type === 'portfolio_showcase') {
      wrapper.className = 'projects-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="section-header canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="section-tag">Portofolio Pilihan</span>
            <h2 class="section-title" data-editable="true">${this.getLocalizedText(section.elements?.[0]?.content?.title || 'Karya Arsitektur & Ruang Terpilih')}</h2>
            <p class="section-subtitle">${this.getLocalizedText(section.elements?.[0]?.content?.subtitle || 'Koleksi perancangan hunian privat, paviliun peristirahatan, dan interior hangat.')}</p>
          </div>

          <div class="projects-filter-bar">
            <button class="filter-btn active">Semua Karya</button>
            <button class="filter-btn">Arsitektur</button>
            <button class="filter-btn">Interior</button>
            <button class="filter-btn">Eksterior</button>
            <button class="filter-btn">Komersial</button>
          </div>

          <div class="projects-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:2rem;">
            <div class="project-card canva-block" ${this.elemAttrs(sIdx, 1)} style="background:#FFF; border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
              <img src="assets/images/hero-night-residence.jpg" style="width:100%; height:240px; object-fit:cover;" />
              <div style="padding:1.5rem;">
                <span style="font-size:0.72rem; letter-spacing:0.12em; color:var(--accent-color); font-weight:700;">ARCHITECTURE • BANDUNG</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; margin:0.4rem 0;">Nocturne Pine Pavilion</h3>
                <p style="font-size:0.84rem; color:var(--text-muted);">Hunian peristirahatan di tengah hutan pinus Lembang dengan bukaan luas dan fasad kayu ulin.</p>
              </div>
            </div>

            <div class="project-card canva-block" ${this.elemAttrs(sIdx, 2)} style="background:#FFF; border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
              <img src="assets/images/project-residence-urban.jpg" style="width:100%; height:240px; object-fit:cover;" />
              <div style="padding:1.5rem;">
                <span style="font-size:0.72rem; letter-spacing:0.12em; color:var(--accent-color); font-weight:700;">ARCHITECTURE • JAKARTA</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; margin:0.4rem 0;">Lumina Courtyard House</h3>
                <p style="font-size:0.84rem; color:var(--text-muted);">Hunian perkotaan tropis dengan inner courtyard bernafas yang memaksimalkan sirkulasi udara.</p>
              </div>
            </div>

            <div class="project-card canva-block" ${this.elemAttrs(sIdx, 3)} style="background:#FFF; border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
              <img src="assets/images/project-villa-rural.jpg" style="width:100%; height:240px; object-fit:cover;" />
              <div style="padding:1.5rem;">
                <span style="font-size:0.72rem; letter-spacing:0.12em; color:var(--accent-color); font-weight:700;">VILLA • SUKABUMI</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; margin:0.4rem 0;">Lembah Bagja Sanctuary</h3>
                <p style="font-size:0.84rem; color:var(--text-muted);">Villa peristirahatan lereng bukit berorientasi lembah hijau dengan material batu kali dan kayu jati.</p>
              </div>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 5. Services Section
    if (section.type === 'services_offerings') {
      wrapper.className = 'services-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="section-header canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="section-tag">Layanan Desain</span>
            <h2 class="section-title" data-editable="true">${this.getLocalizedText(section.elements?.[0]?.content?.title || 'Keahlian Perancangan Multi-Disiplin')}</h2>
            <p class="section-subtitle">${this.getLocalizedText(section.elements?.[0]?.content?.subtitle || 'Layanan terintegrasi mulai dari perancangan arsitektur, interior, hingga gambar kerja teknis.')}</p>
          </div>

          <div class="services-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem;">
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">01</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Perancangan Arsitektur</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Perancangan menyeluruh hunian tinggal, villa privat, paviliun, dan bangunan komersial.</p>
            </div>
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">02</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Desain Eksterior & Fasad</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Eksplorasi fasad bernafas, secondary skin, serta pemilihan material alam yang tahan cuaca.</p>
            </div>
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">03</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Desain Interior & Ruang</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Penataan ruang dalam yang ergonomis, hangat, pemilihan perabot kustom, dan mood pencahayaan.</p>
            </div>
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">04</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Visualisasi 3D & Walkthrough</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Render fotorealistik resolusi tinggi dan animasi video sinematik penjelajahan ruang.</p>
            </div>
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">05</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Gambar Kerja & RAB</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Paket dokumen konstruksi lengkap arsitektur, struktur, MEP, dan estimasi biaya siap bangun.</p>
            </div>
            <div class="service-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.25rem; color:var(--accent-color); font-weight:600;">06</span>
              <h3 style="margin:0.5rem 0 0.5rem; font-size:1.2rem;">Konsultasi & Tata Ruang</h3>
              <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.6;">Pendampingan perencanaan zonasi lahan, renovasi bangunan, dan optimalisasi bukaan.</p>
            </div>
          </div>

          <div class="construction-notice-box" style="margin-top:2.5rem;">
            <div class="construction-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="construction-notice-content">
              <h4>Catatan Mengenai Pembangunan Fisik (Konstruksi)</h4>
              <p>Fokus utama SEKALARUPA STUDIO adalah jasa perancangan dan perencanaan desain komprehensif. Untuk pelaksanaan fisik di lapangan, studio dapat memberikan konsultasi dan koordinasi langsung sesuai kesepakatan proyek.</p>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 6. Philosophy Statement Section
    if (section.type === 'philosophy_statement') {
      wrapper.className = 'philosophy-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="philosophy-grid">
            <div class="canva-block" ${this.elemAttrs(sIdx, 0)}>
              <span class="section-tag philosophy-tag">Filosofi Desain</span>
              <h2 class="philosophy-headline" data-editable="true">Tatar Rupa Mawa Bagja</h2>
              <div class="philosophy-subheading">Menciptakan ruang dan tata hunian yang membawa kebahagiaan.</div>
              <p class="philosophy-body">Dalam kebudayaan Nusantara, tata ruang bukan sekadar dinding dan atap. Tatar Rupa adalah seni menata wujud fisik agar selaras dengan ritme alam dan denyut kehidupan penghuni.</p>
              <p class="philosophy-body">Mawa Bagja adalah tujuannya: menghadirkan kebahagiaan mendalam, ketenangan batin saat pulang ke rumah, dan kehangatan abadi bagi generasi yang bertumbuh di dalamnya.</p>
            </div>

            <div class="philosophy-visual canva-block" ${this.elemAttrs(sIdx, 1)}>
              <div class="philosophy-img-frame">
                <img src="assets/images/project-facade-detail.jpg" alt="Filosofi Tatar Rupa Mawa Bagja" />
              </div>
              <div class="philosophy-card-quote">
                <p>"Setiap ruang memiliki cerita dan karakter tersendiri yang lahir dari manusia dan alam sekitarnya."</p>
              </div>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 7. Deliverables Showcase Section
    if (section.type === 'deliverables_grid') {
      wrapper.className = 'deliverables-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="section-header canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="section-tag">Output & Standar Penyerahan</span>
            <h2 class="section-title" data-editable="true">Apa yang Anda Dapatkan dalam Setiap Proyek</h2>
            <p class="section-subtitle">Setiap proyek diselesaikan dengan paket dokumen profesional, visualisasi fotorealistik, dan buku eksklusif cetak.</p>
          </div>

          <div class="deliverables-layout">
            <div class="deliverables-grid">
              <div class="deliverable-box">
                <h4>Pengembangan Desain</h4>
                <ul>
                  <li>Alternatif denah tata ruang fungsional</li>
                  <li>Alternatif desain fasad & massa bangunan</li>
                  <li>Moodboard material & pencahayaan</li>
                </ul>
              </div>
              <div class="deliverable-box">
                <h4>Visualisasi 3D</h4>
                <ul>
                  <li>Render eksterior resolusi ultra tinggi</li>
                  <li>Render setiap ruangan interior</li>
                  <li>Video cinematic walkthrough 2-3 menit</li>
                </ul>
              </div>
              <div class="deliverable-box">
                <h4>Dokumentasi Teknis</h4>
                <ul>
                  <li>Master file 3D SketchUp (.skp) rapi</li>
                  <li>Gambar kerja denah, tampak & potongan</li>
                  <li>Rencana Anggaran Biaya (RAB)</li>
                </ul>
              </div>
              <div class="deliverable-box">
                <h4>Penyerahan Hasil</h4>
                <ul>
                  <li>Digital Cloud Archive (Google Drive)</li>
                  <li>PDF master presentation lengkap</li>
                  <li>Hardcover Photobook eksklusif cetak</li>
                </ul>
              </div>
            </div>

            <div class="deliverables-media-col canva-block" ${this.elemAttrs(sIdx, 1)}>
              <div class="deliverables-img-frame">
                <img src="assets/images/deliverables-photobook.jpg" alt="Hardcover Photobook" />
              </div>
              <div class="deliverables-badge-callout">
                <h5>Buku Hardcover Eksklusif</h5>
                <p>Setiap klien menerima cinderamata photobook mewah yang mendokumentasikan karya rancangan hunian Anda.</p>
              </div>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 8. Process Timeline Section
    if (section.type === 'process_timeline') {
      wrapper.className = 'process-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="section-header canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="section-tag">Metodologi Kerja</span>
            <h2 class="section-title" data-editable="true">Tahapan Menghadirkan Ruang Impian Anda</h2>
            <p class="section-subtitle">Langkah terstruktur dan transparan dari awal diskusi hingga penyerahan berkas siap bangun.</p>
          </div>

          <div class="process-timeline" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem; margin-top:2.5rem;">
            <div style="background:#FFF; padding:1.5rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:700;">01</span>
              <h4 style="margin:0.5rem 0 0.3rem;">Diskusi & Analisis</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">Eksplorasi kebutuhan keluarga, karakter lahan, dan orientasi iklim.</p>
            </div>
            <div style="background:#FFF; padding:1.5rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:700;">02</span>
              <h4 style="margin:0.5rem 0 0.3rem;">Skematik & Denah</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">Perancangan alternatif zonasi denah dan hubungan antar ruang.</p>
            </div>
            <div style="background:#FFF; padding:1.5rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:700;">03</span>
              <h4 style="margin:0.5rem 0 0.3rem;">Visualisasi 3D</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">Penyusunan model 3D fotorealistik eksterior dan interior.</p>
            </div>
            <div style="background:#FFF; padding:1.5rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:700;">04</span>
              <h4 style="margin:0.5rem 0 0.3rem;">Gambar Kerja & RAB</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">Penyusunan berkas teknis siap bangun dan estimasi anggaran.</p>
            </div>
            <div style="background:#FFF; padding:1.5rem; border:1px solid var(--border-color); border-radius:4px;">
              <span style="font-family:var(--font-serif); font-size:1.5rem; color:var(--accent-color); font-weight:700;">05</span>
              <h4 style="margin:0.5rem 0 0.3rem;">Handover & Photobook</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">Penyerahan seluruh master file dan cetak buku eksklusif.</p>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 9. Inquiry & WhatsApp Generator Section
    if (section.type === 'inquiry_generator') {
      wrapper.className = 'inquiry-section';
      wrapper.innerHTML = `
        <div class="container">
          <div class="section-header canva-block" ${this.elemAttrs(sIdx, 0)}>
            <span class="section-tag">Mulai Proyek Anda</span>
            <h2 class="section-title" data-editable="true">Mari Bicarakan Ruang Impian Anda</h2>
            <p class="section-subtitle">Sistem kami akan menyusun pesan kebutuhan proyek Anda dan membukanya langsung di WhatsApp studio.</p>
          </div>

          <div class="inquiry-grid" style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:2.5rem; margin-top:2.5rem;">
            <div class="inquiry-form-card" style="background:#FFF; padding:2rem; border:1px solid var(--border-color); border-radius:4px;">
              <h4 style="margin-bottom:1.25rem;">Formulir Ringkas Kebutuhan Desain</h4>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                <input type="text" class="form-input" placeholder="Nama Lengkap" disabled value="Arga Pratama" />
                <input type="text" class="form-input" placeholder="Nomor WhatsApp" disabled value="08123456789" />
              </div>
              <div style="margin-bottom:1rem;">
                <select class="form-select" disabled>
                  <option>Hunian Pribadi / Rumah Tinggal</option>
                  <option>Villa / Peristirahatan Pedesaan</option>
                </select>
              </div>
              <textarea class="form-textarea" rows="3" disabled placeholder="Ceritakan gambaran hunian impian Anda...">Rencana membangun rumah tinggal 2 lantai di Bandung dengan konsep terbuka dan selaras alam.</textarea>
              <div style="margin-top:1.25rem;">
                <button class="btn btn-whatsapp" style="width:100%; pointer-events:none;">Kirim Pesan ke WhatsApp Studio &rarr;</button>
              </div>
            </div>

            <div class="inquiry-preview-card" style="background:#1E2221; color:#FFF; padding:2rem; border-radius:4px;">
              <h4 style="color:#D8CBB8; margin-bottom:1rem; font-family:var(--font-serif);">Preview Otomatis WhatsApp</h4>
              <p style="font-size:0.8rem; opacity:0.85; line-height:1.6; white-space:pre-line;">
                Halo Tim SEKALARUPA STUDIO,
                Saya tertarik untuk berdiskusi mengenai perancangan arsitektur:
                - Tipe: Hunian Pribadi
                - Lokasi: Bandung
                - Luas: ~250 m²
              </p>
              <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.15); font-size:0.75rem; color:#A5ACA9;">
                WhatsApp Resmi: +62 878-5752-3074
              </div>
            </div>
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 10. Footer Section
    if (section.type === 'footer') {
      wrapper.className = 'site-footer';
      wrapper.style.backgroundColor = '#191918';
      wrapper.style.color = '#E5E1D8';
      wrapper.innerHTML = `
        <div class="container" style="padding-top:40px; padding-bottom:40px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:2rem;">
            <div>
              <div style="font-family:var(--font-serif); font-size:1.35rem; font-weight:700; color:#FFF; letter-spacing:0.12em;">SEKALARUPA STUDIO</div>
              <p style="font-size:0.82rem; color:#A5ACA9; margin-top:6px; max-width:340px;">Studio arsitektur berakar pada filosofi Tatar Rupa Mawa Bagja. Menghadirkan ketenangan dalam setiap gatra ruang.</p>
            </div>
            <div style="display:flex; gap:3rem;">
              <div>
                <h5 style="color:#D8CBB8; font-size:0.85rem; margin-bottom:0.75rem;">Navigasi</h5>
                <div style="font-size:0.8rem; color:#A5ACA9; line-height:1.8;">Beranda<br>Tentang<br>Portofolio<br>Layanan</div>
              </div>
              <div>
                <h5 style="color:#D8CBB8; font-size:0.85rem; margin-bottom:0.75rem;">Kontak</h5>
                <div style="font-size:0.8rem; color:#A5ACA9; line-height:1.8;">halo@sekalarupa.com<br>WhatsApp: 087857523074<br>Bandung, Indonesia</div>
              </div>
            </div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:2.5rem; padding-top:1.5rem; font-size:0.75rem; color:#78807D; text-align:center;">
            © 2026 SEKALARUPA STUDIO. Seluruh Hak Cipta Dilindungi.
          </div>
        </div>
      `;
      this.attachElementHandlers(wrapper, sIdx);
      return wrapper;
    }

    // 11. Generic / Custom Section
    const container = document.createElement('div');
    container.className = 'container';

    if (section.elements && section.elements.length > 0) {
      section.elements.forEach((elem, eIdx) => {
        const elDiv = document.createElement('div');
        elDiv.className = `canva-block canva-element-block ${this.selectedSectionIndex === sIdx && this.selectedElementIndex === eIdx ? 'canva-selected' : ''}`;
        elDiv.dataset.sectionIdx = sIdx;
        elDiv.dataset.elementIdx = eIdx;
        elDiv.style.marginBottom = '1.25rem';

        const posX = elem.props?.posX || 0;
        const posY = elem.props?.posY || 0;
        if (posX !== 0 || posY !== 0) {
          elDiv.style.transform = `translate(${posX}px, ${posY}px)`;
        }

        // Element handles & floating toolbar
        elDiv.innerHTML = `
          <div class="canva-handle canva-handle-tl" data-handle="tl"></div>
          <div class="canva-handle canva-handle-tr" data-handle="tr"></div>
          <div class="canva-handle canva-handle-br" data-handle="br"></div>
          <div class="canva-handle canva-handle-bl" data-handle="bl"></div>

          <div class="canva-action-toolbar" id="toolbar-elem-${sIdx}-${eIdx}">
            <span class="canva-toolbar-btn canva-drag-handle" title="Tahan & geser untuk memindahkan posisi elemen">
              ✥ Geser
            </span>
            <button class="canva-toolbar-btn" title="Edit Teks" onclick="BuilderEngine.startInlineEdit(this.parentElement.parentElement); event.stopPropagation();">✏️ Edit</button>
            <button class="canva-toolbar-btn" title="Duplikasi Elemen" onclick="BuilderEngine.duplicateElement(${sIdx}, ${eIdx}); event.stopPropagation();">❐</button>
            <button class="canva-toolbar-btn" title="Reset Posisi" onclick="BuilderEngine.resetElemPosition(${sIdx}, ${eIdx}); event.stopPropagation();">↺ 0,0</button>
            <button class="canva-toolbar-btn" style="color: #FF8A8A;" title="Hapus Elemen" onclick="BuilderEngine.deleteElement(${sIdx}, ${eIdx}); event.stopPropagation();">🗑</button>
            <span class="canva-coord-tag">X: ${posX}px, Y: ${posY}px</span>
          </div>
        `;

        const textVal = this.getLocalizedText(elem.content, 'Teks Elemen');

        if (elem.type === 'heading') {
          elDiv.innerHTML += `<h2 style="font-family: var(--font-serif); font-size: 2.25rem; margin-bottom: 0.5rem; line-height:1.2;" data-editable="true">${textVal}</h2>`;
        } else if (elem.type === 'paragraph') {
          elDiv.innerHTML += `<p style="font-size: 1rem; line-height: 1.7; color: var(--text-main);" data-editable="true">${textVal}</p>`;
        } else if (elem.type === 'image') {
          elDiv.innerHTML += `<img src="${elem.props?.src || 'assets/images/hero-architecture.jpg'}" style="width:100%; max-height:480px; object-fit:cover; border-radius:4px;" />`;
        } else if (elem.type === 'button') {
          elDiv.innerHTML += `<span class="btn btn-primary" data-editable="true">${textVal}</span>`;
        } else if (elem.type === 'quote') {
          elDiv.innerHTML += `
            <div class="intro-quote-card">
              <div class="intro-quote-text" data-editable="true">"${textVal}"</div>
              <div class="intro-quote-author">${elem.props?.author || 'Sekalarupa Studio'}</div>
            </div>
          `;
        } else if (elem.type === 'badge') {
          elDiv.innerHTML += `<span class="hero-badge" data-editable="true">${textVal}</span>`;
        } else if (elem.type === 'divider') {
          elDiv.innerHTML += `<hr style="border:0; border-top:1px solid var(--border-color); margin: 2rem 0;" />`;
        }

        container.appendChild(elDiv);
      });
    } else {
      container.innerHTML = `
        <div style="border: 2px dashed #D5D0C5; border-radius: 6px; padding: 2.5rem; text-align: center; color: var(--text-muted);">
          <p style="margin-bottom: 0.5rem; font-weight: 600;">Section Masih Kosong</p>
          <p style="font-size: 0.85rem;">Pilih elemen dari tab "Elemen" di panel kiri untuk menambahkan konten ke section ini.</p>
        </div>
      `;
    }

    wrapper.appendChild(container);
    this.attachElementHandlers(wrapper, sIdx);
    return wrapper;
  },

  elemAttrs(sIdx, eIdx) {
    const isSelected = (this.selectedSectionIndex === sIdx && this.selectedElementIndex === eIdx);
    return `class="canva-block ${isSelected ? 'canva-selected' : ''}" data-section-idx="${sIdx}" data-element-idx="${eIdx}"`;
  },

  elemTransform(elem) {
    if (!elem || !elem.props) return '';
    const x = elem.props.posX || 0;
    const y = elem.props.posY || 0;
    if (x === 0 && y === 0) return '';
    return `transform: translate(${x}px, ${y}px);`;
  },

  /* --------------------------------------------------------------------------
     6. Canva Element Dragging, Repositioning & Live Inline Editing
     -------------------------------------------------------------------------- */
  attachElementHandlers(container, sIdx) {
    // Attach click and dblclick to elements
    container.querySelectorAll('[data-element-idx]').forEach(el => {
      const eIdx = parseInt(el.dataset.elementIdx, 10);

      el.onclick = (e) => {
        e.stopPropagation();
        this.selectElement(sIdx, eIdx);
      };

      // Mousedown for element dragging
      el.onmousedown = (e) => {
        if (!this.freeDragMode) return;
        if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        this.startElementDrag(e, sIdx, eIdx);
      };

      // Double-click inline text editing
      el.ondblclick = (e) => {
        e.stopPropagation();
        this.startInlineEdit(el, sIdx, eIdx);
      };
    });

    // Also attach dblclick to any [data-editable="true"]
    container.querySelectorAll('[data-editable="true"]').forEach(textEl => {
      textEl.ondblclick = (e) => {
        e.stopPropagation();
        const parentElem = textEl.closest('[data-element-idx]');
        const eIdx = parentElem ? parseInt(parentElem.dataset.elementIdx, 10) : null;
        this.startInlineEdit(textEl, sIdx, eIdx);
      };
    });
  },

  startElementDrag(e, sIdx, eIdx) {
    this.isDragging = true;
    this.dragTarget = { sIdx, eIdx };
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    if (eIdx !== null) {
      const elem = this.schema.sections[sIdx]?.elements?.[eIdx];
      this.initialPosX = elem?.props?.posX || 0;
      this.initialPosY = elem?.props?.posY || 0;
    } else {
      const sec = this.schema.sections[sIdx];
      this.initialPosX = sec?.props?.posX || 0;
      this.initialPosY = sec?.props?.posY || 0;
    }

    // Select dragged entity
    if (eIdx !== null) {
      this.selectElement(sIdx, eIdx, false);
    } else {
      this.selectSection(sIdx, false);
    }
  },

  handleElementDragMove(e) {
    if (!this.isDragging || !this.dragTarget) return;

    const { sIdx, eIdx } = this.dragTarget;
    const deltaX = (e.clientX - this.dragStartX) / this.zoom;
    const deltaY = (e.clientY - this.dragStartY) / this.zoom;

    const currentX = Math.round(this.initialPosX + deltaX);
    const currentY = Math.round(this.initialPosY + deltaY);

    // Apply live style to DOM element for smooth 60fps movement
    let targetDomEl = null;
    if (eIdx !== null) {
      targetDomEl = document.querySelector(`[data-section-idx="${sIdx}"][data-element-idx="${eIdx}"]`);
    } else {
      targetDomEl = document.querySelector(`.canva-section-block[data-section-idx="${sIdx}"]`);
    }

    if (targetDomEl) {
      targetDomEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
      targetDomEl.classList.add('canva-dragging');

      // Update live coordinate tag
      const coordTag = targetDomEl.querySelector('.canva-coord-tag');
      if (coordTag) coordTag.textContent = `X: ${currentX}px, Y: ${currentY}px`;
    }
  },

  endElementDrag() {
    if (!this.isDragging || !this.dragTarget) return;

    const { sIdx, eIdx } = this.dragTarget;
    let targetDomEl = null;
    if (eIdx !== null) {
      targetDomEl = document.querySelector(`[data-section-idx="${sIdx}"][data-element-idx="${eIdx}"]`);
    } else {
      targetDomEl = document.querySelector(`.canva-section-block[data-section-idx="${sIdx}"]`);
    }

    if (targetDomEl) {
      targetDomEl.classList.remove('canva-dragging');

      // Extract matrix / translate from style
      const transform = targetDomEl.style.transform || '';
      const match = transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
      if (match) {
        const finalX = parseInt(match[1], 10);
        const finalY = parseInt(match[2], 10);

        if (eIdx !== null) {
          const elem = this.schema.sections[sIdx]?.elements?.[eIdx];
          if (elem) {
            if (!elem.props) elem.props = {};
            elem.props.posX = finalX;
            elem.props.posY = finalY;
            this.recordHistory(`Geser elemen (${finalX}, ${finalY})`);
          }
        } else {
          const sec = this.schema.sections[sIdx];
          if (sec) {
            if (!sec.props) sec.props = {};
            sec.props.posX = finalX;
            sec.props.posY = finalY;
            this.recordHistory(`Geser section (${finalX}, ${finalY})`);
          }
        }
      }
    }

    this.isDragging = false;
    this.dragTarget = null;
    this.renderProperties();
  },

  resetPosition(sIdx) {
    const sec = this.schema.sections[sIdx];
    if (sec && sec.props) {
      sec.props.posX = 0;
      sec.props.posY = 0;
      this.recordHistory('Reset posisi section');
      this.render();
    }
  },

  resetElemPosition(sIdx, eIdx) {
    const elem = this.schema.sections[sIdx]?.elements?.[eIdx];
    if (elem && elem.props) {
      elem.props.posX = 0;
      elem.props.posY = 0;
      this.recordHistory('Reset posisi elemen');
      this.render();
    }
  },

  startInlineEdit(targetNode, sIdx, eIdx) {
    // If targetNode is a container, find editable child
    const editableTarget = targetNode.hasAttribute('data-editable') ? targetNode : targetNode.querySelector('[data-editable="true"]') || targetNode;
    if (!editableTarget) return;

    editableTarget.contentEditable = "true";
    editableTarget.focus();

    // Select text content
    const range = document.createRange();
    range.selectNodeContents(editableTarget);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishEdit = () => {
      editableTarget.contentEditable = "false";
      const newText = editableTarget.innerText.trim();

      if (eIdx !== null && this.schema.sections[sIdx]?.elements?.[eIdx]) {
        const elem = this.schema.sections[sIdx].elements[eIdx];
        if (!elem.content || typeof elem.content === 'string') {
          elem.content = { id: newText, en: newText };
        } else {
          elem.content[this.locale] = newText;
        }
        this.recordHistory('Edit teks langsung');
      }
      this.renderProperties();
    };

    editableTarget.onblur = () => finishEdit();
    editableTarget.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        editableTarget.blur();
      }
    };
  },

  /* --------------------------------------------------------------------------
     7. Selection & Properties Panel
     -------------------------------------------------------------------------- */
  selectSection(index, shouldRerender = true) {
    this.selectedSectionIndex = index;
    this.selectedElementIndex = null;
    if (shouldRerender) this.render();
    else this.renderProperties();
  },

  selectElement(sectionIndex, elemIndex, shouldRerender = true) {
    this.selectedSectionIndex = sectionIndex;
    this.selectedElementIndex = elemIndex;
    if (shouldRerender) this.render();
    else this.renderProperties();
  },

  renderProperties() {
    const panel = document.getElementById('builderPropertiesPanel');
    if (!panel) return;

    if (this.selectedSectionIndex === null || !this.schema.sections[this.selectedSectionIndex]) {
      panel.innerHTML = `
        <div style="text-align:center; padding: 3rem 1rem; color:var(--text-muted); font-size:0.85rem;">
          <div style="font-size:2rem; margin-bottom:0.75rem; color:var(--accent-color);">✦</div>
          <h4 style="color:var(--text-main); margin-bottom:0.4rem;">Pilih Komponen</h4>
          <p>Klik section atau elemen di kanvas untuk membuka inspektor properti visual, tipografi, dan koordinat posisi.</p>
        </div>
      `;
      return;
    }

    const sIdx = this.selectedSectionIndex;
    const sec = this.schema.sections[sIdx];
    const eIdx = this.selectedElementIndex;

    // A. Element Properties Selected
    if (eIdx !== null && sec.elements?.[eIdx]) {
      const elem = sec.elements[eIdx];
      const textVal = this.getLocalizedText(elem.content, '');
      const posX = elem.props?.posX || 0;
      const posY = elem.props?.posY || 0;

      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1.25rem;">
          <div>
            <span style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.12em; color:var(--accent-color); font-weight:700;">PROPERTI ELEMEN</span>
            <h3 style="font-size:1.1rem; font-family:var(--font-serif); margin-top:2px; text-transform:capitalize;">${elem.type}</h3>
          </div>
          <button class="btn btn-xs btn-outline" onclick="BuilderEngine.deselectAll()">Tutup</button>
        </div>

        <!-- Coordinates Position (Canva Freeform Shifting) -->
        <div style="background:#F7F5F0; border:1px solid var(--border-color); border-radius:6px; padding:0.85rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <label class="form-label" style="margin:0; font-weight:600;">Koordinat Geser Fleksibel (Canva)</label>
            <button class="btn btn-xs btn-secondary" onclick="BuilderEngine.resetElemPosition(${sIdx}, ${eIdx})">Reset (0,0)</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <div>
              <span style="font-size:0.75rem; color:var(--text-muted);">Offset X (px)</span>
              <input type="number" class="form-input" value="${posX}" onchange="BuilderEngine.updateElemProp(${eIdx}, 'posX', parseInt(this.value) || 0)" />
            </div>
            <div>
              <span style="font-size:0.75rem; color:var(--text-muted);">Offset Y (px)</span>
              <input type="number" class="form-input" value="${posY}" onchange="BuilderEngine.updateElemProp(${eIdx}, 'posY', parseInt(this.value) || 0)" />
            </div>
          </div>
        </div>

        <!-- Bilingual Content Input -->
        <div class="form-group">
          <label class="form-label">Teks Konten (${this.locale.toUpperCase()})</label>
          ${elem.type === 'paragraph' ? 
            `<textarea class="form-textarea" rows="4" oninput="BuilderEngine.updateElementText(${eIdx}, this.value)">${textVal}</textarea>` :
            `<input type="text" class="form-input" value="${textVal}" oninput="BuilderEngine.updateElementText(${eIdx}, this.value)" />`
          }
        </div>

        ${elem.type === 'image' ? `
          <div class="form-group">
            <label class="form-label">URL Gambar</label>
            <input type="text" class="form-input" value="${elem.props?.src || ''}" placeholder="assets/images/..." onchange="BuilderEngine.updateElemProp(${eIdx}, 'src', this.value)" />
          </div>
        ` : ''}

        <div style="margin-top:1.5rem; display:flex; gap:0.5rem;">
          <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="BuilderEngine.duplicateElement(${sIdx}, ${eIdx})">❐ Duplikasi</button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="BuilderEngine.deleteElement(${sIdx}, ${eIdx})">🗑 Hapus</button>
        </div>
      `;
      return;
    }

    // B. Section Properties Selected
    const p = sec.props || {};
    const posX = p.posX || 0;
    const posY = p.posY || 0;

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1.25rem;">
        <div>
          <span style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.12em; color:var(--accent-color); font-weight:700;">PROPERTI SECTION</span>
          <h3 style="font-size:1.1rem; font-family:var(--font-serif); margin-top:2px;">${sec.title || sec.type}</h3>
        </div>
        <button class="btn btn-xs btn-outline" onclick="BuilderEngine.deselectAll()">Tutup</button>
      </div>

      <!-- Coordinates Position -->
      <div style="background:#F7F5F0; border:1px solid var(--border-color); border-radius:6px; padding:0.85rem; margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <label class="form-label" style="margin:0; font-weight:600;">Posisi Geser Section (Canva)</label>
          <button class="btn btn-xs btn-secondary" onclick="BuilderEngine.resetPosition(${sIdx})">Reset (0,0)</button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted);">Offset X (px)</span>
            <input type="number" class="form-input" value="${posX}" onchange="BuilderEngine.updateProp('posX', parseInt(this.value) || 0)" />
          </div>
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted);">Offset Y (px)</span>
            <input type="number" class="form-input" value="${posY}" onchange="BuilderEngine.updateProp('posY', parseInt(this.value) || 0)" />
          </div>
        </div>
      </div>

      <!-- Background Color -->
      <div class="form-group">
        <label class="form-label">Warna Latar (Background)</label>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="color" value="${p.background || '#F5F3EE'}" onchange="BuilderEngine.updateProp('background', this.value)" style="width:38px; height:38px; border:none; cursor:pointer; border-radius:4px;" />
          <input type="text" class="form-input" value="${p.background || '#F5F3EE'}" onchange="BuilderEngine.updateProp('background', this.value)" />
        </div>
      </div>

      <!-- Padding Top & Bottom -->
      <div class="form-group">
        <div style="display:flex; justify-content:space-between;">
          <label class="form-label">Padding Atas & Bawah</label>
          <span style="font-size:0.75rem; color:var(--text-muted);">${p.paddingTop || 70}px</span>
        </div>
        <input type="range" min="10" max="180" step="5" value="${p.paddingTop || 70}" class="form-input" oninput="BuilderEngine.updateProp('paddingTop', parseInt(this.value)); BuilderEngine.updateProp('paddingBottom', parseInt(this.value));" />
      </div>

      <!-- Background Image & Overlay -->
      <div class="form-group">
        <label class="form-label">Gambar Latar (Opsional)</label>
        <input type="text" class="form-input" value="${p.backgroundImage || ''}" placeholder="assets/images/hero-architecture.jpg" onchange="BuilderEngine.updateProp('backgroundImage', this.value)" />
      </div>

      ${p.backgroundImage ? `
        <div class="form-group">
          <div style="display:flex; justify-content:space-between;">
            <label class="form-label">Tingkat Kegelapan Overlay</label>
            <span style="font-size:0.75rem; color:var(--text-muted);">${Math.round((p.overlayOpacity ?? 0.85) * 100)}%</span>
          </div>
          <input type="range" min="0.1" max="0.98" step="0.02" value="${p.overlayOpacity ?? 0.85}" class="form-input" oninput="BuilderEngine.updateProp('overlayOpacity', parseFloat(this.value))" />
        </div>
      ` : ''}

      <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:0.5rem;">
        <button class="btn btn-sm btn-secondary" onclick="BuilderEngine.duplicateSection(${sIdx})">❐ Duplikasi Seluruh Section</button>
        <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="BuilderEngine.deleteSection(${sIdx})">🗑 Hapus Section</button>
      </div>
    `;
  },

  updateProp(key, value) {
    if (this.selectedSectionIndex === null) return;
    const sec = this.schema.sections[this.selectedSectionIndex];
    if (!sec.props) sec.props = {};
    sec.props[key] = value;
    this.recordHistory(`Ubah properti ${key}`);
    this.render();
  },

  updateElemProp(eIdx, key, value) {
    if (this.selectedSectionIndex === null) return;
    const elem = this.schema.sections[this.selectedSectionIndex]?.elements?.[eIdx];
    if (!elem) return;
    if (!elem.props) elem.props = {};
    elem.props[key] = value;
    this.recordHistory(`Ubah elemen ${key}`);
    this.render();
  },

  updateElementText(elemIndex, val) {
    if (this.selectedSectionIndex === null) return;
    const elem = this.schema.sections[this.selectedSectionIndex]?.elements?.[elemIndex];
    if (!elem) return;

    if (!elem.content || typeof elem.content === 'string') {
      elem.content = { id: val, en: val };
    }
    elem.content[this.locale] = val;
    this.recordHistory('Update teks elemen');
    this.render();
  },

  getLocalizedText(contentObj, fallback = '') {
    if (!contentObj) return fallback;
    if (typeof contentObj === 'string') return contentObj;
    return contentObj[this.locale] || contentObj.id || contentObj.en || fallback;
  },

  /* --------------------------------------------------------------------------
     8. Section & Element Manipulation (Add, Move, Duplicate, Delete)
     -------------------------------------------------------------------------- */
  addSection(type) {
    const id = `sec-${type}-${Date.now()}`;
    let newSec = {
      id,
      type,
      title: type.replace('_', ' ').toUpperCase(),
      props: { background: '#F5F3EE', paddingTop: 70, paddingBottom: 70, posX: 0, posY: 0 },
      elements: [
        { id: `el-head-${Date.now()}`, type: 'heading', content: { id: 'Judul Bagian Baru', en: 'New Section Heading' }, props: { posX: 0, posY: 0 } },
        { id: `el-par-${Date.now()}`, type: 'paragraph', content: { id: 'Tuliskan narasi arsitektur dan deskripsi di sini...', en: 'Write architectural narrative here...' }, props: { posX: 0, posY: 0 } }
      ]
    };

    this.schema.sections.push(newSec);
    this.selectedSectionIndex = this.schema.sections.length - 1;
    this.selectedElementIndex = null;
    this.recordHistory(`Tambah section ${type}`);
    this.render();
    AdminApp.showToast(`Section ${type} berhasil ditambahkan ke kanvas`);
  },

  addElement(elType) {
    if (this.selectedSectionIndex === null) {
      AdminApp.showToast('Pilih section terlebih dahulu untuk menambahkan elemen', 'warning');
      return;
    }

    const sec = this.schema.sections[this.selectedSectionIndex];
    if (!sec.elements) sec.elements = [];

    const newEl = {
      id: `el-${elType}-${Date.now()}`,
      type: elType,
      props: { posX: 0, posY: 0 },
      content: {
        id: elType === 'heading' ? 'Heading Baru' :
            elType === 'button' ? 'Tombol Aksi' :
            elType === 'badge' ? 'Badge Baru' :
            elType === 'quote' ? 'Kutipan arsitektur baru.' :
            'Teks paragraf baru...',
        en: elType === 'heading' ? 'New Heading' :
            elType === 'button' ? 'Action Button' :
            elType === 'badge' ? 'New Badge' :
            elType === 'quote' ? 'New architectural quote.' :
            'New paragraph text...'
      }
    };

    if (elType === 'image') {
      newEl.props.src = 'assets/images/hero-architecture.jpg';
    }

    sec.elements.push(newEl);
    this.selectedElementIndex = sec.elements.length - 1;
    this.recordHistory(`Tambah elemen ${elType}`);
    this.render();
  },

  moveSection(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= this.schema.sections.length) return;

    const temp = this.schema.sections[index];
    this.schema.sections[index] = this.schema.sections[target];
    this.schema.sections[target] = temp;

    this.selectedSectionIndex = target;
    this.recordHistory('Pindah urutan section');
    this.render();
  },

  duplicateSection(index) {
    const original = this.schema.sections[index];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = `sec-${Date.now()}`;
    clone.title = (clone.title || clone.type) + ' (Copy)';
    this.schema.sections.splice(index + 1, 0, clone);
    this.selectedSectionIndex = index + 1;
    this.recordHistory('Duplikasi section');
    this.render();
  },

  deleteSection(index) {
    if (!confirm('Hapus section ini dari kanvas landing page?')) return;
    this.schema.sections.splice(index, 1);
    this.selectedSectionIndex = null;
    this.selectedElementIndex = null;
    this.recordHistory('Hapus section');
    this.render();
  },

  duplicateElement(sIdx, eIdx) {
    const original = this.schema.sections[sIdx]?.elements?.[eIdx];
    if (!original) return;
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = `el-${Date.now()}`;
    if (clone.props) {
      clone.props.posX = (clone.props.posX || 0) + 15;
      clone.props.posY = (clone.props.posY || 0) + 15;
    }
    this.schema.sections[sIdx].elements.splice(eIdx + 1, 0, clone);
    this.selectedElementIndex = eIdx + 1;
    this.recordHistory('Duplikasi elemen');
    this.render();
  },

  deleteElement(sIdx, eIdx) {
    if (!confirm('Hapus elemen ini?')) return;
    this.schema.sections[sIdx]?.elements?.splice(eIdx, 1);
    this.selectedElementIndex = null;
    this.recordHistory('Hapus elemen');
    this.render();
  },

  /* --------------------------------------------------------------------------
     9. Layers Tree View
     -------------------------------------------------------------------------- */
  renderLayersTree() {
    const container = document.getElementById('builderLayersList');
    if (!container) return;

    container.innerHTML = '';
    this.schema.sections.forEach((sec, sIdx) => {
      const isSecActive = (this.selectedSectionIndex === sIdx && this.selectedElementIndex === null);

      const secItem = document.createElement('div');
      secItem.className = `layer-tree-item ${isSecActive ? 'active' : ''}`;
      secItem.innerHTML = `
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:0.75rem; color:var(--text-muted);">#${sIdx + 1}</span>
          <span>${sec.title || sec.type}</span>
        </div>
        <div class="layer-actions">
          <button class="btn btn-xs btn-link" title="Naik" onclick="BuilderEngine.moveSection(${sIdx}, -1); event.stopPropagation();">↑</button>
          <button class="btn btn-xs btn-link" title="Turun" onclick="BuilderEngine.moveSection(${sIdx}, 1); event.stopPropagation();">↓</button>
          <button class="btn btn-xs btn-link" title="Hapus" style="color:var(--danger);" onclick="BuilderEngine.deleteSection(${sIdx}); event.stopPropagation();">✕</button>
        </div>
      `;
      secItem.onclick = () => this.selectSection(sIdx);
      container.appendChild(secItem);

      // Child elements in layer tree
      if (sec.elements && sec.elements.length > 0) {
        sec.elements.forEach((el, eIdx) => {
          const isElActive = (this.selectedSectionIndex === sIdx && this.selectedElementIndex === eIdx);
          const elItem = document.createElement('div');
          elItem.className = `layer-tree-item ${isElActive ? 'active' : ''}`;
          elItem.style.paddingLeft = '1.75rem';
          elItem.style.fontSize = '0.74rem';
          elItem.innerHTML = `
            <span>↳ ${el.type}</span>
            <div class="layer-actions">
              <button class="btn btn-xs btn-link" style="color:var(--danger);" onclick="BuilderEngine.deleteElement(${sIdx}, ${eIdx}); event.stopPropagation();">✕</button>
            </div>
          `;
          elItem.onclick = (e) => {
            e.stopPropagation();
            this.selectElement(sIdx, eIdx);
          };
          container.appendChild(elItem);
        });
      }
    });
  },

  expandAllLayers() {
    this.renderLayersTree();
  },

  /* --------------------------------------------------------------------------
     10. Global Settings & Reset to Default Schema
     -------------------------------------------------------------------------- */
  renderGlobalSettings() {
    const container = document.getElementById('builderGlobalSettings');
    if (!container) return;

    container.innerHTML = `
      <div class="form-group" style="margin-top:0.5rem;">
        <label class="form-label">Font Heading Utama</label>
        <select class="form-select" onchange="document.documentElement.style.setProperty('--font-serif', this.value)">
          <option value="'Playfair Display', serif" selected>Playfair Display (Default Landing Page)</option>
          <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
          <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Mode Canva Geser Bebas</label>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem;">Memungkinkan dragging elemen dan section secara bebas di atas kanvas dengan koordinat X dan Y.</p>
        <button class="btn btn-sm ${this.freeDragMode ? 'btn-accent' : 'btn-secondary'}" onclick="document.getElementById('canvaFreeDragToggle').click(); BuilderEngine.renderGlobalSettings();">
          ${this.freeDragMode ? '✓ Mode Bebas Aktif' : 'Mode Rapi Aktif'}
        </button>
      </div>

      <div style="margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--border-color);">
        <h4 style="font-size:0.85rem; color:var(--danger); margin-bottom:0.5rem;">Reset ke Template Default</h4>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem;">Pulihkan semua 10 section orisinal landing page index.html (Hero, Filosofi, Portofolio, Layanan, Deliverables, Process, Inquiry WA).</p>
        <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="BuilderEngine.resetToLandingPageTemplate()">
          ↺ Reset ke Template Orisinal
        </button>
      </div>
    `;
  },

  async resetToLandingPageTemplate() {
    if (!confirm('Pulihkan kanvas ke template lengkap 10 section Landing Page Sekalarupa Studio?')) return;
    try {
      this.setAutosaveStatus('Memulihkan template...', 'saving');
      const res = await AdminAPI.post(`/api/admin/pages/${this.pageKey}/reset-default?locale=${this.locale}`);
      if (res.success) {
        AdminApp.showToast('Template lengkap landing page berhasil dimuat!');
        await this.loadPage();
        this.render();
      } else {
        // Fallback to reload
        await this.loadPage();
        this.render();
      }
    } catch (err) {
      // In case endpoint is different, reload from server
      await this.loadPage();
      this.render();
    }
  },

  async openHistoryModal() {
    try {
      const res = await AdminAPI.get(`/api/admin/pages/${this.pageKey}/builder?locale=${this.locale}`);
      const versions = res.data?.versions || [];

      let listHtml = '';
      if (versions.length === 0) {
        listHtml = '<p style="text-align:center; padding:2rem; color:var(--text-muted);">Belum ada riwayat revisi tersimpan.</p>';
      } else {
        listHtml = versions.map(v => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem; border-bottom:1px solid var(--border-color);">
            <div>
              <div style="font-weight:600; font-size:0.9rem;">Versi ${v.version_number}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(v.created_at).toLocaleString()} • ${v.notes || 'Revisi snapshot'}</div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="BuilderEngine.restoreVersion('${v.id}')">Pulihkan Versi Ini</button>
          </div>
        `).join('');
      }

      AdminApp.openModal('Riwayat Revisi Versi Halaman', `
        <div style="max-height: 420px; overflow-y: auto;">
          ${listHtml}
        </div>
      `, null);
    } catch (err) {
      AdminApp.showToast('Gagal memuat riwayat: ' + err.message, 'error');
    }
  },

  async restoreVersion(versionId) {
    if (!confirm('Pulihkan halaman ke versi ini? Perubahan draft saat ini akan ditimpa.')) return;
    try {
      const res = await AdminAPI.post(`/api/admin/pages/${this.pageKey}/versions/${versionId}/restore`);
      if (res.success) {
        AdminApp.closeModal();
        AdminApp.showToast('Versi berhasil dipulihkan!');
        await this.loadPage();
        this.render();
      }
    } catch (err) {
      AdminApp.showToast('Gagal restore: ' + err.message, 'error');
    }
  }
};
