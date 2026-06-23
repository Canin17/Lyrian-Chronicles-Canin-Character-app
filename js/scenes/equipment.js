/**
 * Lyrian Chronicles - Item Purchase and Equipment Scene
 * Handles purchasing items, tracking inventory, and calculating burden
 */

/* exported EquipmentScene */
const EquipmentScene = (function() {
  // Inventory state: { itemId: { item, quantity } }
  let inventory = {};
  
  // Selected category and search state
  let activeCategory = 'All';
  let searchQuery = '';
  
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

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper to decode HTML entities for display
  function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    const result = textarea.value;
    textarea.innerHTML = '';
    return result;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  function init() {
    console.log('[EquipmentScene] Initializing...');
    
    // Bind event listeners for search input
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
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
    
    // Select first item as default inspected item if none selected
    if (!inspectedItem && typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA.length > 0) {
      inspectedItem = ITEMS_DATA[0];
    }
  }

  // Calculate carrying capacity based on Fitness stat + modifiers
  function calculateBurdenCapacities() {
    let fitness = 0;
    if (charContext.stats && charContext.stats.fitness !== undefined) {
      fitness = Number(charContext.stats.fitness) || 0;
    }

    // Baseline regular burden capacity is 10 + Fitness
    let regularCap = 10 + fitness;

    // Apply Paladin class modifier (+10)
    const hasPaladin = charContext.cls?.all?.some(c => c.class?.name.includes('Paladin')) || 
                       (charContext.cls?.primary?.class?.name?.includes('Paladin'));
    if (hasPaladin) {
      regularCap += 10;
    }

    // Apply "Tough" breakthrough modifier (+5)
    const hasTough = charContext.breakthroughs?.some(b => b.name.includes('Tough'));
    if (hasTough) {
      regularCap += 5;
    }

    // Apply "Arachne" breakthrough modifier (+2)
    const hasArachne = charContext.breakthroughs?.some(b => b.name.includes('Arachne'));
    if (hasArachne) {
      regularCap += 2;
    }

    // Combat capacity is baseline 50% of regular capacity, rounded down
    let combatCap = Math.floor(regularCap * 0.5);

    // Apply in-combat modifiers
    // Cavalry class adds +1 in-combat capacity
    const hasCavalry = charContext.cls?.all?.some(c => c.class?.name.includes('Cavalry')) || 
                       (charContext.cls?.primary?.class?.name?.includes('Cavalry'));
    if (hasCavalry) {
      combatCap += 1;
    }

    // Organized Inventory breakthroughs add +1 in-combat capacity each
    const hasOrg1 = charContext.breakthroughs?.some(b => b.name === 'Organized Inventory');
    const hasOrg2 = charContext.breakthroughs?.some(b => b.name === 'Organized Inventory II');
    const hasOrg3 = charContext.breakthroughs?.some(b => b.name === 'Organized Inventory III');
    if (hasOrg1) combatCap += 1;
    if (hasOrg2) combatCap += 1;
    if (hasOrg3) combatCap += 1;

    return {
      regular: regularCap,
      combat: combatCap
    };
  }

  // Calculate current spent resources
  function calculateSpent() {
    let climSpent = 0;
    let burdenSpent = 0;

    Object.values(inventory).forEach(entry => {
      climSpent += entry.item.climCost * entry.quantity;
      burdenSpent += entry.item.burdenCost * entry.quantity;
    });

    return {
      clim: climSpent,
      burden: burdenSpent
    };
  }

  // Add an item to the purchase inventory (or increment quantity)
  function adjustItemQuantity(itemId, adjustment) {
    const item = ITEMS_DATA.find(i => i.id === itemId);
    if (!item) return;

    const currentEntry = inventory[itemId];
    const currentQty = currentEntry ? currentEntry.quantity : 0;
    const newQty = Math.max(0, currentQty + adjustment);

    if (newQty === currentQty) return;

    if (newQty > currentQty) {
      // Validate cost and burden limits before adding
      const capacities = calculateBurdenCapacities();
      const currentStats = calculateSpent();
      
      const addedClim = item.climCost * (newQty - currentQty);
      const addedBurden = item.burdenCost * (newQty - currentQty);

      if (currentStats.clim + addedClim > charContext.clim) {
        alert(`Cannot add ${item.name}. Not enough Clim! Required: ${addedClim} Clim, Available: ${charContext.clim - currentStats.clim} Clim.`);
        return;
      }

      if (currentStats.burden + addedBurden > capacities.regular) {
        alert(`Cannot add ${item.name}. Exceeds your carrying capacity (Regular Burden limit)! Required: ${addedBurden} Burden, Capacity remaining: ${capacities.regular - currentStats.burden}.`);
        return;
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

    refresh();
  }

  // Check the temporary quantity selected on card but not yet "purchased" (if any)
  // Or check the currently owned inventory quantity
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
      const item = ITEMS_DATA.find(i => i.id === itemId);
      if (item) {
        inspectedItem = item;
        renderSidebar();
        highlightInspectedCard();
      }
      return;
    }

    // 3. Click on an item in the purchased inventory shelf to inspect it
    const shelfItem = e.target.closest('.eq-shelf-item');
    if (shelfItem) {
      const itemId = shelfItem.dataset.id;
      const item = ITEMS_DATA.find(i => i.id === itemId);
      if (item) {
        inspectedItem = item;
        renderSidebar();
        highlightInspectedCard();
      }
      return;
    }

    // 4. Sidebar remove button clicks
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
          alert('Please select a quantity greater than 0 to purchase.');
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

    // Render category tabs
    renderCategories();
    
    // Render item grid
    renderGrid();
    
    // Refresh calculations and sidebars
    refresh();
  }

  function refresh() {
    renderCategories();
    renderGrid();
    updateStickyHeader();
    renderInventoryShelf();
    renderSidebar();
    highlightInspectedCard();
  }

  function updateStickyHeader() {
    const capacities = calculateBurdenCapacities();
    const stats = calculateSpent();
    const remaining = charContext.clim - stats.clim;

    const totalEl = document.getElementById('eq-clim-total');
    if (totalEl) totalEl.textContent = charContext.clim + ' Clim';

    const spentEl = document.getElementById('eq-clim-spent');
    if (spentEl) spentEl.textContent = stats.clim + ' Clim';

    const remainingEl = document.getElementById('eq-clim-remaining');
    if (remainingEl) {
      remainingEl.textContent = remaining + ' Clim';
      if (remaining < 500) {
        remainingEl.style.color = 'var(--text-secondary)';
      } else {
        remainingEl.style.color = '';
      }
    }

    const regBurdenEl = document.getElementById('eq-burden-regular');
    if (regBurdenEl) {
      regBurdenEl.textContent = `${stats.burden} / ${capacities.regular}`;
      if (stats.burden > capacities.regular) {
        regBurdenEl.style.color = 'var(--accent-red)';
      } else if (stats.burden >= capacities.regular * 0.8) {
        regBurdenEl.style.color = 'var(--text-secondary)';
      } else {
        regBurdenEl.style.color = '';
      }
    }

    const comBurdenEl = document.getElementById('eq-burden-combat');
    if (comBurdenEl) {
      comBurdenEl.textContent = `${stats.burden} / ${capacities.combat}`;
      if (stats.burden > capacities.combat) {
        comBurdenEl.style.color = 'var(--text-secondary)'; // Warning (not rooted unless over regular limit)
      } else {
        comBurdenEl.style.color = '';
      }
    }
  }

  function renderCategories() {
    const container = document.getElementById('equipment-categories');
    if (!container) return;

    let html = '';
    CATEGORIES.forEach(cat => {
      const activeClass = cat === activeCategory ? 'active' : '';
      html += `<button type="button" class="eq-category-btn ${activeClass}" data-category="${cat}">${escapeHtml(cat)}</button>`;
    });

    container.innerHTML = html;
  }

  function renderGrid() {
    const grid = document.getElementById('equipment-grid');
    if (!grid) return;

    const filtered = ITEMS_DATA.filter(item => {
      const matchCat = activeCategory === 'All' || item.type === activeCategory;
      const matchSearch = !searchQuery || 
                          item.name.toLowerCase().includes(searchQuery) || 
                          (item.subType && item.subType.toLowerCase().includes(searchQuery)) ||
                          item.description.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="eq-grid-empty">No items match your filters. Try a different search!</div>`;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const inInventory = getQuantityInInventory(item.id);
      const ownedBadge = inInventory > 0 ? `<div class="eq-card-owned-badge">${inInventory}</div>` : '';
      const isInspected = inspectedItem && inspectedItem.id === item.id ? 'inspected' : '';
      const itemImg = item.imageSmUrl || item.imageLgUrl || '';
      // Generate direct item URL slug from name
      const itemSlug = item.name
        .toLowerCase()
        .replace(/[()]/g, '')        // Remove parentheses
        .replace(/'/g, '-')           // Apostrophes → hyphens
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')         // Spaces to hyphens
        .replace(/-+/g, '-')          // Collapse multiple hyphens
        .replace(/^-|-$/g, '');       // Trim leading/trailing hyphens
      const itemUrl = `https://rpg.angelssword.com/game/0.13.0/items/${itemSlug}`;

      html += `
        <div class="eq-card ${isInspected}" data-id="${item.id}" title="${escapeHtml(item.name)}">
          ${itemImg ? `<div class="eq-card-img" style="background-image: url('${escapeHtml(itemImg)}');"></div>` : '<div class="eq-card-initial">${escapeHtml(item.name.charAt(0))}</div>'}
          <div class="eq-card-overlay">
            <div class="eq-card-bottom">
              <h4 class="eq-card-title">${escapeHtml(item.name)}</h4>
              <div class="eq-card-meta">${escapeHtml(item.subType || '')} · ${escapeHtml(item.cost)}</div>
              <a href="${itemUrl}" target="_blank" class="eq-card-details-link">See details ↗</a>
            </div>
          </div>
          ${ownedBadge}
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  function renderInventoryShelf() {
    const container = document.getElementById('purchased-inventory-shelf');
    if (!container) return;

    const keys = Object.keys(inventory);
    if (keys.length === 0) {
      container.innerHTML = `<div class="eq-shelf-empty">Your purchased inventory is empty. Select items below to buy!</div>`;
      return;
    }

    let html = '<div class="eq-shelf-grid">';
    keys.sort().forEach(itemId => {
      const entry = inventory[itemId];
      const isInspected = inspectedItem && inspectedItem.id === itemId ? 'active' : '';
      const itemImg = entry.item.imageSmUrl || entry.item.imageLgUrl || 'https://cdn.angelssword.com/ttrpg/assets/7f82d606-e2ee-49ef-919f-95de640ea46a-Alchemy.lg.webp';

      html += `
        <div class="eq-shelf-item ${isInspected}" data-id="${itemId}" title="Click to view details: ${escapeHtml(entry.item.name)}">
          <div class="eq-shelf-item-icon" style="background-image: url('${escapeHtml(itemImg)}');"></div>
          <div class="eq-shelf-item-details">
            <span class="eq-shelf-item-name">${escapeHtml(entry.item.name)}</span>
            <span class="eq-shelf-item-qty">Qty: <strong>${entry.quantity}</strong></span>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function renderSidebar() {
    // 1. Render item inspection detail card
    const detailContainer = document.getElementById('eq-item-detail-panel');
    if (detailContainer) {
      if (!inspectedItem) {
        detailContainer.innerHTML = `
          <div class="eq-detail-empty">
            <span class="eq-detail-empty-icon">🔍</span>
            <span>Select an item in the shelf or grid to inspect full stats, rules, and modifications.</span>
          </div>
        `;
      } else {
        const itemImg = inspectedItem.imageLgUrl || inspectedItem.imageSmUrl || 'https://cdn.angelssword.com/ttrpg/assets/7f82d606-e2ee-49ef-919f-95de640ea46a-Alchemy.lg.webp';
        
        let specRows = `
          <div class="eq-spec-row"><span class="eq-spec-label">Category:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.type)}</span></div>
          <div class="eq-spec-row"><span class="eq-spec-label">Sub-Type:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.subType || '-')}</span></div>
          <div class="eq-spec-row"><span class="eq-spec-label">Clim Cost:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.cost)}</span></div>
          <div class="eq-spec-row"><span class="eq-spec-label">Weight (Burden):</span><span class="eq-spec-val">${escapeHtml(inspectedItem.burden)}</span></div>
        `;

        if (inspectedItem.activationCost && inspectedItem.activationCost !== '-') {
          specRows += `<div class="eq-spec-row"><span class="eq-spec-label">Activation Cost:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.activationCost)}</span></div>`;
        }
        if (inspectedItem.shellSize && inspectedItem.shellSize !== '-') {
          specRows += `<div class="eq-spec-row"><span class="eq-spec-label">Shell Size:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.shellSize)}</span></div>`;
        }
        if (inspectedItem.fuelUsage && inspectedItem.fuelUsage !== '-') {
          specRows += `<div class="eq-spec-row"><span class="eq-spec-label">Fuel Usage:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.fuelUsage)}</span></div>`;
        }
        if (inspectedItem.craftingPoints && inspectedItem.craftingPoints !== '-') {
          specRows += `<div class="eq-spec-row"><span class="eq-spec-label">Crafting Points:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.craftingPoints)}</span></div>`;
        }
        if (inspectedItem.craftingType && inspectedItem.craftingType !== '-') {
          specRows += `<div class="eq-spec-row"><span class="eq-spec-label">Crafting Type:</span><span class="eq-spec-val">${escapeHtml(inspectedItem.craftingType)}</span></div>`;
        }

        // Check if weapon has mods or special description
        let modSection = '';
        const lowerDesc = inspectedItem.description.toLowerCase();
        if (lowerDesc.includes('mods:') || lowerDesc.includes('modifications:') || inspectedItem.subType === 'Weapon' || inspectedItem.subType === 'Armor') {
          modSection = `
            <div class="eq-detail-mods">
              <h5 class="eq-detail-mods-title">🛡️ Modifications & Attachments</h5>
              <div class="eq-detail-mods-content">
                ${inspectedItem.subType === 'Weapon' ? 'Accepts universal Weapon Attachments (Sights, Scopes, Stocks). Allows Element/Attribute infusions.' : ''}
                ${inspectedItem.subType === 'Armor' ? 'Accepts Armorsmith Modifications (Plating, Insulation, Lightweight Frame).' : ''}
                <p class="eq-mod-desc-hint" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Configure modifications and attachments on your character sheet after creation.</p>
              </div>
            </div>
          `;
        }

        // Purchase controls in detail panel
        const currentOwned = getQuantityInInventory(inspectedItem.id);
        let purchaseSection = `
          <div class="eq-detail-purchase">
            <div class="eq-detail-purchase-info">
              <span class="eq-detail-purchase-cost">Cost: ${escapeHtml(inspectedItem.cost)} Clim</span>
              <span class="eq-detail-purchase-burden">Burden: ${escapeHtml(inspectedItem.burden)}</span>
              ${currentOwned > 0 ? `<span class="eq-detail-purchase-owned">Owned: ${currentOwned}</span>` : ''}
            </div>
            <div class="eq-detail-purchase-controls">
              <div class="eq-sidebar-qty-stepper">
                <button type="button" class="eq-sidebar-qty-btn" data-action="decrease">−</button>
                <input type="number" id="eq-sidebar-qty" value="1" min="1" max="99" class="eq-sidebar-qty-input">
                <button type="button" class="eq-sidebar-qty-btn" data-action="increase">+</button>
              </div>
              <button type="button" class="eq-sidebar-add-btn">Add to Inventory</button>
            </div>
          </div>
        `;

        detailContainer.innerHTML = `
          <div class="eq-detail-card animate-fade-in">
            <div class="eq-detail-header">
              <div class="eq-detail-img-box" style="background-image: url('${escapeHtml(itemImg)}');"></div>
              <div class="eq-detail-header-text">
                <span class="eq-detail-sub">${escapeHtml(inspectedItem.type)} · ${escapeHtml(inspectedItem.subType)}</span>
                <h3 class="eq-detail-title">${escapeHtml(inspectedItem.name)}</h3>
                <a href="https://rpg.angelssword.com/game/0.13.0/items?search=${encodeURIComponent(inspectedItem.name)}" target="_blank" class="eq-wiki-btn">See Details (Web) ↗</a>
              </div>
            </div>
            <div class="eq-detail-specs">
              ${specRows}
            </div>
            <div class="eq-detail-description">
              <h5>Item Description & Rules</h5>
              <p>${decodeHtmlEntities(inspectedItem.description || 'No description available for this item.')}</p>
            </div>
            ${modSection}
            ${purchaseSection}
          </div>
        `;
      }
    }

    // 2. Render inventory items list summary (Sidebar)
    const summaryContainer = document.getElementById('eq-inventory-summary-list');
    if (summaryContainer) {
      const keys = Object.keys(inventory);
      if (keys.length === 0) {
        summaryContainer.innerHTML = `<div class="eq-summary-empty">No items purchased yet.</div>`;
      } else {
        let html = '';
        keys.sort().forEach(itemId => {
          const entry = inventory[itemId];
          const itemWeight = entry.item.burdenCost * entry.quantity;
          const itemCost = entry.item.climCost * entry.quantity;

          html += `
            <div class="eq-summary-row" data-id="${itemId}">
              <div class="eq-summary-info">
                <span class="eq-summary-name" title="${escapeHtml(entry.item.name)}">${escapeHtml(entry.item.name)}</span>
                <span class="eq-summary-meta">💰 ${itemCost} Clim · 📦 Burden: ${itemWeight}</span>
              </div>
              <div class="eq-summary-actions">
                <button type="button" class="eq-summary-action-btn eq-sidebar-remove-btn" data-id="${itemId}" title="Remove 1">−</button>
                <span class="eq-summary-qty">${entry.quantity}</span>
                <button type="button" class="eq-summary-action-btn eq-sidebar-clear-btn" data-id="${itemId}" title="Remove all">🗑️</button>
              </div>
            </div>
          `;
        });
        summaryContainer.innerHTML = html;
      }
    }

    // 3. Render total burden and spent values in sidebar
    const totalWeightEl = document.getElementById('eq-summary-total-burden');
    if (totalWeightEl) {
      const stats = calculateSpent();
      totalWeightEl.textContent = stats.burden;
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
    
    // Default inspected item to first item in restored inventory if possible
    const keys = Object.keys(inventory);
    if (keys.length > 0) {
      inspectedItem = inventory[keys[0]].item;
    } else if (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA.length > 0) {
      inspectedItem = ITEMS_DATA[0];
    }
    
    refresh();
  }

  function reset() {
    console.log('[EquipmentScene] Resetting state...');
    inventory = {};
    activeCategory = 'All';
    searchQuery = '';
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) searchInput.value = '';
    
    if (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA.length > 0) {
      inspectedItem = ITEMS_DATA[0];
    } else {
      inspectedItem = null;
    }
    
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
