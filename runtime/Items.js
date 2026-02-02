// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// ITEMS.js - Item Generation and Management System
// ============================================================
// AAA-tier ARPG itemization with tiered affixes, pity protection, and smart drops

import { State, isStashFull, incrementPity, shouldPityTrigger, addShards } from './State.js';

let itemIdCounter = 0;

export const Items = {
  // ============================================================
  // ITEM GENERATION
  // ============================================================

  /**
   * Generate a new item
   * @param {string} baseTypeId - Base item type ID
   * @param {string} rarity - Item rarity
   * @param {number} ilvl - Item level
   * @returns {object|null} Generated item or null
   */
  generate(baseTypeId, rarity = 'common', ilvl = 1) {
    const baseType = State.data.items?.baseTypes?.[baseTypeId];
    if (!baseType) {
      console.warn(`[Items] Unknown base type: ${baseTypeId}`);
      return null;
    }

    const item = {
      id: `item_${Date.now()}_${itemIdCounter++}`,
      baseType: baseTypeId,
      name: this.generateName(baseType.name, rarity),
      slot: baseType.slot,
      rarity: rarity,
      ilvl: ilvl,
      baseStats: { ...baseType.baseStats },
      description: baseType.description || '',
      affixes: [],
      sellValue: this.calculateSellValue(rarity, ilvl)
    };

    // Scale base stats with ilvl
    this.scaleBaseStats(item);

    // Roll affixes based on rarity
    this.rollAffixes(item);

    return item;
  },

  /**
   * Generate random item for zone
   * @param {string} rarity - Desired rarity (or null for random)
   * @param {string} slot - Desired slot (or null for random)
   * @param {number} ilvl - Item level
   * @returns {object|null} Generated item
   */
  generateRandom(rarity = null, slot = null, ilvl = 1) {
    // Determine rarity
    if (!rarity) {
      rarity = this.rollRarity(ilvl);
    }

    // Get available base types
    const baseTypes = Object.entries(State.data.items?.baseTypes || {});
    let candidates = baseTypes;

    // Filter by slot if specified
    if (slot) {
      candidates = candidates.filter(([, type]) => type.slot === slot);
    }

    if (candidates.length === 0) {
      console.warn('[Items] No candidates for random item');
      return null;
    }

    // Pick random base type
    const [baseTypeId] = candidates[Math.floor(Math.random() * candidates.length)];

    return this.generate(baseTypeId, rarity, ilvl);
  },

  /**
   * Generate item for drop
   * @param {number} zoneIndex - Current zone
   * @param {string} actId - Current act
   * @param {boolean} isElite - From elite enemy
   * @param {boolean} isBoss - From boss enemy
   * @returns {object|null} Generated item
   */
  generateDrop(zoneIndex, actId, isElite = false, isBoss = false) {
    // Calculate item level
    const ilvl = this.calculateItemLevel(zoneIndex, actId);

    // Determine rarity
    let rarity;
    if (isBoss) {
      // Boss: guaranteed rare+
      rarity = this.rollRarity(ilvl, 'rare');
    } else if (isElite) {
      // Elite: better chances
      rarity = this.rollRarityWithBonus(ilvl, 0.15);
    } else {
      rarity = this.rollRarity(ilvl);
    }

    // Apply pity protection
    rarity = this.applyPityProtection(rarity);

    // Increment pity counters
    incrementPity(rarity);

    // Track found items
    State.run.stats.itemsFound++;

    // Generate the item
    return this.generateRandom(rarity, null, ilvl);
  },

  // ============================================================
  // ITEM LEVEL CALCULATION
  // ============================================================

  /**
   * Calculate item level for zone
   * @param {number} zoneIndex - Zone index
   * @param {string} actId - Act ID
   * @returns {number} Item level
   */
  calculateItemLevel(zoneIndex, actId) {
    const act = State.data.acts?.[actId];
    if (!act) return 1;

    let baseLevel;

    // Act 4 (endless) uses player level + 15
    if (act.endless) {
      baseLevel = State.meta.level + 15;
    } else {
      baseLevel = act.baseLevel || 1;
    }

    // Add zone bonus (+2 ilvl per zone)
    const zoneBonus = (zoneIndex || 0) * 2;

    return Math.max(1, baseLevel + zoneBonus);
  },

  // ============================================================
  // RARITY ROLLING
  // ============================================================

  /**
   * Roll rarity for drop
   * @param {number} ilvl - Item level
   * @param {string} minRarity - Minimum rarity
   * @returns {string} Rolled rarity
   */
  rollRarity(ilvl, minRarity = null) {
    const weights = State.data.items?.rarityWeights;
    const ilvlReqs = State.data.items?.rarityIlvl;

    if (!weights || !ilvlReqs) return 'common';

    // Filter by ilvl requirements
    const available = {};
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const minIndex = minRarity ? rarityOrder.indexOf(minRarity) : 0;

    for (const rarity of rarityOrder) {
      const reqIlvl = ilvlReqs[rarity] || 1;
      const rarityIndex = rarityOrder.indexOf(rarity);

      if (ilvl >= reqIlvl && rarityIndex >= minIndex) {
        available[rarity] = weights[rarity];
      }
    }

    // Early game boost (level 1-25)
    if (State.meta.level <= 25) {
      if (available.uncommon) available.uncommon *= 1.2;
      if (available.rare) available.rare *= 1.1;
    }

    // Roll
    return this.weightedRoll(available);
  },

  /**
   * Roll rarity with bonus chance
   * @param {number} ilvl - Item level
   * @param {number} bonus - Bonus to rare+ chances
   * @returns {string} Rolled rarity
   */
  rollRarityWithBonus(ilvl, bonus) {
    const weights = { ...(State.data.items?.rarityWeights || {}) };

    // Apply bonus
    if (weights.uncommon) weights.uncommon *= (1 + bonus);
    if (weights.rare) weights.rare *= (1 + bonus * 2);
    if (weights.epic) weights.epic *= (1 + bonus * 3);
    if (weights.legendary) weights.legendary *= (1 + bonus * 4);

    // Use modified weights
    const saved = State.data.items.rarityWeights;
    State.data.items.rarityWeights = weights;
    const result = this.rollRarity(ilvl);
    State.data.items.rarityWeights = saved;

    return result;
  },

  /**
   * Weighted random selection
   * @param {object} weights - Key: weight pairs
   * @returns {string} Selected key
   */
  weightedRoll(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);

    if (total === 0) return entries[0]?.[0] || 'common';

    let roll = Math.random() * total;
    for (const [key, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return key;
    }

    return entries[entries.length - 1][0];
  },

  // ============================================================
  // PITY PROTECTION
  // ============================================================

  /**
   * Apply pity protection to rarity
   * @param {string} rolledRarity - Originally rolled rarity
   * @returns {string} Final rarity (possibly upgraded)
   */
  applyPityProtection(rolledRarity) {
    // Check pity thresholds from highest to lowest
    if (shouldPityTrigger('legendary')) {
      console.log('[Items] Pity triggered: Legendary!');
      return 'legendary';
    }
    if (shouldPityTrigger('epic')) {
      console.log('[Items] Pity triggered: Epic');
      return 'epic';
    }
    if (shouldPityTrigger('rare')) {
      return 'rare';
    }
    if (shouldPityTrigger('uncommon')) {
      return 'uncommon';
    }

    return rolledRarity;
  },

  // ============================================================
  // AFFIX ROLLING
  // ============================================================

  /**
   * Roll affixes for item based on rarity
   * @param {object} item - Item to add affixes to
   */
  rollAffixes(item) {
    const affixCounts = State.data.items?.rarityAffixes?.[item.rarity];
    if (!affixCounts) return;

    const count = Math.floor(Math.random() * (affixCounts.max - affixCounts.min + 1)) + affixCounts.min;
    if (count === 0) return;

    // Get available affixes for this ilvl
    const allAffixes = State.data.items?.affixes || {};
    const usedAffixes = new Set();

    for (let i = 0; i < count; i++) {
      const affix = this.rollAffix(item.ilvl, usedAffixes, allAffixes);
      if (affix) {
        item.affixes.push(affix);
        usedAffixes.add(affix.id);
      }
    }
  },

  /**
   * Roll a single affix
   * @param {number} ilvl - Item level
   * @param {Set} usedAffixes - Already used affix IDs
   * @param {object} allAffixes - All affix definitions
   * @returns {object|null} Rolled affix
   */
  rollAffix(ilvl, usedAffixes, allAffixes) {
    // Get available affixes
    const candidates = [];

    for (const [affixId, affix] of Object.entries(allAffixes)) {
      if (usedAffixes.has(affixId)) continue;

      // Find highest available tier
      const tiers = affix.tiers;
      let bestTier = null;

      for (const [tierName, tierData] of Object.entries(tiers)) {
        if (ilvl >= tierData.ilvl) {
          if (!bestTier || tierData.ilvl > tiers[bestTier].ilvl) {
            bestTier = tierName;
          }
        }
      }

      if (bestTier) {
        candidates.push({ affixId, affix, tier: bestTier });
      }
    }

    if (candidates.length === 0) return null;

    // Pick random affix
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const tierData = chosen.affix.tiers[chosen.tier];

    // Roll value in tier range
    const value = Math.floor(Math.random() * (tierData.max - tierData.min + 1)) + tierData.min;

    return {
      id: chosen.affixId,
      tier: chosen.tier,
      value: value
    };
  },

  // ============================================================
  // ITEM SCALING
  // ============================================================

  /**
   * Scale base stats with item level
   * @param {object} item - Item to scale
   */
  scaleBaseStats(item) {
    const ilvl = item.ilvl;
    const scaling = 1 + (ilvl - 1) * 0.02; // +2% per ilvl

    for (const [stat, value] of Object.entries(item.baseStats)) {
      if (typeof value === 'number' && !['pierce', 'chain', 'projectiles'].includes(stat)) {
        item.baseStats[stat] = Math.round(value * scaling);
      }
    }
  },

  // ============================================================
  // ITEM NAMING
  // ============================================================

  /**
   * Generate item name based on rarity
   * @param {string} baseName - Base type name
   * @param {string} rarity - Item rarity
   * @returns {string} Generated name
   */
  generateName(baseName, rarity) {
    const prefixes = {
      common: ['', 'Basic ', 'Standard '],
      uncommon: ['Enhanced ', 'Improved ', 'Quality '],
      rare: ['Superior ', 'Advanced ', 'Refined '],
      epic: ['Elite ', 'Masterwork ', 'Prime '],
      legendary: ['Legendary ', 'Mythical ', 'Exalted '],
      mythic: ['Transcendent ', 'Divine ', 'Celestial ']
    };

    const prefix = prefixes[rarity]?.[Math.floor(Math.random() * (prefixes[rarity]?.length || 1))] || '';
    return prefix + baseName;
  },

  // ============================================================
  // SELL VALUE
  // ============================================================

  /**
   * Calculate item sell value
   * @param {string} rarity - Item rarity
   * @param {number} ilvl - Item level
   * @returns {number} Sell value in scrap
   */
  calculateSellValue(rarity, ilvl) {
    const baseValues = {
      common: 5,
      uncommon: 15,
      rare: 50,
      epic: 200,
      legendary: 1000,
      mythic: 5000
    };

    const base = baseValues[rarity] || 5;
    const ilvlMultiplier = 1 + (ilvl - 1) * 0.05;

    return Math.round(base * ilvlMultiplier);
  },

  /**
   * Calculate salvage value (shards)
   * @param {object} item - Item to salvage
   * @returns {number} Shard value
   */
  calculateSalvageValue(item) {
    const baseValues = {
      common: 1,
      uncommon: 4,
      rare: 10,
      epic: 25,
      legendary: 60,
      mythic: 125
    };

    const base = baseValues[item.rarity] || 1;
    const random = Math.floor(Math.random() * (base * 0.5));

    return base + random;
  },

  // ============================================================
  // INVENTORY MANAGEMENT
  // ============================================================

  /**
   * Add item to stash
   * @param {object} item - Item to add
   * @returns {boolean} True if added
   */
  addToStash(item) {
    if (!item) return false;
    if (isStashFull()) {
      console.warn('[Items] Stash is full!');
      return false;
    }

    State.meta.stash.push(item);
    return true;
  },

  /**
   * Remove item from stash
   * @param {string} itemId - Item ID to remove
   * @returns {object|null} Removed item
   */
  removeFromStash(itemId) {
    const index = State.meta.stash.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    return State.meta.stash.splice(index, 1)[0];
  },

  /**
   * Find item in stash by ID
   * @param {string} itemId - Item ID
   * @returns {object|null} Found item
   */
  findInStash(itemId) {
    return State.meta.stash.find(i => i.id === itemId) || null;
  },

  /**
   * Equip item
   * @param {string} itemId - Item ID to equip
   * @returns {boolean} True if equipped
   */
  equip(itemId) {
    // Find item in stash
    const item = this.findInStash(itemId);
    if (!item) {
      console.warn('[Items] Item not in stash:', itemId);
      return false;
    }

    const slot = item.slot;
    if (!slot) {
      console.warn('[Items] Item has no slot:', item);
      return false;
    }

    // Unequip current item in slot (if any)
    const currentItem = State.meta.equipment[slot];
    if (currentItem) {
      this.addToStash(currentItem);
    }

    // Remove from stash and equip
    this.removeFromStash(itemId);
    State.meta.equipment[slot] = item;

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playUI('equip');
    }

    // Update UI
    if (State.modules?.UI) {
      State.modules.UI.renderAll();
    }

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    console.log('[Items] Equipped:', item.name, 'in slot:', slot);
    return true;
  },

  /**
   * Unequip item from slot
   * @param {string} slot - Slot to unequip
   * @returns {boolean} True if unequipped
   */
  unequip(slot) {
    const item = State.meta.equipment[slot];
    if (!item) return false;

    if (isStashFull()) {
      console.warn('[Items] Cannot unequip: stash is full');
      return false;
    }

    // Move to stash
    this.addToStash(item);
    State.meta.equipment[slot] = null;

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playUI('unequip');
    }

    // Update UI
    if (State.modules?.UI) {
      State.modules.UI.renderAll();
    }

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    return true;
  },

  /**
   * Sell item for scrap
   * @param {string} itemId - Item ID to sell
   * @returns {number} Scrap gained (0 if failed)
   */
  sell(itemId) {
    const item = this.removeFromStash(itemId);
    if (!item) return 0;

    const value = item.sellValue || this.calculateSellValue(item.rarity, item.ilvl);

    // Apply vendor discount (negative = bonus)
    const discount = State.player.vendorDiscount || 0;
    const finalValue = Math.round(value * (1 + discount));

    // Add scrap
    State.meta.scrap += finalValue;

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    if (State.modules?.UI) {
      State.modules.UI.renderAll();
    }

    console.log('[Items] Sold', item.name, 'for', finalValue, 'scrap');
    return finalValue;
  },

  /**
   * Salvage item for shards
   * @param {string} itemId - Item ID to salvage
   * @returns {number} Shards gained (0 if failed)
   */
  salvage(itemId) {
    const item = this.removeFromStash(itemId);
    if (!item) return 0;

    const shards = this.calculateSalvageValue(item);
    addShards(shards);

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    if (State.modules?.UI) {
      State.modules.UI.renderAll();
    }

    console.log('[Items] Salvaged', item.name, 'for', shards, 'shards');
    return shards;
  },

  // ============================================================
  // ITEM DISPLAY HELPERS
  // ============================================================

  /**
   * Get item rarity color
   * @param {string} rarity - Item rarity
   * @returns {string} CSS color
   */
  getRarityColor(rarity) {
    return State.data.items?.rarityColors?.[rarity] || '#8899aa';
  },

  /**
   * Format affix for display
   * @param {object} affix - Affix object
   * @returns {string} Formatted affix text
   */
  formatAffix(affix) {
    const affixDef = State.data.items?.affixes?.[affix.id];
    if (!affixDef) return '';

    const sign = affix.value >= 0 ? '+' : '';
    const suffix = affixDef.type === 'percent' ? '%' : '';

    return `${sign}${affix.value}${suffix} ${affixDef.name}`;
  },

  /**
   * Get item tooltip data
   * @param {object} item - Item
   * @returns {object} Tooltip data
   */
  getTooltipData(item) {
    return {
      name: item.name,
      rarity: item.rarity,
      slot: item.slot,
      ilvl: item.ilvl,
      baseStats: item.baseStats,
      affixes: item.affixes.map(a => this.formatAffix(a)),
      sellValue: item.sellValue,
      salvageValue: this.calculateSalvageValue(item),
      description: item.description
    };
  }
};

export default Items;
