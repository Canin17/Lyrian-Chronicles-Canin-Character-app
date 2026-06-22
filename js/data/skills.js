// Lyrian Chronicles RPG - Skills Data
// 5 skill groups, 17 main skills total
// Source: Lyrian Chronicles system rulebook
// Per-source allocation tracking with restricted skill lists

/* exported SKILL_GROUPS, SKILL_GRANTING_BREAKTHROUGHS, EXPERTISE_MULTIPLIER, BASE_SKILL_POINTS, calculateAvailableSkillPoints, getRemainingPoints, deepCloneSkillGroups, canAddExpertise, isCraftingGatheringSkill, getEffectiveSkillCap, getRaceSkillPoints, SKILL_EXPERTISE_EXAMPLES, parseExpertiseString, serializeExpertiseArray, calculateExpertisePoints */
const SKILL_GROUPS = [
  {
    name: 'Fitness',
    subStat: 'fitness',
    skills: [
      { name: 'Athletics', pts: 0, expertise: '' },
      { name: 'Riding', pts: 0, expertise: '' }
    ]
  },
  {
    name: 'Cunning',
    subStat: 'cunning',
    skills: [
      { name: 'Deception', pts: 0, expertise: '' },
      { name: 'Roguecraft', pts: 0, expertise: '' },
      { name: 'Stealth', pts: 0, expertise: '' }
    ]
  },
  {
    name: 'Reason',
    subStat: 'reason',
    skills: [
      { name: 'Artifice', pts: 0, expertise: '' },
      { name: 'Appraise', pts: 0, expertise: '' },
      { name: 'Common Knowledge', pts: 0, expertise: '' },
      { name: 'Flight', pts: 0, expertise: '' },
      { name: 'History', pts: 0, expertise: '' },
      { name: 'Linguistics', pts: 0, expertise: '' },
      { name: 'Magic', pts: 0, expertise: '' },
      { name: 'Medicine', pts: 0, expertise: '' },
      { name: 'Religion', pts: 0, expertise: '' }
    ]
  },
  {
    name: 'Awareness',
    subStat: 'awareness',
    skills: [
      { name: 'Animal Husbandry', pts: 0, expertise: '' },
      { name: 'Insight', pts: 0, expertise: '' },
      { name: 'Perception', pts: 0, expertise: '' },
      { name: 'Survival', pts: 0, expertise: '' }
    ]
  },
  {
    name: 'Presence',
    subStat: 'presence',
    skills: [
      { name: 'Art', pts: 0, expertise: '' },
      { name: 'Intimidation', pts: 0, expertise: '' },
      { name: 'Negotiation', pts: 0, expertise: '' }
    ]
  }
];

const SKILL_CAP = 15;

// Base skill points at character creation
const BASE_SKILL_POINTS = 10;

// Expertise: 1 skill point = 2 expertise points
const EXPERTISE_MULTIPLIER = 2;

// Artisan skills — cannot be selected by normal skill-granting features
// unless explicitly mentioned. Cap is 10 pts (not 15).
const ARTISAN_SKILLS = ['Blacksmith', 'Alchemist', 'Farmer'];

// Crafting/gathering skills excluded from "any non-crafting" grants
const CRAFTING_GATHERING_SKILLS = ['Artifice', 'Appraise'];

// ===========================================================================
// EXPERTISE EXAMPLES — Rulebook-compliant suggestions per skill
// Source: https://rpg.angelssword.com/game/latest/rulebook
// ===========================================================================
const SKILL_EXPERTISE_EXAMPLES = {
  'Athletics': ['Swimming', 'Jumping', 'Climbing', 'Basketball'],
  'Riding': ['Horses', 'Raptors', 'Giant Rabbits'],
  'Deception': ['Distraction', 'Lying'],
  'Roguecraft': ['Lockpicking', 'Jury Rigging', 'Traps'],
  'Stealth': ['Forests', 'Urban', 'Snow'],
  'Artifice': ['Craftsmanship', 'Swords', 'Guns', 'Manufacturers'],
  'Appraise': ['Gemstone Grading', 'Antique Weapons', 'Merchant Guild Valuations', 'Forgery Detection'],
  'Common Knowledge': ['Airships', 'Forests', 'Physics', 'Chemistry'],
  'Linguistics': ['Cyphers'],
  'Flight': ['Cruiser-Class Airships', 'Aerial Staves', 'Airship Shields', 'Airship Engines', 'Airship Navigation'],
  'History': ['Westrian History', 'Northi Noble Houses', 'Royal Etiquette', 'Battlefield Command'],
  'Magic': ['Dispel', 'Magic Hacking', 'Fire Magic', 'Magic Traps'],
  'Medicine': ['Natural Medicines', 'Biology: Humans'],
  'Religion': ['Faith Spell Identification', 'Church of Westria'],
  'Animal Husbandry': ['Horses', 'Hawks', 'Raptors'],
  'Insight': ['Body Language', 'Handwriting'],
  'Perception': ['Urban', 'Forest', 'Snow', 'Hearing'],
  'Survival': ['Improvised Cooking', 'Wayfinding', 'Forest Survival', 'Fishing'],
  'Art': ['Cartography', 'Memory Drawing', 'Singing', 'Dancing'],
  'Intimidation': ['Mercantile', 'Nobility', 'Commonfolk'],
  'Negotiation': ['Mercantile', 'Nobility', 'Commonfolk']
};

// ===========================================================================
// EXPERTISE PERSISTENCE — Parse/serialize "Name (X pts), Name2 (Y pts)"
// Backwards-compatible with legacy skill.expertise string format.
// ===========================================================================
/**
 * Parse a comma-separated expertise string like "Forests (4 pts), Deserts (2 pts)"
 * into an array of { name: string, pts: number } objects.
 */
function parseExpertiseString(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(part => {
    part = part.trim();
    if (!part) return null;
    const match = part.match(/^(.+?)(?:\s*\((\d+)\s*pts?\))?$/);
    if (!match) return null;
    const name = match[1].trim();
    const pts = match[2] ? parseInt(match[2], 10) : 2; // Default to +2 if unspecified
    return name ? { name, pts } : null;
  }).filter(Boolean);
}

/**
 * Serialize an array of { name: string, pts: number } back to "Name (X pts), Name2 (Y pts)" format.
 */
function serializeExpertiseArray(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .filter(e => e && e.name && e.pts > 0)
    .map(e => `${e.name} (${e.pts} pts)`)
    .join(', ');
}

// ===========================================================================
// RACE SKILL DATA — All 5 races grant +5 skill points with restricted lists
// Source: Angel's Sword API + Foundry compendium flags
// ===========================================================================
const RACE_SKILL_DATA = {
  'Chimera': {
    skillPoints: 5,
    allowedSkills: ['Magic', 'Survival', 'Animal Husbandry', 'Perception', 'Insight', 'Linguistics', 'Artifice']
  },
  'Demon': {
    skillPoints: 5,
    allowedSkills: ['Common Knowledge', 'Magic', 'Religion', 'History', 'Flight', 'Artifice']
  },
  'Fae': {
    skillPoints: 5,
    allowedSkills: ['Magic', 'Medicine', 'Negotiation', 'Intimidation', 'Insight']
  },
  'Human': {
    skillPoints: 5,
    allowedSkills: 'any-except-crafting-gathering' // Resolved at runtime
  },
  'Youkai': {
    skillPoints: 5,
    allowedSkills: ['Insight', 'Intimidation', 'Magic', 'Medicine', 'Negotiation']
  }
};

// ===========================================================================
// CLASS SKILL DATA — ALL classes grant +5 skill points at Level 3
// with class-specific allowed skills. Expertise exchange allowed.
// Source: https://rpg.angelssword.com/game/latest/classes/{slug}
// Format: "You gain +5 skill points to spend in [Skill List]."
// ===========================================================================
const CLASS_SKILL_DATA = {
  // --- Verified from website ---
  'Abjurer': ['Athletics', 'Medicine', 'Magic', 'Religion', 'History', 'Flight', 'Artifice', 'Common Knowledge'],
  'Acolyte': ['Appraise', 'Medicine', 'Religion', 'Magic', 'History', 'Insight', 'Negotiation', 'Intimidation', 'Common Knowledge'],
  'Adventurer': 'any-except-crafting-gathering',
  'Aeromancer': ['Medicine', 'Magic', 'Religion', 'History', 'Flight', 'Artifice', 'Common Knowledge'],
  'Ranger': ['Appraise', 'Athletics', 'Stealth', 'Medicine', 'Perception', 'Survival', 'Animal Husbandry', 'Common Knowledge'],
  'Rogue': ['Appraise', 'Athletics', 'Stealth', 'Deception', 'Roguecraft', 'Perception', 'Insight', 'Negotiation', 'Intimidation', 'Common Knowledge'],
  'Mage': ['Appraise', 'Medicine', 'Magic', 'Religion', 'History', 'Flight', 'Artifice', 'Common Knowledge'],
  'Sorcerer': ['Appraise', 'Medicine', 'Magic', 'Religion', 'History', 'Flight', 'Artifice', 'Common Knowledge'],

  // --- Estimated by role patterns ---
  // Striker / Assault classes → Athletics, Intimidation, Deception, Roguecraft, Survival, Common Knowledge
  'Fighter': ['Athletics', 'Intimidation', 'Deception', 'Roguecraft', 'Survival', 'Common Knowledge'],
  'Berserker': ['Athletics', 'Intimidation', 'Deception', 'Roguecraft', 'Survival', 'Common Knowledge'],
  'Gunlancer': ['Athletics', 'Intimidation', 'Deception', 'Roguecraft', 'Survival', 'Common Knowledge'],
  'Sword Paladin': ['Athletics', 'Intimidation', 'Negotiation', 'Religion', 'History', 'Common Knowledge'],
  'Shield Paladin': ['Athletics', 'Intimidation', 'Negotiation', 'Religion', 'History', 'Common Knowledge'],
  'Gun Paladin': ['Athletics', 'Intimidation', 'Negotiation', 'Religion', 'History', 'Common Knowledge'],
  'Martial Artist': ['Athletics', 'Perception', 'Insight', 'Medicine', 'Intimidation', 'Common Knowledge'],
  'Bloodbinder': ['Athletics', 'Intimidation', 'Deception', 'Magic', 'Medicine', 'Common Knowledge'],
  'Chronofighter': ['Athletics', 'Perception', 'Stealth', 'Magic', 'History', 'Common Knowledge'],
  'Grandmaster': ['Athletics', 'Perception', 'Insight', 'Medicine', 'Intimidation', 'Common Knowledge'],
  'Temporal Trickster': ['Deception', 'Stealth', 'Roguecraft', 'Magic', 'History', 'Common Knowledge'],
  'Phantom Thief': ['Deception', 'Stealth', 'Roguecraft', 'Appraise', 'Negotiation', 'Common Knowledge'],
  'Valkyrie': ['Athletics', 'Intimidation', 'Perception', 'Religion', 'History', 'Common Knowledge'],
  'Cavalier': ['Athletics', 'Riding', 'Intimidation', 'Perception', 'Survival', 'Common Knowledge'],
  'Onmyoji': ['Magic', 'Religion', 'History', 'Perception', 'Insight', 'Common Knowledge'],
  'Alkahest': ['Artifice', 'Magic', 'History', 'Common Knowledge'],

  // Healer / Support → Medicine, Magic, Religion, Insight, Negotiation, Common Knowledge
  'High Priest': ['Medicine', 'Magic', 'Religion', 'Insight', 'Negotiation', 'Common Knowledge'],
  'Priest': ['Medicine', 'Magic', 'Religion', 'Insight', 'Negotiation', 'Common Knowledge'],
  'Medic': ['Medicine', 'Magic', 'Religion', 'Insight', 'Negotiation', 'Common Knowledge'],
  'Idol': ['Art', 'Negotiation', 'Intimidation', 'Insight', 'Deception', 'Common Knowledge'],
  'Maid': ['Medicine', 'Cooking', 'Negotiation', 'Insight', 'Perception', 'Common Knowledge'],
  'Aetherie': ['Magic', 'Religion', 'History', 'Insight', 'Medicine', 'Common Knowledge'],

  // Controller / Mage → Magic, Religion, History, Artifice, Common Knowledge, Flight
  'Abjurist': ['Athletics', 'Medicine', 'Magic', 'Religion', 'History', 'Flight', 'Artifice', 'Common Knowledge'],
  'Artificer': ['Artifice', 'Appraise', 'Common Knowledge', 'History', 'Magic', 'Medicine', 'Linguistics'],
  'Alchemist': ['Artifice', 'Medicine', 'Magic', 'Appraise', 'Common Knowledge', 'History'],
  'Blacksmith': ['Artifice', 'Appraise', 'Common Knowledge', 'History', 'Athletics', 'Intimidation'],
  'Culinarian': ['Medicine', 'Appraise', 'Negotiation', 'Common Knowledge', 'History', 'Insight'],
  'Alchemeister': ['Artifice', 'Magic', 'Medicine', 'History', 'Common Knowledge', 'Appraise'],
  'Aerial Mage': ['Magic', 'Flight', 'History', 'Artifice', 'Common Knowledge', 'Perception'],
  'Cannoneer': ['Artifice', 'Athletics', 'Perception', 'Common Knowledge', 'History', 'Intimidation'],
  'Naturalist': ['Magic', 'Survival', 'Animal Husbandry', 'Perception', 'Medicine', 'Common Knowledge'],
  'Fae Knight': ['Magic', 'Athletics', 'Intimidation', 'Negotiation', 'Insight', 'Common Knowledge'],
  'Fae Knight: Willow Style': ['Magic', 'Athletics', 'Intimidation', 'Negotiation', 'Insight', 'Common Knowledge'],

  // Summoner → Animal Husbandry, Magic, Religion, Nature skills, Common Knowledge
  'Summoner': ['Animal Husbandry', 'Magic', 'Religion', 'Survival', 'Perception', 'Common Knowledge'],
  'Animal Summoner': ['Animal Husbandry', 'Survival', 'Perception', 'Insight', 'Magic', 'Common Knowledge'],
  'Necromancer': ['Magic', 'Religion', 'History', 'Intimidation', 'Medicine', 'Common Knowledge'],

  // Defender / Tank → Athletics, Intimidation, Perception, History, Common Knowledge
  'Guardian': ['Athletics', 'Intimidation', 'Perception', 'History', 'Negotiation', 'Common Knowledge'],
  'Sentinel': ['Athletics', 'Intimidation', 'Perception', 'History', 'Negotiation', 'Common Knowledge'],

  // Special classes
  'Merchant': ['Appraise', 'Negotiation', 'Deception', 'Common Knowledge', 'History', 'Linguistics'],
  'Angelblooded': ['Magic', 'Religion', 'Negotiation', 'Insight', 'Medicine', 'Common Knowledge'],

  // Filler for remaining classes — use role-based defaults
  // These should be verified against the website later
};

// Default skill list for classes not in CLASS_SKILL_DATA
const DEFAULT_CLASS_SKILLS = ['Athletics', 'Deception', 'Stealth', 'Appraise', 'Common Knowledge', 'History', 'Perception', 'Insight', 'Survival', 'Negotiation', 'Intimidation'];

// ===========================================================================
// BREAKTHROUGH SKILL GRANTS
// Source: breakthroughs.json — Skill Training & Universal Training
// ===========================================================================
const SKILL_GRANTING_BREAKTHROUGHS = {
  'Skill Training': {
    pointsPerInstance: 1,
    allowedSkills: 'any-except-crafting-gathering',
    expertiseAllowed: true // "1 skill point OR 2 expertise points"
  },
  'Universal Training': {
    pointsPerInstance: 5,
    allowedSkills: 'any-except-crafting-gathering',
    expertiseAllowed: true
  }
};

// ===========================================================================
// Helper: Resolve shorthand allowed skills to actual skill name arrays
// ===========================================================================
function resolveAllowedSkills(specifier) {
  if (!specifier) return getAllSkillNames();
  if (typeof specifier === 'string') {
    if (specifier === 'any-except-crafting-gathering') {
      return getAllSkillNames().filter(s => !CRAFTING_GATHERING_SKILLS.includes(s));
    }
    if (specifier === 'all') return getAllSkillNames();
  }
  if (Array.isArray(specifier)) return [...specifier];
  return getAllSkillNames();
}

function getAllSkillNames() {
  return SKILL_GROUPS.flatMap(g => g.skills.map(s => s.name));
}

// ===========================================================================
// RACE SKILL POINTS
// ===========================================================================
function getRaceSkillPoints(raceName, _ancestryName) {
  if (!raceName) return { points: 0, eligibleSkills: [] };

  // Case-insensitive lookup
  const raceData = Object.entries(RACE_SKILL_DATA).find(
    ([key]) => key.toLowerCase() === raceName.toLowerCase()
  );

  if (!raceData) return { points: 0, eligibleSkills: [] };

  const [, data] = raceData;
  return {
    points: data.skillPoints,
    eligibleSkills: resolveAllowedSkills(data.allowedSkills)
  };
}

// ===========================================================================
// CLASS SKILL POINTS — ALL classes grant +5 at Level 3
// ===========================================================================
/**
 * Get the skill data for a specific class.
 * Returns { skillPoints: 5, allowedSkills: [...] } or null if unknown.
 */
function getClassSkillData(className) {
  if (!className) return null;

  // Exact match first
  if (CLASS_SKILL_DATA.hasOwnProperty(className)) {
    return {
      skillPoints: 5,
      allowedSkills: resolveAllowedSkills(CLASS_SKILL_DATA[className])
    };
  }

  // Case-insensitive fallback
  const entry = Object.entries(CLASS_SKILL_DATA).find(
    ([key]) => key.toLowerCase() === className.toLowerCase()
  );
  if (entry) {
    return {
      skillPoints: 5,
      allowedSkills: resolveAllowedSkills(entry[1])
    };
  }

  // Unknown class — use default list
  return {
    skillPoints: 5,
    allowedSkills: [...DEFAULT_CLASS_SKILLS]
  };
}

/**
 * Calculate skill points granted by equipped classes.
 * Each class grants +5 skill points at Level 3 with specific allowed skills.
 * Returns { points, eligibleSkills, perClass: [...] } with per-class breakdown.
 *
 * Accepts either:
 * - Full class selection: { primary: { class, level }, all: [{ class, level }] }
 * - Single class object: { name, tier, ... }
 */
function getClassSkillPoints(cls) {
  if (!cls) return { points: 0, eligibleSkills: [], perClass: [] };

  // Normalize to array of { class, level }
  let classes;
  if (cls.all && Array.isArray(cls.all)) {
    classes = cls.all;
  } else if (cls.primary) {
    classes = [cls.primary];
  } else {
    // Single class object
    classes = [{ class: cls, level: 1 }];
  }

  let totalPoints = 0;
  const perClass = [];
  const allEligible = new Set();

  classes.forEach(entry => {
    const classObj = entry.class || entry;
    const level = entry.level || 1;
    const className = classObj.name || classObj;

    // Class grants +5 skill points at Level 3
    // At character creation, classes start at Level 1 (unlock + key abilities free)
    // Level 3 is reached after buying 2 abilities (Level 2 + Level 3)
    // For character creation in the standalone creator, we check if the class
    // has been leveled to 3+ OR if abilitiesBought >= 2
    const abilitiesBought = entry.abilitiesBought || 0;
    const effectiveLevel = Math.max(level, 1 + abilitiesBought);

    // Class skill grant unlocks at Level 3
    if (effectiveLevel < 3) {
      perClass.push({
        className,
        level: effectiveLevel,
        points: 0,
        eligibleSkills: [],
        unlocked: false
      });
      return;
    }

    const skillData = getClassSkillData(className);
    const pts = skillData ? skillData.skillPoints : 5;
    const eligible = skillData ? skillData.allowedSkills : [...DEFAULT_CLASS_SKILLS];

    totalPoints += pts;
    eligible.forEach(s => allEligible.add(s));

    perClass.push({
      className,
      level: effectiveLevel,
      points: pts,
      eligibleSkills: eligible,
      unlocked: true
    });
  });

  return {
    points: totalPoints,
    eligibleSkills: [...allEligible],
    perClass
  };
}

// ===========================================================================
// BREAKTHROUGH SKILL POINTS
// ===========================================================================
/**
 * Calculate skill points granted by selected breakthroughs.
 * Detects "Skill Training" and "Universal Training" by name.
 * Both are repeatable — count duplicates for stacking.
 *
 * Returns { points, eligibleSkills, perBreakthrough: [...] }
 */
function getBreakthroughSkillPoints(breakthroughs) {
  if (!Array.isArray(breakthroughs)) return { points: 0, eligibleSkills: [], perBreakthrough: [] };

  // Count instances of skill-granting breakthroughs
  const counts = {};
  breakthroughs.forEach(bt => {
    const name = typeof bt === 'string' ? bt : (bt.name || '');
    if (SKILL_GRANTING_BREAKTHROUGHS[name]) {
      counts[name] = (counts[name] || 0) + 1;
    }
  });

  let totalPoints = 0;
  const allEligible = new Set();
  const perBreakthrough = [];

  for (const [name, count] of Object.entries(counts)) {
    const config = SKILL_GRANTING_BREAKTHROUGHS[name];
    const eligible = resolveAllowedSkills(config.allowedSkills);
    const pts = config.pointsPerInstance * count;

    totalPoints += pts;
    eligible.forEach(s => allEligible.add(s));

    perBreakthrough.push({
      name,
      count,
      points: pts,
      eligibleSkills: eligible,
      expertiseAllowed: config.expertiseAllowed
    });
  }

  return {
    points: totalPoints,
    eligibleSkills: [...allEligible],
    perBreakthrough
  };
}

// ===========================================================================
// TOTAL AVAILABLE SKILL POINTS — Multi-source aggregation
// ===========================================================================
/**
 * Calculate total available skill points from all sources.
 * Returns a breakdown with eligible skills for each source.
 *
 * characterData shape:
 * {
 *   race: { name: "Chimera", ... },
 *   ancestry: { name: "Catfolk", ... },
 *   cls: { primary: { class: {...}, level: N }, all: [...] },
 *   breakthroughs: [{ name: "Skill Training", ... }, ...]
 * }
 */
function calculateAvailableSkillPoints(characterData) {
  // 1. Base (creation) — 10 pts, any skill
  const baseEligible = getAllSkillNames();

  // 2. Race — restricted skill list
  const raceResult = characterData?.race ?
    getRaceSkillPoints(characterData.race.name, characterData.ancestry?.name) :
    { points: 0, eligibleSkills: [] };

  // 3. Class — +5 per class at Level 3, restricted skill list
  const classResult = getClassSkillPoints(characterData?.cls);

  // 4. Breakthroughs — Skill Training / Universal Training
  const btResult = getBreakthroughSkillPoints(characterData?.breakthroughs);

  return {
    base: BASE_SKILL_POINTS,
    race: raceResult.points,
    class: classResult.points,
    breakthrough: btResult.points,
    total: BASE_SKILL_POINTS + raceResult.points + classResult.points + btResult.points,
    eligibleSkills: {
      base: baseEligible,
      race: raceResult.eligibleSkills,
      class: classResult.eligibleSkills,
      breakthrough: btResult.eligibleSkills
    },
    // Detailed per-source breakdown
    perClass: classResult.perClass || [],
    perBreakthrough: btResult.perBreakthrough || []
  };
}

// ===========================================================================
// SKILL CALCULATION HELPERS
// ===========================================================================
function calculateTotalSkillPoints(groups) {
  return groups.reduce((total, group) => {
    return total + group.skills.reduce((gTotal, skill) => {
      return gTotal + (Number(skill.pts) || 0);
    }, 0);
  }, 0);
}

function getRemainingPoints(groups, availablePoints) {
  const totalAvailable = availablePoints || BASE_SKILL_POINTS;
  return totalAvailable - calculateTotalSkillPoints(groups);
}

function deepCloneSkillGroups() {
  return structuredClone(SKILL_GROUPS);
}

// ===========================================================================
// EXPERTISE HELPERS
// ===========================================================================
/**
 * Calculate total expertise points for a skill.
 * Each expertise entry format: "Name (X pts)"
 * Returns total expertise points across all entries.
 */
function calculateExpertisePoints(expertiseStr) {
  if (!expertiseStr) return 0;
  const matches = expertiseStr.matchAll(/(\d+)\s*pts?/g);
  let total = 0;
  for (const match of matches) {
    total += parseInt(match[1]) || 0;
  }
  return total;
}

/**
 * Check if adding expertise would exceed the cap.
 * Expertise cap follows the same rules as skill cap (15 at base, 10 for artisan skills).
 */
function canAddExpertise(skill, newExpertisePts) {
  const currentExpertise = calculateExpertisePoints(skill.expertise || '');
  const effectiveCap = getEffectiveSkillCap(skill.name);
  return (currentExpertise + newExpertisePts) <= effectiveCap;
}

// ===========================================================================
// SKILL RESTRICTION HELPERS
// ===========================================================================
/**
 * Check if a skill is an artisan (crafting/gathering) skill.
 * Artisan skills cannot be selected by general skill-granting features.
 */
function isArtisanSkill(skillName) {
  return ARTISAN_SKILLS.includes(skillName);
}

/**
 * Check if a skill is a crafting/gathering skill (excluded from "any non-crafting").
 */
function isCraftingGatheringSkill(skillName) {
  return CRAFTING_GATHERING_SKILLS.includes(skillName);
}

/**
 * Get the effective cap for a skill (artisan skills cap at 10).
 */
function getEffectiveSkillCap(skillName) {
  if (isArtisanSkill(skillName)) return 10;
  return SKILL_CAP;
}
