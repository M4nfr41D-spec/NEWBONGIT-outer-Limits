// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// DATALOADER.js - JSON Data Loading System
// ============================================================
// Loads game data files (acts, items, enemies, skills, etc.)

import { State } from './State.js';

// ============================================================
// DATA FILE PATHS
// ============================================================
const DATA_FILES = {
  acts: './data/acts.json',
  items: './data/items.json',
  enemies: './data/enemies.json',
  skills: './data/skills.json',
  vendors: './data/vendors.json',
  achievements: './data/achievements.json'
};

// ============================================================
// LOADING FUNCTIONS
// ============================================================

/**
 * Load a single JSON file
 * @param {string} path - File path
 * @returns {Promise<object>} Parsed JSON data
 */
async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`[DataLoader] File not found: ${path}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[DataLoader] Error loading ${path}:`, error.message);
    return null;
  }
}

/**
 * Load all data files
 * @returns {Promise<void>}
 */
export async function loadAllData() {
  console.log('[DataLoader] Loading game data...');

  // Load all files in parallel
  const [acts, items, enemies, skills, vendors, achievements] = await Promise.all([
    loadJSON(DATA_FILES.acts),
    loadJSON(DATA_FILES.items),
    loadJSON(DATA_FILES.enemies),
    loadJSON(DATA_FILES.skills),
    loadJSON(DATA_FILES.vendors),
    loadJSON(DATA_FILES.achievements)
  ]);

  // Store in State
  State.data.acts = acts || getDefaultActs();
  State.data.items = items || getDefaultItems();
  State.data.enemies = enemies || getDefaultEnemies();
  State.data.skills = skills || getDefaultSkills();
  State.data.vendors = vendors || getDefaultVendors();
  State.data.achievements = achievements || getDefaultAchievements();

  console.log('[DataLoader] Data loaded:', {
    acts: Object.keys(State.data.acts).length,
    items: Object.keys(State.data.items.baseTypes || {}).length,
    enemies: Object.keys(State.data.enemies).length,
    skills: Object.keys(State.data.skills).length
  });
}

// ============================================================
// DEFAULT DATA (Fallbacks if JSON files don't exist)
// ============================================================

function getDefaultActs() {
  return {
    act1: {
      id: 'act1',
      name: 'The Void Sector',
      description: 'A desolate region of space, perfect for beginners.',
      zones: 10,
      baseLevel: 1,
      background: 'tile_void',
      unlocked: true,
      rewards: {
        completionScrap: 500,
        unlocks: ['act2']
      },
      boss: {
        id: 'boss_corrupted_core',
        name: 'THE CORRUPTED CORE'
      }
    },
    act2: {
      id: 'act2',
      name: 'City Ruins',
      description: 'The remains of an ancient civilization.',
      zones: 10,
      baseLevel: 100,
      background: 'tile_city_ruins',
      unlocked: false,
      rewards: {
        completionScrap: 2000,
        unlocks: ['act3']
      },
      boss: {
        id: 'boss_warlord_vex',
        name: 'WARLORD VEX'
      }
    },
    act3: {
      id: 'act3',
      name: 'Toxicity Zone',
      description: 'Hazardous region with lethal environmental damage.',
      zones: 10,
      baseLevel: 250,
      background: 'tile_toxicity',
      unlocked: false,
      rewards: {
        completionScrap: 5000,
        unlocks: ['act4']
      },
      boss: {
        id: 'boss_void_emperor',
        name: 'THE VOID EMPEROR'
      }
    },
    act4: {
      id: 'act4',
      name: 'Endless Abyss',
      description: 'Infinite scaling challenge. How far can you go?',
      zones: 999,
      baseLevel: 0, // Dynamic: playerLevel + 15
      background: 'tile_void',
      unlocked: false,
      endless: true,
      rewards: {
        completionScrap: 0 // No end
      }
    }
  };
}

function getDefaultItems() {
  return {
    // Rarity weights
    rarityWeights: {
      common: 45,
      uncommon: 35,
      rare: 15,
      epic: 3,
      legendary: 1,
      mythic: 0.1
    },

    // Rarity colors
    rarityColors: {
      common: '#8899aa',
      uncommon: '#22dd55',
      rare: '#2288ff',
      epic: '#aa44ff',
      legendary: '#ff8800',
      mythic: '#ff4488'
    },

    // Rarity affix counts
    rarityAffixes: {
      common: { min: 0, max: 0 },
      uncommon: { min: 1, max: 1 },
      rare: { min: 2, max: 3 },
      epic: { min: 3, max: 4 },
      legendary: { min: 4, max: 5 },
      mythic: { min: 5, max: 6 }
    },

    // ilvl requirements for rarity drops
    rarityIlvl: {
      common: 1,
      uncommon: 5,
      rare: 20,
      epic: 50,
      legendary: 100,
      mythic: 250
    },

    // Base item types
    baseTypes: {
      // WEAPONS
      laser_cannon: {
        id: 'laser_cannon',
        name: 'Laser Cannon',
        slot: 'weapon',
        baseStats: { damage: 10, fireRate: 0.2 },
        description: 'Standard energy weapon. Fast and reliable.'
      },
      plasma_rifle: {
        id: 'plasma_rifle',
        name: 'Plasma Rifle',
        slot: 'weapon',
        baseStats: { damage: 18, fireRate: 0.35 },
        description: 'Balanced plasma weapon with good damage.'
      },
      missile_launcher: {
        id: 'missile_launcher',
        name: 'Missile Launcher',
        slot: 'weapon',
        baseStats: { damage: 45, fireRate: 0.8, aoe: 50 },
        description: 'Slow but devastating explosive damage.'
      },
      ion_disruptor: {
        id: 'ion_disruptor',
        name: 'Ion Disruptor',
        slot: 'weapon',
        baseStats: { damage: 15, fireRate: 0.25, shieldDamage: 1.5 },
        description: 'Deals extra damage to shields.'
      },
      railgun: {
        id: 'railgun',
        name: 'Railgun',
        slot: 'weapon',
        baseStats: { damage: 60, fireRate: 1.2, pierce: 3 },
        description: 'Pierces through multiple enemies.'
      },
      flak_cannon: {
        id: 'flak_cannon',
        name: 'Flak Cannon',
        slot: 'weapon',
        baseStats: { damage: 8, fireRate: 0.15, projectiles: 5 },
        description: 'Fires a spread of projectiles.'
      },
      beam_emitter: {
        id: 'beam_emitter',
        name: 'Beam Emitter',
        slot: 'weapon',
        baseStats: { damage: 3, fireRate: 0, continuous: true },
        description: 'Continuous beam weapon. Hold to fire.'
      },
      tesla_coil: {
        id: 'tesla_coil',
        name: 'Tesla Coil',
        slot: 'weapon',
        baseStats: { damage: 12, fireRate: 0.4, chain: 3 },
        description: 'Lightning chains between enemies.'
      },

      // SHIELDS
      energy_barrier: {
        id: 'energy_barrier',
        name: 'Energy Barrier',
        slot: 'shield',
        baseStats: { shield: 50, shieldRegen: 2 },
        description: 'Standard energy shield.'
      },
      deflector_array: {
        id: 'deflector_array',
        name: 'Deflector Array',
        slot: 'shield',
        baseStats: { shield: 30, shieldRegen: 1, reflect: 0.15 },
        description: 'Reflects 15% of incoming damage.'
      },
      absorption_field: {
        id: 'absorption_field',
        name: 'Absorption Field',
        slot: 'shield',
        baseStats: { shield: 40, shieldRegen: 1.5, absorb: 0.1 },
        description: 'Converts 10% of damage to energy.'
      },
      phase_shield: {
        id: 'phase_shield',
        name: 'Phase Shield',
        slot: 'shield',
        baseStats: { shield: 25, shieldRegen: 3, dodgeChance: 0.1 },
        description: 'Low capacity but grants dodge chance.'
      },

      // ENGINES
      ion_thruster: {
        id: 'ion_thruster',
        name: 'Ion Thruster',
        slot: 'engine',
        baseStats: { moveSpeed: 30 },
        description: 'Standard propulsion system.'
      },
      fusion_drive: {
        id: 'fusion_drive',
        name: 'Fusion Drive',
        slot: 'engine',
        baseStats: { moveSpeed: 20, acceleration: 1.5 },
        description: 'Better acceleration, slightly slower.'
      },
      warp_coil: {
        id: 'warp_coil',
        name: 'Warp Coil',
        slot: 'engine',
        baseStats: { moveSpeed: 15, dash: true, dashCooldown: 3 },
        description: 'Enables short-range teleport dash.'
      },
      afterburner: {
        id: 'afterburner',
        name: 'Afterburner',
        slot: 'engine',
        baseStats: { moveSpeed: 25, boostSpeed: 100, boostDuration: 2 },
        description: 'Temporary speed boost ability.'
      },

      // REACTORS
      power_core: {
        id: 'power_core',
        name: 'Power Core',
        slot: 'reactor',
        baseStats: { energy: 100, energyRegen: 5 },
        description: 'Standard energy reactor.'
      },
      flux_capacitor: {
        id: 'flux_capacitor',
        name: 'Flux Capacitor',
        slot: 'reactor',
        baseStats: { energy: 60, energyRegen: 10 },
        description: 'Fast recharge, lower capacity.'
      },
      overcharger: {
        id: 'overcharger',
        name: 'Overcharger',
        slot: 'reactor',
        baseStats: { energy: 150, energyRegen: 3, overcharge: true },
        description: 'Can overcharge for burst damage.'
      },

      // MODULES
      targeting_computer: {
        id: 'targeting_computer',
        name: 'Targeting Computer',
        slot: 'module',
        baseStats: { critChance: 0.08 },
        description: 'Increases critical hit chance.'
      },
      damage_amplifier: {
        id: 'damage_amplifier',
        name: 'Damage Amplifier',
        slot: 'module',
        baseStats: { damageBonus: 0.15 },
        description: 'Increases all damage dealt.'
      },
      hull_plating: {
        id: 'hull_plating',
        name: 'Hull Plating',
        slot: 'module',
        baseStats: { armor: 10, maxHP: 25 },
        description: 'Adds armor and hull strength.'
      },
      auto_repair: {
        id: 'auto_repair',
        name: 'Auto-Repair System',
        slot: 'module',
        baseStats: { hpRegen: 1 },
        description: 'Slowly regenerates hull over time.'
      },
      salvage_scanner: {
        id: 'salvage_scanner',
        name: 'Salvage Scanner',
        slot: 'module',
        baseStats: { scrapBonus: 0.2, pickupRadius: 25 },
        description: 'Find more scrap and auto-collect.'
      },

      // DRONES
      repair_drone: {
        id: 'repair_drone',
        name: 'Repair Drone',
        slot: 'drone',
        baseStats: { hpRegen: 2, healOnKill: 5 },
        description: 'Provides constant healing.'
      },
      attack_drone: {
        id: 'attack_drone',
        name: 'Attack Drone',
        slot: 'drone',
        baseStats: { droneDamage: 5, droneFireRate: 0.5 },
        description: 'Autonomous attack companion.'
      },
      shield_drone: {
        id: 'shield_drone',
        name: 'Shield Drone',
        slot: 'drone',
        baseStats: { droneShield: 30, droneAbsorb: 0.2 },
        description: 'Absorbs 20% of incoming damage.'
      },
      scavenger_drone: {
        id: 'scavenger_drone',
        name: 'Scavenger Drone',
        slot: 'drone',
        baseStats: { autoPickup: true, pickupRadius: 100 },
        description: 'Automatically collects nearby loot.'
      }
    },

    // Affixes (modifiers that can roll on items)
    affixes: {
      // Offensive affixes
      damage_flat: {
        id: 'damage_flat',
        name: 'Damage',
        stat: 'damage',
        type: 'flat',
        tiers: {
          T5: { min: 1, max: 3, ilvl: 1 },
          T4: { min: 3, max: 6, ilvl: 20 },
          T3: { min: 6, max: 12, ilvl: 50 },
          T2: { min: 12, max: 20, ilvl: 100 },
          T1: { min: 20, max: 35, ilvl: 200 },
          T0: { min: 35, max: 50, ilvl: 300 }
        }
      },
      damage_percent: {
        id: 'damage_percent',
        name: 'Damage',
        stat: 'damageBonus',
        type: 'percent',
        tiers: {
          T5: { min: 2, max: 5, ilvl: 1 },
          T4: { min: 5, max: 10, ilvl: 20 },
          T3: { min: 10, max: 18, ilvl: 50 },
          T2: { min: 18, max: 30, ilvl: 100 },
          T1: { min: 30, max: 45, ilvl: 200 },
          T0: { min: 45, max: 65, ilvl: 300 }
        }
      },
      crit_chance: {
        id: 'crit_chance',
        name: 'Critical Chance',
        stat: 'critChance',
        type: 'percent',
        tiers: {
          T5: { min: 1, max: 2, ilvl: 1 },
          T4: { min: 2, max: 4, ilvl: 20 },
          T3: { min: 4, max: 7, ilvl: 50 },
          T2: { min: 7, max: 10, ilvl: 100 },
          T1: { min: 10, max: 15, ilvl: 200 },
          T0: { min: 15, max: 20, ilvl: 300 }
        }
      },
      crit_damage: {
        id: 'crit_damage',
        name: 'Critical Damage',
        stat: 'critDamage',
        type: 'percent',
        tiers: {
          T5: { min: 5, max: 10, ilvl: 1 },
          T4: { min: 10, max: 20, ilvl: 20 },
          T3: { min: 20, max: 35, ilvl: 50 },
          T2: { min: 35, max: 50, ilvl: 100 },
          T1: { min: 50, max: 75, ilvl: 200 },
          T0: { min: 75, max: 100, ilvl: 300 }
        }
      },
      attack_speed: {
        id: 'attack_speed',
        name: 'Attack Speed',
        stat: 'attackSpeed',
        type: 'percent',
        tiers: {
          T5: { min: 2, max: 5, ilvl: 1 },
          T4: { min: 5, max: 10, ilvl: 20 },
          T3: { min: 10, max: 15, ilvl: 50 },
          T2: { min: 15, max: 22, ilvl: 100 },
          T1: { min: 22, max: 30, ilvl: 200 },
          T0: { min: 30, max: 40, ilvl: 300 }
        }
      },

      // Defensive affixes
      hp_flat: {
        id: 'hp_flat',
        name: 'Max HP',
        stat: 'maxHP',
        type: 'flat',
        tiers: {
          T5: { min: 5, max: 15, ilvl: 1 },
          T4: { min: 15, max: 35, ilvl: 20 },
          T3: { min: 35, max: 60, ilvl: 50 },
          T2: { min: 60, max: 100, ilvl: 100 },
          T1: { min: 100, max: 150, ilvl: 200 },
          T0: { min: 150, max: 250, ilvl: 300 }
        }
      },
      shield_flat: {
        id: 'shield_flat',
        name: 'Shield',
        stat: 'shield',
        type: 'flat',
        tiers: {
          T5: { min: 5, max: 12, ilvl: 1 },
          T4: { min: 12, max: 25, ilvl: 20 },
          T3: { min: 25, max: 45, ilvl: 50 },
          T2: { min: 45, max: 75, ilvl: 100 },
          T1: { min: 75, max: 120, ilvl: 200 },
          T0: { min: 120, max: 180, ilvl: 300 }
        }
      },
      armor: {
        id: 'armor',
        name: 'Armor',
        stat: 'armor',
        type: 'flat',
        tiers: {
          T5: { min: 1, max: 3, ilvl: 1 },
          T4: { min: 3, max: 6, ilvl: 20 },
          T3: { min: 6, max: 10, ilvl: 50 },
          T2: { min: 10, max: 15, ilvl: 100 },
          T1: { min: 15, max: 22, ilvl: 200 },
          T0: { min: 22, max: 30, ilvl: 300 }
        }
      },
      dodge: {
        id: 'dodge',
        name: 'Dodge Chance',
        stat: 'dodgeChance',
        type: 'percent',
        tiers: {
          T5: { min: 1, max: 2, ilvl: 1 },
          T4: { min: 2, max: 4, ilvl: 20 },
          T3: { min: 4, max: 6, ilvl: 50 },
          T2: { min: 6, max: 9, ilvl: 100 },
          T1: { min: 9, max: 12, ilvl: 200 },
          T0: { min: 12, max: 15, ilvl: 300 }
        }
      },

      // Utility affixes
      move_speed: {
        id: 'move_speed',
        name: 'Movement Speed',
        stat: 'moveSpeed',
        type: 'flat',
        tiers: {
          T5: { min: 5, max: 10, ilvl: 1 },
          T4: { min: 10, max: 18, ilvl: 20 },
          T3: { min: 18, max: 28, ilvl: 50 },
          T2: { min: 28, max: 40, ilvl: 100 },
          T1: { min: 40, max: 55, ilvl: 200 },
          T0: { min: 55, max: 75, ilvl: 300 }
        }
      },
      scrap_find: {
        id: 'scrap_find',
        name: 'Scrap Find',
        stat: 'scrapBonus',
        type: 'percent',
        tiers: {
          T5: { min: 3, max: 8, ilvl: 1 },
          T4: { min: 8, max: 15, ilvl: 20 },
          T3: { min: 15, max: 25, ilvl: 50 },
          T2: { min: 25, max: 40, ilvl: 100 },
          T1: { min: 40, max: 60, ilvl: 200 },
          T0: { min: 60, max: 80, ilvl: 300 }
        }
      },
      xp_bonus: {
        id: 'xp_bonus',
        name: 'Experience Gain',
        stat: 'xpBonus',
        type: 'percent',
        tiers: {
          T5: { min: 2, max: 5, ilvl: 1 },
          T4: { min: 5, max: 10, ilvl: 20 },
          T3: { min: 10, max: 18, ilvl: 50 },
          T2: { min: 18, max: 28, ilvl: 100 },
          T1: { min: 28, max: 40, ilvl: 200 },
          T0: { min: 40, max: 55, ilvl: 300 }
        }
      }
    }
  };
}

function getDefaultEnemies() {
  return {
    // TIER 1 - DRONES
    drone_basic: {
      id: 'drone_basic',
      name: 'Scout Drone',
      tier: 1,
      hp: 15,
      damage: 5,
      speed: 120,
      fireRate: 1.5,
      xp: 5,
      scrap: { min: 1, max: 3 },
      behavior: 'swarm',
      sprite: 'enemy_drone_basic_64x64'
    },
    drone_shield: {
      id: 'drone_shield',
      name: 'Shield Drone',
      tier: 1,
      hp: 10,
      shield: 20,
      damage: 3,
      speed: 100,
      fireRate: 2,
      xp: 8,
      scrap: { min: 2, max: 5 },
      behavior: 'defensive',
      sprite: 'enemy_drone_elite_64x64'
    },
    drone_kamikaze: {
      id: 'drone_kamikaze',
      name: 'Kamikaze Drone',
      tier: 1,
      hp: 8,
      damage: 25,
      speed: 180,
      xp: 6,
      scrap: { min: 1, max: 4 },
      behavior: 'suicide',
      aoeRadius: 40,
      sprite: 'enemy_drone_basic_64x64'
    },

    // TIER 2 - FIGHTERS
    fighter_assault: {
      id: 'fighter_assault',
      name: 'Assault Fighter',
      tier: 2,
      hp: 40,
      damage: 10,
      speed: 100,
      fireRate: 0.8,
      xp: 15,
      scrap: { min: 3, max: 8 },
      behavior: 'aggressive',
      sprite: 'enemy_fighter_basic_64x64'
    },
    fighter_sniper: {
      id: 'fighter_sniper',
      name: 'Sniper Fighter',
      tier: 2,
      hp: 25,
      damage: 30,
      speed: 60,
      fireRate: 2.5,
      range: 400,
      xp: 20,
      scrap: { min: 5, max: 12 },
      behavior: 'ranged',
      sprite: 'enemy_sniper'
    },
    fighter_stealth: {
      id: 'fighter_stealth',
      name: 'Stealth Fighter',
      tier: 2,
      hp: 30,
      damage: 18,
      speed: 140,
      fireRate: 1.2,
      xp: 25,
      scrap: { min: 4, max: 10 },
      behavior: 'ambush',
      canCloak: true,
      sprite: 'enemy_fighter_elite_64x64'
    },

    // TIER 3 - BOMBERS
    bomber_plasma: {
      id: 'bomber_plasma',
      name: 'Plasma Bomber',
      tier: 3,
      hp: 80,
      damage: 35,
      speed: 50,
      fireRate: 2,
      aoeRadius: 60,
      xp: 40,
      scrap: { min: 8, max: 20 },
      behavior: 'artillery',
      sprite: 'enemy_bomber_basic_96x96'
    },
    bomber_cluster: {
      id: 'bomber_cluster',
      name: 'Cluster Bomber',
      tier: 3,
      hp: 60,
      damage: 15,
      speed: 60,
      fireRate: 1.5,
      projectiles: 6,
      xp: 45,
      scrap: { min: 10, max: 25 },
      behavior: 'spread',
      sprite: 'enemy_bomber_elite_96x96'
    },

    // TIER 4 - CARRIERS
    carrier_drone: {
      id: 'carrier_drone',
      name: 'Drone Carrier',
      tier: 4,
      hp: 150,
      damage: 10,
      speed: 30,
      spawnRate: 3,
      spawnType: 'drone_basic',
      maxSpawns: 6,
      xp: 80,
      scrap: { min: 20, max: 50 },
      behavior: 'spawner',
      sprite: 'enemy_carrier_128x128'
    },

    // ELITE MODIFIERS
    eliteModifiers: {
      enraged: { name: 'Enraged', damage: 1.5, attackSpeed: 1.3, color: '#ff4444' },
      multishot: { name: 'Multishot', projectiles: 3, color: '#ff8844' },
      piercing: { name: 'Piercing', ignoreShield: true, color: '#ffff44' },
      homing: { name: 'Homing', homing: true, color: '#44ff44' },
      explosive: { name: 'Explosive', aoeRadius: 40, color: '#ff44ff' },
      armored: { name: 'Armored', damageReduction: 0.5, color: '#888888' },
      shielded: { name: 'Shielded', shield: 50, shieldRegen: 5, color: '#4444ff' },
      vampiric: { name: 'Vampiric', lifesteal: 0.25, color: '#ff0088' },
      reflective: { name: 'Reflective', reflect: 0.25, color: '#88ffff' },
      phasing: { name: 'Phasing', dodgeChance: 0.3, color: '#aa88ff' },
      teleporter: { name: 'Teleporter', canTeleport: true, teleportCooldown: 3, color: '#8800ff' },
      summoner: { name: 'Summoner', summonOnHit: true, summonType: 'drone_basic', color: '#00ff88' },
      auraDamage: { name: 'Damage Aura', auraDamage: 0.25, auraRadius: 150, color: '#ff8800' },
      auraSpeed: { name: 'Speed Aura', auraSpeed: 0.3, auraRadius: 150, color: '#00ffff' },
      unstable: { name: 'Unstable', explodeOnDeath: true, explodeRadius: 80, explodeDamage: 50, color: '#ffff00' }
    },

    // BOSSES
    bosses: {
      boss_corrupted_core: {
        id: 'boss_corrupted_core',
        name: 'THE CORRUPTED CORE',
        act: 'act1',
        hp: 2000,
        phases: [
          { hpPercent: 1.0, attacks: ['laser_sweep', 'spawn_drones'] },
          { hpPercent: 0.66, attacks: ['laser_sweep', 'spawn_drones', 'charge_beam'] },
          { hpPercent: 0.33, attacks: ['laser_sweep', 'spawn_drones', 'charge_beam', 'enrage'] }
        ],
        rewards: { cells: 50, guaranteedDrop: 'rare', core: true },
        sprite: 'enemy_boss_act1_256x256'
      },
      boss_warlord_vex: {
        id: 'boss_warlord_vex',
        name: 'WARLORD VEX',
        act: 'act2',
        hp: 5000,
        shield: 1000,
        phases: [
          { hpPercent: 1.0, attacks: ['missile_barrage', 'shield_bash'] },
          { hpPercent: 0.66, attacks: ['missile_barrage', 'shield_bash', 'summon_elites'] },
          { hpPercent: 0.33, attacks: ['missile_barrage', 'shield_bash', 'summon_elites', 'berserk'] }
        ],
        rewards: { cells: 150, guaranteedDrop: 'epic', core: true },
        sprite: 'enemy_boss_act2_256x256'
      },
      boss_void_emperor: {
        id: 'boss_void_emperor',
        name: 'THE VOID EMPEROR',
        act: 'act3',
        hp: 12000,
        shield: 3000,
        phases: [
          { hpPercent: 1.0, attacks: ['void_beam', 'gravity_well'] },
          { hpPercent: 0.66, attacks: ['void_beam', 'gravity_well', 'dimension_rift'] },
          { hpPercent: 0.33, attacks: ['void_beam', 'gravity_well', 'dimension_rift', 'final_form'] }
        ],
        rewards: { cells: 500, guaranteedDrop: 'legendary', core: true },
        sprite: 'enemy_boss_act3_256x256'
      }
    }
  };
}

function getDefaultSkills() {
  return {
    // OFFENSE TREE - Tier 1
    precision_strike: {
      id: 'precision_strike',
      name: 'Precision Strike',
      tree: 'offense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+1% critical chance per rank',
      effect: { critChance: 0.01 }
    },
    power_shot: {
      id: 'power_shot',
      name: 'Power Shot',
      tree: 'offense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+2% damage per rank',
      effect: { damageBonus: 0.02 }
    },
    rapid_fire: {
      id: 'rapid_fire',
      name: 'Rapid Fire',
      tree: 'offense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+3% attack speed per rank',
      effect: { attackSpeed: 0.03 }
    },

    // OFFENSE TREE - Tier 2
    armor_pierce: {
      id: 'armor_pierce',
      name: 'Armor Pierce',
      tree: 'offense',
      tier: 2,
      maxRanks: 5,
      levelRequired: 15,
      requires: { power_shot: 3 },
      description: 'Ignore 5% enemy armor per rank',
      effect: { armorPen: 0.05 }
    },
    chain_lightning: {
      id: 'chain_lightning',
      name: 'Chain Lightning',
      tree: 'offense',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { precision_strike: 3 },
      description: '10% chance to chain to nearby enemy per rank',
      effect: { chainChance: 0.1 }
    },
    explosive_rounds: {
      id: 'explosive_rounds',
      name: 'Explosive Rounds',
      tree: 'offense',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { rapid_fire: 3 },
      description: '5% chance for AoE explosion per rank',
      effect: { explosionChance: 0.05 }
    },

    // OFFENSE TREE - Tier 3
    execution: {
      id: 'execution',
      name: 'Execution',
      tree: 'offense',
      tier: 3,
      maxRanks: 1,
      levelRequired: 30,
      requires: { armor_pierce: 3 },
      description: '+50% damage vs enemies below 20% HP',
      effect: { executeDamage: 0.5, executeThreshold: 0.2 }
    },

    // DEFENSE TREE - Tier 1
    thick_hull: {
      id: 'thick_hull',
      name: 'Thick Hull',
      tree: 'defense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+5% max HP per rank',
      effect: { maxHPBonus: 0.05 }
    },
    energy_shield: {
      id: 'energy_shield',
      name: 'Energy Shield',
      tree: 'defense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+5% max shield per rank',
      effect: { maxShieldBonus: 0.05 }
    },
    quick_repair: {
      id: 'quick_repair',
      name: 'Quick Repair',
      tree: 'defense',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+10% HP regen per rank',
      effect: { hpRegenBonus: 0.1 }
    },

    // DEFENSE TREE - Tier 2
    damage_reduction: {
      id: 'damage_reduction',
      name: 'Damage Reduction',
      tree: 'defense',
      tier: 2,
      maxRanks: 5,
      levelRequired: 15,
      requires: { thick_hull: 3 },
      description: '+2% damage reduction per rank',
      effect: { damageReduction: 0.02 }
    },
    shield_surge: {
      id: 'shield_surge',
      name: 'Shield Surge',
      tree: 'defense',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { energy_shield: 3 },
      description: '+50% shield regen when below 30% shield per rank',
      effect: { lowShieldRegen: 0.5 }
    },
    evasion: {
      id: 'evasion',
      name: 'Evasion',
      tree: 'defense',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { quick_repair: 3 },
      description: '+3% dodge chance per rank',
      effect: { dodgeChance: 0.03 }
    },

    // DEFENSE TREE - Tier 3
    last_stand: {
      id: 'last_stand',
      name: 'Last Stand',
      tree: 'defense',
      tier: 3,
      maxRanks: 1,
      levelRequired: 30,
      requires: { damage_reduction: 3 },
      description: 'Become immune for 3s at 1 HP (once per zone)',
      effect: { lastStand: true, lastStandDuration: 3 }
    },

    // UTILITY TREE - Tier 1
    scavenger: {
      id: 'scavenger',
      name: 'Scavenger',
      tree: 'utility',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+5% scrap drops per rank',
      effect: { scrapBonus: 0.05 }
    },
    swift: {
      id: 'swift',
      name: 'Swift',
      tree: 'utility',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+3% move speed per rank',
      effect: { moveSpeedBonus: 0.03 }
    },
    magnetism: {
      id: 'magnetism',
      name: 'Magnetism',
      tree: 'utility',
      tier: 1,
      maxRanks: 5,
      levelRequired: 5,
      description: '+10% pickup radius per rank',
      effect: { pickupRadiusBonus: 0.1 }
    },

    // UTILITY TREE - Tier 2
    lucky: {
      id: 'lucky',
      name: 'Lucky',
      tree: 'utility',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { scavenger: 3 },
      description: '+2% rare drop chance per rank',
      effect: { rareDropBonus: 0.02 }
    },
    efficient: {
      id: 'efficient',
      name: 'Efficient',
      tree: 'utility',
      tier: 2,
      maxRanks: 3,
      levelRequired: 15,
      requires: { swift: 3 },
      description: '-5% vendor costs per rank',
      effect: { vendorDiscount: 0.05 }
    },
    experienced: {
      id: 'experienced',
      name: 'Experienced',
      tree: 'utility',
      tier: 2,
      maxRanks: 5,
      levelRequired: 15,
      requires: { magnetism: 3 },
      description: '+5% XP gain per rank',
      effect: { xpBonus: 0.05 }
    },

    // UTILITY TREE - Tier 3
    treasure_hunter: {
      id: 'treasure_hunter',
      name: 'Treasure Hunter',
      tree: 'utility',
      tier: 3,
      maxRanks: 1,
      levelRequired: 30,
      requires: { lucky: 2 },
      description: 'Elite enemies always drop items',
      effect: { eliteGuaranteedDrop: true }
    }
  };
}

function getDefaultVendors() {
  return {
    scrapper: {
      id: 'scrapper',
      name: 'The Scrapper',
      description: 'Salvage items for materials',
      services: ['salvage', 'bulk_salvage', 'sell']
    },
    quartermaster: {
      id: 'quartermaster',
      name: 'Quartermaster',
      description: 'Buy and sell equipment',
      services: ['buy', 'sell', 'gamble'],
      inventory: {
        commons: 3,
        uncommons: 2,
        rares: 1
      },
      gambleCost: 500
    },
    engineer: {
      id: 'engineer',
      name: 'Chief Engineer',
      description: 'Permanent ship upgrades',
      upgrades: {
        offense: {
          baseDamage: { cost: 100, max: 20, perLevel: 0.02 },
          critChance: { cost: 150, max: 10, perLevel: 0.01 },
          critDamage: { cost: 200, max: 10, perLevel: 0.05 },
          attackSpeed: { cost: 175, max: 10, perLevel: 0.02 }
        },
        defense: {
          maxHP: { cost: 100, max: 20, perLevel: 0.03 },
          maxShield: { cost: 100, max: 20, perLevel: 0.03 },
          shieldRegen: { cost: 150, max: 10, perLevel: 0.05 },
          armor: { cost: 200, max: 15, perLevel: 1 }
        },
        utility: {
          moveSpeed: { cost: 125, max: 10, perLevel: 0.02 },
          pickupRadius: { cost: 100, max: 10, perLevel: 0.1 },
          xpGain: { cost: 200, max: 10, perLevel: 0.05 },
          scrapFind: { cost: 150, max: 10, perLevel: 0.05 }
        }
      }
    },
    artificer: {
      id: 'artificer',
      name: 'The Artificer',
      description: 'Craft and modify items',
      unlockLevel: 25,
      services: {
        reforge: { shards: 50, scrap: 500 },
        augment: { shards: 100, scrap: 1000 },
        transmute: {
          uncommon: { shards: 30, scrap: 300 },
          rare: { shards: 75, scrap: 750 },
          epic: { shards: 200, scrap: 2000 },
          legendary: { shards: 500, scrap: 5000, cores: 1 }
        }
      }
    }
  };
}

function getDefaultAchievements() {
  return {
    // Progression achievements
    reach_zone_10: {
      id: 'reach_zone_10',
      name: 'Explorer',
      description: 'Reach Zone 10',
      condition: { type: 'zone', value: 10 },
      rewards: { statPoints: 3 }
    },
    reach_zone_50: {
      id: 'reach_zone_50',
      name: 'Veteran Explorer',
      description: 'Reach Zone 50',
      condition: { type: 'zone', value: 50 },
      rewards: { statPoints: 5, scrap: 5000 }
    },
    reach_level_50: {
      id: 'reach_level_50',
      name: 'Seasoned Pilot',
      description: 'Reach Level 50',
      condition: { type: 'level', value: 50 },
      rewards: { skillPoints: 2 }
    },
    reach_level_100: {
      id: 'reach_level_100',
      name: 'Master Pilot',
      description: 'Reach Level 100',
      condition: { type: 'level', value: 100 },
      rewards: { skillPoints: 5, statPoints: 10 }
    },

    // Combat achievements
    kill_1000: {
      id: 'kill_1000',
      name: 'Destroyer',
      description: 'Kill 1,000 enemies',
      condition: { type: 'kills', value: 1000 },
      rewards: { scrap: 1000 }
    },
    kill_10000: {
      id: 'kill_10000',
      name: 'Annihilator',
      description: 'Kill 10,000 enemies',
      condition: { type: 'kills', value: 10000 },
      rewards: { scrap: 10000, statPoints: 5 }
    },

    // Loot achievements
    find_legendary: {
      id: 'find_legendary',
      name: 'Lucky Find',
      description: 'Find your first Legendary item',
      condition: { type: 'loot_rarity', value: 'legendary' },
      rewards: { scrap: 2000 }
    },
    find_mythic: {
      id: 'find_mythic',
      name: 'Mythic Discovery',
      description: 'Find your first Mythic item',
      condition: { type: 'loot_rarity', value: 'mythic' },
      rewards: { scrap: 10000, skillPoints: 3 }
    },

    // Boss achievements
    defeat_act1_boss: {
      id: 'defeat_act1_boss',
      name: 'Core Crusher',
      description: 'Defeat the Corrupted Core',
      condition: { type: 'boss', value: 'boss_corrupted_core' },
      rewards: { scrap: 500, skillPoints: 1 }
    },
    defeat_act2_boss: {
      id: 'defeat_act2_boss',
      name: 'Vex Slayer',
      description: 'Defeat Warlord Vex',
      condition: { type: 'boss', value: 'boss_warlord_vex' },
      rewards: { scrap: 2000, skillPoints: 2 }
    },
    defeat_act3_boss: {
      id: 'defeat_act3_boss',
      name: 'Emperor\'s End',
      description: 'Defeat the Void Emperor',
      condition: { type: 'boss', value: 'boss_void_emperor' },
      rewards: { scrap: 5000, skillPoints: 3 }
    }
  };
}

export { loadJSON };
