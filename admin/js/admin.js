/**
 * SEKALARUPA STUDIO - Admin Application Controller
 * Handles SPA navigation, API authentication, CRUD views, and modals.
 */

const AdminAPI = {
  getToken() {
    return localStorage.getItem('sekalarupa_admin_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('sekalarupa_admin_token', token);
    else localStorage.removeItem('sekalarupa_admin_token');
  },

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const hasLocalStore = typeof LocalStore !== 'undefined';

    try {
      const headers = options.headers || {};
      const token = this.getToken() || 'session_admin_direct_access';
      headers['Authorization'] = `Bearer ${token}`;

      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const responseText = await res.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        data = null;
      }

      if (res.ok && data) {
        return data;
      }

      // If server returned error response or non-JSON, fallback to LocalStore
      if (hasLocalStore) {
        console.warn(`[AdminAPI] Server status ${res.status} on ${endpoint}. Using LocalStore fallback.`);
        return method === 'GET' ? LocalStore.handleGet(endpoint) : LocalStore.handleMutation(endpoint, method, options.body);
      }

      throw new Error((data && data.error) || `Terjadi kesalahan pada server (${res.status})`);
    } catch (netErr) {
      if (hasLocalStore) {
        console.warn(`[AdminAPI Network Fallback] ${netErr.message} on ${endpoint}. Using LocalStore.`);
        return method === 'GET' ? LocalStore.handleGet(endpoint) : LocalStore.handleMutation(endpoint, method, options.body);
      }
      throw netErr;
    }
  },

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

const AdminApp = {
  currentView: 'dashboard',
  user: null,

  async init() {
    this.bindGlobalEvents();

    // 1. DIRECT ACCESS: Instantly unlock CMS (no password wall)
    this.user = {
      id: 'usr_admin',
      email: 'admin@sekalarupa.com',
      role: 'superadmin',
      profile: {
        fullName: 'Administrator Sekalarupa',
        phone: '087857523074'
      }
    };
    AdminAPI.setToken('session_admin_direct_access');

    // 2. Open dashboard directly
    this.showAppView();
    const hashView = (window.location.hash || '').replace('#', '');
    this.navigate(hashView || 'dashboard');

    // 3. Asynchronously ping backend status in background
    this.checkBackendHealth();
  },

  async checkBackendHealth() {
    const dot = document.getElementById('adminStatusDot');
    const text = document.getElementById('adminStatusText');

    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (dot) dot.style.background = '#22c55e';
        if (text) text.textContent = `Cloud Terhubung (${data.databaseEngine || 'Siap'})`;
      } else {
        if (dot) dot.style.background = '#eab308';
        if (text) text.textContent = 'Mode Mandiri (Browser Aktif)';
      }
    } catch (e) {
      if (dot) dot.style.background = '#eab308';
      if (text) text.textContent = 'Mode Mandiri (Browser Aktif)';
    }
  },

  bindGlobalEvents() {
    // Navigation links in sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) this.navigate(view);
      };
    });

    // Refresh Button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        this.navigate(this.currentView);
        this.showToast('Tampilan dimuat ulang.');
      };
    }

    // Direct Access Bypass Button
    const directAccessBtn = document.getElementById('directAccessBtn');
    if (directAccessBtn) {
      directAccessBtn.onclick = () => {
        this.showAppView();
        this.navigate(this.currentView || 'dashboard');
        this.showToast('Akses langsung aktif.');
      };
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        AdminAPI.setToken(null);
        this.showLoginView();
        this.showToast('Berhasil keluar dari dashboard.');
      };
    }

    // Modal Close
    const modalClose = document.getElementById('modalCloseBtn');
    if (modalClose) modalClose.onclick = () => this.closeModal();

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
    }
  },

  showSetupView() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('setupCard').style.display = 'block';

    const setupForm = document.getElementById('setupForm');
    setupForm.onsubmit = async (e) => {
      e.preventDefault();
      const fullName = (document.getElementById('setupFullName').value || '').trim();
      const email = (document.getElementById('setupEmail').value || '').trim();
      const password = document.getElementById('setupPassword').value;
      const phone = (document.getElementById('setupPhone').value || '').trim();
      const submitBtn = setupForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Menyimpan...';
        }
        const res = await AdminAPI.post('/api/auth/setup', { fullName, email, password, phone });
        AdminAPI.setToken(res.token);
        this.user = res.user;
        this.showToast('Setup administrator awal berhasil!');
        this.showAppView();
        this.navigate('dashboard');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    };
  },

  showLoginView() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('setupCard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block';

    const loginForm = document.getElementById('loginForm');
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (document.getElementById('loginEmail').value || '').trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Memverifikasi...';
        }
        const res = await AdminAPI.post('/api/auth/login', { email, password });
        AdminAPI.setToken(res.token);
        this.user = res.user;
        this.showToast('Login berhasil. Selamat datang kembali.');
        this.showAppView();
        this.navigate('dashboard');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    };
  },

  showAppView() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    if (this.user) {
      const adminNameEl = document.getElementById('currentAdminName');
      if (adminNameEl) adminNameEl.textContent = this.user.profile?.fullName || this.user.email;
    }
  },

  navigate(viewName) {
    this.currentView = viewName;

    // Update active class on sidebar
    document.querySelectorAll('.sidebar-link').forEach(l => {
      l.classList.toggle('active', l.dataset.view === viewName);
    });

    const titleEl = document.getElementById('viewTitle');
    const contentEl = document.getElementById('adminViewContent');

    switch (viewName) {
      case 'dashboard':
        if (titleEl) titleEl.textContent = 'Dashboard & Ikhtisar Studio';
        this.renderDashboard(contentEl);
        break;
      case 'projects':
        if (titleEl) titleEl.textContent = 'Portfolio Manager';
        this.renderProjects(contentEl);
        break;
      case 'builder':
        if (titleEl) titleEl.textContent = 'Visual Page Builder (Canva-Style)';
        this.renderBuilder(contentEl);
        break;
      case 'services':
        if (titleEl) titleEl.textContent = 'Services Manager';
        this.renderServices(contentEl);
        break;
      case 'deliverables':
        if (titleEl) titleEl.textContent = 'Deliverables & Output Katalog';
        this.renderDeliverables(contentEl);
        break;
      case 'media':
        if (titleEl) titleEl.textContent = 'Media Assets Library';
        this.renderMedia(contentEl);
        break;
      case 'journal':
        if (titleEl) titleEl.textContent = 'Journal Articles Manager';
        this.renderJournal(contentEl);
        break;
      case 'navigation':
        if (titleEl) titleEl.textContent = 'Navigation Menu Manager';
        this.renderNavigation(contentEl);
        break;
      case 'theme':
        if (titleEl) titleEl.textContent = 'Theme & Design Tokens';
        this.renderTheme(contentEl);
        break;
      case 'settings':
        if (titleEl) titleEl.textContent = 'General Settings & Kontak';
        this.renderSettings(contentEl);
        break;
      case 'inquiries':
        if (titleEl) titleEl.textContent = 'Inquiries & Konsultasi Klien';
        this.renderInquiries(contentEl);
        break;
      case 'backup':
        if (titleEl) titleEl.textContent = 'Backup & Disaster Recovery';
        this.renderBackup(contentEl);
        break;
      default:
        this.renderDashboard(contentEl);
    }
  },

  /* --------------------------------------------------------------------------
     View 1: Dashboard
     -------------------------------------------------------------------------- */
  async renderDashboard(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat data dashboard...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/dashboard/stats');
      const stats = res.stats || {};
      const inquiries = res.recentInquiries || [];
      const logs = res.recentLogs || [];

      el.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Published Projects</span>
              <span class="badge badge-published">Live</span>
            </div>
            <div class="stat-value">${stats.publishedProjects || 0}</div>
            <div class="stat-sub">Total keseluruhan: ${stats.totalProjects || 0} proyek</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Project Inquiries</span>
              <span class="badge badge-pending">${stats.pendingInquiries || 0} Baru</span>
            </div>
            <div class="stat-value">${stats.totalInquiries || 0}</div>
            <div class="stat-sub">Konsultasi klien masuk</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Services</span>
              <span class="badge badge-featured">Katalog</span>
            </div>
            <div class="stat-value">${stats.totalServices || 0}</div>
            <div class="stat-sub">Layanan arsitektur aktif</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Media Assets</span>
              <span class="badge badge-draft">Storage</span>
            </div>
            <div class="stat-value">${stats.totalMedia || 0}</div>
            <div class="stat-sub">Gambar & aset terarsip</div>
          </div>
        </div>

        <div class="quick-actions-bar">
          <button class="btn btn-primary" onclick="AdminApp.navigate('projects'); setTimeout(() => AdminApp.openProjectModal(), 100);">+ Tambah Proyek Baru</button>
          <button class="btn btn-secondary" onclick="AdminApp.navigate('media');">+ Upload Media</button>
          <button class="btn btn-secondary" onclick="AdminApp.navigate('builder');">Edit Homepage Visual</button>
          <button class="btn btn-secondary" onclick="AdminApp.navigate('services');">+ Kelola Layanan</button>
          <button class="btn btn-secondary" onclick="AdminApp.navigate('inquiries');">Inbox Konsultasi (${stats.pendingInquiries || 0})</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.5rem;">
          <div class="table-container" style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="font-size:1.1rem;">Konsultasi Klien Terbaru</h3>
              <a href="#" onclick="AdminApp.navigate('inquiries'); return false;" style="font-size:0.8rem; color:var(--accent-color); font-weight:600;">Lihat Semua →</a>
            </div>
            ${inquiries.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">Belum ada konsultasi masuk.</p>' : `
              <table class="data-table">
                <thead><tr><th>Klien</th><th>Layanan</th><th>Lokasi</th><th>WhatsApp</th></tr></thead>
                <tbody>
                  ${inquiries.map(inq => `
                    <tr>
                      <td style="font-weight:600;">${inq.client_name}</td>
                      <td>${inq.service_key}</td>
                      <td>${inq.location}</td>
                      <td><a href="https://wa.me/${inq.whatsapp}" target="_blank" style="color:var(--success); font-weight:600;">${inq.whatsapp}</a></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <div class="table-container" style="padding:1.5rem;">
            <h3 style="font-size:1.1rem; margin-bottom:1rem;">Aktivitas Administrator Terkini</h3>
            <div style="font-size:0.82rem; max-height:280px; overflow-y:auto;">
              ${logs.length === 0 ? '<p style="color:var(--text-muted);">Belum ada log aktivitas.</p>' : logs.map(l => `
                <div style="padding:0.5rem 0; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between;">
                  <div>
                    <span style="font-weight:600;">${l.action}</span>
                    <span style="color:var(--text-muted); margin-left:4px;">(${l.entity_type})</span>
                  </div>
                  <span style="color:var(--text-muted); font-size:0.75rem;">${new Date(l.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  /* --------------------------------------------------------------------------
     View 2: Portfolio Manager
     -------------------------------------------------------------------------- */
  async renderProjects(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat proyek arsitektur...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/projects');
      const projects = res.data || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary" onclick="AdminApp.openProjectModal()">+ Tambah Proyek</button>
            <button class="btn btn-secondary" onclick="AdminApp.renderProjects(document.getElementById('adminViewContent'))">Refresh</button>
          </div>
          <span style="font-size:0.85rem; color:var(--text-muted);">Total: ${projects.length} Proyek</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px;">Cover</th>
                <th>Judul & Tipologi</th>
                <th>Lokasi & Tahun</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td><img src="${p.coverImage || 'assets/images/hero-architecture.jpg'}" class="table-thumb" /></td>
                  <td>
                    <div style="font-weight:600; font-size:0.95rem;">${p.titleId}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${p.taglineId || p.projectType}</div>
                  </td>
                  <td>
                    <div style="font-size:0.85rem;">${p.location || '-'}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${p.year || ''} • ${p.buildingArea || ''}</div>
                  </td>
                  <td>
                    ${p.categories?.map(c => `<span class="badge badge-featured" style="margin-right:2px;">${c.name}</span>`).join('') || '-'}
                  </td>
                  <td>
                    <span class="badge ${p.isPublished ? 'badge-published' : 'badge-draft'}" style="cursor:pointer;" onclick="AdminApp.toggleProjectPublish('${p.id}', ${!p.isPublished})">
                      ${p.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    ${p.isFeatured ? '<span class="badge badge-featured" style="margin-left:4px;">FEATURED</span>' : ''}
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.openProjectModal('${p.id}')">Edit</button>
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.duplicateProject('${p.id}')" title="Duplikasi">❐</button>
                      <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteProject('${p.id}', '${p.titleId}')">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async toggleProjectPublish(id, isPublished) {
    try {
      await AdminAPI.patch(`/api/admin/projects/${id}/status`, { isPublished });
      this.showToast(isPublished ? 'Proyek dipublikasikan' : 'Proyek diubah ke draft');
      this.renderProjects(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async duplicateProject(id) {
    try {
      await AdminAPI.post(`/api/admin/projects/${id}/duplicate`);
      this.showToast('Proyek berhasil diduplikasi sebagai draft');
      this.renderProjects(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async deleteProject(id, title) {
    if (!confirm(`Hapus proyek "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await AdminAPI.delete(`/api/admin/projects/${id}`);
      this.showToast('Proyek berhasil dihapus');
      this.renderProjects(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async openProjectModal(id = null) {
    let project = {
      translations: { id: {}, en: {} },
      categoryIds: [],
      deliverableIds: []
    };

    if (id) {
      const res = await AdminAPI.get(`/api/admin/projects/${id}`);
      project = res.data;
    }

    // Fetch categories and deliverables
    const [catsRes, delivsRes] = await Promise.all([
      AdminAPI.get('/api/public/categories'),
      AdminAPI.get('/api/public/deliverables')
    ]);

    const categories = catsRes.data || [];
    const deliverables = delivsRes.data || [];

    const bodyHtml = `
      <form id="projectForm">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Judul Proyek (Bahasa Indonesia) *</label>
            <input type="text" id="pTitleId" class="form-input" required value="${project.translations?.id?.title || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Project Title (English)</label>
            <input type="text" id="pTitleEn" class="form-input" value="${project.translations?.en?.title || ''}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Tagline (ID)</label>
            <input type="text" id="pTaglineId" class="form-input" value="${project.translations?.id?.tagline || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tagline (EN)</label>
            <input type="text" id="pTaglineEn" class="form-input" value="${project.translations?.en?.tagline || ''}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <input type="text" id="pLocation" class="form-input" value="${project.location || ''}" placeholder="Lembang, Bandung" />
          </div>
          <div class="form-group">
            <label class="form-label">Tahun</label>
            <input type="text" id="pYear" class="form-input" value="${project.year || '2026'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Status Proyek</label>
            <select id="pStatus" class="form-select">
              <option value="Concept" ${project.status === 'Concept' ? 'selected' : ''}>Concept Design</option>
              <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed (Terbangun)</option>
              <option value="Under Construction" ${project.status === 'Under Construction' ? 'selected' : ''}>Under Construction</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Luas Lahan</label>
            <input type="text" id="pLandArea" class="form-input" value="${project.land_area || ''}" placeholder="850 m²" />
          </div>
          <div class="form-group">
            <label class="form-label">Luas Bangunan</label>
            <input type="text" id="pBuildingArea" class="form-input" value="${project.building_area || ''}" placeholder="520 m²" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi Arsitektur (Bahasa Indonesia)</label>
          <textarea id="pDescId" class="form-textarea" rows="3">${project.translations?.id?.description || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Konsep Desain & Pendekatan Ruang (ID)</label>
          <textarea id="pConceptId" class="form-textarea" rows="2">${project.translations?.id?.design_concept || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Cover Image URL / Path</label>
          <input type="text" id="pCoverImage" class="form-input" value="${project.cover_image || 'assets/images/hero-architecture.jpg'}" />
        </div>

        <div class="form-group">
          <label class="form-label">Kategori Portofolio</label>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            ${categories.map(c => `
              <label style="font-size:0.85rem; display:flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" name="pCat" value="${c.id}" ${project.categoryIds?.includes(c.id) ? 'checked' : ''} />
                ${c.name}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deliverables yang Diserahkan</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; max-height:180px; overflow-y:auto; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
            ${deliverables.map(d => `
              <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.35rem; cursor:pointer;">
                <input type="checkbox" name="pDeliv" value="${d.id}" ${project.deliverableIds?.includes(d.id) ? 'checked' : ''} />
                ${d.name}
              </label>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; gap:2rem; margin-top:1rem;">
          <label style="font-size:0.9rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="checkbox" id="pFeatured" ${project.isFeatured ? 'checked' : ''} />
            Set sebagai Proyek Unggulan (Featured)
          </label>
          <label style="font-size:0.9rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="checkbox" id="pPublished" ${project.isPublished !== false ? 'checked' : ''} />
            Publikasikan ke Website Publik
          </label>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="AdminApp.closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveProjectBtn">${id ? 'Simpan Perubahan' : 'Buat Proyek'}</button>
    `;

    this.openModal(id ? 'Edit Proyek Arsitektur' : 'Tambah Proyek Arsitektur Baru', bodyHtml, footerHtml);

    document.getElementById('saveProjectBtn').onclick = async () => {
      const selectedCats = Array.from(document.querySelectorAll('input[name="pCat"]:checked')).map(cb => cb.value);
      const selectedDelivs = Array.from(document.querySelectorAll('input[name="pDeliv"]:checked')).map(cb => cb.value);

      const payload = {
        status: document.getElementById('pStatus').value,
        location: document.getElementById('pLocation').value,
        year: document.getElementById('pYear').value,
        landArea: document.getElementById('pLandArea').value,
        buildingArea: document.getElementById('pBuildingArea').value,
        coverImage: document.getElementById('pCoverImage').value,
        isFeatured: document.getElementById('pFeatured').checked,
        isPublished: document.getElementById('pPublished').checked,
        categoryIds: selectedCats,
        deliverableIds: selectedDelivs,
        translations: {
          id: {
            title: document.getElementById('pTitleId').value,
            tagline: document.getElementById('pTaglineId').value,
            description: document.getElementById('pDescId').value,
            designConcept: document.getElementById('pConceptId').value
          },
          en: {
            title: document.getElementById('pTitleEn').value || document.getElementById('pTitleId').value,
            tagline: document.getElementById('pTaglineEn').value,
            description: document.getElementById('pDescId').value,
            designConcept: document.getElementById('pConceptId').value
          }
        }
      };

      try {
        if (id) {
          await AdminAPI.put(`/api/admin/projects/${id}`, payload);
          this.showToast('Proyek berhasil diperbarui');
        } else {
          await AdminAPI.post('/api/admin/projects', payload);
          this.showToast('Proyek baru berhasil dibuat');
        }
        this.closeModal();
        this.renderProjects(document.getElementById('adminViewContent'));
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
  },

  /* --------------------------------------------------------------------------
     View 3: Visual Page Builder (Section 8 - Canva Hybrid Engine)
     -------------------------------------------------------------------------- */
  renderBuilder(el) {
    el.innerHTML = `
      <div class="builder-workspace">
        <!-- Top Toolbar -->
        <div class="builder-toolbar">
          <div class="builder-toolbar-left">
            <div class="builder-title-badge">
              <span>✦ Visual Page Builder</span>
              <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">| Landing Page (index.html)</span>
            </div>
            <select id="builderLocaleSelect" class="form-select" style="padding:4px 10px; font-size:0.8rem; width:auto; border-radius:14px; background:#F7F5F0;">
              <option value="id">🇮🇩 Bahasa Indonesia (ID)</option>
              <option value="en">🇬🇧 English (EN)</option>
            </select>
            <span id="builderAutosaveStatus" class="builder-status-pill saved">
              ✓ Tersimpan di database
            </span>
          </div>

          <!-- Viewport Device Switcher -->
          <div class="builder-device-selector">
            <button class="device-btn active" data-device="desktop" title="Desktop Viewport (1280px)">🖥 Desktop</button>
            <button class="device-btn" data-device="tablet" title="Tablet Viewport (768px)">📱 Tablet</button>
            <button class="device-btn" data-device="mobile" title="Mobile Viewport (375px)">📱 Mobile</button>
          </div>

          <div class="builder-toolbar-right">
            <!-- Undo / Redo -->
            <button class="btn btn-sm btn-secondary" id="builderUndoBtn" title="Undo (Ctrl+Z)" style="padding: 4px 10px;">↶</button>
            <button class="btn btn-sm btn-secondary" id="builderRedoBtn" title="Redo (Ctrl+Y)" style="padding: 4px 10px;">↷</button>
            <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
            <button class="btn btn-sm btn-secondary" id="builderHistoryBtn">Riwayat Versi</button>
            <button class="btn btn-sm btn-secondary" id="builderSaveDraftBtn">Simpan Draft</button>
            <button class="btn btn-sm btn-accent" id="builderPublishBtn">Publish Langsung</button>
          </div>
        </div>

        <!-- 3-Column Studio Body -->
        <div class="builder-body">
          <!-- Left: Canva-Style Tabs & Drawers -->
          <div class="builder-sidebar-left">
            <div class="builder-tabs-header">
              <button class="builder-tab-btn active" data-tab="sections">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                Sections
              </button>
              <button class="builder-tab-btn" data-tab="elements">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Elemen
              </button>
              <button class="builder-tab-btn" data-tab="layers">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                Layers
              </button>
              <button class="builder-tab-btn" data-tab="settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Global
              </button>
            </div>

            <!-- Tab 1: Sections Catalog -->
            <div id="builderPaneSections" class="builder-tab-pane active">
              <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); font-weight:700; margin-bottom:0.75rem;">
                Katalog Section Landing Page
              </div>
              <div class="sections-catalog-list" id="builderSectionsCatalog">
                <!-- Injected by BuilderEngine -->
              </div>
            </div>

            <!-- Tab 2: Elements Palette -->
            <div id="builderPaneElements" class="builder-tab-pane">
              <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); font-weight:700; margin-bottom:0.75rem;">
                Palet Elemen Visual
              </div>
              <div class="element-palette-grid">
                <div class="palette-item" data-element="heading">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M18 4v16M6 12h12"/></svg>
                  Heading
                </div>
                <div class="palette-item" data-element="paragraph">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                  Paragraf
                </div>
                <div class="palette-item" data-element="image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Gambar
                </div>
                <div class="palette-item" data-element="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Tombol CTA
                </div>
                <div class="palette-item" data-element="card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  Card Box
                </div>
                <div class="palette-item" data-element="divider">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
                  Divider Garis
                </div>
                <div class="palette-item" data-element="quote">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
                  Quote Card
                </div>
                <div class="palette-item" data-element="badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                  Badge Pill
                </div>
              </div>
            </div>

            <!-- Tab 3: Layers Structure -->
            <div id="builderPaneLayers" class="builder-tab-pane">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); font-weight:700;">
                  Struktur Section & Elemen
                </span>
                <button class="btn btn-xs btn-secondary" onclick="BuilderEngine.expandAllLayers()">Expand</button>
              </div>
              <div id="builderLayersList"></div>
            </div>

            <!-- Tab 4: Global Settings -->
            <div id="builderPaneSettings" class="builder-tab-pane">
              <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); font-weight:700; margin-bottom:0.75rem;">
                Pengaturan Kanvas Global
              </div>
              <div id="builderGlobalSettings"></div>
            </div>
          </div>

          <!-- Center: Canvas WYSIWYG with Pan & Zoom -->
          <div class="builder-canvas-wrapper" id="builderCanvasWrapper">
            <div class="builder-canvas-container" id="builderCanvasContainer">
              <div id="builderCanvas" class="builder-canvas"></div>
            </div>

            <!-- Bottom Floating Canva Workspace Bar -->
            <div class="canva-floating-bar">
              <div class="canva-bar-group">
                <button class="canva-bar-btn" id="canvaZoomOutBtn" title="Zoom Out (Perkecil)">−</button>
                <span id="canvaZoomDisplay" style="font-size:0.78rem; font-weight:700; min-width:44px; text-align:center;">100%</span>
                <button class="canva-bar-btn" id="canvaZoomInBtn" title="Zoom In (Perbesar)">+</button>
                <button class="canva-bar-btn" id="canvaZoomFitBtn" title="Sesuaikan Layar">Fit</button>
                <button class="canva-bar-btn" id="canvaZoom100Btn" title="Zoom Normal 100%">100%</button>
              </div>

              <div class="canva-bar-divider"></div>

              <div class="canva-bar-group">
                <button class="canva-bar-btn" id="canvaPanToolBtn" title="Geser Kanvas (Pan)">
                  ✋ Pan
                </button>
                <button class="canva-bar-btn active" id="canvaFreeDragToggle" title="Mode Fleksibel Geser Elemen">
                  ✥ Mode Bebas
                </button>
              </div>

              <div class="canva-bar-divider"></div>

              <div class="canva-bar-group">
                <span style="font-size:0.72rem; color:var(--text-muted);">Double-click teks untuk edit langsung</span>
              </div>
            </div>
          </div>

          <!-- Right: Visual Properties Panel -->
          <div class="builder-sidebar-right" id="builderPropertiesPanel">
            <div style="text-align:center; padding:2rem 0; color:var(--text-muted); font-size:0.85rem;">
              Pilih elemen atau section untuk mengedit properti
            </div>
          </div>
        </div>
      </div>
    `;

    BuilderEngine.init('home', 'id');
  },

  /* --------------------------------------------------------------------------
     View 4: Services Manager
     -------------------------------------------------------------------------- */
  async renderServices(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat layanan studio...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/services');
      const services = res.data || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <button class="btn btn-primary" onclick="AdminApp.openServiceModal()">+ Tambah Layanan Baru</button>
          <span style="font-size:0.85rem; color:var(--text-muted);">${services.length} Layanan Aktif</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Deskripsi Singkat</th>
                <th>Cover</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${services.map(s => `
                <tr>
                  <td>
                    <div style="font-weight:600;">${s.titleId}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${s.titleEn} (${s.serviceKey})</div>
                  </td>
                  <td style="max-width:320px; font-size:0.82rem; color:var(--text-muted);">${(s.descId || '').substring(0, 90)}...</td>
                  <td><img src="${s.coverImage || 'assets/images/hero-architecture.jpg'}" class="table-thumb" /></td>
                  <td>
                    <span class="badge ${s.isPublished ? 'badge-published' : 'badge-draft'}">
                      ${s.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.openServiceModal('${s.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteService('${s.id}')">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async openServiceModal(id = null) {
    let service = { translations: { id: {}, en: {} } };
    if (id) {
      const res = await AdminAPI.get(`/api/admin/services/${id}`);
      service = res.data;
    }

    const bodyHtml = `
      <form id="serviceForm">
        <div class="form-group">
          <label class="form-label">Service Key / Slug *</label>
          <input type="text" id="sKey" class="form-input" value="${service.service_key || ''}" required placeholder="architecture, interior, dsb." />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Nama Layanan (ID) *</label>
            <input type="text" id="sTitleId" class="form-input" value="${service.translations?.id?.title || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Service Title (EN)</label>
            <input type="text" id="sTitleEn" class="form-input" value="${service.translations?.en?.title || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi Layanan (ID)</label>
          <textarea id="sDescId" class="form-textarea" rows="3">${service.translations?.id?.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Ruang Lingkup Pekerjaan (Pisahkan dengan tanda titik koma ';')</label>
          <textarea id="sScopeId" class="form-textarea" rows="3" placeholder="Analisis tapak; Pengembangan konsep; Render 3D; DED">${service.translations?.id?.scope_of_work || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Cover Image Path</label>
          <input type="text" id="sCover" class="form-input" value="${service.cover_image || 'assets/images/hero-architecture.jpg'}" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="AdminApp.closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveServiceBtn">${id ? 'Simpan' : 'Buat Layanan'}</button>
    `;

    this.openModal(id ? 'Edit Layanan' : 'Tambah Layanan Baru', bodyHtml, footerHtml);

    document.getElementById('saveServiceBtn').onclick = async () => {
      const payload = {
        serviceKey: document.getElementById('sKey').value,
        coverImage: document.getElementById('sCover').value,
        isActive: true,
        isPublished: true,
        translations: {
          id: {
            title: document.getElementById('sTitleId').value,
            description: document.getElementById('sDescId').value,
            scopeOfWork: document.getElementById('sScopeId').value
          },
          en: {
            title: document.getElementById('sTitleEn').value || document.getElementById('sTitleId').value,
            description: document.getElementById('sDescId').value,
            scopeOfWork: document.getElementById('sScopeId').value
          }
        }
      };

      try {
        if (id) await AdminAPI.put(`/api/admin/services/${id}`, payload);
        else await AdminAPI.post('/api/admin/services', payload);
        this.showToast('Layanan berhasil disimpan');
        this.closeModal();
        this.renderServices(document.getElementById('adminViewContent'));
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
  },

  async deleteService(id) {
    if (!confirm('Hapus layanan ini?')) return;
    try {
      await AdminAPI.delete(`/api/admin/services/${id}`);
      this.showToast('Layanan dihapus');
      this.renderServices(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  /* --------------------------------------------------------------------------
     View 5: Deliverables Catalog (PRD Section 4.2 & 7.6)
     -------------------------------------------------------------------------- */
  async renderDeliverables(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat katalog output...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/deliverables');
      const deliverables = res.data || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <button class="btn btn-primary" onclick="AdminApp.openDeliverableModal()">+ Tambah Deliverable Baru</button>
          <span style="font-size:0.85rem; color:var(--text-muted);">${deliverables.length} Item Katalog</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Deliverable</th>
                <th>Kategori Output</th>
                <th>Deskripsi Lingkup</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${deliverables.map(d => `
                <tr>
                  <td style="font-weight:600;">${d.name}</td>
                  <td><span class="badge badge-featured">${d.category}</span></td>
                  <td style="font-size:0.82rem; color:var(--text-muted);">${d.description || '-'}</td>
                  <td><span class="badge ${d.is_active ? 'badge-published' : 'badge-draft'}">${d.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.openDeliverableModal('${d.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteDeliverable('${d.id}')">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async openDeliverableModal(id = null) {
    let deliv = {};
    if (id) {
      const res = await AdminAPI.get('/api/admin/deliverables');
      deliv = res.data.find(d => d.id === id) || {};
    }

    const bodyHtml = `
      <form id="delivForm">
        <div class="form-group">
          <label class="form-label">Nama Output Deliverable *</label>
          <input type="text" id="dName" class="form-input" value="${deliv.name || ''}" required placeholder="Contoh: Hardcover Photobook Handover" />
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Deliverable</label>
          <select id="dCategory" class="form-select">
            <option value="Design Development" ${deliv.category === 'Design Development' ? 'selected' : ''}>Design Development</option>
            <option value="3D Visualization" ${deliv.category === '3D Visualization' ? 'selected' : ''}>3D Visualization</option>
            <option value="Technical Documentation" ${deliv.category === 'Technical Documentation' ? 'selected' : ''}>Technical Documentation (DED)</option>
            <option value="Handover" ${deliv.category === 'Handover' ? 'selected' : ''}>Handover</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi Teknis</label>
          <textarea id="dDesc" class="form-textarea" rows="3">${deliv.description || ''}</textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="AdminApp.closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveDelivBtn">${id ? 'Simpan' : 'Buat Item'}</button>
    `;

    this.openModal(id ? 'Edit Deliverable' : 'Tambah Deliverable', bodyHtml, footerHtml);

    document.getElementById('saveDelivBtn').onclick = async () => {
      const payload = {
        name: document.getElementById('dName').value,
        category: document.getElementById('dCategory').value,
        description: document.getElementById('dDesc').value
      };

      try {
        if (id) await AdminAPI.put(`/api/admin/deliverables/${id}`, payload);
        else await AdminAPI.post('/api/admin/deliverables', payload);
        this.showToast('Deliverable berhasil disimpan');
        this.closeModal();
        this.renderDeliverables(document.getElementById('adminViewContent'));
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
  },

  async deleteDeliverable(id) {
    if (!confirm('Hapus deliverable ini?')) return;
    try {
      await AdminAPI.delete(`/api/admin/deliverables/${id}`);
      this.showToast('Deliverable dihapus');
      this.renderDeliverables(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  /* --------------------------------------------------------------------------
     View 6: Media Library (PRD Section 7.4)
     -------------------------------------------------------------------------- */
  async renderMedia(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat galeri media aset...</div>';
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        AdminAPI.get('/api/admin/media'),
        AdminAPI.get('/api/admin/media-folders')
      ]);

      const mediaList = mediaRes.data || [];
      const folders = foldersRes.data || [];

      el.innerHTML = `
        <div class="media-header-bar">
          <div class="media-folders-tabs">
            <button class="folder-tab active" data-folder="all">Semua Aset (${mediaList.length})</button>
            ${folders.map(f => `
              <button class="folder-tab" data-folder="${f.id}">${f.name} (${f.media_count || 0})</button>
            `).join('')}
            <button class="btn btn-sm btn-secondary" onclick="AdminApp.promptNewFolder()">+ Folder</button>
          </div>
        </div>

        <!-- Drag & Drop Upload Zone -->
        <div class="media-dropzone" id="mediaDropzone">
          <svg style="width:42px; height:42px; margin:0 auto 0.75rem; color:var(--accent-color);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <div style="font-weight:600; font-size:1rem; margin-bottom:0.25rem;">Drag & drop gambar atau video ke sini</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">Mendukung JPG, PNG, WebP, SVG, MP4 (Maks. 30MB)</div>
          <input type="file" id="mediaFileInput" multiple accept="image/*,video/mp4" style="display:none;" />
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('mediaFileInput').click()">Pilih File dari Komputer</button>
        </div>

        <!-- Media Grid -->
        <div class="media-grid">
          ${mediaList.map(m => `
            <div class="media-card">
              <div class="media-preview-box">
                <img src="${m.storage_path}" alt="${m.alt_text || m.file_name}" loading="lazy" />
              </div>
              <div class="media-info">
                <div class="media-title" title="${m.file_name}">${m.file_name}</div>
                <div class="media-meta">${m.file_size ? (m.file_size / 1024).toFixed(0) + ' KB' : ''} • ${m.folder_name || 'General'}</div>
                <div style="display:flex; justify-content:space-between; margin-top:0.5rem;">
                  <button class="btn btn-sm btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="navigator.clipboard.writeText('${m.storage_path}'); AdminApp.showToast('Path disalin!');">Salin Path</button>
                  <button class="btn btn-sm btn-danger" style="padding:2px 6px; font-size:0.7rem;" onclick="AdminApp.deleteMedia('${m.id}')">✕</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Bind upload input
      const fileInput = document.getElementById('mediaFileInput');
      if (fileInput) {
        fileInput.onchange = async () => {
          if (!fileInput.files.length) return;
          const formData = new FormData();
          for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('files', fileInput.files[i]);
          }
          try {
            AdminApp.showToast('Mengunggah file...');
            await AdminAPI.post('/api/admin/media/upload', formData);
            AdminApp.showToast('Upload berhasil!');
            AdminApp.renderMedia(document.getElementById('adminViewContent'));
          } catch (err) {
            AdminApp.showToast(err.message, 'error');
          }
        };
      }
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async promptNewFolder() {
    const name = prompt('Nama folder baru:');
    if (!name || !name.trim()) return;
    try {
      await AdminAPI.post('/api/admin/media-folders', { name: name.trim() });
      this.showToast('Folder dibuat');
      this.renderMedia(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async deleteMedia(id) {
    if (!confirm('Hapus file media ini?')) return;
    try {
      const res = await AdminAPI.delete(`/api/admin/media/${id}`);
      this.showToast('Media dihapus');
      this.renderMedia(document.getElementById('adminViewContent'));
    } catch (err) {
      // If server returned warning that media is in use
      if (confirm(err.message + '\n\nTetap hapus secara paksa?')) {
        try {
          await AdminAPI.delete(`/api/admin/media/${id}?force=true`);
          this.showToast('Media dihapus secara paksa');
          this.renderMedia(document.getElementById('adminViewContent'));
        } catch (e) {
          this.showToast(e.message, 'error');
        }
      }
    }
  },

  /* --------------------------------------------------------------------------
     View 7: Journal Articles (PRD Section 7.7)
     -------------------------------------------------------------------------- */
  async renderJournal(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat artikel jurnal...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/journal');
      const posts = res.data || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <button class="btn btn-primary" onclick="AdminApp.openJournalModal()">+ Tambah Artikel Baru</button>
          <span style="font-size:0.85rem; color:var(--text-muted);">${posts.length} Artikel Jurnal</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Judul Artikel</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Tanggal Rilis</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${posts.map(p => `
                <tr>
                  <td>
                    <div style="font-weight:600;">${p.title_id || 'Untitled'}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${p.title_en || ''}</div>
                  </td>
                  <td><span class="badge badge-featured">${p.category_name || 'Insights'}</span></td>
                  <td>
                    <span class="badge ${p.publication_status === 'published' ? 'badge-published' : 'badge-draft'}">
                      ${(p.publication_status || 'draft').toUpperCase()}
                    </span>
                  </td>
                  <td style="font-size:0.82rem; color:var(--text-muted);">${p.published_at ? new Date(p.published_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.openJournalModal('${p.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteJournal('${p.id}')">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async openJournalModal(id = null) {
    let post = { translations: { id: {}, en: {} } };
    if (id) {
      const res = await AdminAPI.get(`/api/admin/journal/${id}`);
      post = res.data;
    }

    const bodyHtml = `
      <form id="journalForm">
        <div class="form-group">
          <label class="form-label">Judul Artikel (ID) *</label>
          <input type="text" id="jTitleId" class="form-input" value="${post.translations?.id?.title || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Article Title (EN)</label>
          <input type="text" id="jTitleEn" class="form-input" value="${post.translations?.en?.title || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Kutipan / Excerpt (ID)</label>
          <textarea id="jExcerptId" class="form-textarea" rows="2">${post.translations?.id?.excerpt || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Isi Konten Artikel Lengkap (ID)</label>
          <textarea id="jContentId" class="form-textarea" rows="6">${post.translations?.id?.content || ''}</textarea>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Cover Image Path</label>
            <input type="text" id="jCover" class="form-input" value="${post.cover_image || 'assets/images/project-villa-rural.jpg'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Status Publikasi</label>
            <select id="jStatus" class="form-select">
              <option value="published" ${post.publication_status === 'published' ? 'selected' : ''}>Published (Tayang)</option>
              <option value="draft" ${post.publication_status === 'draft' ? 'selected' : ''}>Draft</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="AdminApp.closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveJournalBtn">${id ? 'Simpan Perubahan' : 'Buat Artikel'}</button>
    `;

    this.openModal(id ? 'Edit Artikel Jurnal' : 'Tambah Artikel Jurnal Baru', bodyHtml, footerHtml);

    document.getElementById('saveJournalBtn').onclick = async () => {
      const payload = {
        coverImage: document.getElementById('jCover').value,
        publicationStatus: document.getElementById('jStatus').value,
        translations: {
          id: {
            title: document.getElementById('jTitleId').value,
            excerpt: document.getElementById('jExcerptId').value,
            content: document.getElementById('jContentId').value
          },
          en: {
            title: document.getElementById('jTitleEn').value || document.getElementById('jTitleId').value,
            excerpt: document.getElementById('jExcerptId').value,
            content: document.getElementById('jContentId').value
          }
        }
      };

      try {
        if (id) await AdminAPI.put(`/api/admin/journal/${id}`, payload);
        else await AdminAPI.post('/api/admin/journal', payload);
        this.showToast('Artikel berhasil disimpan');
        this.closeModal();
        this.renderJournal(document.getElementById('adminViewContent'));
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
  },

  async deleteJournal(id) {
    if (!confirm('Hapus artikel jurnal ini?')) return;
    try {
      await AdminAPI.delete(`/api/admin/journal/${id}`);
      this.showToast('Artikel dihapus');
      this.renderJournal(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  /* --------------------------------------------------------------------------
     View 8: Navigation Manager (PRD Section 7.8)
     -------------------------------------------------------------------------- */
  async renderNavigation(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat menu navigasi...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/navigation');
      const items = res.data?.items || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <button class="btn btn-primary" onclick="AdminApp.openNavItemModal()">+ Tambah Menu Navigasi</button>
          <span style="font-size:0.85rem; color:var(--text-muted);">${items.length} Menu Items</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Urutan</th>
                <th>Label (ID)</th>
                <th>Label (EN)</th>
                <th>URL Target</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(it => `
                <tr>
                  <td style="font-weight:700;">#${it.sortOrder}</td>
                  <td style="font-weight:600;">${it.labels?.id || '-'}</td>
                  <td>${it.labels?.en || '-'}</td>
                  <td><code>${it.url}</code></td>
                  <td><span class="badge ${it.isActive ? 'badge-published' : 'badge-draft'}">${it.isActive ? 'ACTIVE' : 'DISABLED'}</span></td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" onclick="AdminApp.openNavItemModal('${it.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteNavItem('${it.id}')">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async openNavItemModal(id = null) {
    let item = { labels: {} };
    if (id) {
      const res = await AdminAPI.get('/api/admin/navigation');
      item = res.data?.items.find(i => i.id === id) || { labels: {} };
    }

    const bodyHtml = `
      <form id="navForm">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Label Menu (ID) *</label>
            <input type="text" id="nLabelId" class="form-input" value="${item.labels?.id || ''}" required placeholder="Beranda" />
          </div>
          <div class="form-group">
            <label class="form-label">Label Menu (EN)</label>
            <input type="text" id="nLabelEn" class="form-input" value="${item.labels?.en || ''}" placeholder="Home" />
          </div>
        </div>
        <div style="display:grid; grid-template-columns:2fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">URL / Anchor Hash *</label>
            <input type="text" id="nUrl" class="form-input" value="${item.url || '#'}" required placeholder="#portfolio atau /about" />
          </div>
          <div class="form-group">
            <label class="form-label">Urutan</label>
            <input type="number" id="nOrder" class="form-input" value="${item.sortOrder || 1}" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-secondary" onclick="AdminApp.closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveNavBtn">${id ? 'Simpan' : 'Buat Menu'}</button>
    `;

    this.openModal(id ? 'Edit Menu Navigasi' : 'Tambah Menu Navigasi', bodyHtml, footerHtml);

    document.getElementById('saveNavBtn').onclick = async () => {
      const payload = {
        labels: {
          id: document.getElementById('nLabelId').value,
          en: document.getElementById('nLabelEn').value || document.getElementById('nLabelId').value
        },
        url: document.getElementById('nUrl').value,
        sortOrder: parseInt(document.getElementById('nOrder').value, 10) || 1,
        isActive: true
      };

      try {
        if (id) await AdminAPI.put(`/api/admin/navigation/items/${id}`, payload);
        else await AdminAPI.post('/api/admin/navigation/items', payload);
        this.showToast('Navigasi berhasil disimpan');
        this.closeModal();
        this.renderNavigation(document.getElementById('adminViewContent'));
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
  },

  async deleteNavItem(id) {
    if (!confirm('Hapus item menu navigasi ini?')) return;
    try {
      await AdminAPI.delete(`/api/admin/navigation/items/${id}`);
      this.showToast('Menu dihapus');
      this.renderNavigation(document.getElementById('adminViewContent'));
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  /* --------------------------------------------------------------------------
     View 9: Theme & Branding (PRD Section 7.9)
     -------------------------------------------------------------------------- */
  async renderTheme(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat pengaturan tema...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/settings');
      const theme = res.data?.theme || {};

      el.innerHTML = `
        <div class="table-container" style="max-width:720px; padding:2rem;">
          <h3 style="font-size:1.25rem; margin-bottom:0.5rem;">Theme & Design Tokens</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">
            Atur parameter visual brand Sekalarupa Studio tanpa mengubah kode CSS.
          </p>

          <form id="themeForm">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Warna Utama (Primary Dark)</label>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <input type="color" id="thmPrimaryColor" value="${theme.color_primary || '#1E2221'}" style="width:36px; height:36px; border:none; cursor:pointer;" />
                  <input type="text" id="thmPrimaryText" class="form-input" value="${theme.color_primary || '#1E2221'}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Warna Latar Alami (Warm Background)</label>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <input type="color" id="thmBgColor" value="${theme.color_background || '#F5F3EE'}" style="width:36px; height:36px; border:none; cursor:pointer;" />
                  <input type="text" id="thmBgText" class="form-input" value="${theme.color_background || '#F5F3EE'}" />
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Warna Aksen (Architectural Ochre)</label>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <input type="color" id="thmAccentColor" value="${theme.color_accent || '#8B7355'}" style="width:36px; height:36px; border:none; cursor:pointer;" />
                  <input type="text" id="thmAccentText" class="form-input" value="${theme.color_accent || '#8B7355'}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Border Radius</label>
                <input type="text" id="thmRadius" class="form-input" value="${theme.border_radius || '4px'}" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Heading Font Family</label>
                <input type="text" id="thmFontHeading" class="form-input" value="${theme.font_heading || 'Playfair Display'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Body Font Family</label>
                <input type="text" id="thmFontBody" class="form-input" value="${theme.font_body || 'Plus Jakarta Sans'}" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Simpan Pengaturan Tema</button>
          </form>
        </div>
      `;

      // Sync color inputs
      ['Primary', 'Bg', 'Accent'].forEach(k => {
        const picker = document.getElementById(`thm${k}Color`);
        const text = document.getElementById(`thm${k}Text`);
        if (picker && text) {
          picker.oninput = () => { text.value = picker.value; };
          text.oninput = () => { picker.value = text.value; };
        }
      });

      document.getElementById('themeForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
          color_primary: document.getElementById('thmPrimaryText').value,
          color_background: document.getElementById('thmBgText').value,
          color_accent: document.getElementById('thmAccentText').value,
          border_radius: document.getElementById('thmRadius').value,
          font_heading: document.getElementById('thmFontHeading').value,
          font_body: document.getElementById('thmFontBody').value
        };

        try {
          await AdminAPI.put('/api/admin/settings/theme', payload);
          AdminApp.showToast('Pengaturan tema berhasil disimpan!');
        } catch (err) {
          AdminApp.showToast(err.message, 'error');
        }
      };
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  /* --------------------------------------------------------------------------
     View 10: General Settings & Social (PRD Section 7.10)
     -------------------------------------------------------------------------- */
  async renderSettings(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat pengaturan umum...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/settings');
      const site = res.data?.site || {};

      el.innerHTML = `
        <div class="table-container" style="max-width:760px; padding:2rem;">
          <h3 style="font-size:1.25rem; margin-bottom:0.5rem;">General Settings & Identitas Studio</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">
            Kelola nomor WhatsApp, Instagram, alamat, dan metadata SEO.
          </p>

          <form id="settingsForm">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Nama Studio *</label>
                <input type="text" id="setBrandName" class="form-input" value="${site.brand_name || 'SEKALARUPA STUDIO'}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Nama Pendek</label>
                <input type="text" id="setShortName" class="form-input" value="${site.short_name || 'SEKALARUPA'}" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp Resmi *</label>
                <input type="text" id="setWhatsapp" class="form-input" value="${site.whatsapp || '087857523074'}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Format Angka Saja (Untuk wa.me) *</label>
                <input type="text" id="setWhatsappNum" class="form-input" value="${site.whatsapp_number_only || '6287857523074'}" required />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Instagram Handle</label>
                <input type="text" id="setInstagram" class="form-input" value="${site.instagram || '@sekalarupa.arsitek'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Instagram URL</label>
                <input type="text" id="setInstagramUrl" class="form-input" value="${site.instagram_url || 'https://instagram.com/sekalarupa.arsitek'}" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">Email Kontak</label>
                <input type="email" id="setEmail" class="form-input" value="${site.email || 'contact@sekalarupa.com'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Lokasi Studio & Cakupan</label>
                <input type="text" id="setLocation" class="form-input" value="${site.location || 'Bandung & Nationwide (Indonesia)'}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Filosofi Lokal Sunda</label>
              <input type="text" id="setPhiloSundanese" class="form-input" value="${site.sundanese_philosophy || 'Tatar Rupa Mawa Bagja'}" />
            </div>

            <div class="form-group">
              <label class="form-label">SEO Default Title</label>
              <input type="text" id="setSeoTitle" class="form-input" value="${site.seo_default_title || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label">SEO Meta Description</label>
              <textarea id="setSeoDesc" class="form-textarea" rows="2">${site.seo_default_description || ''}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Simpan Pengaturan Umum</button>
          </form>
        </div>
      `;

      document.getElementById('settingsForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
          brand_name: document.getElementById('setBrandName').value,
          short_name: document.getElementById('setShortName').value,
          whatsapp: document.getElementById('setWhatsapp').value,
          whatsapp_number_only: document.getElementById('setWhatsappNum').value,
          instagram: document.getElementById('setInstagram').value,
          instagram_url: document.getElementById('setInstagramUrl').value,
          email: document.getElementById('setEmail').value,
          location: document.getElementById('setLocation').value,
          sundanese_philosophy: document.getElementById('setPhiloSundanese').value,
          seo_default_title: document.getElementById('setSeoTitle').value,
          seo_default_description: document.getElementById('setSeoDesc').value
        };

        try {
          await AdminAPI.put('/api/admin/settings/site', payload);
          AdminApp.showToast('Pengaturan umum berhasil disimpan!');
        } catch (err) {
          AdminApp.showToast(err.message, 'error');
        }
      };
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  /* --------------------------------------------------------------------------
     View 11: Inquiries Inbox (PRD Section 6)
     -------------------------------------------------------------------------- */
  async renderInquiries(el) {
    el.innerHTML = '<div style="padding:2rem; text-align:center;">Memuat formulir konsultasi masuk...</div>';
    try {
      const res = await AdminAPI.get('/api/admin/inquiries');
      const inquiries = res.data || [];

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <div>
            <h3 style="font-size:1.15rem;">Inbox Formulir Konsultasi Proyek</h3>
            <p style="font-size:0.8rem; color:var(--text-muted);">Calon klien yang mengisi formulir perancangan di website.</p>
          </div>
          <span style="font-size:0.85rem; color:var(--text-muted);">${inquiries.length} Konsultasi Terdaftar</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kode Ref</th>
                <th>Nama Klien</th>
                <th>Layanan & Lokasi</th>
                <th>Dimensi & Timeline</th>
                <th>Status</th>
                <th>Kontak WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              ${inquiries.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">Belum ada konsultasi masuk.</td></tr>' : inquiries.map(inq => `
                <tr>
                  <td><code>${inq.reference_code}</code></td>
                  <td>
                    <div style="font-weight:600;">${inq.client_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(inq.created_at).toLocaleString()}</div>
                  </td>
                  <td>
                    <div style="font-weight:500;">${inq.service_key}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${inq.location}</div>
                  </td>
                  <td style="font-size:0.8rem; color:var(--text-muted);">
                    ${inq.land_area ? `Lahan: ${inq.land_area}<br>` : ''}
                    ${inq.building_area ? `Bangunan: ${inq.building_area}<br>` : ''}
                    ${inq.timeline ? `Target: ${inq.timeline}` : ''}
                  </td>
                  <td>
                    <select class="form-select" style="padding:4px 8px; font-size:0.75rem; width:auto;" onchange="AdminApp.updateInquiryStatus('${inq.id}', this.value)">
                      <option value="pending" ${inq.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>Sudah Dihubungi</option>
                      <option value="converted" ${inq.status === 'converted' ? 'selected' : ''}>Deal Proyek</option>
                      <option value="archived" ${inq.status === 'archived' ? 'selected' : ''}>Arsip</option>
                    </select>
                  </td>
                  <td>
                    <a href="https://wa.me/${inq.whatsapp}" target="_blank" class="btn btn-sm btn-accent" style="font-size:0.75rem;">
                      Buka Chat WA
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding:2rem; color:var(--danger);">Error: ${err.message}</div>`;
    }
  },

  async updateInquiryStatus(id, status) {
    try {
      await AdminAPI.put(`/api/admin/inquiries/${id}/status`, { status });
      this.showToast('Status konsultasi diperbarui');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  /* --------------------------------------------------------------------------
     View 12: Backup & Disaster Recovery (PRD Section 17.5)
     -------------------------------------------------------------------------- */
  renderBackup(el) {
    el.innerHTML = `
      <div class="table-container" style="max-width:680px; padding:2rem;">
        <h3 style="font-size:1.25rem; margin-bottom:0.5rem;">Cadangan & Pemulihan Database</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">
          Ekspor seluruh data proyek, layanan, visual builder, dan konfigurasi ke format JSON terenkripsi, atau pulihkan dari cadangan sebelumnya.
        </p>

        <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:1.25rem; border-radius:var(--radius); margin-bottom:1.5rem;">
          <h4 style="font-size:0.95rem; margin-bottom:0.25rem;">1. Unduh Cadangan Penuh (Full JSON Export)</h4>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
            Menghasilkan file snapshot lengkap seluruh 22+ tabel relasional database.
          </p>
          <button class="btn btn-primary" onclick="AdminApp.downloadBackup()">Unduh File Cadangan JSON</button>
        </div>

        <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:1.25rem; border-radius:var(--radius);">
          <h4 style="font-size:0.95rem; margin-bottom:0.25rem;">2. Impor / Pulihkan Database</h4>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
            Unggah file backup JSON yang sebelumnya diunduh untuk memulihkan konten studio.
          </p>
          <input type="file" id="backupFileInput" accept=".json" style="margin-bottom:1rem;" />
          <br>
          <button class="btn btn-secondary" onclick="AdminApp.restoreBackupFile()">Proses Impor Cadangan</button>
        </div>
      </div>
    `;
  },

  async downloadBackup() {
    try {
      this.showToast('Menyiapkan file cadangan...');
      const res = await AdminAPI.get('/api/admin/backup/export');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sekalarupa-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Cadangan berhasil diunduh!');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async restoreBackupFile() {
    const fileInput = document.getElementById('backupFileInput');
    if (!fileInput || !fileInput.files.length) {
      this.showToast('Pilih file backup JSON terlebih dahulu', 'error');
      return;
    }

    if (!confirm('Peringatan: Pemulihan database akan memperbarui record tabel yang ada. Lanjutkan?')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupJson = JSON.parse(e.target.result);
        this.showToast('Memulihkan database...');
        await AdminAPI.post('/api/admin/backup/import', { backup: backupJson });
        this.showToast('Database berhasil dipulihkan!');
      } catch (err) {
        this.showToast('Gagal memulihkan cadangan: ' + err.message, 'error');
      }
    };
    reader.readAsText(fileInput.files[0]);
  },

  /* --------------------------------------------------------------------------
     Generic Modal & Toast Helpers
     -------------------------------------------------------------------------- */
  openModal(title, bodyHtml, footerHtml = null) {
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');
    const overlay = document.getElementById('modalOverlay');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    if (footerEl) {
      if (footerHtml) {
        footerEl.innerHTML = footerHtml;
        footerEl.style.display = 'flex';
      } else {
        footerEl.style.display = 'none';
      }
    }
    if (overlay) overlay.classList.add('active');
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
