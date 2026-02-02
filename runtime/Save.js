// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// SAVE.js - LocalStorage Persistence System
// ============================================================
// Handles saving and loading game state to localStorage

import { State } from './State.js';

const SAVE_KEY = 'bonzookaa_save_v4';
const SAVE_VERSION = 4;

export const Save = {
  // ============================================================
  // SAVE GAME
  // ============================================================

  /**
   * Save current game state to localStorage
   */
  save() {
    try {
      const saveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        meta: {
          level: State.meta.level,
          xp: State.meta.xp,
          scrap: State.meta.scrap,
          skillPoints: State.meta.skillPoints,
          statPoints: State.meta.statPoints,
          pilotStats: { ...State.meta.pilotStats },
          skills: { ...State.meta.skills },
          stash: State.meta.stash.map(item => this.serializeItem(item)),
          equipment: this.serializeEquipment(State.meta.equipment),
          upgrades: JSON.parse(JSON.stringify(State.meta.upgrades)),
          pity: { ...State.meta.pity },
          actsUnlocked: { ...State.meta.actsUnlocked },
          actsCompleted: { ...State.meta.actsCompleted },
          totalKills: State.meta.totalKills,
          totalPlaytime: State.meta.totalPlaytime,
          totalRuns: State.meta.totalRuns,
          highestZone: State.meta.highestZone,
          highestLevel: State.meta.highestLevel,
          achievements: [...State.meta.achievements],
          settings: { ...State.meta.settings }
        }
      };

      const json = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, json);

      console.log('[Save] Game saved successfully');
      return true;
    } catch (error) {
      console.error('[Save] Failed to save:', error);
      return false;
    }
  },

  // ============================================================
  // LOAD GAME
  // ============================================================

  /**
   * Load game state from localStorage
   */
  load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) {
        console.log('[Save] No save found, starting fresh');
        return false;
      }

      const saveData = JSON.parse(json);

      // Version migration
      if (saveData.version < SAVE_VERSION) {
        console.log(`[Save] Migrating save from v${saveData.version} to v${SAVE_VERSION}`);
        this.migrate(saveData);
      }

      // Load meta state
      const meta = saveData.meta;
      if (meta) {
        State.meta.level = meta.level || 1;
        State.meta.xp = meta.xp || 0;
        State.meta.scrap = meta.scrap || 0;
        State.meta.skillPoints = meta.skillPoints || 0;
        State.meta.statPoints = meta.statPoints || 3;

        // Pilot stats
        if (meta.pilotStats) {
          State.meta.pilotStats = {
            strength: meta.pilotStats.strength || 0,
            dexterity: meta.pilotStats.dexterity || 0,
            intelligence: meta.pilotStats.intelligence || 0,
            vitality: meta.pilotStats.vitality || 0,
            energy: meta.pilotStats.energy || 0
          };
        }

        // Skills
        State.meta.skills = meta.skills || {};

        // Inventory
        State.meta.stash = (meta.stash || []).map(item => this.deserializeItem(item)).filter(Boolean);
        State.meta.equipment = this.deserializeEquipment(meta.equipment);

        // Upgrades
        if (meta.upgrades) {
          State.meta.upgrades = JSON.parse(JSON.stringify(meta.upgrades));
        }

        // Pity counters (CRITICAL: persist these!)
        if (meta.pity) {
          State.meta.pity = {
            uncommon: meta.pity.uncommon || 0,
            rare: meta.pity.rare || 0,
            epic: meta.pity.epic || 0,
            legendary: meta.pity.legendary || 0
          };
        }

        // Progress
        State.meta.actsUnlocked = meta.actsUnlocked || { act1: true };
        State.meta.actsCompleted = meta.actsCompleted || {};

        // Statistics
        State.meta.totalKills = meta.totalKills || 0;
        State.meta.totalPlaytime = meta.totalPlaytime || 0;
        State.meta.totalRuns = meta.totalRuns || 0;
        State.meta.highestZone = meta.highestZone || 0;
        State.meta.highestLevel = Math.max(meta.highestLevel || 1, State.meta.level);

        // Achievements
        State.meta.achievements = meta.achievements || [];

        // Settings
        if (meta.settings) {
          State.meta.settings = {
            musicVolume: meta.settings.musicVolume ?? 0.5,
            sfxVolume: meta.settings.sfxVolume ?? 0.7,
            screenShake: meta.settings.screenShake ?? true
          };
        }
      }

      console.log('[Save] Game loaded successfully');
      return true;
    } catch (error) {
      console.error('[Save] Failed to load:', error);
      return false;
    }
  },

  // ============================================================
  // ITEM SERIALIZATION
  // ============================================================

  /**
   * Serialize an item for storage
   * @param {object} item - Item to serialize
   * @returns {object} Serialized item
   */
  serializeItem(item) {
    if (!item) return null;
    return {
      id: item.id,
      baseType: item.baseType,
      rarity: item.rarity,
      ilvl: item.ilvl,
      name: item.name,
      slot: item.slot,
      baseStats: { ...item.baseStats },
      affixes: item.affixes ? item.affixes.map(a => ({
        id: a.id,
        tier: a.tier,
        value: a.value
      })) : [],
      sellValue: item.sellValue
    };
  },

  /**
   * Deserialize an item from storage
   * @param {object} data - Serialized item data
   * @returns {object} Reconstructed item
   */
  deserializeItem(data) {
    if (!data) return null;

    // Rebuild item from base type data
    const baseType = State.data.items?.baseTypes?.[data.baseType];

    return {
      id: data.id,
      baseType: data.baseType,
      rarity: data.rarity,
      ilvl: data.ilvl || 1,
      name: data.name,
      slot: data.slot || baseType?.slot || 'weapon',
      baseStats: data.baseStats || baseType?.baseStats || {},
      description: baseType?.description || '',
      affixes: data.affixes || [],
      sellValue: data.sellValue || 10
    };
  },

  /**
   * Serialize equipment slots
   * @param {object} equipment - Equipment object
   * @returns {object} Serialized equipment
   */
  serializeEquipment(equipment) {
    const result = {};
    for (const [slot, item] of Object.entries(equipment)) {
      result[slot] = item ? this.serializeItem(item) : null;
    }
    return result;
  },

  /**
   * Deserialize equipment slots
   * @param {object} data - Serialized equipment data
   * @returns {object} Reconstructed equipment
   */
  deserializeEquipment(data) {
    const result = {
      weapon: null,
      secondary: null,
      shield: null,
      engine: null,
      reactor: null,
      module: null,
      drone: null
    };

    if (data) {
      for (const [slot, itemData] of Object.entries(data)) {
        if (result.hasOwnProperty(slot) && itemData) {
          result[slot] = this.deserializeItem(itemData);
        }
      }
    }

    return result;
  },

  // ============================================================
  // MIGRATION
  // ============================================================

  /**
   * Migrate save data from older versions
   * @param {object} saveData - Save data to migrate
   */
  migrate(saveData) {
    // v1 -> v2: Add pity system
    if (saveData.version < 2) {
      saveData.meta.pity = {
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      };
    }

    // v2 -> v3: Add pilot stats
    if (saveData.version < 3) {
      saveData.meta.pilotStats = {
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        vitality: 0,
        energy: 0
      };
      saveData.meta.statPoints = saveData.meta.level * 3;
    }

    // v3 -> v4: Add skills and upgrades
    if (saveData.version < 4) {
      saveData.meta.skills = {};
      saveData.meta.upgrades = {
        offense: { baseDamage: 0, critChance: 0, critDamage: 0, attackSpeed: 0 },
        defense: { maxHP: 0, maxShield: 0, shieldRegen: 0, armor: 0 },
        utility: { moveSpeed: 0, pickupRadius: 0, xpGain: 0, scrapFind: 0 },
        special: { stashSlots: 0, loadouts: 1, droneSlot: false }
      };
    }

    saveData.version = SAVE_VERSION;
  },

  // ============================================================
  // UTILITY
  // ============================================================

  /**
   * Delete save data
   */
  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    console.log('[Save] Save deleted');
  },

  /**
   * Export save as JSON string
   * @returns {string} Save data as JSON
   */
  exportSave() {
    return localStorage.getItem(SAVE_KEY) || '';
  },

  /**
   * Import save from JSON string
   * @param {string} json - Save data as JSON
   * @returns {boolean} Success
   */
  importSave(json) {
    try {
      JSON.parse(json); // Validate
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if save exists
   * @returns {boolean} True if save exists
   */
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  /**
   * Get save info without loading
   * @returns {object|null} Save metadata
   */
  getSaveInfo() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      const data = JSON.parse(json);
      return {
        version: data.version,
        timestamp: data.timestamp,
        level: data.meta?.level || 1,
        scrap: data.meta?.scrap || 0,
        playTime: data.meta?.totalPlaytime || 0
      };
    } catch {
      return null;
    }
  }
};

export default Save;
