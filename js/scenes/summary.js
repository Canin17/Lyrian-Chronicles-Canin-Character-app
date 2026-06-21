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
    html += `<div class="summary-row"><span class="summary-label">Starting Clim</span><span class="summary-value">${characterData.clim ?? 3000}</span></div>`;
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
    html += `<div class="summary-section">
      <h3>Ability Scores</h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">`;

    MAIN_STATS.forEach(def => {
      html += `<div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${def.short || def.name}</div>
        <div style="font-size: 1.5rem; color: var(--accent-gold-light); font-weight: bold;">${stats[def.id] ?? '-'}</div>
      </div>`;
    });

    html += `</div>`;

    // Sub Stats
    html += `<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-top: 0.5rem;">`;

    SUB_STATS.forEach(def => {
      html += `<div style="text-align: center; padding: 0.4rem; background: var(--bg-primary); border-radius: 4px;">
        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${def.name}</div>
        <div style="font-size: 1.2rem; color: var(--accent-gold); font-weight: bold;">${stats[def.id] ?? '-'}</div>
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

    // Skills
    html += `<div class="summary-section"><h3>Skills</h3>`;

    if (skills && Array.isArray(skills)) {
      skills.forEach(group => {
      const investedSkills = group.skills.filter(s => s.pts > 0);
      if (investedSkills.length > 0) {
        html += `<div style="margin-bottom: 0.5rem;">
          <div style="color: var(--accent-gold); font-size: 0.9rem; margin-bottom: 0.25rem;">${group.name} (${group.subStat})</div>`;

        investedSkills.forEach(skill => {
          const expertise = skill.expertise ? ` [${window.escapeHtml(skill.expertise)}]` : '';
          html += `<div style="padding-left: 1rem; font-size: 0.85rem; color: var(--text-primary);">
            ${window.escapeHtml(skill.name)}: <strong style="color: var(--accent-gold-light);">${skill.pts}</strong>${expertise}
          </div>`;
        });

        html += `</div>`;
      }
      });
    }

    html += `</div>`;

    container.innerHTML = html;

    // Animate in
    if (window.gsap) {
      gsap.fromTo(container, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 });
    }
  }

  function exportJSON(characterData) {
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
          name: characterData.race.name
        } : null,
        ancestry: characterData.ancestry ? {
          ancestryId: characterData.ancestry.ancestryId,
          name: characterData.ancestry.name
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
        mirane: characterData.mirane,
        oldArmorCalc: characterData.oldArmorCalc,
        speed: characterData.speed ?? 20
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
        // Identity extras (data goes in column B to avoid overwriting labels in column A)
        coreSheet.getCell('A3').value = characterData.gender || '';
        coreSheet.getCell('B4').value = characterData.age || '';
        coreSheet.getCell('B5').value = characterData.height || '';
        coreSheet.getCell('B6').value = characterData.weight || '';
        coreSheet.getCell('B7').value = characterData.worships || '';
        // Spirit Core
        coreSheet.getCell('C5').value = characterData.spiritCore ?? 0;
        // Base Speed (from ancestry traits)
        coreSheet.getCell('H6').value = characterData.speed ?? 20;
        // Breakthrough count
        coreSheet.getCell('D7').value = (characterData.breakthroughs || []).length;
        // Starting Clim (default 3000)
        coreSheet.getCell('A54').value = characterData.clim ?? 3000;
        // Starting EXP (default 1000)
        coreSheet.getCell('D4').value = characterData.exp ?? 1000;
        // Mirane flag
        coreSheet.getCell('A57').value = characterData.mirane !== false ? 'Yes' : 'No';
        // Old Armor Calc
        coreSheet.getCell('K30').value = characterData.oldArmorCalc ? 'Yes' : 'No';
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

      // 6. Fill Equipped Classes (with Tier and EXP)
      if (characterData.cls && coreSheet) {
        const classes = characterData.cls.all || [];
        classes.forEach((clsEntry, i) => {
          const row = 15 + i;
          if (row <= 35) {
            const classObj = clsEntry.class || {};
            coreSheet.getCell(`A${row}`).value = classObj.name || 'Unknown';
            coreSheet.getCell(`B${row}`).value = classObj.tier ?? '';
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

      // 9. Fill Backstory
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

  function reset() {
    const container = document.getElementById('summary-content');
    if (container) container.innerHTML = '';
  }

  return { render, exportJSON, exportExcel, reset };
})();
