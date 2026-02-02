// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// STATE.js - Global Game State Management
// ============================================================
// Central state store for all game data, inspired by Redux patterns
// but simplified for vanilla JS

// ============================================================
// PLAYER STATE
// ============================================================
const defaultPlayerState = {
  // Position (world coordinates)
  x: 400,
  y: 300,

  // Velocity
  vx: 0,
  vy: 0,

  // Direction (for sprite rendering)
  direction: 'right', // 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'

  // Combat stats (calculated from equipment + base)
  hp: 100,
  maxHP: 100,
  shield: 0,
  maxShield: 0,
  shieldRegen: 0,

  // Damage stats
  damage: 10,
  fireRate: 0.25, // seconds between shots
  critChance: 0.05,
  critDamage: 1.5,
  attackSpeed: 1.0,

  // Defense stats
  armor: 0,
  dodgeChance: 0,
  damageReduction: 0,

  // Utility stats
  moveSpeed: 200,
  pickupRadius: 50,

  // State flags
  invulnerable: false,
  invulnerableTimer: 0,
  lastShotTime: 0,

  // Status effects
  statusEffects: []
};

// ============================================================
// META STATE (Persistent across runs)
// ============================================================
const defaultMetaState = {
  // Progression
  level: 1,
  xp: 0,

  // Resources
  scrap: 0,

  // Points
  skillPoints: 0,
  statPoints: 3, // Start with 3 stat points

  // Pilot stats (allocated by player)
  pilotStats: {
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    vitality: 0,
    energy: 0
  },

  // Skills (learned skills with ranks)
  skills: {},

  // Inventory
  stash: [], // Unequipped items
  equipment: {
    weapon: null,
    secondary: null,
    shield: null,
    engine: null,
    reactor: null,
    module: null,
    drone: null
  },

  // Vendor upgrades (purchased permanent bonuses)
  upgrades: {
    offense: {
      baseDamage: 0,
      critChance: 0,
      critDamage: 0,
      attackSpeed: 0
    },
    defense: {
      maxHP: 0,
      maxShield: 0,
      shieldRegen: 0,
      armor: 0
    },
    utility: {
      moveSpeed: 0,
      pickupRadius: 0,
      xpGain: 0,
      scrapFind: 0
    },
    special: {
      stashSlots: 0,
      loadouts: 1,
      droneSlot: false
    }
  },

  // Pity counters (for guaranteed drops)
  pity: {
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  },

  // Progress tracking
  actsUnlocked: { act1: true },
  actsCompleted: {},

  // Statistics
  totalKills: 0,
  totalPlaytime: 0,
  totalRuns: 0,
  highestZone: 0,
  highestLevel: 1,

  // Achievements
  achievements: [],

  // Settings
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    screenShake: true
  }
};

// ============================================================
// RUN STATE (Transient, resets each run)
// ============================================================
const defaultRunState = {
  active: false,
  currentAct: null,
  currentZone: 0,

  // Earnings this run
  scrapEarned: 0,
  xpEarned: 0,
  cells: 0,
  cores: 0,
  shards: 0,

  // Run statistics
  stats: {
    timeElapsed: 0,
    kills: 0,
    eliteKills: 0,
    bossKills: 0,
    damageDealt: 0,
    damageTaken: 0,
    itemsFound: 0,
    highestCombo: 0
  },

  // Combat tracking
  killStreak: 0,
  killStreakTimer: 0,
  lastKillTime: 0
};

// ============================================================
// UI STATE
// ============================================================
const defaultUIState = {
  paused: false,
  pauseTab: 'inventory', // 'inventory', 'equipment', 'stats', 'skills'
  tooltipItem: null,
  selectedItem: null,
  filterSlot: 'all',
  announcement: null,
  announcementTimer: 0
};

// ============================================================
// DATA STATE (Loaded from JSON files)
// ============================================================
const defaultDataState = {
  acts: null,
  items: null,
  enemies: null,
  skills: null,
  vendors: null,
  achievements: null
};

// ============================================================
// MAIN STATE OBJECT
// ============================================================
export const State = {
  player: { ...defaultPlayerState },
  meta: { ...defaultMetaState },
  run: { ...defaultRunState },
  ui: { ...defaultUIState },
  data: { ...defaultDataState },

  // Module references (set during init)
  modules: null
};

// ============================================================
// STATE RESET FUNCTIONS
// ============================================================

/**
 * Reset run state (called when starting a new run)
 */
export function resetRun() {
  State.run = {
    active: false,
    currentAct: null,
    currentZone: 0,
    scrapEarned: 0,
    xpEarned: 0,
    cells: 0,
    cores: 0,
    shards: 0,
    stats: {
      timeElapsed: 0,
      kills: 0,
      eliteKills: 0,
      bossKills: 0,
      damageDealt: 0,
      damageTaken: 0,
      itemsFound: 0,
      highestCombo: 0
    },
    killStreak: 0,
    killStreakTimer: 0,
    lastKillTime: 0
  };
}

/**
 * Reset player combat state (called when starting a zone)
 */
export function resetPlayer() {
  // Keep calculated stats, reset position and HP
  State.player.x = 400;
  State.player.y = 300;
  State.player.vx = 0;
  State.player.vy = 0;
  State.player.direction = 'right';
  State.player.invulnerable = false;
  State.player.invulnerableTimer = 0;
  State.player.lastShotTime = 0;
  State.player.statusEffects = [];

  // HP and shield are set by Stats.initializeHP()
}

/**
 * Reset all state to defaults (for new game)
 */
export function resetAll() {
  State.player = { ...defaultPlayerState };
  State.meta = JSON.parse(JSON.stringify(defaultMetaState));
  State.run = { ...defaultRunState };
  State.ui = { ...defaultUIState };
  // Don't reset data - it's loaded once
}

/**
 * Get equipment by slot
 * @param {string} slot - Slot name
 * @returns {object|null} Equipped item or null
 */
export function getEquipped(slot) {
  return State.meta.equipment[slot] || null;
}

/**
 * Get all equipped items as array
 * @returns {object[]} Array of equipped items
 */
export function getAllEquipped() {
  return Object.values(State.meta.equipment).filter(item => item !== null);
}

/**
 * Check if item is equipped
 * @param {string} itemId - Item ID
 * @returns {boolean} True if equipped
 */
export function isEquipped(itemId) {
  return Object.values(State.meta.equipment).some(item => item && item.id === itemId);
}

/**
 * Get stash capacity
 * @returns {number} Max stash slots
 */
export function getStashCapacity() {
  const baseSlots = 25;
  const upgradeSlots = State.meta.upgrades.special.stashSlots * 5;
  return baseSlots + upgradeSlots;
}

/**
 * Check if stash is full
 * @returns {boolean} True if stash is full
 */
export function isStashFull() {
  return State.meta.stash.length >= getStashCapacity();
}

// ============================================================
// CURRENCY HELPERS
// ============================================================

/**
 * Add scrap (either to run or meta based on context)
 * @param {number} amount - Amount to add
 * @param {boolean} toMeta - Add directly to meta (false = run earnings)
 */
export function addScrap(amount, toMeta = false) {
  if (toMeta) {
    State.meta.scrap += amount;
  } else {
    State.run.scrapEarned += amount;
  }
}

/**
 * Spend scrap
 * @param {number} amount - Amount to spend
 * @returns {boolean} True if successful
 */
export function spendScrap(amount) {
  const total = State.meta.scrap + State.run.scrapEarned;
  if (total < amount) return false;

  // Spend from run earnings first
  if (State.run.scrapEarned >= amount) {
    State.run.scrapEarned -= amount;
  } else {
    amount -= State.run.scrapEarned;
    State.run.scrapEarned = 0;
    State.meta.scrap -= amount;
  }
  return true;
}

/**
 * Get total scrap (meta + run)
 * @returns {number} Total scrap
 */
export function getTotalScrap() {
  return State.meta.scrap + State.run.scrapEarned;
}

/**
 * Add cells
 * @param {number} amount - Amount to add
 */
export function addCells(amount) {
  State.run.cells += amount;
}

/**
 * Spend cells
 * @param {number} amount - Amount to spend
 * @returns {boolean} True if successful
 */
export function spendCells(amount) {
  if (State.run.cells < amount) return false;
  State.run.cells -= amount;
  return true;
}

/**
 * Add shards (from salvaging)
 * @param {number} amount - Amount to add
 */
export function addShards(amount) {
  State.run.shards += amount;
}

/**
 * Add cores (from bosses)
 * @param {number} amount - Amount to add
 */
export function addCores(amount) {
  State.run.cores += amount;
}

// ============================================================
// STAT POINT HELPERS
// ============================================================

/**
 * Allocate a stat point
 * @param {string} stat - Stat name (strength, dexterity, etc.)
 * @returns {boolean} True if successful
 */
export function allocateStatPoint(stat) {
  if (State.meta.statPoints <= 0) return false;
  if (!State.meta.pilotStats.hasOwnProperty(stat)) return false;

  State.meta.pilotStats[stat]++;
  State.meta.statPoints--;
  return true;
}

/**
 * Deallocate a stat point (refund)
 * @param {string} stat - Stat name
 * @returns {boolean} True if successful
 */
export function deallocateStatPoint(stat) {
  if (!State.meta.pilotStats.hasOwnProperty(stat)) return false;
  if (State.meta.pilotStats[stat] <= 0) return false;

  State.meta.pilotStats[stat]--;
  State.meta.statPoints++;
  return true;
}

// ============================================================
// SKILL POINT HELPERS
// ============================================================

/**
 * Learn or upgrade a skill
 * @param {string} skillId - Skill ID
 * @returns {boolean} True if successful
 */
export function learnSkill(skillId) {
  if (State.meta.skillPoints <= 0) return false;

  // Get skill data
  const skillData = State.data.skills?.[skillId];
  if (!skillData) return false;

  // Check if already maxed
  const currentRank = State.meta.skills[skillId] || 0;
  if (currentRank >= skillData.maxRanks) return false;

  // Check level requirement
  if (State.meta.level < skillData.levelRequired) return false;

  // Check prerequisite skills
  if (skillData.requires) {
    for (const [reqSkill, reqRank] of Object.entries(skillData.requires)) {
      if ((State.meta.skills[reqSkill] || 0) < reqRank) return false;
    }
  }

  // Learn/upgrade
  State.meta.skills[skillId] = currentRank + 1;
  State.meta.skillPoints--;
  return true;
}

// ============================================================
// ACHIEVEMENT HELPERS
// ============================================================

/**
 * Unlock an achievement
 * @param {string} achievementId - Achievement ID
 * @returns {boolean} True if newly unlocked
 */
export function unlockAchievement(achievementId) {
  if (State.meta.achievements.includes(achievementId)) return false;

  State.meta.achievements.push(achievementId);

  // Grant rewards
  const achievement = State.data.achievements?.[achievementId];
  if (achievement?.rewards) {
    if (achievement.rewards.statPoints) {
      State.meta.statPoints += achievement.rewards.statPoints;
    }
    if (achievement.rewards.skillPoints) {
      State.meta.skillPoints += achievement.rewards.skillPoints;
    }
    if (achievement.rewards.scrap) {
      State.meta.scrap += achievement.rewards.scrap;
    }
  }

  return true;
}

// ============================================================
// PITY SYSTEM HELPERS
// ============================================================

/**
 * Increment pity counter
 * @param {string} rarity - Rarity that dropped
 */
export function incrementPity(rarity) {
  // Reset lower rarity counters when higher drops
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  const index = rarityOrder.indexOf(rarity);

  // Increment counters for rarities below what dropped
  for (let i = 1; i < index; i++) {
    State.meta.pity[rarityOrder[i]]++;
  }

  // Reset counters for this rarity and above
  for (let i = index; i < rarityOrder.length; i++) {
    if (State.meta.pity[rarityOrder[i]] !== undefined) {
      State.meta.pity[rarityOrder[i]] = 0;
    }
  }
}

/**
 * Check if pity should trigger
 * @param {string} rarity - Rarity to check
 * @returns {boolean} True if pity should trigger
 */
export function shouldPityTrigger(rarity) {
  const pityThresholds = {
    uncommon: 8,
    rare: 25,
    epic: 150,
    legendary: 600
  };

  const threshold = pityThresholds[rarity];
  if (!threshold) return false;

  return State.meta.pity[rarity] >= threshold;
}

// ============================================================
// DEBUG HELPERS
// ============================================================

/**
 * Log current state (debug)
 */
export function debugState() {
  console.log('=== GAME STATE ===');
  console.log('Player:', State.player);
  console.log('Meta:', State.meta);
  console.log('Run:', State.run);
  console.log('UI:', State.ui);
}

export default State;
