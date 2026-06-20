/**
 * Lyrian Chronicles - Ability Scores Scene
 * Point-buy stat allocation with live derived stat preview
 */

const StatsScene = (function() {
  let stats = {
    pow: 1, foc: 1, agi: 1, tou: 1,
    fitness: 1, cunning: 1, reason: 1, awareness: 1, presence: 1
  };
  
  let humanMainBonus = 'tou';
  let humanSubBonus = 'fitness';
  let cachedRaceName = '';
  
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
    }
    
    return bonuses;
  }

  function init() {
    const humanContainer = document.getElementById('human-choices-container');
    if (humanContainer) {
      if (cachedRaceName === 'human') {
        humanContainer.style.display = 'block';
        
        const mainSelect = document.getElementById('human-main-select');
        const subSelect = document.getElementById('human-sub-select');
        
        if (mainSelect) {
          mainSelect.value = humanMainBonus;
          mainSelect.onchange = (e) => {
            humanMainBonus = e.target.value;
            renderStats();
            updateDerivedStats();
          };
        }
        if (subSelect) {
          subSelect.value = humanSubBonus;
          subSelect.onchange = (e) => {
            humanSubBonus = e.target.value;
            renderStats();
            updateDerivedStats();
          };
        }
      } else {
        humanContainer.style.display = 'none';
      }
    }
    
    renderStats();
    updateDerivedStats();
    updatePointsRemaining();
  }

  function renderStats() {
    renderStatGroup('main-stats', MAIN_STATS, true);
    renderStatGroup('sub-stats', SUB_STATS, false);
  }

  function renderStatGroup(containerId, statDefs, isMain) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    statDefs.forEach((def) => {
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.dataset.stat = def.id;

      const baseVal = stats[def.id];
      const bonuses = getRaceBonuses();
      const raceBonus = bonuses[def.id] || 0;
      const current = baseVal + raceBonus;
      
      const canIncrease = baseVal < STAT_MAX && getTotalAllocated() < STAT_POINTS_TOTAL;
      const canDecrease = baseVal > STAT_MIN;

      box.innerHTML = `
        <div class="stat-name">${def.short || def.name}</div>
        <div class="stat-value">${current}${raceBonus > 0 ? ` <span style="color: var(--accent-gold); font-size: 0.8em; font-weight: normal;">(+${raceBonus})</span>` : ''}</div>
        <div class="stat-controls">
          <button class="stat-btn stat-decrease" ${canDecrease ? '' : 'disabled'}>-</button>
          <button class="stat-btn stat-increase" ${canIncrease ? '' : 'disabled'}>+</button>
        </div>
      `;

      const decBtn = box.querySelector('.stat-decrease');
      const incBtn = box.querySelector('.stat-increase');

      decBtn.addEventListener('click', () => changeStat(def.id, -1));
      incBtn.addEventListener('click', () => changeStat(def.id, 1));

      container.appendChild(box);
    });
  }

  function changeStat(statId, delta) {
    const newVal = stats[statId] + delta;

    if (newVal < STAT_MIN || newVal > STAT_MAX) return;
    if (delta > 0 && getTotalAllocated() >= STAT_POINTS_TOTAL) return;

    stats[statId] = newVal;

    renderStats();
    updateDerivedStats();
    updatePointsRemaining();

    // Animate the change after render (element exists now)
    const statBox = document.querySelector(`.stat-box[data-stat="${statId}"]`);
    if (statBox && window.gsap) {
      const valueEl = statBox.querySelector('.stat-value');
      gsap.fromTo(valueEl, { scale: 1.3, color: '#fff' }, {
        scale: 1, color: '#d4af37', duration: 0.3, ease: 'back.out(1.7)'
      });
    }
  }

  function getTotalAllocated() {
    return Object.values(stats).reduce((sum, v) => sum + v, 0);
  }

  function updatePointsRemaining() {
    const remaining = STAT_POINTS_TOTAL - getTotalAllocated();
    const el = document.getElementById('stat-points-remaining');
    if (el) {
      el.textContent = remaining;
      el.style.color = remaining === 0 ? 'var(--accent-green)' : 'var(--accent-gold)';
    }
  }

  function updateDerivedStats() {
    const bonuses = getRaceBonuses();
    const finalStats = {};
    Object.keys(stats).forEach(k => {
      finalStats[k] = stats[k] + (bonuses[k] || 0);
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

  function getStats() {
    const bonuses = getRaceBonuses();
    const finalStats = {};
    Object.keys(stats).forEach(k => {
      finalStats[k] = stats[k] + (bonuses[k] || 0);
    });
    return finalStats;
  }

  function reset() {
    stats = {
      pow: 1, foc: 1, agi: 1, tou: 1,
      fitness: 1, cunning: 1, reason: 1, awareness: 1, presence: 1
    };
    renderStats();
    updateDerivedStats();
    updatePointsRemaining();
  }

  return { init, getStats, reset, setRaceData, getBaseStats: () => ({ ...stats }), getHumanChoices: () => ({ main: humanMainBonus, sub: humanSubBonus }), getRaceBonuses };
})();
