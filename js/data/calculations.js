// Lyrian Chronicles RPG - Stat Calculations
// Formulas from Lyrian Chronicles rulebook
// Stats are assigned via fixed arrays, NOT point-buy

/* exported MAIN_STATS, SUB_STATS, MAIN_STATS_ARRAY, SUB_STATS_ARRAY, calculateDerivedStats, calculateBaseSpeed, getTotalStatPoints, isAssignmentComplete, getAvailableValues */
const MAIN_STATS = [
  { id: 'pow', name: 'Power', short: 'POW' },
  { id: 'foc', name: 'Focus', short: 'FOC' },
  { id: 'agi', name: 'Agility', short: 'AGI' },
  { id: 'tou', name: 'Toughness', short: 'TOU' }
];

const SUB_STATS = [
  { id: 'fitness', name: 'Fitness' },
  { id: 'cunning', name: 'Cunning' },
  { id: 'reason', name: 'Reason' },
  { id: 'awareness', name: 'Awareness' },
  { id: 'presence', name: 'Presence' }
];

// Array-based stat assignment (from rulebook)
// Main Stats: assign (5, 4, 4, 3) to the 4 main stats in any order
// Sub Stats: assign (5, 4, 3, 2, 1) to the 5 sub stats in any order
const MAIN_STATS_ARRAY = [5, 4, 4, 3];
const SUB_STATS_ARRAY = [5, 4, 3, 2, 1];

function calculateDerivedStats(stats) {
  if (!stats) return {};
  const pow = Number(stats.pow) || 0;
  const foc = Number(stats.foc) || 0;
  const agi = Number(stats.agi) || 0;
  const tou = Number(stats.tou) || 0;

  return {
    hp: 20 + (tou * 10),
    mana: 6 + pow,
    rp: 2 + agi,
    evasion: 7 + agi,
    dodgeEva: 20 + agi,
    potency: 11 + foc,
    damage: 5 + pow,
    accuracy: foc,
    initiative: agi,
    saveBonus: tou,
    guard: tou
  };
}

/**
 * Calculate permanent base movement speed from ancestry traits.
 * Default: 20ft.  Fast Runner (Catfolk, Rabbitfolk): 25ft.
 * Other speed effects (Flight, Horse Step Acceleration, etc.) are
 * situational/combat-only and are NOT included here.
 */
function calculateBaseSpeed(ancestryName) {
  if (!ancestryName) return 20;
  const name = ancestryName.toLowerCase();
  if (name === 'catfolk' || name === 'rabbitfolk') {
    return 25; // Fast Runner trait
  }
  return 20; // Default
}

function getTotalStatPoints(stats) {
  if (!stats) return 0;
  return (Number(stats.pow) || 0) + (Number(stats.foc) || 0) +
         (Number(stats.agi) || 0) + (Number(stats.tou) || 0) +
         (Number(stats.fitness) || 0) + (Number(stats.cunning) || 0) +
         (Number(stats.reason) || 0) + (Number(stats.awareness) || 0) +
         (Number(stats.presence) || 0);
}

/**
 * Check if all stats have been assigned (no null/undefined values)
 */
function isAssignmentComplete(stats) {
  if (!stats) return false;
  const allStats = [...MAIN_STATS, ...SUB_STATS];
  return allStats.every(s => stats[s.id] != null);
}

/**
 * Get the remaining unassigned values for a given array and current assignments
 */
function getAvailableValues(array, assignments) {
  const used = Object.values(assignments).filter(v => v != null && array.includes(v));
  const remaining = [...array];
  for (const val of used) {
    const idx = remaining.indexOf(val);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

/* exported checkRaceMatch */
/**
 * Check if the player's race/ancestry matches a required race name.
 * ponytail: single source of truth — was duplicated in class-select.js and breakthroughs.js.
 * The breakthroughs.js version was the authoritative one (full ancestry list, aliases, compounds).
 */
function checkRaceMatch(neededRace, race, ancestry) {
  const knownRaces = ['human', 'demon', 'fae', 'chimera', 'angel', 'youkai'];
  const raceAliases = { faerie: 'fae' };
  const knownAncestries = [
    'bearfolk', 'bullfolk', 'catfolk', 'centaur', 'cowfolk', 'dogfolk',
    'harpy', 'horse-folk', 'lamiafolk', 'lizardfolk', 'mothfolk',
    'phoenix', 'rabbitfolk', 'ratfolk', 'red pandafolk', 'sheepfolk',
    'slimefolk', 'spiderfolk', 'wolf-folk',
    'anubis', 'cait sith', 'cu sith', 'dryad', 'dullahan', 'gnome',
    'high fae', 'pixie', 'salamander', 'selkie', 'sylph', 'unseelie',
    'willo wisp',
    'ancient marionette', 'jiangshi', 'kitsune', 'nekomata', 'nio',
    'oni', 'raijin', 'ryujin', 'suryan', 'tengu', 'yuki-onna',
    'red panda', 'arachne', 'arachne spiderfolk', 'lamia', 'marionette',
    'willowisp', 'will-o-wisp', 'sheep', 'wolf', 'horse',
    'cow', 'bull', 'bear', 'dog', 'cat', 'rabbit', 'rat', 'slime',
    'spider', 'moth', 'lizard', 'harpy', 'centaur',
    'raijin youkai', 'ryujin youkai', 'oni youkai', 'tengu youkai',
    'yuki-onna youkai', 'kitsune youkai', 'jiangshi youkai',
    'suryan youkai', 'nekomata youkai', 'ancient marionette youkai',
  ];

  const neededLower = neededRace.toLowerCase();
  if (!race) return false;
  const raceName = (race.name || '').toLowerCase();
  const ancestryName = (ancestry && ancestry.name) ? ancestry.name.toLowerCase() : '';
  const ancestryId = (ancestry && ancestry.ancestryId) ? ancestry.ancestryId.toLowerCase() : '';

  const words = neededLower.split(/\s+/);
  if (words.length > 1) {
    if (words.every(w => ancestryName.includes(w)) || words.every(w => ancestryId.includes(w))) return true;
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    if (knownAncestries.includes(firstWord) && knownRaces.includes(lastWord)) {
      if ((ancestryName === firstWord || ancestryId === firstWord) && raceName === lastWord) return true;
    }
    if (knownAncestries.includes(neededLower)) return ancestryName === neededLower || ancestryId === neededLower;
    if (knownRaces.includes(lastWord) && raceName === lastWord) return true;
    return words.every(w => raceName.includes(w));
  }

  if (knownRaces.includes(neededLower)) return raceName === neededLower;
  if (raceAliases[neededLower]) return raceName === raceAliases[neededLower];
  return ancestryName === neededLower || ancestryId === neededLower ||
    knownAncestries.includes(neededLower) && (raceName.includes(neededLower) || ancestryName.includes(neededLower));
}
