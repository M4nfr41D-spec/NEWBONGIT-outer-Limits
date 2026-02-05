# M4NFROID GALACTICA - ENDLESS PROGRESSION ROADMAP v4.0

## Status: AWAITING APPROVAL
**Created**: 2026-02-02
**Target**: Transform into AAA-tier Endless ARPG Looter
**Philosophy**: Path of Exile depth + Diablo accessibility + Last Epoch respect-for-time

---

## CRITICAL RULES (ENFORCED)

```
1. NEVER REGRESSION WITHOUT CONFIRMATION
   - Every phase must be tested before moving to next
   - User approval required before major changes
   - Rollback points at each milestone

2. ALWAYS RESEARCH BEST PRACTICES
   - Monitor ARPG community insights (PoE2, D4, Last Epoch)
   - Apply proven retention mechanics
   - Balance casual accessibility with hardcore depth
```

---

# PART 1: DEBUGGING PLAN

## Phase 0: Critical Fixes (Before New Features)

### 0.1 Missing Runtime Modules
**Status**: CRITICAL - Game cannot run
**Issue**: main.js imports 15+ modules that don't exist

```
Required modules to create:
├── runtime/
│   ├── State.js           # Game state management
│   ├── DataLoader.js      # JSON data loading
│   ├── Save.js            # LocalStorage persistence
│   ├── Stats.js           # Stat calculation engine
│   ├── Leveling.js        # XP & level progression
│   ├── Items.js           # Item generation & management
│   ├── Player.js          # Player entity & controls
│   ├── Enemies.js         # Enemy AI & spawning
│   ├── Bullets.js         # Projectile system
│   ├── Pickups.js         # Loot pickup handling
│   ├── Particles.js       # Visual effects
│   ├── Input.js           # Keyboard/mouse handling
│   ├── UI.js              # DOM UI management
│   ├── PauseUI.js         # Pause menu system
│   ├── AssetLoader.js     # Image/audio preloading
│   ├── Audio.js           # Sound system
│   └── world/
│       ├── Camera.js      # Viewport management
│       ├── World.js       # Zone generation
│       ├── SceneManager.js # Scene transitions
│       └── SeededRandom.js # Deterministic RNG
```

### 0.2 Data Files Missing
**Status**: CRITICAL
**Issue**: No JSON data files for items, acts, enemies

```
Required data files:
├── data/
│   ├── acts.json          # Act definitions
│   ├── items.json         # Item base types & affixes
│   ├── enemies.json       # Enemy definitions
│   ├── skills.json        # Skill tree data
│   ├── vendors.json       # Vendor inventories & costs
│   └── achievements.json  # Achievement definitions
```

### 0.3 Known Bugs to Fix

| Bug ID | Severity | Description | Fix Strategy |
|--------|----------|-------------|--------------|
| BUG-001 | CRITICAL | Equipped item stats not applied to combat | Stats.calculate() must read equipment |
| BUG-002 | HIGH | Pity counters reset on save/load | Persist in State.meta |
| BUG-003 | MEDIUM | Audio loops indefinitely | Add proper track end handling |
| BUG-004 | LOW | Enemy sprites have white backgrounds | Convert to transparent PNG |
| BUG-005 | MEDIUM | Act 4 has no dedicated background | Create tile_endless.webp |

---

# PART 2: PLACEHOLDER ASSET SYSTEM

## Naming Convention (SIZE IN FILENAME)

### Item Icons
```
assets/icons/items/
├── weapon_laser_32x32.png
├── weapon_plasma_32x32.png
├── weapon_missile_32x32.png
├── shield_basic_32x32.png
├── shield_energy_32x32.png
├── engine_ion_32x32.png
├── engine_fusion_32x32.png
├── reactor_core_32x32.png
├── module_targeting_32x32.png
├── drone_repair_32x32.png
├── item_common_glow_32x32.png
├── item_uncommon_glow_32x32.png
├── item_rare_glow_32x32.png
├── item_epic_glow_32x32.png
├── item_legendary_glow_32x32.png
├── item_mythic_glow_32x32.png
└── [slot]_[name]_[WxH].png
```

### Enemy Sprites
```
assets/enemies/
├── enemy_drone_basic_64x64.png
├── enemy_drone_elite_64x64.png
├── enemy_fighter_basic_64x64.png
├── enemy_fighter_elite_64x64.png
├── enemy_bomber_basic_96x96.png
├── enemy_bomber_elite_96x96.png
├── enemy_carrier_128x128.png
├── enemy_boss_act1_256x256.png
├── enemy_boss_act2_256x256.png
├── enemy_boss_act3_256x256.png
├── enemy_boss_endless_256x256.png
└── [type]_[variant]_[WxH].png
```

### Particle Animations (6-8 Frames)
```
assets/particles/
├── explosion_small/
│   ├── frame_01_32x32.png
│   ├── frame_02_32x32.png
│   ├── frame_03_32x32.png
│   ├── frame_04_32x32.png
│   ├── frame_05_32x32.png
│   ├── frame_06_32x32.png
│   └── explosion_small.json  # Animation metadata
│
├── explosion_medium/
│   ├── frame_01_64x64.png ... frame_08_64x64.png
│
├── explosion_large/
│   ├── frame_01_128x128.png ... frame_08_128x128.png
│
├── thrust_flame/
│   ├── frame_01_24x48.png ... frame_06_24x48.png
│
├── muzzle_flash/
│   ├── frame_01_32x32.png ... frame_04_32x32.png
│
├── shield_hit/
│   ├── frame_01_64x64.png ... frame_06_64x64.png
│
├── loot_glow/
│   ├── common_frame_01_48x48.png ... frame_06_48x48.png
│   ├── rare_frame_01_48x48.png ... frame_06_48x48.png
│   ├── legendary_frame_01_48x48.png ... frame_06_48x48.png
│
└── [effect_name]/
    └── frame_XX_WxH.png
```

### Sound Effects (WAV Placeholders)
```
assets/audio/sfx/
├── combat/
│   ├── weapon_laser_fire.wav
│   ├── weapon_plasma_fire.wav
│   ├── weapon_missile_fire.wav
│   ├── weapon_missile_lock.wav
│   ├── impact_shield.wav
│   ├── impact_hull.wav
│   ├── impact_critical.wav
│   ├── enemy_death_small.wav
│   ├── enemy_death_medium.wav
│   ├── enemy_death_large.wav
│   └── enemy_death_boss.wav
│
├── loot/
│   ├── drop_common.wav
│   ├── drop_uncommon.wav
│   ├── drop_rare.wav
│   ├── drop_epic.wav
│   ├── drop_legendary.wav
│   ├── drop_mythic.wav
│   ├── pickup_item.wav
│   ├── pickup_scrap.wav
│   ├── pickup_cells.wav
│   └── pickup_health.wav
│
├── ui/
│   ├── equip_weapon.wav
│   ├── equip_armor.wav
│   ├── unequip.wav
│   ├── sell_item.wav
│   ├── buy_item.wav
│   ├── craft_start.wav
│   ├── craft_success.wav
│   ├── craft_fail.wav
│   ├── level_up.wav
│   ├── skill_unlock.wav
│   ├── achievement_pop.wav
│   ├── menu_open.wav
│   ├── menu_close.wav
│   ├── button_hover.wav
│   └── button_click.wav
│
├── ambient/
│   ├── engine_idle.wav
│   ├── engine_boost.wav
│   ├── shield_recharge.wav
│   └── alert_warning.wav
│
└── vendor/
    ├── vendor_greet.wav
    ├── vendor_buy.wav
    ├── vendor_sell.wav
    └── vendor_farewell.wav
```

---

# PART 3: ENDLESS PROGRESSION SYSTEM

## Core Philosophy (ARPG Best Practices 2025-2026)

Based on research from Path of Exile 2, Diablo 4, and Last Epoch:

### The "One More Run" Loop
```
EARN → SPEND → POWER UP → UNLOCK → EARN (repeat)
  ↑                                    |
  └────────────────────────────────────┘
```

### Key Retention Mechanics

1. **Deterministic + RNG Hybrid** (Last Epoch model)
   - Guaranteed progress paths (crafting, vendors)
   - RNG excitement (rare drops, lucky rolls)
   - Never pure casino, never pure grind

2. **Respect Player Time** (Anti-PoE2 burnout)
   - Meaningful drops every 3-5 minutes
   - Clear power progression visible hourly
   - Session goals achievable in 20-30 minutes

3. **Depth Without Overwhelm** (Diablo 4 clarity + PoE depth)
   - Simple surface, complex mastery
   - Tooltips explain everything
   - No hidden mechanics

---

## 3.1 ITEMIZATION OVERHAUL

### Rarity Tiers (6 Tiers)
```
COMMON     (Gray)   - Base stats only, vendor fodder
UNCOMMON   (Green)  - 1 affix, entry-level upgrades
RARE       (Blue)   - 2-3 affixes, core gameplay
EPIC       (Purple) - 3-4 affixes, build-defining
LEGENDARY  (Orange) - 4-5 affixes + unique effect
MYTHIC     (Pink)   - 5-6 affixes + multiple uniques, endgame chase
```

### Item Level (ilvl) System
```javascript
// ilvl determines stat ranges and affix tier availability
ilvl = ActBase + (ZoneDepth * 2) + (DifficultyMod * 10)

// Act Bases:
// Act 1: ilvl 1
// Act 2: ilvl 100
// Act 3: ilvl 250
// Act 4+: PlayerLevel + 15 (endless scaling)
```

### Affix Tiers (T5 → T0)
```
T5 (ilvl 1+)   - "Minor"      +1-5% stats
T4 (ilvl 20+)  - "Lesser"     +5-10% stats
T3 (ilvl 50+)  - "Standard"   +10-20% stats
T2 (ilvl 100+) - "Greater"    +20-35% stats
T1 (ilvl 200+) - "Superior"   +35-50% stats
T0 (ilvl 300+) - "Perfect"    +50-75% stats (Mythic only)
```

### Equipment Slots (7 Slots)
```
┌─────────────────────────────────────────┐
│  WEAPON      PRIMARY damage dealer      │
│  SECONDARY   Utility/backup weapon      │
│  SHIELD      Defensive layer            │
│  ENGINE      Movement speed + dodge     │
│  REACTOR     Energy pool + regen        │
│  MODULE      Passive bonuses            │
│  DRONE       Companion AI               │
└─────────────────────────────────────────┘
```

### Item Base Types (47+ items)
```
WEAPONS:
- Laser Cannon (fast, low damage)
- Plasma Rifle (balanced)
- Missile Launcher (slow, high damage)
- Ion Disruptor (energy damage)
- Railgun (pierce, single target)
- Flak Cannon (AoE, spread)
- Beam Emitter (continuous)
- Tesla Coil (chain lightning)

SHIELDS:
- Energy Barrier (balanced)
- Deflector Array (reflect %)
- Absorption Field (damage→energy)
- Phase Shield (dodge chance)

ENGINES:
- Ion Thruster (speed)
- Fusion Drive (acceleration)
- Warp Coil (teleport dash)
- Afterburner (boost duration)

REACTORS:
- Power Core (energy pool)
- Flux Capacitor (regen rate)
- Overcharger (burst energy)

MODULES:
- Targeting Computer (crit chance)
- Damage Amplifier (damage %)
- Hull Plating (armor)
- Auto-Repair (HP regen)
- Salvage Scanner (+scrap drops)

DRONES:
- Repair Drone (heal over time)
- Attack Drone (extra DPS)
- Shield Drone (absorb damage)
- Scavenger Drone (auto-pickup)
```

---

## 3.2 VENDOR & SINK SYSTEMS

### Currency Types (4 Currencies)
```
SCRAP ($)     - Common currency, drops from enemies
              - Used for: Basic purchases, repairs, rerolls
              - Sink ratio: 70% spent, 30% saved

CELLS (⚡)    - Rare currency, elite/boss drops
              - Used for: Upgrades, crafting, gambling
              - Sink ratio: 90% spent, 10% saved (high value)

SHARDS (◆)   - Crafting material, salvage items
              - Used for: Crafting, reforging, enchanting
              - Sink ratio: 100% consumed

CORES (★)    - Ultra-rare, boss-only drops
              - Used for: Legendary upgrades, skill resets
              - Sink ratio: 100% consumed
```

### Vendor NPCs (4 Vendors)

#### 1. SCRAPPER (Salvage Vendor)
```
PURPOSE: Convert items → resources
LOCATION: Hub station

SERVICES:
├── Salvage Item → Shards (based on rarity)
│   ├── Common    → 1-2 Shards
│   ├── Uncommon  → 3-5 Shards
│   ├── Rare      → 8-12 Shards
│   ├── Epic      → 20-30 Shards
│   ├── Legendary → 50-75 Shards
│   └── Mythic    → 100-150 Shards
│
├── Bulk Salvage (all items below rarity)
└── Sell Item → Scrap (quick cash)
```

#### 2. QUARTERMASTER (Equipment Vendor)
```
PURPOSE: Buy/sell equipment
LOCATION: Hub station

SERVICES:
├── Buy Items (rotating stock, refreshes per run)
│   ├── 3 Random Commons    (50-100 Scrap each)
│   ├── 2 Random Uncommons  (200-400 Scrap each)
│   └── 1 Random Rare       (1000-2000 Scrap each)
│
├── Gamble (mystery box, unknown rarity)
│   └── 500 Scrap → Random item (weighted by luck stat)
│
└── Sell to Vendor (item → scrap)
```

#### 3. ENGINEER (Upgrade Vendor)
```
PURPOSE: Permanent ship upgrades
LOCATION: Hub station

UPGRADE TREES (Cells currency):
├── OFFENSE TREE
│   ├── Base Damage +2%      (100 Cells, repeatable x20)
│   ├── Crit Chance +1%      (150 Cells, repeatable x10)
│   ├── Crit Damage +5%      (200 Cells, repeatable x10)
│   └── Attack Speed +2%     (175 Cells, repeatable x10)
│
├── DEFENSE TREE
│   ├── Max HP +3%           (100 Cells, repeatable x20)
│   ├── Max Shield +3%       (100 Cells, repeatable x20)
│   ├── Shield Regen +5%     (150 Cells, repeatable x10)
│   └── Armor +1             (200 Cells, repeatable x15)
│
├── UTILITY TREE
│   ├── Move Speed +2%       (125 Cells, repeatable x10)
│   ├── Pickup Radius +10%   (100 Cells, repeatable x10)
│   ├── XP Gain +5%          (200 Cells, repeatable x10)
│   └── Scrap Find +5%       (150 Cells, repeatable x10)
│
└── SPECIAL (one-time purchases)
    ├── Stash Slots +5       (500 Cells, max 5 purchases)
    ├── Equipment Loadout    (1000 Cells, unlocks loadout 2)
    └── Drone Slot           (2000 Cells, unlocks drone equipment)
```

#### 4. ARTIFICER (Crafting Vendor)
```
PURPOSE: Item crafting & modification
LOCATION: Hub station (unlocks at level 25)

CRAFTING RECIPES (Shards + Scrap):
├── REFORGE (reroll all affixes)
│   └── Cost: 50 Shards + 500 Scrap
│
├── AUGMENT (add 1 random affix)
│   └── Cost: 100 Shards + 1000 Scrap (max affixes = rarity cap)
│
├── TRANSMUTE (upgrade rarity)
│   ├── Common → Uncommon:   30 Shards + 300 Scrap
│   ├── Uncommon → Rare:     75 Shards + 750 Scrap
│   ├── Rare → Epic:         200 Shards + 2000 Scrap
│   └── Epic → Legendary:    500 Shards + 5000 Scrap + 1 Core
│
├── ENCHANT (add specific affix)
│   └── Cost: 150 Shards + 1500 Scrap + matching Rune
│
└── SOCKET (add gem slot)
    └── Cost: 250 Shards + 2500 Scrap (max 2 sockets)
```

### Economic Balance (Faucets & Sinks)

```
FAUCETS (Income):                    SINKS (Spending):
─────────────────                    ─────────────────
Enemy kills     → Scrap, XP          Vendor purchases
Elite kills     → Cells, Items       Upgrades
Boss kills      → Cores, Legendaries Crafting
Zone completion → Bonus Scrap        Reforging
Achievement     → Resources          Gambling
Salvage items   → Shards             Repairs (on death)

TARGET RATIO: 3:1 earn-to-spend for engaged players
INFLATION PROTECTION: Scaling costs at high levels
```

---

## 3.3 ENEMY SYSTEM

### Enemy Categories (5 Types)

```
DRONES (Tier 1)
├── Basic Drone    - Fast, weak, swarm AI
├── Shield Drone   - Protected, must break shield
└── Kamikaze Drone - Suicide rush, AoE damage

FIGHTERS (Tier 2)
├── Assault Fighter - Balanced, standard AI
├── Sniper Fighter  - Long range, windup shots
└── Stealth Fighter - Cloaks, ambush attacks

BOMBERS (Tier 3)
├── Plasma Bomber   - Slow, heavy AoE
├── Cluster Bomber  - Multi-projectile spread
└── Siege Bomber    - Stationary, heavy damage

CARRIERS (Tier 4)
├── Drone Carrier   - Spawns drone swarms
├── Elite Carrier   - Spawns elite fighters
└── Boss Carrier    - Mini-boss, high HP

BOSSES (Tier 5)
├── Act 1 Boss: "THE CORRUPTED CORE"
├── Act 2 Boss: "WARLORD VEX"
├── Act 3 Boss: "THE VOID EMPEROR"
└── Endless Bosses: Procedurally modified
```

### Elite Modifiers (15 Modifiers)
```
OFFENSIVE:
├── Enraged       - +50% damage, +30% attack speed
├── Multishot     - Fires 3 projectiles
├── Piercing      - Shots ignore shields
├── Homing        - Projectiles track player
└── Explosive     - AoE on hit

DEFENSIVE:
├── Armored       - 50% damage reduction
├── Shielded      - Regenerating energy shield
├── Vampiric      - Heals on hit
├── Reflective    - Returns 25% damage
└── Phasing       - 30% dodge chance

UTILITY:
├── Teleporter    - Blinks randomly
├── Summoner      - Spawns minions on damage
├── Aura: Damage  - Nearby enemies deal +25% damage
├── Aura: Speed   - Nearby enemies move +30% faster
└── Unstable      - Explodes on death
```

### Boss Mechanics (Phase-Based)
```
BOSS STRUCTURE:
├── Phase 1 (100%-66% HP) - Standard attacks
├── Phase 2 (66%-33% HP)  - New ability unlocked
├── Phase 3 (33%-0% HP)   - Enrage mode, all abilities
│
└── Each phase:
    ├── Unique attack patterns
    ├── Summon waves
    ├── Environmental hazards
    └── Damage windows (vulnerability)
```

---

## 3.4 SKILL SYSTEM

### Skill Trees (3 Trees)

```
┌─────────────────────────────────────────────────────────────────┐
│                      OFFENSE TREE                                │
│  "Maximize damage output and critical strikes"                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Tier 1 - Unlocks at Level 5]                                  │
│  ├── Precision Strike: +5% crit chance per rank (5 ranks)       │
│  ├── Power Shot: +10% damage per rank (5 ranks)                 │
│  └── Rapid Fire: +3% attack speed per rank (5 ranks)            │
│                                                                  │
│  [Tier 2 - Unlocks at Level 15, requires 5 points in Tier 1]    │
│  ├── Armor Pierce: Ignore 5% armor per rank (5 ranks)           │
│  ├── Chain Lightning: 10% chance to chain per rank (3 ranks)    │
│  └── Explosive Rounds: 5% chance for AoE per rank (3 ranks)     │
│                                                                  │
│  [Tier 3 - Unlocks at Level 30, requires 10 points in tree]     │
│  ├── Execution: +50% damage vs <20% HP enemies (1 rank)         │
│  ├── Overcharge: Double damage, costs HP (1 rank)               │
│  └── Death Mark: Killed enemies explode (1 rank)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DEFENSE TREE                                │
│  "Survive longer and mitigate damage"                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Tier 1 - Unlocks at Level 5]                                  │
│  ├── Thick Hull: +5% max HP per rank (5 ranks)                  │
│  ├── Energy Shield: +5% max shield per rank (5 ranks)           │
│  └── Quick Repair: +10% HP regen per rank (5 ranks)             │
│                                                                  │
│  [Tier 2 - Unlocks at Level 15, requires 5 points in Tier 1]    │
│  ├── Damage Reduction: +2% DR per rank (5 ranks)                │
│  ├── Shield Surge: Shield regens 50% faster below 30% (3 ranks) │
│  └── Evasion: +3% dodge chance per rank (3 ranks)               │
│                                                                  │
│  [Tier 3 - Unlocks at Level 30, requires 10 points in tree]     │
│  ├── Last Stand: Immune for 3s at 1 HP, once per zone (1 rank)  │
│  ├── Reflect Shield: Return 25% damage while shielded (1 rank)  │
│  └── Regeneration: +1% HP/s in combat (1 rank)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY TREE                                │
│  "Quality of life and resource gains"                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Tier 1 - Unlocks at Level 5]                                  │
│  ├── Scavenger: +5% scrap drops per rank (5 ranks)              │
│  ├── Swift: +3% move speed per rank (5 ranks)                   │
│  └── Magnetism: +10% pickup radius per rank (5 ranks)           │
│                                                                  │
│  [Tier 2 - Unlocks at Level 15, requires 5 points in Tier 1]    │
│  ├── Lucky: +2% rare drop chance per rank (3 ranks)             │
│  ├── Efficient: -5% vendor costs per rank (3 ranks)             │
│  └── Experienced: +5% XP gain per rank (5 ranks)                │
│                                                                  │
│  [Tier 3 - Unlocks at Level 30, requires 10 points in tree]     │
│  ├── Treasure Hunter: Elites always drop items (1 rank)         │
│  ├── Merchant: Sell items for +50% value (1 rank)               │
│  └── Explorer: Reveal full minimap (1 rank)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Skill Point Economy
```
EARNING SKILL POINTS:
├── Level up: +1 skill point every 2 levels
├── Boss kills: +1 skill point per boss
├── Achievement: +1-3 skill points for milestones
└── Max points at level 100: ~75 points

SKILL RESET:
├── Free reset once per character
├── Subsequent resets: 1 Core each
└── Individual refund: 500 Scrap per point
```

---

## 3.5 STAT POINT SYSTEM

### Pilot Stats (5 Core Stats)
```
STRENGTH (STR)
├── +0.5% weapon damage per point
├── +1 armor per 5 points
└── Unlocks heavy weapons

DEXTERITY (DEX)
├── +0.3% attack speed per point
├── +0.2% crit chance per point
├── +0.5% dodge chance per 5 points
└── Unlocks precision weapons

INTELLIGENCE (INT)
├── +1% skill cooldown reduction per point
├── +0.5% status effect damage per point
└── Unlocks tech weapons

VITALITY (VIT)
├── +3 max HP per point
├── +1 HP regen per 10 points
└── Required for survival

ENERGY (ENR)
├── +2 max shield per point
├── +0.5% shield regen per point
└── Powers reactor-based skills
```

### Stat Point Allocation
```
EARNING STAT POINTS:
├── Level up: +3 stat points per level
├── Achievement milestones: +5 stat points
└── Max points at level 100: ~310 points

SOFT CAPS (diminishing returns):
├── 0-100 points: Full value
├── 101-200 points: 50% value
├── 201+ points: 25% value
```

### Recommended Builds
```
GLASS CANNON: 80 STR, 80 DEX, 30 INT, 50 VIT, 30 ENR
TANK:         40 STR, 30 DEX, 20 INT, 120 VIT, 100 ENR
BALANCED:     60 STR, 60 DEX, 40 INT, 80 VIT, 70 ENR
SPEED DEMON:  50 STR, 100 DEX, 50 INT, 50 VIT, 60 ENR
```

---

## 3.6 INVENTORY & EQUIPMENT

### Best Practice: Equipped ≠ In Stash
```
RULE: When item is equipped, it is NOT in stash (industry standard)

FLOW:
1. Item drops → Goes to STASH
2. Player equips → Moves from STASH to EQUIPMENT SLOT
3. Player unequips → Moves from EQUIPMENT SLOT back to STASH
4. No duplication, no confusion

UI CLARITY:
├── Equipment Panel: Shows 7 slots (always visible)
├── Stash Grid: Shows unequipped items only
├── No "E" markers needed (equipped items not shown in stash)
└── Drag-drop or click-to-equip supported
```

### Stash System
```
DEFAULT STASH: 25 slots (5x5 grid)
UPGRADEABLE:   +5 slots per upgrade (max 100 slots)
SORTING:       By rarity, by type, by ilvl, by recent
FILTERING:     By slot type, by rarity, by level requirement
```

### Equipment Loadouts (Future)
```
LOADOUT 1: Default (free)
LOADOUT 2: Unlockable (1000 Cells)
LOADOUT 3: Unlockable (2500 Cells)

QUICK SWAP: One-click loadout switching at hub
```

---

## 3.7 ENDLESS PROGRESSION MECHANICS

### Zone Scaling (Infinite)
```
ZONE 1-10:    Act 1 base difficulty
ZONE 11-20:   Act 2 base difficulty (+100 ilvl)
ZONE 21-30:   Act 3 base difficulty (+250 ilvl)
ZONE 31+:     Endless scaling (+15 ilvl per zone)

ENEMY SCALING:
├── HP: +6% per zone
├── Damage: +4% per zone
├── Speed: +1% per zone (capped at +50%)
└── Elite spawn rate: +0.5% per zone (capped at 25%)
```

### Zone Modifiers (Endgame Variety)
```
POSITIVE MODIFIERS (player buffs):
├── Treasure Zone: +100% item drops
├── XP Zone: +50% experience
├── Speed Zone: +30% player speed
└── Power Zone: +25% damage

NEGATIVE MODIFIERS (challenge):
├── Armored: All enemies have +50% armor
├── Haste: All enemies have +30% speed
├── Regenerating: Enemies heal 1% HP/s
├── Swarm: +100% enemy spawn rate
├── Volatile: Enemies explode on death
└── Boss Rush: 3 mini-bosses per zone
```

### Achievement System
```
CATEGORIES:
├── PROGRESSION: Reach zone X, reach level Y
├── COMBAT: Kill X enemies, deal Y damage
├── LOOT: Find X legendaries, salvage Y items
├── ECONOMY: Earn X scrap, spend Y cells
├── MASTERY: Max a skill tree, max a stat
└── CHALLENGE: Complete zone with modifier X

REWARDS:
├── Stat points
├── Skill points
├── Exclusive titles
├── Unique cosmetics
└── Starting bonuses
```

### Prestige System (Long-term)
```
AT ZONE 100+:
├── Option to "Prestige" (reset progress for permanent bonuses)
├── +5% global stat bonus per prestige
├── Unlock prestige-only cosmetics
├── Unlock prestige-only challenges
└── Max 10 prestiges
```

---

# PART 4: IMPLEMENTATION ROADMAP

## Phase 1: FOUNDATION (Week 1-2)
**Goal**: Get game running with all core systems

### 1.1 Create Runtime Modules
- [ ] State.js - Global state management
- [ ] DataLoader.js - JSON loading
- [ ] Save.js - LocalStorage persistence
- [ ] Input.js - Keyboard/mouse
- [ ] AssetLoader.js - Image/audio preload
- [ ] Audio.js - Sound system

### 1.2 Create Data Files
- [ ] acts.json - Act definitions
- [ ] items.json - Base items + affixes
- [ ] enemies.json - Enemy definitions

### 1.3 Core Game Systems
- [ ] Player.js - Movement, shooting, collision
- [ ] Enemies.js - Spawning, AI, damage
- [ ] Bullets.js - Projectile management
- [ ] Pickups.js - Loot collection

### 1.4 World Systems
- [ ] Camera.js - Viewport following
- [ ] World.js - Zone generation
- [ ] SceneManager.js - Scene transitions
- [ ] SeededRandom.js - Deterministic RNG

**CHECKPOINT**: Game runs, player can move and shoot enemies

---

## Phase 2: ITEMIZATION (Week 3-4)
**Goal**: Complete loot system with all mechanics

### 2.1 Item Generation
- [ ] Items.js - Full item generation
- [ ] Rarity system with weights
- [ ] Affix rolling with tiers
- [ ] Item level calculations

### 2.2 Equipment System
- [ ] Equipment slots (7 slots)
- [ ] Equip/unequip flow
- [ ] Stash management
- [ ] Stats from equipment applied

### 2.3 Drop System
- [ ] Enemy drop tables
- [ ] Pity protection (persisted)
- [ ] Elite/boss guaranteed drops
- [ ] Visual drop effects

**CHECKPOINT**: Loot drops, can equip items, stats affect combat

---

## Phase 3: VENDORS & ECONOMY (Week 5-6)
**Goal**: Complete currency sinks and vendors

### 3.1 Currency System
- [ ] Scrap tracking
- [ ] Cells tracking
- [ ] Shards from salvage
- [ ] Cores from bosses

### 3.2 Vendor NPCs
- [ ] Scrapper (salvage)
- [ ] Quartermaster (buy/sell)
- [ ] Engineer (upgrades)
- [ ] UI for all vendors

### 3.3 Economy Balance
- [ ] Drop rates tuning
- [ ] Cost scaling
- [ ] Sink/faucet ratio testing

**CHECKPOINT**: Can buy, sell, salvage, upgrade

---

## Phase 4: PROGRESSION SYSTEMS (Week 7-8)
**Goal**: Skill tree and stat allocation

### 4.1 Stat System
- [ ] Stats.js enhancement
- [ ] Stat point allocation UI
- [ ] Diminishing returns
- [ ] Stat effects in combat

### 4.2 Skill System
- [ ] skills.json data
- [ ] Skill tree UI
- [ ] Skill point spending
- [ ] Skill effects implementation

### 4.3 Leveling Polish
- [ ] Leveling.js enhancement
- [ ] XP curve balancing
- [ ] Level-up rewards

**CHECKPOINT**: Can allocate stats and skills, feel power growth

---

## Phase 5: ENEMIES & COMBAT (Week 9-10)
**Goal**: Enemy variety and combat depth

### 5.1 Enemy Types
- [ ] 5 enemy categories implemented
- [ ] Unique behaviors per type
- [ ] Sprite variations

### 5.2 Elite System
- [ ] 15 elite modifiers
- [ ] Visual indicators
- [ ] Modifier combinations

### 5.3 Boss System
- [ ] 3 act bosses
- [ ] Phase mechanics
- [ ] Endless boss scaling

**CHECKPOINT**: Combat feels varied and challenging

---

## Phase 6: ENDLESS & POLISH (Week 11-12)
**Goal**: True endless mode and final polish

### 6.1 Endless Mode
- [ ] Zone scaling beyond Act 3
- [ ] Zone modifiers
- [ ] Endless boss generation

### 6.2 Achievements
- [ ] achievements.json
- [ ] Achievement tracking
- [ ] Reward distribution

### 6.3 Placeholder Assets
- [ ] Item icon placeholders
- [ ] Enemy sprite placeholders
- [ ] Particle animation placeholders
- [ ] Sound effect placeholders

### 6.4 Crafting (Basic)
- [ ] Artificer vendor
- [ ] Reforge system
- [ ] Transmute system

**CHECKPOINT**: Game is endlessly playable with clear goals

---

# PART 5: CHANGELOG FORMAT

## Version Numbering
```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes, major systems
MINOR: New features, significant content
PATCH: Bug fixes, balance tweaks

Example: 4.0.0 → Major endless update
         4.1.0 → New vendor added
         4.1.1 → Bug fix for vendor
```

## Changelog Entry Format
```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- New features listed here

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Removed
- Features removed (with reasoning)

### Balance
- Number tweaks and tuning

### Known Issues
- Outstanding bugs being tracked
```

---

# APPROVAL CHECKLIST

Before implementation begins, please confirm:

- [ ] Roadmap scope is acceptable
- [ ] Phase priorities are correct
- [ ] Asset naming convention approved
- [ ] Currency/sink design approved
- [ ] Skill/stat design approved
- [ ] No concerns about regression risks

**YOUR FEEDBACK REQUESTED ON:**
1. Phase order preference
2. Feature priority adjustments
3. Any missing systems
4. Specific ARPG mechanics you want emphasized
5. Art style direction for placeholders

---

**AWAITING YOUR APPROVAL TO BEGIN PHASE 1**
