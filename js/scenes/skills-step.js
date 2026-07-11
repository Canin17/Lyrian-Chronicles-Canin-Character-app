/**
 * Lyrian Chronicles - Skills Allocation Scene
 * Skill point distribution across 5 skill groups
 * Multi-source skill point pools (base, race, class, breakthroughs)
 * Per-source eligible skill enforcement — points from each source are
 * tracked independently and can only be spent on eligible skills.
 */

/* exported SkillsStepScene */
const SkillsStepScene = (function() {
  let skillGroups = [];
  let artisanSkillGroups = [];
  let availablePoints = { base: 10, race: 0, class: 0, breakthrough: 0, artisan: 0, total: 10, artisanTotal: 0, eligibleSkills: {} };
  let characterData = null;
  let activeSource = null; // Currently selected source for spending

  // ponytail: transmuter state — flat bonus to one discipline, no allocation
  let transmuterState = { points: 0, discipline: '' };

  // Per-source spending: sourceSpent[source] = { 'SkillName': pts }
  // Total for a skill = sum of all source allocations
  let sourceSpent = {
    base: {},
    race: {},
    class: {},
    breakthrough: {},
    artisan: {}
  };

  // Per-source expertise spending: how many skill points were spent on expertise
  // (1 skill point = 2 expertise points). Tracked separately from main skill points.
  let sourceExpertiseSpent = {
    base: {},
    race: {},
    class: {},
    breakthrough: {},
    artisan: {}
  };

  // All sources (normal + artisan)
  const ALL_SOURCES = ['base', 'race', 'class', 'breakthrough'];
  const ALL_SOURCES_WITH_ARTISAN = [...ALL_SOURCES, 'artisan'];

  function init() {
    skillGroups = deepCloneSkillGroups();
    artisanSkillGroups = deepCloneArtisanSkillGroups();
    availablePoints = {
      base: BASE_SKILL_POINTS,
      race: 0,
      class: 0,
      breakthrough: 0,
      artisan: 0,
      total: BASE_SKILL_POINTS,
      artisanTotal: 0,
      eligibleSkills: {}
    };
    clearSourceSpent();
    activeSource = 'base'; // Default to base source
    renderSkills();
    renderArtisanSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  /**
   * Clear all source spending tracking
   */
  function clearSourceSpent() {
    sourceSpent = { base: {}, race: {}, class: {}, breakthrough: {}, artisan: {} };
    sourceExpertiseSpent = { base: {}, race: {}, class: {}, breakthrough: {}, artisan: {} };
  }

  /**
   * Get total points a skill has from a specific source (main + expertise skill points).
   */
  function getSourceSkillPoints(source, skillName) {
    return (sourceSpent[source]?.[skillName] || 0) + (sourceExpertiseSpent[source]?.[skillName] || 0);
  }

  /**
   * Get total points spent from a source across all skills (main + expertise).
   */
  function getSourceTotalSpent(source) {
    const mainAlloc = sourceSpent[source] || {};
    const expAlloc = sourceExpertiseSpent[source] || {};
    const mainSum = Object.values(mainAlloc).reduce((sum, v) => sum + v, 0);
    const expSum = Object.values(expAlloc).reduce((sum, v) => sum + v, 0);
    return mainSum + expSum;
  }

  /**
   * Get remaining points for a specific source
   */
  function getSourceRemaining(source) {
    return (availablePoints[source] || 0) - getSourceTotalSpent(source);
  }

  /**
   * Get total displayed points for a skill (sum of all sources)
   */
  function getSkillTotalPoints(skillName) {
    let total = 0;
    for (const source of ALL_SOURCES_WITH_ARTISAN) {
      total += getSourceSkillPoints(source, skillName);
    }
    return total;
  }

  /**
   * Sync internal sourceSpent tracking to skillGroups display values.
   * skillGroups[gi].skills[si].pts = sum of all source allocations for that skill.
   */
  function syncSkillGroupsFromSources() {
    skillGroups.forEach(group => {
      group.skills.forEach(skill => {
        skill.pts = getSkillTotalPoints(skill.name);
      });
    });
  }

  /**
   * Set character data for skill point calculation
   */
  function setCharacterData(data) {
    characterData = data;
    availablePoints = calculateAvailableSkillPoints(data);
    // ponytail: detect transmuter class and set points
    const transResult = calculateTransmuterPoints(data?.cls);
    transmuterState.points = transResult.points;
    if (!transResult.hasTransmuter) {
      transmuterState.discipline = '';
    } else if (!transmuterState.discipline) {
      // Default to first artisan skill if not set
      transmuterState.discipline = ARTISAN_SKILLS[0] || '';
    }
    // Don't reset activeSource here — keep user's selection
    renderPointsBreakdown();
    renderSkills();
    renderArtisanSkills();
    updatePointsDisplay();
  }

  /**
   * Select a source for spending. When a source is active,
   * the + button spends from that source's pool.
   */
  function setActiveSource(source) {
    if (activeSource === source) {
      activeSource = null; // Deselect if already selected
    } else {
      activeSource = source;
    }
    renderPointsBreakdown();
    renderSkills();
    renderArtisanSkills();
    updatePointsDisplay();
  }

  /**
   * Render the points breakdown panel showing each source's
   * total and remaining points.
   */
  function renderPointsBreakdown() {
    const breakdown = document.getElementById('skill-points-breakdown');
    if (!breakdown) return;

    const raceName = characterData?.race?.name || '';
    const className = characterData?.cls?.primary?.class?.name || '';
    const btNames = (characterData?.breakthroughs || [])
      .filter(bt => SKILL_GRANTING_BREAKTHROUGHS[bt.name || bt])
      .map(bt => bt.name || bt);

    const sources = [
      { key: 'base', label: 'Base (Character Creation)', total: availablePoints.base, hint: 'Any skill' }
    ];

    if (availablePoints.race > 0) {
      sources.push({
        key: 'race',
        label: `Race: ${raceName}`,
        total: availablePoints.race,
        hint: `${availablePoints.eligibleSkills?.race?.length || 0} eligible`
      });
    }

    if (availablePoints.class > 0) {
      sources.push({
        key: 'class',
        label: `Class: ${className}`,
        total: availablePoints.class,
        hint: `${availablePoints.eligibleSkills?.class?.length || 0} eligible`
      });
    }

    if (availablePoints.breakthrough > 0) {
      sources.push({
        key: 'breakthrough',
        label: `Breakthrough: ${btNames.join(', ') || 'Bonus'}`,
        total: availablePoints.breakthrough,
        hint: `${availablePoints.eligibleSkills?.breakthrough?.length || 0} eligible`
      });
    }

    if (availablePoints.artisan > 0) {
      const artisanClassNames = (availablePoints.perClassArtisan || [])
        .filter(pc => pc.unlocked)
        .map(pc => pc.className)
        .join(', ');
      sources.push({
        key: 'artisan',
        label: `Artisan: ${artisanClassNames || 'Crafting'}`,
        total: availablePoints.artisan,
        hint: `${availablePoints.eligibleSkills?.artisan?.length || 0} artisan skill(s)`
      });
    }

    breakdown.innerHTML = sources.map(src => {
      const remaining = getSourceRemaining(src.key);
      const isActive = activeSource === src.key;
      return `
        <div class="skill-source-row ${isActive ? 'active' : ''}" data-source="${src.key}" role="button" tabindex="0" aria-pressed="${isActive}">
          <span class="skill-source-label">${window.escapeHtml(src.label)}</span>
          <span class="skill-source-pool">
            <span class="skill-source-spent">${getSourceTotalSpent(src.key)}</span>
            <span class="skill-source-separator">/</span>
            <span class="skill-source-total-label">${src.total}</span>
          </span>
          <span class="skill-source-remaining ${remaining <= 0 ? 'empty' : ''}">${remaining} left</span>
          <span class="skill-source-hint">${src.hint}</span>
        </div>
      `;
    }).join('');

    // Bind source selection via event delegation
    breakdown.querySelectorAll('.skill-source-row[data-source]').forEach(row => {
      row.addEventListener('click', () => {
        setActiveSource(row.dataset.source);
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSource(row.dataset.source);
        }
      });
    });

  }

  /**
   * Render the Artisan Skills section — separate group with its own
   * point pool (artisan source). Only visible when artisan points > 0.
   */
  function renderArtisanSkills() {
    const container = document.getElementById('artisan-skills-container');
    if (!container) return;

    // Hide if no artisan points available and no artisan skills allocated and no transmuter
    const hasArtisanPoints = availablePoints.artisan > 0;
    const hasArtisanAllocated = getSourceTotalSpent('artisan') > 0;
    const hasTransmuter = transmuterState.points > 0;
    const showSection = hasArtisanPoints || hasArtisanAllocated || hasTransmuter;

    container.style.display = showSection ? 'block' : 'none';
    if (!showSection) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = '';

    // Section header
    const header = document.createElement('div');
    header.className = 'artisan-section-header';
    header.innerHTML = `
      <div class="artisan-section-title">
        <span>🔨 Artisan Skills</span>
        <span class="artisan-section-note">(Cap: ${ARTISAN_SKILL_CAP} pts · Crafting class granted)</span>
      </div>
    `;
    container.appendChild(header);

    // Get eligible artisan skills for the active source
    const eligibleSkills = activeSource === 'artisan'
      ? (availablePoints.eligibleSkills?.artisan || [])
      : [];
    const activeRemaining = activeSource === 'artisan' ? getSourceRemaining('artisan') : 0;

    artisanSkillGroups.forEach((group, groupIdx) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'skill-group artisan-group';

      groupEl.innerHTML = `
        <div class="skill-group-header">
          <span class="skill-group-name">${window.escapeHtml(group.name)}</span>
          <span class="skill-group-substat">(${window.escapeHtml(group.subStat)})</span>
        </div>
      `;

      group.skills.forEach((skill, skillIdx) => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';

        const totalPts = getSkillTotalPoints(skill.name);
        const isEligible = eligibleSkills.includes(skill.name);
        const effectiveCap = getEffectiveSkillCap(skill.name);
        const currentExpPts = calculateExpertisePoints(skill.expertise || '');

        // + button: enabled when artisan source is active and can spend
        const canSpend = activeSource === 'artisan'
          ? (totalPts < effectiveCap && activeRemaining > 0 && isEligible)
          : false;
        const canFlash = !canSpend && activeSource === 'artisan' && isEligible && totalPts < effectiveCap
          ? (getSourceRemaining('artisan') <= 0)
          : false;
        const canIncrease = canSpend || canFlash;

        // - button: enabled when skill has any points
        const canDecrease = totalPts > 0;

        // Build per-source breakdown tooltip
        const sourceBreakdown = [];
        for (const src of ALL_SOURCES_WITH_ARTISAN) {
          const srcPts = getSourceSkillPoints(src, skill.name);
          if (srcPts > 0) {
            const srcLabel = { base: 'Base', race: 'Race', class: 'Class', bt: 'BT', artisan: 'Artisan' }[src] || src;
            sourceBreakdown.push(`${srcLabel}: ${srcPts}`);
          }
        }
        const tooltip = sourceBreakdown.length > 0 ? `title="${sourceBreakdown.join(', ')}"` : '';

        // Expertise: parse into structured array (SAME as normal skills)
        const expertises = parseExpertiseString(skill.expertise || '');
        const suggestions = SKILL_EXPERTISE_EXAMPLES[skill.name] || [];
        const canSpendExp = activeSource === 'artisan' && isEligible && activeRemaining > 0 && (currentExpPts + 2 <= effectiveCap);
        const canFlashExp = !canSpendExp && activeSource === 'artisan' && isEligible && (currentExpPts + 2 <= effectiveCap)
          ? (getSourceRemaining('artisan') <= 0)
          : false;
        const canAddExp = canSpendExp || canFlashExp;

        skillItem.innerHTML = `
          <div class="skill-row ${isEligible ? 'eligible' : ''} ${!isEligible && activeSource === 'artisan' ? 'ineligible' : ''}">
            <span class="skill-name" ${tooltip}>${window.escapeHtml(skill.name)}</span>
            <button class="skill-btn skill-decrease" ${canDecrease ? '' : 'disabled'}>-</button>
            <span class="skill-points-display" ${tooltip}>${totalPts}</span>
            <button class="skill-btn skill-increase" ${canIncrease ? '' : 'disabled'}>+</button>
          </div>
          <div class="skill-expertise-section">
            <div class="skill-expertise-list">
              ${expertises.map(exp => `
                <div class="expertise-item" data-expertise-name="${window.escapeHtml(exp.name)}">
                  <span class="expertise-item-name" title="${window.escapeHtml(exp.name)}">${window.escapeHtml(exp.name)}</span>
                  <button class="expertise-btn expertise-decrease" data-group="${groupIdx}" data-skill="${skillIdx}" data-name="${window.escapeHtml(exp.name)}" ${exp.pts > 0 ? '' : 'disabled'}>-</button>
                  <span class="expertise-item-value">+${exp.pts}</span>
                  <button class="expertise-btn expertise-increase" data-group="${groupIdx}" data-skill="${skillIdx}" data-name="${window.escapeHtml(exp.name)}" ${(exp.pts + 2 > effectiveCap || !canAddExp) ? 'disabled' : ''}>+</button>
                </div>
              `).join('')}
              <button class="btn-add-expertise" data-group="${groupIdx}" data-skill="${skillIdx}" ${canAddExp ? '' : 'disabled'}>+ Add Expertise</button>
            </div>
            <div class="add-expertise-form hidden" id="expertise-form-${groupIdx}-${skillIdx}">
              <div class="add-expertise-input-row">
                <input type="text" class="add-expertise-input" placeholder="Expertise name..." autocomplete="off" data-group="${groupIdx}" data-skill="${skillIdx}">
                <button class="btn-confirm-expertise" data-group="${groupIdx}" data-skill="${skillIdx}">Add</button>
                <button class="btn-cancel-expertise" aria-label="Cancel">&times;</button>
              </div>
              ${suggestions.length > 0 ? `
                <div class="expertise-suggestions">
                  ${suggestions.map(s => `<span class="suggestion-chip" data-group="${groupIdx}" data-skill="${skillIdx}" data-suggestion="${window.escapeHtml(s)}">${window.escapeHtml(s)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;

        // Bind main skill buttons
        const decBtn = skillItem.querySelector('.skill-decrease');
        const incBtn = skillItem.querySelector('.skill-increase');
        decBtn.addEventListener('click', () => changeArtisanSkillPoints(groupIdx, skillIdx, -1));
        incBtn.addEventListener('click', () => changeArtisanSkillPoints(groupIdx, skillIdx, 1));

        // Bind expertise +/- buttons (SAME handlers as normal skills)
        skillItem.querySelectorAll('.expertise-increase').forEach(btn => {
          btn.addEventListener('click', () => {
            changeExpertisePoints(parseInt(btn.dataset.group), parseInt(btn.dataset.skill), btn.dataset.name, 2, true);
          });
        });
        skillItem.querySelectorAll('.expertise-decrease').forEach(btn => {
          btn.addEventListener('click', () => {
            changeExpertisePoints(parseInt(btn.dataset.group), parseInt(btn.dataset.skill), btn.dataset.name, -2, true);
          });
        });

        // Bind "Add Expertise" button (SAME handler as normal skills)
        skillItem.querySelectorAll('.btn-add-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            toggleAddExpertiseForm(parseInt(btn.dataset.group), parseInt(btn.dataset.skill));
          });
        });

        // Bind suggestion chips (SAME handler as normal skills)
        skillItem.querySelectorAll('.suggestion-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const form = document.getElementById(`expertise-form-${chip.dataset.group}-${chip.dataset.skill}`);
            const input = form?.querySelector('.add-expertise-input');
            if (input) {
              input.value = chip.dataset.suggestion;
              confirmAddExpertise(parseInt(chip.dataset.group), parseInt(chip.dataset.skill));
            }
          });
        });

        // Bind confirm/cancel buttons (SAME handlers as normal skills)
        skillItem.querySelectorAll('.btn-confirm-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            confirmAddExpertise(parseInt(btn.dataset.group), parseInt(btn.dataset.skill));
          });
        });
        skillItem.querySelectorAll('.btn-cancel-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            const form = btn.closest('.add-expertise-form');
            if (form) form.classList.add('hidden');
          });
        });

        // Bind Enter key on input (SAME handler as normal skills)
        const inputEl = skillItem.querySelector('.add-expertise-input');
        if (inputEl) {
          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              confirmAddExpertise(parseInt(e.target.dataset.group), parseInt(e.target.dataset.skill));
            }
          });
        }

        groupEl.appendChild(skillItem);
      });

      container.appendChild(groupEl);
    });

    // ponytail: transmuter discipline selector — renders after artisan skills
    if (transmuterState.points > 0) {
      const transEl = document.createElement('div');
      transEl.className = 'skill-group transmuter-group';
      transEl.innerHTML = `
        <div class="skill-group-header">
          <span class="skill-group-name">⚗️ Transmuter Bonus</span>
          <span class="skill-group-substat">(+${transmuterState.points} flat bonus)</span>
        </div>
        <div class="transmuter-discipline-row">
          <label>Crafting discipline:</label>
          <select id="transmuter-discipline-select">
            ${ARTISAN_SKILLS.map(s => `<option value="${s}"${s === transmuterState.discipline ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      `;
      container.appendChild(transEl);

      const select = document.getElementById('transmuter-discipline-select');
      select.addEventListener('change', () => {
        transmuterState.discipline = select.value;
      });
    }
  }

  /**
   * Change artisan skill points (artisan source only).
   */
  function changeArtisanSkillPoints(groupIdx, skillIdx, delta) {
    const skill = artisanSkillGroups[groupIdx].skills[skillIdx];
    const effectiveCap = getEffectiveSkillCap(skill.name);
    const currentTotal = getSkillTotalPoints(skill.name);

    if (delta > 0) {
      // Spending: must have artisan as active source
      if (activeSource !== 'artisan') {
        // Flash to guide user to select artisan source
        flashAvailableSources();
        return;
      }

      // Check skill is eligible for artisan source
      const eligible = availablePoints.eligibleSkills?.artisan || [];
      if (!eligible.includes(skill.name)) return;

      // Check source has remaining points
      if (getSourceRemaining('artisan') <= 0) {
        flashAvailableSources();
        return;
      }

      // Check cap
      if (currentTotal >= effectiveCap) return;

      // Allocate one point from artisan source
      sourceSpent.artisan[skill.name] = (sourceSpent.artisan[skill.name] || 0) + 1;

    } else if (delta < 0) {
      // Removing: take from artisan source first, then other sources
      const sources = ['artisan', ...ALL_SOURCES.reverse()];
      let removed = false;
      for (const src of sources) {
        if (getSourceSkillPoints(src, skill.name) > 0) {
          sourceSpent[src][skill.name]--;
          if (sourceSpent[src][skill.name] === 0) {
            delete sourceSpent[src][skill.name];
          }
          removed = true;
          break;
        }
      }
      if (!removed) return;
    }

    // Sync display values
    syncArtisanSkillGroupsFromSources();

    // Re-render artisan section
    renderArtisanSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  /**
   * Sync artisan skill groups from source spending.
   */
  function syncArtisanSkillGroupsFromSources() {
    artisanSkillGroups.forEach(group => {
      group.skills.forEach(skill => {
        skill.pts = getSkillTotalPoints(skill.name);
      });
    });
  }



  function renderSkills() {
    const container = document.getElementById('skills-container');
    if (!container) return;

    container.innerHTML = '';

    // Get eligible skills for the active source
    const eligibleSkills = activeSource ? (availablePoints.eligibleSkills?.[activeSource] || []) : [];
    const activeRemaining = activeSource ? getSourceRemaining(activeSource) : 0;

    skillGroups.forEach((group, groupIdx) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'skill-group';

      groupEl.innerHTML = `
        <div class="skill-group-header">
          <span class="skill-group-name">${window.escapeHtml(group.name)}</span>
          <span class="skill-group-substat">(${window.escapeHtml(group.subStat)})</span>
        </div>
      `;

      group.skills.forEach((skill, skillIdx) => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';

        const totalPts = getSkillTotalPoints(skill.name);
        const isEligible = eligibleSkills.includes(skill.name);
        const effectiveCap = getEffectiveSkillCap(skill.name);
        const currentExpPts = calculateExpertisePoints(skill.expertise || '');

        // Get breakthrough bonuses for this skill
        const btBonuses = getBreakthroughBonusesForSkill(skill.name, characterData?.breakthroughs || []);
        const btBonusHtml = btBonuses.length > 0
          ? `<span class="skill-bt-bonus" title="${btBonuses.map(b => `${b.breakthroughName}: ${b.bonus > 0 ? '+' : ''}${b.bonus} ${b.condition ? '(' + b.condition + ')' : ''}`).join(', ')}">
              ${btBonuses.map(b => `<span class="bt-bonus-tag" title="${b.breakthroughName}: ${b.bonus > 0 ? '+' : ''}${b.bonus}${b.condition ? ' (' + b.condition + ')' : ''}">${b.bonus > 0 ? '+' : ''}${b.bonus}</span>`).join('')}
            </span>`
          : '';

        // + button: enabled when active source can spend, OR when source is empty
        // but other sources have points (clicking triggers flash to guide user)
        const canSpend = activeSource
          ? (totalPts < effectiveCap && activeRemaining > 0 && isEligible)
          : false;
        const canFlash = !canSpend && activeSource && isEligible && totalPts < effectiveCap
          ? (getSourceRemaining('base') + getSourceRemaining('race') + getSourceRemaining('class') + getSourceRemaining('breakthrough') > 0)
          : false;
        const canIncrease = canSpend || canFlash;

        // - button: enabled when skill has any points from any source
        const canDecrease = totalPts > 0;

        // Build per-source breakdown tooltip
        const sourceBreakdown = [];
        for (const src of ['base', 'race', 'class', 'breakthrough']) {
          const srcPts = getSourceSkillPoints(src, skill.name);
          if (srcPts > 0) {
            const srcLabel = { base: 'Base', race: 'Race', class: 'Class', bt: 'BT' }[src] || src;
            sourceBreakdown.push(`${srcLabel}: ${srcPts}`);
          }
        }
        const tooltip = sourceBreakdown.length > 0 ? `title="${sourceBreakdown.join(', ')}"` : '';

        // Expertise: parse into structured array
        const expertises = parseExpertiseString(skill.expertise || '');
        const suggestions = SKILL_EXPERTISE_EXAMPLES[skill.name] || [];
        // Expertise buttons: same logic — keep clickable when other sources have points
        const canSpendExp = activeSource && isEligible && activeRemaining > 0 && (currentExpPts + 2 <= effectiveCap);
        const canFlashExp = !canSpendExp && activeSource && isEligible && (currentExpPts + 2 <= effectiveCap)
          ? (getSourceRemaining('base') + getSourceRemaining('race') + getSourceRemaining('class') + getSourceRemaining('breakthrough') > 0)
          : false;
        const canAddExp = canSpendExp || canFlashExp;

        skillItem.innerHTML = `
          <div class="skill-row ${isEligible ? 'eligible' : ''} ${!isEligible && activeSource ? 'ineligible' : ''}">
            <span class="skill-name" ${tooltip}>${window.escapeHtml(skill.name)}</span>
            ${btBonusHtml}
            <button class="skill-btn skill-decrease" ${canDecrease ? '' : 'disabled'}>-</button>
            <span class="skill-points-display" ${tooltip}>${totalPts}</span>
            <button class="skill-btn skill-increase" ${canIncrease ? '' : 'disabled'}>+</button>
          </div>
          <div class="skill-expertise-section">
            <div class="skill-expertise-list">
              ${expertises.map(exp => `
                <div class="expertise-item" data-expertise-name="${window.escapeHtml(exp.name)}">
                  <span class="expertise-item-name" title="${window.escapeHtml(exp.name)}">${window.escapeHtml(exp.name)}</span>
                  <button class="expertise-btn expertise-decrease" data-group="${groupIdx}" data-skill="${skillIdx}" data-name="${window.escapeHtml(exp.name)}" ${exp.pts > 0 ? '' : 'disabled'}>-</button>
                  <span class="expertise-item-value">+${exp.pts}</span>
                  <button class="expertise-btn expertise-increase" data-group="${groupIdx}" data-skill="${skillIdx}" data-name="${window.escapeHtml(exp.name)}" ${(exp.pts + 2 > effectiveCap || !canAddExp) ? 'disabled' : ''}>+</button>
                </div>
              `).join('')}
              <button class="btn-add-expertise" data-group="${groupIdx}" data-skill="${skillIdx}" ${canAddExp ? '' : 'disabled'}>+ Add Expertise</button>
            </div>
            <div class="add-expertise-form hidden" id="expertise-form-${groupIdx}-${skillIdx}">
              <div class="add-expertise-input-row">
                <input type="text" class="add-expertise-input" placeholder="Expertise name..." autocomplete="off" data-group="${groupIdx}" data-skill="${skillIdx}">
                <button class="btn-confirm-expertise" data-group="${groupIdx}" data-skill="${skillIdx}">Add</button>
                <button class="btn-cancel-expertise" aria-label="Cancel">&times;</button>
              </div>
              ${suggestions.length > 0 ? `
                <div class="expertise-suggestions">
                  ${suggestions.map(s => `<span class="suggestion-chip" data-group="${groupIdx}" data-skill="${skillIdx}" data-suggestion="${window.escapeHtml(s)}">${window.escapeHtml(s)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;

        // Bind main skill buttons
        const decBtn = skillItem.querySelector('.skill-decrease');
        const incBtn = skillItem.querySelector('.skill-increase');
        decBtn.addEventListener('click', () => changeSkillPoints(groupIdx, skillIdx, -1));
        incBtn.addEventListener('click', () => changeSkillPoints(groupIdx, skillIdx, 1));

        // Bind expertise +/- buttons
        skillItem.querySelectorAll('.expertise-increase').forEach(btn => {
          btn.addEventListener('click', () => {
            changeExpertisePoints(parseInt(btn.dataset.group), parseInt(btn.dataset.skill), btn.dataset.name, 2);
          });
        });
        skillItem.querySelectorAll('.expertise-decrease').forEach(btn => {
          btn.addEventListener('click', () => {
            changeExpertisePoints(parseInt(btn.dataset.group), parseInt(btn.dataset.skill), btn.dataset.name, -2);
          });
        });

        // Bind "Add Expertise" button
        skillItem.querySelectorAll('.btn-add-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            toggleAddExpertiseForm(parseInt(btn.dataset.group), parseInt(btn.dataset.skill));
          });
        });

        // Bind suggestion chips
        skillItem.querySelectorAll('.suggestion-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const form = document.getElementById(`expertise-form-${chip.dataset.group}-${chip.dataset.skill}`);
            const input = form?.querySelector('.add-expertise-input');
            if (input) {
              input.value = chip.dataset.suggestion;
              confirmAddExpertise(parseInt(chip.dataset.group), parseInt(chip.dataset.skill));
            }
          });
        });

        // Bind confirm/cancel buttons
        skillItem.querySelectorAll('.btn-confirm-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            confirmAddExpertise(parseInt(btn.dataset.group), parseInt(btn.dataset.skill));
          });
        });
        skillItem.querySelectorAll('.btn-cancel-expertise').forEach(btn => {
          btn.addEventListener('click', () => {
            const form = btn.closest('.add-expertise-form');
            if (form) form.classList.add('hidden');
          });
        });

        // Bind Enter key on input
        const inputEl = skillItem.querySelector('.add-expertise-input');
        if (inputEl) {
          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              confirmAddExpertise(parseInt(e.target.dataset.group), parseInt(e.target.dataset.skill));
            }
          });
        }

        groupEl.appendChild(skillItem);
      });

      container.appendChild(groupEl);
    });
  }

  /**
   * Targeted DOM update for a single skill row after changeSkillPoints.
   * Replaces the full renderSkills() call on +/- clicks.
   */
  function updateSkillRow(groupIdx, skillIdx) {
    const groupEls = document.querySelectorAll('.skill-group');
    const groupEl = groupEls[groupIdx];
    if (!groupEl) return;

    const rows = groupEl.querySelectorAll('.skill-item');
    const skillItem = rows[skillIdx];
    if (!skillItem) return;

    const skill = skillGroups[groupIdx].skills[skillIdx];
    const eligibleSkills = activeSource ? (availablePoints.eligibleSkills?.[activeSource] || []) : [];
    const isEligible = eligibleSkills.includes(skill.name);
    const effectiveCap = getEffectiveSkillCap(skill.name);
    const totalPts = getSkillTotalPoints(skill.name);
    const currentExpPts = calculateExpertisePoints(skill.expertise || '');
    const activeRemaining = activeSource ? getSourceRemaining(activeSource) : 0;

    // Update skill row
    const row = skillItem.querySelector('.skill-row');
    if (row) {
      row.className = `skill-row ${isEligible ? 'eligible' : ''} ${!isEligible && activeSource ? 'ineligible' : ''}`;
    }

    // Update points display
    const display = skillItem.querySelector('.skill-points-display');
    if (display) {
      display.textContent = totalPts;
      // Update tooltip
      const sourceBreakdown = [];
      for (const src of ['base', 'race', 'class', 'breakthrough']) {
        const srcPts = getSourceSkillPoints(src, skill.name);
        if (srcPts > 0) {
          const srcLabel = { base: 'Base', race: 'Race', class: 'Class', bt: 'BT' }[src] || src;
          sourceBreakdown.push(`${srcLabel}: ${srcPts}`);
        }
      }
      display.title = sourceBreakdown.join(', ');
    }

    // Update +/- buttons
    const decBtn = skillItem.querySelector('.skill-decrease');
    const incBtn = skillItem.querySelector('.skill-increase');
    if (decBtn) decBtn.disabled = totalPts <= 0;
    if (incBtn) {
      const canSpend = activeSource && (totalPts < effectiveCap && activeRemaining > 0 && isEligible);
      const canFlash = !canSpend && activeSource && isEligible && totalPts < effectiveCap
        ? (getSourceRemaining('base') + getSourceRemaining('race') + getSourceRemaining('class') + getSourceRemaining('breakthrough') > 0)
        : false;
      incBtn.disabled = !(canSpend || canFlash);
    }

    // Update expertise section
    const expertises = parseExpertiseString(skill.expertise || '');
    const canSpendExp = activeSource && isEligible && activeRemaining > 0 && (currentExpPts + 2 <= effectiveCap);
    const canFlashExp = !canSpendExp && activeSource && isEligible && (currentExpPts + 2 <= effectiveCap)
      ? (getSourceRemaining('base') + getSourceRemaining('race') + getSourceRemaining('class') + getSourceRemaining('breakthrough') > 0)
      : false;
    const canAddExp = canSpendExp || canFlashExp;

    // Update expertise items
    skillItem.querySelectorAll('.expertise-item').forEach(item => {
      const name = item.dataset.expertiseName;
      const exp = expertises.find(e => e.name === name);
      if (exp) {
        const valSpan = item.querySelector('.expertise-item-value');
        if (valSpan) valSpan.textContent = `+${exp.pts}`;
        const decBtn = item.querySelector('.expertise-decrease');
        if (decBtn) decBtn.disabled = exp.pts <= 0;
        const incBtn = item.querySelector('.expertise-increase');
        if (incBtn) incBtn.disabled = exp.pts + 2 > effectiveCap || !canAddExp;
      }
    });

    // Update add expertise button
    const addBtn = skillItem.querySelector('.btn-add-expertise');
    if (addBtn) addBtn.disabled = !canAddExp;
  }

  /**
   * Flash the source rows that have remaining points when the active
   * source is empty. Draws the user's attention to alternative sources
   * they can switch to.
   */
  function flashAvailableSources() {
    const breakdown = document.getElementById('skill-points-breakdown');
    if (!breakdown) return;

    const allSources = ['base', 'race', 'class', 'breakthrough', 'artisan'];
    const availableRows = [];

    allSources.forEach(src => {
      const remaining = getSourceRemaining(src);
      if (remaining > 0 && src !== activeSource) {
        const row = breakdown.querySelector(`.skill-source-row[data-source="${src}"]`);
        if (row) availableRows.push(row);
      }
    });

    if (availableRows.length === 0) return;

    // Scroll the breakdown into view if it's not visible
    // The breakdown sits at the top of the step-panel; when the user scrolled
    // down to look at skills, we need to bring it back into view.
    const breakdownRect = breakdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Only scroll if the breakdown is outside the visible area
    if (breakdownRect.top < 0 || breakdownRect.top > viewportHeight * 0.3) {
      // Scroll the step-panel (or wizard-step) to the top
      // Both have overflow-y: auto, so we scroll both to be safe
      const stepPanel = breakdown.closest('.step-panel');
      const wizardStep = breakdown.closest('.wizard-step');
      if (stepPanel) {
        stepPanel.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (wizardStep) {
        wizardStep.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Delay flash slightly to let scroll animation start
    setTimeout(() => {
      availableRows.forEach((row, i) => {
        // Stagger the flash slightly for each row
        setTimeout(() => {
          row.classList.add('skill-source-flash');
          // Remove class after animation completes
          setTimeout(() => row.classList.remove('skill-source-flash'), 1800);
        }, i * 150);
      });
    }, 300);
  }

  function changeSkillPoints(groupIdx, skillIdx, delta) {
    const skill = skillGroups[groupIdx].skills[skillIdx];
    const effectiveCap = getEffectiveSkillCap(skill.name);
    const currentTotal = getSkillTotalPoints(skill.name);

    if (delta > 0) {
      // Spending: must have an active source
      if (!activeSource) return;

      // Check skill is eligible for active source
      const eligible = availablePoints.eligibleSkills?.[activeSource] || [];
      if (!eligible.includes(skill.name)) return;

      // Check source has remaining points
      if (getSourceRemaining(activeSource) <= 0) {
        flashAvailableSources();
        return;
      }

      // Check cap
      if (currentTotal >= effectiveCap) return;

      // Allocate one point from active source
      sourceSpent[activeSource][skill.name] = (sourceSpent[activeSource][skill.name] || 0) + 1;

    } else if (delta < 0) {
      // Removing: take from sources in reverse priority (breakthrough → class → race → base)
      const sources = ['breakthrough', 'class', 'race', 'base'];
      let removed = false;
      for (const src of sources) {
        if (getSourceSkillPoints(src, skill.name) > 0) {
          sourceSpent[src][skill.name]--;
          if (sourceSpent[src][skill.name] === 0) {
            delete sourceSpent[src][skill.name];
          }
          removed = true;
          break;
        }
      }
      if (!removed) return;
    }

    // Sync display values
    syncSkillGroupsFromSources();

    // ponytail: targeted DOM update instead of full renderSkills()
    updateSkillRow(groupIdx, skillIdx);
    updatePointsDisplay();
    renderPointsBreakdown();

    // Animate the points display
    const groupEls = document.querySelectorAll('.skill-group');
    if (groupEls[groupIdx]) {
      const groupEl = groupEls[groupIdx];
      const rows = groupEl.querySelectorAll('.skill-row');
      if (rows[skillIdx] && window.gsap) {
        const row = rows[skillIdx];
        const display = row.querySelector('.skill-points-display');
        gsap.fromTo(display, { scale: 1.4, color: '#fff' }, {
          scale: 1, color: '#d4af37', duration: 0.25, ease: 'back.out(1.7)'
        });
      }
    }
  }

  /**
   * Toggle the "Add Expertise" form for a specific skill.
   * @param {number} groupIdx - Index of the skill group
   * @param {number} skillIdx - Index of the skill in the group
   * @param {boolean} isArtisan - Whether this is an artisan skill
   */
  function toggleAddExpertiseForm(groupIdx, skillIdx, isArtisan = false) {
    // Close any open form first
    const existingForm = document.querySelector('.add-expertise-form:not(.hidden)');
    if (existingForm) {
      existingForm.classList.add('hidden');
      return;
    }

    // Open form for this skill
    const form = document.getElementById(`expertise-form-${groupIdx}-${skillIdx}`);
    if (form) {
      form.classList.remove('hidden');
      const input = form.querySelector('.add-expertise-input');
      if (input) input.focus();
    }
  }

  /**
   * Confirm adding a new expertise from the form.
   * Spends 1 skill point from active source for 2 expertise points.
   * @param {number} groupIdx - Index of the skill group
   * @param {number} skillIdx - Index of the skill in the group
   * @param {boolean} isArtisan - Whether this is an artisan skill
   */
  function confirmAddExpertise(groupIdx, skillIdx, isArtisan = false) {
    const form = document.getElementById(`expertise-form-${groupIdx}-${skillIdx}`);
    if (!form) return;
    const input = form.querySelector('.add-expertise-input');
    if (!input) return;

    const expName = input.value.trim();
    if (!expName) return;

    // Get skill from correct group
    const groups = isArtisan ? artisanSkillGroups : skillGroups;
    const skill = groups[groupIdx].skills[skillIdx];
    const effectiveCap = getEffectiveSkillCap(skill.name);

    // Check: must have active source
    if (!activeSource) {
      form.classList.add('hidden');
      return;
    }

    // Check: skill must be eligible for active source
    const eligible = availablePoints.eligibleSkills?.[activeSource] || [];
    if (!eligible.includes(skill.name)) {
      form.classList.add('hidden');
      return;
    }

    // Check: source must have remaining points
    if (getSourceRemaining(activeSource) <= 0) {
      flashAvailableSources();
      form.classList.add('hidden');
      return;
    }

    // Check: cap not exceeded (adding 2 expertise points)
    const currentExpPts = calculateExpertisePoints(skill.expertise || '');
    if (currentExpPts + 2 > effectiveCap) {
      form.classList.add('hidden');
      return;
    }

    // Parse existing expertises, add or increment
    const expertises = parseExpertiseString(skill.expertise || '');
    const existing = expertises.find(e => e.name.toLowerCase() === expName.toLowerCase());
    if (existing) {
      existing.pts += 2;
    } else {
      expertises.push({ name: expName, pts: 2 });
    }

    // Spend 1 skill point from active source
    sourceExpertiseSpent[activeSource][skill.name] = (sourceExpertiseSpent[activeSource][skill.name] || 0) + 1;

    // Serialize and save
    skill.expertise = serializeExpertiseArray(expertises);

    // Re-render
    if (isArtisan) {
      syncArtisanSkillGroupsFromSources();
      renderArtisanSkills();
    } else {
      syncSkillGroupsFromSources();
      renderSkills();
    }
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  /**
   * Change expertise points for a specific expertise entry.
   * delta: +2 or -2 expertise points (costs/refunds 1 skill point).
   * @param {number} groupIdx - Index of the skill group
   * @param {number} skillIdx - Index of the skill in the group
   * @param {string} expName - Name of the expertise
   * @param {number} delta - +2 or -2
   * @param {boolean} isArtisan - Whether this is an artisan skill
   */
  function changeExpertisePoints(groupIdx, skillIdx, expName, delta, isArtisan = false) {
    // Get skill from correct group
    const groups = isArtisan ? artisanSkillGroups : skillGroups;
    const skill = groups[groupIdx].skills[skillIdx];
    const effectiveCap = getEffectiveSkillCap(skill.name);

    // Parse current expertise list
    const expertises = parseExpertiseString(skill.expertise || '');
    const expObj = expertises.find(e => e.name.toLowerCase() === expName.toLowerCase());

    if (delta > 0) {
      // Adding 2 expertise points = spending 1 skill point
      if (!activeSource) return;
      const eligible = availablePoints.eligibleSkills?.[activeSource] || [];
      if (!eligible.includes(skill.name)) return;
      if (getSourceRemaining(activeSource) <= 0) {
        flashAvailableSources();
        return;
      }
      if (!expObj) return;
      if (expObj.pts + 2 > effectiveCap) return; // Cap check

      expObj.pts += 2;
      sourceExpertiseSpent[activeSource][skill.name] = (sourceExpertiseSpent[activeSource][skill.name] || 0) + 1;

    } else if (delta < 0) {
      if (!expObj || expObj.pts <= 0) return;

      // Reclaim 1 skill point from sourceExpertiseSpent in reverse priority
      const sources = isArtisan ? ['artisan', 'breakthrough', 'class', 'race', 'base'] : ['breakthrough', 'class', 'race', 'base'];
      let removed = false;
      for (const src of sources) {
        if ((sourceExpertiseSpent[src]?.[skill.name] || 0) > 0) {
          sourceExpertiseSpent[src][skill.name]--;
          if (sourceExpertiseSpent[src][skill.name] === 0) {
            delete sourceExpertiseSpent[src][skill.name];
          }
          removed = true;
          break;
        }
      }
      if (!removed) return;

      expObj.pts -= 2;
      if (expObj.pts <= 0) {
        const idx = expertises.indexOf(expObj);
        if (idx !== -1) expertises.splice(idx, 1);
      }
    }

    // Serialize and save
    skill.expertise = serializeExpertiseArray(expertises);

    // Re-render
    if (isArtisan) {
      syncArtisanSkillGroupsFromSources();
      renderArtisanSkills();
    } else {
      syncSkillGroupsFromSources();
      renderSkills();
    }
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  /**
   * Update the points display showing remaining per active source
   */
  function updatePointsDisplay() {
    // Update the "points spent" summary bar
    const bar = document.getElementById('skill-points-remaining-bar');
    if (!bar) return;

    const totalSpent = getSourceTotalSpent('base') + getSourceTotalSpent('race') + getSourceTotalSpent('class') + getSourceTotalSpent('breakthrough');
    const totalAvailable = availablePoints.total;
    const totalRemaining = totalAvailable - totalSpent;

    // Show per-source breakdown if active source is set
    if (activeSource) {
      const srcRemaining = getSourceRemaining(activeSource);
      const srcLabel = { base: 'Base', race: 'Race', class: 'Class', breakthrough: 'Breakthrough', artisan: 'Artisan' }[activeSource];
      bar.innerHTML = `
        <span class="skill-points-label">Spending from ${srcLabel}:</span>
        <span class="skill-points-value ${srcRemaining <= 0 ? 'empty' : ''}">${srcRemaining} remaining</span>
        <span class="skill-points-label">(Total: ${totalRemaining}/${totalAvailable})</span>
        ${activeSource === 'artisan' ? `<span class="skill-points-label artisan-tag">[Artisan pool: ${availablePoints.artisan} pts]</span>` : ''}
      `;
    } else {
      bar.innerHTML = `
        <span class="skill-points-label">Select a source above to spend points</span>
        <span class="skill-points-value">(Total: ${totalRemaining}/${totalAvailable})</span>
      `;
    }
  }

  function getSkills() {
    // Sync before returning
    syncSkillGroupsFromSources();
    syncArtisanSkillGroupsFromSources();
    return {
      normal: structuredClone(skillGroups),
      artisan: structuredClone(artisanSkillGroups),
      transmuter: { ...transmuterState }
    };
  }

  /**
   * Get per-source spending data for export/debugging.
   * Returns { main: sourceSpent, expertise: sourceExpertiseSpent } for save/restore.
   */
  function getSourceAllocations() {
    return {
      main: structuredClone(sourceSpent),
      expertise: structuredClone(sourceExpertiseSpent)
    };
  }

  /**
   * Restore previously saved skill allocations.
   * savedSkills: array of skill groups matching SKILL_GROUPS structure
   * savedSourceAllocations: optional per-source spending map (eliminates heuristic rebuild)
   */
  function restoreState(savedSkills, savedSourceAllocations) {
    // ponytail: accept full { normal, artisan, transmuter } object or legacy array
    const normalSkills = savedSkills.normal || savedSkills;
    const artisanSkills = savedSkills.artisan;
    const transmuter = savedSkills.transmuter;
    if (!Array.isArray(normalSkills) || normalSkills.length === 0) return;

    // Restore normal skill points and expertise
    normalSkills.forEach((savedGroup, gi) => {
      if (gi >= skillGroups.length) return;
      if (!savedGroup.skills) return;
      savedGroup.skills.forEach((savedSkill, si) => {
        if (si >= skillGroups[gi].skills.length) return;
        if (skillGroups[gi].skills[si].name === savedSkill.name) {
          skillGroups[gi].skills[si].pts = savedSkill.pts || 0;
          skillGroups[gi].skills[si].expertise = savedSkill.expertise || '';
        }
      });
    });

    // ponytail: restore artisan skills
    if (Array.isArray(artisanSkills)) {
      artisanSkills.forEach((savedGroup, gi) => {
        if (gi >= artisanSkillGroups.length) return;
        if (!savedGroup.skills) return;
        savedGroup.skills.forEach((savedSkill, si) => {
          if (si >= artisanSkillGroups[gi].skills.length) return;
          if (artisanSkillGroups[gi].skills[si].name === savedSkill.name) {
            artisanSkillGroups[gi].skills[si].pts = savedSkill.pts || 0;
            artisanSkillGroups[gi].skills[si].expertise = savedSkill.expertise || '';
          }
        });
      });
    }

    // ponytail: restore transmuter state
    if (transmuter && typeof transmuter === 'object') {
      transmuterState.points = transmuter.points || 0;
      transmuterState.discipline = transmuter.discipline || '';
    }

    // ponytail: use stored source allocations directly instead of heuristic rebuild
    if (savedSourceAllocations && savedSourceAllocations.main) {
      sourceSpent = structuredClone(savedSourceAllocations.main);
      sourceExpertiseSpent = structuredClone(savedSourceAllocations.expertise) || { base: {}, race: {}, class: {}, breakthrough: {}, artisan: {} };
    } else {
      // Legacy fallback: no source data — attribute everything to base
      clearSourceSpent();
      skillGroups.forEach(group => {
        group.skills.forEach(skill => {
          if (skill.pts > 0) {
            sourceSpent.base[skill.name] = skill.pts;
          }
          const expTotalPts = calculateExpertisePoints(skill.expertise || '');
          const expSkillPts = Math.ceil(expTotalPts / 2);
          if (expSkillPts > 0) {
            sourceExpertiseSpent.base[skill.name] = expSkillPts;
          }
        });
      });
    }

    // Default active source to base
    activeSource = 'base';

    renderSkills();
    renderArtisanSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  function reset() {
    skillGroups = deepCloneSkillGroups();
    artisanSkillGroups = deepCloneArtisanSkillGroups();
    availablePoints = {
      base: BASE_SKILL_POINTS,
      race: 0,
      class: 0,
      breakthrough: 0,
      artisan: 0,
      total: BASE_SKILL_POINTS,
      artisanTotal: 0,
      eligibleSkills: {}
    };
    characterData = null;
    activeSource = 'base';
    transmuterState = { points: 0, discipline: '' };
    clearSourceSpent();
    renderSkills();
    renderArtisanSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  return { init, getSkills, reset, setCharacterData, setActiveSource, getSourceAllocations, restoreState };
})();
