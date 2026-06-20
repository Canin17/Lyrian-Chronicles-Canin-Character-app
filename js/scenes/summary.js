/**
 * Lyrian Chronicles - Character Summary Scene
 * Shows final character overview and export functionality
 */

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

    // Human-specific options
    if (characterData.race && characterData.race.name === 'Human') {
      if (characterData.pureHuman) {
        html += `<div class="summary-row"><span class="summary-label">Pure Human</span><span class="summary-value">Yes</span></div>`;
      }
      if (characterData.slowStarter) {
        html += `<div class="summary-row"><span class="summary-label">Slow Starter</span><span class="summary-value">Yes</span></div>`;
      }
      if (characterData.starterIp) {
        html += `<div class="summary-row"><span class="summary-label">Starter IP</span><span class="summary-value">${window.escapeHtml(characterData.starterIp)}</span></div>`;
      }
    }

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
      </div>
    </div>`;

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
            id: c.class.id,
            name: c.class.name,
            tier: c.class.tier,
            role: c.class.role,
            level: c.level,
            abilitiesBought: c.abilitiesBought
          })) : []
        } : null,
        stats: characterData.stats,
        derivedStats: calculateDerivedStats(characterData.stats),
        skills: characterData.skills,
        breakthroughs: characterData.breakthroughs || []
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
        // Identity extras
        coreSheet.getCell('A3').value = characterData.gender || '';
        coreSheet.getCell('A4').value = characterData.age || '';
        coreSheet.getCell('A5').value = characterData.height || '';
        coreSheet.getCell('A6').value = characterData.weight || '';
        coreSheet.getCell('A7').value = characterData.worships || '';
        // Spirit Core
        coreSheet.getCell('C5').value = characterData.spiritCore ?? 0;
        // Starting Clim (default 3000)
        coreSheet.getCell('A54').value = characterData.clim ?? 3000;
        // Mirane flag
        coreSheet.getCell('A57').value = characterData.mirane !== false ? 'Yes' : 'No';
        // Old Armor Calc
        coreSheet.getCell('K30').value = characterData.oldArmorCalc ? 'Yes' : 'No';
        // Human-specific options
        coreSheet.getCell('A49').value = characterData.pureHuman ? 'Yes' : 'No';
        coreSheet.getCell('A50').value = characterData.slowStarter ? 'Yes' : 'No';
        coreSheet.getCell('C52').value = characterData.starterIp || '';
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
            coreSheet.getCell(`A${row}`).value = clsEntry.class.name;
            coreSheet.getCell(`B${row}`).value = clsEntry.class.tier ?? '';
            coreSheet.getCell(`C${row}`).value = clsEntry.level;
            // Calculate class EXP cost using CostCalc if available
            if (window.CostCalc) {
              try {
                const expCost = window.CostCalc.total(clsEntry.class.id, clsEntry.level);
                coreSheet.getCell(`D${row}`).value = expCost;
              } catch(e) {
                coreSheet.getCell(`D${row}`).value = 0;
              }
            }
          }
        });
      }

      // 6b. Fill Proficiencies (K9-K12)
      if (coreSheet && characterData.race) {
        const race = characterData.race;
        const ancestry = characterData.ancestry;
        const raceProfs = race.proficiencies || '';
        const ancProfs = ancestry ? (ancestry.proficiencies || '') : '';
        const allProfs = [raceProfs, ancProfs].filter(p => p).join(' ');

        // Parse proficiencies by keyword and write to K column
        const armorMatch = allProfs.match(/(?:armor|light armor|medium armor|heavy armor)[^\.]*\./gi);
        const langMatch = allProfs.match(/(?:speak|read|write|language|dialect)[^\.]*\./gi);
        const weaponMatch = allProfs.match(/(?:weapon|weapon group)[^\.]*\./gi);
        const elementMatch = allProfs.match(/(?:elemental|mastery)[^\.]*\./gi);

        coreSheet.getCell('K9').value = armorMatch ? armorMatch.join(' ').trim() : '';
        coreSheet.getCell('K10').value = langMatch ? langMatch.join(' ').trim() : '';
        coreSheet.getCell('K11').value = weaponMatch ? weaponMatch.join(' ').trim() : '';
        coreSheet.getCell('K12').value = elementMatch ? elementMatch.join(' ').trim() : '';
      }

      // 7. Fill Breakthroughs
      if (characterData.breakthroughs && btSheet) {
        characterData.breakthroughs.forEach((bt, i) => {
          const row = 2 + i;
          if (row <= 37) {
            btSheet.getCell(`A${row}`).value = bt.name;
            btSheet.getCell(`B${row}`).value = 0.0; // Creation spent is 0
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
      alert('An error occurred while generating the Excel sheet. Check console logs for details.');
    }
  }

  function reset() {
    const container = document.getElementById('summary-content');
    if (container) container.innerHTML = '';
  }

  return { render, exportJSON, exportExcel, reset };
})();
