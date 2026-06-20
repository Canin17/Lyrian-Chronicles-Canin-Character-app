/**
 * Lyrian Chronicles - Skills Allocation Scene
 * Skill point distribution across 5 skill groups
 * Multi-source skill point aggregation (base, race, class, breakthroughs)
 * Per-source eligible skill enforcement
 * Clickable sources with eligible skills display
 */

const SkillsStepScene = (function() {
  let skillGroups = [];
  let availablePoints = { base: 10, race: 0, class: 0, breakthrough: 0, total: 10, eligibleSkills: {} };
  let characterData = null;
  let activeSource = null; // Track which source is currently selected

  // Per-source allocation tracking
  let sourceAllocations = {
    base: {},    // { 'SkillName': pts }
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
    resetSourceAllocations();
    renderSkills();
    updatePointsRemaining();
    renderPointsBreakdown();
  }

  /**
   * Reset per-source allocation tracking
   */
  function resetSourceAllocations() {
    sourceAllocations = { base: {}, race: {}, class: {}, breakthrough: {} };
  }

  /**
   * Recalculate source allocations from current skill group state.
   * This is a best-effort approximation since the document only stores totals.
   */
  function recalculateSourceAllocations() {
    // Reset
    sourceAllocations = { base: {}, race: {}, class: {}, breakthrough: {} };

    // For each skill that has points, distribute across sources
    // Priority: base first (unrestricted), then race, class, breakthrough
    skillGroups.forEach(group => {
      group.skills.forEach(skill => {
        if (skill.pts <= 0) return;

        let remaining = skill.pts;

        // Try to fill from base first (unrestricted)
        const baseCap = Math.min(availablePoints.base, remaining);
        if (baseCap > 0) {
          sourceAllocations.base[skill.name] = (sourceAllocations.base[skill.name] || 0) + baseCap;
          remaining -= baseCap;
        }

        // Then race (if eligible)
        if (remaining > 0 && availablePoints.race > 0) {
          const raceEligible = availablePoints.eligibleSkills?.race || [];
          if (raceEligible.includes(skill.name)) {
            const raceCap = Math.min(availablePoints.race, remaining);
            sourceAllocations.race[skill.name] = (sourceAllocations.race[skill.name] || 0) + raceCap;
            remaining -= raceCap;
          }
        }

        // Then class (if eligible)
        if (remaining > 0 && availablePoints.class > 0) {
          const classEligible = availablePoints.eligibleSkills?.class || [];
          if (classEligible.includes(skill.name)) {
            const classCap = Math.min(availablePoints.class, remaining);
            sourceAllocations.class[skill.name] = (sourceAllocations.class[skill.name] || 0) + classCap;
            remaining -= classCap;
          }
        }

        // Then breakthrough (if eligible)
        if (remaining > 0 && availablePoints.breakthrough > 0) {
          const btEligible = availablePoints.eligibleSkills?.breakthrough || [];
          if (btEligible.includes(skill.name)) {
            const btCap = Math.min(availablePoints.breakthrough, remaining);
            sourceAllocations.breakthrough[skill.name] = (sourceAllocations.breakthrough[skill.name] || 0) + btCap;
            remaining -= btCap;
          }
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
    activeSource = null; // Reset active source
    resetSourceAllocations();
    updatePointsRemaining();
    renderPointsBreakdown();
    renderSkills(); // Re-render skills to clear any highlights
  }

  /**
   * Toggle active source and show eligible skills
   */
  function toggleSource(source) {
    if (activeSource === source) {
      activeSource = null; // Deselect if already selected
    } else {
      activeSource = source;
    }
    renderPointsBreakdown();
    renderSkills();
  }

  function renderPointsBreakdown() {
    const breakdown = document.getElementById('skill-points-breakdown');
    if (!breakdown) return;

    const raceName = characterData?.race?.name || '';
    const className = characterData?.cls?.primary?.class?.name || '';
    const btNames = (characterData?.breakthroughs || [])
      .filter(bt => SKILL_GRANTING_BREAKTHROUGHS[bt.name || bt])
      .map(bt => bt.name || bt);

    breakdown.innerHTML = `
      <div class="skill-source-row ${activeSource === 'base' ? 'active' : ''}" data-source="base" onclick="SkillsStepScene.toggleSource('base')">
        <span class="skill-source-label">Base (Character Creation)</span>
        <span class="skill-source-value">${availablePoints.base}</span>
        <span class="skill-source-hint">Any skill</span>
      </div>
      ${availablePoints.race > 0 ? `
      <div class="skill-source-row ${activeSource === 'race' ? 'active' : ''}" data-source="race" onclick="SkillsStepScene.toggleSource('race')">
        <span class="skill-source-label">Race: ${raceName}</span>
        <span class="skill-source-value skill-bonus">+${availablePoints.race}</span>
        <span class="skill-source-hint">${availablePoints.eligibleSkills?.race?.length || 0} eligible</span>
      </div>` : ''}
      ${availablePoints.class > 0 ? `
      <div class="skill-source-row ${activeSource === 'class' ? 'active' : ''}" data-source="class" onclick="SkillsStepScene.toggleSource('class')">
        <span class="skill-source-label">Class: ${className}</span>
        <span class="skill-source-value skill-bonus">+${availablePoints.class}</span>
        <span class="skill-source-hint">${availablePoints.eligibleSkills?.class?.length || 0} eligible</span>
      </div>` : ''}
      ${availablePoints.breakthrough > 0 ? `
      <div class="skill-source-row ${activeSource === 'breakthrough' ? 'active' : ''}" data-source="breakthrough" onclick="SkillsStepScene.toggleSource('breakthrough')">
        <span class="skill-source-label">Breakthrough: ${btNames.join(', ') || 'Bonus'}</span>
        <span class="skill-source-value skill-bonus">+${availablePoints.breakthrough}</span>
        <span class="skill-source-hint">${availablePoints.eligibleSkills?.breakthrough?.length || 0} eligible</span>
      </div>` : ''}
      <div class="skill-source-row skill-source-total">
        <span class="skill-source-label">Total Available</span>
        <span class="skill-source-value">${availablePoints.total}</span>
      </div>
    `;

    // Show eligible skills panel if a source is active
    const eligiblePanel = document.getElementById('eligible-skills-panel');
    if (eligiblePanel) {
      if (activeSource && availablePoints.eligibleSkills?.[activeSource]?.length > 0) {
        const eligibleSkills = availablePoints.eligibleSkills[activeSource];
        eligiblePanel.innerHTML = `
          <div class="eligible-skills-header">
            <span class="eligible-skills-title">Eligible Skills for ${activeSource} points:</span>
            <button class="close-eligible" onclick="SkillsStepScene.toggleSource('${activeSource}')">&times;</button>
          </div>
          <div class="eligible-skills-list">
            ${eligibleSkills.map(skill => `<span class="eligible-skill-tag">${skill}</span>`).join('')}
          </div>
        `;
        eligiblePanel.style.display = 'block';
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

    skillGroups.forEach((group, groupIdx) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'skill-group';

      groupEl.innerHTML = `
        <div class="skill-group-header">
          <span class="skill-group-name">${group.name}</span>
          <span class="skill-group-substat">(${group.subStat})</span>
        </div>
      `;

      group.skills.forEach((skill, skillIdx) => {
        const row = document.createElement('div');
        const isEligible = eligibleSkills.includes(skill.name);
        row.className = `skill-row ${isEligible ? 'eligible' : ''} ${!isEligible && activeSource ? 'ineligible' : ''}`;

        // Use effective cap (artisan skills cap at 10)
        const effectiveCap = getEffectiveSkillCap(skill.name);
        const canIncrease = skill.pts < effectiveCap && getRemainingPoints(skillGroups, availablePoints.total) > 0;
        const canDecrease = skill.pts > 0;

        row.innerHTML = `
          <span class="skill-name">${skill.name}</span>
          <button class="skill-btn skill-decrease" ${canDecrease ? '' : 'disabled'}>-</button>
          <span class="skill-points-display">${skill.pts}</span>
          <button class="skill-btn skill-increase" ${canIncrease ? '' : 'disabled'}>+</button>
          <input type="text" class="skill-expertise" placeholder="Expertise..." value="" data-group="${groupIdx}" data-skill="${skillIdx}">
        `;

        const decBtn = row.querySelector('.skill-decrease');
        const incBtn = row.querySelector('.skill-increase');
        const expertiseInput = row.querySelector('.skill-expertise');

        // Set expertise value safely (avoids XSS in HTML attribute)
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
    const newVal = skill.pts + delta;

    if (newVal < 0 || newVal > effectiveCap) return;
    if (delta > 0 && getRemainingPoints(skillGroups, availablePoints.total) <= 0) return;

    skill.pts = newVal;

    // Update per-source allocation tracking
    if (delta > 0) {
      // Try to attribute to active source first, then base
      if (activeSource && availablePoints[activeSource] > 0) {
        const eligible = availablePoints.eligibleSkills?.[activeSource] || [];
        if (eligible.includes(skill.name)) {
          sourceAllocations[activeSource][skill.name] = (sourceAllocations[activeSource][skill.name] || 0) + 1;
        } else {
          sourceAllocations.base[skill.name] = (sourceAllocations.base[skill.name] || 0) + 1;
        }
      } else {
        sourceAllocations.base[skill.name] = (sourceAllocations.base[skill.name] || 0) + 1;
      }
    } else if (delta < 0) {
      // Remove from allocations (reverse order: breakthrough → class → race → base)
      const sources = ['breakthrough', 'class', 'race', 'base'];
      for (const src of sources) {
        if (sourceAllocations[src][skill.name] > 0) {
          sourceAllocations[src][skill.name]--;
          break;
        }
      }
    }

    renderSkills();
    updatePointsRemaining();

    // Animate the points display after render (element exists now)
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

  function updatePointsRemaining() {
    const remaining = getRemainingPoints(skillGroups, availablePoints.total);
    const el = document.getElementById('skill-points-remaining');
    if (el) {
      el.textContent = remaining;
      el.style.color = remaining === 0 ? 'var(--accent-green)' : 'var(--accent-gold)';
    }
  }

  function getSkills() {
    return structuredClone(skillGroups);
  }

  /**
   * Get per-source allocation data for export/debugging
   */
  function getSourceAllocations() {
    return structuredClone(sourceAllocations);
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
    activeSource = null; // Reset active source
    resetSourceAllocations();
    renderSkills();
    updatePointsRemaining();
    renderPointsBreakdown();

    // Hide eligible skills panel
    const eligiblePanel = document.getElementById('eligible-skills-panel');
    if (eligiblePanel) {
      eligiblePanel.style.display = 'none';
    }
  }

  return { init, getSkills, reset, setCharacterData, toggleSource, getSourceAllocations };
})();
