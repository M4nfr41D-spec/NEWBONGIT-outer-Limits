// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// BULLETS.js - Projectile System
// ============================================================
// Manages all projectiles for player and enemies

import { State } from './State.js';

export const Bullets = {
  // Active bullets
  list: [],

  // Bullet pool for reuse
  pool: [],
  poolSize: 200,

  // Visual settings
  playerBulletColor: '#00ffff',
  enemyBulletColor: '#ff4444',

  // ============================================================
  // INITIALIZATION
  // ============================================================

  init() {
    this.list = [];
    this.pool = [];
  },

  // ============================================================
  // CREATION
  // ============================================================

  /**
   * Create a new bullet
   * @param {object} options - Bullet options
   * @returns {object} Created bullet
   */
  create(options) {
    // Try to reuse from pool
    let bullet = this.pool.pop();

    if (!bullet) {
      bullet = {};
    }

    // Set properties
    bullet.x = options.x || 0;
    bullet.y = options.y || 0;
    bullet.vx = options.vx || 0;
    bullet.vy = options.vy || 0;
    bullet.damage = options.damage || 10;
    bullet.isPlayer = options.isPlayer !== false;
    bullet.pierce = options.pierce || 0;
    bullet.chain = options.chain || 0;
    bullet.aoe = options.aoe || 0;
    bullet.homing = options.homing || false;
    bullet.lifetime = options.lifetime || 3;
    bullet.age = 0;
    bullet.hitEnemies = new Set();
    bullet.size = options.size || 6;

    this.list.push(bullet);
    return bullet;
  },

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update all bullets
   * @param {number} dt - Delta time
   * @param {HTMLCanvasElement} canvas - Canvas for bounds
   */
  update(dt, canvas) {
    const zone = State.modules?.World?.currentZone;
    const screenWidth = canvas?.width || 800;
    const screenHeight = canvas?.height || 600;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const bullet = this.list[i];

      // Update age
      bullet.age += dt;
      if (bullet.age >= bullet.lifetime) {
        this.remove(i);
        continue;
      }

      // Homing behavior
      if (bullet.homing && !bullet.isPlayer) {
        this.updateHoming(bullet, dt);
      }

      // Move
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      // Check bounds (use zone bounds in exploration mode)
      const outOfBounds = zone
        ? (bullet.x < -50 || bullet.x > zone.width + 50 || bullet.y < -50 || bullet.y > zone.height + 50)
        : (bullet.x < -50 || bullet.x > screenWidth + 50 || bullet.y < -50 || bullet.y > screenHeight + 50);

      if (outOfBounds) {
        this.remove(i);
        continue;
      }

      // Check collisions
      if (bullet.isPlayer) {
        this.checkEnemyCollisions(bullet, i);
      } else {
        this.checkPlayerCollision(bullet, i);
      }
    }
  },

  updateHoming(bullet, dt) {
    // Home toward player
    const player = State.player;
    const dx = player.x - bullet.x;
    const dy = player.y - bullet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(bullet.vy, bullet.vx);
      const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

      // Turn toward target
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnSpeed = 3 * dt;
      const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

      bullet.vx = Math.cos(newAngle) * speed;
      bullet.vy = Math.sin(newAngle) * speed;
    }
  },

  // ============================================================
  // COLLISIONS
  // ============================================================

  checkEnemyCollisions(bullet, bulletIndex) {
    const enemies = State.modules?.Enemies?.list || [];

    for (const enemy of enemies) {
      // Skip already hit enemies (pierce)
      if (bullet.hitEnemies.has(enemy.id)) continue;

      // Check collision
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = (enemy.isBoss ? 40 : 20) + bullet.size;

      if (dist < hitRadius) {
        // Calculate damage
        const { damage, isCrit } = State.modules?.Stats?.calculateDamage(bullet.damage, enemy) || { damage: bullet.damage, isCrit: false };

        // Deal damage
        State.modules?.Enemies?.damage(enemy, damage, isCrit);

        // Track hit
        bullet.hitEnemies.add(enemy.id);

        // AoE explosion
        if (bullet.aoe > 0) {
          this.aoeExplosion(bullet.x, bullet.y, bullet.aoe, bullet.damage * 0.5);
        }

        // Chain to nearby enemy
        if (bullet.chain > 0) {
          const chained = this.chainToNearby(bullet, enemy);
          if (chained) {
            bullet.chain--;
            return; // Don't destroy bullet
          }
        }

        // Pierce through
        if (bullet.pierce > 0) {
          bullet.pierce--;
          bullet.damage *= 0.8; // Damage falloff
          return; // Don't destroy bullet
        }

        // Destroy bullet
        this.remove(bulletIndex);
        return;
      }
    }
  },

  checkPlayerCollision(bullet, bulletIndex) {
    const player = State.player;
    const hitbox = State.modules?.Player?.getHitbox?.() || {
      x: player.x - 12,
      y: player.y - 12,
      width: 24,
      height: 24
    };

    // Check collision
    if (bullet.x > hitbox.x && bullet.x < hitbox.x + hitbox.width &&
        bullet.y > hitbox.y && bullet.y < hitbox.y + hitbox.height) {

      // Deal damage to player
      State.modules?.Player?.takeDamage(bullet.damage);

      // AoE
      if (bullet.aoe > 0) {
        // Additional AoE damage to player already handled
      }

      // Destroy bullet
      this.remove(bulletIndex);
    }
  },

  aoeExplosion(x, y, radius, damage) {
    const enemies = State.modules?.Enemies?.list || [];

    for (const enemy of enemies) {
      const dx = x - enemy.x;
      const dy = y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Damage falloff with distance
        const falloff = 1 - (dist / radius) * 0.5;
        State.modules?.Enemies?.damage(enemy, damage * falloff, false);
      }
    }

    // Visual effect
    if (State.modules?.Particles) {
      State.modules.Particles.createExplosion(x, y, 'small');
    }
  },

  chainToNearby(bullet, hitEnemy) {
    const enemies = State.modules?.Enemies?.list || [];
    let closest = null;
    let closestDist = 200; // Chain range

    for (const enemy of enemies) {
      if (enemy === hitEnemy) continue;
      if (bullet.hitEnemies.has(enemy.id)) continue;

      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    if (closest) {
      // Redirect bullet to new target
      const dx = closest.x - bullet.x;
      const dy = closest.y - bullet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

      bullet.vx = (dx / dist) * speed;
      bullet.vy = (dy / dist) * speed;

      // Visual effect
      if (State.modules?.Particles) {
        State.modules.Particles.createLine(bullet.x, bullet.y, closest.x, closest.y, '#00ffff');
      }

      return true;
    }

    return false;
  },

  // ============================================================
  // REMOVAL
  // ============================================================

  remove(index) {
    const bullet = this.list[index];
    this.list.splice(index, 1);

    // Return to pool
    if (this.pool.length < this.poolSize) {
      bullet.hitEnemies.clear();
      this.pool.push(bullet);
    }
  },

  clear() {
    // Return all to pool
    while (this.list.length > 0) {
      const bullet = this.list.pop();
      if (this.pool.length < this.poolSize) {
        bullet.hitEnemies?.clear();
        this.pool.push(bullet);
      }
    }
  },

  // ============================================================
  // DRAWING
  // ============================================================

  draw(ctx) {
    for (const bullet of this.list) {
      // Calculate angle from velocity
      const angle = Math.atan2(bullet.vy, bullet.vx);

      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);

      if (bullet.isPlayer) {
        // Player bullet - cyan laser
        const gradient = ctx.createLinearGradient(-bullet.size * 2, 0, bullet.size, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, this.playerBulletColor);
        gradient.addColorStop(1, '#ffffff');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(bullet.size, 0);
        ctx.lineTo(-bullet.size * 2, -bullet.size / 2);
        ctx.lineTo(-bullet.size * 2, bullet.size / 2);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.shadowColor = this.playerBulletColor;
        ctx.shadowBlur = 8;
        ctx.fill();
      } else {
        // Enemy bullet - red orb
        ctx.fillStyle = this.enemyBulletColor;
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = this.enemyBulletColor;
        ctx.shadowBlur = 6;
      }

      ctx.restore();
    }
  },

  // ============================================================
  // UTILITY
  // ============================================================

  getCount() {
    return this.list.length;
  },

  getPlayerBulletCount() {
    return this.list.filter(b => b.isPlayer).length;
  }
};

export default Bullets;
