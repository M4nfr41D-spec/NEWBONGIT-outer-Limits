// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// WORLD.js - Zone Generation and Management
// ============================================================
// Handles procedural zone generation, enemy spawning, and world state

import { State } from '../State.js';
import { SeededRandom } from './SeededRandom.js';

export const World = {
  // Current zone data
  zone: null,

  // Alias for compatibility with main.js
  get currentZone() { return this.zone; },

  // Zone index
  zoneIndex: 0,

  // Zone dimensions
  width: 2000,
  height: 2000,

  // Entity lists
  obstacles: [],
  decorations: [],
  portals: [],

  // Spawn tracking
  spawnedEnemies: 0,
  maxEnemies: 30,
  spawnTimer: 0,
  spawnInterval: 2.0,

  // RNG for this zone
  rng: null,

  // Background
  backgroundImage: null,
  parallaxLayers: [],

  // ============================================================
  // ZONE GENERATION
  // ============================================================

  /**
   * Generate a new zone
   * @param {string} actId - Act identifier
   * @param {number} zoneIndex - Zone number in act
   * @returns {object} Generated zone data
   */
  generate(actId, zoneIndex) {
    // Get act data
    const actData = State.data.acts?.[actId];
    if (!actData) {
      console.error(`[World] Act not found: ${actId}`);
      return null;
    }

    // Create seeded RNG for reproducible generation
    const seed = this.generateSeed(actId, zoneIndex);
    this.rng = new SeededRandom(seed);

    // Determine zone size (scales with depth)
    const baseSize = 1500;
    const sizeIncrease = Math.min(zoneIndex * 100, 1000);
    this.width = baseSize + sizeIncrease + this.rng.nextInt(0, 500);
    this.height = baseSize + sizeIncrease + this.rng.nextInt(0, 500);

    // Check if boss zone
    const isBossZone = (zoneIndex + 1) % actData.bossZone === 0;

    // Create zone object
    this.zone = {
      actId,
      zoneIndex,
      seed,
      width: this.width,
      height: this.height,
      background: actData.background,
      isBossZone,
      enemyTypes: actData.enemyTypes,
      eliteTypes: actData.eliteTypes,
      bossType: isBossZone ? actData.bossType : null,
      baseLevel: this.calculateZoneLevel(actData, zoneIndex),
      modifiers: this.rollZoneModifiers(actData, zoneIndex),
      cleared: false,
      enemiesKilled: 0,
      totalEnemies: 0
    };

    // Generate zone content
    this.generateObstacles();
    this.generateDecorations();
    this.generatePortal();

    // Reset spawn state
    this.spawnedEnemies = 0;
    this.maxEnemies = this.calculateMaxEnemies(zoneIndex, isBossZone);
    this.spawnTimer = 0;

    // Calculate item level for drops
    this.zone.itemLevel = this.calculateItemLevel(actData, zoneIndex);

    console.log(`[World] Generated zone ${zoneIndex + 1} in ${actId}:`, {
      size: `${this.width}x${this.height}`,
      level: this.zone.baseLevel,
      ilvl: this.zone.itemLevel,
      isBoss: isBossZone,
      maxEnemies: this.maxEnemies
    });

    return this.zone;
  },

  /**
   * Generate deterministic seed for zone
   */
  generateSeed(actId, zoneIndex) {
    let hash = 0;
    const str = `${actId}-${zoneIndex}-${State.meta.totalRuns}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  },

  /**
   * Calculate zone level
   */
  calculateZoneLevel(actData, zoneIndex) {
    let baseLevel = actData.baseLevel;

    // Act 4 scales with player level
    if (actData.endless) {
      baseLevel = State.meta.level + 15;
    }

    // Add zone depth bonus
    return baseLevel + zoneIndex * 2;
  },

  /**
   * Calculate item level for drops
   */
  calculateItemLevel(actData, zoneIndex) {
    let ilvl = actData.baseLevel;

    if (actData.endless) {
      ilvl = State.meta.level + 15;
    }

    // Depth bonus
    ilvl += zoneIndex * 3;

    // Boss bonus
    if (this.zone.isBossZone) {
      ilvl += 10;
    }

    return ilvl;
  },

  /**
   * Calculate max enemies for zone
   */
  calculateMaxEnemies(zoneIndex, isBossZone) {
    if (isBossZone) {
      return 10; // Fewer regular enemies in boss zones
    }

    const base = 20;
    const perZone = 2;
    return Math.min(base + zoneIndex * perZone, 50);
  },

  /**
   * Roll zone modifiers
   */
  rollZoneModifiers(actData, zoneIndex) {
    const modifiers = [];

    // Higher zones have chance for modifiers
    if (zoneIndex >= 5 && this.rng.nextBool(0.3)) {
      const available = ['armored', 'haste', 'regenerating'];
      modifiers.push(this.rng.pick(available));
    }

    return modifiers;
  },

  // ============================================================
  // OBSTACLE GENERATION
  // ============================================================

  generateObstacles() {
    this.obstacles = [];

    // Number of obstacles scales with zone size
    const count = Math.floor((this.width * this.height) / 80000);

    for (let i = 0; i < count; i++) {
      const obstacle = {
        x: this.rng.nextFloat(100, this.width - 100),
        y: this.rng.nextFloat(100, this.height - 100),
        width: this.rng.nextInt(40, 120),
        height: this.rng.nextInt(40, 120),
        sprite: this.rng.pick(['asteroid_1.png', 'asteroid_2.png']),
        rotation: this.rng.nextFloat(0, Math.PI * 2),
        health: 100,
        destructible: this.rng.nextBool(0.3)
      };

      // Don't spawn too close to center (player spawn)
      const distFromCenter = Math.sqrt(
        Math.pow(obstacle.x - this.width / 2, 2) +
        Math.pow(obstacle.y - this.height / 2, 2)
      );

      if (distFromCenter > 200) {
        this.obstacles.push(obstacle);
      }
    }
  },

  generateDecorations() {
    this.decorations = [];

    // Background decorations (non-collidable)
    const count = Math.floor((this.width * this.height) / 50000);

    const decoSprites = [
      'asteroid_deco_1.png', 'asteroid_deco_2.png', 'asteroid_deco_3.png',
      'asteroid_deco_4.png', 'asteroid_deco_big.png', 'deco_rock.png'
    ];

    for (let i = 0; i < count; i++) {
      this.decorations.push({
        x: this.rng.nextFloat(0, this.width),
        y: this.rng.nextFloat(0, this.height),
        sprite: this.rng.pick(decoSprites),
        scale: this.rng.nextFloat(0.5, 1.5),
        rotation: this.rng.nextFloat(0, Math.PI * 2),
        alpha: this.rng.nextFloat(0.3, 0.7)
      });
    }
  },

  generatePortal() {
    this.portals = [];

    // Exit portal at edge of zone
    const side = this.rng.nextInt(0, 3);
    const margin = 100;
    let x, y;

    switch (side) {
      case 0: // Top
        x = this.rng.nextFloat(margin, this.width - margin);
        y = margin;
        break;
      case 1: // Right
        x = this.width - margin;
        y = this.rng.nextFloat(margin, this.height - margin);
        break;
      case 2: // Bottom
        x = this.rng.nextFloat(margin, this.width - margin);
        y = this.height - margin;
        break;
      case 3: // Left
        x = margin;
        y = this.rng.nextFloat(margin, this.height - margin);
        break;
    }

    this.portals.push({
      x,
      y,
      radius: 40,
      type: 'exit',
      active: false // Activates when zone is cleared
    });
  },

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update world state
   * @param {number} dt - Delta time
   * @param {object} Enemies - Enemies module reference
   */
  update(dt, Enemies) {
    if (!this.zone) return;

    // Handle enemy spawning
    this.updateSpawning(dt, Enemies);

    // Check zone completion
    this.checkZoneCleared(Enemies);

    // Update portal state
    this.updatePortals();
  },

  updateSpawning(dt, Enemies) {
    if (!Enemies) return;
    if (this.zone.cleared) return;

    this.spawnTimer += dt;

    // Spawn enemies periodically
    if (this.spawnTimer >= this.spawnInterval && Enemies.list.length < this.maxEnemies) {
      this.spawnTimer = 0;

      // Spawn near player but not too close
      const spawnDist = 400 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;
      const spawnX = State.player.x + Math.cos(angle) * spawnDist;
      const spawnY = State.player.y + Math.sin(angle) * spawnDist;

      // Keep in bounds
      const x = Math.max(50, Math.min(this.width - 50, spawnX));
      const y = Math.max(50, Math.min(this.height - 50, spawnY));

      // Determine enemy type
      const isElite = Math.random() < 0.08 + (this.zone.zoneIndex * 0.005);
      const types = isElite ? this.zone.eliteTypes : this.zone.enemyTypes;
      const enemyType = types[Math.floor(Math.random() * types.length)];

      if (enemyType && enemyType !== 'all') {
        Enemies.spawn(enemyType, x, y, this.zone.baseLevel, isElite);
        this.spawnedEnemies++;
        this.zone.totalEnemies++;
      }
    }

    // Spawn boss when ready
    if (this.zone.isBossZone && !this.zone.bossSpawned && this.spawnedEnemies >= 5) {
      this.spawnBoss(Enemies);
    }
  },

  spawnBoss(Enemies) {
    if (!Enemies || !this.zone.bossType) return;

    // Spawn boss at center
    const x = this.width / 2;
    const y = this.height / 2 - 200;

    Enemies.spawnBoss(this.zone.bossType, x, y, this.zone.baseLevel);
    this.zone.bossSpawned = true;

    // Play boss music and announcement
    if (State.modules?.Audio) {
      State.modules.Audio.playMusic('boss');
    }

    if (window.Game?.announce) {
      window.Game.announce('[!] BOSS', 'boss');
    }

    console.log(`[World] Boss spawned: ${this.zone.bossType}`);
  },

  checkZoneCleared(Enemies) {
    if (!Enemies || this.zone.cleared) return;

    // Zone cleared when all enemies dead and enough spawned
    const allDead = Enemies.list.length === 0;
    const enoughKilled = this.zone.enemiesKilled >= this.maxEnemies;
    const bossKilled = !this.zone.isBossZone || this.zone.bossKilled;

    if (allDead && (enoughKilled || bossKilled)) {
      this.zone.cleared = true;
      this.activatePortal();

      console.log(`[World] Zone ${this.zone.zoneIndex + 1} cleared!`);

      if (window.Game?.announce) {
        window.Game.announce('ZONE CLEARED', 'success');
      }
    }
  },

  updatePortals() {
    for (const portal of this.portals) {
      if (portal.type === 'exit') {
        portal.active = this.zone.cleared;
      }
    }
  },

  activatePortal() {
    for (const portal of this.portals) {
      portal.active = true;
    }

    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('portal_open');
    }
  },

  // ============================================================
  // COLLISION
  // ============================================================

  /**
   * Check collision with obstacles
   */
  checkObstacleCollision(x, y, radius) {
    for (const obs of this.obstacles) {
      if (this.circleRectCollision(
        x, y, radius,
        obs.x - obs.width / 2, obs.y - obs.height / 2,
        obs.width, obs.height
      )) {
        return obs;
      }
    }
    return null;
  },

  circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
  },

  /**
   * Check portal collision
   */
  checkPortalCollision(x, y, radius) {
    for (const portal of this.portals) {
      if (!portal.active) continue;

      const dx = x - portal.x;
      const dy = y - portal.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius + portal.radius) {
        return portal;
      }
    }
    return null;
  },

  /**
   * Keep position in bounds
   */
  clampToBounds(x, y, margin = 20) {
    return {
      x: Math.max(margin, Math.min(this.width - margin, x)),
      y: Math.max(margin, Math.min(this.height - margin, y))
    };
  },

  // ============================================================
  // DRAWING
  // ============================================================

  /**
   * Draw world elements
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} Assets - Asset loader reference
   */
  draw(ctx, Assets) {
    if (!this.zone) return;

    // Draw decorations (background layer)
    this.drawDecorations(ctx, Assets);

    // Draw obstacles
    this.drawObstacles(ctx, Assets);

    // Draw portals
    this.drawPortals(ctx);
  },

  drawDecorations(ctx, Assets) {
    for (const deco of this.decorations) {
      ctx.save();
      ctx.globalAlpha = deco.alpha;
      ctx.translate(deco.x, deco.y);
      ctx.rotate(deco.rotation);
      ctx.scale(deco.scale, deco.scale);

      // Draw placeholder or sprite
      const img = Assets?.getImage?.(`asteroids_deco/${deco.sprite}`);
      if (img) {
        ctx.drawImage(img, -32, -32, 64, 64);
      } else {
        ctx.fillStyle = '#333344';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },

  drawObstacles(ctx, Assets) {
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.rotation);

      const img = Assets?.getImage?.(`asteroids/${obs.sprite}`);
      if (img) {
        ctx.drawImage(img, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else {
        ctx.fillStyle = '#555566';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      }

      ctx.restore();
    }
  },

  drawPortals(ctx) {
    for (const portal of this.portals) {
      ctx.save();
      ctx.translate(portal.x, portal.y);

      // Portal glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.radius);

      if (portal.active) {
        gradient.addColorStop(0, 'rgba(255, 136, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 136, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 136, 0, 0)');

        // Pulse animation
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
      } else {
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Portal ring
      ctx.strokeStyle = portal.active ? '#ff8800' : '#666666';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  },

  // ============================================================
  // MINIMAP
  // ============================================================

  /**
   * Draw minimap
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} mapX - Minimap X position
   * @param {number} mapY - Minimap Y position
   * @param {number} mapSize - Minimap size
   * @param {object} Enemies - Enemies module
   */
  drawMinimap(ctx, mapX, mapY, mapSize, Enemies) {
    if (!this.zone) return;

    const scale = mapSize / Math.max(this.width, this.height);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Border
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Obstacles
    ctx.fillStyle = '#444455';
    for (const obs of this.obstacles) {
      const ox = mapX + obs.x * scale;
      const oy = mapY + obs.y * scale;
      ctx.fillRect(ox - 2, oy - 2, 4, 4);
    }

    // Enemies
    if (Enemies?.list) {
      for (const enemy of Enemies.list) {
        const ex = mapX + enemy.x * scale;
        const ey = mapY + enemy.y * scale;

        if (enemy.isBoss) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(ex - 4, ey - 4, 8, 8);
        } else if (enemy.isElite) {
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(ex - 2, ey - 2, 5, 5);
        } else {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(ex - 1, ey - 1, 3, 3);
        }
      }
    }

    // Portals
    ctx.fillStyle = '#ff8800';
    for (const portal of this.portals) {
      if (portal.active) {
        const px = mapX + portal.x * scale;
        const py = mapY + portal.y * scale;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    const px = mapX + State.player.x * scale;
    const py = mapY + State.player.y * scale;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Zone label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    const label = this.zone.isBossZone ? '[!] BOSS' : `Zone ${this.zone.zoneIndex + 1}`;
    ctx.fillText(label, mapX + mapSize / 2, mapY + mapSize + 12);
  },

  // ============================================================
  // PARALLAX BACKGROUND
  // ============================================================

  /**
   * Draw parallax background
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenW - Screen width
   * @param {number} screenH - Screen height
   */
  drawParallax(ctx, screenW, screenH) {
    // Simple space background
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, screenW, screenH);

    // Stars (static for now, can be parallax later)
    ctx.fillStyle = '#ffffff';
    const starSeed = this.zone?.seed || 12345;
    for (let i = 0; i < 100; i++) {
      const x = ((starSeed * (i + 1) * 9301 + 49297) % 233280) / 233280 * screenW;
      const y = ((starSeed * (i + 1) * 7621 + 34781) % 233280) / 233280 * screenH;
      const size = ((starSeed * (i + 1) * 1234) % 3) + 1;
      const alpha = 0.3 + ((starSeed * (i + 1) * 5678) % 100) / 100 * 0.7;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Nebula/fog effect
    if (this.zone?.background) {
      // Could load background image here
    }
  },

  /**
   * Alias for drawParallax
   */
  drawParallaxBackground(ctx, screenW, screenH) {
    this.drawParallax(ctx, screenW, screenH);
  },

  /**
   * Draw foreground parallax (optional)
   */
  drawParallaxForeground(ctx, screenW, screenH) {
    // Fog overlay if enabled
  },

  // ============================================================
  // ZONE LOADING
  // ============================================================

  /**
   * Load a specific zone (for debug/teleport)
   * @param {number} zoneIndex - Zone to load
   */
  loadZone(zoneIndex) {
    if (!State.run.currentAct) return;

    this.zoneIndex = zoneIndex;
    this.generate(State.run.currentAct, zoneIndex);

    // Reset player position
    State.player.x = this.width / 2;
    State.player.y = this.height / 2;

    console.log(`[World] Loaded zone ${zoneIndex + 1}`);
  },

  // ============================================================
  // CLEANUP
  // ============================================================

  clear() {
    this.zone = null;
    this.zoneIndex = 0;
    this.obstacles = [];
    this.decorations = [];
    this.portals = [];
    this.rng = null;
  },

  onEnemyKilled(enemy) {
    if (!this.zone) return;

    this.zone.enemiesKilled++;

    if (enemy.isBoss) {
      this.zone.bossKilled = true;
    }
  }
};

export default World;
