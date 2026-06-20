// Lyrian Chronicles RPG - Stat Calculations
// Formulas from Lyrian Chronicles rulebook

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

// Point buy system
const STAT_POINTS_TOTAL = 20;  // Total points to distribute
const STAT_MIN = 1;
const STAT_MAX = 10;

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

function getRemainingStatPoints(stats) {
  return STAT_POINTS_TOTAL - getTotalStatPoints(stats);
}
