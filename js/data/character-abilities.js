// Lyrian Chronicles - Character Ability Aggregation
// Unified pools for all character abilities and proficiencies

/* exported getAllCharacterAbilities */

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
  
  // 1b. Ancestry traits (comma-separated attributes string → ability objects)
  if (characterData.ancestry) {
    const ancestryAbilities = getAncestryAbilities(characterData.ancestry);
    abilities.push(...ancestryAbilities);
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
 * Get abilities granted by an ancestry (subrace)
 * Parses comma-separated attributes string → ability objects with descriptions from TRAIT_DESCRIPTIONS
 * @param {Object} ancestryData - Ancestry data from ANCESTRY_MAP
 * @returns {Array} Array of ability objects
 */
function getAncestryAbilities(ancestryData) {
  if (!ancestryData || !ancestryData.attributes) return [];
  
  const abilities = [];
  const descDb = typeof TRAIT_DESCRIPTIONS !== 'undefined' ? TRAIT_DESCRIPTIONS : {};
  
  const traits = typeof ancestryData.attributes === 'string'
    ? ancestryData.attributes.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  
  traits.forEach(trait => {
    abilities.push({
      name: trait,
      description: descDb[trait] || '',
      source: 'ancestry',
      sourceName: ancestryData.name
    });
  });
  
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

// ponytail: getAllCharacterProficiencies removed — dead code, never called.
// Use getCharacterProficiencies() from calculations.js instead (single source of truth).
