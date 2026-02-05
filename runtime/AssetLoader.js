// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// ASSETLOADER.js - Image and Audio Asset Management
// ============================================================
// Preloads and caches all game assets

export const Assets = {
  // Asset caches
  images: {},
  audio: {},

  // Loading state
  loaded: false,
  loadProgress: 0,
  totalAssets: 0,
  loadedAssets: 0,

  // ============================================================
  // ASSET DEFINITIONS
  // ============================================================

  imageList: {
    // Player
    player_ship: 'assets/player_ship.png',

    // Enemies
    enemy_corrupted_spawn: 'assets/enemies/enemy_corrupted_spawn.png',
    enemy_sniper: 'assets/enemies/enemy_sniper.png',

    // Asteroids (obstacles)
    asteroid_1: 'assets/asteroids/asteroid_1.png',
    asteroid_2: 'assets/asteroids/asteroid_2.png',

    // Decorative asteroids
    asteroid_deco_1: 'assets/asteroids_deco/asteroid_deco_1.png',
    asteroid_deco_2: 'assets/asteroids_deco/asteroid_deco_2.png',
    asteroid_deco_3: 'assets/asteroids_deco/asteroid_deco_3.png',
    asteroid_deco_4: 'assets/asteroids_deco/asteroid_deco_4.png',
    asteroid_deco_big: 'assets/asteroids_deco/asteroid_deco_big.png',
    asteroid_deco_cluster: 'assets/asteroids_deco/asteroid_deco_cluster.png',
    deco_rock: 'assets/asteroids_deco/deco_rock.png',

    // Backgrounds
    tile_void: 'assets/backgrounds/tile_void.webp',
    tile_city_ruins: 'assets/backgrounds/tile_city_ruins.webp',
    tile_toxicity: 'assets/backgrounds/tile_toxicity.webp',

    // Fog/effects
    fog_1: 'assets/fog/fog_1.png',
    fog_5: 'assets/fog/fog_5.png',
    fog_14: 'assets/fog/fog_14.png'
  },

  audioList: {
    // Music
    music_hub: 'assets/audio/music/hub.wav',
    music_combat: 'assets/audio/music/combat.wav',
    music_combat_intense: 'assets/audio/music/combat_intense.wav',
    music_boss: 'assets/audio/music/boss.wav',
    music_death: 'assets/audio/music/death.wav',
    music_victory: 'assets/audio/music/victory.wav',

    // Player SFX
    player_shoot_1: 'assets/audio/sfx/player_shoot_1.wav',
    player_shoot_2: 'assets/audio/sfx/player_shoot_2.wav',
    player_shoot_3: 'assets/audio/sfx/player_shoot_3.wav',
    player_hit: 'assets/audio/sfx/player_hit.wav',
    player_death: 'assets/audio/sfx/player_death.wav',

    // Enemy SFX
    enemy_shoot_1: 'assets/audio/sfx/enemy_shoot_1.wav',
    enemy_shoot_2: 'assets/audio/sfx/enemy_shoot_2.wav',
    enemy_hit_1: 'assets/audio/sfx/enemy_hit_1.wav',
    enemy_hit_2: 'assets/audio/sfx/enemy_hit_2.wav',
    enemy_hit_3: 'assets/audio/sfx/enemy_hit_3.wav',
    enemy_death_1: 'assets/audio/sfx/enemy_death_1.wav',
    enemy_death_2: 'assets/audio/sfx/enemy_death_2.wav',
    enemy_death_3: 'assets/audio/sfx/enemy_death_3.wav',

    // Pickup SFX
    pickup_item: 'assets/audio/sfx/pickup_item.wav',
    pickup_health: 'assets/audio/sfx/pickup_health.wav',
    pickup_cell: 'assets/audio/sfx/pickup_cell.wav',
    pickup_scrap_1: 'assets/audio/sfx/pickup_scrap_1.wav',
    pickup_scrap_2: 'assets/audio/sfx/pickup_scrap_2.wav',
    pickup_rare: 'assets/audio/sfx/pickup_rare.wav',
    pickup_legendary: 'assets/audio/sfx/pickup_legendary.wav',

    // UI SFX
    ui_click: 'assets/audio/sfx/ui_click.wav',
    ui_hover: 'assets/audio/sfx/ui_hover.wav',
    ui_error: 'assets/audio/sfx/ui_error.wav',
    ui_success: 'assets/audio/sfx/ui_success.wav',
    ui_equip: 'assets/audio/sfx/ui_equip.wav',
    ui_unequip: 'assets/audio/sfx/ui_unequip.wav',

    // Combat SFX
    shield_hit: 'assets/audio/sfx/shield_hit.wav',
    shield_break: 'assets/audio/sfx/shield_break.wav',
    elite_spawn: 'assets/audio/sfx/elite_spawn.wav',
    boss_spawn: 'assets/audio/sfx/boss_spawn.wav',
    boss_death: 'assets/audio/sfx/boss_death.wav',

    // World SFX
    portal_open: 'assets/audio/sfx/portal_open.wav',
    portal_enter: 'assets/audio/sfx/portal_enter.wav',
    zone_transition: 'assets/audio/sfx/zone_transition.wav',
    level_up: 'assets/audio/sfx/level_up.wav',
    skill_unlock: 'assets/audio/sfx/skill_unlock.wav',
    achievement: 'assets/audio/sfx/achievement.wav',

    // Misc SFX
    asteroid_hit: 'assets/audio/sfx/asteroid_hit.wav',
    asteroid_destroy: 'assets/audio/sfx/asteroid_destroy.wav',
    sniper_windup: 'assets/audio/sfx/sniper_windup.wav',
    corruption_dot: 'assets/audio/sfx/corruption_dot.wav'
  },

  // ============================================================
  // LOADING
  // ============================================================

  /**
   * Load all assets
   * @returns {Promise<void>}
   */
  async loadAll() {
    console.log('[Assets] Loading assets...');

    const imageKeys = Object.keys(this.imageList);
    const audioKeys = Object.keys(this.audioList);
    this.totalAssets = imageKeys.length + audioKeys.length;
    this.loadedAssets = 0;

    // Load images
    const imagePromises = imageKeys.map(key => this.loadImage(key, this.imageList[key]));

    // Load audio (with fallback for missing files)
    const audioPromises = audioKeys.map(key => this.loadAudio(key, this.audioList[key]));

    // Wait for all
    await Promise.all([...imagePromises, ...audioPromises]);

    this.loaded = true;
    console.log(`[Assets] Loaded ${this.loadedAssets}/${this.totalAssets} assets`);
  },

  /**
   * Load a single image
   * @param {string} key - Asset key
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  loadImage(key, path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        this.loadedAssets++;
        this.loadProgress = this.loadedAssets / this.totalAssets;
        resolve();
      };
      img.onerror = () => {
        console.warn(`[Assets] Failed to load image: ${path}`);
        // Create placeholder
        this.images[key] = this.createPlaceholder(64, 64, '#ff00ff');
        this.loadedAssets++;
        this.loadProgress = this.loadedAssets / this.totalAssets;
        resolve();
      };
      img.src = path;
    });
  },

  /**
   * Load a single audio file
   * @param {string} key - Asset key
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  loadAudio(key, path) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.audio[key] = audio;
        this.loadedAssets++;
        this.loadProgress = this.loadedAssets / this.totalAssets;
        resolve();
      };
      audio.onerror = () => {
        console.warn(`[Assets] Failed to load audio: ${path}`);
        this.audio[key] = null; // Silent fallback
        this.loadedAssets++;
        this.loadProgress = this.loadedAssets / this.totalAssets;
        resolve();
      };
      audio.src = path;
      audio.load();
    });
  },

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Get loaded image
   * @param {string} key - Asset key
   * @returns {HTMLImageElement|null} Image or null
   */
  getImage(key) {
    return this.images[key] || null;
  },

  /**
   * Get loaded audio
   * @param {string} key - Asset key
   * @returns {HTMLAudioElement|null} Audio or null
   */
  getAudio(key) {
    return this.audio[key] || null;
  },

  /**
   * Check if image exists
   * @param {string} key - Asset key
   * @returns {boolean} True if loaded
   */
  hasImage(key) {
    return key in this.images;
  },

  /**
   * Check if audio exists
   * @param {string} key - Asset key
   * @returns {boolean} True if loaded
   */
  hasAudio(key) {
    return key in this.audio && this.audio[key] !== null;
  },

  // ============================================================
  // PLACEHOLDER GENERATION
  // ============================================================

  /**
   * Create placeholder image
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} color - Fill color
   * @returns {HTMLCanvasElement} Placeholder canvas
   */
  createPlaceholder(width, height, color = '#ff00ff') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Checkerboard pattern
    const size = 8;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = ((x + y) / size % 2 === 0) ? color : '#000000';
        ctx.fillRect(x, y, size, size);
      }
    }

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    return canvas;
  },

  /**
   * Create colored circle placeholder (for items)
   * @param {number} size - Size
   * @param {string} color - Fill color
   * @returns {HTMLCanvasElement} Placeholder canvas
   */
  createCirclePlaceholder(size, color) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Gradient circle
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  },

  /**
   * Create item icon placeholder with rarity glow
   * @param {string} slot - Item slot type
   * @param {string} rarity - Item rarity
   * @returns {HTMLCanvasElement} Icon canvas
   */
  createItemIcon(slot, rarity = 'common') {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Rarity colors
    const rarityColors = {
      common: '#8899aa',
      uncommon: '#22dd55',
      rare: '#2288ff',
      epic: '#aa44ff',
      legendary: '#ff8800',
      mythic: '#ff4488'
    };
    const color = rarityColors[rarity] || rarityColors.common;

    // Background
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(0, 0, size, size);

    // Slot icon shape
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 3;

    switch (slot) {
      case 'weapon':
        // Triangle pointing right
        ctx.beginPath();
        ctx.moveTo(cx + r, cy);
        ctx.lineTo(cx - r / 2, cy - r);
        ctx.lineTo(cx - r / 2, cy + r);
        ctx.closePath();
        ctx.fill();
        break;

      case 'shield':
        // Shield shape
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy - r / 2);
        ctx.lineTo(cx + r * 0.8, cy + r);
        ctx.lineTo(cx, cy + r * 1.2);
        ctx.lineTo(cx - r * 0.8, cy + r);
        ctx.lineTo(cx - r, cy - r / 2);
        ctx.closePath();
        ctx.fill();
        break;

      case 'engine':
        // Flame shape
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(cx, cy + 2, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'reactor':
        // Hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'module':
        // Square with inner square
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(cx - r / 2, cy - r / 2, r, r);
        break;

      case 'drone':
        // Drone shape (two circles)
        ctx.beginPath();
        ctx.arc(cx - r / 2, cy, r / 2, 0, Math.PI * 2);
        ctx.arc(cx + r / 2, cy, r / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        // Default circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Rarity border glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    return canvas;
  },

  // ============================================================
  // SPRITE SHEET HELPERS
  // ============================================================

  /**
   * Draw sprite from spritesheet
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} key - Asset key
   * @param {number} sx - Source X
   * @param {number} sy - Source Y
   * @param {number} sw - Source width
   * @param {number} sh - Source height
   * @param {number} dx - Dest X
   * @param {number} dy - Dest Y
   * @param {number} dw - Dest width
   * @param {number} dh - Dest height
   */
  drawSprite(ctx, key, sx, sy, sw, sh, dx, dy, dw, dh) {
    const img = this.images[key];
    if (!img) return;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw || sw, dh || sh);
  },

  /**
   * Draw full image centered at position
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} key - Asset key
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} scale - Scale factor
   */
  drawCentered(ctx, key, x, y, scale = 1) {
    const img = this.images[key];
    if (!img) return;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  },

  /**
   * Draw rotated image
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} key - Asset key
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} angle - Rotation in radians
   * @param {number} scale - Scale factor
   */
  drawRotated(ctx, key, x, y, angle, scale = 1) {
    const img = this.images[key];
    if (!img) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
};

export default Assets;
