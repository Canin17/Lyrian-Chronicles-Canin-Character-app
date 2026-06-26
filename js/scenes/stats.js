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
      const baseVal = assigned != null ? assigned : 0;
      const total = baseVal + raceBonus + btBonus;

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

      box.innerHTML = `
        <div class="stat-name">${def.short || def.name}</div>
        <div class="stat-assignment">
          <select class="stat-select" data-stat="${def.id}" data-group="${group}">
            ${optionsHtml}
          </select>
        </div>
        <div class="stat-total">${displayValue}${bonusText}${btBonusText}</div>
        <div class="stat-label-row">
          <span class="stat-base-label">Base</span>
          ${raceBonus > 0 ? '<span class="stat-bonus-label">Race +1</span>' : ''}
          ${btBonus > 0 ? `<span class="stat-bt-label">BT +${btBonus}</span>` : ''}
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
   * Update derived stats preview
   */
  function updateDerivedStats() {
    const bonuses = getRaceBonuses();
    const finalStats = {};

    // Combine main + sub assignments with race bonuses + breakthrough bonuses
    Object.keys(mainAssignments).forEach(k => {
      finalStats[k] = (mainAssignments[k] != null ? mainAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0);
    });
    Object.keys(subAssignments).forEach(k => {
      finalStats[k] = (subAssignments[k] != null ? subAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0);
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
  function updateCompletionStatus() {
    const mainComplete = mainAssignments.pow != null && mainAssignments.foc != null &&
                         mainAssignments.agi != null && mainAssignments.tou != null;
    const subComplete = subAssignments.fitness != null && subAssignments.cunning != null &&
                        subAssignments.reason != null && subAssignments.awareness != null &&
                        subAssignments.presence != null;
    const complete = mainComplete && subComplete;

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
   * Get final stats (base + race bonuses + breakthrough bonuses)
   */
  function getStats() {
    const bonuses = getRaceBonuses();
    const finalStats = {};

    Object.keys(mainAssignments).forEach(k => {
      finalStats[k] = (mainAssignments[k] != null ? mainAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0);
    });
    Object.keys(subAssignments).forEach(k => {
      finalStats[k] = (subAssignments[k] != null ? subAssignments[k] : 0) + (bonuses[k] || 0) + (breakthroughBonuses[k] || 0);
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

  function reset() {
    mainAssignments = { pow: null, foc: null, agi: null, tou: null };
    subAssignments = { fitness: null, cunning: null, reason: null, awareness: null, presence: null };
    humanMainBonus = 'tou';
    humanSubBonus = 'fitness';
    cachedRaceName = '';
    breakthroughBonuses = { pow: 0, foc: 0, agi: 0, tou: 0, fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0 };
    // Clear human bonus listener guards so re-init can re-bind
    const mainSelect = document.getElementById('human-main-select');
    const subSelect = document.getElementById('human-sub-select');
    if (mainSelect) delete mainSelect.dataset.humanBonusBound;
    if (subSelect) delete subSelect.dataset.humanBonusBound;
    renderAll();
  }

  return { init, getStats, getBaseStats, reset, setRaceData, getHumanChoices, getRaceBonuses, restoreState, setBreakthroughBonuses };
})();
