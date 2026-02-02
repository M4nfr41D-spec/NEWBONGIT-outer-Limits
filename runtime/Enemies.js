// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// ENEMIES.js - Enemy AI and Management System
// ============================================================
// Handles enemy spawning, AI behaviors, damage, and drops

import { State } from './State.js';
import { Assets } from './AssetLoader.js';

export const Enemies = {
  // Active enemies
  list: [],

  // Spawn tracking
  spawnedIds: new Set(),

  // Elite modifiers
  modifierPool: [
    'enraged', 'multishot', 'piercing', 'homing', 'explosive',
    'armored', 'shielded', 'vampiric', 'reflective', 'phasing',
    'teleporter', 'summoner', 'auraDamage', 'auraSpeed', 'unstable'
  ],

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update all enemies
   * @param {number} dt - Delta time
   * @param {HTMLCanvasElement} canvas - Canvas for bounds
   */
  update(dt, canvas) {
    const player = State.player;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const enemy = this.list[i];

      // Update AI
      this.updateAI(enemy, dt, player);

      // Update position
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      // Update shoot cooldown
      if (enemy.shootCooldown > 0) {
        enemy.shootCooldown -= dt;
      }

      // Attempt to shoot
      if (enemy.canShoot && enemy.shootCooldown <= 0) {
        this.enemyShoot(enemy, player);
      }

      // Update shield regen
      if (enemy.shieldRegen && enemy.shield < enemy.maxShield) {
        enemy.shield = Math.min(enemy.maxShield, enemy.shield + enemy.shieldRegen * dt);
      }

      // Update status effects
      this.updateStatusEffects(enemy, dt);

      // Check death
      if (enemy.hp <= 0) {
        this.onEnemyDeath(enemy);
        this.list.splice(i, 1);
      }
    }
  },

  // ============================================================
  // AI BEHAVIORS
  // ============================================================

  updateAI(enemy, dt, player) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 0;

    // Teleporter modifier
    if (enemy.modifiers?.teleporter && enemy.teleportCooldown <= 0 && dist < 200) {
      this.teleportEnemy(enemy);
      enemy.teleportCooldown = 3;
    }
    if (enemy.teleportCooldown > 0) {
      enemy.teleportCooldown -= dt;
    }

    switch (enemy.behavior) {
      case 'swarm':
        // Move directly toward player
        enemy.vx = dirX * enemy.speed;
        enemy.vy = dirY * enemy.speed;
        break;

      case 'aggressive':
        // Move toward player but maintain some distance
        if (dist > 150) {
          enemy.vx = dirX * enemy.speed;
          enemy.vy = dirY * enemy.speed;
        } else if (dist < 100) {
          // Back away slowly
          enemy.vx = -dirX * enemy.speed * 0.5;
          enemy.vy = -dirY * enemy.speed * 0.5;
        } else {
          // Circle strafe
          enemy.vx = -dirY * enemy.speed * 0.7;
          enemy.vy = dirX * enemy.speed * 0.7;
        }
        break;

      case 'ranged':
        // Keep distance, retreat if too close
        if (dist < enemy.range * 0.8) {
          enemy.vx = -dirX * enemy.speed;
          enemy.vy = -dirY * enemy.speed;
        } else if (dist > enemy.range) {
          enemy.vx = dirX * enemy.speed * 0.5;
          enemy.vy = dirY * enemy.speed * 0.5;
        } else {
          // Strafe
          enemy.vx = -dirY * enemy.speed * 0.3;
          enemy.vy = dirX * enemy.speed * 0.3;
        }
        break;

      case 'suicide':
        // Rush toward player
        enemy.vx = dirX * enemy.speed * 1.5;
        enemy.vy = dirY * enemy.speed * 1.5;

        // Check collision with player
        if (dist < 30) {
          this.suicideExplosion(enemy, player);
        }
        break;

      case 'artillery':
        // Stay stationary or move very slowly
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;
        break;

      case 'ambush':
        // If cloaked, move toward player slowly
        if (enemy.cloaked) {
          enemy.vx = dirX * enemy.speed * 0.3;
          enemy.vy = dirY * enemy.speed * 0.3;
          // Uncloak when close
          if (dist < 150) {
            enemy.cloaked = false;
          }
        } else {
          // Aggressive once revealed
          enemy.vx = dirX * enemy.speed;
          enemy.vy = dirY * enemy.speed;
        }
        break;

      case 'spawner':
        // Stay back, spawn minions
        if (dist < 300) {
          enemy.vx = -dirX * enemy.speed * 0.5;
          enemy.vy = -dirY * enemy.speed * 0.5;
        }

        // Spawn timer
        if (!enemy.spawnTimer) enemy.spawnTimer = 0;
        enemy.spawnTimer += dt;
        if (enemy.spawnTimer >= enemy.spawnRate && enemy.currentSpawns < enemy.maxSpawns) {
          this.spawnMinion(enemy);
          enemy.spawnTimer = 0;
        }
        break;

      case 'defensive':
        // Circle player at safe distance
        const safeDistance = 200;
        if (dist < safeDistance - 20) {
          enemy.vx = -dirX * enemy.speed;
          enemy.vy = -dirY * enemy.speed;
        } else if (dist > safeDistance + 20) {
          enemy.vx = dirX * enemy.speed * 0.5;
          enemy.vy = dirY * enemy.speed * 0.5;
        } else {
          enemy.vx = -dirY * enemy.speed * 0.5;
          enemy.vy = dirX * enemy.speed * 0.5;
        }
        break;

      default:
        // Default: basic chase
        enemy.vx = dirX * enemy.speed;
        enemy.vy = dirY * enemy.speed;
    }

    // Apply aura effects
    if (enemy.modifiers?.auraDamage || enemy.modifiers?.auraSpeed) {
      this.applyAuras(enemy);
    }
  },

  // ============================================================
  // ENEMY SHOOTING
  // ============================================================

  enemyShoot(enemy, player) {
    if (!State.modules?.Bullets) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check range
    if (dist > (enemy.range || 400)) return;

    const angle = Math.atan2(dy, dx);
    const speed = 300;

    const projectiles = enemy.modifiers?.multishot ? 3 : (enemy.projectiles || 1);
    const spread = projectiles > 1 ? 0.2 : 0;

    for (let i = 0; i < projectiles; i++) {
      let bulletAngle = angle;
      if (projectiles > 1) {
        bulletAngle += (i - (projectiles - 1) / 2) * spread;
      }

      State.modules.Bullets.create({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(bulletAngle) * speed,
        vy: Math.sin(bulletAngle) * speed,
        damage: enemy.damage * (enemy.modifiers?.enraged ? 1.5 : 1),
        isPlayer: false,
        homing: enemy.modifiers?.homing || false,
        pierce: enemy.modifiers?.piercing ? 1 : 0
      });
    }

    enemy.shootCooldown = enemy.fireRate / (enemy.modifiers?.enraged ? 1.3 : 1);

    // Sound
    if (State.modules?.Audio) {
      State.modules.Audio.plasCombat?.('enemy_shoot') ||
        State.modules.Audio.playSFXPositional?.('enemy_shoot_1', enemy.x, enemy.y);
    }
  },

  // ============================================================
  // DAMAGE
  // ============================================================

  /**
   * Deal damage to enemy
   * @param {object} enemy - Enemy to damage
   * @param {number} amount - Damage amount
   * @param {boolean} isCrit - Was this a critical hit
   * @returns {boolean} True if enemy survived
   */
  damage(enemy, amount, isCrit = false) {
    let damage = amount;

    // Armored modifier
    if (enemy.modifiers?.armored) {
      damage *= 0.5;
    }

    // Shield absorption
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, damage);
      enemy.shield -= absorbed;
      damage -= absorbed;

      if (enemy.shield <= 0 && State.modules?.Audio) {
        State.modules.Audio.playCombat?.('shield_break');
      }
    }

    // Reflective modifier
    if (enemy.modifiers?.reflective && State.modules?.Player) {
      State.modules.Player.takeDamage(amount * 0.25);
    }

    // Vampiric modifier
    if (enemy.modifiers?.vampiric) {
      enemy.hp = Math.min(enemy.maxHP, enemy.hp + damage * 0.25);
    }

    // Phasing modifier (dodge)
    if (enemy.modifiers?.phasing && Math.random() < 0.3) {
      if (State.modules?.Particles) {
        State.modules.Particles.createText(enemy.x, enemy.y - 20, 'DODGE', '#aa88ff');
      }
      return true;
    }

    // Apply damage
    enemy.hp -= damage;

    // Track damage dealt
    State.run.stats.damageDealt += damage;

    // Damage particles
    if (State.modules?.Particles) {
      State.modules.Particles.createDamage(enemy.x, enemy.y, Math.round(damage), isCrit);
    }

    // Hit sound
    if (State.modules?.Audio) {
      State.modules.Audio.playCombat?.('enemy_hit');
    }

    // Summoner modifier
    if (enemy.modifiers?.summoner && enemy.currentSpawns < 3) {
      if (Math.random() < 0.2) {
        this.spawnMinion(enemy);
      }
    }

    return enemy.hp > 0;
  },

  // ============================================================
  // DEATH
  // ============================================================

  onEnemyDeath(enemy) {
    // Kill count
    State.run.stats.kills++;
    State.meta.totalKills++;

    if (enemy.isElite) {
      State.run.stats.eliteKills++;
    }
    if (enemy.isBoss) {
      State.run.stats.bossKills++;
    }

    // Kill streak
    State.run.killStreak++;
    State.run.lastKillTime = performance.now();
    if (State.run.killStreak > State.run.stats.highestCombo) {
      State.run.stats.highestCombo = State.run.killStreak;
    }

    // XP reward
    if (State.modules?.Leveling) {
      const xp = State.modules.Leveling.calculateEnemyXP(enemy);
      State.modules.Leveling.awardXP(xp, 'kill');
    }

    // Scrap drop
    const scrapAmount = Math.floor(Math.random() * (enemy.scrap?.max || 5) + (enemy.scrap?.min || 1));
    const scrapBonus = State.player.bonuses?.scrapBonus || 0;
    const finalScrap = Math.round(scrapAmount * (1 + scrapBonus));
    State.run.scrapEarned += finalScrap;

    // Item drop check
    this.checkDrop(enemy);

    // Cells drop (elite/boss only)
    if (enemy.isElite) {
      State.run.cells += Math.floor(Math.random() * 5) + 3;
    }
    if (enemy.isBoss) {
      State.run.cells += Math.floor(Math.random() * 30) + 20;
      State.run.cores++;
    }

    // Death particles
    if (State.modules?.Particles) {
      State.modules.Particles.createExplosion(enemy.x, enemy.y, enemy.isBoss ? 'large' : 'medium');
    }

    // Sound
    if (State.modules?.Audio) {
      if (enemy.isBoss) {
        State.modules.Audio.playSFX?.('boss_death');
      } else {
        State.modules.Audio.playCombat?.('enemy_death');
      }
    }

    // Unstable modifier explosion
    if (enemy.modifiers?.unstable) {
      this.unstableExplosion(enemy);
    }

    // Mark spawn as killed
    if (enemy.spawnId) {
      this.spawnedIds.add(enemy.spawnId);
    }
  },

  checkDrop(enemy) {
    // Calculate drop chance
    let dropChance = 0.12; // Base 12%

    // Elite bonus
    if (enemy.isElite) {
      dropChance = 0.35;
      // Treasure Hunter skill
      if (State.player.eliteGuaranteedDrop) {
        dropChance = 1;
      }
    }

    // Boss guaranteed
    if (enemy.isBoss) {
      dropChance = 1;
    }

    // Early game boost
    if (State.meta.level <= 25) {
      dropChance += 0.15;
    }

    // Roll drop
    if (Math.random() < dropChance) {
      // Generate item
      const item = State.modules?.Items?.generateDrop(
        State.run.currentZone,
        State.run.currentAct,
        enemy.isElite,
        enemy.isBoss
      );

      if (item && State.modules?.Pickups) {
        State.modules.Pickups.create('item', enemy.x, enemy.y, item);
      }
    }

    // Always drop health on boss
    if (enemy.isBoss && State.modules?.Pickups) {
      State.modules.Pickups.create('health', enemy.x + 50, enemy.y);
    }
  },

  // ============================================================
  // SPAWNING
  // ============================================================

  /**
   * Spawn enemy at position
   * @param {object} data - Enemy data from zone spawn
   * @returns {object} Spawned enemy
   */
  spawn(data) {
    const enemyDef = State.data.enemies?.[data.type];
    if (!enemyDef) {
      console.warn('[Enemies] Unknown enemy type:', data.type);
      return null;
    }

    // Scale stats with zone
    const zoneScale = 1 + (State.run.currentZone || 0) * 0.06;

    const enemy = {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      spawnId: data.id,
      type: data.type,
      ...enemyDef,

      // Position
      x: data.x,
      y: data.y,
      vx: 0,
      vy: 0,

      // Scaled stats
      hp: Math.round(enemyDef.hp * zoneScale),
      maxHP: Math.round(enemyDef.hp * zoneScale),
      damage: Math.round((enemyDef.damage || 10) * zoneScale),

      // Combat state
      shootCooldown: Math.random() * (enemyDef.fireRate || 1),
      canShoot: enemyDef.fireRate !== undefined,

      // Elite/Boss flags
      isElite: data.isElite || false,
      isBoss: data.isBoss || false,

      // Modifiers
      modifiers: {},
      currentSpawns: 0,
      teleportCooldown: 0
    };

    // Apply elite modifiers
    if (data.isElite) {
      this.applyEliteModifiers(enemy);
    }

    // Apply boss scaling
    if (data.isBoss) {
      enemy.hp *= 10;
      enemy.maxHP *= 10;
      enemy.damage *= 2;
    }

    // Shield from definition
    if (enemyDef.shield) {
      enemy.shield = enemyDef.shield * zoneScale;
      enemy.maxShield = enemy.shield;
      enemy.shieldRegen = enemyDef.shieldRegen || 0;
    }

    // Cloak for ambush
    if (enemy.behavior === 'ambush' && enemyDef.canCloak) {
      enemy.cloaked = true;
    }

    this.list.push(enemy);
    return enemy;
  },

  applyEliteModifiers(enemy) {
    // Apply 1-3 random modifiers
    const count = 1 + Math.floor(Math.random() * 2);
    const available = [...this.modifierPool];

    for (let i = 0; i < count && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      const mod = available.splice(index, 1)[0];

      const modData = State.data.enemies?.eliteModifiers?.[mod];
      if (modData) {
        enemy.modifiers[mod] = true;

        // Apply stat changes
        if (modData.damage) enemy.damage *= modData.damage;
        if (modData.damageReduction) enemy.damageReduction = modData.damageReduction;
        if (modData.shield) {
          enemy.shield = modData.shield;
          enemy.maxShield = modData.shield;
          enemy.shieldRegen = modData.shieldRegen || 0;
        }
      }
    }

    // Elite stat boost
    enemy.hp *= 2;
    enemy.maxHP *= 2;
    enemy.damage *= 1.5;
  },

  spawnMinion(parentEnemy) {
    const minionType = parentEnemy.spawnType || 'drone_basic';
    const offset = 50;
    const angle = Math.random() * Math.PI * 2;

    this.spawn({
      type: minionType,
      x: parentEnemy.x + Math.cos(angle) * offset,
      y: parentEnemy.y + Math.sin(angle) * offset,
      isElite: false
    });

    parentEnemy.currentSpawns++;
  },

  // ============================================================
  // SPECIAL ACTIONS
  // ============================================================

  suicideExplosion(enemy, player) {
    const radius = enemy.aoeRadius || 40;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      State.modules?.Player?.takeDamage(enemy.damage);
    }

    // Kill self
    enemy.hp = 0;

    // Explosion effect
    if (State.modules?.Particles) {
      State.modules.Particles.createExplosion(enemy.x, enemy.y, 'small');
    }
  },

  unstableExplosion(enemy) {
    const radius = 80;
    const damage = 50;

    // Damage player if in range
    const dx = State.player.x - enemy.x;
    const dy = State.player.y - enemy.y;
    if (Math.sqrt(dx * dx + dy * dy) < radius) {
      State.modules?.Player?.takeDamage(damage);
    }

    // Explosion effect
    if (State.modules?.Particles) {
      State.modules.Particles.createExplosion(enemy.x, enemy.y, 'medium');
    }
  },

  teleportEnemy(enemy) {
    const range = 150;
    const angle = Math.random() * Math.PI * 2;
    enemy.x += Math.cos(angle) * range;
    enemy.y += Math.sin(angle) * range;

    // Effect
    if (State.modules?.Particles) {
      State.modules.Particles.createBurst(enemy.x, enemy.y, '#8800ff', 10);
    }
  },

  applyAuras(enemy) {
    const radius = 150;

    for (const other of this.list) {
      if (other === enemy) continue;

      const dx = other.x - enemy.x;
      const dy = other.y - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        if (enemy.modifiers.auraDamage) {
          other.damage *= 1.25;
        }
        if (enemy.modifiers.auraSpeed) {
          other.speed *= 1.3;
        }
      }
    }
  },

  updateStatusEffects(enemy, dt) {
    // Placeholder for DoT effects, slows, etc.
  },

  // ============================================================
  // DRAWING
  // ============================================================

  draw(ctx) {
    for (const enemy of this.list) {
      // Skip cloaked enemies (mostly invisible)
      if (enemy.cloaked) {
        ctx.globalAlpha = 0.2;
      }

      // Get sprite
      const sprite = Assets.getImage(enemy.sprite);

      if (sprite) {
        const size = enemy.isBoss ? 128 : (enemy.tier >= 3 ? 64 : 48);
        ctx.drawImage(sprite, enemy.x - size / 2, enemy.y - size / 2, size, size);
      } else {
        // Fallback shape
        ctx.fillStyle = enemy.isBoss ? '#ff3355' : (enemy.isElite ? '#ffaa00' : '#ff4444');
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.isBoss ? 40 : 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // HP bar
      if (enemy.hp < enemy.maxHP) {
        this.drawHealthBar(ctx, enemy);
      }

      // Elite indicator
      if (enemy.isElite) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('ELITE', enemy.x, enemy.y - 35);
      }

      // Shield bar
      if (enemy.shield > 0) {
        this.drawShieldBar(ctx, enemy);
      }
    }
  },

  drawHealthBar(ctx, enemy) {
    const barWidth = 40;
    const barHeight = 4;
    const x = enemy.x - barWidth / 2;
    const y = enemy.y - 30;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // HP fill
    const hpPercent = enemy.hp / enemy.maxHP;
    ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : (hpPercent > 0.25 ? '#ffaa00' : '#ff4444');
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
  },

  drawShieldBar(ctx, enemy) {
    const barWidth = 40;
    const barHeight = 3;
    const x = enemy.x - barWidth / 2;
    const y = enemy.y - 35;

    ctx.fillStyle = '#4488ff';
    ctx.fillRect(x, y, barWidth * (enemy.shield / enemy.maxShield), barHeight);
  },

  // ============================================================
  // UTILITY
  // ============================================================

  clear() {
    this.list = [];
    this.spawnedIds.clear();
  },

  getCount() {
    return this.list.length;
  },

  getEliteCount() {
    return this.list.filter(e => e.isElite).length;
  },

  getBoss() {
    return this.list.find(e => e.isBoss) || null;
  }
};

export default Enemies;
