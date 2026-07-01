/**
 * Lyrian Chronicles - Item Purchase and Equipment Scene
 * Handles purchasing items, tracking inventory (combat + storage), and calculating burden
 */

/* exported EquipmentScene */
const EquipmentScene = (function() {
  'use strict';

  // ponytail: two inventories — combat (burden-limited) + storage (unlimited)
  let inventory = {
    combat: {},
    storage: {}
  };

  // Selected category and search state
  let activeCategory = 'All';
  let activeSubType = 'All';
  let searchQuery = '';
  let sortMode = 'default'; // 'default', 'asc', 'desc'
  let showUnknownPrice = false;

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

  // Lookup maps (built once in init)
  let itemsById = new Map();
  let itemUrlCache = new Map();

  // ===========================================================================
  // BURDEN — Official rule: flat limit of 10, over = Rooted
  // ===========================================================================
  function isBurdenItem(item) {
    return (item.burdenCost || 0) > 0;
  }

  function calculateBurdenCapacities() {
    return BURDEN_LIMIT;
  }

  // ===========================================================================
  // TOAST NOTIFICATIONS
  // ===========================================================================
  let toastTimeout = null;

  function showToast(message, type) {
    type = type || 'error';
    const existing = document.getElementById('eq-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.id = 'eq-toast';
    toast.className = 'eq-toast eq-toast-' + type;
    toast.textContent = message;
    toast.style.cssText = [
      'position: fixed', 'top: 16px', 'right: 16px', 'z-index: 10000',
      'padding: 12px 20px', 'border-radius: 8px', 'font-size: 0.9rem',
      'font-weight: 600', 'max-width: 420px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.5)',
      'transform: translateX(120%)', 'transition: transform 0.3s ease',
      type === 'error'
        ? 'background: var(--accent-red, #c0392b); color: #fff;'
        : type === 'warn'
        ? 'background: var(--accent-gold, #d4a017); color: #000;'
        : 'background: var(--bg-primary, #1a1a2e); color: var(--text-primary, #eee); border: 1px solid var(--accent-gold, #d4a017);'
    ].join(';');
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

    toastTimeout = setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toastTimeout = setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===========================================================================
  // DEBOUNCE UTILITY
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

  let debouncedRenderGrid = debounce(function() { renderGrid(); }, 150);

  // ===========================================================================
  // ITEM SLUG / URL
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

  function precomputeItemUrls() {
    if (typeof ITEMS_DATA === 'undefined') return;
    itemsById = new Map(ITEMS_DATA.map(i => [i.id, i]));
    ITEMS_DATA.forEach(i => {
      getItemUrl(i);
      i._nameLower = (i.name || '').toLowerCase();
      i._subTypeLower = (i.subType || '').toLowerCase();
      i._descLower = (i.description || '').toLowerCase();
    });
  }

  // ===========================================================================
  // MOD PARSING — extracts mods from description text for display
  // ponytail: display only, no selection/calculation yet
  // ===========================================================================
  function parseMods(item) {
    const desc = item.description || '';
    const modsIdx = desc.indexOf('Mods:');
    if (modsIdx === -1) return null;

    const modsText = desc.substring(modsIdx + 5).trim();
    const baseDesc = desc.substring(0, modsIdx).trim();

    const tiers = [];
    const tierRegex = /(A mods|B mods|Frame mods|C mods|S mods):?\s*/gi;
    let match;

    while ((match = tierRegex.exec(modsText)) !== null) {
      const tierName = match[1].replace(' mods', '').replace(' Mods', '').trim();
      const tierStart = match.index + match[0].length;
      const nextMatch = tierRegex.exec(modsText);
      const tierEnd = nextMatch ? nextMatch.index : modsText.length;
      const tierContent = modsText.substring(tierStart, tierEnd).trim();
      if (tierContent) {
        tiers.push({ tier: tierName, content: tierContent });
      }
      tierRegex.lastIndex = tierEnd;
    }

    return { baseDesc, tiers, raw: modsText };
  }

  // ===========================================================================
  // MODAL
  // ===========================================================================
  function openModal(item) {
    inspectedItem = item;
    renderModalContent();
    const overlay = document.getElementById('eq-modal-overlay');
    if (overlay) {
      overlay.hidden = false;
      overlay.classList.add('visible');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('eq-modal-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.hidden = true; }, 200);
    }
  }

  function renderModalContent() {
    const body = document.getElementById('eq-modal-body');
    if (!body || !inspectedItem) return;

    const itemImg = inspectedItem.imageLgUrl || inspectedItem.imageSmUrl || '';
    const wikiUrl = 'https://rpg.angelssword.com/game/0.13.0/items?search=' + encodeURIComponent(inspectedItem.name);

    let specRows =
      '<div class="eq-spec-row"><span class="eq-spec-label">Category:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.type) + '</span></div>' +
      '<div class="eq-spec-row"><span class="eq-spec-label">Sub-Type:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.subType || '-') + '</span></div>' +
      '<div class="eq-spec-row"><span class="eq-spec-label">Clim Cost:</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.cost) + '</span></div>' +
      '<div class="eq-spec-row"><span class="eq-spec-label">Weight (Burden):</span><span class="eq-spec-val">' + window.escapeHtml(inspectedItem.burden) + '</span></div>';

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

    const combatQty = getQuantityInInventory(inspectedItem.id, 'combat');
    const storageQty = getQuantityInInventory(inspectedItem.id, 'storage');
    const totalOwned = combatQty + storageQty;

    // ponytail: parse mods from description — display only, no selection yet
    const mods = parseMods(inspectedItem);
    let descText = mods ? mods.baseDesc : (inspectedItem.description || 'No description available.');
    let modsSection = '';

    if (mods && mods.tiers.length > 0) {
      let tiersHtml = '';
      mods.tiers.forEach(tier => {
        tiersHtml += '<div class="eq-mod-tier"><h6 class="eq-mod-tier-title">' + window.escapeHtml(tier.tier) + ' Mods</h6><p class="eq-mod-tier-content">' + window.decodeHtmlEntities(tier.content) + '</p></div>';
      });
      modsSection =
        '<div class="eq-detail-mods">' +
          '<h5 class="eq-detail-mods-title">🛡️ Modifications</h5>' +
          '<div class="eq-detail-mods-content">' + tiersHtml + '</div>' +
        '</div>';
    }

    body.innerHTML =
      '<div class="eq-detail-card">' +
        '<div class="eq-detail-header">' +
          (itemImg
            ? '<div class="eq-detail-img-box" style="background-image: url(\'' + window.escapeHtml(itemImg) + '\');"></div>'
            : '<div class="eq-detail-img-box eq-detail-img-fallback">' + window.escapeHtml(inspectedItem.name.charAt(0)) + '</div>'
          ) +
          '<div class="eq-detail-header-text">' +
            '<span class="eq-detail-sub">' + window.escapeHtml(inspectedItem.type) + ' · ' + window.escapeHtml(inspectedItem.subType) + '</span>' +
            '<h3 class="eq-detail-title">' + window.escapeHtml(inspectedItem.name) + '</h3>' +
            '<a href="' + wikiUrl + '" target="_blank" class="eq-wiki-btn">See Details (Web) ↗</a>' +
          '</div>' +
        '</div>' +
        '<div class="eq-detail-specs">' + specRows + '</div>' +
        '<div class="eq-detail-description">' +
          '<h5>Item Description</h5>' +
          '<p>' + window.decodeHtmlEntities(descText || 'No description available.') + '</p>' +
        '</div>' +
        modsSection +
        (totalOwned > 0 ? '<div class="eq-detail-owned-info"><strong>Owned:</strong> Combat: ' + combatQty + ', Storage: ' + storageQty + '</div>' : '') +
        '<div class="eq-detail-purchase">' +
          '<div class="eq-detail-purchase-controls">' +
            '<div class="eq-sidebar-qty-stepper">' +
              '<button type="button" class="eq-sidebar-qty-btn" data-action="decrease">−</button>' +
              '<input type="number" id="eq-sidebar-qty" value="1" min="1" max="99" class="eq-sidebar-qty-input">' +
              '<button type="button" class="eq-sidebar-qty-btn" data-action="increase">+</button>' +
            '</div>' +
            '<div class="eq-modal-purchase-buttons">' +
              '<button type="button" class="eq-sidebar-add-btn eq-add-combat" data-target="combat">⚔️ Add to Combat</button>' +
              '<button type="button" class="eq-sidebar-add-btn eq-add-storage" data-target="storage">🎒 Add to Storage</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  function init() {
    console.log('[EquipmentScene] Initializing...');

    precomputeItemUrls();
    renderCategories();
    renderSubTypeFilter();

    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        debouncedRenderGrid();
      });
    }

    const sortSelect = document.getElementById('equipment-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortMode = e.target.value;
        renderGrid();
      });
    }

    const subTypeSelect = document.getElementById('equipment-subtype-select');
    if (subTypeSelect) {
      subTypeSelect.addEventListener('change', (e) => {
        activeSubType = e.target.value;
        renderGrid();
      });
    }

    const showUnknownCheckbox = document.getElementById('equipment-show-unknown');
    if (showUnknownCheckbox) {
      showUnknownCheckbox.addEventListener('change', (e) => {
        showUnknownPrice = e.target.checked;
        renderGrid();
      });
    }

    // Bind delegation for category buttons, grid, inventory shelf, modal actions
    const stepEl = document.getElementById('step-equipment');
    if (stepEl) {
      stepEl.addEventListener('click', handlePageClick);
    }

    // Modal close handlers
    const modalOverlay = document.getElementById('eq-modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
      const closeBtn = modalOverlay.querySelector('.eq-modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
    }

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('eq-modal-overlay');
        if (overlay && !overlay.hidden) closeModal();
      }
    });
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
  }

  function calculateSpent() {
    let climSpent = 0;
    let burdenSpent = 0;

    // Clim: both inventories count
    for (const section of [inventory.combat, inventory.storage]) {
      for (const entry of Object.values(section)) {
        climSpent += entry.item.climCost * entry.quantity;
      }
    }

    // Burden: combat inventory only
    for (const entry of Object.values(inventory.combat)) {
      if (isBurdenItem(entry.item)) {
        burdenSpent += entry.item.burdenCost * entry.quantity;
      }
    }

    return { clim: climSpent, burden: burdenSpent };
  }

  function adjustItemQuantity(itemId, adjustment, targetInventory) {
    targetInventory = targetInventory || 'combat';
    const item = itemsById.get(itemId);
    if (!item) return;

    const section = inventory[targetInventory];
    const currentEntry = section[itemId];
    const currentQty = currentEntry ? currentEntry.quantity : 0;
    const newQty = Math.max(0, currentQty + adjustment);

    if (newQty === currentQty) return;

    if (newQty > currentQty) {
      const burdenCap = calculateBurdenCapacities();
      const currentStats = calculateSpent();

      const addedClim = item.climCost * (newQty - currentQty);
      const addedBurden = (targetInventory === 'combat' && isBurdenItem(item))
        ? item.burdenCost * (newQty - currentQty)
        : 0;

      if (currentStats.clim + addedClim > charContext.clim) {
        showToast('Cannot add ' + item.name + '. Not enough Clim! Required: ' + addedClim + ', Available: ' + (charContext.clim - currentStats.clim) + '.', 'error');
        return;
      }

      if (addedBurden > 0 && currentStats.burden + addedBurden > burdenCap) {
        showToast('Warning: Adding ' + item.name + ' to combat gear exceeds carrying capacity! Current: ' + currentStats.burden + '/' + burdenCap + '.', 'warn');
      }
    }

    if (newQty === 0) {
      delete section[itemId];
    } else {
      section[itemId] = { item: item, quantity: newQty };
    }

    inspectedItem = item;
    updateAfterQuantityChange(itemId, targetInventory);
  }

  function updateAfterQuantityChange(changedItemId) {
    const burdenCap = calculateBurdenCapacities();
    const stats = calculateSpent();

    // Update owned badge on grid card
    const card = document.querySelector('.eq-card[data-id="' + changedItemId + '"]');
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
    // ponytail: re-render modal if open and showing this item
    if (inspectedItem && document.getElementById('eq-modal-overlay') && !document.getElementById('eq-modal-overlay').hidden) {
      renderModalContent();
    }
    highlightInspectedCard();
  }

  function getQuantityInInventory(itemId, targetInventory) {
    if (targetInventory) {
      return inventory[targetInventory][itemId] ? inventory[targetInventory][itemId].quantity : 0;
    }
    // total across both
    const c = inventory.combat[itemId] ? inventory.combat[itemId].quantity : 0;
    const s = inventory.storage[itemId] ? inventory.storage[itemId].quantity : 0;
    return c + s;
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

    // 2. Click on an item card to open modal
    const card = e.target.closest('.eq-card');
    if (card) {
      const itemId = card.dataset.id;
      const item = itemsById.get(itemId);
      if (item) {
        openModal(item);
      }
      return;
    }

    // 3. Shelf remove button — remove from correct inventory
    const shelfRemoveBtn = e.target.closest('.eq-shelf-remove-btn');
    if (shelfRemoveBtn) {
      e.stopPropagation();
      const itemId = shelfRemoveBtn.dataset.id;
      const target = shelfRemoveBtn.dataset.inventory || 'combat';
      adjustItemQuantity(itemId, -1, target);
      return;
    }

    // 4. Click on an item in shelf to open modal
    const shelfItem = e.target.closest('.eq-shelf-item');
    if (shelfItem) {
      const itemId = shelfItem.dataset.id;
      const item = itemsById.get(itemId);
      if (item) {
        openModal(item);
      }
      return;
    }

    // 5. Sidebar remove/clear buttons (if any remain)
    const removeBtn = e.target.closest('.eq-sidebar-remove-btn');
    if (removeBtn) {
      const itemId = removeBtn.dataset.id;
      adjustItemQuantity(itemId, -1, 'combat');
      return;
    }

    const clearBtn = e.target.closest('.eq-sidebar-clear-btn');
    if (clearBtn) {
      const itemId = clearBtn.dataset.id;
      const target = clearBtn.dataset.inventory || 'combat';
      if (inventory[target][itemId]) {
        adjustItemQuantity(itemId, -inventory[target][itemId].quantity, target);
      }
      return;
    }

    // 6. Add button clicks (from modal) — with target inventory
    const sidebarAddBtn = e.target.closest('.eq-sidebar-add-btn');
    if (sidebarAddBtn) {
      if (inspectedItem) {
        const qtyInput = document.getElementById('eq-sidebar-qty');
        const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
        if (qty <= 0) {
          showToast('Please select a quantity greater than 0 to purchase.', 'error');
          return;
        }
        const target = sidebarAddBtn.dataset.target || 'combat';
        adjustItemQuantity(inspectedItem.id, qty, target);
        closeModal();
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

  // ponytail: track previous card/shelf item directly instead of querying all 206+ elements
  let lastInspectedCard = null;
  let lastInspectedShelf = null;

  // ponytail: lazy-load card images in batches — 60 concurrent downloads stalls the main thread
  const LAZY_BATCH = 12; // ponytail: load 12 at a time, not all 60 visible at once
  let lazyQueue = [];
  let lazyLoading = false;

  function flushLazyBatch() {
    if (lazyLoading) return;
    lazyLoading = true;
    const batch = lazyQueue.splice(0, LAZY_BATCH);
    batch.forEach(el => {
      const bg = el.dataset.bg;
      if (bg) {
        el.style.backgroundImage = `url('${bg}')`;
        el.removeAttribute('data-bg');
      }
    });
    // ponytail: yield between batches; keep draining if more queued
    requestAnimationFrame(() => {
      lazyLoading = false;
      if (lazyQueue.length > 0) flushLazyBatch();
    });
  }

  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.bg) {
        lazyQueue.push(entry.target);
        lazyImageObserver.unobserve(entry.target);
      }
    });
    if (lazyQueue.length > 0 && !lazyLoading) flushLazyBatch();
  }, { rootMargin: '100px' });

  function highlightInspectedCard() {
    // Remove highlight from previous
    if (lastInspectedCard) lastInspectedCard.classList.remove('inspected');
    if (lastInspectedShelf) lastInspectedShelf.classList.remove('active');

    if (!inspectedItem) {
      lastInspectedCard = null;
      lastInspectedShelf = null;
      return;
    }

    // Find and highlight new (cached lookup avoids queryAll)
    const card = document.querySelector('.eq-card[data-id="' + inspectedItem.id + '"]');
    if (card) {
      card.classList.add('inspected');
      lastInspectedCard = card;
    }
    const shelf = document.querySelector('.eq-shelf-item[data-id="' + inspectedItem.id + '"]');
    if (shelf) {
      shelf.classList.add('active');
      lastInspectedShelf = shelf;
    }
  }

  // ===========================================================================
  // RENDERING
  // ===========================================================================
  // ponytail: renderGrid+refresh both called renderGrid — 206-node DOM build twice. Only call once.
  function render() {
    console.log('[EquipmentScene] Rendering step panel...');

    if (typeof ITEMS_DATA === 'undefined') {
      console.error('ITEMS_DATA is missing. Cannot render item list.');
      return;
    }

    const burdenCap = calculateBurdenCapacities();
    const stats = calculateSpent();
    renderGrid();
    updateStickyHeader(burdenCap, stats);
    renderInventoryShelf();
    highlightInspectedCard();
  }

  function refresh() {
    const burdenCap = calculateBurdenCapacities();
    const stats = calculateSpent();

    renderGrid();
    updateStickyHeader(burdenCap, stats);
    renderInventoryShelf();
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

  function renderSubTypeFilter() {
    const select = document.getElementById('equipment-subtype-select');
    if (!select) return;
    if (typeof ITEMS_DATA === 'undefined') return;

    const subTypes = new Set();
    ITEMS_DATA.forEach(item => {
      if (item.subType) subTypes.add(item.subType);
    });
    const sorted = Array.from(subTypes).sort();

    let html = '<option value="All">All</option>';
    sorted.forEach(st => {
      html += '<option value="' + window.escapeHtml(st) + '">' + window.escapeHtml(st) + '</option>';
    });
    select.innerHTML = html;
  }

  function renderGrid() {
    const grid = document.getElementById('equipment-grid');
    if (!grid) return;

    const filtered = ITEMS_DATA.filter(item => {
      if (!showUnknownPrice && item.climCost === 0) return false;
      const matchCat = activeCategory === 'All' || item.type === activeCategory;
      const matchSubType = activeSubType === 'All' || item.subType === activeSubType;
      const matchSearch = !searchQuery ||
                          item._nameLower.includes(searchQuery) ||
                          item._subTypeLower.includes(searchQuery) ||
                          item._descLower.includes(searchQuery);
      return matchCat && matchSubType && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="eq-grid-empty">No items match your filters. Try a different search!</div>';
      return;
    }

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
      const itemUrl = getItemUrl(item);

      html +=
        '<div class="eq-card ' + isInspected + '" data-id="' + item.id + '" title="' + window.escapeHtml(item.name) + '">' +
          (itemImg ? '<div class="eq-card-img" data-bg="' + window.escapeHtml(itemImg) + '"></div>' : '<div class="eq-card-initial">' + window.escapeHtml(item.name.charAt(0)) + '</div>') +
          '<div class="eq-card-overlay">' +
            '<div class="eq-card-bottom">' +
              '<h4 class="eq-card-title">' + window.escapeHtml(item.name) + '</h4>' +
              '<div class="eq-card-meta">' + window.escapeHtml(item.subType || '') + ' · ' + window.escapeHtml(item.cost) + '</div>' +
              '<a href="' + itemUrl + '" target="_blank" class="eq-card-details-link">See details ↗</a>' +
            '</div>' +
          '</div>' +
          ownedBadge +
        '</div>';
    });

    grid.innerHTML = html;

    // ponytail: observe new lazy-image elements
    grid.querySelectorAll('.eq-card-img[data-bg]').forEach(el => lazyImageObserver.observe(el));
  }

  // ponytail: two separate shelf renders — combat + storage
  function renderInventoryShelf() {
    renderInventorySection('combat', 'combat-inventory-shelf');
    renderInventorySection('storage', 'storage-inventory-shelf');
  }

  function renderInventorySection(section, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = inventory[section];
    const keys = Object.keys(items);
    if (keys.length === 0) {
      container.innerHTML = '<div class="eq-shelf-empty">' + (section === 'combat' ? 'No combat gear equipped.' : 'Storage is empty.') + '</div>';
      return;
    }

    let html = '<div class="eq-shelf-grid">';
    keys.sort().forEach(itemId => {
      const entry = items[itemId];
      const isInspected = inspectedItem && inspectedItem.id === itemId ? 'active' : '';
      const itemImg = entry.item.imageSmUrl || entry.item.imageLgUrl || '';

      html +=
        '<div class="eq-shelf-item ' + isInspected + '" data-id="' + itemId + '" title="Click to view: ' + window.escapeHtml(entry.item.name) + '">' +
          (itemImg
            ? '<div class="eq-shelf-item-icon" style="background-image: url(\'' + window.escapeHtml(itemImg) + '\');"></div>'
            : '<div class="eq-shelf-item-icon eq-shelf-item-icon-fallback">' + window.escapeHtml(entry.item.name.charAt(0)) + '</div>'
          ) +
          '<div class="eq-shelf-item-details">' +
            '<span class="eq-shelf-item-name">' + window.escapeHtml(entry.item.name) + '</span>' +
            '<span class="eq-shelf-item-qty">Qty: <strong>' + entry.quantity + '</strong></span>' +
          '</div>' +
          '<button type="button" class="eq-shelf-remove-btn" data-id="' + itemId + '" data-inventory="' + section + '" title="Remove one">×</button>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // ===========================================================================
  // EXTERNAL SCENE INTERFACE
  // ===========================================================================
  function getInventory() {
    const result = [];
    for (const [section, items] of Object.entries(inventory)) {
      for (const entry of Object.values(items)) {
        result.push({
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
          quantity: entry.quantity,
          section: section
        });
      }
    }
    return result;
  }

  function getClimSpent() {
    return calculateSpent().clim;
  }

  function getRemainingClim() {
    return charContext.clim - getClimSpent();
  }

  function restoreState(savedInventory) {
    console.log('[EquipmentScene] Restoring state...', savedInventory);
    inventory = { combat: {}, storage: {} };
    if (Array.isArray(savedInventory)) {
      savedInventory.forEach(entry => {
        if (entry.item && entry.item.id) {
          // ponytail: legacy saves have no 'section' — default to combat
          const section = entry.section === 'storage' ? 'storage' : 'combat';
          inventory[section][entry.item.id] = {
            item: entry.item,
            quantity: entry.quantity || 1
          };
        }
      });
    }
    const keys = Object.keys(inventory.combat);
    if (keys.length > 0) {
      inspectedItem = inventory.combat[keys[0]].item;
    } else {
      inspectedItem = null;
    }
    refresh();
  }

  function reset() {
    console.log('[EquipmentScene] Resetting state...');
    inventory = { combat: {}, storage: {} };
    activeCategory = 'All';
    activeSubType = 'All';
    searchQuery = '';
    sortMode = 'default';
    showUnknownPrice = false;
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('equipment-sort-select');
    if (sortSelect) sortSelect.value = 'default';
    const subTypeSelect = document.getElementById('equipment-subtype-select');
    if (subTypeSelect) subTypeSelect.value = 'All';
    const showUnknownCheckbox = document.getElementById('equipment-show-unknown');
    if (showUnknownCheckbox) showUnknownCheckbox.checked = false;
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
