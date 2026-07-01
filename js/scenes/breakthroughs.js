/**
 * Lyrian Chronicles - Breakthrough Selection Scene
 * Handles breakthrough browsing, filtering, and selection with eligibility checking
 * Matches Foundry VTT structure: tier, effects, prerequisites
 *
 * Rules (from rulebook):
 * - Breakthroughs: Start with 300 EXP (only for breakthroughs, unspent lost, doesn't add to Spirit Core)
 * - Once the 300 EXP pool is exhausted, the main class EXP pool is used
 * - Only EXP from the main pool adds to Spirit Core
 */

/* exported BreakthroughScene */
const BreakthroughScene = (function() {
  let selectedBreakthroughs = [];

  // EXP constants from rulebook
  const TOTAL_BREAKTHROUGH_EXP = 300;
  // Main class EXP pool (set from class page, default 0)
  let mainExpPool = 0;
  // Spirit Core from class page (set when entering breakthroughs)
  let baseSpiritCore = 0;
  // Total abilities that must be bought for a class to be considered "mastered"

  // ===========================================================================
  // ELIGIBILITY CHECKER — clause-based parser
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
    return clauses.every(clause => evaluateBreakthroughClause(clause, charData, race, ancestry, cls, breakthroughs, bt));
  }

  // Evaluates a single breakthrough clause. Returns true if satisfied.
  // ponytail: single source of truth for mastery level; was duplicated on lines 71, 83
  const MASTERY_LEVEL = 8;

  function evaluateBreakthroughClause(clause, charData, race, ancestry, cls, breakthroughs, bt) {
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
            return name === opt && ec.level >= MASTERY_LEVEL;
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
            return name === opt && ec.level >= MASTERY_LEVEL;
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
        let btName = abilityMatch[1].trim().toLowerCase();
        // Strip trailing "breakthrough" word (e.g., "Skill Training breakthrough" → "Skill Training")
        btName = btName.replace(/\s+breakthrough\s*$/i, '');
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
        const abilityCost = Math.max(0, ((ec.abilitiesBought != null ? ec.abilitiesBought : ec.level - 1))) * 100;
        spiritCore += unlockCost + abilityCost;
      });
      return spiritCore >= required;
    }

    // "Must be a/an X" / "Must be X" / "Must be Centaur or Arachne Spiderfolk"
    // "Must choose Faerie or Chimera race" / "Must choose Human race"
    // "You must be proficient with X"
    // "Must be a human and only a human"
    // "Must be a Nio, Bullfolk or Bearfolk"
    // NOTE: "Must be an Unknown Paladin that follows Eisen" is a CLASS requirement, not a race
    // NOTE: "Must be a summoner and have visited the eidolon" — class requirement
    const raceMatch = clause.match(/(?:must\s+)?(?:be|choose)\s+(?:(?:a|an)\s+)?([\w-][\w\s,-]*?[\w-])(?:\s+race\.?|\.?)?(?:$)/i);
    if (raceMatch && !lower.includes('mastered') && !lower.includes('maxed')) {
      let neededRaceStr = raceMatch[1].trim();

      // Strip trailing "race" word (e.g., "Faerie or Chimera race" → "Faerie or Chimera")
      neededRaceStr = neededRaceStr.replace(/\s+race\s*$/i, '');

      // Handle "X and only X" → extract the race before "and"
      // e.g., "a human and only a human" → "human"
      const andOnlyMatch = neededRaceStr.match(/^(.+?)\s+and\s+only\s+(?:a|an)?\s+(.+)$/i);
      if (andOnlyMatch) {
        neededRaceStr = andOnlyMatch[1].trim();
      }

      // Handle "X and have ..." → extract the race before "and"
      // e.g., "a summoner and have visited the eidolon" → "summoner"
      const andHaveMatch = neededRaceStr.match(/^(.+?)\s+and\s+have\s+/i);
      if (andHaveMatch) {
        neededRaceStr = andHaveMatch[1].trim();
      }

      // Handle comma-separated AND "or" lists: "Nio, Bullfolk or Bearfolk"
      // First split on commas, then split each part on "or"
      // Check 4+ words per INDIVIDUAL option (not the whole string)
      const rawOptions = neededRaceStr.split(/,/);
      const options = [];
      rawOptions.forEach(part => {
        const orParts = part.split(/\s+or\s+/i);
        orParts.forEach(op => {
          const cleaned = op.trim().toLowerCase();
          if (cleaned) options.push(cleaned);
        });
      });

      // Check if any individual option is 4+ words (class description)
      // e.g., "Unknown Paladin that follows Eisen" -> be permissive for that option
      const hasClassReq = options.some(opt => opt.split(/\s+/).length >= 4);
      if (hasClassReq) {
        return true;
      }
      // If none of the options match known races/ancestries, check if they're class names
      const knownRacesCheck = ['human', 'demon', 'fae', 'chimera', 'angel', 'youkai'];
      const knownAncestriesCheck = [
        'bearfolk', 'bullfolk', 'catfolk', 'centaur', 'cowfolk', 'dogfolk',
        'harpy', 'horse-folk', 'lamiafolk', 'lizardfolk', 'mothfolk',
        'phoenix', 'rabbitfolk', 'ratfolk', 'red pandafolk', 'sheepfolk',
        'slimefolk', 'spiderfolk', 'wolf-folk',
        'anubis', 'cait sith', 'cu sith', 'dryad', 'dullahan', 'gnome',
        'high fae', 'pixie', 'salamander', 'selkie', 'sylph', 'unseelie',
        'willo wisp',
        'ancient marionette', 'jiangshi', 'kitsune', 'nekomata', 'nio',
        'oni', 'raijin', 'ryujin', 'suryan', 'tengu', 'yuki-onna',
      ];
      const allUnrecognized = options.every(opt =>
        !knownRacesCheck.includes(opt) && !knownAncestriesCheck.some(a => opt.includes(a) || a.includes(opt))
      );
      if (allUnrecognized) {
        // Check if these are class requirements (e.g., "summoner", "paladin", "necromancer")
        const equipped = cls ? (cls.all || []) : [];
        const hasClassReq = options.some(opt =>
          equipped.some(ec => (ec.class?.name || '').toLowerCase() === opt)
        );
        if (hasClassReq) {
          return true; // Player has the required class
        }
        return false; // Class requirement not met
      }

      return options.some(opt => checkRaceMatch(opt, race, ancestry));
    }

    // "You must be proficient with X" / "proficient in X"
    // ponytail: added (?:you\s+)? prefix + split on "and" for "Light and Medium armor"
    if (lower.includes('proficient')) {
      const profMatch = clause.match(/(?:you\s+)?(?:must\s+)?be\s+(?:(?:a|an)\s+)?proficient\s+with\s+(.+?)(?:\.|$)/i);
      if (profMatch) {
        const neededProfs = profMatch[1].trim().split(/\s+and\s+/i).map(s => s.trim().toLowerCase());
        const charProfs = getCharacterProficiencies();
        return neededProfs.every(np =>
          charProfs.some(p => p.toLowerCase().includes(np))
        );
      }
      return false;
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

    // ponytail: unknown clauses now warn + fail instead of silent pass — visible in console for data fixes
    console.warn(`[Breakthrough] Unparsed prerequisite clause: "${clause}" on "${bt.name || '?'}"`);
    return false;
  }

  // Helper: get all character proficiencies — ponytail: centralized in calculations.js
  function getCharacterProficiencies() {
    const charData = window.getCharacterData ? window.getCharacterData() : {};
    return window.getCharacterProficiencies(charData, selectedBreakthroughs);
  }

  // Helper: check if the player's race/ancestry matches a required race name
  // ponytail: checkRaceMatch moved to calculations.js — single source of truth

  // ===========================================================================
  // EXP CALCULATIONS — Dual-pool system
  // Starting 300 EXP is used first; once empty, main class EXP pool is used.
  // Only main pool EXP adds to Spirit Core.
  // ===========================================================================
  function getTotalExpSpent() {
    return selectedBreakthroughs.reduce((total, bt) => total + getEffectiveCost(bt), 0);
  }

  /**
   * Whether the starting 300 EXP pool is active (toggle ON).
   * When OFF, all spending bypasses the starting pool and goes straight to the main pool.
   */
  function isStartingPoolEnabled() {
    const toggle = document.getElementById('bt-exp-toggle');
    return toggle ? toggle.checked : true;
  }

  /**
   * EXP drawn from the starting 300 pool.
   * Capped at TOTAL_BREAKTHROUGH_EXP.
   * When starting pool toggle is OFF, this is always 0.
   */
  function _getExpFromStartingPool() {
    if (!isStartingPoolEnabled()) return 0;
    return Math.min(getTotalExpSpent(), TOTAL_BREAKTHROUGH_EXP);
  }

  /**
   * How much EXP was drawn from the main class pool.
   * When starting pool toggle is ON: only positive when total spent exceeds the starting 300.
   * When starting pool toggle is OFF: ALL spending comes from main pool.
   */
  function getExpFromMainPool() {
    if (!isStartingPoolEnabled()) return getTotalExpSpent();
    return Math.max(0, getTotalExpSpent() - TOTAL_BREAKTHROUGH_EXP);
  }

  /**
   * Remaining EXP in the starting 300 pool.
   * When starting pool toggle is OFF, always shows full pool (unused).
   */
  function getStartingPoolRemaining() {
    if (!isStartingPoolEnabled()) return TOTAL_BREAKTHROUGH_EXP;
    return Math.max(0, TOTAL_BREAKTHROUGH_EXP - getTotalExpSpent());
  }

  /**
   * Remaining EXP in the main class pool after breakthrough spending.
   */
  function getMainPoolRemaining() {
    return Math.max(0, mainExpPool - getExpFromMainPool());
  }

  /**
   * Total available EXP across both pools.
   * When starting pool toggle is OFF, only main pool counts.
   */
  function getTotalAvailableExp() {
    if (!isStartingPoolEnabled()) return mainExpPool;
    return TOTAL_BREAKTHROUGH_EXP + mainExpPool;
  }

  /**
   * Remaining spendable EXP (combined).
   */
  function getRemainingExp() {
    return Math.max(0, getTotalAvailableExp() - getTotalExpSpent());
  }

  /**
   * Total Spirit Core: base from classes + EXP drawn from main pool for breakthroughs.
   */
  function getCurrentSpiritCore() {
    return baseSpiritCore + getExpFromMainPool();
  }

  function updateOverviewStats() {
    const expEl = document.getElementById('bt-exp-remaining');
    const expLabel = document.getElementById('bt-exp-remaining-label');
    const mainExpEl = document.getElementById('bt-main-exp-remaining');
    const spiritEl = document.getElementById('bt-spirit-core');
    const countEl = document.getElementById('bt-count');
    const totalCountEl = document.getElementById('bt-total-count');

    const startingRemain = getStartingPoolRemaining();
    const mainRemain = getMainPoolRemaining();
    const totalSpent = getTotalExpSpent();
    const poolEnabled = isStartingPoolEnabled();

    // Starting pool display
    if (expEl) {
      expEl.textContent = `${startingRemain} / ${TOTAL_BREAKTHROUGH_EXP} EXP`;
      // When toggle OFF: grayed out / disabled look
      if (!poolEnabled) {
        expEl.className = 'bt-exp-remaining bt-pool-disabled';
        if (expLabel) expLabel.className = 'bt-exp-remaining-label bt-pool-disabled';
      } else if (startingRemain === TOTAL_BREAKTHROUGH_EXP) {
        expEl.className = 'bt-exp-remaining bt-pool-full';
        if (expLabel) expLabel.className = 'bt-exp-remaining-label';
      } else if (startingRemain > 0) {
        expEl.className = 'bt-exp-remaining bt-pool-partial';
        if (expLabel) expLabel.className = 'bt-exp-remaining-label';
      } else {
        expEl.className = 'bt-exp-remaining bt-pool-empty';
        if (expLabel) expLabel.className = 'bt-exp-remaining-label';
      }
    }

    // Main pool display
    if (mainExpEl) {
      mainExpEl.textContent = `${mainRemain} / ${mainExpPool} EXP`;
      if (!poolEnabled) {
        // When starting pool OFF, main pool is the active pool
        if (mainRemain === mainExpPool && totalSpent === 0) {
          mainExpEl.className = 'bt-main-exp-remaining bt-pool-full';
        } else if (mainRemain > 0) {
          mainExpEl.className = 'bt-main-exp-remaining bt-pool-partial';
        } else {
          mainExpEl.className = 'bt-main-exp-remaining bt-pool-empty';
        }
      } else if (mainRemain === mainExpPool && totalSpent <= TOTAL_BREAKTHROUGH_EXP) {
        mainExpEl.className = 'bt-main-exp-remaining bt-pool-full';
      } else if (mainRemain > 0) {
        mainExpEl.className = 'bt-main-exp-remaining bt-pool-partial';
      } else {
        mainExpEl.className = 'bt-main-exp-remaining bt-pool-empty';
      }
    }

    // Spirit Core display
    if (spiritEl) {
      spiritEl.textContent = `Spirit Core: ${getCurrentSpiritCore()}`;
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

    selectedBreakthroughs.forEach((bt, i) => {
      const item = document.createElement('div');
      item.className = 'bt-selected-item';

      const type = getStatTrainingType(bt);
      const effectiveCost = getEffectiveCost(bt);
      const key = btInstanceKey(bt, i);
      const currentChoice = statBonusChoices[key];

      let statPickerHtml = '';
      if (type) {
        const options = type === 'primary' ? PRIMARY_STAT_KEYS : SECONDARY_STAT_KEYS;
        const label = type === 'primary' ? 'Primary' : 'Secondary';
        statPickerHtml = `
          <div class="bt-stat-picker">
            <span class="bt-stat-picker-label">+1 ${label}:</span>
            <select class="bt-stat-select" data-bt-index="${i}" data-type="${type}">
              <option value="">— choose —</option>
              ${options.map(o => `<option value="${o.key}" ${currentChoice === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>`;
      }

      item.innerHTML = `
        <span class="bt-selected-name">${window.escapeHtml(bt.name)}</span>
        <span class="bt-selected-cost">${effectiveCost} EXP</span>
        ${statPickerHtml}
        <button class="bt-remove-btn" title="Remove">✕</button>
      `;

      // Bind remove button
      item.querySelector('.bt-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeBreakthrough(bt);
      });

      // Bind stat picker change
      if (type) {
        const select = item.querySelector('.bt-stat-select');
        select.addEventListener('change', (e) => {
          handleStatChoiceChange(parseInt(e.target.dataset.btIndex), e.target.value);
        });
      }

      list.appendChild(item);
    });
  }

  function removeBreakthrough(bt) {
    const idx = selectedBreakthroughs.findIndex(s => s.id === bt.id);
    if (idx >= 0) {
      // Also remove the stat choice if it had one
      const key = btInstanceKey(bt, idx);
      delete statBonusChoices[key];
      selectedBreakthroughs.splice(idx, 1);
      // Re-key choices after splice (indices shifted)
      rekeyStatBonusChoices();
      renderSelectedList();
      updateOverviewStats();
      applyFilters();
    }
  }

  // ===========================================================================
  // STAT BONUS TRACKING — Primary/Secondary Stat Training
  // ===========================================================================

  // Map of breakthrough instance key (id + index) → chosen stat key
  // e.g. { "69ea4f7a6be32fced492fb62:0": "pow", "69ea4f7a6be32fced492fb63:1": "fitness" }
  let statBonusChoices = {};

  // Stat keys for dropdowns
  const PRIMARY_STAT_KEYS = [
    { key: 'pow', label: 'Power' },
    { key: 'foc', label: 'Focus' },
    { key: 'agi', label: 'Agility' },
    { key: 'tou', label: 'Toughness' }
  ];
  const SECONDARY_STAT_KEYS = [
    { key: 'fitness', label: 'Fitness' },
    { key: 'cunning', label: 'Cunning' },
    { key: 'reason', label: 'Reason' },
    { key: 'awareness', label: 'Awareness' },
    { key: 'presence', label: 'Presence' }
  ];

  /**
   * Check if a breakthrough is a stat-training type.
   * Returns 'primary' | 'secondary' | null
   */
  function getStatTrainingType(bt) {
    const name = (bt.name || '').toLowerCase();
    if (name === 'primary stat training') return 'primary';
    if (name === 'secondary stat training') return 'secondary';
    return null;
  }

  /**
   * Generate a unique key for a selected breakthrough instance.
   */
  function btInstanceKey(bt, index) {
    return `${bt.id}:${index}`;
  }

  /**
   * Rebuild statBonusChoices keys after array mutations (splice).
   */
  function rekeyStatBonusChoices() {
    const oldChoices = { ...statBonusChoices };
    statBonusChoices = {};
    selectedBreakthroughs.forEach((bt, i) => {
      const key = btInstanceKey(bt, i);
      // Find the old key that maps to this bt at this index
      for (const [oldKey, val] of Object.entries(oldChoices)) {
        const [oldId] = oldKey.split(':');
        if (oldId === bt.id && !statBonusChoices[key]) {
          statBonusChoices[key] = val;
          break;
        }
      }
    });
  }

  /**
   * Calculate the cost for Primary Stat Training based on how many times
   * it has already been selected. Base 400, +100 each, max 700.
   */
  function getPrimaryStatTrainingCost(bt) {
    if (getStatTrainingType(bt) !== 'primary') return bt.cost || 0;
    const count = selectedBreakthroughs.filter(
      s => getStatTrainingType(s) === 'primary'
    ).length;
    return Math.min(400 + count * 100, 700);
  }

  /**
   * Get the effective cost for a breakthrough (handles escalation).
   */
  function getEffectiveCost(bt) {
    return getPrimaryStatTrainingCost(bt);
  }

  /**
   * Compute total stat bonuses from all selected stat-training breakthroughs.
   * Returns { pow: N, foc: N, agi: N, tou: N, fitness: N, cunning: N, reason: N, awareness: N, presence: N }
   */
  function getStatBonuses() {
    const bonuses = {
      pow: 0, foc: 0, agi: 0, tou: 0,
      fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0
    };
    selectedBreakthroughs.forEach((bt, i) => {
      const type = getStatTrainingType(bt);
      if (!type) return;
      const key = btInstanceKey(bt, i);
      const chosen = statBonusChoices[key];
      if (chosen && bonuses.hasOwnProperty(chosen)) {
        bonuses[chosen] += 1;
      }
    });
    return bonuses;
  }

  /**
   * Compute all proficiencies granted by selected breakthroughs.
   * Returns array of proficiency strings.
   */
  function getBreakthroughProficiencies() {
    const proficiencies = [];
    selectedBreakthroughs.forEach(bt => {
      if (Array.isArray(bt.proficiencies)) {
        bt.proficiencies.forEach(p => {
          if (!proficiencies.includes(p)) {
            proficiencies.push(p);
          }
        });
      }
    });
    return proficiencies;
  }

  /**
   * Handle stat choice change for a stat-training breakthrough.
   */
  function handleStatChoiceChange(btIndex, newStat) {
    const bt = selectedBreakthroughs[btIndex];
    if (!bt) return;
    const key = btInstanceKey(bt, btIndex);
    statBonusChoices[key] = newStat;
    // Refresh stats scene if it's loaded
    if (typeof StatsScene !== 'undefined' && StatsScene.setBreakthroughBonuses) {
      StatsScene.setBreakthroughBonuses(getStatBonuses());
    }
  }

  // ===========================================================================
  // BREAKTHROUGH EFFECTS APPLICATION
  // ===========================================================================
  /**
   * Compute all mechanical effects from selected breakthroughs.
   * Returns a consolidated object with all applied effects.
   */
  function computeBreakthroughEffects() {
    const effects = {
      mysticEyesLimit: 2, // Default limit
      size: null,
      burdenBonus: 0,
      combatBurdenBonus: 0,
      movementSpeedBonus: 0,
      darkvision: 0,
      flight: false,
      sunlightWeakness: false,
      noManaRegen: false,
      noWounds: false,
      woundExceptions: [],
      mounted: false,
      swimmingPenalty: 0,
      climbingSpeed: null,
      losesAbility: null,
      raceChange: null,
      statBonuses: {},
      appliedBreakthroughs: []
    };

    // Get all selected breakthroughs
    const selected = selectedBreakthroughs.map(s => {
      const bt = window.BREAKTHROUGH_DATA.find(b => b.id === s.id);
      return bt ? { ...bt, instanceIndex: s.instanceIndex } : null;
    }).filter(Boolean);

    // Also include racial breakthroughs from character data
    const racialBreakthroughs = (window.characterData && window.characterData.racialBreakthroughs) || [];
    const allBreakthroughs = [...selected, ...racialBreakthroughs];

    allBreakthroughs.forEach(btIdOrObj => {
      let bt;
      if (typeof btIdOrObj === 'string') {
        bt = window.BREAKTHROUGH_DATA.find(b => b.id === btIdOrObj);
      } else {
        bt = btIdOrObj;
      }
      if (!bt || !bt.mechanics) return;

      const mech = bt.mechanics;
      effects.appliedBreakthroughs.push(bt.name);

      // Mystic eyes limit
      if (mech.mysticEyesLimit) {
        effects.mysticEyesLimit = Math.max(effects.mysticEyesLimit, mech.mysticEyesLimit);
      }

      // Size changes
      if (mech.size) {
        effects.size = mech.size;
      }

      // Burden bonuses (regular)
      if (mech.burdenBonus) {
        effects.burdenBonus += mech.burdenBonus;
      }

      // Combat burden bonuses
      if (mech.combatBurdenBonus) {
        effects.combatBurdenBonus += mech.combatBurdenBonus;
      }

      // Movement speed bonuses
      if (mech.movementSpeedBonus) {
        effects.movementSpeedBonus += mech.movementSpeedBonus;
      }

      // Darkvision
      if (mech.darkvision) {
        effects.darkvision = Math.max(effects.darkvision, mech.darkvision);
      }

      // Flight
      if (mech.flight) {
        effects.flight = true;
      }

      // Sunlight weakness
      if (mech.sunlightWeakness) {
        effects.sunlightWeakness = true;
      }

      // No mana regeneration
      if (mech.noManaRegen) {
        effects.noManaRegen = true;
      }

      // No wounds
      if (mech.noWounds) {
        effects.noWounds = true;
        if (mech.woundExceptions) {
          effects.woundExceptions = [...new Set([...effects.woundExceptions, ...mech.woundExceptions])];
        }
      }

      // Mounted status
      if (mech.mounted) {
        effects.mounted = true;
      }

      // Swimming penalty
      if (mech.swimmingPenalty) {
        effects.swimmingPenalty += mech.swimmingPenalty;
      }

      // Climbing speed
      if (mech.climbingSpeed) {
        effects.climbingSpeed = mech.climbingSpeed;
      }

      // Loses ability
      if (mech.losesAbility) {
        effects.losesAbility = mech.losesAbility;
      }

      // Race change
      if (mech.raceChange) {
        effects.raceChange = mech.raceChange;
      }

      // Stat bonuses (handled separately via getStatBonuses)
      if (mech.statBonus) {
        // Stat bonuses are tracked via statBonusChoices, not here
      }
    });

    return effects;
  }

  // ponytail: removed 9 individual effect getters (getMysticEyesLimit, getBreakthroughSize, etc.)
  // that each recomputed the full effects object. Callers should use computeBreakthroughEffects() directly.

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
      ${bt.prerequisites ? `<div class="bt-preview-prereq ${eligible ? 'eligible' : 'ineligible'}">Requires: ${window.renderHtml(bt.prerequisites)}</div>` : ''}
      <div class="bt-preview-description">${window.renderHtml(bt.description || '')}</div>
      ${bt.effects && bt.effects.length > 0 ? `
        <div class="bt-preview-effects">
          <h4>Effects</h4>
          ${bt.effects.map(e => `<div class="bt-effect-row"><strong>${window.escapeHtml(e.name)}</strong> ${window.renderHtml(String(e.description || ''))}</div>`).join('')}
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
      desc.textContent = bt.description ? window.decodeHtmlEntities(bt.description.length > 120 ? bt.description.substring(0, 120) + '...' : bt.description) : '';

      // Assemble card
      card.appendChild(header);
      card.appendChild(name);
      if (bt.prerequisites) {
        const prereq = document.createElement('div');
        prereq.className = `bt-prereq-badge ${eligible ? 'eligible' : 'ineligible'}`;
        prereq.textContent = window.decodeHtmlEntities(`Requires: ${bt.prerequisites}`);
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

  // ponytail: Hybrid IDs — removing Human +100 EXP bonus
  const HYBRID_IDS = new Set(['69ea4f7a6be32fced492fb56', '69ea4f7a6be32fced492fb57']);

  function toggleBreakthrough(bt) {
    const hadHybrid = selectedBreakthroughs.some(s => HYBRID_IDS.has(s.id));
    const idx = selectedBreakthroughs.findIndex(s => s.id === bt.id);
    if (idx >= 0) {
      // Deselect
      selectedBreakthroughs.splice(idx, 1);
      // Clean up stat choice
      const key = btInstanceKey(bt, idx);
      delete statBonusChoices[key];
      rekeyStatBonusChoices();
    } else {
      // Check EXP budget — use effective cost (handles escalation)
      const cost = getEffectiveCost(bt);
      // ponytail: Hybrid removes +100 Human EXP — effective cost is cost + 100
      const effectiveTotal = HYBRID_IDS.has(bt.id) ? cost + 100 : cost;
      if (getRemainingExp() < effectiveTotal) {
        return; // Not enough EXP
      }
      // Select
      selectedBreakthroughs.push(bt);
      // Auto-select first available stat for stat-training breakthroughs
      const type = getStatTrainingType(bt);
      if (type) {
        const newIdx = selectedBreakthroughs.length - 1;
        const newKey = btInstanceKey(bt, newIdx);
        // ponytail: default to blank — user picks explicitly
        statBonusChoices[newKey] = '';
      }
    }
    // ponytail: adjust mainExpPool when Hybrid toggled (Human loses +100 EXP)
    const hasHybrid = selectedBreakthroughs.some(s => HYBRID_IDS.has(s.id));
    if (hadHybrid && !hasHybrid) mainExpPool += 100;
    if (!hadHybrid && hasHybrid) mainExpPool = Math.max(0, mainExpPool - 100);

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
    // Guard: prevent duplicate listeners on re-init
    if (window._btFiltersBound) return;
    window._btFiltersBound = true;

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

    // Search input (debounced for performance) — use delegation to avoid duplicates
    const searchEl = document.getElementById('bt-search');
    if (searchEl && !searchEl.dataset.btSearchBound) {
      searchEl.dataset.btSearchBound = 'true';
      let searchTimeout;
      searchEl.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 150);
      });
    }
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  function initExpToggle() {
    const toggle = document.getElementById('bt-exp-toggle');
    const label = toggle ? toggle.parentElement : null;

    function applyExpToggle() {
      const on = toggle.checked;
      if (label) {
        label.classList.toggle('active', on);
      }
      // Re-render stats so the disabled/active styling and pool math update
      updateOverviewStats();
      // Re-apply filters so affordability reflects the new pool
      applyFilters();
    }

    if (toggle && !toggle.dataset.btToggleBound) {
      toggle.dataset.btToggleBound = '1';
      // ponytail: don't override checked — state is managed by app.js (step 1)
      applyExpToggle();
      toggle.addEventListener('change', applyExpToggle);
    }
  }

  function init() {
    renderSelectedList();
    initFilters();
    applyFilters();
    initExpToggle();
  }

  // Refresh the grid when returning to this step after changing class/race
  function refresh() {
    applyFilters();
  }

  /**
   * Return a clean copy of stat bonus choices for saving.
   */
  function getStatBonusChoices() {
    return structuredClone(statBonusChoices);
  }

  /**
   * Restore stat bonus choices from saved data.
   */
  function restoreStatBonusChoices(saved) {
    if (!saved || typeof saved !== 'object') return;
    statBonusChoices = {};
    Object.keys(saved).forEach(key => {
      statBonusChoices[key] = saved[key];
    });
  }

  function getSelection() {
    return {
      breakthroughs: structuredClone(selectedBreakthroughs),
      statBonusChoices: getStatBonusChoices()
    };
  }

  /**
   * Restore a previously saved breakthrough selection.
   * Called when navigating back to this step or loading from localStorage.
   */
  function restoreState(savedData) {
    if (!savedData) return;

    // Support both new shape { breakthroughs, statBonusChoices } and old shape []
    const savedBreakthroughs = Array.isArray(savedData) ? savedData : (savedData.breakthroughs || []);
    const savedChoices = savedData.statBonusChoices || {};

    selectedBreakthroughs = [];
    savedBreakthroughs.forEach(btData => {
      // Look up breakthrough from BREAKTHROUGH_DATA by id or name
      const bt = BREAKTHROUGH_DATA.find(b =>
        b.id === btData.id || b.name === btData.name
      );
      if (bt) {
        selectedBreakthroughs.push(bt);
      }
    });

    // Restore stat bonus choices
    restoreStatBonusChoices(savedChoices);

    renderSelectedList();
    applyFilters();
  }

  function reset() {
    selectedBreakthroughs = [];
    statBonusChoices = {};
    renderSelectedList();
    hideBreakthroughPreview();
    // Reset filter button guards so re-init can re-bind
    delete window._btFiltersBound;
    const searchEl = document.getElementById('bt-search');
    if (searchEl) {
      searchEl.value = '';
      delete searchEl.dataset.btSearchBound;
    }
    // Reset filters — explicitly target the "All" buttons
    document.querySelectorAll('#cost-filters .filter-btn, #category-filters .filter-btn, #bt-eligibility-filters .filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    // Activate the "All" button in each filter group
    ['#cost-filters', '#category-filters', '#bt-eligibility-filters'].forEach(containerId => {
      const container = document.querySelector(containerId);
      if (container) {
        const allBtn = container.querySelector('.filter-btn[data-value=""]');
        if (allBtn) allBtn.classList.add('active');
      }
    });
    renderBreakthroughs(BREAKTHROUGH_DATA);
  }

  /**
   * ponytail: Expose stat-training items for the stats panel mirror.
   * Returns [{ name, type: 'primary'|'secondary', index, choice }]
   */
  function getStatTrainingItems() {
    const items = [];
    selectedBreakthroughs.forEach((bt, i) => {
      const type = getStatTrainingType(bt);
      if (!type) return;
      const key = btInstanceKey(bt, i);
      items.push({ name: bt.name, type, index: i, choice: statBonusChoices[key] || '' });
    });
    return items;
  }

  /**
   * Set the main class EXP pool available for breakthrough spending.
   * @param {number} pool - Remaining class EXP (main pool)
   * @param {number} classExpSpent - EXP spent on classes (base Spirit Core, NOT including breakthrough spending)
   */
  function setMainExpPool(pool, classExpSpent) {
    mainExpPool = Math.max(0, parseInt(pool) || 0);
    baseSpiritCore = Math.max(0, parseInt(classExpSpent) || 0);
    updateOverviewStats();
  }

  return { init, getSelection, reset, toggleBreakthrough, refresh, restoreState, setMainExpPool, getExpFromMainPool, getCurrentSpiritCore, getStatBonuses, getBreakthroughProficiencies, handleStatChoiceChange, computeBreakthroughEffects, getStatTrainingItems };
})();
