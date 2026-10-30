/**
 * SEKALARUPA STUDIO - Admin Navigation Controller
 * PRD Reference: Section 7.8 (Navigation Manager) & Section 10.2
 */

const crypto = require('crypto');
const { all, get, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function generateId(prefix = 'nav') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getNavigation(req, res) {
  try {
    const menus = all('SELECT * FROM navigation_menus ORDER BY created_at ASC');
    const items = all('SELECT * FROM navigation_items ORDER BY sort_order ASC');

    const formattedItems = items.map(it => {
      let labels = { id: it.url, en: it.url };
      try {
        labels = JSON.parse(it.label_translations);
      } catch (e) {}

      return {
        id: it.id,
        menuId: it.menu_id,
        parentId: it.parent_id,
        labels,
        url: it.url,
        target: it.target,
        sortOrder: it.sort_order,
        isActive: Boolean(it.is_active)
      };
    });

    return res.json({
      success: true,
      data: {
        menus,
        items: formattedItems
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function createNavItem(req, res) {
  try {
    const { menuId, parentId, labels, url, target, sortOrder, isActive } = req.body;
    const nId = generateId('nav');

    const menu = get('SELECT id FROM navigation_menus WHERE id = ? OR menu_key = ?', [menuId, menuId || 'main-nav']);
    const targetMenuId = menu ? menu.id : all('SELECT id FROM navigation_menus LIMIT 1')[0]?.id;

    run(
      `INSERT INTO navigation_items (id, menu_id, parent_id, label_translations, url, target, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nId,
        targetMenuId,
        parentId || null,
        JSON.stringify(labels || { id: 'Menu', en: 'Menu' }),
        url || '#',
        target || '_self',
        sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1
      ]
    );

    logActivity(req.user?.id, 'CREATE_NAV_ITEM', 'navigation_items', nId, { url });

    return res.status(201).json({ success: true, message: 'Navigation item created', id: nId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateNavItem(req, res) {
  try {
    const { id } = req.params;
    const { parentId, labels, url, target, sortOrder, isActive } = req.body;

    run(
      `UPDATE navigation_items
       SET parent_id = COALESCE(?, parent_id),
           label_translations = COALESCE(?, label_translations),
           url = COALESCE(?, url),
           target = COALESCE(?, target),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        parentId !== undefined ? parentId : null,
        labels ? JSON.stringify(labels) : null,
        url || null,
        target || null,
        sortOrder !== undefined ? parseInt(sortOrder, 10) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id
      ]
    );

    logActivity(req.user?.id, 'UPDATE_NAV_ITEM', 'navigation_items', id);

    return res.json({ success: true, message: 'Navigation item updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function deleteNavItem(req, res) {
  try {
    const { id } = req.params;
    run('DELETE FROM navigation_items WHERE id = ?', [id]);
    logActivity(req.user?.id, 'DELETE_NAV_ITEM', 'navigation_items', id);
    return res.json({ success: true, message: 'Navigation item deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getNavigation,
  createNavItem,
  updateNavItem,
  deleteNavItem
};
