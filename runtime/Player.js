// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// PLAYER.js - Player Entity and Controls
// ============================================================
// Handles player movement, shooting, collision, and state

import { State } from './State.js';
import { Input } from './Input.js';
import { Assets } from './AssetLoader.js';

export const Player = {
  // Sprite configuration
  spriteWidth: 64,
  spriteHeight: 64,

  // Movement smoothing
  acceleration: 1500,
  friction: 8,

  // Shooting state
  shootCooldown: 0,

  // Invulnerability flash
  flashTimer: 0,
  flashDuration: 0.1,

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update player each frame
   * @param {number} dt - Delta time
   * @param {HTMLCanvasElement} canvas - Game canvas
   * @param {boolean} explorationMode - Is exploration mode active
   */
  update(dt, canvas, explorationMode = true) {
    const p = State.player;

    // Handle movement input
    this.handleMovement(dt);

    // Handle shooting
    this.handleShooting(dt);

    // Update invulnerability
    this.updateInvulnerability(dt);

    // Shield regeneration
    if (State.modules?.Stats) {
      State.modules.Stats.regenShield(dt);
    }

    // HP regeneration (if any)
    this.updateHPRegen(dt);

    // Constrain to world bounds
    this.constrainToWorld();

    // Update direction for sprite
    this.updateDirection();
  },

  // ============================================================
  // MOVEMENT
  // ============================================================

  handleMovement(dt) {
    const p = State.player;
    const moveVector = Input.getMovementVector();

    // Calculate target velocity
    const targetVx = moveVector.x * p.moveSpeed;
    const targetVy = moveVector.y * p.moveSpeed;

    // Smooth acceleration
    const accel = this.acceleration * dt;

    if (moveVector.x !== 0 || moveVector.y !== 0) {
      // Accelerate toward target
      p.vx += (targetVx - p.vx) * Math.min(1, accel / p.moveSpeed);
      p.vy += (targetVy - p.vy) * Math.min(1, accel / p.moveSpeed);
    } else {
      // Apply friction
      p.vx *= Math.pow(0.01, dt * this.friction);
      p.vy *= Math.pow(0.01, dt * this.friction);

      // Stop if very slow
      if (Math.abs(p.vx) < 1) p.vx = 0;
      if (Math.abs(p.vy) < 1) p.vy = 0;
    }

    // Apply velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  },

  updateDirection() {
    const p = State.player;
    const direction = Input.getDirection8();

    if (direction !== 'none') {
      p.direction = direction;
    }
  },

  constrainToWorld() {
    const p = State.player;
    const zone = State.modules?.World?.currentZone;

    if (!zone) return;

    const halfW = this.spriteWidth / 2;
    const halfH = this.spriteHeight / 2;

    // Constrain to zone bounds
    p.x = Math.max(halfW, Math.min(zone.width - halfW, p.x));
    p.y = Math.max(halfH, Math.min(zone.height - halfH, p.y));
  },

  // ============================================================
  // SHOOTING
  // ============================================================

  handleShooting(dt) {
    const p = State.player;

    // Decrease cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Check for shoot input
    const wantToShoot = Input.isPressed('shoot') || Input.isMousePressed();

    if (wantToShoot && this.shootCooldown <= 0) {
      this.shoot();
    }
  },

  shoot() {
    const p = State.player;

    // Calculate fire rate with attack speed
    const effectiveFireRate = p.fireRate / p.attackSpeed;
    this.shootCooldown = effectiveFireRate;

    // Get aim direction
    const aim = Input.getAimDirection(p.x, p.y);

    // Create bullet
    if (State.modules?.Bullets) {
      // Handle multi-projectile weapons
      const projectiles = p.projectiles || 1;
      const spreadAngle = projectiles > 1 ? 0.15 : 0; // Spread for multi-shot

      for (let i = 0; i < projectiles; i++) {
        let angle = aim.angle;
        if (projectiles > 1) {
          // Spread projectiles evenly
          const offset = (i - (projectiles - 1) / 2) * spreadAngle;
          angle += offset;
        }

        State.modules.Bullets.create({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 500,
          vy: Math.sin(angle) * 500,
          damage: p.damage,
          isPlayer: true,
          pierce: p.pierce || 0,
          chain: p.chain || 0,
          aoe: p.aoe || 0
        });
      }
    }

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playCombat('player_shoot');
    }
  },

  // ============================================================
  // DAMAGE
  // ============================================================

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @param {object} source - Damage source (enemy/bullet)
   * @returns {boolean} True if player survived
   */
  takeDamage(amount, source = null) {
    const p = State.player;

    // Check invulnerability
    if (p.invulnerable) return true;

    // Calculate actual damage taken
    const result = State.modules?.Stats?.calculateDamageTaken(amount) || { damage: amount, dodged: false, absorbed: 0 };

    if (result.dodged) {
      // Show dodge indicator
      if (State.modules?.Particles) {
        State.modules.Particles.createText(p.x, p.y - 30, 'DODGE!', '#00ffff');
      }
      return true;
    }

    // Apply shield absorption
    if (result.absorbed > 0) {
      p.shield -= result.absorbed;
      if (p.shield <= 0) {
        p.shield = 0;
        // Shield break sound
        if (State.modules?.Audio) {
          State.modules.Audio.playCombat('shield_break');
        }
      } else {
        // Shield hit sound
        if (State.modules?.Audio) {
          State.modules.Audio.playCombat('shield_hit');
        }
      }
    }

    // Apply HP damage
    if (result.damage > 0) {
      p.hp -= result.damage;

      // Track damage taken
      State.run.stats.damageTaken += result.damage;

      // Damage particles
      if (State.modules?.Particles) {
        State.modules.Particles.createDamage(p.x, p.y, result.damage, false);
      }

      // Hit sound
      if (State.modules?.Audio) {
        State.modules.Audio.playCombat('player_hit');
      }

      // Screen shake
      if (State.meta.settings.screenShake && State.modules?.Camera) {
        State.modules.Camera.shake(result.damage / 50);
      }
    }

    // Start invulnerability
    p.invulnerable = true;
    p.invulnerableTimer = 0.5; // 0.5s invulnerability

    // Check Last Stand skill
    if (p.hp <= 0 && p.lastStand && !p.lastStandUsed) {
      p.hp = 1;
      p.lastStandUsed = true;
      p.invulnerableTimer = p.lastStandDuration || 3;

      // Announce
      if (window.Game?.announce) {
        window.Game.announce('LAST STAND!', 'warning');
      }

      return true;
    }

    // Check death
    if (p.hp <= 0) {
      p.hp = 0;
      return false;
    }

    return true;
  },

  /**
   * Heal player
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    if (State.modules?.Stats) {
      const healed = State.modules.Stats.heal(amount);
      if (healed > 0 && State.modules?.Particles) {
        State.modules.Particles.createText(State.player.x, State.player.y - 30, `+${healed}`, '#00ff88');
      }
    }
  },

  // ============================================================
  // INVULNERABILITY
  // ============================================================

  updateInvulnerability(dt) {
    const p = State.player;

    if (p.invulnerable) {
      p.invulnerableTimer -= dt;
      if (p.invulnerableTimer <= 0) {
        p.invulnerable = false;
        p.invulnerableTimer = 0;
      }

      // Flash effect
      this.flashTimer += dt;
      if (this.flashTimer >= this.flashDuration * 2) {
        this.flashTimer = 0;
      }
    }
  },

  // ============================================================
  // HP REGEN
  // ============================================================

  updateHPRegen(dt) {
    const p = State.player;

    // Base regen from vitality
    const vitRegen = Math.floor(State.meta.pilotStats.vitality / 10);

    // Bonus regen from skills/items
    const bonusRegen = p.hpRegenBonus || 0;

    const totalRegen = vitRegen * (1 + bonusRegen);

    if (totalRegen > 0 && p.hp < p.maxHP) {
      p.hp = Math.min(p.maxHP, p.hp + totalRegen * dt);
    }
  },

  // ============================================================
  // STATE CHECKS
  // ============================================================

  /**
   * Check if player is dead
   * @returns {boolean} True if dead
   */
  isDead() {
    return State.player.hp <= 0;
  },

  /**
   * Get hitbox for collision
   * @returns {{x: number, y: number, width: number, height: number}} Hitbox
   */
  getHitbox() {
    const p = State.player;
    const size = 24; // Smaller than sprite for better feel
    return {
      x: p.x - size / 2,
      y: p.y - size / 2,
      width: size,
      height: size
    };
  },

  // ============================================================
  // DRAWING
  // ============================================================

  /**
   * Draw player
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    const p = State.player;

    // Skip drawing during invulnerability flash
    if (p.invulnerable && this.flashTimer < this.flashDuration) {
      return;
    }

    // Get sprite
    const sprite = Assets.getImage('player_ship');

    if (sprite) {
      // Draw sprite rotated based on direction
      const angle = this.getDirectionAngle(p.direction);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.drawImage(
        sprite,
        -this.spriteWidth / 2,
        -this.spriteHeight / 2,
        this.spriteWidth,
        this.spriteHeight
      );
      ctx.restore();
    } else {
      // Fallback: draw a simple triangle
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();

      const angle = this.getDirectionAngle(p.direction);
      const size = 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw shield bubble if active
    if (p.shield > 0) {
      const shieldAlpha = Math.min(0.3, p.shield / p.maxShield * 0.3);
      ctx.strokeStyle = `rgba(0, 170, 255, ${shieldAlpha + 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.spriteWidth / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /**
   * Get rotation angle for direction
   * @param {string} direction - Direction name
   * @returns {number} Angle in radians
   */
  getDirectionAngle(direction) {
    const angles = {
      'right': 0,
      'down-right': Math.PI / 4,
      'down': Math.PI / 2,
      'down-left': Math.PI * 3 / 4,
      'left': Math.PI,
      'up-left': -Math.PI * 3 / 4,
      'up': -Math.PI / 2,
      'up-right': -Math.PI / 4
    };
    return angles[direction] || 0;
  },

  // ============================================================
  // RESET
  // ============================================================

  /**
   * Reset player for new zone
   */
  reset() {
    const p = State.player;
    p.invulnerable = false;
    p.invulnerableTimer = 0;
    p.lastShotTime = 0;
    p.statusEffects = [];
    p.lastStandUsed = false;
    this.shootCooldown = 0;
    this.flashTimer = 0;
  }
};

export default Player;
