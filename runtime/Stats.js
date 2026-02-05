// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// STATS.js - Character Stat Calculation Engine
// ============================================================
// Calculates all player stats from base, equipment, skills, and upgrades

import { State, getAllEquipped } from './State.js';

export const Stats = {
  // ============================================================
  // MAIN CALCULATION
  // ============================================================

  /**
   * Calculate all player stats
   * Called when equipment changes, level up, skill learned, etc.
   */
  calculate() {
    const p = State.player;
    const meta = State.meta;

    // Reset to base values
    this.resetToBase();

    // Apply level bonuses
    this.applyLevelBonuses();

    // Apply pilot stat bonuses
    this.applyPilotStats();

    // Apply equipment stats
    this.applyEquipment();

    // Apply skill bonuses
    this.applySkills();

    // Apply vendor upgrades
    this.applyUpgrades();

    // Apply final multipliers
    this.applyFinalMultipliers();

    // Clamp values
    this.clampStats();

    console.log('[Stats] Calculated:', {
      damage: p.damage.toFixed(1),
      hp: p.maxHP,
      shield: p.maxShield,
      speed: p.moveSpeed
    });
  },

  // ============================================================
  // STEP 1: BASE VALUES
  // ============================================================

  resetToBase() {
    const p = State.player;

    // Combat
    p.damage = 10;
    p.fireRate = 0.25;
    p.critChance = 0.05;
    p.critDamage = 1.5;
    p.attackSpeed = 1.0;

    // Defense
    p.maxHP = 100;
    p.maxShield = 0;
    p.shieldRegen = 0;
    p.armor = 0;
    p.dodgeChance = 0;
    p.damageReduction = 0;

    // Utility
    p.moveSpeed = 200;
    p.pickupRadius = 50;

    // Bonus tracking (for UI display)
    p.bonuses = {
      damageFlat: 0,
      damagePercent: 0,
      hpFlat: 0,
      hpPercent: 0,
      shieldFlat: 0,
      shieldPercent: 0,
      scrapBonus: 0,
      xpBonus: 0
    };
  },

  // ============================================================
  // STEP 2: LEVEL BONUSES
  // ============================================================

  applyLevelBonuses() {
    const p = State.player;
    const level = State.meta.level;

    // +8 HP per level
    p.maxHP += (level - 1) * 8;

    // +3% damage per level (stored as multiplier, applied later)
    p.bonuses.damagePercent += (level - 1) * 0.03;
  },

  // ============================================================
  // STEP 3: PILOT STATS
  // ============================================================

  applyPilotStats() {
    const p = State.player;
    const stats = State.meta.pilotStats;

    // Apply diminishing returns for stats above 100
    const getEffectiveValue = (value) => {
      if (value <= 100) return value;
      const excess = value - 100;
      if (excess <= 100) {
        return 100 + excess * 0.5;
      }
      return 150 + (excess - 100) * 0.25;
    };

    // STRENGTH: +0.5% damage per point
    const str = getEffectiveValue(stats.strength);
    p.bonuses.damagePercent += str * 0.005;
    // +1 armor per 5 points
    p.armor += Math.floor(stats.strength / 5);

    // DEXTERITY: +0.3% attack speed, +0.2% crit, +0.5% dodge per 5
    const dex = getEffectiveValue(stats.dexterity);
    p.attackSpeed += dex * 0.003;
    p.critChance += dex * 0.002;
    p.dodgeChance += Math.floor(stats.dexterity / 5) * 0.005;

    // INTELLIGENCE: +1% cooldown reduction (future), +0.5% status damage
    // Currently not implemented, placeholder

    // VITALITY: +3 max HP per point, +1 HP regen per 10 points
    const vit = getEffectiveValue(stats.vitality);
    p.bonuses.hpFlat += vit * 3;
    // HP regen handled in combat

    // ENERGY: +2 max shield per point, +0.5% shield regen
    const enr = getEffectiveValue(stats.energy);
    p.bonuses.shieldFlat += enr * 2;
    p.shieldRegen += enr * 0.005;
  },

  // ============================================================
  // STEP 4: EQUIPMENT
  // ============================================================

  applyEquipment() {
    const p = State.player;
    const equipment = getAllEquipped();

    for (const item of equipment) {
      if (!item) continue;

      // Apply base stats
      const baseStats = item.baseStats || {};
      for (const [stat, value] of Object.entries(baseStats)) {
        this.applyStat(stat, value);
      }

      // Apply affixes
      if (item.affixes) {
        for (const affix of item.affixes) {
          this.applyAffix(affix);
        }
      }
    }
  },

  /**
   * Apply a single stat
   * @param {string} stat - Stat name
   * @param {number} value - Stat value
   */
  applyStat(stat, value) {
    const p = State.player;

    switch (stat) {
      // Offensive
      case 'damage':
        p.bonuses.damageFlat += value;
        break;
      case 'damageBonus':
        p.bonuses.damagePercent += value;
        break;
      case 'fireRate':
        p.fireRate = value; // Base fire rate from weapon
        break;
      case 'critChance':
        p.critChance += value;
        break;
      case 'critDamage':
        p.critDamage += value;
        break;
      case 'attackSpeed':
        p.attackSpeed += value;
        break;

      // Defensive
      case 'maxHP':
        p.bonuses.hpFlat += value;
        break;
      case 'shield':
        p.bonuses.shieldFlat += value;
        break;
      case 'shieldRegen':
        p.shieldRegen += value;
        break;
      case 'armor':
        p.armor += value;
        break;
      case 'dodgeChance':
        p.dodgeChance += value;
        break;
      case 'damageReduction':
        p.damageReduction += value;
        break;

      // Utility
      case 'moveSpeed':
        p.moveSpeed += value;
        break;
      case 'pickupRadius':
        p.pickupRadius += value;
        break;
      case 'scrapBonus':
        p.bonuses.scrapBonus += value;
        break;
      case 'xpBonus':
        p.bonuses.xpBonus += value;
        break;

      // Special weapon stats (stored for combat use)
      case 'pierce':
      case 'chain':
      case 'aoe':
      case 'projectiles':
      case 'continuous':
      case 'shieldDamage':
        p[stat] = value;
        break;
    }
  },

  /**
   * Apply an affix
   * @param {object} affix - Affix object with id, tier, value
   */
  applyAffix(affix) {
    const p = State.player;

    // Get affix definition
    const affixDef = State.data.items?.affixes?.[affix.id];
    if (!affixDef) return;

    const stat = affixDef.stat;
    const value = affix.value;
    const type = affixDef.type;

    if (type === 'percent') {
      // Percentage bonuses
      switch (stat) {
        case 'damageBonus':
          p.bonuses.damagePercent += value / 100;
          break;
        case 'critChance':
          p.critChance += value / 100;
          break;
        case 'critDamage':
          p.critDamage += value / 100;
          break;
        case 'attackSpeed':
          p.attackSpeed += value / 100;
          break;
        case 'dodgeChance':
          p.dodgeChance += value / 100;
          break;
        case 'maxHPBonus':
          p.bonuses.hpPercent += value / 100;
          break;
        case 'maxShieldBonus':
          p.bonuses.shieldPercent += value / 100;
          break;
        case 'scrapBonus':
          p.bonuses.scrapBonus += value / 100;
          break;
        case 'xpBonus':
          p.bonuses.xpBonus += value / 100;
          break;
      }
    } else {
      // Flat bonuses
      this.applyStat(stat, value);
    }
  },

  // ============================================================
  // STEP 5: SKILLS
  // ============================================================

  applySkills() {
    const p = State.player;
    const skills = State.meta.skills;
    const skillData = State.data.skills;

    if (!skillData) return;

    for (const [skillId, rank] of Object.entries(skills)) {
      if (rank <= 0) continue;

      const skill = skillData[skillId];
      if (!skill || !skill.effect) continue;

      // Apply effect multiplied by rank
      for (const [stat, valuePerRank] of Object.entries(skill.effect)) {
        const totalValue = valuePerRank * rank;

        switch (stat) {
          case 'critChance':
            p.critChance += totalValue;
            break;
          case 'damageBonus':
            p.bonuses.damagePercent += totalValue;
            break;
          case 'attackSpeed':
            p.attackSpeed += totalValue;
            break;
          case 'armorPen':
            p.armorPen = (p.armorPen || 0) + totalValue;
            break;
          case 'chainChance':
            p.chainChance = (p.chainChance || 0) + totalValue;
            break;
          case 'explosionChance':
            p.explosionChance = (p.explosionChance || 0) + totalValue;
            break;
          case 'maxHPBonus':
            p.bonuses.hpPercent += totalValue;
            break;
          case 'maxShieldBonus':
            p.bonuses.shieldPercent += totalValue;
            break;
          case 'hpRegenBonus':
            p.hpRegenBonus = (p.hpRegenBonus || 0) + totalValue;
            break;
          case 'damageReduction':
            p.damageReduction += totalValue;
            break;
          case 'lowShieldRegen':
            p.lowShieldRegen = (p.lowShieldRegen || 0) + totalValue;
            break;
          case 'dodgeChance':
            p.dodgeChance += totalValue;
            break;
          case 'scrapBonus':
            p.bonuses.scrapBonus += totalValue;
            break;
          case 'moveSpeedBonus':
            p.moveSpeed *= (1 + totalValue);
            break;
          case 'pickupRadiusBonus':
            p.pickupRadius *= (1 + totalValue);
            break;
          case 'rareDropBonus':
            p.rareDropBonus = (p.rareDropBonus || 0) + totalValue;
            break;
          case 'vendorDiscount':
            p.vendorDiscount = (p.vendorDiscount || 0) + totalValue;
            break;
          case 'xpBonus':
            p.bonuses.xpBonus += totalValue;
            break;
          // Special skills
          case 'executeDamage':
            p.executeDamage = totalValue;
            p.executeThreshold = skill.effect.executeThreshold;
            break;
          case 'lastStand':
            p.lastStand = true;
            p.lastStandDuration = skill.effect.lastStandDuration;
            break;
          case 'eliteGuaranteedDrop':
            p.eliteGuaranteedDrop = true;
            break;
        }
      }
    }
  },

  // ============================================================
  // STEP 6: VENDOR UPGRADES
  // ============================================================

  applyUpgrades() {
    const p = State.player;
    const upgrades = State.meta.upgrades;
    const vendorData = State.data.vendors?.engineer?.upgrades;

    if (!vendorData) return;

    // Offense upgrades
    if (upgrades.offense) {
      p.bonuses.damagePercent += upgrades.offense.baseDamage * (vendorData.offense?.baseDamage?.perLevel || 0.02);
      p.critChance += upgrades.offense.critChance * (vendorData.offense?.critChance?.perLevel || 0.01);
      p.critDamage += upgrades.offense.critDamage * (vendorData.offense?.critDamage?.perLevel || 0.05);
      p.attackSpeed += upgrades.offense.attackSpeed * (vendorData.offense?.attackSpeed?.perLevel || 0.02);
    }

    // Defense upgrades
    if (upgrades.defense) {
      p.bonuses.hpPercent += upgrades.defense.maxHP * (vendorData.defense?.maxHP?.perLevel || 0.03);
      p.bonuses.shieldPercent += upgrades.defense.maxShield * (vendorData.defense?.maxShield?.perLevel || 0.03);
      p.shieldRegen += upgrades.defense.shieldRegen * (vendorData.defense?.shieldRegen?.perLevel || 0.05);
      p.armor += upgrades.defense.armor * (vendorData.defense?.armor?.perLevel || 1);
    }

    // Utility upgrades
    if (upgrades.utility) {
      p.moveSpeed *= (1 + upgrades.utility.moveSpeed * (vendorData.utility?.moveSpeed?.perLevel || 0.02));
      p.pickupRadius *= (1 + upgrades.utility.pickupRadius * (vendorData.utility?.pickupRadius?.perLevel || 0.1));
      p.bonuses.xpBonus += upgrades.utility.xpGain * (vendorData.utility?.xpGain?.perLevel || 0.05);
      p.bonuses.scrapBonus += upgrades.utility.scrapFind * (vendorData.utility?.scrapFind?.perLevel || 0.05);
    }
  },

  // ============================================================
  // STEP 7: FINAL MULTIPLIERS
  // ============================================================

  applyFinalMultipliers() {
    const p = State.player;

    // Apply damage
    p.damage = (p.damage + p.bonuses.damageFlat) * (1 + p.bonuses.damagePercent);

    // Apply HP
    p.maxHP = (p.maxHP + p.bonuses.hpFlat) * (1 + p.bonuses.hpPercent);

    // Apply shield
    p.maxShield = p.bonuses.shieldFlat * (1 + p.bonuses.shieldPercent);
  },

  // ============================================================
  // STEP 8: CLAMP VALUES
  // ============================================================

  clampStats() {
    const p = State.player;

    // Minimum values
    p.damage = Math.max(1, p.damage);
    p.maxHP = Math.max(10, Math.round(p.maxHP));
    p.maxShield = Math.max(0, Math.round(p.maxShield));
    p.fireRate = Math.max(0.05, p.fireRate);
    p.moveSpeed = Math.max(50, p.moveSpeed);
    p.pickupRadius = Math.max(20, p.pickupRadius);

    // Caps
    p.critChance = Math.min(0.95, Math.max(0, p.critChance));
    p.critDamage = Math.max(1, p.critDamage);
    p.dodgeChance = Math.min(0.75, Math.max(0, p.dodgeChance));
    p.damageReduction = Math.min(0.9, Math.max(0, p.damageReduction));
    p.attackSpeed = Math.max(0.1, p.attackSpeed);
  },

  // ============================================================
  // HP/SHIELD INITIALIZATION
  // ============================================================

  /**
   * Initialize HP and shield to max (called at run start)
   */
  initializeHP() {
    State.player.hp = State.player.maxHP;
    State.player.shield = State.player.maxShield;
  },

  /**
   * Heal player
   * @param {number} amount - Amount to heal
   * @returns {number} Actual amount healed
   */
  heal(amount) {
    const p = State.player;
    const before = p.hp;
    p.hp = Math.min(p.maxHP, p.hp + amount);
    return p.hp - before;
  },

  /**
   * Regenerate shield
   * @param {number} dt - Delta time
   */
  regenShield(dt) {
    const p = State.player;
    if (p.shield >= p.maxShield) return;

    let regenRate = p.shieldRegen;

    // Low shield bonus (from skills)
    if (p.lowShieldRegen && p.shield / p.maxShield < 0.3) {
      regenRate *= (1 + p.lowShieldRegen);
    }

    p.shield = Math.min(p.maxShield, p.shield + regenRate * dt);
  },

  // ============================================================
  // DAMAGE CALCULATION
  // ============================================================

  /**
   * Calculate damage to deal
   * @param {number} baseDamage - Base damage (usually player.damage)
   * @param {object} target - Target enemy
   * @returns {{damage: number, isCrit: boolean}} Damage result
   */
  calculateDamage(baseDamage, target) {
    const p = State.player;
    let damage = baseDamage;
    let isCrit = false;

    // Critical hit
    if (Math.random() < p.critChance) {
      damage *= p.critDamage;
      isCrit = true;
    }

    // Execute bonus (skill)
    if (p.executeDamage && target.hp / target.maxHP < p.executeThreshold) {
      damage *= (1 + p.executeDamage);
    }

    // Armor penetration
    if (target.armor && target.armor > 0) {
      const effectiveArmor = target.armor * (1 - (p.armorPen || 0));
      const armorReduction = effectiveArmor / (effectiveArmor + 100);
      damage *= (1 - armorReduction);
    }

    return { damage: Math.round(damage), isCrit };
  },

  /**
   * Calculate damage taken
   * @param {number} incomingDamage - Incoming damage
   * @returns {{damage: number, dodged: boolean, absorbed: number}} Damage result
   */
  calculateDamageTaken(incomingDamage) {
    const p = State.player;

    // Dodge check
    if (Math.random() < p.dodgeChance) {
      return { damage: 0, dodged: true, absorbed: 0 };
    }

    let damage = incomingDamage;

    // Armor reduction
    if (p.armor > 0) {
      const armorReduction = p.armor / (p.armor + 100);
      damage *= (1 - armorReduction);
    }

    // Flat damage reduction
    damage *= (1 - p.damageReduction);

    // Shield absorption
    let absorbed = 0;
    if (p.shield > 0) {
      absorbed = Math.min(p.shield, damage);
      damage -= absorbed;
    }

    return {
      damage: Math.round(damage),
      dodged: false,
      absorbed: Math.round(absorbed)
    };
  },

  // ============================================================
  // STAT GETTERS (for UI)
  // ============================================================

  /**
   * Get formatted stats for UI display
   * @returns {object} Stats object
   */
  getDisplayStats() {
    const p = State.player;
    return {
      // Offensive
      damage: Math.round(p.damage),
      fireRate: (1 / p.fireRate * p.attackSpeed).toFixed(1) + '/s',
      critChance: (p.critChance * 100).toFixed(1) + '%',
      critDamage: (p.critDamage * 100).toFixed(0) + '%',
      attackSpeed: (p.attackSpeed * 100).toFixed(0) + '%',

      // Defensive
      hp: Math.round(p.maxHP),
      shield: Math.round(p.maxShield),
      shieldRegen: p.shieldRegen.toFixed(1) + '/s',
      armor: Math.round(p.armor),
      dodge: (p.dodgeChance * 100).toFixed(1) + '%',
      damageReduction: (p.damageReduction * 100).toFixed(1) + '%',

      // Utility
      moveSpeed: Math.round(p.moveSpeed),
      pickupRadius: Math.round(p.pickupRadius),
      scrapBonus: (p.bonuses.scrapBonus * 100).toFixed(0) + '%',
      xpBonus: (p.bonuses.xpBonus * 100).toFixed(0) + '%'
    };
  }
};

export default Stats;
