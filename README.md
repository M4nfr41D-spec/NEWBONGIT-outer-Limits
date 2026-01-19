# 🚀 M4NFROID GALACTICA v3.0.0

**True Endless Space Shooter ARPG** - Inspired by Gradius, Salamander, Diablo, and Path of Exile

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Alpha-yellow)

## 🎮 About

M4NFROID GALACTICA is a retro-style space shooter combined with modern ARPG mechanics:
- **Classic Arcade Action**: 8-directional combat inspired by Gradius and Salamander
- **Deep Progression**: Loot system inspired by Diablo and Path of Exile
- **True Endless**: 4 difficulty tiers with infinite scaling
- **Procedural Generation**: Seeded random maps for reproducible runs

## ✨ Key Features

### Endless Progression System
- **Act 1**: Level 1 → ∞ (Easy entry, ilvl 1+)
- **Act 2**: Level 100 → ∞ (Medium, ilvl 100+)
- **Act 3**: Level 250 → ∞ (Hard, ilvl 250+)
- **Act 4**: Dynamic scaling (Player Level + 15)

### Loot & Itemization
- **6 Rarity Tiers**: Common → Uncommon → Rare → Epic → Legendary → Mythic
- **Item Level System**: Scales with depth, zone, and act
- **Affix Tiers**: T5 (common) to T0 (mythic) with ilvl gating
- **Early Game Boost**: Level 1-25 players get increased drop rates
- **Pity Protection**: Guaranteed rarity thresholds
  - Uncommon: Every 8 items
  - Rare: Every 25 items
  - Epic: Every 150 items
  - Legendary: Every 600 items

### Equipment System
- **7 Slot Types**: Weapon, Secondary, Shield, Engine, Reactor, Module, Drone
- **Clean UI**: ESC for pause menu with Inventory/Equipment/Stats/Skills tabs
- **Proper Transfer**: Equipment moves between stash and slots (no duplication)
- **Visual Categorization**: Slot type filters and clear iconography

## 🎯 Gameplay Loop

```
Combat → Collect Loot → Sort Inventory (ESC) → Equip Best Items → 
Progress Deeper → Face Harder Enemies → Find Better Loot → Repeat
```

## 🚀 Quick Start

### Play Instantly
1. Download the latest release
2. Extract to a folder
3. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
4. Start playing!

### Controls
- **WASD / Arrow Keys**: Movement
- **Mouse**: Aim and fire
- **Space**: Fire weapon
- **E**: Interact with portals
- **ESC**: Pause menu / Inventory

### First Steps
1. Select Act 1 from the hub
2. Clear zones by defeating enemies
3. Collect loot drops
4. Press ESC to manage inventory
5. Equip better items
6. Progress through zones
7. Defeat bosses every 10 zones

## 📊 Game Balance

| System | Value | Notes |
|--------|-------|-------|
| Base Drop Rate | 12% | ~20-25 items/hour |
| Early Game Boost | +15% | For levels 1-25 |
| Elite Drop Rate | 35% | Meaningful but not guaranteed |
| Boss Drop Rate | 100% | Always rare+ quality |
| XP per Level | Polynomial | Smooth curve to level 100+ |
| Enemy HP Scaling | +6% per depth | Exponential growth |
| Player HP per Level | +8 | Linear scaling |
| Player Damage per Level | +3% | Multiplicative |

## 🗂️ Project Structure

```
M4NFROID_GALACTICA_v3/
├── index.html              # Main game file
├── main.js                 # Game controller
├── pause-ui-styles.css     # Pause menu styling
├── data/                   # JSON configurations
│   ├── acts.json           # 4 acts with endless config
│   ├── config.json         # Balance parameters
│   ├── rarities.json       # Rarity tier definitions
│   ├── items.json          # Base item templates
│   ├── affixes.json        # Prefix/suffix modifiers
│   ├── enemies.json        # Enemy definitions
│   └── ...
├── runtime/                # Core game logic
│   ├── Items.js            # Item generation & equipment
│   ├── PauseUI.js          # Pause menu system
│   ├── Player.js           # Player controller
│   ├── Enemies.js          # Enemy AI & spawning
│   ├── Pickups.js          # Loot drop system
│   ├── State.js            # Global game state
│   └── world/              # World generation
│       ├── MapGenerator.js # Procedural map creation
│       ├── SeededRandom.js # Deterministic RNG
│       └── SceneManager.js # Act/zone management
├── assets/                 # Graphics & audio
└── docs/                   # Documentation
```

## 🛠️ Development

### Technologies
- **Vanilla JavaScript** (ES6 modules)
- **HTML5 Canvas** for rendering
- **Web Audio API** for sound
- **LocalStorage** for save persistence

### Adding New Content

#### New Items
Edit `data/items.json`:
```json
{
  "plasma_lance": {
    "name": "Plasma Lance",
    "slot": "weapon",
    "icon": "🔫",
    "stats": {
      "damage": [25, 40],
      "fireRate": [2, 4]
    },
    "rarities": ["rare", "epic", "legendary"]
  }
}
```

#### New Enemies
Edit `data/enemies.json`:
```json
{
  "voidling": {
    "name": "Voidling",
    "hp": [50, 100],
    "damage": [10, 20],
    "speed": 100,
    "behavior": "chase_player"
  }
}
```

## 🎨 Art & Assets

- **Player Ship**: 5-directional sprites (N, NE, E, SE, S)
- **Enemies**: Top-down sprites with animations
- **Backgrounds**: Parallax layers (terrain/space)
- **Effects**: Particle systems, explosions, damage numbers

**Asset Paths**:
- `assets/sprites/player/` - Player ship sprites
- `assets/sprites/enemies/` - Enemy sprites
- `assets/backgrounds/` - Tileable backgrounds
- `assets/audio/` - Music and SFX

## 📈 Roadmap

### v3.1 - Endless Content (Week 2)
- [ ] EndlessActGenerator.js for true procedural
- [ ] Map Modifiers system (10+ modifiers)
- [ ] Kill streak bonus UI
- [ ] Multi-drop visual feedback

### v3.2 - Endgame Systems (Week 3)
- [ ] Unique items (10+ items)
- [ ] Crafting system basics
- [ ] Vendor integration in pause menu
- [ ] Skill tree implementation

### v3.3 - Competitive Features (Week 4)
- [ ] Leaderboards (depth reached)
- [ ] Challenge rifts (5 modes)
- [ ] Set items (3-5 sets)
- [ ] Seasonal content

### v4.0 - Multiplayer (Long-term)
- [ ] Co-op mode (2-4 players)
- [ ] Trading system
- [ ] Clan support
- [ ] Global events

## 🐛 Known Issues

### Critical
- Act 4 endless generation needs EndlessActGenerator.js
- Stats from equipped items not yet applied to player
- Pity counters don't persist through save/load

### Medium
- Audio may loop indefinitely (known bug from v2.4)
- Boss spawning interval needs verification
- Act 4 needs dedicated background tile

### Low
- Skill system not yet implemented
- Vendor system needs UI integration
- Some enemy behaviors incomplete

## 🤝 Contributing

This is a personal project by Manfred Foissner. Currently not accepting external contributions, but feedback and bug reports are welcome!

## 📜 License

Copyright (c) 2026 Manfred Foissner. All rights reserved.

This is proprietary software. See LICENSE.txt for details.

## 🙏 Credits

### Inspiration
- **Gradius/Salamander/Lifeforce** - Classic space shooter gameplay
- **Diablo II/III** - ARPG loot mechanics
- **Path of Exile** - Endless mapping and itemization depth
- **Last Epoch** - Modern ARPG quality-of-life features

### Development
- **Engine**: Custom JavaScript/Canvas
- **Design & Code**: Manfred Foissner
- **AI Assistant**: Claude (Anthropic) for systems design consultation

## 📞 Contact

- **Developer**: Manfred Foissner
- **Role**: Mechanical Engineer, ICF Coach (ACC), Local Council Member
- **Location**: Vienna, Austria

---

**Version**: 3.0.0  
**Release Date**: January 19, 2026  
**Status**: Alpha - Active Development  
**Play Time**: Endless (literally!)
