// Lyrian Chronicles - Character Ability Aggregation
// Unified pools for all character abilities and proficiencies

/* exported getAllCharacterAbilities, getAllCharacterProficiencies */

/**
 * Get all active abilities for a character
 * Combines: race abilities, class abilities (by level), breakthrough abilities
 * @param {Object} characterData - Full character data
 * @returns {Array} Array of ability objects with name, description, source
 */
function getAllCharacterAbilities(characterData) {
  if (!characterData) return [];
  
  const abilities = [];
  
  // 1. Race abilities (from race data)
  if (characterData.race) {
    const raceAbilities = getRaceAbilities(characterData.race);
    abilities.push(...raceAbilities);
  }
  
  // 2. Class abilities (based on level)
  // cls shape: { primary: { class, level }, all: [{ class, level }], spiritCore: number }
  const classList = (characterData.cls && Array.isArray(characterData.cls.all))
    ? characterData.cls.all
    : (Array.isArray(characterData.cls) ? characterData.cls : []);
  classList.forEach(clsData => {
    if (clsData.class && clsData.level) {
      const classAbilities = getClassAbilities(clsData.class, clsData.level);
      abilities.push(...classAbilities);
    }
  });
  
  // 3. Breakthrough abilities
  if (characterData.breakthroughs && Array.isArray(characterData.breakthroughs)) {
    characterData.breakthroughs.forEach(bt => {
      if (bt && bt.name) {
        const btAbilities = getBreakthroughAbilities(bt);
        abilities.push(...btAbilities);
      }
    });
  }
  
  return abilities;
}

/**
 * Get abilities granted by a race
 * @param {Object} raceData - Race data from RACE_DATA
 * @returns {Array} Array of ability objects
 */
function getRaceAbilities(raceData) {
  if (!raceData || !raceData.name) return [];
  
  const abilities = [];
  
  // Check for racial abilities in the race data
  if (raceData.abilities && Array.isArray(raceData.abilities)) {
    raceData.abilities.forEach(ability => {
      abilities.push({
        name: ability.name || ability,
        description: ability.description || '',
        source: 'race',
        sourceName: raceData.name
      });
    });
  }
  
  // Some races have abilities described in their description field
  // This would need to be parsed out if the data structure supports it
  
  return abilities;
}

/**
 * Get abilities granted by a class at a specific level
 * @param {string} className - Class name
 * @param {number} level - Class level (1-8)
 * @returns {Array} Array of ability objects
 */
function getClassAbilities(className, level) {
  if (!className || !CLASS_ABILITIES_DATA[className]) return [];
  
  const abilities = [];
  const classData = CLASS_ABILITIES_DATA[className];
  
  // Get abilities for all levels up to and including the current level
  for (let lvl = 1; lvl <= level; lvl++) {
    const levelKey = 'L' + lvl;
    if (classData[levelKey]) {
      const abilityData = classData[levelKey];
      abilities.push({
        name: abilityData.name,
        description: abilityData.description,
        source: 'class',
        sourceName: className,
        level: lvl
      });
    }
  }
  
  return abilities;
}

/**
 * Get abilities granted by a breakthrough
 * @param {Object} breakthroughData - Breakthrough data
 * @returns {Array} Array of ability objects
 */
function getBreakthroughAbilities(breakthroughData) {
  if (!breakthroughData || !breakthroughData.name) return [];
  
  const abilities = [];
  
  // Check for abilities in the breakthrough data
  if (breakthroughData.abilities && Array.isArray(breakthroughData.abilities)) {
    breakthroughData.abilities.forEach(ability => {
      abilities.push({
        name: ability.name || ability,
        description: ability.description || '',
        source: 'breakthrough',
        sourceName: breakthroughData.name
      });
    });
  }
  
  // Some breakthroughs have abilities in their effects array
  if (breakthroughData.effects && Array.isArray(breakthroughData.effects)) {
    breakthroughData.effects.forEach(effect => {
      if (effect.name && effect.description) {
        abilities.push({
          name: effect.name,
          description: effect.description,
          source: 'breakthrough',
          sourceName: breakthroughData.name
        });
      }
    });
  }
  
  return abilities;
}

/**
 * Get all proficiencies for a character
 * Combines: race proficiencies, class proficiencies, breakthrough proficiencies
 * @param {Object} characterData - Full character data
 * @returns {Array} Array of unique proficiency strings
 */
function getAllCharacterProficiencies(characterData) {
  if (!characterData) return [];
  
  const proficiencies = new Set();
  
  // 1. Race proficiencies
  if (characterData.race) {
    const raceProfs = getRaceProficiencies(characterData.race);
    raceProfs.forEach(p => proficiencies.add(p));
  }
  
  // 2. Class proficiencies (based on level)
  // cls shape: { primary: { class, level }, all: [{ class, level }], spiritCore: number }
  const classList = (characterData.cls && Array.isArray(characterData.cls.all))
    ? characterData.cls.all
    : (Array.isArray(characterData.cls) ? characterData.cls : []);
  classList.forEach(clsData => {
    if (clsData.class && clsData.level) {
      const classProfs = getClassProficiencies(clsData.class, clsData.level);
      classProfs.forEach(p => proficiencies.add(p));
    }
  });
  
  // 3. Breakthrough proficiencies
  if (characterData.breakthroughs && Array.isArray(characterData.breakthroughs)) {
    characterData.breakthroughs.forEach(bt => {
      if (bt && bt.name) {
        const btProfs = getBreakthroughProficiencies(bt);
        btProfs.forEach(p => proficiencies.add(p));
      }
    });
  }
  
  return Array.from(proficiencies);
}

/**
 * Get proficiencies granted by a race
 * @param {Object} raceData - Race data from RACE_DATA
 * @returns {Array} Array of proficiency strings
 */
function getRaceProficiencies(raceData) {
  if (!raceData || !raceData.proficiencies) return [];
  
  if (Array.isArray(raceData.proficiencies)) {
    return raceData.proficiencies;
  }
  
  return [];
}

/**
 * Get proficiencies granted by a class at a specific level
 * @param {string} className - Class name
 * @param {number} level - Class level (1-8)
 * @returns {Array} Array of proficiency strings
 */
function getClassProficiencies(className, level) {
  if (!className || !CLASS_ABILITIES_DATA[className]) return [];
  
  const proficiencies = [];
  const classData = CLASS_ABILITIES_DATA[className];
  
  // Get proficiencies for all levels up to and including the current level
  for (let lvl = 1; lvl <= level; lvl++) {
    const levelKey = 'L' + lvl;
    if (classData[levelKey] && classData[levelKey].proficiencies) {
      const levelProfs = classData[levelKey].proficiencies;
      if (Array.isArray(levelProfs)) {
        levelProfs.forEach(p => proficiencies.push(p));
      }
    }
  }
  
  return proficiencies;
}

/**
 * Get proficiencies granted by a breakthrough
 * @param {Object} breakthroughData - Breakthrough data
 * @returns {Array} Array of proficiency strings
 */
function getBreakthroughProficiencies(breakthroughData) {
  if (!breakthroughData || !breakthroughData.proficiencies) return [];
  
  if (Array.isArray(breakthroughData.proficiencies)) {
    return breakthroughData.proficiencies;
  }
  
  return [];
}
