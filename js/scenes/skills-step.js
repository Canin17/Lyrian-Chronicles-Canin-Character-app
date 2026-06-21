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
  let availablePoints = { base: 10, race: 0, class: 0, breakthrough: 0, total: 10, eligibleSkills: {} };
  let characterData = null;
  let activeSource = null; // Currently selected source for spending

  // Per-source spending: sourceSpent[source] = { 'SkillName': pts }
  // Total for a skill = sum of all source allocations
  let sourceSpent = {
    base: {},
    race: {},
    class: {},
    breakthrough: {}
  };

  function init() {
    skillGroups = deepCloneSkillGroups();
    availablePoints = {
      base: BASE_SKILL_POINTS,
      race: 0,
      class: 0,
      breakthrough: 0,
      total: BASE_SKILL_POINTS,
      eligibleSkills: {}
    };
    clearSourceSpent();
    activeSource = 'base'; // Default to base source
    renderSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  /**
   * Clear all source spending tracking
   */
  function clearSourceSpent() {
    sourceSpent = { base: {}, race: {}, class: {}, breakthrough: {} };
  }

  /**
   * Get total points a skill has from a specific source
   */
  function getSourceSkillPoints(source, skillName) {
    return sourceSpent[source]?.[skillName] || 0;
  }

  /**
   * Get total points spent from a source across all skills
   */
  function getSourceTotalSpent(source) {
    const alloc = sourceSpent[source] || {};
    return Object.values(alloc).reduce((sum, v) => sum + v, 0);
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
    for (const source of ['base', 'race', 'class', 'breakthrough']) {
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
   * Rebuild sourceSpent from existing skillGroups state on restore.
   * Best-effort approximation since saved data only stores totals.
   * Tracks attributed amounts per source to prevent over-attribution.
   */
  function rebuildSourceSpent() {
    clearSourceSpent();

    // Track how much we've attributed to each source this pass
    const attributed = { base: 0, race: 0, class: 0, breakthrough: 0 };

    // For each skill that has points, try to attribute to sources
    // Priority: restricted sources first (race, class, breakthrough), then base
    skillGroups.forEach(group => {
      group.skills.forEach(skill => {
        if (skill.pts <= 0) return;

        let ptsLeft = skill.pts;

        // Try restricted sources first (they have limited eligible lists)
        const restrictedSources = ['race', 'class', 'breakthrough'];
        for (const src of restrictedSources) {
          if (ptsLeft <= 0) break;
          const eligible = availablePoints.eligibleSkills?.[src] || [];
          if (!eligible.includes(skill.name)) continue;
          const poolSize = availablePoints[src] || 0;
          const alreadyAttributed = attributed[src];
          const remainingInPool = poolSize - alreadyAttributed;
          if (remainingInPool <= 0) continue;
          // How many can we attribute to this source?
          const maxFromSource = Math.min(remainingInPool, ptsLeft);
          if (maxFromSource > 0) {
            sourceSpent[src][skill.name] = (sourceSpent[src][skill.name] || 0) + maxFromSource;
            attributed[src] += maxFromSource;
            ptsLeft -= maxFromSource;
          }
        }

        // Remaining goes to base (unrestricted)
        if (ptsLeft > 0) {
          sourceSpent.base[skill.name] = (sourceSpent.base[skill.name] || 0) + ptsLeft;
          attributed.base += ptsLeft;
        }
      });
    });
  }

  /**
   * Set character data for skill point calculation
   */
  function setCharacterData(data) {
    characterData = data;
    availablePoints = calculateAvailableSkillPoints(data);
    // Don't reset activeSource here — keep user's selection
    renderPointsBreakdown();
    renderSkills();
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

    // Show eligible skills panel if a source is active
    const eligiblePanel = document.getElementById('eligible-skills-panel');
    if (eligiblePanel) {
      if (activeSource && availablePoints.eligibleSkills?.[activeSource]?.length > 0) {
        const eligibleSkills = availablePoints.eligibleSkills[activeSource];
        eligiblePanel.innerHTML = `
          <div class="eligible-skills-header">
            <span class="eligible-skills-title">Eligible Skills for ${activeSource} points:</span>
            <button class="close-eligible" aria-label="Close eligible skills">&times;</button>
          </div>
          <div class="eligible-skills-list">
            ${eligibleSkills.map(skill => `<span class="eligible-skill-tag">${window.escapeHtml(skill)}</span>`).join('')}
          </div>
        `;
        eligiblePanel.style.display = 'block';

        eligiblePanel.querySelector('.close-eligible').addEventListener('click', () => {
          setActiveSource(activeSource);
        });
      } else {
        eligiblePanel.style.display = 'none';
      }
    }
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
        const row = document.createElement('div');
        const totalPts = getSkillTotalPoints(skill.name);
        const isEligible = eligibleSkills.includes(skill.name);
        row.className = `skill-row ${isEligible ? 'eligible' : ''} ${!isEligible && activeSource ? 'ineligible' : ''}`;

        const effectiveCap = getEffectiveSkillCap(skill.name);

        // + button: enabled when active source has remaining AND skill is eligible for that source
        const canIncrease = activeSource
          ? (totalPts < effectiveCap && activeRemaining > 0 && isEligible)
          : false;

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

        row.innerHTML = `
          <span class="skill-name" ${tooltip}>${window.escapeHtml(skill.name)}</span>
          <button class="skill-btn skill-decrease" ${canDecrease ? '' : 'disabled'}>-</button>
          <span class="skill-points-display" ${tooltip}>${totalPts}</span>
          <button class="skill-btn skill-increase" ${canIncrease ? '' : 'disabled'}>+</button>
          <input type="text" class="skill-expertise" placeholder="Expertise..." value="" data-group="${groupIdx}" data-skill="${skillIdx}">
        `;

        const decBtn = row.querySelector('.skill-decrease');
        const incBtn = row.querySelector('.skill-increase');
        const expertiseInput = row.querySelector('.skill-expertise');

        expertiseInput.value = skill.expertise || '';

        decBtn.addEventListener('click', () => changeSkillPoints(groupIdx, skillIdx, -1));
        incBtn.addEventListener('click', () => changeSkillPoints(groupIdx, skillIdx, 1));
        expertiseInput.addEventListener('input', (e) => {
          skillGroups[groupIdx].skills[skillIdx].expertise = e.target.value;
        });

        groupEl.appendChild(row);
      });

      container.appendChild(groupEl);
    });
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
      if (getSourceRemaining(activeSource) <= 0) return;

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

    renderSkills();
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
      const srcLabel = { base: 'Base', race: 'Race', class: 'Class', breakthrough: 'Breakthrough' }[activeSource];
      bar.innerHTML = `
        <span class="skill-points-label">Spending from ${srcLabel}:</span>
        <span class="skill-points-value ${srcRemaining <= 0 ? 'empty' : ''}">${srcRemaining} remaining</span>
        <span class="skill-points-label">(Total: ${totalRemaining}/${totalAvailable})</span>
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
    return structuredClone(skillGroups);
  }

  /**
   * Get per-source spending data for export/debugging
   */
  function getSourceAllocations() {
    return structuredClone(sourceSpent);
  }

  /**
   * Restore previously saved skill allocations.
   * savedSkills: array of skill groups matching SKILL_GROUPS structure
   */
  function restoreState(savedSkills) {
    if (!Array.isArray(savedSkills) || savedSkills.length === 0) return;

    // Restore skill points and expertise for each group
    savedSkills.forEach((savedGroup, gi) => {
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

    // Rebuild source tracking from restored state
    rebuildSourceSpent();

    // Default active source to base
    activeSource = 'base';

    renderSkills();
    updatePointsDisplay();
    renderPointsBreakdown();
  }

  function reset() {
    skillGroups = deepCloneSkillGroups();
    availablePoints = {
      base: BASE_SKILL_POINTS,
      race: 0,
      class: 0,
      breakthrough: 0,
      total: BASE_SKILL_POINTS,
      eligibleSkills: {}
    };
    characterData = null;
    activeSource = 'base';
    clearSourceSpent();
    renderSkills();
    updatePointsDisplay();
    renderPointsBreakdown();

    // Hide eligible skills panel
    const eligiblePanel = document.getElementById('eligible-skills-panel');
    if (eligiblePanel) {
      eligiblePanel.style.display = 'none';
    }
  }

  return { init, getSkills, reset, setCharacterData, setActiveSource, getSourceAllocations, restoreState };
})();
