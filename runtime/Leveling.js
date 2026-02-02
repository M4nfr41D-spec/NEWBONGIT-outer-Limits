// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// LEVELING.js - Experience and Level Progression
// ============================================================
// Handles XP gain, leveling up, and related rewards

import { State, unlockAchievement } from './State.js';

export const Leveling = {
  // ============================================================
  // XP CURVE
  // ============================================================

  /**
   * Calculate XP required for a given level
   * Uses polynomial curve for smooth progression
   * @param {number} level - Target level
   * @returns {number} XP required
   */
  xpForLevel(level) {
    if (level <= 1) return 0;

    // Polynomial curve: base * level^exponent
    // Tuned for level 100 around 500,000 total XP
    const base = 50;
    const exponent = 2.2;

    return Math.floor(base * Math.pow(level, exponent));
  },

  /**
   * Calculate total XP for all levels up to target
   * @param {number} level - Target level
   * @returns {number} Total XP
   */
  totalXpForLevel(level) {
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  },

  /**
   * Get progress toward next level (0-1)
   * @returns {number} Progress percentage
   */
  getProgress() {
    const currentLevelXP = this.xpForLevel(State.meta.level);
    const nextLevelXP = this.xpForLevel(State.meta.level + 1);
    const needed = nextLevelXP - currentLevelXP;

    if (needed <= 0) return 1;

    const current = State.meta.xp - currentLevelXP;
    return Math.max(0, Math.min(1, current / needed));
  },

  /**
   * Get XP needed for next level
   * @returns {number} XP needed
   */
  getXpToNextLevel() {
    return this.xpForLevel(State.meta.level + 1) - State.meta.xp;
  },

  // ============================================================
  // XP GAIN
  // ============================================================

  /**
   * Award XP to player
   * @param {number} amount - Base XP amount
   * @param {string} source - Source of XP (for bonuses)
   * @returns {{xp: number, leveledUp: boolean, newLevel: number}}
   */
  awardXP(amount, source = 'kill') {
    // Apply XP bonuses
    let xp = amount;

    // Equipment/skill bonus
    const xpBonus = State.player.bonuses?.xpBonus || 0;
    xp *= (1 + xpBonus);

    // Early game boost (levels 1-25)
    if (State.meta.level <= 25) {
      xp *= 1.25; // +25% XP in early game
    }

    // Round and apply
    xp = Math.round(xp);
    State.meta.xp += xp;
    State.run.xpEarned += xp;

    // Check for level up
    const result = {
      xp,
      leveledUp: false,
      newLevel: State.meta.level,
      levelsGained: 0
    };

    while (State.meta.xp >= this.xpForLevel(State.meta.level + 1)) {
      this.levelUp();
      result.leveledUp = true;
      result.levelsGained++;
      result.newLevel = State.meta.level;
    }

    return result;
  },

  // ============================================================
  // LEVEL UP
  // ============================================================

  /**
   * Process level up
   */
  levelUp() {
    State.meta.level++;

    // Award stat points (+3 per level)
    State.meta.statPoints += 3;

    // Award skill points (every 2 levels)
    if (State.meta.level % 2 === 0) {
      State.meta.skillPoints++;
    }

    // Update highest level
    if (State.meta.level > State.meta.highestLevel) {
      State.meta.highestLevel = State.meta.level;
    }

    // Check level achievements
    this.checkLevelAchievements();

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playAnnouncement('level_up');
    }

    // Show announcement
    if (window.Game?.announce) {
      window.Game.announce(`LEVEL ${State.meta.level}!`, 'levelup');
    }

    console.log(`[Leveling] Level up! Now level ${State.meta.level}`);
  },

  /**
   * Check and unlock level-based achievements
   */
  checkLevelAchievements() {
    const level = State.meta.level;

    // Level milestones
    if (level >= 10) unlockAchievement('reach_level_10');
    if (level >= 25) unlockAchievement('reach_level_25');
    if (level >= 50) unlockAchievement('reach_level_50');
    if (level >= 75) unlockAchievement('reach_level_75');
    if (level >= 100) unlockAchievement('reach_level_100');
  },

  // ============================================================
  // ENEMY XP CALCULATIONS
  // ============================================================

  /**
   * Calculate XP reward for killing an enemy
   * @param {object} enemy - Enemy object
   * @returns {number} XP reward
   */
  calculateEnemyXP(enemy) {
    let baseXP = enemy.xp || 10;

    // Scale with enemy tier
    const tierMultiplier = enemy.tier || 1;
    baseXP *= (1 + (tierMultiplier - 1) * 0.5);

    // Elite bonus
    if (enemy.isElite) {
      baseXP *= 2;
    }

    // Boss bonus
    if (enemy.isBoss) {
      baseXP *= 10;
    }

    // Zone scaling (deeper zones = more XP)
    const zoneBonus = 1 + (State.run.currentZone || 0) * 0.02;
    baseXP *= zoneBonus;

    return Math.round(baseXP);
  },

  /**
   * Calculate XP for zone completion
   * @param {number} zoneIndex - Zone index
   * @param {boolean} isBossZone - Is this a boss zone
   * @returns {number} XP reward
   */
  calculateZoneCompletionXP(zoneIndex, isBossZone) {
    let xp = 50 + zoneIndex * 10;

    if (isBossZone) {
      xp *= 5;
    }

    return Math.round(xp);
  },

  // ============================================================
  // LEVEL REQUIREMENTS
  // ============================================================

  /**
   * Check if player meets level requirement
   * @param {number} required - Required level
   * @returns {boolean} True if met
   */
  meetsLevelRequirement(required) {
    return State.meta.level >= required;
  },

  /**
   * Get level-based stat scaling
   * @param {number} base - Base value
   * @param {number} perLevel - Value per level
   * @returns {number} Scaled value
   */
  getLevelScaled(base, perLevel) {
    return base + (State.meta.level - 1) * perLevel;
  },

  // ============================================================
  // DEBUG
  // ============================================================

  /**
   * Force set level (debug)
   * @param {number} level - Target level
   */
  setLevel(level) {
    State.meta.level = Math.max(1, Math.min(1000, level));
    State.meta.xp = this.xpForLevel(State.meta.level);

    // Recalculate stat points (3 per level after 1)
    State.meta.statPoints = (State.meta.level - 1) * 3;

    // Recalculate skill points (1 per 2 levels)
    State.meta.skillPoints = Math.floor((State.meta.level - 1) / 2);

    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    if (State.modules?.UI) {
      State.modules.UI.renderAll();
    }
  },

  /**
   * Add XP directly (debug)
   * @param {number} amount - XP to add
   */
  addXP(amount) {
    this.awardXP(amount, 'debug');
  }
};

export default Leveling;
