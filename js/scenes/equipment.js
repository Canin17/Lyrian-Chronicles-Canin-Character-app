/**
 * Lyrian Chronicles - Item Purchase and Equipment Scene
 * Handles purchasing items, tracking inventory, and calculating burden
 */

/* exported EquipmentScene */
const EquipmentScene = (function() {
  'use strict';

  // Inventory state: { itemId: { item, quantity } }
  let inventory = {};

  // Selected category and search state
  let activeCategory = 'All';
  let searchQuery = '';
  let sortMode = 'default'; // 'default', 'asc', 'desc'
  let showUnknownPrice = false; // hide items with climCost === 0 by default

  // Currently inspected item (selected from shelf or grid)
  let inspectedItem = null;

  // Character context from main app
  let charContext = {
    race: null,
    ancestry: null,
    cls: null,
    breakthroughs: [],
    stats: null,
    clim: 3000
  };

  // List of categories requested by user
  const CATEGORIES = [
    'All',
    'Adventuring Essentials',
    'Alchemy',
    'Artifice',
    'Astra Relic',
    'Crafting',
    'Divine Arms',
    'Equipment',
    'Mount',
    'Talisman'
  ];

  // ===========================================================================
  // LOOKUP MAPS (built once in init) — FIX #4, #5
  // ===========================================================================
  let itemsById = new Map();
  let itemUrlCache = new Map();

  // ===========================================================================
  // BURDEN — Official rule: flat limit of 10, over = Rooted
  // Any item with burdenCost > 0 counts toward the limit.
  // Items with burdenCost = 0 (backpacks, mounts, artifice limbs) are free.
  // ===========================================================================
  const BURDEN_LIMIT = 10;

  function isBurdenItem(item) {
    return (item.burdenCost || 0) > 0;
  }

  // ===========================================================================
  // BURDEN CALCULATION — Simplified to flat 10 (no modifiers)
  // ===========================================================================
  function calculateBurdenCapacities() {
    return BURDEN_LIMIT;
  }

  // ===========================================================================
  // TOAST NOTIFICATIONS — FIX #7 (replaces alert())
  // ===========================================================================
  let toastTimeout = null;

  function showToast(message, type) {
    type = type || 'error';
    // Remove existing toast
    const existing = document.getElementById('eq-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.id = 'eq-toast';
    toast.className = 'eq-toast eq-toast-' + type;
    toast.textContent = message;
    toast.style.cssText = [
      'position: fixed',
      'top: 16px',
      'right: 16px',
      'z-index: 10000',
      'padding: 12px 20px',
      'border-radius: 8px',
      'font-size: 0.9rem',
      'font-weight: 600',
      'max-width: 420px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.5)',
      'transform: translateX(120%)',
      'transition: transform 0.3s ease',
      type === 'error'
        ? 'background: var(--accent-red, #c0392b); color: #fff;'
        : type === 'warn'
        ? 'background: var(--accent-gold, #d4a017); color: #000;'
        : 'background: var(--bg-primary, #1a1a2e); color: var(--text-primary, #eee); border: 1px solid var(--accent-gold, #d4a017);'
    ].join(';');
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    toastTimeout = setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toastTimeout = setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===========================================================================
  // DEBOUNCE UTILITY — FIX #8
  // ===========================================================================
  function debounce(fn, ms) {
    let timer = null;
    return function() {
      const args = arguments;
      const ctx = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; fn.apply(ctx, args); }, ms);
    };
  }

  // Debounced grid re-render for search (150ms)
  let debouncedRenderGrid = debounce(function() { renderGrid(); }, 150);

  // ===========================================================================
  // ITEM SLUG / URL — FIX #5 (pre-computed cache)
  // ===========================================================================
  function getItemUrl(item) {
    const cached = itemUrlCache.get(item.id);
    if (cached) return cached;

    const slug = item.name
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/'/g, '-')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const url = 'https://rpg.angelssword.com/game/0.13.0/items/' + slug;
    itemUrlCache.set(item.id, url);
    return url;
  }

  // Pre-compute all item URLs (called once)
  function precomputeItemUrls() {
    if (typeof ITEMS_DATA === 'undefined') return;
    itemsById = new Map(ITEMS_DATA.map(i => [i.id, i]));
    ITEMS_DATA.forEach(i => getItemUrl(i));
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  function init() {
    console.log('[EquipmentScene] Initializing...');

    // Build lookup maps — FIX #4, #5
    precomputeItemUrls();

    // Render categories once — FIX #2
    renderCategories();

    // Bind event listeners for search input — FIX #8 (debounced)
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        debouncedRenderGrid();
      });
    }

    // Bind event listeners for sort dropdown
    const sortSelect = document.getElementById('equipment-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortMode = e.target.value;
        renderGrid();
      });
    }

    // Bind event listeners for "Show unknown price" toggle
    const showUnknownCheckbox = document.getElementById('equipment-show-unknown');
    if (showUnknownCheckbox) {
      showUnknownCheckbox.addEventListener('change', (e) => {
        showUnknownPrice = e.target.checked;
        renderGrid();
      });
    }

    // Bind delegation for category buttons, grid, inventory shelf, sidebar actions
    const stepEl = document.getElementById('step-equipment');
    if (stepEl) {
      stepEl.addEventListener('click', handlePageClick);
    }
  }

  // ===========================================================================
  // DATA MANAGEMENT
  // ===========================================================================
  function setCharacterData(data) {
    charContext = {
      race: data.race || null,
      ancestry: data.ancestry || null,
      cls: data.cls || null,
      breakthroughs: data.breakthroughs || [],
      stats: data.stats || null,
      clim: data.clim !== undefined ? data.clim : 3000
    };

    // FIX #11: No auto-select of first item — start with null
  }

  // Calculate current spent resources
  function calculateSpent() {
    let climSpent = 0;
    let burdenSpent = 0;

    for (const entry of Object.values(inventory)) {
      climSpent += entry.item.climCost * entry.quantity;
      // Only combat items count toward burden
      if (isBurdenItem(entry.item)) {
        burdenSpent += entry.item.burdenCost * entry.quantity;
      }
    }

    return { clim: climSpent, burden: burdenSpent };
  }

  // Add an item to the purchase inventory (or increment quantity)
  function adjustItemQuantity(itemId, adjustment) {
    // FIX #4: O(1) lookup
    const item = itemsById.get(itemId);
    if (!item) return;

    const currentEntry = inventory[itemId];
    const currentQty = currentEntry ? currentEntry.quantity : 0;
    const newQty = Math.max(0, currentQty + adjustment);

    if (newQty === currentQty) return;

    if (newQty > currentQty) {
      // FIX #3: Calculate once, reuse
      const burdenCap = calculateBurdenCapacities();
      const currentStats = calculateSpent();

      const addedClim = item.climCost * (newQty - currentQty);
      const addedBurden = item.burdenCost * (newQty - currentQty);

      if (currentStats.clim + addedClim > charContext.clim) {
        // FIX #7: Toast instead of alert
        showToast('Cannot add ' + item.name + '. Not enough Clim! Required: ' + addedClim + ', Available: ' + (charContext.clim - currentStats.clim) + '.', 'error');
        return;
      }

      if (isBurdenItem(item) && currentStats.burden + addedBurden > burdenCap) {
        showToast('Warning: Adding ' + item.name + ' exceeds carrying capacity! Current: ' + currentStats.burden + '/' + burdenCap + ', would be ' + (currentStats.burden + addedBurden) + '.', 'warn');
      }
    }

    if (newQty === 0) {
      delete inventory[itemId];
    } else {
      inventory[itemId] = {
        item: item,
        quantity: newQty
      };
    }

    // Make this item the inspected item when added or updated
    inspectedItem = item;

    // ponytail: targeted update — skip grid re-render on qty change
    updateAfterQuantityChange(itemId);
  }

  // Targeted update after a quantity change — skips renderGrid()
  function updateAfterQuantityChange(changedItemId) {
    const burdenCap = calculateBurdenCapacities();
    const stats = calculateSpent();

    // Update owned badge on the specific card if it exists in the grid
    const card = document.querySelector(`.eq-card[data-id="${changedItemId}"]`);
    if (card) {
      const inInventory = getQuantityInInventory(changedItemId);
      let badge = card.querySelector('.eq-card-owned-badge');
      if (inInventory > 0) {
        if (badge) {
          badge.textContent = inInventory;
        } else {
          badge = document.createElement('div');
          badge.className = 'eq-card-owned-badge';
          badge.textContent = inInventory;
          card.appendChild(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    }

    updateStickyHeader(burdenCap, stats);
    renderInventoryShelf();
    renderSidebar();
    highlightInspectedCard();
  }

  // Check the currently owned inventory quantity
  function getQuantityInInventory(itemId) {
    return inventory[itemId] ? inventory[itemId].quantity : 0;
  }

  // ===========================================================================
  // EVENT DELEGATION
  // ===========================================================================
  function handlePageClick(e) {
    // 1. Category filter button clicks
    const catBtn = e.target.closest('.eq-category-btn');
    if (catBtn) {
      activeCategory = catBtn.dataset.category;
      document.querySelectorAll('.eq-category-btn').forEach(btn => btn.classList.remove('active'));
      catBtn.classList.add('active');
      renderGrid();
      return;
    }

    // 2. Click on an item card to inspect it (entire card is clickable)
    const card = e.target.closest('.eq-card');
    if (card) {
      const itemId = card.dataset.id;
      // FIX #4: O(1) lookup
      const item = itemsById.get(itemId);
      if (item) {
        inspectedItem = item;
        renderSidebar();
        highlightInspectedCard();
      }
      return;
    }

    // 3. Shelf remove button — must come before shelf item click to stop propagation
    const shelfRemoveBtn = e.target.closest('.eq-shelf-remove-btn');
    if (shelfRemoveBtn) {
      e.stopPropagation();
      const itemId = shelfRemoveBtn.dataset.id;
      adjustItemQuantity(itemId, -1);
      return;
    }

    // 4. Click on an item in the purchased inventory shelf to inspect it
    const shelfItem = e.target.closest('.eq-shelf-item');
    if (shelfItem) {
      const itemId = shelfItem.dataset.id;
      const item = itemsById.get(itemId);
      if (item) {
        inspectedItem = item;
        renderSidebar();
        highlightInspectedCard();
      }
      return;
    }

    // 5. Sidebar remove button clicks
    const removeBtn = e.target.closest('.eq-sidebar-remove-btn');
    if (removeBtn) {
      const itemId = removeBtn.dataset.id;
      adjustItemQuantity(itemId, -1);
      return;
    }

    // 5. Sidebar clear all quantities click
    const clearBtn = e.target.closest('.eq-sidebar-clear-btn');
    if (clearBtn) {
      const itemId = clearBtn.dataset.id;
      if (inventory[itemId]) {
        adjustItemQuantity(itemId, -inventory[itemId].quantity);
      }
      return;
    }

    // 6. Sidebar add button clicks (from detail panel)
    const sidebarAddBtn = e.target.closest('.eq-sidebar-add-btn');
    if (sidebarAddBtn) {
      if (inspectedItem) {
        const qtyInput = document.getElementById('eq-sidebar-qty');
        const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
        if (qty <= 0) {
          showToast('Please select a quantity greater than 0 to purchase.', 'error');
          return;
        }
        adjustItemQuantity(inspectedItem.id, qty);
        // Reset qty input
        if (qtyInput) qtyInput.value = '1';
      }
      return;
    }

    // 7. Sidebar qty stepper
    const sidebarQtyBtn = e.target.closest('.eq-sidebar-qty-btn');
    if (sidebarQtyBtn) {
      const action = sidebarQtyBtn.dataset.action;
      const qtyInput = document.getElementById('eq-sidebar-qty');
      if (qtyInput) {
        let val = parseInt(qtyInput.value) || 1;
        val = action === 'increase' ? val + 1 : Math.max(1, val - 1);
        qtyInput.value = val;
      }
      return;
    }
  }

  // Highlight the card currently being inspected
  function highlightInspectedCard() {
    document.querySelectorAll('.eq-card').forEach(card => {
      card.classList.remove('inspected');
      if (inspectedItem && card.dataset.id === inspectedItem.id) {
        card.classList.add('inspected');
      }
    });
    document.querySelectorAll('.eq-shelf-item').forEach(item => {
      item.classList.remove('active');
      if (inspectedItem && item.dataset.id === inspectedItem.id) {
        item.classList.add('active');
      }
    });
  }

  // ===========================================================================
  // RENDERING
  // ===========================================================================
  function render() {
    console.log('[EquipmentScene] Rendering step panel...');

    // Check if variables are valid
    if (typeof ITEMS_DATA === 'undefined') {
      console.error('ITEMS_DATA is missing. Cannot render item list.');
      return;
    }

    // Render item grid
    renderGrid();

    // Refresh calculations and sidebars
    refresh();
  }

  function refresh() {
    // FIX #3: Compute once, pass down
    const burdenCap = calculateBurdenCapacities();
    const stats = calculateSpent();

    renderGrid();
    updateStickyHeader(burdenCap, stats);
    renderInventoryShelf();
    renderSidebar();
    highlightInspectedCard();
  }

  function updateStickyHeader(burdenCap, stats) {
    const remaining = charContext.clim - stats.clim;

    const remainingEl = document.getElementById('eq-clim-remaining');
    if (remainingEl) {
      remainingEl.textContent = remaining + ' Clim';
      if (remaining < 500) {
        remainingEl.style.color = 'var(--text-secondary)';
      } else {
        remainingEl.style.color = '';
      }
    }

    const spentEl = document.getElementById('eq-clim-spent');
    if (spentEl) spentEl.textContent = stats.clim + ' Clim';

    const burdenEl = document.getElementById('eq-burden');
    if (burdenEl) {
      burdenEl.textContent = stats.burden + ' / ' + burdenCap;
      if (stats.burden > burdenCap) {
        burdenEl.style.color = 'var(--accent-red)';
      } else if (stats.burden >= burdenCap * 0.8) {
        burdenEl.style.color = 'var(--text-secondary)';
      } else {
        burdenEl.style.color = '';
      }
    }
  }

  function renderCategories() {
    const container = document.getElementById('equipment-categories');
    if (!container) return;

    let html = '';
    CATEGORIES.forEach(cat => {
      const activeClass = cat === activeCategory ? 'active' : '';
      html += '<button type="button" class="eq-category-btn ' + activeClass + '" data-category="' + cat + '">' + window.escapeHtml(cat) + '</button>';
    });

    container.innerHTML = html;
  }

  function renderGrid() {
    const grid = document.getElementById('equipment-grid');
    if (!grid) return;

    const filtered = ITEMS_DATA.filter(item => {
      // Hide items with unknown price (climCost === 0) unless toggle is on
      if (!showUnknownPrice && item.climCost === 0) return false;
      const matchCat = activeCategory === 'All' || item.type === activeCategory;
      const matchSearch = !searchQuery ||
                          item.name.toLowerCase().includes(searchQuery) ||
                          (item.subType && item.subType.toLowerCase().includes(searchQuery)) ||
                          item.description.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="eq-grid-empty">No items match your filters. Try a different search!</div>';
      return;
    }

    // Sort by price if not default
    if (sortMode !== 'default') {
      filtered.sort((a, b) => {
        const costA = a.climCost || 0;
        const costB = b.climCost || 0;
        return sortMode === 'asc' ? costA - costB : costB - costA;
      });
    }

    let html = '';
    filtered.forEach(item => {
      const inInventory = getQuantityInInventory(item.id);
      const ownedBadge = inInventory > 0 ? '<div class="eq-card-owned-badge">' + inInventory + '</div>' : '';
      const isInspected = inspectedItem && inspectedItem.id === item.id ? 'inspected' : '';
      const itemImg = item.imageSmUrl || item.imageLgUrl || '';
      // FIX #5: Use pre-computed URL
      const itemUrl = getItemUrl(item);

      html +=
        '<div class="eq-card ' + isInspected + '" data-id="' + item.id + '" title="' + window.escapeHtml(item.name) + '">' +
          (itemImg ? '<div class="eq-card-img" style="background-image: url(\'' + window.escapeHtml(itemImg) + '\');"></div>' : '<div class="eq-card-initial">' + window.escapeHtml(item.name.charAt(0)) + '</div>') +
          '<div class="eq-card-overlay">' +
            '<div class="eq-card-bottom">' +
              '<h4 class="eq-card-title">' + window.escapeHtml(item.name) + '</h4>' +
              '<div class="eq-card-meta">' + window.escapeHtml(item.subType || '') + ' \u00b7 ' + window.escapeHtml(item.cost) + '</div>' +
              '<a href="' + itemUrl + '" target="_blank" class="eq-card-details-link">See details \u2197</a>' +
            '</div>' +
          '</div>' +
          ownedBadge +
        '</div>';
    });

    grid.innerHTML = html;
  }

  function renderInventoryShelf() {
    const container = document.getElementById('purchased-inventory-shelf');
    if (!container) return;

    const keys = Object.keys(inventory);
    if (keys.length === 0) {
      container.innerHTML = '<div class="eq-shelf-empty">Your purchased inventory is empty. Select items below to buy!</div>';
      return;
    }

    // FIX #14: CSS-based fallback instead of hardcoded CDN URL
    let html = '<div class="eq-shelf-grid">';
    keys.sort().forEach(itemId => {
      const entry = inventory[itemId];
      const isInspected = inspectedItem && inspectedItem.id === itemId ? 'active' : '';
      const itemImg = entry.item.imageSmUrl || entry.item.imageLgUrl || '';

      html +=
        '<div class="eq-shelf-item ' + isInspected + '" data-id="' + itemId + '" title="Click to view details: ' + window.escapeHtml(entry.item.name) + '">' +
          (itemImg
            ? '<div class="eq-shelf-item-icon" style="background-image: url(\'' + window.escapeHtml(itemImg) + '\');"></div>'
            : '<div class="eq-shelf-item-icon eq-shelf-item-icon-fallback">' + window.escapeHtml(entry.item.name.charAt(0)) + '</div>'
          ) +
          '<div class="eq-shelf-item-details">' +
            '<span class="eq-shelf-item-name">' + window.escapeHtml(entry.item.name) + '</span>' +
            '<span class="eq-shelf-item-qty">Qty: <strong>' + entry.quantity + '</strong></span>' +
          '</div>' +
           '<button type="button" class="eq-shelf-remove-btn" data-id="' + itemId + '" title="Remove one ' + window.escapeHtml(entry.item.name) + '">×</button>' +
        '</div>';
      });
      html += '</div>';

    container.innerHTML = html;
  }

  function renderSidebar() {
    // 1. Render item inspection detail card
    const detailContainer = document.getElementById('eq-item-detail-panel');
    if (detailContainer) {
      if (!inspectedItem) {
        detailContainer.innerHTML =
          '<div class="eq-detail-empty">' +
            '<span class="eq-detail-empty-icon">\ud83d\udd0d</span>' +
            '<span>Select an item in the shelf or grid to inspect full stats, rules, and modifications.</span>' +
          '</div>';
      } else {
        const itemImg = inspectedItem.imageLgUrl || inspectedItem.imageSmUrl || '';

        let specRows =
          '<div class="eq-spec-row"><span class="eq-spec-label">Category:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.type) + '</span></div>' +
          '<div class="eq-spec-row"><span class="eq-spec-label">Sub-Type:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.subType || '-') + '</span></div>' +
          '<div class="eq-spec-row"><span class="eq-spec-label">Clim Cost:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.cost) + '</span></div>' +
          '<div class="eq-spec-row"><span class="eq-spec-label">Weight (Burden):</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.burden) + '</span></div>';

        // FIX #13: Check for both empty string and '-'
        if (inspectedItem.activationCost && inspectedItem.activationCost !== '-' && inspectedItem.activationCost !== '') {
          specRows += '<div class="eq-spec-row"><span class="eq-spec-label">Activation Cost:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.activationCost) + '</span></div>';
        }
        if (inspectedItem.shellSize && inspectedItem.shellSize !== '-' && inspectedItem.shellSize !== '') {
          specRows += '<div class="eq-spec-row"><span class="eq-spec-label">Shell Size:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.shellSize) + '</span></div>';
        }
        if (inspectedItem.fuelUsage && inspectedItem.fuelUsage !== '-' && inspectedItem.fuelUsage !== '') {
          specRows += '<div class="eq-spec-row"><span class="eq-spec-label">Fuel Usage:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.fuelUsage) + '</span></div>';
        }
        if (inspectedItem.craftingPoints && inspectedItem.craftingPoints !== '-' && inspectedItem.craftingPoints !== '') {
          specRows += '<div class="eq-spec-row"><span class="eq-spec-label">Crafting Points:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.craftingPoints) + '</span></div>';
        }
        if (inspectedItem.craftingType && inspectedItem.craftingType !== '-' && inspectedItem.craftingType !== '') {
          specRows += '<div class="eq-spec-row"><span class="eq-spec-label">Crafting Type:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.craftingType) + '</span></div>';
        }

        // Check if weapon has mods or special description
        let modSection = '';
        const lowerDesc = inspectedItem.description.toLowerCase();
        if (lowerDesc.includes('mods:') || lowerDesc.includes('modifications:') || inspectedItem.subType === 'Weapon' || inspectedItem.subType === 'Armor') {
          modSection =
            '<div class="eq-detail-mods">' +
              '<h5 class="eq-detail-mods-title">\ud83d\udee1\ufe0f Modifications & Attachments</h5>' +
              '<div class="eq-detail-mods-content">' +
                (inspectedItem.subType === 'Weapon' ? 'Accepts universal Weapon Attachments (Sights, Scopes, Stocks). Allows Element/Attribute infusions.' : '') +
                (inspectedItem.subType === 'Armor' ? 'Accepts Armorsmith Modifications (Plating, Insulation, Lightweight Frame).' : '') +
                '<p class="eq-mod-desc-hint" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Configure modifications and attachments on your character sheet after creation.</p>' +
              '</div>' +
            '</div>';
        }

        // Purchase controls in detail panel
        const currentOwned = getQuantityInInventory(inspectedItem.id);
        let purchaseSection =
          '<div class="eq-detail-purchase">' +
            '<div class="eq-detail-purchase-info">' +
              '<span class="eq-detail-purchase-cost">Cost: ' + window.escapeHtml(inspectedItem.cost) + ' Clim</span>' +
              '<span class="eq-detail-purchase-burden">Burden: ' + window.escapeHtml(inspectedItem.burden) + '</span>' +
              (currentOwned > 0 ? '<span class="eq-detail-purchase-owned">Owned: ' + currentOwned + '</span>' : '') +
            '</div>' +
            '<div class="eq-detail-purchase-controls">' +
              '<div class="eq-sidebar-qty-stepper">' +
                '<button type="button" class="eq-sidebar-qty-btn" data-action="decrease">\u2212</button>' +
                '<input type="number" id="eq-sidebar-qty" value="1" min="1" max="99" class="eq-sidebar-qty-input">' +
                '<button type="button" class="eq-sidebar-qty-btn" data-action="increase">+</button>' +
              '</div>' +
              '<button type="button" class="eq-sidebar-add-btn">Add to Inventory</button>' +
            '</div>' +
          '</div>';

        const wikiUrl = 'https://rpg.angelssword.com/game/0.13.0/items?search=' + encodeURIComponent(inspectedItem.name);

        detailContainer.innerHTML =
          '<div class="eq-detail-card animate-fade-in">' +
            '<div class="eq-detail-header">' +
              (itemImg
                ? '<div class="eq-detail-img-box" style="background-image: url(\'' + window.escapeHtml(itemImg) + '\');"></div>'
                : '<div class="eq-detail-img-box eq-detail-img-fallback">' + window.escapeHtml(inspectedItem.name.charAt(0)) + '</div>'
              ) +
              '<div class="eq-detail-header-text">' +
                '<span class="eq-detail-sub">' + window.escapeHtml(inspectedItem.type) + ' \u00b7 ' + window.escapeHtml(inspectedItem.subType) + '</span>' +
                '<h3 class="eq-detail-title">' + window.escapeHtml(inspectedItem.name) + '</h3>' +
                '<a href="' + wikiUrl + '" target="_blank" class="eq-wiki-btn">See Details (Web) \u2197</a>' +
              '</div>' +
            '</div>' +
            '<div class="eq-detail-specs">' +
              specRows +
            '</div>' +
            '<div class="eq-detail-description">' +
              '<h5>Item Description & Rules</h5>' +
              '<p>' + window.decodeHtmlEntities(inspectedItem.description || 'No description available for this item.') + '</p>' +
            '</div>' +
            modSection +
            purchaseSection +
          '</div>';
      }
    }
  }

  // ===========================================================================
  // EXTERNAL SCENE INTERFACE
  // ===========================================================================
  function getInventory() {
    // Return array of objects matching expectations
    return Object.values(inventory).map(entry => ({
      item: {
        id: entry.item.id,
        indexId: entry.item.indexId,
        name: entry.item.name,
        type: entry.item.type,
        subType: entry.item.subType,
        cost: entry.item.cost,
        climCost: entry.item.climCost,
        burden: entry.item.burden,
        burdenCost: entry.item.burdenCost,
        description: entry.item.description,
        imageSmUrl: entry.item.imageSmUrl,
        imageLgUrl: entry.item.imageLgUrl
      },
      quantity: entry.quantity
    }));
  }

  function getClimSpent() {
    return calculateSpent().clim;
  }

  function getRemainingClim() {
    return charContext.clim - getClimSpent();
  }

  function restoreState(savedInventory) {
    console.log('[EquipmentScene] Restoring state...', savedInventory);
    inventory = {};
    if (Array.isArray(savedInventory)) {
      savedInventory.forEach(entry => {
        if (entry.item && entry.item.id) {
          inventory[entry.item.id] = {
            item: entry.item,
            quantity: entry.quantity || 1
          };
        }
      });
    }

    // FIX #11: Default inspected item to first item in restored inventory if possible
    const keys = Object.keys(inventory);
    if (keys.length > 0) {
      inspectedItem = inventory[keys[0]].item;
    } else {
      // No auto-select from ITEMS_DATA — leave as null
      inspectedItem = null;
    }

    refresh();
  }

  function reset() {
    console.log('[EquipmentScene] Resetting state...');
    inventory = {};
    activeCategory = 'All';
    searchQuery = '';
    sortMode = 'default';
    showUnknownPrice = false;
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('equipment-sort-select');
    if (sortSelect) sortSelect.value = 'default';
    const showUnknownCheckbox = document.getElementById('equipment-show-unknown');
    if (showUnknownCheckbox) showUnknownCheckbox.checked = false;
    // FIX #11: No auto-select
    inspectedItem = null;

    refresh();
  }

  return {
    init: init,
    setCharacterData: setCharacterData,
    render: render,
    refresh: refresh,
    getInventory: getInventory,
    getClimSpent: getClimSpent,
    getRemainingClim: getRemainingClim,
    restoreState: restoreState,
    reset: reset
  };
})();
