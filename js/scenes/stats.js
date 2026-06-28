/**
 * Lyrian Chronicles - Ability Scores Scene
 * Array-based stat assignment per rulebook:
 *   Main Stats:  assign (5, 4, 4, 3) → Power, Focus, Agility, Toughness
 *   Sub Stats:   assign (5, 4, 3, 2, 1) → Fitness, Cunning, Reason, Awareness, Presence
 */

/* exported StatsScene */
const StatsScene = (function() {
  // Base assignments (null = unassigned)
  let mainAssignments = { pow: null, foc: null, agi: null, tou: null };
  let subAssignments = { fitness: null, cunning: null, reason: null, awareness: null, presence: null };

  let humanMainBonus = 'tou';
  let humanSubBonus = 'fitness';
  let cachedRaceName = '';

  // Breakthrough stat bonuses (from Primary/Secondary Stat Training)
  let breakthroughBonuses = {
    pow: 0, foc: 0, agi: 0, tou: 0,
    fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0
  };

  // ponytail: Class stat bonuses from L6 Heart (+1 sub) and L7 Soul (+1 main)
  // Shape: { l6: number, l7: number, choices: { heart_0: 'fitness', soul_0: 'pow', ... } }
  let classBonusCounts = { l6: 0, l7: 0 };
  let classBonusChoices = {};

  function setRaceData(raceName) {
    cachedRaceName = raceName.toLowerCase();
  }

  function getRaceBonuses() {
    const bonuses = {
      pow: 0, foc: 0, agi: 0, tou: 0,
      fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0
    };

    if (cachedRaceName === 'chimera') {
      bonuses.tou = 1;
      bonuses.awareness = 1;
    } else if (cachedRaceName === 'demon') {
      bonuses.pow = 1;
      bonuses.reason = 1;
    } else if (cachedRaceName === 'fae') {
      bonuses.agi = 1;
      bonuses.cunning = 1;
    } else if (cachedRaceName === 'youkai') {
      bonuses.foc = 1;
      bonuses.presence = 1;
    } else if (cachedRaceName === 'human') {
      if (humanMainBonus) bonuses[humanMainBonus] = 1;
      if (humanSubBonus) bonuses[humanSubBonus] = 1;
    } else if (cachedRaceName && cachedRaceName !== '') {
      console.warn(`[StatsScene] Unknown race "${cachedRaceName}" — no stat bonuses applied. Expected: chimera, demon, fae, youkai, or human.`);
    }

    return bonuses;
  }

  function init() {
    // Human racial bonus selectors
    const humanContainer = document.getElementById('human-choices-container');
    if (humanContainer) {
      if (cachedRaceName === 'human') {
        humanContainer.style.display = 'block';

        const mainSelect = document.getElementById('human-main-select');
        const subSelect = document.getElementById('human-sub-select');

        if (mainSelect) {
          mainSelect.value = humanMainBonus;
          if (!mainSelect.dataset.humanBonusBound) {
            mainSelect.dataset.humanBonusBound = 'true';
            mainSelect.addEventListener('change', (e) => {
              humanMainBonus = e.target.value;
              renderAll();
            });
          }
        }
        if (subSelect) {
          subSelect.value = humanSubBonus;
          if (!subSelect.dataset.humanBonusBound) {
            subSelect.dataset.humanBonusBound = 'true';
            subSelect.addEventListener('change', (e) => {
              humanSubBonus = e.target.value;
              renderAll();
            });
          }
        }
      } else {
        humanContainer.style.display = 'none';
      }
    }

    renderAll();
  }

  function renderAll() {
    renderStatGroup('main-stats', MAIN_STATS, mainAssignments, MAIN_STATS_ARRAY, 'main');
    renderStatGroup('sub-stats', SUB_STATS, subAssignments, SUB_STATS_ARRAY, 'sub');
    updateAssignmentPool('main-pool', mainAssignments, MAIN_STATS_ARRAY);
    updateAssignmentPool('sub-pool', subAssignments, SUB_STATS_ARRAY);
    renderClassStatBonuses();
    renderStatTrainingBonuses();
    updateDerivedStats();
    updateCompletionStatus();
  }

  /**
   * Render a group of stat assignment dropdowns
   */
  function renderStatGroup(containerId, statDefs, assignments, array, group) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const available = getAvailableValues(array, assignments);

    statDefs.forEach(def => {
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.dataset.stat = def.id;
      box.dataset.group = group;

      const assigned = assignments[def.id];
      const bonuses = getRaceBonuses();
      const raceBonus = bonuses[def.id] || 0;
      const btBonus = breakthroughBonuses[def.id] || 0;
      const classBonus = getClassStatBonuses()[def.id] || 0;
      const baseVal = assigned != null ? assigned : 0;
      const total = baseVal + raceBonus + btBonus + classBonus;

      // Build dropdown options
      let optionsHtml = '<option value="">—</option>';
      // If already assigned, show the assigned value first (selected)
      if (assigned != null) {
        optionsHtml += `<option value="${assigned}" selected>${assigned}</option>`;
      }
      // Also show other available values for reassignment
      available.forEach(v => {
        if (v !== assigned) {
          optionsHtml += `<option value="${v}">${v}</option>`;
        }
      });

      const displayValue = assigned != null ? total : '—';
      const bonusText = raceBonus > 0 && assigned != null ? ` <span class="race-bonus">(+${raceBonus})</span>` : '';
      const btBonusText = btBonus > 0 && assigned != null ? ` <span class="bt-bonus">(+${btBonus})</span>` : '';
      const classBonusText = classBonus > 0 && assigned != null ? ` <span class="class-bonus">(+${classBonus})</span>` : '';

      box.innerHTML = `
        <div class="stat-name">${def.short || def.name}</div>
        <div class="stat-assignment">
          <select class="stat-select" data-stat="${def.id}" data-group="${group}">
            ${optionsHtml}
          </select>
        </div>
        <div class="stat-total">${displayValue}${bonusText}${btBonusText}${classBonusText}</div>
        <div class="stat-label-row">
          <span class="stat-base-label">Base</span>
          ${raceBonus > 0 ? '<span class="stat-bonus-label">Race +1</span>' : ''}
          ${btBonus > 0 ? `<span class="stat-bt-label">BT +${btBonus}</span>` : ''}
          ${classBonus > 0 ? `<span class="stat-class-label">Class +${classBonus}</span>` : ''}
        </div>
      `;

      const select = box.querySelector('.stat-select');
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        handleAssignment(group, def.id, val === '' ? null : parseInt(val));
      });

      container.appendChild(box);
    });
  }

  /**
   * Handle stat value assignment with swap logic
   */
  function handleAssignment(group, statId, newValue) {
    const assignments = group === 'main' ? mainAssignments : subAssignments;
    const oldValue = assignments[statId];

    if (newValue === oldValue) return;

    // If unassigning (setting to null)
    if (newValue === null) {
      assignments[statId] = null;
      renderAll();
      return;
    }

    // If the new value is already assigned to another stat in this group, swap
    if (oldValue !== null && oldValue !== newValue) {
      // Find who has the newValue
      for (const [otherId, otherVal] of Object.entries(assignments)) {
        if (otherId !== statId && otherVal === newValue) {
          // Swap: give the other stat our old value
          assignments[otherId] = oldValue;
          break;
        }
      }
    }

    assignments[statId] = newValue;
    renderAll();
  }

  /**
   * Update the "remaining pool" display
   */
  function updateAssignmentPool(poolId, assignments, array) {
    const poolEl = document.getElementById(poolId);
    if (!poolEl) return;

    const available = getAvailableValues(array, assignments);

    if (available.length === 0) {
      poolEl.innerHTML = '<span class="pool-complete">✓ All assigned</span>';
    } else {
      poolEl.innerHTML = available.map(v =>
        `<span class="pool-value">${v}</span>`
      ).join(' ');
    }
  }

  /**
   * ponytail: Render class stat bonus dropdowns (L6 Heart / L7 Soul).
   * Shows one dropdown per class bonus, filtered by that class's allowed stats.
   * Labeled with class name. Hidden when no bonuses.
   */
  function renderClassStatBonuses() {
    const section = document.getElementById('class-stat-bonuses-section');
    const container = document.getElementById('class-stat-bonus-selects');
    if (!section || !container) return;

    // ponytail: fetch per-class details with restrictions from ClassSelectScene
    const details = ClassSelectScene.getClassStatBonusDetails
      ? ClassSelectScene.getClassStatBonusDetails()
      : [];

    if (details.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.innerHTML = '';

    // ponytail: Soul (L7) first, then Heart (L6) — matches class level ordering
    const souls = details.filter(b => b.type === 'soul');
    const hearts = details.filter(b => b.type === 'heart');
    const ordered = [...souls, ...hearts];

    ordered.forEach((bonus, idx) => {
      const key = `${bonus.type}_${idx}`;
      const item = document.createElement('div');
      item.className = 'class-stat-bonus-item';

      // ponytail: build filtered options from class restriction, fallback to all stats
      const allStats = bonus.type === 'soul' ? MAIN_STATS : SUB_STATS;
      const allowed = bonus.allowed; // null = no restriction → all stats
      const filtered = allowed ? allStats.filter(s => allowed.includes(s.id)) : allStats;
      // ponytail: if filter eliminated everything (bad data), show all
      const options = filtered.length > 0 ? filtered : allStats;

      let opts = `<option value=""${classBonusChoices[key] ? '' : ' selected'}>— choose —</option>` + options.map(s =>
        `<option value="${s.id}"${classBonusChoices[key] === s.id ? ' selected' : ''}>${s.short || s.name}</option>`
      ).join('');

      const label = bonus.type === 'soul' ? 'L7 Soul' : 'L6 Heart';
      item.innerHTML = `<label>${label} (${bonus.className}):</label><select data-class-bonus="${key}">${opts}</select>`;
      item.querySelector('select').addEventListener('change', (e) => {
        classBonusChoices[key] = e.target.value;
        renderAll();
      });
      container.appendChild(item);
    });
  }

  /**
   * ponytail: Render stat-training breakthrough dropdowns (mirrors breakthroughs panel).
   * Hidden when no stat-training breakthroughs selected.
   */
  function renderStatTrainingBonuses() {
    const section = document.getElementById('stat-training-section');
    const container = document.getElementById('stat-training-selects');
    if (!section || !container) return;

    // ponytail: fetch from BreakthroughScene — each entry: { name, type, index, choice }
    const items = BreakthroughScene.getStatTrainingItems
      ? BreakthroughScene.getStatTrainingItems()
      : [];

    if (items.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.innerHTML = '';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'class-stat-bonus-item';
      const allStats = item.type === 'primary' ? MAIN_STATS : SUB_STATS;
      const opts = `<option value=""${item.choice ? '' : ' selected'}>— choose —</option>` + allStats.map(s =>
        `<option value="${s.id}"${item.choice === s.id ? ' selected' : ''}>${s.short || s.name}</option>`
      ).join('');
      const label = item.type === 'primary' ? 'Primary' : 'Secondary';
      el.innerHTML = `<label>${label} (${item.name}):</label><select data-bt-stat="${item.index}">${opts}</select>`;
      el.querySelector('select').addEventListener('change', (e) => {
        BreakthroughScene.handleStatChoiceChange(item.index, e.target.value);
        renderAll();
      });
      container.appendChild(el);
    });
  }

  /**
   * ponytail: Compute stat bonuses from class L6/L7 choices.
   * Returns { pow: N, ..., presence: N }
   */
  function getClassStatBonuses() {
    const bonuses = {
      pow: 0, foc: 0, agi: 0, tou: 0,
      fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0
    };
    Object.values(classBonusChoices).forEach(statKey => {
      if (statKey && bonuses.hasOwnProperty(statKey)) {
        bonuses[statKey] += 1;
      }
    });
    return bonuses;
  }

  /**
   * Update derived stats preview
   */
  function updateDerivedStats() {
    const bonuses = getRaceBonuses();
    const classBonuses = getClassStatBonuses();
    const finalStats = {};

    // Combine main + sub assignments with race bonuses + breakthrough bonuses + class bonuses
    Object.keys(mainAssignments).forEach(k => {
      finalStats[k] = (mainAssignments[k] != null ? mainAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0) + (classBonuses[k] || 0);
    });
    Object.keys(subAssignments).forEach(k => {
      finalStats[k] = (subAssignments[k] != null ? subAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0) + (classBonuses[k] || 0);
    });

    const derived = calculateDerivedStats(finalStats);

    const map = {
      'derived-hp': derived.hp,
      'derived-mana': derived.mana,
      'derived-rp': derived.rp,
      'derived-evasion': derived.evasion,
      'derived-potency': derived.potency,
      'derived-initiative': derived.initiative
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  /**
   * Update completion status and next button
   */
  // ponytail: check all class bonus + stat-training dropdowns have a non-blank choice
  function allBonusesChosen() {
    const classOk = Object.values(classBonusChoices).every(v => v && v !== '');
    const btItems = BreakthroughScene.getStatTrainingItems
      ? BreakthroughScene.getStatTrainingItems()
      : [];
    const btOk = btItems.every(it => it.choice && it.choice !== '');
    return classOk && btOk;
  }

  function updateCompletionStatus() {
    const mainComplete = mainAssignments.pow != null && mainAssignments.foc != null &&
                         mainAssignments.agi != null && mainAssignments.tou != null;
    const subComplete = subAssignments.fitness != null && subAssignments.cunning != null &&
                        subAssignments.reason != null && subAssignments.awareness != null &&
                        subAssignments.presence != null;
    const complete = mainComplete && subComplete && allBonusesChosen();

    const nextBtn = document.getElementById('btn-stats-next');
    if (nextBtn) {
      nextBtn.disabled = !complete;
    }

    // Update completion indicator
    const indicator = document.getElementById('assignment-status');
    if (indicator) {
      if (complete) {
        indicator.textContent = '✓ All stats assigned';
        indicator.className = 'assignment-status complete';
      } else {
        const mainCount = Object.values(mainAssignments).filter(v => v != null).length;
        const subCount = Object.values(subAssignments).filter(v => v != null).length;
        indicator.textContent = `${mainCount}/4 Main · ${subCount}/5 Sub assigned`;
        indicator.className = 'assignment-status incomplete';
      }
    }
  }

  /**
   * Get final stats (base + race bonuses + breakthrough bonuses + class bonuses)
   */
  function getStats() {
    const bonuses = getRaceBonuses();
    const classBonuses = getClassStatBonuses();
    const finalStats = {};

    Object.keys(mainAssignments).forEach(k => {
      finalStats[k] = (mainAssignments[k] != null ? mainAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0) + (classBonuses[k] || 0);
    });
    Object.keys(subAssignments).forEach(k => {
      finalStats[k] = (subAssignments[k] != null ? subAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0) + (classBonuses[k] || 0);
    });

    return finalStats;
  }

  /**
   * Set breakthrough stat bonuses from the BreakthroughScene.
   * Called when returning from breakthroughs step or when stat training choices change.
   */
  function setBreakthroughBonuses(bonuses) {
    if (bonuses && typeof bonuses === 'object') {
      breakthroughBonuses = { ...bonuses };
    }
    renderAll();
  }

  /**
   * Get base assignments (without race bonuses)
   */
  function getBaseStats() {
    return {
      ...mainAssignments,
      ...subAssignments
    };
  }

  function getHumanChoices() {
    return { main: humanMainBonus, sub: humanSubBonus };
  }

  /**
   * Restore previously saved stat assignments.
   * Called when navigating back to this step or loading from localStorage.
   * stats shape: { pow, foc, agi, tou, fitness, cunning, reason, awareness, presence }
   * (final values including bonuses)
   * baseStats shape: same keys but base values before bonuses
   * humanChoices: { main, sub }
   * raceBonuses: { pow, foc, agi, tou, fitness, cunning, reason, awareness, presence }
   */
  function restoreState(stats, baseStats, humanChoices, raceBonuses, raceName) {
    if (!stats) return;

    // Restore human bonus choices
    if (humanChoices) {
      humanMainBonus = humanChoices.main || 'tou';
      humanSubBonus = humanChoices.sub || 'fitness';
    }

    // Restore race name for bonus calculation
    if (raceName) {
      cachedRaceName = raceName.toLowerCase();
    }

    // Restore base assignments (without bonuses)
    if (baseStats) {
      mainAssignments = {
        pow: baseStats.pow != null ? baseStats.pow : null,
        foc: baseStats.foc != null ? baseStats.foc : null,
        agi: baseStats.agi != null ? baseStats.agi : null,
        tou: baseStats.tou != null ? baseStats.tou : null
      };
      subAssignments = {
        fitness: baseStats.fitness != null ? baseStats.fitness : null,
        cunning: baseStats.cunning != null ? baseStats.cunning : null,
        reason: baseStats.reason != null ? baseStats.reason : null,
        awareness: baseStats.awareness != null ? baseStats.awareness : null,
        presence: baseStats.presence != null ? baseStats.presence : null
      };
    }

    renderAll();

    // Update human bonus dropdowns if restored
    if (cachedRaceName === 'human') {
      const mainSelect = document.getElementById('human-main-select');
      const subSelect = document.getElementById('human-sub-select');
      if (mainSelect) mainSelect.value = humanMainBonus;
      if (subSelect) subSelect.value = humanSubBonus;
    }
  }

  // ponytail: Set class bonus counts + choices from ClassSelectScene
  function setClassBonusCounts(counts, choices) {
    if (counts) classBonusCounts = { l6: counts.l6 || 0, l7: counts.l7 || 0 };
    if (choices) classBonusChoices = { ...choices };
    renderAll();
  }

  function getClassBonusChoices() {
    return { ...classBonusChoices };
  }

  function reset() {
    mainAssignments = { pow: null, foc: null, agi: null, tou: null };
    subAssignments = { fitness: null, cunning: null, reason: null, awareness: null, presence: null };
    humanMainBonus = 'tou';
    humanSubBonus = 'fitness';
    cachedRaceName = '';
    breakthroughBonuses = { pow: 0, foc: 0, agi: 0, tou: 0, fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0 };
    classBonusCounts = { l6: 0, l7: 0 };
    classBonusChoices = {};
    // Clear human bonus listener guards so re-init can re-bind
    const mainSelect = document.getElementById('human-main-select');
    const subSelect = document.getElementById('human-sub-select');
    if (mainSelect) delete mainSelect.dataset.humanBonusBound;
    if (subSelect) delete subSelect.dataset.humanBonusBound;
    renderAll();
  }

  return { init, getStats, getBaseStats, reset, setRaceData, getHumanChoices, getRaceBonuses, restoreState, setBreakthroughBonuses, setClassBonusCounts, getClassBonusChoices, getClassStatBonuses };
})();
