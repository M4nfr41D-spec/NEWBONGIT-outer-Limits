# Changelog

All notable changes to M4NFROID GALACTICA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.0.0] - 2026-01-19

### 🚀 Major Release - True Endless System

#### Added
- **4-Act Endless Progression System**
  - Act 1: Level 1 → ∞ (Easy, ilvl 1+)
  - Act 2: Level 100 → ∞ (Medium, ilvl 100+)
  - Act 3: Level 250 → ∞ (Hard, ilvl 250+)
  - Act 4: Dynamic scaling (Player Level + 15 → ∞)

- **Early Game Retention Boost**
  - Level 1-25: +15% drop rate bonus
  - Level 1-25: +20% uncommon chance bonus
  - Level 1-25: +10% rare chance bonus

- **Complete Pause Menu Overhaul**
  - Fullscreen overlay with ESC key
  - 4 tabs: Inventory / Equipment / Stats / Skills
  - Slot type filtering (ALL, WEAPON, SHIELD, etc.)
  - Clean visual design with icons
  - HP/Shield bars remain in combat UI

- **Proper Equipment System**
  - Items transfer from Stash → Equipment slots
  - No more duplicate "e" markers
  - Unequip returns items to Stash
  - Clear slot type categorization

- **Enhanced Pity Protection**
  - Uncommon: Guaranteed every 8 items
  - Rare: Guaranteed every 25 items
  - Epic: Guaranteed every 150 items
  - Legendary: Guaranteed every 600 items

#### Changed
- **Drop Rate Rebalance**
  - Base drop: 20% → 12% (better long-term balance)
  - Elite drop: 50% → 35% (still rewarding)
  - Boss drop: 100% (unchanged, guaranteed rare+)

- **Player Power Scaling**
  - HP per level: 5 → 8 (more survivability)
  - Damage per level: 2% → 3% (better scaling)
  - Total HP at level 100: 600 → 900

- **Rarity Weight Distribution**
  - Common: 60% → 45% (less trash)
  - Uncommon: 25% → 35% (more accessible)
  - Rare: 10% → 15% (improved drop feel)
  - Epic/Legendary/Mythic: Unchanged

#### Fixed
- Items no longer duplicate when equipped
- Equipment properly transfers between stash and slots
- "e" marker confusion eliminated
- Slot types clearly visible with icons
- HP/Shield bars stay in combat UI (not in pause menu)
- Inventory system completely rebuilt
- Pause menu overlay clean and functional

#### Removed
- Old combat-time inventory panel
- Confusing equipment UI
- Duplicate item markers

---

## [2.4.4] - 2026-01-16

### Hotfix Release

#### Fixed
- Background tiles now load correctly (added `Background.prepareZone()`)
- "START RUN" button functional (added `Game.start()` method)
- Boss spawning interval corrected

#### Known Issues
- Items still duplicate in stash when equipped
- Sound hanging/looping issue
- Enemy sprites with white backgrounds

---

## [2.4.0] - 2026-01-15

### Endless Loop System Foundation

#### Added
- Item Level system (scales with depth/zone/act)
- Tiered Affix System (T5 → T0)
- Pity Protection (rare@15, epic@100, legendary@500)
- Depth-Based Rarity Floor
- 47 items total (expanded from 25)
- Enhanced affix tiers with ilvl gating

#### Changed
- Base drop rate: 5% → 2.5%
- Elite drop rate: 30% → 15%
- Depth HP scaling: +6% per depth
- Item level formula: Act base + depth bonus + zone bonus

---

## [2.3.0] - 2026-01-15

### Audio System

#### Added
- Complete Web Audio API engine
- 44 placeholder SFX files
- 6 music tracks (hub, combat, boss, victory, death, intense)
- Spatial audio support

---

## [2.0.0] - 2026-01-10

### Initial Public Release

#### Added
- 3 Acts with boss fights
- Hub-based act selection
- Basic loot system (5 rarities)
- WASD + mouse controls
- 8-directional combat
- Parallax backgrounds
- Enemy AI (5 types)

---

## Future Versions

### [3.1.0] - Planned
- EndlessActGenerator.js for true procedural
- Map Modifiers system
- Kill streak bonuses
- Multi-drop visual feedback

### [3.2.0] - Planned
- Unique items (10+)
- Basic crafting system
- Vendor integration
- Skill tree

### [3.3.0] - Planned
- Leaderboards
- Challenge rifts
- Set items
- Seasonal content

### [4.0.0] - Vision
- Multiplayer co-op
- Trading system
- Clans
- Global events

---

**Note**: This project follows semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes, complete rewrites
- MINOR: New features, significant additions
- PATCH: Bug fixes, small improvements
