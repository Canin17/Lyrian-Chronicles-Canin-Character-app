/**
 * Lyrian Chronicles - Breakthrough Selection Scene
 * Handles breakthrough browsing, filtering, and selection with eligibility checking
 * Matches Foundry VTT structure: tier, effects, prerequisites
 *
 * Rules (from rulebook):
 * - Breakthroughs: Start with 300 EXP (only for breakthroughs, unspent lost, doesn't add to Spirit Core)
 */

const BreakthroughScene = (function() {
  let selectedBreakthroughs = [];

  // EXP constants from rulebook
  const TOTAL_BREAKTHROUGH_EXP = 300;
  // Total abilities that must be bought for a class to be considered "mastered"
  const TOTAL_PAID_ABILITIES = 7;

  // ===========================================================================
  // ELIGIBILITY CHECKER — clause-based parser
  // Splits requirements into clauses by separators (period, comma)
  // Evaluates each clause with AND logic
  // ===========================================================================
  function isBreakthroughEligible(bt) {
    const req = (bt.prerequisites || '').replace(/<[^>]*>/g, '').trim();
    if (!req || req === 'None') return true;

    const charData = window.getCharacterData ? window.getCharacterData() : {};
    const race = charData.race;
    const ancestry = charData.ancestry;
    const cls = charData.cls;
    const breakthroughs = charData.breakthroughs || [];

    // Split on period into clauses, evaluate ALL (AND logic)
    const clauses = req.split(/\.\s*/).map(s => s.trim()).filter(Boolean);
    return clauses.every(clause => evaluateBreakthroughClause(clause, charData, race, ancestry, cls, breakthroughs));
  }

  // Evaluates a single breakthrough clause. Returns true if satisfied.
  function evaluateBreakthroughClause(clause, charData, race, ancestry, cls, breakthroughs) {
    const lower = clause.toLowerCase();

    // "Requires GM Approval" - always allowed in character creator
    if (lower.includes('requires gm approval')) {
      return true;
    }

    // "Can only be taken at character creation" / "Must be taken at character creation"
    // "Must be chosen at character creation"
    if (lower.includes('taken at character creation') || lower.includes('chosen at character creation')) {
      return true;
    }

    // "X mastered" / "At least 1 of X, Y or Z maxed"
    if (lower.includes('mastered') || lower.includes('maxed')) {
      const equipped = cls ? (cls.all || []) : [];
      // "At least 1 of X, Y or Z maxed"
      const maxedMatch = lower.match(/at least\s+1\s+of\s+(.+?)\s+maxed/i);
      if (maxedMatch) {
        const namesStr = maxedMatch[1].trim();
        const options = namesStr.split(/\s+or\s+|,\s*/).map(s => s.trim().toLowerCase());
        return options.some(opt =>
          equipped.some(ec => {
            const name = (ec.class?.name || '').toLowerCase();
            return name === opt && ec.abilitiesBought >= TOTAL_PAID_ABILITIES;
          })
        );
      }
      // "X mastered" at start of clause
      const masteredMatch = clause.match(/^(.+?)\s+mastered/i);
      if (masteredMatch) {
        const neededStr = masteredMatch[1].trim();
        const options = neededStr.split(/\s+or\s+|,\s*/).map(s => s.trim().toLowerCase());
        return options.some(opt =>
          equipped.some(ec => {
            const name = (ec.class?.name || '').toLowerCase();
            return name === opt && ec.abilitiesBought >= TOTAL_PAID_ABILITIES;
          })
        );
      }
      return false;
    }

    // "Must have the X breakthrough" / "Must have purchased X" / "Must have X." / "Must have the X ability"
    if (lower.includes('must have') || lower.includes('requires')) {
      // "Must have the Mark of Justice ability"
      const abilityMatch = clause.match(/(?:must have|requires)\s+(?:the\s+)?(.+?)(?:\s+ability)?(?:\.|$)/i);
      if (abilityMatch) {
        const btName = abilityMatch[1].trim().toLowerCase();
        // Check breakthroughs by name
        if (breakthroughs.some(b => b.name.toLowerCase() === btName)) {
          return true;
        }
        // Check class abilities (key abilities + purchased abilities)
        const equipped = cls ? (cls.all || []) : [];
        return equipped.some(ec => {
          const abilities = ec.class?.abilities || [];
          return abilities.some(a => a.name.toLowerCase() === btName);
        });
      }
      return false;
    }

    // "Must have used at least 3 elixirs" - track elixir usage
    if (lower.includes('used at least') && lower.includes('elixir')) {
      // No elixir tracking in character creator - be permissive
      return true;
    }

    // "3000+ Spirit Core" / "X+ Spirit Core"
    const spiritCoreMatch = lower.match(/(\d+)\s*\+\s*spirit core/i);
    if (spiritCoreMatch) {
      const required = parseInt(spiritCoreMatch[1]);
      // Calculate spirit core from class EXP spent (Spirit Core = total EXP spent on classes)
      const equipped = cls ? (cls.all || []) : [];
      let spiritCore = 0;
      equipped.forEach(ec => {
        const tier = parseInt(ec.class?.tier) || 1;
        const unlockCost = tier * 100;
        const abilityCost = Math.max(0, (ec.abilitiesBought || 0)) * 100;
        spiritCore += unlockCost + abilityCost;
      });
      return spiritCore >= required;
    }

    // "Must be a/an X" / "Must be X" / "Must be Centaur or Arachne Spiderfolk"
    // "Must choose Faerie or Chimera race" / "Must choose Human race"
    // "You must be proficient with X"
    // NOTE: "Must be an Unknown Paladin that follows Eisen" is a CLASS requirement, not a race
    const raceMatch = clause.match(/(?:must\s+)?(?:be|choose)\s+(?:a|an)?\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+)*?)(?:\.|$)/i);
    if (raceMatch && !lower.includes('mastered') && !lower.includes('maxed')) {
      const neededRaceStr = raceMatch[1].trim();
      // If the matched string is very long (4+ words), it's likely a class description, not a race
      // e.g., "Unknown Paladin that follows Eisen" -> be permissive
      if (neededRaceStr.split(/\s+/).length >= 4) {
        return true;
      }
      // Handle "X or Y" options
      const options = neededRaceStr.split(/\s+or\s+/i).map(s => s.trim().toLowerCase());
      return options.some(opt => checkRaceMatch(opt, race, ancestry));
    }

    // "You must be proficient with X" / "proficient in X"
    if (lower.includes('proficient')) {
      // No proficiency tracking in character creator - be permissive
      return true;
    }

    // "X only" race restriction (e.g., "Fae only", "Cowfolk only")
    const onlyMatch = lower.match(/^(.+?)\s+only\s*$/i);
    if (onlyMatch) {
      const onlyRace = onlyMatch[1].trim();
      return checkRaceMatch(onlyRace, race, ancestry);
    }

    // Bare race name (e.g., "Human.", "Fae.", "Demon.", "Chimera.", "Angel.")
    const cleanClause = clause.trim().replace(/\.$/, '').trim();
    if (cleanClause && !lower.includes('must') && !lower.includes('be') && !lower.includes('and') && !lower.includes('or')) {
      const cleanLower = cleanClause.toLowerCase();
      return checkRaceMatch(cleanLower, race, ancestry);
    }

    // Unknown clause - be permissive (don't block the user)
    return true;
  }

  // Helper: check if the player's race/ancestry matches a required race name
  function checkRaceMatch(neededRace, race, ancestry) {
    const knownRaces = ['human', 'demon', 'fae', 'chimera', 'angel'];
    const knownAncestries = ['sheepfolk', 'kitsune', 'raijin', 'tengu', 'anubis', 'selkie', 'lamia',
      'ratfolk', 'red panda', 'slimefolk', 'spiderfolk', 'wolf-folk', 'centaur', 'arachne',
      'jiangshi', 'youkai', 'marionette', 'goblin', 'dwarf', 'elf'];
    const neededLower = neededRace.toLowerCase();

    if (!race) return false;
    const raceName = (race.name || '').toLowerCase();
    const ancestryName = (ancestry && ancestry.name) ? ancestry.name.toLowerCase() : '';
    const ancestryId = (ancestry && ancestry.ancestryId) ? ancestry.ancestryId.toLowerCase() : '';

    // Handle compound names - all words must be present in the SAME identifier
    const words = neededLower.split(/\s+/);
    if (words.length > 1) {
      const raceMatch = words.every(word => raceName.includes(word));
      const ancestryNameMatch = words.every(word => ancestryName.includes(word));
      const ancestryIdMatch = words.every(word => ancestryId.includes(word));
      return raceMatch || ancestryNameMatch || ancestryIdMatch;
    }

    // Check exact match against main race name
    if (knownRaces.includes(neededLower)) {
      return raceName.includes(neededLower);
    }

    // Check ancestry/subrace match
    return ancestryName.includes(neededLower) || ancestryId.includes(neededLower) || raceName.includes(neededLower);
  }

  // ===========================================================================
  // EXP CALCULATIONS
  // ===========================================================================
  function getTotalExpSpent() {
    return selectedBreakthroughs.reduce((total, bt) => total + (bt.cost || 0), 0);
  }

  function getRemainingExp() {
    return Math.max(0, TOTAL_BREAKTHROUGH_EXP - getTotalExpSpent());
  }

  function updateOverviewStats() {
    const expEl = document.getElementById('bt-exp-remaining');
    const countEl = document.getElementById('bt-count');
    const totalCountEl = document.getElementById('bt-total-count');
    if (expEl) {
      expEl.textContent = `${getRemainingExp()} EXP`;
    }
    if (countEl) {
      countEl.textContent = `${selectedBreakthroughs.length} selected`;
    }
    if (totalCountEl) {
      totalCountEl.textContent = BREAKTHROUGH_DATA.length;
    }
  }

  // ===========================================================================
  // SELECTED LIST RENDERING
  // ===========================================================================
  function renderSelectedList() {
    const list = document.getElementById('bt-selected-list');
    if (!list) return;
    list.innerHTML = '';

    if (selectedBreakthroughs.length === 0) {
      list.innerHTML = '<div class="bt-selected-empty">No breakthroughs selected yet</div>';
      return;
    }

    selectedBreakthroughs.forEach(bt => {
      const item = document.createElement('div');
      item.className = 'bt-selected-item';
      item.innerHTML = `
        <span class="bt-selected-name">${window.escapeHtml(bt.name)}</span>
        <span class="bt-selected-cost">${bt.cost || 0} EXP</span>
        <button class="bt-remove-btn" title="Remove">✕</button>
      `;
      item.querySelector('.bt-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeBreakthrough(bt);
      });
      list.appendChild(item);
    });
  }

  function removeBreakthrough(bt) {
    const idx = selectedBreakthroughs.findIndex(s => s.id === bt.id);
    if (idx >= 0) {
      selectedBreakthroughs.splice(idx, 1);
      renderSelectedList();
      updateOverviewStats();
      applyFilters();
    }
  }

  // ===========================================================================
  // PREVIEW PANEL
  // ===========================================================================
  function showBreakthroughPreview(bt) {
    const panel = document.getElementById('bt-preview-content');
    const empty = document.querySelector('.bt-preview-empty');
    if (!panel) return;

    if (empty) empty.style.display = 'none';
    panel.style.display = 'block';

    const eligible = isBreakthroughEligible(bt);
    const isSelected = selectedBreakthroughs.some(s => s.id === bt.id);

    panel.innerHTML = `
      <div class="bt-preview-header">
        <h3 class="bt-preview-name">${window.escapeHtml(bt.name)}</h3>
        <div class="bt-preview-meta">
          <span class="bt-category-badge">${bt.category || 'General'}</span>
          <span class="bt-cost-badge">${bt.cost || 0} EXP</span>
        </div>
      </div>
      ${bt.prerequisites ? `<div class="bt-preview-prereq ${eligible ? 'eligible' : 'ineligible'}">Requires: ${window.escapeHtml(bt.prerequisites)}</div>` : ''}
      <div class="bt-preview-description">${window.escapeHtml(bt.description || '')}</div>
      ${bt.effects && bt.effects.length > 0 ? `
        <div class="bt-preview-effects">
          <h4>Effects</h4>
          ${bt.effects.map(e => `<div class="bt-effect-row"><strong>${window.escapeHtml(e.name)}</strong> ${window.escapeHtml(String(e.description || ''))}</div>`).join('')}
        </div>
      ` : ''}
      <div class="bt-preview-footer">
        <span class="bt-preview-status ${isSelected ? 'selected' : ''}">${isSelected ? '✓ Selected' : 'Not selected'}</span>
      </div>
    `;
  }

  function hideBreakthroughPreview() {
    const panel = document.getElementById('bt-preview-content');
    const empty = document.querySelector('.bt-preview-empty');
    if (panel) panel.style.display = 'none';
    if (empty) empty.style.display = 'flex';
  }

  // ===========================================================================
  // RENDERING
  // ===========================================================================
  function renderBreakthroughs(breakthroughs) {
    const grid = document.getElementById('bt-grid');
    const searchCount = document.getElementById('bt-search-count');
    if (!grid) return;
    grid.innerHTML = '';

    // Update search count
    if (searchCount) {
      searchCount.textContent = `${breakthroughs.length} of ${BREAKTHROUGH_DATA.length} breakthroughs`;
    }

    if (breakthroughs.length === 0) {
      grid.innerHTML = '<p class="hint-text">No breakthroughs match your search.</p>';
      updateOverviewStats();
      return;
    }

    breakthroughs.forEach((bt, i) => {
      const eligible = isBreakthroughEligible(bt);
      const isSelected = selectedBreakthroughs.some(s => s.id === bt.id);
      const card = document.createElement('div');
      card.className = 'bt-card' +
        (isSelected ? ' selected' : '') +
        (!eligible ? ' ineligible' : '');
      card.dataset.index = i;

      // Header row: category + cost
      const header = document.createElement('div');
      header.className = 'bt-card-header';

      // Category badge
      const category = document.createElement('span');
      category.className = 'bt-category-badge';
      category.textContent = bt.category || 'General';

      // Cost badge
      const cost = document.createElement('span');
      cost.className = 'bt-cost-badge';
      cost.textContent = `${bt.cost || 0}`;

      header.appendChild(category);
      header.appendChild(cost);

      // Name
      const name = document.createElement('h3');
      name.className = 'bt-card-name';
      name.textContent = bt.name;

      // Description
      const desc = document.createElement('p');
      desc.className = 'bt-card-description';
      desc.textContent = bt.description ? (bt.description.length > 120 ? bt.description.substring(0, 120) + '...' : bt.description) : '';

      // Assemble card
      card.appendChild(header);
      card.appendChild(name);
      if (bt.prerequisites) {
        const prereq = document.createElement('div');
        prereq.className = `bt-prereq-badge ${eligible ? 'eligible' : 'ineligible'}`;
        prereq.textContent = `Requires: ${bt.prerequisites}`;
        prereq.title = bt.prerequisites;
        card.appendChild(prereq);
      }
      card.appendChild(desc);

      card.addEventListener('click', () => {
        toggleBreakthrough(bt);
        showBreakthroughPreview(bt);
      });

      grid.appendChild(card);
    });

    // Animate cards
    if (window.gsap) {
      gsap.fromTo(grid.querySelectorAll('.bt-card'),
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out' }
      );
    }

    updateOverviewStats();
  }

  function toggleBreakthrough(bt) {
    const idx = selectedBreakthroughs.findIndex(s => s.id === bt.id);
    if (idx >= 0) {
      // Deselect
      selectedBreakthroughs.splice(idx, 1);
    } else {
      // Check EXP budget
      if (getRemainingExp() < (bt.cost || 0)) {
        return; // Not enough EXP
      }
      // Select
      selectedBreakthroughs.push(bt);
    }

    // Re-render
    renderSelectedList();
    updateOverviewStats();
    applyFilters();
  }

  // ===========================================================================
  // FILTERS
  // ===========================================================================
  function applyFilters() {
    const searchEl = document.getElementById('bt-search');
    const search = searchEl ? searchEl.value.toLowerCase() : '';

    // Get active filters
    const costFilter = getActiveFilter('cost-filters');
    const categoryFilter = getActiveFilter('category-filters');
    const eligibilityFilter = getActiveFilter('bt-eligibility-filters');

    const filtered = BREAKTHROUGH_DATA.filter(bt => {
      // Search filter
      if (search && !bt.name.toLowerCase().includes(search)) return false;

      // Cost filter
      if (costFilter) {
        const cost = bt.cost || 0;
        if (costFilter === '300') {
          if (cost < 300) return false;
        } else {
          if (cost !== parseInt(costFilter)) return false;
        }
      }

      // Category filter
      if (categoryFilter) {
        if ((bt.category || 'General') !== categoryFilter) return false;
      }

      // Eligibility filter
      if (eligibilityFilter === 'eligible') {
        if (!isBreakthroughEligible(bt)) return false;
      }

      return true;
    });

    renderBreakthroughs(filtered);
  }

  function getActiveFilter(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return '';
    const activeBtn = container.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.value : '';
  }

  function initFilters() {
    // Cost filters
    const costFilters = document.getElementById('cost-filters');
    if (costFilters) {
      costFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        costFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    }

    // Category filters
    const categoryFilters = document.getElementById('category-filters');
    if (categoryFilters) {
      categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    }

    // Eligibility filters
    const eligibilityFilters = document.getElementById('bt-eligibility-filters');
    if (eligibilityFilters) {
      eligibilityFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        eligibilityFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    }

    // Search input
    const searchEl = document.getElementById('bt-search');
    if (searchEl) {
      searchEl.addEventListener('input', applyFilters);
    }
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  function init() {
    renderSelectedList();
    renderBreakthroughs(BREAKTHROUGH_DATA);
    initFilters();
  }

  // Refresh the grid when returning to this step after changing class/race
  function refresh() {
    applyFilters();
  }

  function getSelection() {
    return structuredClone(selectedBreakthroughs);
  }

  function reset() {
    selectedBreakthroughs = [];
    renderSelectedList();
    hideBreakthroughPreview();
    const searchEl = document.getElementById('bt-search');
    if (searchEl) searchEl.value = '';
    // Reset filters
    document.querySelectorAll('#cost-filters .filter-btn, #category-filters .filter-btn, #bt-eligibility-filters .filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (!btn.dataset.value) btn.classList.add('active');
    });
    renderBreakthroughs(BREAKTHROUGH_DATA);
  }

  return { init, getSelection, reset, toggleBreakthrough, refresh };
})();
