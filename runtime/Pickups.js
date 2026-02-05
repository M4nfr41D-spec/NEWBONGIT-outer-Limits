// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// PICKUPS.js - Loot Pickup System
// ============================================================
// Handles dropped items, resources, and health pickups

import { State, isStashFull, addScrap, addCells } from './State.js';
import { Assets } from './AssetLoader.js';

export const Pickups = {
  // Active pickups
  list: [],

  // Pickup types configuration
  types: {
    item: {
      magnetRange: 80,
      autoCollect: false,
      floatSpeed: 0.5
    },
    scrap: {
      magnetRange: 150,
      autoCollect: true,
      floatSpeed: 0.8
    },
    cells: {
      magnetRange: 120,
      autoCollect: true,
      floatSpeed: 0.6
    },
    health: {
      magnetRange: 100,
      autoCollect: true,
      floatSpeed: 0.7
    },
    shard: {
      magnetRange: 120,
      autoCollect: true,
      floatSpeed: 0.6
    }
  },

  // Visual configuration
  rarityGlow: {
    common: { color: '#8899aa', intensity: 0.3 },
    uncommon: { color: '#22dd55', intensity: 0.5 },
    rare: { color: '#2288ff', intensity: 0.7 },
    epic: { color: '#aa44ff', intensity: 0.9 },
    legendary: { color: '#ff8800', intensity: 1.2 },
    mythic: { color: '#ff4488', intensity: 1.5 }
  },

  // ============================================================
  // CREATION
  // ============================================================

  /**
   * Create a new pickup
   * @param {string} type - Pickup type (item, scrap, cells, health)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} data - Additional data (item object for 'item' type)
   * @returns {object} Created pickup
   */
  create(type, x, y, data = null) {
    const typeConfig = this.types[type] || this.types.scrap;

    const pickup = {
      id: `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * 100, // Random initial velocity
      vy: (Math.random() - 0.5) * 100 - 50, // Pop up
      data, // Item object, amount, etc.
      magnetRange: typeConfig.magnetRange,
      autoCollect: typeConfig.autoCollect,
      floatSpeed: typeConfig.floatSpeed,
      age: 0,
      lifetime: 60, // 60 seconds before despawn
      collectTimer: 0.3, // Brief delay before collectible
      floating: true,
      floatPhase: Math.random() * Math.PI * 2,
      collected: false
    };

    // Calculate pickup radius based on player stats
    pickup.magnetRange += State.player.pickupRadius;

    this.list.push(pickup);

    // Play drop sound for items
    if (type === 'item' && data && State.modules?.Audio) {
      const rarity = data.rarity || 'common';
      if (rarity === 'legendary' || rarity === 'mythic') {
        State.modules.Audio.playSFX?.('pickup_legendary', 0.8);
      } else if (rarity === 'rare' || rarity === 'epic') {
        State.modules.Audio.playSFX?.('pickup_rare', 0.6);
      }
    }

    return pickup;
  },

  /**
   * Create multiple scrap pickups
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} amount - Total scrap amount
   */
  createScrapBurst(x, y, amount) {
    const count = Math.min(5, Math.ceil(amount / 10));
    const perPickup = Math.ceil(amount / count);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      this.create('scrap', x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, { amount: perPickup });
    }
  },

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update all pickups
   * @param {number} dt - Delta time
   * @param {HTMLCanvasElement} canvas - Canvas for bounds
   */
  update(dt, canvas) {
    const player = State.player;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const pickup = this.list[i];

      // Update age
      pickup.age += dt;

      // Update collect timer
      if (pickup.collectTimer > 0) {
        pickup.collectTimer -= dt;
      }

      // Despawn check
      if (pickup.age >= pickup.lifetime) {
        this.list.splice(i, 1);
        continue;
      }

      // Physics
      if (pickup.floating) {
        // Friction
        pickup.vx *= Math.pow(0.3, dt);
        pickup.vy *= Math.pow(0.3, dt);

        // Stop floating when slow enough
        if (Math.abs(pickup.vx) < 5 && Math.abs(pickup.vy) < 5) {
          pickup.floating = false;
          pickup.vx = 0;
          pickup.vy = 0;
        }
      }

      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      // Floating animation
      pickup.floatPhase += dt * pickup.floatSpeed * Math.PI * 2;

      // Check magnet/collection
      if (pickup.collectTimer <= 0) {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnet effect
        if (dist < pickup.magnetRange) {
          const magnetStrength = 1 - (dist / pickup.magnetRange);
          const speed = 300 * magnetStrength;
          pickup.vx = (dx / dist) * speed;
          pickup.vy = (dy / dist) * speed;
          pickup.floating = true;
        }

        // Collection check
        const collectRadius = pickup.autoCollect ? 30 : 20;
        if (dist < collectRadius) {
          this.collect(pickup);
          this.list.splice(i, 1);
        }
      }
    }
  },

  // ============================================================
  // COLLECTION
  // ============================================================

  /**
   * Collect a pickup
   * @param {object} pickup - Pickup to collect
   */
  collect(pickup) {
    if (pickup.collected) return;
    pickup.collected = true;

    switch (pickup.type) {
      case 'item':
        this.collectItem(pickup);
        break;

      case 'scrap':
        this.collectScrap(pickup);
        break;

      case 'cells':
        this.collectCells(pickup);
        break;

      case 'health':
        this.collectHealth(pickup);
        break;

      case 'shard':
        this.collectShard(pickup);
        break;
    }

    // Collection particles
    if (State.modules?.Particles) {
      State.modules.Particles.createBurst(pickup.x, pickup.y, this.getPickupColor(pickup), 8);
    }
  },

  collectItem(pickup) {
    const item = pickup.data;
    if (!item) return;

    // Check stash space
    if (isStashFull()) {
      // Show message
      if (window.Game?.announce) {
        window.Game.announce('STASH FULL!', 'warning');
      }
      // Don't collect - leave on ground
      pickup.collected = false;
      return;
    }

    // Add to stash
    if (State.modules?.Items) {
      State.modules.Items.addToStash(item);
    }

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.playPickup?.('item', item.rarity);
    }

    // UI update
    if (State.modules?.UI) {
      State.modules.UI.renderStash?.();
    }

    // Achievement check
    if (item.rarity === 'legendary') {
      State.modules?.State?.unlockAchievement?.('find_legendary');
    }
    if (item.rarity === 'mythic') {
      State.modules?.State?.unlockAchievement?.('find_mythic');
    }

    console.log(`[Pickups] Collected item: ${item.name} (${item.rarity})`);
  },

  collectScrap(pickup) {
    const amount = pickup.data?.amount || Math.floor(Math.random() * 5) + 1;
    const bonus = State.player.bonuses?.scrapBonus || 0;
    const finalAmount = Math.round(amount * (1 + bonus));

    addScrap(finalAmount, false);

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.playPickup?.('scrap');
    }
  },

  collectCells(pickup) {
    const amount = pickup.data?.amount || 1;
    addCells(amount);

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.playPickup?.('cell');
    }
  },

  collectHealth(pickup) {
    const amount = pickup.data?.amount || 25;

    if (State.modules?.Player) {
      State.modules.Player.heal(amount);
    }

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.playPickup?.('health');
    }
  },

  collectShard(pickup) {
    const amount = pickup.data?.amount || 1;
    State.run.shards += amount;

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX?.('pickup_item', 0.5);
    }
  },

  // ============================================================
  // DRAWING
  // ============================================================

  draw(ctx) {
    for (const pickup of this.list) {
      // Float offset
      const floatOffset = Math.sin(pickup.floatPhase) * 3;
      const drawY = pickup.y + floatOffset;

      // Fade out near despawn
      const fadeStart = pickup.lifetime - 5;
      const alpha = pickup.age > fadeStart ? 1 - (pickup.age - fadeStart) / 5 : 1;
      ctx.globalAlpha = alpha;

      switch (pickup.type) {
        case 'item':
          this.drawItem(ctx, pickup, drawY);
          break;

        case 'scrap':
          this.drawScrap(ctx, pickup.x, drawY);
          break;

        case 'cells':
          this.drawCells(ctx, pickup.x, drawY);
          break;

        case 'health':
          this.drawHealth(ctx, pickup.x, drawY);
          break;

        case 'shard':
          this.drawShard(ctx, pickup.x, drawY);
          break;
      }

      ctx.globalAlpha = 1;
    }
  },

  drawItem(ctx, pickup, drawY) {
    const item = pickup.data;
    if (!item) return;

    const rarity = item.rarity || 'common';
    const glow = this.rarityGlow[rarity] || this.rarityGlow.common;
    const size = 24;

    // Glow
    ctx.shadowColor = glow.color;
    ctx.shadowBlur = 10 * glow.intensity;

    // Background
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(pickup.x - size / 2, drawY - size / 2, size, size);

    // Border
    ctx.strokeStyle = glow.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(pickup.x - size / 2, drawY - size / 2, size, size);

    // Icon placeholder
    ctx.fillStyle = glow.color;
    ctx.beginPath();
    ctx.arc(pickup.x, drawY, size / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  drawScrap(ctx, x, y) {
    // Gold coin
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Inner
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // $ symbol
    ctx.fillStyle = '#aa8800';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y);

    ctx.shadowBlur = 0;
  },

  drawCells(ctx, x, y) {
    // Cyan crystal
    ctx.fillStyle = '#00ddff';
    ctx.shadowColor = '#00ddff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 6, y);
    ctx.closePath();
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#88ffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 3, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  drawHealth(ctx, x, y) {
    // Red cross
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 6;

    // Horizontal
    ctx.fillRect(x - 8, y - 3, 16, 6);
    // Vertical
    ctx.fillRect(x - 3, y - 8, 6, 16);

    // Inner
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(x - 6, y - 2, 12, 4);
    ctx.fillRect(x - 2, y - 6, 4, 12);

    ctx.shadowBlur = 0;
  },

  drawShard(ctx, x, y) {
    // Purple shard
    ctx.fillStyle = '#aa44ff';
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 5, y + 2);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 5, y + 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  getPickupColor(pickup) {
    switch (pickup.type) {
      case 'item':
        return this.rarityGlow[pickup.data?.rarity]?.color || '#8899aa';
      case 'scrap':
        return '#ffcc00';
      case 'cells':
        return '#00ddff';
      case 'health':
        return '#ff4444';
      case 'shard':
        return '#aa44ff';
      default:
        return '#ffffff';
    }
  },

  // ============================================================
  // UTILITY
  // ============================================================

  clear() {
    this.list = [];
  },

  getCount() {
    return this.list.length;
  },

  getItemCount() {
    return this.list.filter(p => p.type === 'item').length;
  }
};

export default Pickups;
