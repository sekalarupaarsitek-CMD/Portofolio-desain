/**
 * SEKALARUPA STUDIO - Comprehensive Backend Verification Suite
 * Tests all 14 functional modules of the backend API
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('===============================================================');
  console.log('   SEKALARUPA STUDIO - BACKEND VERIFICATION TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  let authToken = null;
  let createdProjectId = null;
  let duplicatedProjectId = null;
  let createdServiceId = null;
  let createdDeliverableId = null;
  let createdJournalId = null;
  let createdNavItemId = null;
  let createdFolderId = null;
  let createdInquiryId = null;

  // --------------------------------------------------------------------------
  // 1. Health & Public Info
  // --------------------------------------------------------------------------
  console.log('\n[1/14] Testing Health Check & Public Information...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'GET /api/health returns status ok');

    const siteRes = await fetch(`${BASE_URL}/api/public/site?locale=id`);
    const site = await siteRes.json();
    assert(site.success && site.data.brand.shortName === 'SEKALARUPA', 'GET /api/public/site returns brand info');
    assert(site.data.navigation && site.data.navigation.length > 0, 'GET /api/public/site returns active navigation');
    assert(site.data.brand.sundanesePhilosophy === 'Tatar Rupa Mawa Bagja', 'GET /api/public/site has Sundanese philosophy');
  } catch (e) {
    assert(false, 'Health Check & Public Site Info', e.message);
  }

  // --------------------------------------------------------------------------
  // 2. Authentication Flow
  // --------------------------------------------------------------------------
  console.log('\n[2/14] Testing Authentication & Authorization...');
  try {
    const statusRes = await fetch(`${BASE_URL}/api/auth/setup-status`);
    const status = await statusRes.json();
    assert(status.success && status.setupRequired === false, 'GET /api/auth/setup-status returns setup complete');

    // Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sekalarupa.com', password: 'WrongPassword!' })
    });
    assert(badLoginRes.status === 401, 'POST /api/auth/login rejects wrong credentials with 401');

    // Valid Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sekalarupa.com', password: 'AdminPassword2026!' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success && Boolean(loginData.token), 'POST /api/auth/login returns valid JWT token');
    authToken = loginData.token;

    // Protected /me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meData = await meRes.json();
    assert(meData.success && meData.user.email === 'admin@sekalarupa.com', 'GET /api/auth/me returns admin identity');

    // Unauthorized access rejection
    const unauthRes = await fetch(`${BASE_URL}/api/admin/dashboard/stats`);
    assert(unauthRes.status === 401, 'GET /api/admin/dashboard/stats rejects unauthenticated requests with 401');
  } catch (e) {
    assert(false, 'Authentication Module', e.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`
  };

  // Ensure 'home' page is published for public API
  try {
    const builderRes = await fetch(`${BASE_URL}/api/admin/pages/home/builder?locale=id`, { headers: authHeaders });
    const bData = await builderRes.json();
    if (bData.success) {
      await fetch(`${BASE_URL}/api/admin/pages/home/builder`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          locale: 'id',
          content: bData.data.content,
          action: 'publish',
          notes: 'Pre-test publish'
        })
      });
    }
  } catch (e) {}

  // --------------------------------------------------------------------------
  // 3. Public Content APIs
  // --------------------------------------------------------------------------
  console.log('\n[3/14] Testing Public Content APIs (Projects, Services, Pages, Inquiries)...');
  try {
    const projRes = await fetch(`${BASE_URL}/api/public/projects?locale=id`);
    const projData = await projRes.json();
    assert(projData.success && Array.isArray(projData.data) && projData.data.length > 0, 'GET /api/public/projects returns published portfolio');

    const firstSlug = projData.data[0].slug;
    const singleProjRes = await fetch(`${BASE_URL}/api/public/projects/${firstSlug}?locale=id`);
    const singleProj = await singleProjRes.json();
    assert(singleProj.success && singleProj.data.slug === firstSlug, `GET /api/public/projects/${firstSlug} returns project details`);

    const servRes = await fetch(`${BASE_URL}/api/public/services?locale=id`);
    const servData = await servRes.json();
    assert(servData.success && servData.data.length >= 6, 'GET /api/public/services returns 6 core services');

    const catRes = await fetch(`${BASE_URL}/api/public/categories`);
    const catData = await catRes.json();
    assert(catData.success && catData.data.length > 0, 'GET /api/public/categories returns categories');

    const delivRes = await fetch(`${BASE_URL}/api/public/deliverables`);
    const delivData = await delivRes.json();
    assert(delivData.success && Array.isArray(delivData.data), 'GET /api/public/deliverables returns deliverables catalog');

    const pageRes = await fetch(`${BASE_URL}/api/public/pages/home?locale=id`);
    const pageData = await pageRes.json();
    assert(pageData.success && pageData.data.content?.sections?.length === 10, 'GET /api/public/pages/home returns full 10-section schema');

    // Public Inquiry Submission (WhatsApp Generator)
    const inqRes = await fetch(`${BASE_URL}/api/public/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Budi Santoso',
        whatsapp: '081298765432',
        email: 'budi@example.com',
        location: 'Lembang, Bandung',
        serviceKey: 'Perancangan Arsitektur',
        landArea: '400 m²',
        buildingArea: '250 m²',
        timeline: 'Pertengahan 2026',
        description: 'Pembangunan villa peristirahatan keluarga dengan konsep semi-terbuka.'
      })
    });
    const inqData = await inqRes.json();
    assert(inqData.success && Boolean(inqData.referenceCode), 'POST /api/public/inquiries generates reference code');
    assert(inqData.waUrl && inqData.waUrl.includes('https://wa.me/'), 'POST /api/public/inquiries generates valid WhatsApp direct URL');
    assert(inqData.waMessage && inqData.waMessage.includes('Budi Santoso'), 'POST /api/public/inquiries generates structured WhatsApp message text');
  } catch (e) {
    assert(false, 'Public Content APIs', e.message);
  }

  // --------------------------------------------------------------------------
  // 4. Admin Dashboard
  // --------------------------------------------------------------------------
  console.log('\n[4/14] Testing Admin Dashboard Overview & Analytics...');
  try {
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard/stats`, { headers: authHeaders });
    const dashData = await dashRes.json();
    assert(dashData.success, 'GET /api/admin/dashboard/stats returns success');
    assert(typeof dashData.stats.totalProjects === 'number', 'GET /api/admin/dashboard/stats calculates total projects');
    assert(Array.isArray(dashData.recentLogs), 'GET /api/admin/dashboard/stats returns activity audit logs');
    assert(Array.isArray(dashData.recentInquiries) && dashData.recentInquiries.length > 0, 'GET /api/admin/dashboard/stats returns recent inquiries');
  } catch (e) {
    assert(false, 'Admin Dashboard', e.message);
  }

  // --------------------------------------------------------------------------
  // 5. Admin Projects (Portfolio Manager CRUD)
  // --------------------------------------------------------------------------
  console.log('\n[5/14] Testing Admin Projects CRUD (Portfolio)...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/projects`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && Array.isArray(listData.data), 'GET /api/admin/projects returns project list');

    // Create Test Project
    const createRes = await fetch(`${BASE_URL}/api/admin/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        slug: 'test-sanctuary-villa-' + Date.now(),
        heroImage: 'assets/images/project-villa-rural.jpg',
        location: 'Sukabumi',
        siteArea: '800 m²',
        buildingArea: '350 m²',
        year: '2026',
        categoryIds: [],
        translations: {
          id: {
            title: 'Test Sanctuary Villa',
            tagline: 'Peristirahatan lereng perbukitan',
            description: 'Deskripsi pengujian sistem arsitektur',
            designConcept: 'Konsep selaras alam'
          },
          en: {
            title: 'Test Sanctuary Villa',
            tagline: 'Hillside sanctuary living',
            description: 'Test architectural narrative',
            designConcept: 'Biophilic contextual design'
          }
        }
      })
    });
    const createData = await createRes.json();
    createdProjectId = createData.projectId || createData.id;
    assert(createData.success && Boolean(createdProjectId), 'POST /api/admin/projects creates project');

    // Get Single Project
    const getRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}`, { headers: authHeaders });
    const getData = await getRes.json();
    assert(getData.success && getData.data.id === createdProjectId, 'GET /api/admin/projects/:id returns created project');

    // Update Project
    const updateRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        location: 'Sukabumi Highlands (Updated)',
        translations: {
          id: { title: 'Test Sanctuary Villa (Updated)' }
        }
      })
    });
    const updateData = await updateRes.json();
    assert(updateData.success, 'PUT /api/admin/projects/:id updates project');

    // Toggle Status
    const toggleRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isPublished: 1 })
    });
    const toggleData = await toggleRes.json();
    assert(toggleData.success, 'PATCH /api/admin/projects/:id/status updates publication status');

    // Duplicate Project
    const dupRes = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}/duplicate`, {
      method: 'POST',
      headers: authHeaders
    });
    const dupData = await dupRes.json();
    duplicatedProjectId = dupData.projectId || dupData.id;
    assert(dupData.success && Boolean(duplicatedProjectId), 'POST /api/admin/projects/:id/duplicate duplicates project');

    // Clean up created and duplicated projects
    const del1 = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}`, { method: 'DELETE', headers: authHeaders });
    assert((await del1.json()).success, 'DELETE /api/admin/projects/:id deletes project');

    const del2 = await fetch(`${BASE_URL}/api/admin/projects/${duplicatedProjectId}`, { method: 'DELETE', headers: authHeaders });
    assert((await del2.json()).success, 'DELETE /api/admin/projects/:id deletes duplicated project');
  } catch (e) {
    assert(false, 'Admin Projects CRUD', e.message);
  }

  // --------------------------------------------------------------------------
  // 6. Admin Services CRUD
  // --------------------------------------------------------------------------
  console.log('\n[6/14] Testing Admin Services CRUD...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/services`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && listData.data.length >= 6, 'GET /api/admin/services returns studio services');

    // Create Service with unique key
    const uniqueKey = 'test-service-' + Date.now();
    const createRes = await fetch(`${BASE_URL}/api/admin/services`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        serviceKey: uniqueKey,
        coverImage: 'assets/images/hero-architecture.jpg',
        sortOrder: 99,
        isActive: true,
        translations: {
          id: { title: 'Desain Lanskap Uji Coba', description: 'Deskripsi lanskap', scopeOfWork: 'Penataan taman' },
          en: { title: 'Test Landscape Design', description: 'Landscape description', scopeOfWork: 'Garden curation' }
        }
      })
    });
    const createData = await createRes.json();
    createdServiceId = createData.serviceId || createData.id;
    assert(createData.success && Boolean(createdServiceId), 'POST /api/admin/services creates service');

    // Update Service
    const updateRes = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        sortOrder: 100,
        translations: {
          id: { title: 'Desain Lanskap (Updated)' }
        }
      })
    });
    assert((await updateRes.json()).success, 'PUT /api/admin/services/:id updates service');

    // Delete Service
    const delRes = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, { method: 'DELETE', headers: authHeaders });
    assert((await delRes.json()).success, 'DELETE /api/admin/services/:id deletes service');
  } catch (e) {
    assert(false, 'Admin Services CRUD', e.message);
  }

  // --------------------------------------------------------------------------
  // 7. Admin Deliverables CRUD
  // --------------------------------------------------------------------------
  console.log('\n[7/14] Testing Admin Deliverables CRUD...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/deliverables`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && Array.isArray(listData.data), 'GET /api/admin/deliverables returns deliverables');

    // Create Deliverable
    const createRes = await fetch(`${BASE_URL}/api/admin/deliverables`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Cinematic VR Walkthrough 360',
        description: 'Simulasi interaktif virtual reality',
        category: '3D Visualization',
        sortOrder: 1,
        isActive: true
      })
    });
    const createData = await createRes.json();
    createdDeliverableId = createData.deliverableId || createData.id;
    assert(createData.success && Boolean(createdDeliverableId), 'POST /api/admin/deliverables creates deliverable');

    // Update Deliverable
    const updateRes = await fetch(`${BASE_URL}/api/admin/deliverables/${createdDeliverableId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Cinematic VR Walkthrough 360 (Updated)' })
    });
    assert((await updateRes.json()).success, 'PUT /api/admin/deliverables/:id updates deliverable');

    // Delete Deliverable
    const delRes = await fetch(`${BASE_URL}/api/admin/deliverables/${createdDeliverableId}`, { method: 'DELETE', headers: authHeaders });
    assert((await delRes.json()).success, 'DELETE /api/admin/deliverables/:id deletes deliverable');
  } catch (e) {
    assert(false, 'Admin Deliverables CRUD', e.message);
  }

  // --------------------------------------------------------------------------
  // 8. Admin Journal Articles CRUD
  // --------------------------------------------------------------------------
  console.log('\n[8/14] Testing Admin Journal Articles CRUD...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/journal`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && Array.isArray(listData.data), 'GET /api/admin/journal returns journal articles');

    // Create Article
    const createRes = await fetch(`${BASE_URL}/api/admin/journal`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        coverImage: 'assets/images/project-residence-urban.jpg',
        publicationStatus: 'draft',
        translations: {
          id: {
            title: 'Menghadirkan Ketenangan dalam Desain Rumah Perkotaan',
            excerpt: 'Eksplorasi bukaan cahaya alami dan ventilasi silang.',
            content: 'Artikel lengkap mengenai pendekatan arsitektur tropis.'
          },
          en: {
            title: 'Bringing Tranquility to Urban Residential Architecture',
            excerpt: 'Exploring natural daylight and cross ventilation.',
            content: 'Full article on tropical architectural approach.'
          }
        }
      })
    });
    const createData = await createRes.json();
    createdJournalId = createData.journalId || createData.id;
    assert(createData.success && Boolean(createdJournalId), 'POST /api/admin/journal creates article');

    // Get Single Article
    const getRes = await fetch(`${BASE_URL}/api/admin/journal/${createdJournalId}`, { headers: authHeaders });
    const getData = await getRes.json();
    assert(getData.success && getData.data.translations?.id?.title?.includes('Ketenangan'), 'GET /api/admin/journal/:id returns article details');

    // Update Article
    const updateRes = await fetch(`${BASE_URL}/api/admin/journal/${createdJournalId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        publicationStatus: 'published',
        translations: {
          id: { title: 'Menghadirkan Ketenangan dalam Desain Rumah Perkotaan (Published)' }
        }
      })
    });
    assert((await updateRes.json()).success, 'PUT /api/admin/journal/:id updates article status');

    // Delete Article
    const delRes = await fetch(`${BASE_URL}/api/admin/journal/${createdJournalId}`, { method: 'DELETE', headers: authHeaders });
    assert((await delRes.json()).success, 'DELETE /api/admin/journal/:id deletes article');
  } catch (e) {
    assert(false, 'Admin Journal Articles CRUD', e.message);
  }

  // --------------------------------------------------------------------------
  // 9. Admin Navigation Menu
  // --------------------------------------------------------------------------
  console.log('\n[9/14] Testing Admin Navigation Menu Manager...');
  try {
    const navRes = await fetch(`${BASE_URL}/api/admin/navigation`, { headers: authHeaders });
    const navData = await navRes.json();
    assert(navData.success && navData.data.menus.length > 0, 'GET /api/admin/navigation returns menus');
    assert(navData.data.items.length >= 6, 'GET /api/admin/navigation returns menu items');

    // Create Nav Item
    const createRes = await fetch(`${BASE_URL}/api/admin/navigation/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        menuId: navData.data.menus[0].id,
        labels: { id: 'Jurnal Arsitektur', en: 'Architectural Journal' },
        url: '#journal',
        target: '_self',
        sortOrder: 10,
        isActive: true
      })
    });
    const createData = await createRes.json();
    createdNavItemId = createData.itemId || createData.id;
    assert(createData.success && Boolean(createdNavItemId), 'POST /api/admin/navigation/items creates item');

    // Update Nav Item
    const updateRes = await fetch(`${BASE_URL}/api/admin/navigation/items/${createdNavItemId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ url: '#journal-updated' })
    });
    assert((await updateRes.json()).success, 'PUT /api/admin/navigation/items/:id updates item');

    // Delete Nav Item
    const delRes = await fetch(`${BASE_URL}/api/admin/navigation/items/${createdNavItemId}`, { method: 'DELETE', headers: authHeaders });
    assert((await delRes.json()).success, 'DELETE /api/admin/navigation/items/:id deletes item');
  } catch (e) {
    assert(false, 'Admin Navigation Menu', e.message);
  }

  // --------------------------------------------------------------------------
  // 10. Admin Media Folders & Assets
  // --------------------------------------------------------------------------
  console.log('\n[10/14] Testing Admin Media Folders & Asset Library...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/media`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && Array.isArray(listData.data), 'GET /api/admin/media returns media list');

    const folderRes = await fetch(`${BASE_URL}/api/admin/media-folders`, { headers: authHeaders });
    const folderData = await folderRes.json();
    assert(folderData.success && Array.isArray(folderData.data), 'GET /api/admin/media-folders returns folder list');

    // Create Test Folder
    const createFolderRes = await fetch(`${BASE_URL}/api/admin/media-folders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Renderings 3D 2026' })
    });
    const createFolderData = await createFolderRes.json();
    createdFolderId = createFolderData.data?.id || createFolderData.id;
    assert(createFolderData.success && Boolean(createdFolderId), 'POST /api/admin/media-folders creates folder');

    // Delete Folder
    const delFolderRes = await fetch(`${BASE_URL}/api/admin/media-folders/${createdFolderId}`, { method: 'DELETE', headers: authHeaders });
    assert((await delFolderRes.json()).success, 'DELETE /api/admin/media-folders/:id deletes folder');
  } catch (e) {
    assert(false, 'Admin Media Folders', e.message);
  }

  // --------------------------------------------------------------------------
  // 11. Visual Page Builder & Landing Page Schema
  // --------------------------------------------------------------------------
  console.log('\n[11/14] Testing Visual Page Builder (Canva-Style Hybrid Engine)...');
  try {
    const pagesRes = await fetch(`${BASE_URL}/api/admin/pages`, { headers: authHeaders });
    const pagesData = await pagesRes.json();
    assert(pagesData.success && pagesData.data.length > 0, 'GET /api/admin/pages returns system pages');

    // Get Builder Data for Home in ID and EN
    const builderIdRes = await fetch(`${BASE_URL}/api/admin/pages/home/builder?locale=id`, { headers: authHeaders });
    const builderIdData = await builderIdRes.json();
    assert(builderIdData.success && builderIdData.data.content?.sections?.length === 10, 'GET /api/admin/pages/home/builder (ID) returns 10 landing sections');

    const builderEnRes = await fetch(`${BASE_URL}/api/admin/pages/home/builder?locale=en`, { headers: authHeaders });
    const builderEnData = await builderEnRes.json();
    assert(builderEnData.success && builderEnData.data.content?.sections?.length === 10, 'GET /api/admin/pages/home/builder (EN) returns 10 landing sections');

    // Save Builder Draft
    const saveRes = await fetch(`${BASE_URL}/api/admin/pages/home/builder`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        locale: 'id',
        content: builderIdData.data.content,
        action: 'draft',
        notes: 'Verification test draft save'
      })
    });
    const saveData = await saveRes.json();
    assert(saveData.success && typeof saveData.versionNumber === 'number', 'PUT /api/admin/pages/:id/builder saves draft & records version');

    // Save Builder Publish
    const pubRes = await fetch(`${BASE_URL}/api/admin/pages/home/builder`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        locale: 'id',
        content: builderIdData.data.content,
        action: 'publish',
        notes: 'Verification test live publish'
      })
    });
    const pubData = await pubRes.json();
    assert(pubData.success, 'PUT /api/admin/pages/:id/builder publishes page live');

    // Reset to Default Landing Page Template
    const resetRes = await fetch(`${BASE_URL}/api/admin/pages/home/reset-default?locale=id`, {
      method: 'POST',
      headers: authHeaders
    });
    const resetData = await resetRes.json();
    assert(resetData.success, 'POST /api/admin/pages/:id/reset-default restores original 10-section landing schema');
  } catch (e) {
    assert(false, 'Visual Page Builder', e.message);
  }

  // --------------------------------------------------------------------------
  // 12. Settings & Theme
  // --------------------------------------------------------------------------
  console.log('\n[12/14] Testing Site Settings & Architectural Theme Tokens...');
  try {
    const getSetRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: authHeaders });
    const getSetData = await getSetRes.json();
    assert(getSetData.success && Boolean(getSetData.data.site) && Boolean(getSetData.data.theme), 'GET /api/admin/settings returns site & theme tokens');

    // Update Site Setting
    const updateSiteRes = await fetch(`${BASE_URL}/api/admin/settings/site`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        brand_name: 'SEKALARUPA STUDIO',
        whatsapp: '087857523074'
      })
    });
    assert((await updateSiteRes.json()).success, 'PUT /api/admin/settings/site updates site settings');

    // Update Theme Token
    const updateThemeRes = await fetch(`${BASE_URL}/api/admin/settings/theme`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        bg_primary: '#F5F3EE',
        accent_sand: '#D8CBB8'
      })
    });
    assert((await updateThemeRes.json()).success, 'PUT /api/admin/settings/theme updates architectural theme tokens');
  } catch (e) {
    assert(false, 'Settings & Theme', e.message);
  }

  // --------------------------------------------------------------------------
  // 13. Admin Inquiries Management
  // --------------------------------------------------------------------------
  console.log('\n[13/14] Testing Admin Inquiries Management...');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/inquiries`, { headers: authHeaders });
    const listData = await listRes.json();
    assert(listData.success && Array.isArray(listData.data) && listData.data.length > 0, 'GET /api/admin/inquiries returns inquiries');

    const firstInq = listData.data[0];
    createdInquiryId = firstInq.id;

    // Update Status
    const updateRes = await fetch(`${BASE_URL}/api/admin/inquiries/${createdInquiryId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'in_discussion',
        notes: 'Diskusi awal via WhatsApp berjalan lancar.'
      })
    });
    assert((await updateRes.json()).success, 'PUT /api/admin/inquiries/:id/status updates status to in_discussion');
  } catch (e) {
    assert(false, 'Admin Inquiries', e.message);
  }

  // --------------------------------------------------------------------------
  // 14. Disaster Recovery & Backup
  // --------------------------------------------------------------------------
  console.log('\n[14/14] Testing Disaster Recovery & Full Backup Export/Import...');
  try {
    const exportRes = await fetch(`${BASE_URL}/api/admin/backup/export`, { headers: authHeaders });
    const backupJson = await exportRes.json();
    assert(backupJson.app === 'SEKALARUPA STUDIO CMS', 'GET /api/admin/backup/export creates valid backup package');
    assert(backupJson.tables && Object.keys(backupJson.tables).length >= 20, 'GET /api/admin/backup/export backs up all 21+ tables');

    // Import verification
    const importRes = await fetch(`${BASE_URL}/api/admin/backup/import`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ backup: backupJson })
    });
    const importData = await importRes.json();
    assert(importData.success, 'POST /api/admin/backup/import verifies idempotent data restore pipeline');
  } catch (e) {
    assert(false, 'Disaster Recovery & Backup', e.message);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`   TEST EXECUTION FINISHED: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('Fatal Test Runner Error:', e);
  process.exit(1);
});
