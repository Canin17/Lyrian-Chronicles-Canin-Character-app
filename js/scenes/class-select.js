/**
 * Lyrian Chronicles - Class Selection Scene
 * Handles class browsing, filtering, and selection with images
 * Includes class overview panel with level controls, EXP, and Spirit Core
 *
 * Rules (from rulebook):
 * - Classes: Start with 1000 EXP + 3 Interlude Points (IP)
 * - Unlock class: 1 IP + (Tier x 100) EXP
 * - Key abilities: FREE
 * - 7 more abilities at 100 EXP each
 * - Mastered when all abilities bought (level 8)
 * - EXP spent -> Spirit Core
 */

/* exported ClassSelectScene */
const ClassSelectScene = (function() {
  let equippedClasses = []; // Array of {class, level}
  let previewClass = null;
  let previewLevel = 1;
  let openDropdownLevel = null; // Track which ability dropdown is open
  let activeFilters = { tier: '', role: '', eligibility: '', difficulty: '' }; // Filter state
  let previewEventsBound = false; // Guard against duplicate event listeners
  let imageTimeouts = []; // Track image load timeouts for cleanup

  /**
   * Decode HTML entities for textContent display.
   * Data files contain &nbsp;, &mdash;, etc. which should display as actual characters.
   */
  function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    const result = textarea.value;
    textarea.innerHTML = ''; // Clear to prevent script execution
    return result;
  }

  // EXP constants from rulebook
  let TOTAL_CLASS_EXP = 1000; // Configurable starting EXP
  let TOTAL_IP = 3; // Configurable starting IP
  const ABILITY_COST = 100; // Each ability costs 100 EXP
  const MAX_LEVEL = 8; // unlock + 7 abilities

  // ===========================================================================
  // COST CALCULATOR — centralized EXP/cost math
  // ===========================================================================
  const CostCalc = {
    unlock(cls) {
      return (parseInt(cls.tier) || 1) * 100;
    },
    total(cls, level) {
      return CostCalc.unlock(cls) + Math.max(0, level - 1) * ABILITY_COST;
    },
    marginal(cls, fromLevel, toLevel) {
      return CostCalc.total(cls, toLevel) - CostCalc.total(cls, fromLevel);
    },
    allEquipped(list) {
      return list.reduce((sum, ec) => sum + CostCalc.total(ec.class, ec.level), 0);
    }
  };

  function getTotalExpSpent() {
    return CostCalc.allEquipped(equippedClasses);
  }

  function getIpSpent() {
    return equippedClasses.length; // 1 IP per class unlock
  }

  function getRemainingExp() {
    return Math.max(0, TOTAL_CLASS_EXP - getTotalExpSpent());
  }

  function getRemainingIp() {
    return Math.max(0, TOTAL_IP - getIpSpent());
  }

  function getSpiritCoreLevel() {
    // Spirit Core = class EXP spent + main pool EXP spent on breakthroughs
    let total = getTotalExpSpent();
    // Add main pool EXP spent on breakthroughs (if breakthrough scene is loaded)
    if (typeof BreakthroughScene !== 'undefined' && BreakthroughScene.getExpFromMainPool) {
      total += BreakthroughScene.getExpFromMainPool();
    }
    return total;
  }

  function updateOverviewStats() {
    const expEl = document.getElementById('expRemaining');
    const spiritEl = document.getElementById('spiritCoreDisplay');
    const ipEl = document.getElementById('ipDisplay');

    if (expEl) expEl.textContent = `${getRemainingExp()} EXP`;
    if (spiritEl) spiritEl.textContent = `Spirit Core: ${getSpiritCoreLevel()}`;
    if (ipEl) ipEl.textContent = `${getRemainingIp()} IP`;
  }

  // ===========================================================================
  // IMAGE LOADING — shared helper for preview + grid
  // ===========================================================================
  function loadClassImage(imgEl, wrapperEl, name, opts = {}) {
    const { width = '80px', height = '160px', onFallback, skipInlineStyles } = opts;

    if (!imgEl) return;

    // No image URL — show initial letter fallback
    if (!opts.src) {
      imgEl.removeAttribute('src');
      imgEl.alt = name.charAt(0);
      if (wrapperEl && !skipInlineStyles) {
        wrapperEl.style.aspectRatio = 'auto';
        wrapperEl.style.width = width;
        wrapperEl.style.height = height;
      }
      return;
    }

    imgEl.alt = name;
    let loaded = false;

    const setAspectRatio = () => {
      if (imgEl.naturalWidth && imgEl.naturalHeight && !skipInlineStyles) {
        const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
        if (wrapperEl) {
          wrapperEl.style.aspectRatio = `${ratio}`;
          wrapperEl.style.width = width;
          wrapperEl.style.height = 'auto';
        }
      }
    };

    const showFallback = () => {
      loaded = true;
      if (wrapperEl && !skipInlineStyles) {
        wrapperEl.style.aspectRatio = 'auto';
        wrapperEl.style.width = width;
        wrapperEl.style.height = height;
      }
      if (onFallback) onFallback();
    };

    // Set onload handler BEFORE setting src to catch cached images
    imgEl.onload = () => {
      if (opts.staleCheck && opts.staleCheck()) return;
      loaded = true;
      if (!imgEl.naturalWidth || !imgEl.naturalHeight) {
        showFallback();
      } else {
        setAspectRatio();
      }
    };

    imgEl.onerror = showFallback;

    // Start loading
    imgEl.src = opts.src;

    // Handle already-cached images
    if (imgEl.complete && imgEl.naturalWidth) {
      loaded = true;
      if (imgEl.naturalHeight) {
        setAspectRatio();
      } else {
        showFallback();
      }
    }

    // Fallback timeout: 8s for slow CDN / Firefox OpaqueResponseBlocking
    const timeoutId = setTimeout(() => {
      if (!loaded) showFallback();
    }, 8000);
    imageTimeouts.push(timeoutId);
  }

  // ===========================================================================
  // ELIGIBILITY CHECKER — clause-based parser
  // Splits requirements into clauses by separators (period, "and")
  // Evaluates each clause with AND logic
  // ===========================================================================
  function isClassEligible(cls, charData) {
    const req = (cls.requirements || '').replace(/<[^>]*>/g, '').trim();
    if (!req || req === 'None') {
      const tier = parseInt(cls.tier) || 1;
      if (tier >= 2) {
        return checkRaceBypass(cls.name, charData);
      }
      return true; // Tier 1 classes with no requirements are always eligible
    }

    if (checkRaceBypass(cls.name, charData)) {
      return true;
    }

    const race = charData.race;
    const ancestry = charData.ancestry;
    const breakthroughs = charData.breakthroughs || [];

    // Split on "Alternatively" for OR logic
    const altIdx = req.toLowerCase().indexOf('alternatively');
    if (altIdx !== -1) {
      const partA = req.substring(0, altIdx).trim().replace(/\.$/, '');
      const partB = req.substring(altIdx + 13).trim();
      return evaluateClassRequirementGroup(partA, charData, race, ancestry, breakthroughs) ||
             evaluateClassRequirementGroup(partB, charData, race, ancestry, breakthroughs);
    }

    return evaluateClassRequirementGroup(req, charData, race, ancestry, breakthroughs);
  }

  // Check if the player's race has an ability that bypasses class requirements
  function checkRaceBypass(className, charData) {
    if (!charData || !charData.ancestry) return false;
    const ancestryName = (charData.ancestry.name || '').toLowerCase();
    const ancestryId = (charData.ancestry.ancestryId || '').toLowerCase();
    if (className.toLowerCase() === 'aetherie' && (ancestryName === 'sheepfolk' || ancestryId === 'sheepfolk')) {
      return true;
    }
    return false;
  }

  // Evaluates a group of clauses joined by AND (period, " and ")
  function evaluateClassRequirementGroup(group, charData, race, ancestry, breakthroughs) {
    const clauses = group.split(/\.\s*|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    return clauses.every(clause => evaluateClassClause(clause, charData, race, ancestry, breakthroughs));
  }

  // Evaluates a single clause. Returns true if satisfied.
  function evaluateClassClause(clause, charData, race, ancestry, breakthroughs) {
    const lower = clause.toLowerCase();

    // "or be a/an [Race]" at the end
    const orRaceMatch = clause.match(/or\s+be\s+(?:a|an)\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+)*?)\s*\.?$/i);
    if (orRaceMatch) {
      const beforeOr = clause.substring(0, orRaceMatch.index).trim();
      const racePart = orRaceMatch[1].trim();
      return evaluateClassClause(beforeOr, charData, race, ancestry, breakthroughs) ||
             checkRaceMatch(racePart, race, ancestry);
    }

    // "X mastered or [Race] plus Y mastered" pattern
    const orRacePlusMatch = clause.match(/(.+?)\s+or\s+([A-Z][a-zA-Z]+)\s+plus\s+(.+?)(?:\.|$)/i);
    if (orRacePlusMatch) {
      const aCheck = evaluateClassClause(orRacePlusMatch[1].trim(), charData, race, ancestry, breakthroughs);
      const raceCheck = checkRaceMatch(orRacePlusMatch[2].trim(), race, ancestry);
      const bCheck = evaluateClassClause(orRacePlusMatch[3].trim(), charData, race, ancestry, breakthroughs);
      return aCheck || (raceCheck && bCheck);
    }

    // Comma-separated AND
    const commaIdx = clause.indexOf(',');
    if (commaIdx !== -1) {
      const firstPart = clause.substring(0, commaIdx).trim().toLowerCase();
      const knownRaces = ['human', 'demon', 'fae', 'chimera', 'angel', 'youkai'];
      const knownAncestries = ['sheepfolk', 'kitsune', 'raijin', 'tengu', 'anubis', 'selkie', 'lamia',
        'ratfolk', 'red panda', 'slimefolk', 'spiderfolk', 'wolf-folk', 'centaur', 'arachne',
        'jiangshi', 'youkai', 'marionette', 'goblin', 'dwarf', 'elf'];
      const isRace = knownRaces.includes(firstPart) || knownAncestries.some(a => firstPart.includes(a));
      const isCompletePrereq = isRace ||
                               firstPart.includes('mastered') ||
                               firstPart.includes('mastery') ||
                               firstPart.includes('learned') ||
                               firstPart.includes('spell') ||
                               firstPart.includes('proficient') ||
                               firstPart.includes('proficiency');
      if (isCompletePrereq) {
        const secondPart = clause.substring(commaIdx + 1).trim();
        return evaluateClassClause(clause.substring(0, commaIdx).trim(), charData, race, ancestry, breakthroughs) &&
               evaluateClassClause(secondPart, charData, race, ancestry, breakthroughs);
      }
    }

    // "X mastered" / "X or Y mastered"
    if (lower.includes('mastered') || lower.includes('mastery')) {
      return checkClassMastery(clause);
    }

    // "Must have the X breakthrough"
    if (lower.includes('breakthrough')) {
      const btMatch = clause.match(/(?:must have|requires)\s+(?:the\s+)?(.+?)(?:\.|$)/i);
      if (btMatch) {
        const btName = btMatch[1].trim().toLowerCase();
        return breakthroughs.some(bt => bt.name.toLowerCase() === btName);
      }
      return false;
    }

    // "Must be a/an X" / "Must be X" (race requirement)
    const raceMatch = clause.match(/(?:must\s+)?be\s+(?:a|an)?\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+)*?)(?:\.|$)/i);
    if (raceMatch && !lower.includes('mastered')) {
      return checkRaceMatch(raceMatch[1].trim().toLowerCase(), race, ancestry);
    }

    // "X learned, must possess..."
    if (lower.includes('learned') || lower.includes('possess')) {
      return equippedClasses.length > 0;
    }

    // "Have at least 1 spell"
    if (lower.includes('spell')) {
      return equippedClasses.length > 0;
    }

    // "Proficient in..."
    if (lower.includes('proficient') || lower.includes('proficiency')) {
      return equippedClasses.length > 0;
    }

    // "At least 5 skill points in..."
    if (lower.includes('skill points') || lower.includes('expertise')) {
      const skills = charData.skills || [];
      let totalPts = 0;
      skills.forEach(group => {
        if (Array.isArray(group)) group.forEach(s => { totalPts += (s.pts || 0); });
      });
      return totalPts >= 5;
    }

    // "Any points in X" / "Any level in X"
    if (lower.includes('points in') || lower.includes('level in')) {
      let targetClass = lower.includes('points in') ? lower.split('points in')[1] : lower.split('level in')[1];
      targetClass = targetClass.trim();
      return equippedClasses.some(ec => ec.class.name.toLowerCase().includes(targetClass.toLowerCase()));
    }

    // "X only" race restriction
    const onlyMatch = lower.match(/^(.+?)\s+only\s*$/i);
    if (onlyMatch) return checkRaceMatch(onlyMatch[1].trim(), race, ancestry);

    // Bare race name
    const cleanClause = clause.trim().replace(/\.$/, '').trim();
    if (cleanClause && !lower.includes('must') && !lower.includes('be') && !lower.includes('and') && !lower.includes('or')) {
      return checkRaceMatch(cleanClause.toLowerCase(), race, ancestry);
    }

    // Unknown clause - be permissive
    return true;
  }

  // Helper: check if the player's race/ancestry matches a required race name
  function checkRaceMatch(neededRace, race, ancestry) {
    const knownRaces = ['human', 'demon', 'fae', 'chimera', 'angel', 'youkai'];
    const neededLower = neededRace.toLowerCase();

    if (!race) return false;
    const raceName = (race.name || '').toLowerCase();
    const ancestryName = (ancestry && ancestry.name) ? ancestry.name.toLowerCase() : '';
    const ancestryId = (ancestry && ancestry.ancestryId) ? ancestry.ancestryId.toLowerCase() : '';

    // Compound names — all words must be present in the SAME identifier
    const words = neededLower.split(/\s+/);
    if (words.length > 1) {
      return words.every(w => raceName.includes(w)) ||
             words.every(w => ancestryName.includes(w)) ||
             words.every(w => ancestryId.includes(w));
    }

    if (knownRaces.includes(neededLower)) return raceName === neededLower;
    return ancestryName === neededLower || ancestryId === neededLower || raceName.includes(neededLower);
  }

  // Checks class mastery requirements
  function checkClassMastery(clause) {
    const lower = clause.toLowerCase();

    // Compound mastery: "X mastered, any tier N class mastered"
    const commaIdx = clause.indexOf(',');
    if (commaIdx !== -1) {
      const left = clause.substring(0, commaIdx).toLowerCase();
      const right = clause.substring(commaIdx + 1).toLowerCase();
      const leftHasMastery = left.includes('mastered') || left.includes('mastery');
      const rightHasMastery = right.includes('mastered') || right.includes('mastery') || right.includes('tier');
      if (leftHasMastery && rightHasMastery) {
        return checkClassMastery(clause.substring(0, commaIdx).trim()) &&
               checkClassMastery(clause.substring(commaIdx + 1).trim());
      }
    }

    // "Any tier N class mastered"
    const tierMatch = lower.match(/any\s+tier\s+(\d+)\s+class\s+mastered/i);
    if (tierMatch) {
      const requiredTier = parseInt(tierMatch[1]);
      return equippedClasses.some(ec => {
        const clsTier = parseInt(ec.class.tier) || 1;
        return clsTier === requiredTier && ec.level >= MAX_LEVEL;
      });
    }

    // "Any class mastered" / "At least 1 class mastered"
    if (lower.includes('any class mastered') || (lower.includes('at least') && lower.includes('class mastered'))) {
      return equippedClasses.some(ec => ec.level >= MAX_LEVEL);
    }

    // "X mastered" / "X or Y mastered" / "X, Y or Z mastered"
    const beforeMastered = clause.replace(/\s*(mastered|mastery)\s*\.?$/i, '').trim();
    const options = beforeMastered.split(/\s+or\s+|,\s*/).map(s => {
      return s.replace(/\s*(mastered|mastery)\s*\.?$/i, '').trim().toLowerCase();
    }).filter(Boolean);

    return options.some(opt => {
      if (opt === 'any') return false;
      return equippedClasses.some(ec => ec.class.name.toLowerCase() === opt && ec.level >= MAX_LEVEL);
    });
  }

  // ===========================================================================
  // EQUIPPED CLASSES MANAGEMENT
  // ===========================================================================
  function renderEquippedClasses() {
    const list = document.getElementById('equippedClassesList');
    if (!list) return;

    if (equippedClasses.length === 0) {
      list.innerHTML = '<div class="equipped-empty-msg">No classes equipped yet</div>';
      updateOverviewStats();
      return;
    }

    list.innerHTML = '';
    equippedClasses.forEach((ec, index) => {
      const item = document.createElement('div');
      item.className = 'equipped-class-item';

      const nameWrap = document.createElement('div');
      nameWrap.className = 'equipped-class-info';
      nameWrap.style.cursor = 'pointer';
      nameWrap.title = 'Click to manage level';

      const name = document.createElement('span');
      name.className = 'equipped-class-name';
      name.textContent = ec.class.name;

      const lvlBadge = document.createElement('span');
      lvlBadge.className = 'equipped-class-level-badge';
      lvlBadge.textContent = 'Lv ' + ec.level;

      // Click name opens overview synced to this class's level
      nameWrap.addEventListener('click', () => showClassPreview(ec.class, ec.level));

      // Mastery indicator (level 8 = all abilities bought)
      if (ec.level >= MAX_LEVEL) {
        const mastery = document.createElement('span');
        mastery.className = 'mastery-badge';
        mastery.textContent = '★ MASTERED';
        nameWrap.appendChild(mastery);
      }

      nameWrap.appendChild(name);
      nameWrap.appendChild(lvlBadge);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'equipped-class-remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove class';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeEquippedClass(index);
      });

      item.appendChild(nameWrap);
      item.appendChild(removeBtn);
      list.appendChild(item);
    });

    updateOverviewStats();
  }

  function removeEquippedClass(index) {
    equippedClasses.splice(index, 1);
    // If removed class was being previewed, hide preview
    if (previewClass && !equippedClasses.some(ec => ec.class.name === previewClass.name)) {
      hideClassPreview();
    }
    renderEquippedClasses();
    filterClasses(); // Re-render grid to update selected states

    // Enable/disable Continue button
    const nextBtn = document.getElementById('btn-class-next');
    if (nextBtn) nextBtn.disabled = equippedClasses.length === 0;
  }

  function equipClass(cls) {
    // Check eligibility before equipping
    const charData = window.getCharacterData ? window.getCharacterData() : {};
    if (!isClassEligible(cls, charData)) {
      const reqEl = document.getElementById('classPreviewRequirements');
      if (reqEl) {
        reqEl.classList.add('requirements-warning');
        if (window.gsap) {
          gsap.fromTo(reqEl, { scale: 1.05 }, { scale: 1, duration: 0.3 });
        }
      }
      return;
    }

    const existing = equippedClasses.find(ec => ec.class.name === cls.name);
    if (existing) {
      // Class already equipped — apply the level change from the overview panel
      const expDiff = CostCalc.marginal(cls, existing.level, previewLevel);
      if (expDiff > 0 && getRemainingExp() < expDiff) return;
      existing.level = previewLevel;
    } else {
      // New class — equip at the preview level
      if (getRemainingIp() < 1) return;
      if (getRemainingExp() < CostCalc.total(cls, previewLevel)) return;
      equippedClasses.push({ class: cls, level: previewLevel });
    }

    renderEquippedClasses();
    filterClasses();

    // Enable/disable Continue button
    const nextBtn = document.getElementById('btn-class-next');
    if (nextBtn) nextBtn.disabled = equippedClasses.length === 0;

    // Update apply button text if preview is still open
    if (previewClass) {
      const applyBtn = document.getElementById('classApplyBtn');
      if (applyBtn) {
        const isEquipped = equippedClasses.some(ec => ec.class.name === previewClass.name);
        applyBtn.textContent = isEquipped ? 'Apply Level' : 'Equip Class';
      }
    }
  }

  // ===========================================================================
  // CLASS PREVIEW
  // ===========================================================================
  function showClassPreview(cls, startLevel) {
    const clsImage = cls.image; // Capture before assignment for staleCheck
    previewClass = cls;
    // If the class is equipped, sync to its current level; otherwise use startLevel or default 1
    const existing = equippedClasses.find(ec => ec.class.name === cls.name);
    previewLevel = existing ? existing.level : (startLevel || 1);
    openDropdownLevel = null;

    const emptyEl = document.querySelector('.class-preview-empty');
    const contentEl = document.getElementById('classPreviewContent');

    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'flex';

    const panel = document.getElementById('class-overview-panel');
    if (panel) panel.style.display = '';

    // Scroll the step panel to the top smoothly
    const stepPanel = document.querySelector('#step-class .step-panel');
    if (stepPanel) stepPanel.scrollTo({ top: 0, behavior: 'smooth' });

    // Update image using shared helper
    const imgEl = document.getElementById('classPreviewImage');
    const wrapperEl = document.getElementById('classPreviewImageWrapper');
    loadClassImage(imgEl, wrapperEl, cls.name, {
      src: cls.image || null,
      staleCheck: () => previewClass && previewClass.image !== clsImage,
      skipInlineStyles: true
    });

    // Update name badge
    const nameBadge = document.getElementById('classPreviewNameBadge');
    if (nameBadge) nameBadge.textContent = cls.name;

    // Update tier badge
    const tierBadge = document.getElementById('classPreviewTier');
    if (tierBadge) tierBadge.textContent = `T${cls.tier}`;

    // Update roles
    const role1 = document.getElementById('classPreviewRole1');
    const role2 = document.getElementById('classPreviewRole2');
    const roles = (cls.role || '').split('/').map(r => r.trim());
    if (role1) { role1.textContent = roles[0] || ''; role1.style.display = roles[0] ? 'inline' : 'none'; }
    if (role2) { role2.textContent = roles[1] || ''; role2.style.display = roles[1] ? 'inline' : 'none'; }

    // Update requirements
    const reqEl = document.getElementById('classPreviewRequirements');
    if (reqEl) {
      const reqText = reqEl.querySelector('.req-text');
      if (reqText) reqText.textContent = decodeHtmlEntities(cls.requirements || 'None');
    }

    // Update unlock cost
    const unlockEl = document.getElementById('classPreviewUnlockCost');
    if (unlockEl) unlockEl.textContent = `${CostCalc.unlock(cls)} EXP unlock`;

    // Update level display
    const levelValue = document.getElementById('classLevelValue');
    if (levelValue) levelValue.textContent = previewLevel;

    // Update total cost + abilities grid + apply button
    updateTotalCost();
    renderAbilitiesGrid(cls);
    updateApplyButton();
  }

  function renderAbilitiesGrid(cls) {
    const col1 = document.getElementById('classAbilitiesCol1');
    const col2 = document.getElementById('classAbilitiesCol2');
    if (!col1 || !col2) return;

    col1.innerHTML = '';
    col2.innerHTML = '';

    const classAbilities = CLASS_ABILITIES_DATA[cls.name] || {};

    for (let i = 1; i <= MAX_LEVEL; i++) {
      const abilityData = classAbilities[`L${i}`] || {
        name: i === 1 ? 'Key Abilities' : `Ability ${i - 1}`,
        description: i === 1 ? 'Gain class key abilities (FREE)' : `Buy ability ${i - 1} (100 EXP)`
      };

      const abilityEl = document.createElement('div');
      abilityEl.className = 'class-ability-item';
      if (i > previewLevel) abilityEl.classList.add('locked');
      if (i === previewLevel) abilityEl.classList.add('selected');

      const levelEl = document.createElement('div');
      levelEl.className = 'class-ability-level';
      levelEl.textContent = `L${i}`;

      const nameEl = document.createElement('div');
      nameEl.className = 'class-ability-name';
      nameEl.textContent = decodeHtmlEntities(abilityData.name);

      abilityEl.appendChild(levelEl);
      abilityEl.appendChild(nameEl);

      // Dropdown container
      const dropdownEl = document.createElement('div');
      dropdownEl.className = 'class-ability-dropdown';
      if (i === openDropdownLevel) dropdownEl.classList.add('open');

      // Look up full ability data from ABILITIES_DB
      const abilityDb = typeof getAbilityData === 'function' ? getAbilityData(abilityData.name) : null;

      // Build enriched dropdown content
      let dropdownHtml = '';

      // Ability name with hyperlink
      if (abilityDb && abilityDb.url && typeof abilityLink === 'function') {
        dropdownHtml += `<div class="ability-detail-link">${abilityLink(abilityData.name)}</div>`;
      }

      // Keywords with hyperlinks
      if (abilityDb && abilityDb.keywords && abilityDb.keywords.length > 0 && typeof keywordLinks === 'function') {
        dropdownHtml += `<div class="ability-detail-keywords"><strong>Keywords:</strong> ${keywordLinks(abilityDb.keywords)}</div>`;
      }

      // Range, costs row
      const costParts = [];
      if (abilityDb) {
        if (abilityDb.range) costParts.push(`Range: ${abilityDb.range}`);
        if (abilityDb.manaCost) costParts.push(`Mana: ${abilityDb.manaCost}`);
        if (abilityDb.apCost) costParts.push(`AP: ${abilityDb.apCost}`);
        if (abilityDb.rpCost) costParts.push(`RP: ${abilityDb.rpCost}`);
      }
      if (costParts.length > 0) {
        dropdownHtml += `<div class="ability-detail-costs">${costParts.join(' | ')}</div>`;
      }

      // Requirement
      if (abilityDb && abilityDb.requirement && abilityDb.requirement !== '-') {
        dropdownHtml += `<div class="ability-detail-requirement"><strong>Requirement:</strong> ${decodeHtmlEntities(abilityDb.requirement)}</div>`;
      }

      // Description
      dropdownHtml += `<div class="ability-detail-desc">${decodeHtmlEntities(abilityData.description || 'No description available.')}</div>`;

      // Proficiencies (L1 only)
      if (i === 1 && abilityData.proficiencies && abilityData.proficiencies.length) {
        const profList = abilityData.proficiencies.map(p => window.escapeHtml(p)).join(', ');
        dropdownHtml += `<div class="ability-detail-proficiencies"><strong>Proficiencies:</strong> ${profList}</div>`;
      }

      dropdownEl.innerHTML = dropdownHtml;
      abilityEl.appendChild(dropdownEl);

      // Click to toggle dropdown and select level
      abilityEl.addEventListener('click', () => {
        openDropdownLevel = openDropdownLevel === i ? null : i;

        // If class is equipped, check EXP budget when increasing
        const existing = equippedClasses.find(ec => ec.class.name === previewClass.name);
        if (existing && i > existing.level) {
          const expDiff = CostCalc.marginal(previewClass, existing.level, i);
          if (getRemainingExp() < expDiff) {
            // Visual feedback: flash red briefly
            abilityEl.classList.add('afford-flash');
            setTimeout(() => abilityEl.classList.remove('afford-flash'), 400);
            return;
          }
          existing.level = i;
        }

        previewLevel = i;
        const lvlEl = document.getElementById('classLevelValue');
        if (lvlEl) lvlEl.textContent = i;
        renderAbilitiesGrid(cls);
        updateTotalCost();
        renderEquippedClasses(); // Sync equipped list display
      });

      if (i <= 4) col1.appendChild(abilityEl);
      else col2.appendChild(abilityEl);
    }
  }

  function updateTotalCost() {
    const costEl = document.getElementById('classPreviewTotalCost');
    if (costEl && previewClass) {
      const totalCost = CostCalc.total(previewClass, previewLevel);
      const maxCost = CostCalc.total(previewClass, MAX_LEVEL);
      const existing = equippedClasses.find(ec => ec.class.name === previewClass.name);
      let canAfford;
      if (existing) {
        const marginalCost = CostCalc.marginal(previewClass, existing.level, previewLevel);
        canAfford = getRemainingExp() >= Math.max(0, marginalCost);
      } else {
        canAfford = getRemainingExp() >= totalCost;
      }
      costEl.textContent = `${totalCost} EXP (L${previewLevel}) · ${maxCost} EXP at L8`;
      costEl.style.color = canAfford ? '#4a9c5d' : '#dc3545';
    }
  }

  function updateApplyButton() {
    const applyBtn = document.getElementById('classApplyBtn');
    if (applyBtn && previewClass) {
      const isEquipped = equippedClasses.some(ec => ec.class.name === previewClass.name);
      applyBtn.textContent = isEquipped ? 'Apply Level' : 'Equip Class';
    }
  }

  function hideClassPreview() {
    previewClass = null;
    const emptyEl = document.querySelector('.class-preview-empty');
    const contentEl = document.getElementById('classPreviewContent');
    if (emptyEl) emptyEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    const panel = document.getElementById('class-overview-panel');
    if (panel) panel.style.display = 'none';
  }

  function changePreviewLevel(delta) {
    if (!previewClass) return;
    const newLevel = previewLevel + delta;
    if (newLevel < 1 || newLevel > MAX_LEVEL) return;

    // If class is equipped, check EXP budget when increasing
    const existing = equippedClasses.find(ec => ec.class.name === previewClass.name);
    if (existing && delta > 0) {
      const expDiff = CostCalc.marginal(previewClass, existing.level, newLevel);
      if (getRemainingExp() < expDiff) return;
      existing.level = newLevel;
    }

    previewLevel = newLevel;

    const levelValue = document.getElementById('classLevelValue');
    if (levelValue) levelValue.textContent = previewLevel;

    updateTotalCost();
    renderAbilitiesGrid(previewClass);
    renderEquippedClasses(); // Sync equipped list display
  }

  // ===========================================================================
  // FILTERS
  // ===========================================================================
  function populateFilters() {
    const allRoles = new Set();
    CLASS_DATA.forEach(c => {
      if (c.role) c.role.split('/').forEach(r => allRoles.add(r.trim()));
    });
    const roles = [...allRoles].sort();
    const roleFilters = document.getElementById('role-filters');
    if (!roleFilters) return;

    // Clear previously dynamically-created role buttons (keep the static "All" button)
    const existingBtns = roleFilters.querySelectorAll('.filter-btn[data-filter="role"]:not([data-value=""])');
    existingBtns.forEach(btn => btn.remove());

    roles.forEach(r => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn';
      btn.dataset.filter = 'role';
      btn.dataset.value = r;
      btn.textContent = r;
      roleFilters.appendChild(btn);
    });

    // Use event delegation on ALL filter containers to avoid duplicate listeners on re-init
    ['tier-filters', 'role-filters', 'difficulty-filters', 'eligibility-filters'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      if (!container.dataset.filterBound) {
        container.dataset.filterBound = 'true';
        container.addEventListener('click', (e) => {
          const btn = e.target.closest('.filter-btn');
          if (!btn) return;
          const filterType = btn.dataset.filter;
          const value = btn.dataset.value;

          // Update active state in JS + DOM
          activeFilters[filterType] = value;
          document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          filterClasses();
        });
      }
    });

    // Search input (debounced for performance) — use delegation to avoid duplicates
    const searchEl = document.getElementById('class-search');
    if (searchEl && !searchEl.dataset.searchBound) {
      searchEl.dataset.searchBound = 'true';
      let searchTimeout;
      searchEl.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterClasses, 150);
      });
    }
  }

  function filterClasses() {
    const searchEl = document.getElementById('class-search');
    const search = searchEl ? searchEl.value.toLowerCase() : '';

    const charData = window.getCharacterData ? window.getCharacterData() : {};
    const filtered = CLASS_DATA.filter(c => {
      if (activeFilters.tier && String(c.tier) !== String(activeFilters.tier)) return false;
      if (activeFilters.role && !(c.role || '').split('/').some(r => r.trim() === activeFilters.role)) return false;
      if (activeFilters.difficulty && String(c.difficulty) !== String(activeFilters.difficulty)) return false;
      if (search && !c.name.toLowerCase().includes(search)) return false;
      if (activeFilters.eligibility) {
        const eligible = isClassEligible(c, charData);
        if (activeFilters.eligibility === 'eligible' && !eligible) return false;
        if (activeFilters.eligibility === 'warning' && eligible) return false;
      }
      return true;
    });

    renderClasses(filtered, charData);
  }

  /**
   * Generate Angel's Sword website URL for a class.
   * URL pattern: /game/0.13.0/classes/{slug}
   * Slug is the class name in lowercase with spaces replaced by hyphens.
   */
  function getClassUrl(cls) {
    const slug = cls.name.toLowerCase().replace(/\s+/g, '-');
    return `https://rpg.angelssword.com/game/0.13.0/classes/${slug}`;
  }

  function renderClasses(classes, charData) {
    const grid = document.getElementById('class-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (classes.length === 0) {
      grid.innerHTML = '<p class="hint-text">No classes match your filters.</p>';
      return;
    }

    classes.forEach((cls, i) => {
      const eligible = isClassEligible(cls, charData);
      const isEquipped = equippedClasses.some(ec => ec.class.name === cls.name);
      const isPreviewed = previewClass && previewClass.name === cls.name;
      const card = document.createElement('div');
      card.className = 'class-card' +
        (isEquipped ? ' selected' : '') +
        (isPreviewed ? ' previewed' : '') +
        (!eligible ? ' requirements-warning' : '');
      card.dataset.index = i;
      if (!eligible) card.title = `Requires: ${cls.requirements || 'Unknown'}`;

      // Image using shared helper
      if (cls.image) {
        const imgEl = document.createElement('img');
        imgEl.className = 'class-card-image';
        loadClassImage(imgEl, null, cls.name, {
          src: cls.image,
          width: '100%',
          height: '100%',
          onFallback: () => {
            imgEl.style.display = 'none';
            card.classList.add('no-image');
            const initial = document.createElement('div');
            initial.className = 'class-card-initial';
            initial.textContent = cls.name.charAt(0);
            card.appendChild(initial);
          }
        });
        card.appendChild(imgEl);
      } else {
        card.classList.add('no-image');
        const initial = document.createElement('div');
        initial.className = 'class-card-initial';
        initial.textContent = cls.name.charAt(0);
        card.appendChild(initial);
      }

      // Overlay
      const overlay = document.createElement('div');
      overlay.className = 'class-card-overlay';

      const tierBadge = document.createElement('div');
      tierBadge.className = `class-card-tier tier-${cls.tier}`;
      tierBadge.textContent = `T${cls.tier}`;

      const bottomInfo = document.createElement('div');
      bottomInfo.className = 'class-card-info';

      const name = document.createElement('div');
      name.className = 'class-card-name';
      name.textContent = cls.name;

      const role = document.createElement('div');
      role.className = 'class-card-role';
      role.textContent = cls.role || 'N/A';

      // "See details" link to Angel's Sword website
      const detailsLink = document.createElement('a');
      detailsLink.className = 'race-details-btn';
      detailsLink.href = getClassUrl(cls);
      detailsLink.target = '_blank';
      detailsLink.rel = 'noopener noreferrer';
      detailsLink.textContent = 'See details';

      bottomInfo.appendChild(name);
      bottomInfo.appendChild(role);
      bottomInfo.appendChild(detailsLink);
      overlay.appendChild(tierBadge);
      overlay.appendChild(bottomInfo);
      card.appendChild(overlay);

      card.addEventListener('click', (e) => {
        // Don't trigger preview if clicking the "See details" link
        if (e.target.closest('.race-details-btn')) return;
        if (previewClass && previewClass.name === cls.name) {
          // Click on already-previewed class → dismiss overview
          hideClassPreview();
        } else {
          showClassPreview(cls);
        }
      });
      grid.appendChild(card);
    });

    // Animate cards
    if (window.gsap) {
      gsap.fromTo(grid.querySelectorAll('.class-card'),
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  function getSelection() {
    const primary = equippedClasses.length > 0 ? {
      class: equippedClasses[0].class,
      level: equippedClasses[0].level,
      abilitiesBought: equippedClasses[0].level - 1
    } : null;
    return {
      primary: primary,
      all: equippedClasses.map(ec => ({
        class: ec.class,
        level: ec.level,
        abilitiesBought: ec.level - 1
      })),
      spiritCore: getSpiritCoreLevel()
    };
  }

  function refresh() {
    filterClasses();
    updateOverviewStats(); // Re-sync Spirit Core with breakthrough spending
  }

  function init() {
    populateFilters();
    renderEquippedClasses();
    const charData = window.getCharacterData ? window.getCharacterData() : {};
    renderClasses(CLASS_DATA, charData);
    bindPreviewEvents();
  }

  function bindPreviewEvents() {
    if (previewEventsBound) return; // Prevent duplicate listeners
    previewEventsBound = true;

    const decreaseBtn = document.getElementById('classLevelDecrease');
    const increaseBtn = document.getElementById('classLevelIncrease');
    const applyBtn = document.getElementById('classApplyBtn');

    if (decreaseBtn) decreaseBtn.addEventListener('click', () => changePreviewLevel(-1));
    if (increaseBtn) increaseBtn.addEventListener('click', () => changePreviewLevel(1));
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (previewClass) {
          equipClass(previewClass);
          updateApplyButton();
        }
      });
    }
  }

  function reset() {
    // Clear pending image timeouts
    imageTimeouts.forEach(id => clearTimeout(id));
    imageTimeouts = [];

    equippedClasses = [];
    previewClass = null;
    previewLevel = 1;
    openDropdownLevel = null;
    activeFilters = { tier: '', role: '', eligibility: '', difficulty: '' };
    // Note: do NOT reset previewEventsBound — preview panel buttons are static DOM
    // elements whose event listeners persist across reset cycles.
    TOTAL_IP = 3;
    TOTAL_CLASS_EXP = 1000;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="tier"][data-value=""]')?.classList.add('active');
    document.querySelector('[data-filter="role"][data-value=""]')?.classList.add('active');
    document.querySelector('[data-filter="difficulty"][data-value=""]')?.classList.add('active');
    document.querySelector('[data-filter="eligibility"][data-value=""]')?.classList.add('active');
    const searchEl = document.getElementById('class-search');
    if (searchEl) searchEl.value = '';
    renderEquippedClasses();
    hideClassPreview();
    const charData = window.getCharacterData ? window.getCharacterData() : {};
    renderClasses(CLASS_DATA, charData);
  }

  function setStartingIp(val) {
    TOTAL_IP = Math.max(0, parseInt(val) || 3);
    updateOverviewStats();
  }

  function setStartingExp(val) {
    TOTAL_CLASS_EXP = Math.max(0, parseInt(val) || 1000);
    updateOverviewStats();
  }

  /**
   * Restore a previously saved class selection.
   * Called when navigating back to this step or loading from localStorage.
   * clsData shape: { primary: { class, level }, all: [{ class, level }], spiritCore }
   */
  function restoreState(clsData) {
    if (!clsData) return;

    // Clear current state
    equippedClasses = [];

    // Restore from cls.all (or fall back to primary)
    const classesToRestore = (clsData.all && clsData.all.length > 0)
      ? clsData.all
      : (clsData.primary ? [clsData.primary] : []);

    classesToRestore.forEach(entry => {
      const classDef = entry.class;
      const level = entry.level || 1;
      // Look up class from CLASS_DATA by id or name
      const cls = CLASS_DATA.find(c =>
        c.id === classDef.id || c.name === classDef.name
      );
      if (cls) {
        equippedClasses.push({ class: cls, level });
      }
    });

    // Restore Spirit Core if saved
    if (clsData.spiritCore != null) {
      // Spirit Core is tracked separately — restore it
      // (the overview panel will show the correct value)
    }

    // Validate restored classes against current EXP/IP budget.
    // If the total cost exceeds budget, remove classes in reverse order
    // until the selection is affordable. This prevents corrupted saves
    // or budget changes (e.g., Slow Starter) from producing negative budgets.
    while (equippedClasses.length > 0) {
      const totalExp = getTotalExpSpent();
      const totalIp = equippedClasses.length;
      if (totalExp <= TOTAL_CLASS_EXP && totalIp <= TOTAL_IP) break;
      equippedClasses.pop();
    }

    renderEquippedClasses();
    filterClasses();
  }

  /**
   * Calculate remaining class EXP from equipped classes and the current budget.
   * Used by the breakthrough scene for dual-pool EXP spending.
   */
  function getRemainingClassExp() {
    return Math.max(0, TOTAL_CLASS_EXP - getTotalExpSpent());
  }

  /**
   * Return the current total class EXP budget (may differ from 1000 if user changed Starting EXP).
   */
  function getTotalClassExpBudget() {
    return TOTAL_CLASS_EXP;
  }

  /**
   * Return EXP spent on classes only (base Spirit Core, NOT including breakthrough spending).
   */
  function getClassExpSpent() {
    return getTotalExpSpent();
  }

  return { init, getSelection, reset, refresh, setStartingIp, setStartingExp, restoreState, CostCalc, getRemainingClassExp, getTotalClassExpBudget, getClassExpSpent };
})();
