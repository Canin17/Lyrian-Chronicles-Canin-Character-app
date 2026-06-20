// Lyrian Chronicles RPG - Stat Calculations
// Formulas from Lyrian Chronicles rulebook
// Stats are assigned via fixed arrays, NOT point-buy

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
    guard: tou,
    speed: 20
  };
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
