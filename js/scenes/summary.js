/**
 * Lyrian Chronicles - Character Summary Scene
 * Shows final character overview and export functionality
 */

/* exported SummaryScene */
const SummaryScene = (function() {
  function render(characterData) {
    const container = document.getElementById('summary-content');
    if (!container || !characterData) return;

    const { name, background, race, ancestry, cls, stats, skills } = characterData;
    const derived = stats ? calculateDerivedStats(stats) : {};

    let html = '';

    // Character Identity
    html += `<div class="summary-section">
      <h3>Character Identity</h3>
      <div class="summary-row">
        <span class="summary-label">Name</span>
        <span class="summary-value">${window.escapeHtml(name || 'Unnamed')}</span>
      </div>`;

    if (background) {
      html += `<div class="summary-row" style="flex-direction: column; gap: 0.25rem;">
        <span class="summary-label">Background</span>
        <span class="summary-value" style="font-weight: normal; font-style: italic;">${window.escapeHtml(background)}</span>
      </div>`;
    }

    // Identity extras
    if (characterData.gender) {
      html += `<div class="summary-row"><span class="summary-label">Gender</span><span class="summary-value">${window.escapeHtml(characterData.gender)}</span></div>`;
    }
    if (characterData.age) {
      html += `<div class="summary-row"><span class="summary-label">Age</span><span class="summary-value">${window.escapeHtml(characterData.age)}</span></div>`;
    }
    if (characterData.height) {
      html += `<div class="summary-row"><span class="summary-label">Height</span><span class="summary-value">${window.escapeHtml(characterData.height)}</span></div>`;
    }
    if (characterData.weight) {
      html += `<div class="summary-row"><span class="summary-label">Weight</span><span class="summary-value">${window.escapeHtml(characterData.weight)}</span></div>`;
    }
    if (characterData.worships) {
      html += `<div class="summary-row"><span class="summary-label">Worships</span><span class="summary-value">${window.escapeHtml(characterData.worships)}</span></div>`;
    }
    {
      const baseClim = characterData.clim ?? 3000;
      const RICH_PARENTS_ID = '69ea4f7a6be32fced492fb97';
      const hasRichParents = characterData.breakthroughs?.some(b => b?.id === RICH_PARENTS_ID);
      const richBonus = hasRichParents ? 3000 : 0;
      const totalClim = baseClim + richBonus;
      html += `<div class="summary-row"><span class="summary-label">Starting Clim</span><span class="summary-value">${baseClim}${hasRichParents ? ' <span style="font-size:0.75rem; color: var(--accent-gold-light);">(+3000 Rich Parents)</span>' : ''}</span></div>`;
      if (hasRichParents) {
        html += `<div class="summary-row"><span class="summary-label">Total Clim Available</span><span class="summary-value" style="color: var(--accent-gold-light);">${totalClim}</span></div>`;
      }
    }
    html += `<div class="summary-row"><span class="summary-label">Starting EXP</span><span class="summary-value">${characterData.exp ?? 1000}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Starting IP</span><span class="summary-value">${characterData.ip ?? 3}</span></div>`;

    html += `</div>`;

    // Race & Class
    const isDemon = race && race.name === 'Demon';
    const ancestryLabel = isDemon ? 'House' : 'Ancestry';
    html += `<div class="summary-section">
      <h3>Race & Class</h3>
      <div class="summary-row">
        <span class="summary-label">Race</span>
        <span class="summary-value">${window.escapeHtml(race ? race.name : 'None')}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">${ancestryLabel}</span>
        <span class="summary-value">${window.escapeHtml(ancestry ? ancestry.name : 'None')}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Class</span>
        <span class="summary-value">${cls && cls.all && cls.all.length > 0 ? cls.all.map(c => `${window.escapeHtml(c.class.name)} (T${c.class.tier}, ${window.escapeHtml(c.class.role)})`).join(', ') : (cls && cls.primary ? `${window.escapeHtml(cls.primary.class.name)} (Tier ${cls.primary.class.tier}, ${window.escapeHtml(cls.primary.class.role)})` : 'None')}</span>
      </div>
    </div>`;

    // Main Stats
    const raceBonuses = characterData.raceBonuses || {};
    const btBonuses = characterData.breakthroughStatBonuses || {};
    const baseStats = characterData.baseStats || {};
    // ponytail: compute class stat bonuses from choices for display
    const classBonuses = {};
    if (characterData.classStatBonusChoices) {
      Object.values(characterData.classStatBonusChoices).forEach(k => { if (k) classBonuses[k] = (classBonuses[k] || 0) + 1; });
    }

    html += `<div class="summary-section">
      <h3>Ability Scores</h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">`;

    MAIN_STATS.forEach(def => {
      const base = baseStats[def.id] ?? '-';
      const rBonus = raceBonuses[def.id] || 0;
      const bBonus = btBonuses[def.id] || 0;
      const cBonus = classBonuses[def.id] || 0;
      const total = stats[def.id] ?? '-';
      let bonusDetail = '';
      if (rBonus > 0) bonusDetail += `<span style="color: var(--accent-gold);">+${rBonus} Race</span> `;
      if (bBonus > 0) bonusDetail += `<span style="color: var(--meter-mana);">+${bBonus} BT</span> `;
      if (cBonus > 0) bonusDetail += `<span style="color: var(--accent-green);">+${cBonus} Class</span>`;

      html += `<div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${def.short || def.name}</div>
        <div style="font-size: 1.5rem; color: var(--accent-gold-light); font-weight: bold;">${total}</div>
        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">Base ${base}${bonusDetail ? ' · ' + bonusDetail : ''}</div>
      </div>`;
    });

    html += `</div>`;

    // Sub Stats
    html += `<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-top: 0.5rem;">`;

    SUB_STATS.forEach(def => {
      const base = baseStats[def.id] ?? '-';
      const rBonus = raceBonuses[def.id] || 0;
      const bBonus = btBonuses[def.id] || 0;
      const cBonus = classBonuses[def.id] || 0;
      const total = stats[def.id] ?? '-';
      let bonusDetail = '';
      if (rBonus > 0) bonusDetail += `<span style="color: var(--accent-gold);">+${rBonus} Race</span> `;
      if (bBonus > 0) bonusDetail += `<span style="color: var(--meter-mana);">+${bBonus} BT</span> `;
      if (cBonus > 0) bonusDetail += `<span style="color: var(--accent-green);">+${cBonus} Class</span>`;

      html += `<div style="text-align: center; padding: 0.4rem; background: var(--bg-primary); border-radius: 4px;">
        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${def.name}</div>
        <div style="font-size: 1.2rem; color: var(--accent-gold); font-weight: bold;">${total}</div>
        <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 2px;">Base ${base}${bonusDetail ? ' · ' + bonusDetail : ''}</div>
      </div>`;
    });

    html += `</div></div>`;

    // Derived Stats
    const speed = characterData.speed ?? 20;
    html += `<div class="summary-section">
      <h3>Derived Stats</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--meter-hp); text-transform: uppercase;">HP</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.hp ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--meter-mana); text-transform: uppercase;">Mana</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.mana ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--meter-rp); text-transform: uppercase;">RP</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.rp ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Evasion</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.evasion ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Potency</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.potency ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Initiative</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${derived.initiative ?? '-'}</div>
        </div>
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--accent-gold); text-transform: uppercase;">Speed</div>
          <div style="font-size: 1.3rem; font-weight: bold;">${speed}ft</div>
        </div>
      </div>
    </div>`;

    // Breakthroughs
    if (characterData.breakthroughs && characterData.breakthroughs.length > 0) {
      html += `<div class="summary-section">
        <h3>Breakthroughs</h3>`;
      characterData.breakthroughs.forEach(bt => {
        html += `<div style="padding-left: 1rem; font-size: 0.85rem; color: var(--text-primary);">
          ${window.escapeHtml(bt.name)} <span style="color: var(--text-muted);">(${bt.cost || 0} EXP)</span>
        </div>`;
      });
      html += `</div>`;
    }

    // Breakthrough Effects (computed from mechanics)
    {
      const effects = computeBreakthroughEffects(characterData.breakthroughs || []);
      const effectLabels = [];

      if (effects.mysticEyesLimit > 2) {
        effectLabels.push({ label: 'Mystic Eyes Limit', value: effects.mysticEyesLimit, color: 'var(--accent-gold-light)' });
      }
      if (effects.size) {
        effectLabels.push({ label: 'Size', value: effects.size, color: 'var(--accent-gold-light)' });
      }
      if (effects.burdenBonus > 0) {
        effectLabels.push({ label: 'Burden Bonus', value: `+${effects.burdenBonus}`, color: 'var(--meter-hp)' });
      }
      if (effects.combatBurdenBonus > 0) {
        effectLabels.push({ label: 'Combat Burden Bonus', value: `+${effects.combatBurdenBonus}`, color: 'var(--meter-hp)' });
      }
      if (effects.movementSpeedBonus > 0) {
        effectLabels.push({ label: 'Movement Speed', value: `+${effects.movementSpeedBonus}ft`, color: 'var(--accent-gold)' });
      }
      if (effects.darkvision > 0) {
        effectLabels.push({ label: 'Darkvision', value: `${effects.darkvision}ft`, color: 'var(--text-muted)' });
      }
      if (effects.flight) {
        effectLabels.push({ label: 'Flight', value: '✓', color: 'var(--accent-gold-light)' });
      }
      if (effects.sunlightWeakness) {
        effectLabels.push({ label: 'Sunlight Weakness', value: '✓', color: 'var(--accent-red)' });
      }
      if (effects.noManaRegen) {
        effectLabels.push({ label: 'No Mana Regen', value: '✓', color: 'var(--accent-red)' });
      }
      if (effects.noWounds) {
        const exceptionText = effects.woundExceptions.length > 0 ? ` (except: ${effects.woundExceptions.join(', ')})` : '';
        effectLabels.push({ label: 'No Wounds', value: `✓${exceptionText}`, color: 'var(--accent-red)' });
      }
      if (effects.mounted) {
        effectLabels.push({ label: 'Mounted', value: '✓', color: 'var(--accent-gold-light)' });
      }
      if (effects.swimmingPenalty < 0) {
        effectLabels.push({ label: 'Swimming DC Penalty', value: `${effects.swimmingPenalty}`, color: 'var(--accent-red)' });
      }
      if (effects.climbingSpeed) {
        effectLabels.push({ label: 'Climbing Speed', value: `${effects.climbingSpeed}ft`, color: 'var(--accent-gold)' });
      }
      if (effects.losesAbility) {
        effectLabels.push({ label: 'Loses Ability', value: effects.losesAbility, color: 'var(--accent-red)' });
      }
      if (effects.raceChange) {
        effectLabels.push({ label: 'Race Changed To', value: effects.raceChange, color: 'var(--accent-red)' });
      }

      if (effectLabels.length > 0) {
        html += `<div class="summary-section">
          <h3>Active Breakthrough Effects</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">`;
        effectLabels.forEach(e => {
          html += `<span style="display: inline-block; padding: 0.25rem 0.6rem; background: var(--bg-tertiary); border-radius: 4px; font-size: 0.8rem; border-left: 3px solid ${e.color};">
            <strong style="color: ${e.color};">${window.escapeHtml(e.label)}:</strong> <span style="color: var(--text-primary);">${window.escapeHtml(String(e.value))}</span>
          </span>`;
        });
        html += `</div></div>`;
      }
    }

    // Race & Ancestry Traits + Proficiencies
    {
      const descDb = typeof TRAIT_DESCRIPTIONS !== 'object' ? {} : TRAIT_DESCRIPTIONS;
      // Race traits
      if (race?.attributes) {
        html += `<div class="summary-section"><h3>Race Traits</h3>`;
        html += `<div style="padding-left:1rem;font-size:0.85rem;color:var(--text-primary);">${window.escapeHtml(race.attributes)}</div>`;
        html += `</div>`;
      }
      // Ancestry traits
      if (ancestry?.attributes) {
        const traits = typeof ancestry.attributes === 'string' ? ancestry.attributes.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (traits.length) {
          html += `<div class="summary-section"><h3>Ancestry Traits</h3>`;
          traits.forEach(trait => {
            const desc = descDb[trait] || '';
            html += `<div style="padding-left:1rem;font-size:0.85rem;color:var(--text-primary);margin-bottom:0.25rem;"><strong>${window.escapeHtml(trait)}</strong>${desc ? `<br><span style="font-size:0.75rem;color:var(--text-muted);">${window.escapeHtml(desc)}</span>` : ''}</div>`;
          });
          html += `</div>`;
        }
      }
      // Race + Ancestry proficiencies
      const allRaceProfs = new Set();
      (race?.proficiencies || []).forEach(p => allRaceProfs.add(p));
      (ancestry?.proficiencies || []).forEach(p => allRaceProfs.add(p));
      if (allRaceProfs.size) {
        html += `<div class="summary-section"><h3>Race Proficiencies</h3><div style="display:flex;flex-wrap:wrap;gap:0.5rem;">`;
        allRaceProfs.forEach(p => {
          html += `<span style="display:inline-block;padding:0.25rem 0.6rem;background:var(--bg-tertiary);border-radius:4px;font-size:0.8rem;border-left:3px solid var(--accent-gold);">${window.escapeHtml(p)}</span>`;
        });
        html += `</div></div>`;
      }
      // ponytail: race skill points from RACE_SKILL_DATA in skills.js
      const raceSkillData = typeof RACE_SKILL_DATA === 'object' ? RACE_SKILL_DATA[race?.name] : null;
      if (raceSkillData) {
        const skills = raceSkillData.allowedSkills === 'any-except-crafting-gathering'
          ? 'any non-crafting/gathering skill'
          : (Array.isArray(raceSkillData.allowedSkills) ? raceSkillData.allowedSkills.join(', ') : raceSkillData.allowedSkills);
        html += `<div class="summary-section"><h3>Race Skill Points</h3>`;
        html += `<div style="padding-left:1rem;font-size:0.85rem;color:var(--text-primary);">+${raceSkillData.skillPoints} points in: ${window.escapeHtml(skills)}</div>`;
        html += `</div>`;
      }
    }

    // Breakthrough Proficiencies
    if (characterData.breakthroughProficiencies && characterData.breakthroughProficiencies.length > 0) {
      html += `<div class="summary-section">
        <h3>Breakthrough Proficiencies</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">`;
      characterData.breakthroughProficiencies.forEach(prof => {
        html += `<span style="display: inline-block; padding: 0.25rem 0.5rem; background: var(--bg-tertiary); border-radius: 4px; font-size: 0.85rem; color: var(--accent-gold-light);">${window.escapeHtml(prof)}</span>`;
      });
      html += `</div></div>`;
    }

    // Skills
    html += `<div class="summary-section"><h3>Skills</h3>`;

    if (skills && Array.isArray(skills)) {
      // Collect all breakthrough bonuses for display
      const allBtBonuses = getBreakthroughSkillBonuses(characterData.breakthroughs || []);
      const btSkillMap = {};
      allBtBonuses.forEach(b => {
        if (!btSkillMap[b.skill]) btSkillMap[b.skill] = [];
        btSkillMap[b.skill].push(b);
      });

      skills.forEach(group => {
        // Show group if it has invested skills OR breakthrough bonuses
        const groupSkills = group.skills;
        const hasInvested = groupSkills.some(s => s.pts > 0);
        const hasBtBonus = groupSkills.some(s => btSkillMap[s.name]);
        if (!hasInvested && !hasBtBonus) return;

        html += `<div style="margin-bottom: 0.5rem;">
          <div style="color: var(--accent-gold); font-size: 0.9rem; margin-bottom: 0.25rem;">${group.name} (${group.subStat})</div>`;

        groupSkills.forEach(skill => {
          if (skill.pts <= 0 && !btSkillMap[skill.name]) return; // skip empty skills with no bonus

          const expertise = skill.expertise ? ` [${window.escapeHtml(skill.expertise)}]` : '';
          const bonuses = btSkillMap[skill.name] || [];
          const btText = bonuses.length > 0
            ? ` <span style="color: var(--accent-gold-light); opacity: 0.7; font-size: 0.8rem;">(${bonuses.map(b => `${b.bonus > 0 ? '+' : ''}${b.bonus} ${b.breakthroughName}${b.condition ? ' (' + b.condition + ')' : ''}`).join(', ')})</span>`
            : '';
          html += `<div style="padding-left: 1rem; font-size: 0.85rem; color: var(--text-primary);">
            ${window.escapeHtml(skill.name)}: <strong style="color: var(--accent-gold-light);">${skill.pts}</strong>${expertise}${btText}
          </div>`;
        });

        html += `</div>`;
      });
    }

    // Equipment & Inventory
    if (characterData.inventory && characterData.inventory.length > 0) {
      html += `<div class="summary-section">
        <h3>Equipped Items &amp; Inventory</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.25rem;">
          <span>Item Details</span>
          <span>Qty · Burden · Cost</span>
        </div>`;
      
      // Burden: any item with burdenCost > 0 counts toward the limit
      const itemCountsAsBurden = (item) => (item.burdenCost || 0) > 0;

      let totalBurden = 0;
      let totalCost = 0;
      
      characterData.inventory.forEach(entry => {
        const itemWeight = itemCountsAsBurden(entry.item) ? (entry.item.burdenCost || 0) * entry.quantity : 0;
        const itemCost = (entry.item.climCost || 0) * entry.quantity;
        totalBurden += itemWeight;
        totalCost += itemCost;
        
        html += `<div class="summary-row" style="padding-left: 0.5rem; font-size: 0.85rem; margin-bottom: 0.25rem;">
          <span class="summary-value" style="font-weight: bold; color: var(--text-primary);">${window.escapeHtml(entry.item.name)} <span style="font-weight: normal; font-size: 0.75rem; color: var(--text-muted);">(${window.escapeHtml(entry.item.type)} · ${window.escapeHtml(entry.item.subType)})</span></span>
          <span class="summary-value" style="color: var(--accent-gold-light);">${entry.quantity} &times; <span style="font-size: 0.8rem; color: var(--text-muted);">(${entry.item.burdenCost} Burden, ${entry.item.climCost} Clim)</span></span>
        </div>`;
      });
      
      // Burden: official flat limit of 10, over = Rooted
      const BURDEN_LIMIT = 10;
      const burdenOver = totalBurden > BURDEN_LIMIT;

      html += `<div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--bg-tertiary); font-size: 0.85rem; color: var(--text-muted);">
        <span>Total Clim Spent: <strong style="color: var(--accent-gold-light);">${totalCost} Clim</strong></span>
        <span>Total Burden: <strong style="color: ${burdenOver ? 'var(--accent-red)' : 'var(--accent-gold-light)'};">${totalBurden} / ${BURDEN_LIMIT}</strong></span>
      </div>`;
      
      html += `</div>`;
    }

    html += `</div>`;

    container.innerHTML = html;

    // Animate in
    if (window.gsap) {
      gsap.fromTo(container, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 });
    }
  }

  function exportJSON(characterData) {
    // ponytail: mirror Excel export — gather abilities, proficiencies, crafting skills
    const classes = characterData.cls?.all || [];

    // Proficiencies (aggregated from all sources, same as Excel)
    const allProfs = new Set();
    if (characterData.race) {
      (characterData.race.proficiencies || []).forEach(p => allProfs.add(p));
      (characterData.ancestry?.proficiencies || []).forEach(p => allProfs.add(p));
    }
    classes.forEach(clsEntry => {
      const className = clsEntry.class?.name;
      if (className && typeof CLASS_ABILITIES_DATA === 'object') {
        const classAbilities = CLASS_ABILITIES_DATA[className];
        if (classAbilities?.L1?.proficiencies) {
          classAbilities.L1.proficiencies.forEach(p => allProfs.add(p));
        }
      }
    });
    (characterData.breakthroughs || []).forEach(bt => {
      (bt.proficiencies || []).forEach(p => allProfs.add(p));
    });

    // Abilities (full detail, same as Excel)
    const allAbilities = [];
    const writtenAbilities = new Set();

    // Ancestry traits (from ancestry attributes string)
    if (characterData.ancestry && characterData.ancestry.attributes) {
      const descDb = typeof TRAIT_DESCRIPTIONS !== 'undefined' ? TRAIT_DESCRIPTIONS : {};
      const traits = typeof characterData.ancestry.attributes === 'string'
        ? characterData.ancestry.attributes.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      traits.forEach(trait => {
        if (writtenAbilities.has(trait)) return;
        writtenAbilities.add(trait);
        allAbilities.push({
          name: trait,
          level: 0,
          class: 'Ancestry',
          cost: '',
          keywords: [],
          range: '',
          requirement: '',
          type: 'passive',
          description: descDb[trait] || '',
          keyBenefits: [],
          proficiencies: []
        });
      });
    }

    classes.forEach(clsEntry => {
      const classObj = clsEntry.class || {};
      const className = classObj.name;
      const level = clsEntry.level || 1;
      const classAbilities = typeof CLASS_ABILITIES_DATA === 'object' ? CLASS_ABILITIES_DATA[className] : null;
      if (!classAbilities) return;
      for (let lvl = 1; lvl <= Math.min(level, 8); lvl++) {
        const abilityKey = `L${lvl}`;
        const classAbility = classAbilities[abilityKey];
        if (!classAbility) continue;
        const abilityName = classAbility.name;
        if (writtenAbilities.has(abilityName)) continue;
        writtenAbilities.add(abilityName);
        // Enrich from ABILITIES_DB
        const fullAbility = typeof ABILITIES_DB === 'object' ? (ABILITIES_DB[abilityName] || null) : null;
        const costs = [];
        if (fullAbility) {
          if (fullAbility.manaCost) costs.push(`Mana: ${fullAbility.manaCost}`);
          if (fullAbility.apCost) costs.push(`AP: ${fullAbility.apCost}`);
          if (fullAbility.rpCost) costs.push(`RP: ${fullAbility.rpCost}`);
        }
        allAbilities.push({
          name: abilityName,
          level: lvl,
          class: className,
          cost: costs.join(' | ') || '',
          keywords: fullAbility ? (fullAbility.keywords || []) : [],
          range: fullAbility?.range || '',
          requirement: fullAbility?.requirement || '',
          type: fullAbility?.type || 'unknown',
          description: fullAbility?.description || classAbility.description || '',
          keyBenefits: classAbility.keyBenefits || [],
          proficiencies: classAbility.proficiencies || []
        });
      }
    });

    // Crafting skills (same map as Excel)
    const classToCraftingSkill = {
      'Blacksmith': 'Blacksmith', 'Alchemist': 'Alchemist', 'Alchemeister': 'Alchemist',
      'Armorsmith': 'Armorsmith', 'Master Armorer': 'Armorsmith', 'Artificer': 'Artificer',
      'Carpenter': 'Carpenter', 'Culinarian': 'Culinarian', 'Forgemaster': 'Blacksmith',
      'Agrarian': 'Farmer', 'Farmer': 'Farmer', 'Timberwright': 'Carpenter', 'Transmuter': 'Transmuter'
    };
    const craftingSkills = new Set();
    classes.forEach(clsEntry => {
      const classObj = clsEntry.class || {};
      if (clsEntry.level >= 1 && classToCraftingSkill[classObj.name]) {
        craftingSkills.add(classToCraftingSkill[classObj.name]);
      }
    });

    const exportData = {
      system: 'lyrian-chronicles',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      character: {
        name: characterData.name,
        background: characterData.background,
        gender: characterData.gender,
        age: characterData.age,
        height: characterData.height,
        weight: characterData.weight,
        worships: characterData.worships,
        clim: characterData.clim,
        exp: characterData.exp,
        ip: characterData.ip,
        race: characterData.race ? {
          id: characterData.race.id,
          name: characterData.race.name,
          proficiencies: characterData.race.proficiencies || []
        } : null,
        ancestry: characterData.ancestry ? {
          ancestryId: characterData.ancestry.ancestryId,
          name: characterData.ancestry.name,
          proficiencies: characterData.ancestry.proficiencies || []
        } : null,
        class: characterData.cls ? {
          all: characterData.cls.all ? characterData.cls.all.map(c => ({
            id: c.class?.id,
            name: c.class?.name,
            tier: c.class?.tier,
            role: c.class?.role,
            level: c.level,
            abilitiesBought: c.abilitiesBought != null ? c.abilitiesBought : c.level - 1
          })) : []
        } : null,
        stats: characterData.stats,
        derivedStats: calculateDerivedStats(characterData.stats),
        baseStats: characterData.baseStats,
        raceBonuses: characterData.raceBonuses,
        humanChoices: characterData.humanChoices,
        spiritCore: characterData.spiritCore,
        skills: characterData.skills,
        breakthroughs: characterData.breakthroughs || [],
        breakthroughStatBonuses: characterData.breakthroughStatBonuses || {},
        breakthroughProficiencies: characterData.breakthroughProficiencies || [],
        statBonusChoices: characterData.statBonusChoices || {},
        inventory: characterData.inventory || [],
        climSpent: characterData.climSpent || 0,
        remainingClim: characterData.remainingClim ?? characterData.clim,
        mirane: characterData.mirane,
        oldArmorCalc: characterData.oldArmorCalc,
        speed: characterData.speed ?? 20,
        // Aggregated data (same as Excel sheets)
        proficiencies: Array.from(allProfs),
        abilities: allAbilities,
        craftingSkills: Array.from(craftingSkills)
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (characterData.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_lyrian.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export character data to the Mirane Excel format (Blank Mirane CCS v10.3.1.xlsx).
   * Uses the embedded base64 template (avoids CORS issues with file:// protocol),
   * populates identity/stats/skills/classes/breakthroughs, and triggers a local download.
   * All formulas and styling in the template are preserved.
   */
  async function exportExcel(characterData) {
    try {
      // 1. Decode the embedded base64 template (avoids CORS on file://)
      const b64 = MIRANE_TEMPLATE_B64;
      if (!b64) throw new Error('Excel template not loaded. Check that excel-template.js is included.');
      const binaryString = atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // 2. Load into ExcelJS workbook
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // 3. Select sheets
      const coreSheet = workbook.getWorksheet('Core');
      const btSheet = workbook.getWorksheet('Breakthrough');
      const backstorySheet = workbook.getWorksheet('Backstory');

      if (!coreSheet) throw new Error('Core sheet not found in template.');

      // 4. Fill Identity
      if (coreSheet) {
        coreSheet.getCell('B2').value = characterData.name || 'Unnamed';
        coreSheet.getCell('D2').value = characterData.race ? characterData.race.name : 'None';
        coreSheet.getCell('D3').value = characterData.ancestry ? characterData.ancestry.name : 'None';
        // Identity extras (column B = values, column A = labels — don't overwrite A3 "Gender")
        coreSheet.getCell('B3').value = characterData.gender || '';
        coreSheet.getCell('B4').value = characterData.age || '';
        coreSheet.getCell('B5').value = characterData.height || '';
        coreSheet.getCell('B6').value = characterData.weight || '';
        coreSheet.getCell('B7').value = characterData.worships || '';
        // Spirit Core
        coreSheet.getCell('C5').value = characterData.spiritCore ?? 0;
        // ponytail: use higher of base vs breakthrough speed
        const btSpeed = (characterData.breakthroughs || []).reduce((m, b) => Math.max(m, b?.mechanics?.movementSpeedBonus || 0), 0);
        coreSheet.getCell('H6').value = Math.max(characterData.speed ?? 20, btSpeed);
        // ponytail: skip D7 — it's =SUM(Breakthrough!B2:B58), auto-computed from sheet 7
        // ponytail: skip A55 — it's =SUM('EXP & Transactions'!F2), auto-computed
        // Starting EXP — write to D4 as number (overrides formula; user-set value takes priority)
        coreSheet.getCell('D4').value = characterData.exp ?? 1000;
        // Mirane flag — A58 is the checkbox (TRUE/FALSE), A57 is the "Mirane?" label
        coreSheet.getCell('A58').value = characterData.mirane !== false;
        // Pure Human checkbox (B49) — affects EXP calc in 'EXP & Transactions'!C2
        // ponytail: pureHuman field not tracked in code; infer: Human race with no Hybrid breakthrough
        const HYBRID_IDS = new Set(['69ea4f7a6be32fced492fb56', '69ea4f7a6be32fced492fb57']); // Human-Chimera, Faerie-Chimera
        const hasHybrid = (characterData.breakthroughs || []).some(b => HYBRID_IDS.has(b?.id));
        coreSheet.getCell('B49').value = characterData.race?.name === 'Human' && !hasHybrid;
        // Slow Starter checkbox (B50) — adds 500 to EXP calc in 'EXP & Transactions'!C2
        const SLOW_STARTER_ID = '69ea4f7a6be32fced492fb88';
        const hasSlowStarter = (characterData.breakthroughs || []).some(b => b?.id === SLOW_STARTER_ID);
        coreSheet.getCell('B50').value = hasSlowStarter;
        // Old Armor Calc
        coreSheet.getCell('K30').value = characterData.oldArmorCalc;
      }

      // 4b. EXP & Transactions — override starting Clim with custom value from web app
      const expSheet = workbook.getWorksheet('EXP & Transactions');
      if (expSheet) {
        // F2 formula: =IF(Core!A58, 4000, 3000) + IF(COUNTIF(Breakthrough!A:A,"Rich Parents")>0, 3000, 0)
        // Web app may have custom Clim; replace formula with computed value
        const baseClim = characterData.clim ?? 3000;
        const RICH_PARENTS_ID = '69ea4f7a6be32fced492fb97';
        const hasRichParents = (characterData.breakthroughs || []).some(b => b?.id === RICH_PARENTS_ID);
        const richBonus = hasRichParents ? 3000 : 0;
        expSheet.getCell('F2').value = baseClim + richBonus;
        // F4: Character Creation Purchases (Clim spent on gear)
        expSheet.getCell('F4').value = -(characterData.climSpent || 0);
      }

      // 5. Fill Base Stats & Race Bonuses (Character Creation Arrays)
      const base = characterData.baseStats || {};
      const bonuses = characterData.raceBonuses || {};

      // Main Stats (rows 45-48)
      if (coreSheet) {
        // Focus
        coreSheet.getCell('A45').value = base.foc ?? 1;
        coreSheet.getCell('B45').value = 'Focus';
        coreSheet.getCell('F45').value = bonuses.foc ?? 0;
        // Power
        coreSheet.getCell('A46').value = base.pow ?? 1;
        coreSheet.getCell('B46').value = 'Power';
        coreSheet.getCell('F46').value = bonuses.pow ?? 0;
        // Agility
        coreSheet.getCell('A47').value = base.agi ?? 1;
        coreSheet.getCell('B47').value = 'Agility';
        coreSheet.getCell('F47').value = bonuses.agi ?? 0;
        // Toughness
        coreSheet.getCell('A48').value = base.tou ?? 1;
        coreSheet.getCell('B48').value = 'Toughness';
        coreSheet.getCell('F48').value = bonuses.tou ?? 0;
      }

      // Sub Stats (rows 45-49)
      if (coreSheet) {
        // Fitness
        coreSheet.getCell('C45').value = base.fitness ?? 1;
        coreSheet.getCell('D45').value = 'Fitness';
        coreSheet.getCell('H45').value = bonuses.fitness ?? 0;
        // Cunning
        coreSheet.getCell('C46').value = base.cunning ?? 1;
        coreSheet.getCell('D46').value = 'Cunning';
        coreSheet.getCell('H46').value = bonuses.cunning ?? 0;
        // Reason
        coreSheet.getCell('C47').value = base.reason ?? 1;
        coreSheet.getCell('D47').value = 'Reason';
        coreSheet.getCell('H47').value = bonuses.reason ?? 0;
        // Awareness
        coreSheet.getCell('C48').value = base.awareness ?? 1;
        coreSheet.getCell('D48').value = 'Awareness';
        coreSheet.getCell('H48').value = bonuses.awareness ?? 0;
        // Presence
        coreSheet.getCell('C49').value = base.presence ?? 1;
        coreSheet.getCell('D49').value = 'Presence';
        coreSheet.getCell('H49').value = bonuses.presence ?? 0;
      }

      // 5b. Starter Skill Points tracking
      if (coreSheet) {
        // B51: Starter Skill Points Spent — sum all skill pts from character
        let totalSkillPts = 0;
        if (characterData.skills && Array.isArray(characterData.skills)) {
          characterData.skills.forEach(g => {
            if (g.skills) g.skills.forEach(s => { totalSkillPts += s.pts || 0; });
          });
        }
        coreSheet.getCell('B51').value = totalSkillPts;
      }

      // 5c. Stat adjustments (rows 32-35) — derived from racial/breakthrough bonuses
      // These feed the derived stat formulas. Web app doesn't track these granularly,
      // so we compute them from the difference between final stats and base+racial.
      if (coreSheet) {
        const finalStats = characterData.stats || {};
        const btBonuses = characterData.breakthroughStatBonuses || {};

        // Evasion bonus (E33) — Agility-based evasion from racial/breakthrough sources
        const agiBase = base.agi ?? 0;
        const agiRace = bonuses.agi ?? 0;
        const agiBt = btBonuses.agi ?? 0;
        const agiFinal = finalStats.agi ?? 0;
        // Evasion = 7 + Agility + E33 + equipment. The "E33" captures non-standard evasion mods.
        // ponytail: web app doesn't track evasion-specific mods separately; leave E33 as 0
        coreSheet.getCell('E33').value = 0;

        // Dodge bonus (H33) — same logic
        coreSheet.getCell('H33').value = 0;

        // Mana adjustment (K34) — mana = 6 + Power + K34
        const powBt = btBonuses.pow ?? 0;
        const manaAdj = powBt; // ponytail: mana mods from breakthroughs that don't go through Power
        coreSheet.getCell('K34').value = manaAdj;

        // Toughness adjustments (M34 positive, N34 negative)
        coreSheet.getCell('M34').value = 0;
        coreSheet.getCell('N34').value = 0;

        // Agility adjustments (O34 positive, P34 negative)
        coreSheet.getCell('O34').value = 0;
        coreSheet.getCell('P34').value = 0;

        // RP adjustment (E35) — negative RP from penalties
        coreSheet.getCell('E35').value = 0;

        // Save bonus (G34)
        coreSheet.getCell('G34').value = 0;

        // Initiative adjustment (H35)
        coreSheet.getCell('H35').value = 0;
      }

      // 5d. Equipment slot checkboxes (M38-P42) — inferred from inventory item types
      if (coreSheet && characterData.inventory && characterData.inventory.length > 0) {
        const slotMap = {
          'Main Hand': 'N38', 'Off Hand': 'N41', 'Head': 'N39',
          'Muscle': 'N40', 'Spirit Circuit': 'N41', 'Leg': 'N42',
          'Armor': 'N40', // ponytail: Armor → Muscle slot checkbox
          'Wound': 'O39', 'Eye': 'O40', 'Laceration': 'O41', 'Foot': 'O42'
        };
        // ponytail: web app inventory items have type/subType; map common equipment slots
        characterData.inventory.forEach(entry => {
          const item = entry.item || {};
          const slot = item.slot || item.subType;
          if (slot && slotMap[slot]) {
            coreSheet.getCell(slotMap[slot]).value = true;
          }
        });
      }

      // 5e. Weapon section (A37-A42) — write weapon names from inventory
      if (coreSheet && characterData.inventory && characterData.inventory.length > 0) {
        const WEAPON_SUBTYPES = new Set(['Weapon', 'Specialized Weapon', 'Artisan Weapon']);
        let weaponRow = 37;
        characterData.inventory.forEach(entry => {
          const item = entry.item || {};
          if (WEAPON_SUBTYPES.has(item.subType) && weaponRow <= 42) {
            coreSheet.getCell(`A${weaponRow}`).value = item.name || '';
            weaponRow++;
          }
        });
      }

      // 5e. Injuries (M38-P42) — character creator doesn't track injuries; leave unchecked

      // 6. Fill Equipped Classes (with Tier and EXP)
      if (characterData.cls && coreSheet) {
        const classes = characterData.cls.all || [];
        classes.forEach((clsEntry, i) => {
          const row = 15 + i;
          if (row <= 35) {
            const classObj = clsEntry.class || {};
            coreSheet.getCell(`A${row}`).value = classObj.name || 'Unknown';
            coreSheet.getCell(`B${row}`).value = classObj.tier ? `Tier ${classObj.tier}` : '';
            coreSheet.getCell(`C${row}`).value = clsEntry.level || 1;
            // Calculate class EXP cost: tier*100 + (level-1)*100
            const tier = parseInt(classObj.tier) || 1;
            const expCost = tier * 100 + Math.max(0, (clsEntry.level || 1) - 1) * 100;
            coreSheet.getCell(`D${row}`).value = expCost;
          }
        });
      }

      // 6b. Fill Proficiencies (K9-K12) — gather from ALL sources using arrays
      if (coreSheet) {
        const allProfs = new Set();

        // --- Race & Ancestry proficiencies ---
        if (characterData.race) {
          const race = characterData.race;
          const ancestry = characterData.ancestry;
          if (Array.isArray(race.proficiencies)) {
            race.proficiencies.forEach(p => allProfs.add(p));
          }
          if (ancestry && Array.isArray(ancestry.proficiencies)) {
            ancestry.proficiencies.forEach(p => allProfs.add(p));
          }
        }

        // --- Class key-ability (L1) proficiencies ---
        if (characterData.cls) {
          const classes = characterData.cls.all || [];
          classes.forEach(clsEntry => {
            const classObj = clsEntry.class || {};
            const className = classObj.name;
            if (className && typeof CLASS_ABILITIES_DATA === 'object') {
              const classAbilities = CLASS_ABILITIES_DATA[className];
              if (classAbilities && classAbilities.L1 && Array.isArray(classAbilities.L1.proficiencies)) {
                classAbilities.L1.proficiencies.forEach(p => allProfs.add(p));
              }
            }
          });
        }

        // --- Breakthrough proficiencies ---
        if (characterData.breakthroughs && characterData.breakthroughs.length > 0) {
          characterData.breakthroughs.forEach(bt => {
            if (Array.isArray(bt.proficiencies)) {
              bt.proficiencies.forEach(p => allProfs.add(p));
            }
          });
        }

        // Write proficiencies to Excel starting at K9
        let profRow = 9;
        Array.from(allProfs).forEach(p => {
          coreSheet.getCell(`K${profRow}`).value = p;
          profRow++;
        });
      }

      // 7. Fill Breakthroughs
      if (characterData.breakthroughs && btSheet) {
        characterData.breakthroughs.forEach((bt, i) => {
          const row = 2 + i;
          if (row <= 37) {
            btSheet.getCell(`A${row}`).value = bt.name;
            btSheet.getCell(`B${row}`).value = bt.cost || 0;
            btSheet.getCell(`C${row}`).value = bt.prerequisites || '';
            btSheet.getCell(`D${row}`).value = bt.description || '';
          }
        });
      }

      // 8. Fill Skills & Expertise
      const SKILL_ROW_MAP = {
        'Athletics': 9, 'Riding': 10, 'Stealth': 11, 'Deception': 12, 'Roguecraft': 13,
        'Medicine': 14, 'Common Knowledge': 15, 'Linguistics': 16, 'Magic': 17, 'Religion': 18,
        'Appraise': 19, 'History': 20, 'Flight': 21, 'Artifice': 22, 'Perception': 23,
        'Insight': 24, 'Survival': 25, 'Animal Husbandry': 26, 'Art': 27, 'Negotiation': 28,
        'Intimidation': 29
      };

      if (characterData.skills && coreSheet) {
        characterData.skills.forEach(group => {
          if (group.skills) {
            group.skills.forEach(skill => {
              const row = SKILL_ROW_MAP[skill.name];
              if (row) {
                coreSheet.getCell(`H${row}`).value = skill.pts || 0;
                if (skill.expertise) {
                  coreSheet.getCell(`I${row}`).value = skill.expertise;
                }
              }
            });
          }
        });
      }

      // 8b. Fill Crafting Skills on Core sheet (M9-M30) + ALL Class Abilities on Abilities sheet
      if (coreSheet && typeof CLASS_ABILITIES_DATA === 'object' && characterData.cls) {
        const classes = characterData.cls.all || [];

        // Map class names to their crafting skill name for the Core sheet M column
        const classToCraftingSkill = {
          'Blacksmith': 'Blacksmith',
          'Alchemist': 'Alchemist',
          'Alchemeister': 'Alchemist',
          'Armorsmith': 'Armorsmith',
          'Master Armorer': 'Armorsmith',
          'Artificer': 'Artificer',
          'Carpenter': 'Carpenter',
          'Culinarian': 'Culinarian',
          'Forgemaster': 'Blacksmith',
          'Agrarian': 'Farmer',
          'Farmer': 'Farmer',
          'Timberwright': 'Carpenter',
          'Transmuter': 'Transmuter'
        };

        // Fill M9+ with crafting skill names (dynamic, one per row, deduplicated)
        const craftingSkillNames = new Set();
        classes.forEach(clsEntry => {
          const classObj = clsEntry.class || {};
          const level = clsEntry.level || 1;
          if (level >= 1 && classToCraftingSkill[classObj.name]) {
            craftingSkillNames.add(classToCraftingSkill[classObj.name]);
          }
        });

        const skillArr = Array.from(craftingSkillNames);
        let craftRow = 9;
        skillArr.forEach((skillName) => {
          coreSheet.getCell(`M${craftRow}`).value = skillName;
          craftRow++;
        });

        // Fill ALL Class Abilities on the Abilities sheet (dynamic positioning)
        const abilitiesSheet = workbook.getWorksheet('Abilities');
        if (abilitiesSheet) {
          // Collect all abilities first, then write them dynamically
          const activeAbilities = [];
          const passiveAbilities = [];
          const written = new Set();

          // Ancestry traits (from ancestry attributes string)
          if (characterData.ancestry && characterData.ancestry.attributes) {
            const descDb = typeof TRAIT_DESCRIPTIONS !== 'undefined' ? TRAIT_DESCRIPTIONS : {};
            const traits = typeof characterData.ancestry.attributes === 'string'
              ? characterData.ancestry.attributes.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            traits.forEach(trait => {
              if (written.has(trait)) return;
              written.add(trait);
              const abilityData = {
                name: trait,
                cost: '',
                keywords: '',
                range: '',
                requirement: '',
                description: descDb[trait] || '',
                benefits: ''
              };
              passiveAbilities.push(abilityData);
            });
          }

          classes.forEach(clsEntry => {
            const classObj = clsEntry.class || {};
            const className = classObj.name;
            const level = clsEntry.level || 1;
            const classAbilities = CLASS_ABILITIES_DATA[className];
            if (!classAbilities) return;

            for (let lvl = 1; lvl <= Math.min(level, 8); lvl++) {
              const abilityKey = `L${lvl}`;
              const classAbility = classAbilities[abilityKey];
              if (!classAbility) continue;

              const abilityName = classAbility.name;
              if (written.has(abilityName)) continue;
              written.add(abilityName);

              // Get full ability details from ABILITIES_DB
              let fullAbility = null;
              if (typeof ABILITIES_DB === 'object') {
                fullAbility = ABILITIES_DB[abilityName] || null;
              }

              // Determine active vs passive
              const abilityType = fullAbility ? fullAbility.type : 'unknown';
              const isActive = abilityType === 'false' || abilityType === 'both';
              const isPassive = abilityType === 'true' || abilityType === 'key' || abilityType === 'unknown';

              // Build ability data
              let cost = '';
              if (fullAbility) {
                const costs = [];
                if (fullAbility.manaCost) costs.push(`Mana: ${fullAbility.manaCost}`);
                if (fullAbility.apCost) costs.push(`AP: ${fullAbility.apCost}`);
                if (fullAbility.rpCost) costs.push(`RP: ${fullAbility.rpCost}`);
                cost = costs.join(' | ') || '';
              }

              const abilityData = {
                name: abilityName,
                cost: cost,
                keywords: fullAbility ? (fullAbility.keywords || []).join(', ') : '',
                range: fullAbility ? (fullAbility.range || '') : '',
                requirement: fullAbility ? (fullAbility.requirement || '') : '',
                description: fullAbility
                  ? (fullAbility.description || classAbility.description || '')
                  : (classAbility.description || ''),
                benefits: classAbility.keyBenefits ? classAbility.keyBenefits.join('; ') : ''
              };

              if (isActive) activeAbilities.push(abilityData);
              if (isPassive) passiveAbilities.push(abilityData);
            }
          });

          // Write Active header at row 1, then abilities starting at row 2
          const activeStartRow = 2;
          for (let i = 0; i < activeAbilities.length; i++) {
            const row = activeStartRow + i;
            const ab = activeAbilities[i];
            abilitiesSheet.getCell(`A${row}`).value = ab.name;
            abilitiesSheet.getCell(`B${row}`).value = ab.cost;
            abilitiesSheet.getCell(`C${row}`).value = ab.keywords;
            abilitiesSheet.getCell(`D${row}`).value = ab.range;
            abilitiesSheet.getCell(`E${row}`).value = ab.requirement;
            abilitiesSheet.getCell(`F${row}`).value = ab.description;
            abilitiesSheet.getCell(`G${row}`).value = ab.benefits;
          }

          // Write Passive header right after last active ability (or at row 2 if no actives)
          const passiveHeaderRow = activeStartRow + activeAbilities.length;
          const passiveStartRow = passiveHeaderRow + 1;

          // Write passive header
          abilitiesSheet.getCell(`A${passiveHeaderRow}`).value = 'Passive Ability Name';
          abilitiesSheet.getCell(`B${passiveHeaderRow}`).value = 'Cost';
          abilitiesSheet.getCell(`C${passiveHeaderRow}`).value = 'Keywords';
          abilitiesSheet.getCell(`D${passiveHeaderRow}`).value = 'Range';
          abilitiesSheet.getCell(`E${passiveHeaderRow}`).value = 'Requirement';
          abilitiesSheet.getCell(`F${passiveHeaderRow}`).value = 'Description';
          abilitiesSheet.getCell(`G${passiveHeaderRow}`).value = 'Benefits';

          // Write passive abilities
          for (let i = 0; i < passiveAbilities.length; i++) {
            const row = passiveStartRow + i;
            const ab = passiveAbilities[i];
            abilitiesSheet.getCell(`A${row}`).value = ab.name;
            abilitiesSheet.getCell(`B${row}`).value = ab.cost;
            abilitiesSheet.getCell(`C${row}`).value = ab.keywords;
            abilitiesSheet.getCell(`D${row}`).value = ab.range;
            abilitiesSheet.getCell(`E${row}`).value = ab.requirement;
            abilitiesSheet.getCell(`F${row}`).value = ab.description;
            abilitiesSheet.getCell(`G${row}`).value = ab.benefits;
          }
        }
      }

      // 9. Fill Expedition Inventory (rows 2-31, columns A-F)
      // Combat Loadout (columns G-H, rows 5-31) is intentionally left untouched
      const invSheet = workbook.getWorksheet('Inventory');
      if (invSheet && characterData.inventory && characterData.inventory.length > 0) {
        // ponytail: Kit expansion — unpack kits into their contained items
        const KIT_ITEMS = {
          "Adventurer's Kit": ['Backpack', 'Flint and steel', 'Rope', 'Notebook', 'Pen', 'Compass', 'Bedroll', 'Torches', 'Hand Mirror'],
          "Camping Kit": ['Tent', 'Bedroll', 'Bedroll', 'Bedroll', 'Bedroll', 'Bedroll', 'Tinder', 'Flint and steel', 'Camping mat'],
          "Cartographer's Kit": ['Compass', 'Gridded parchment', 'Graphite pencils', 'Measuring rod', 'Protractor', 'Travel logbook'],
          "Culinary Kit": ['Cooking knives', 'Pot', 'Pan', 'Preserved food'],
          "Medical Kit": ['Bandages', 'Salves', 'Alcohol', 'Scissors', 'Knife'],
          "Surgery Kit": ['Stitches', 'Bandages'],
          "Advanced Surgery Kit": ['Stitches', 'Bandages'],
          "Artificer's Kit": ['Artificer tools'],
          "Equipment Patching Kit": ['Patching materials'],
          "Research Kit": ['Bottles/vials/containers'],
        };

        // Build expanded inventory: replace kits with their contained items
        const expandedInventory = [];
        characterData.inventory.forEach(entry => {
          const item = entry.item || {};
          const kitItems = KIT_ITEMS[item.name];
          if (kitItems) {
            // Expand kit into individual items
            kitItems.forEach(kitItemName => {
              expandedInventory.push({
                item: { name: kitItemName, burdenCost: 0, climCost: 0, description: `From ${item.name}` },
                quantity: 1
              });
            });
          } else {
            expandedInventory.push(entry);
          }
        });

        // Write expanded inventory to sheet
        expandedInventory.forEach((entry, i) => {
          const row = 2 + i; // Start at row 2
          if (row <= 31) { // Expedition Inventory section ends at row 31
            const item = entry.item || {};
            invSheet.getCell(`A${row}`).value = item.name || '';
            invSheet.getCell(`B${row}`).value = entry.quantity || 1;
            // Burden cost (numeric)
            invSheet.getCell(`C${row}`).value = item.burdenCost || 0;
            // Clim cost (numeric price per item)
            invSheet.getCell(`D${row}`).value = item.climCost || 0;
            // Description
            invSheet.getCell(`F${row}`).value = item.description || '';
          }
        });
      }

      // 10. Fill Backstory
      if (characterData.background && backstorySheet) {
        backstorySheet.getCell('A1').value = characterData.background;
      }

      // 10. Write Buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (characterData.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_mirane.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel sheet:', err);
      // Inline UI feedback instead of blocking alert()
      const container = document.getElementById('summary-content');
      if (container) {
        const existing = container.querySelector('.export-error-banner');
        if (existing) existing.remove();
        const banner = document.createElement('div');
        banner.className = 'export-error-banner';
        banner.style.cssText = 'background:#dc3545;color:#fff;padding:0.75rem 1rem;border-radius:4px;margin-top:1rem;font-size:0.9rem;';
        banner.innerHTML = `<strong>Export failed:</strong> ${err.message || 'Unknown error'}. Check console for details.`;
        container.appendChild(banner);
        if (window.gsap) {
          gsap.fromTo(banner, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.3 });
        }
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          if (banner.parentElement) {
            if (window.gsap) {
              gsap.to(banner, { autoAlpha: 0, duration: 0.3, onComplete: () => banner.remove() });
            } else {
              banner.remove();
            }
          }
        }, 8000);
      } else {
        // Fallback: floating banner if summary container not available
        const fb = document.createElement("div");
        fb.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#dc3545;color:#fff;padding:0.75rem 1.5rem;border-radius:6px;z-index:9999;font-size:0.9rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);";
        fb.textContent = "Export failed. Check console for details.";
        document.body.appendChild(fb);
        setTimeout(() => fb.remove(), 8000);
      }
    }
  }

  /**
   * Export character data to a styled PDF character sheet.
   * Uses jsPDF to generate a multi-page PDF matching the Lyrian Chronicles character sheet layout.
   */
  function exportPDF(characterData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297; // A4 in mm
    const margin = 12;
    const contentW = W - margin * 2;
    let y = margin;

    const { name, background, race, ancestry, cls, stats, skills, breakthroughs, inventory } = characterData;
    const derived = stats ? calculateDerivedStats(stats) : {};
    const speed = characterData.speed ?? 20;

    // Helpers
    const safe = (v) => (v != null && v !== '' ? String(v) : '-');
    const drawRoundedRect = (x, yy, w, h, r, style, fill) => {
      if (fill) {
        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.roundedRect(x, yy, w, h, r, r, 'F');
      }
      if (style) {
        doc.setDrawColor(style[0], style[1], style[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, yy, w, h, r, r, 'S');
      }
    };
    const sectionHeader = (text, x, yy, w) => {
      doc.setFillColor(30, 60, 120);
      doc.roundedRect(x, yy, w, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(text.toUpperCase(), x + w / 2, yy + 3.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };
    const statBox = (x, yy, w, h, label, value, bgColor) => {
      const bc = bgColor || [230, 235, 245];
      drawRoundedRect(x, yy, w, h, 1, [80, 80, 80], bc);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + w / 2, yy + h * 0.38, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(value), x + w / 2, yy + h * 0.72, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    // ===== PAGE 1: Core Character Info =====

    // --- Title Banner ---
    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, W, 16, 'F');
    doc.setFillColor(255, 215, 0);
    doc.rect(0, 14, W, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('THE LYRIAN CHRONICLES', W / 2, 11, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ANGELS SWORD STUDIOS', W / 2, 15, { align: 'center' });
    y = 20;

    // --- Name Field ---
    drawRoundedRect(margin, y, contentW, 8, 1, [60, 60, 60], [255, 255, 255]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('NAME:', margin + 2, y + 5.5);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(safe(name), margin + 18, y + 5.5);
    y += 11;

    // --- Personal Details (Right) + Core Info (Left) ---
    const leftColX = margin;
    const rightColX = margin + contentW / 2 + 2;
    const colW = (contentW / 2) - 2;

    // Core Info (HP, RP, Mana) — Left
    sectionHeader('Core Info', leftColX, y, colW);
    y += 6;
    const coreItems = [
      { label: 'HP', value: safe(derived.hp), temp: '' },
      { label: 'RP', value: safe(derived.rp), temp: '' },
      { label: 'Mana', value: safe(derived.mana), temp: '' }
    ];
    coreItems.forEach(item => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', leftColX + 2, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, leftColX + 18, y + 4);
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text('Temp: ' + item.temp, leftColX + 42, y + 4);
      doc.setTextColor(0, 0, 0);
      y += 5;
    });

    // Personal Details — Right
    sectionHeader('Personal Details', rightColX, y - 6, colW);
    const pdY = y;
    const personalFields = [
      ['Spirit Core', safe(characterData.spiritCore ?? 0)],
      ['Gender', safe(characterData.gender)],
      ['Age', safe(characterData.age)],
      ['Exp', safe(characterData.exp ?? 1000)],
      ['Height', safe(characterData.height)],
      ['Weight', safe(characterData.weight)],
      ['Primary Race', safe(race ? race.name : null)],
      ['Sub Race', safe(ancestry ? ancestry.name : null)]
    ];
    personalFields.forEach(([label, val], i) => {
      const fy = pdY + (i * 4.5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', rightColX + 1, fy + 3);
      doc.setFont('helvetica', 'normal');
      doc.text(val, rightColX + 22, fy + 3);
    });
    y = pdY + personalFields.length * 4.5 + 2;

    // --- Stats Section ---
    const statsY = y;
    const statsBoxW = colW;

    // Main Stats — Left
    sectionHeader('Main Stats', leftColX, statsY, statsBoxW);
    const mainStatsY = statsY + 6;
    const mainStatsH = 5.5;
    const mainStatsGap = 1;
    const mainLabels = [
      ['Focus', stats.foc ?? '-'],
      ['Agility', stats.agi ?? '-'],
      ['Power', stats.pow ?? '-'],
      ['Toughness', stats.tou ?? '-']
    ];
    mainLabels.forEach(([label, val], i) => {
      statBox(leftColX + 2, mainStatsY + i * (mainStatsH + mainStatsGap), statsBoxW - 4, mainStatsH, label, val, [220, 228, 245]);
    });

    // Secondary Stats — Right
    sectionHeader('Secondary Stats', rightColX, statsY, colW);
    const subStatsY = statsY + 6;
    const subStatsH = 4.5;
    const subStatsGap = 0.8;
    const subLabels = [
      ['Fitness', stats.fitness ?? '-'],
      ['Presence', stats.presence ?? '-'],
      ['Cunning', stats.cunning ?? '-'],
      ['Reason', stats.reason ?? '-'],
      ['Awareness', stats.awareness ?? '-']
    ];
    subLabels.forEach(([label, val], i) => {
      statBox(rightColX + 2, subStatsY + i * (subStatsH + subStatsGap), colW - 4, subStatsH, label, val, [220, 228, 245]);
    });

    y = statsY + Math.max((4 * (mainStatsH + mainStatsGap)), (5 * (subStatsH + subStatsGap))) + 4;

    // --- Derived Stats Row ---
    sectionHeader('Derived Stats', leftColX, y, contentW);
    y += 6;
    const derivedItems = [
      ['Evasion', safe(derived.evasion)],
      ['Dodge/Eva', safe(derived.dodgeEva)],
      ['Potency', safe(derived.potency)],
      ['Damage', safe(derived.damage)],
      ['Initiative', safe(derived.initiative)],
      ['Speed', safe(speed) + 'ft'],
      ['Accuracy', safe(derived.accuracy)],
      ['Save Bonus', safe(derived.saveBonus)]
    ];
    const derivedCols = 4;
    const derivedBoxW = (contentW - 3) / derivedCols;
    const derivedBoxH = 9;
    derivedItems.forEach((item, i) => {
      const col = i % derivedCols;
      const row = Math.floor(i / derivedCols);
      const dx = leftColX + col * (derivedBoxW + 1);
      const dy = y + row * (derivedBoxH + 1);
      statBox(dx, dy, derivedBoxW, derivedBoxH, item[0], item[1], [240, 242, 250]);
    });
    y += Math.ceil(derivedItems.length / derivedCols) * (derivedBoxH + 1) + 3;

    // --- Class List ---
    sectionHeader('Class List', leftColX, y, contentW);
    y += 6;

    // Table header
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 250);
    doc.rect(leftColX, y - 2.5, contentW, 5, 'F');
    const classCols = [
      { key: 'Class', x: leftColX + 2, w: 55 },
      { key: 'Tier', x: leftColX + 60, w: 14 },
      { key: 'Level', x: leftColX + 76, w: 14 },
      { key: 'Cost', x: leftColX + 92, w: 14 },
      { key: 'Role', x: leftColX + 108, w: contentW - 108 }
    ];
    classCols.forEach(c => doc.text(c.key, c.x, y));
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (cls && cls.all && cls.all.length > 0) {
      cls.all.forEach(cEntry => {
        const classObj = cEntry.class || {};
        const tier = classObj.tier ? 'T' + classObj.tier : '-';
        const level = cEntry.level || 1;
        const expCost = (parseInt(classObj.tier) || 1) * 100 + Math.max(0, level - 1) * 100;
        const role = safe(classObj.role);
        classCols.forEach(c => {
          const val = c.key === 'Class' ? safe(classObj.name) :
                      c.key === 'Tier' ? tier :
                      c.key === 'Level' ? String(level) :
                      c.key === 'Cost' ? String(expCost) : role;
          doc.text(val, c.x, y);
        });
        y += 4.5;
      });
    } else {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('No classes equipped', leftColX + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
    }
    y += 3;

    // --- Worships / Resources ---
    if (characterData.worships) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Worships: ', leftColX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(safe(characterData.worships), leftColX + 22, y);
      y += 5;
    }
    {
      const baseClim = characterData.clim ?? 3000;
      const RICH_PARENTS_ID = '69ea4f7a6be32fced492fb97';
      const hasRichParents = (characterData.breakthroughs || []).some(b => b && b.id === RICH_PARENTS_ID);
      const totalClim = baseClim + (hasRichParents ? 3000 : 0);
      doc.setFontSize(7);
      doc.text('Starting Clim: ' + baseClim + (hasRichParents ? ' (+3000 Rich Parents)' : ''), leftColX, y);
      y += 4;
      doc.text('Total Clim: ' + totalClim + '  |  EXP: ' + (characterData.exp ?? 1000) + '  |  IP: ' + (characterData.ip ?? 3), leftColX, y);
      y += 5;
    }

    // --- Injuries Box ---
    const injBoxH = 18;
    drawRoundedRect(leftColX, y, contentW, injBoxH, 1, [100, 100, 100], [255, 255, 255]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('INJURIES', leftColX + 2, y + 3.5);
    doc.setTextColor(0, 0, 0);

    // ===== PAGE 2: Skills =====
    doc.addPage();
    y = margin;

    // Title
    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SKILLS', W / 2, 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 14;

    if (skills && Array.isArray(skills)) {
      const allBtBonuses = getBreakthroughSkillBonuses(characterData.breakthroughs || []);
      const btSkillMap = {};
      allBtBonuses.forEach(b => {
        if (!btSkillMap[b.skill]) btSkillMap[b.skill] = [];
        btSkillMap[b.skill].push(b);
      });

      skills.forEach(group => {
        const groupSkills = group.skills;
        const hasInvested = groupSkills.some(s => s.pts > 0);
        const hasBtBonus = groupSkills.some(s => btSkillMap[s.name]);
        if (!hasInvested && !hasBtBonus) return;

        // Group header
        sectionHeader(group.name + ' (Sub-Stat: ' + (stats[group.subStat] ?? '-') + ')', leftColX, y, contentW);
        y += 6;

        // Skill rows
        groupSkills.forEach(skill => {
          if (skill.pts <= 0 && !btSkillMap[skill.name]) return;
          const expertise = skill.expertise ? ' [' + skill.expertise + ']' : '';
          const bonuses = btSkillMap[skill.name] || [];
          const btText = bonuses.length > 0 ? ' (BT: ' + bonuses.map(b => (b.bonus > 0 ? '+' : '') + b.bonus + ' ' + b.breakthroughName).join(', ') + ')' : '';
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(skill.name + ':', leftColX + 4, y + 3);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 200);
          doc.text(String(skill.pts) + expertise + btText, leftColX + 38, y + 3);
          doc.setTextColor(0, 0, 0);
          y += 5;
        });
        y += 3;
      });
    }

    // ===== PAGE 3: Breakthroughs =====
    doc.addPage();
    y = margin;

    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BREAKTHROUGHS', W / 2, 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 14;

    if (breakthroughs && breakthroughs.length > 0) {
      breakthroughs.forEach(bt => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(bt.name || 'Unknown', leftColX, y + 3);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Cost: ' + (bt.cost || 0) + ' EXP', leftColX + 60, y + 3);
        if (bt.prerequisites) {
          doc.text('Prereq: ' + bt.prerequisites, leftColX + 95, y + 3);
        }
        doc.setTextColor(0, 0, 0);
        // Description if fits
        if (bt.description) {
          doc.setFontSize(7);
          const descLines = doc.splitTextToSize(bt.description, contentW - 6);
          descLines.forEach(line => {
            y += 3.5;
            if (y > H - margin) { doc.addPage(); y = margin; }
            doc.text(line, leftColX + 2, y + 2);
          });
        }
        y += 7;
        if (y > H - margin - 10) { doc.addPage(); y = margin; }
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No breakthroughs selected', leftColX, y + 3);
      doc.setTextColor(0, 0, 0);
    }

    // ===== PAGE 4: Inventory =====
    doc.addPage();
    y = margin;

    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY & EQUIPMENT', W / 2, 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 14;

    if (inventory && inventory.length > 0) {
      // Table header
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 250);
      doc.rect(leftColX, y - 2.5, contentW, 5, 'F');
      const invCols = [
        { key: 'Item', x: leftColX + 2, w: 70 },
        { key: 'Type', x: leftColX + 74, w: 30 },
        { key: 'Qty', x: leftColX + 106, w: 10 },
        { key: 'Burden', x: leftColX + 118, w: 14 },
        { key: 'Cost', x: leftColX + 134, w: 18 },
        { key: 'Total', x: leftColX + 154, w: 18 }
      ];
      invCols.forEach(c => doc.text(c.key, c.x, y));
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let totalBurden = 0;
      let totalCost = 0;
      inventory.forEach(entry => {
        const item = entry.item || {};
        const qty = entry.quantity || 1;
        const burden = (item.burdenCost || 0) * qty;
        const cost = (item.climCost || 0) * qty;
        totalBurden += burden;
        totalCost += cost;

        invCols.forEach(c => {
          const val = c.key === 'Item' ? safe(item.name) :
                      c.key === 'Type' ? safe(item.subType) :
                      c.key === 'Qty' ? String(qty) :
                      c.key === 'Burden' ? String(burden) :
                      c.key === 'Cost' ? String(item.climCost || 0) :
                      String(cost);
          doc.text(val, c.x, y);
        });
        y += 4.5;
        if (y > H - margin - 15) { doc.addPage(); y = margin; }
      });

      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Total Clim Spent: ' + totalCost, leftColX, y);
      y += 5;
      doc.text('Total Burden: ' + totalBurden, leftColX, y);
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No items purchased', leftColX, y + 3);
      doc.setTextColor(0, 0, 0);
    }

    // ===== PAGE 5: Background =====
    doc.addPage();
    y = margin;

    doc.setFillColor(20, 40, 80);
    doc.rect(0, 0, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BACKGROUND & NOTES', W / 2, 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 14;

    if (background) {
      sectionHeader('Background Story', leftColX, y, contentW);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const bgLines = doc.splitTextToSize(background, contentW - 4);
      bgLines.forEach(line => {
        y += 4;
        if (y > H - margin) { doc.addPage(); y = margin; }
        doc.text(line, leftColX + 2, y);
      });
      y += 8;
    }

    // Notes area
    sectionHeader('Notes', leftColX, y, contentW);
    y += 6;
    const notesH = H - y - margin;
    drawRoundedRect(leftColX, y, contentW, notesH, 1, [100, 100, 100], [255, 255, 255]);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('(Use this space for campaign notes, character development, etc.)', leftColX + 4, y + 8);
    doc.setTextColor(0, 0, 0);

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('The Lyrian Chronicles - Character Sheet', margin, H - 5);
      doc.text('Page ' + p + ' of ' + totalPages, W - margin, H - 5, { align: 'right' });
      doc.text('Generated: ' + new Date().toLocaleDateString(), W / 2, H - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Save
    const safeName = (name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(safeName + '_lyrian.pdf');
  }

  // ponytail: O(n²) name scans — fine for <200 items, map cache if it hurts
  function _find(arr, name) {
    if (!name || !Array.isArray(arr)) return null;
    const n = name.toLowerCase();
    return arr.find(x => (x.name||'').toLowerCase() === n) || null;
  }

  /**
   * Import character data from a Mirane CCS Excel file.
   * Populates window._importCharacter (the global character object).
   */
  async function importExcel(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(ev.target.result);
          const core = wb.getWorksheet('Core');
          if (!core) throw new Error('No "Core" sheet found.');

          // ponytail: safe cell read — handles null, formula objects, empty strings
          const v = (s, r) => { const c = s.getCell(r); const x = c.value; if (!x) return null; if (typeof x === 'object' && x.result !== undefined) return x.result; return x; };
          const T = (s, r) => String(v(s, r) || '');
          const N = (s, r) => Number(v(s, r) || 0);
          const tgt = window._importCharacter;

          // Identity
          tgt.name = T(core, 'B2');
          tgt.race = _find(RACE_DATA, T(core, 'D2'));
          tgt.ancestry = (function() { const a = ANCESTRY_MAP[tgt.race?.name]; return a ? _find(a, T(core, 'D3')) : null; })();
          tgt.gender = T(core, 'B3');
          tgt.age = T(core, 'B4');
          tgt.height = T(core, 'B5');
          tgt.weight = T(core, 'B6');
          tgt.worships = T(core, 'B7');
          tgt.spiritCore = N(core, 'C5');
          tgt.speed = N(core, 'H6') || 20;
          tgt.exp = N(core, 'D4') || 1000;
          tgt.mirane = v(core, 'A58') !== false;
          tgt.oldArmorCalc = !!v(core, 'K30');

          // Background
          const bs = wb.getWorksheet('Backstory');
          tgt.background = bs ? T(bs, 'A1') : '';

          // Clim
          const ex = wb.getWorksheet('EXP & Transactions');
          if (ex) {
            tgt.clim = N(ex, 'F2') || 3000;
            tgt.climSpent = Math.abs(N(ex, 'F4'));
          }

          // Stats
          tgt.baseStats = { foc:N(core,'A45'), pow:N(core,'A46'), agi:N(core,'A47'), tou:N(core,'A48'), fitness:N(core,'C45'), cunning:N(core,'C46'), reason:N(core,'C47'), awareness:N(core,'C48'), presence:N(core,'C49') };
          tgt.raceBonuses = { foc:N(core,'F45'), pow:N(core,'F46'), agi:N(core,'F47'), tou:N(core,'F48'), fitness:N(core,'H45'), cunning:N(core,'H46'), reason:N(core,'H47'), awareness:N(core,'H48'), presence:N(core,'H49') };
          tgt.stats = {};
          Object.keys(tgt.baseStats).forEach(k => tgt.stats[k] = (tgt.baseStats[k]||0) + (tgt.raceBonuses[k]||0));

          // Classes
          const classes = [];
          for (let r = 15; r <= 35; r++) {
            const nm = T(core, `A${r}`);
            if (!nm) break;
            const ts = T(core, `B${r}`);
            const tm = ts.match(/(\d+)/);
            const co = _find(CLASS_DATA, nm);
            classes.push({ class: co || { name: nm, tier: tm ? tm[1] : '1' }, level: N(core,`C${r}`)||1 });
          }
          if (classes.length) tgt.cls = { primary: classes[0], all: classes, spiritCore: tgt.spiritCore };

          // Breakthroughs
          const bts = wb.getWorksheet('Breakthrough');
          if (bts) {
            tgt.breakthroughs = [];
            for (let r = 2; r <= 58; r++) {
              const nm = T(bts, `A${r}`);
              if (!nm) break;
              const bo = _find(BREAKTHROUGH_DATA, nm);
              tgt.breakthroughs.push({ id: bo?.id || nm, name: nm, cost: N(bts,`B${r}`), prerequisites: T(bts,`C${r}`), description: T(bts,`D${r}`) });
            }
          }

          // Skills
          const RM = {9:'Athletics',10:'Riding',11:'Stealth',12:'Deception',13:'Roguecraft',14:'Medicine',15:'Common Knowledge',16:'Linguistics',17:'Magic',18:'Religion',19:'Appraise',20:'History',21:'Flight',22:'Artifice',23:'Perception',24:'Insight',25:'Survival',26:'Animal Husbandry',27:'Art',28:'Negotiation',29:'Intimidation'};
          const impSk = {};
          for (const [r,sn] of Object.entries(RM)) { const p = N(core,`H${r}`); const e = T(core,`I${r}`); if (p||e) impSk[sn]={pts:p,expertise:e}; }
          tgt.skills = SKILL_GROUPS.map(g => ({ name:g.name, subStat:g.subStat, skills: g.skills.map(s => ({ name:s.name, pts:impSk[s.name]?.pts||0, expertise:impSk[s.name]?.expertise||'' })) }));

          // Inventory
          const iv = wb.getWorksheet('Inventory');
          if (iv) {
            tgt.inventory = [];
            for (let r = 2; r <= 31; r++) {
              const nm = T(iv, `A${r}`);
              if (!nm) break;
              const io = _find(ITEMS_DATA, nm);
              tgt.inventory.push({ item: io || { name:nm, burdenCost:N(iv,`C${r}`), climCost:N(iv,`D${r}`), description:T(iv,`F${r}`) }, quantity: N(iv,`B${r}`)||1 });
            }
          }

          resolve(true);
        } catch (err) {
          console.error('Import failed:', err);
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function reset() {
    const container = document.getElementById('summary-content');
    if (container) container.innerHTML = '';
  }

  return { render, exportJSON, exportExcel, exportPDF, importExcel, reset };
})();
