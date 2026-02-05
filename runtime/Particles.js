// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// PARTICLES.js - Visual Effects System
// ============================================================
// Handles explosions, damage numbers, trails, and other effects

export const Particles = {
  // Active particles
  list: [],

  // Pool for reuse
  pool: [],
  maxPoolSize: 500,

  // Maximum active particles
  maxParticles: 300,

  // ============================================================
  // CREATION
  // ============================================================

  /**
   * Create a single particle
   * @param {object} options - Particle options
   * @returns {object} Created particle
   */
  create(options) {
    if (this.list.length >= this.maxParticles) {
      // Remove oldest particle
      this.pool.push(this.list.shift());
    }

    let particle = this.pool.pop() || {};

    particle.x = options.x || 0;
    particle.y = options.y || 0;
    particle.vx = options.vx || 0;
    particle.vy = options.vy || 0;
    particle.ax = options.ax || 0; // Acceleration
    particle.ay = options.ay || 0;
    particle.size = options.size || 4;
    particle.sizeDecay = options.sizeDecay || 0;
    particle.color = options.color || '#ffffff';
    particle.alpha = options.alpha || 1;
    particle.alphaDecay = options.alphaDecay || 1;
    particle.lifetime = options.lifetime || 1;
    particle.age = 0;
    particle.type = options.type || 'circle';
    particle.text = options.text || '';
    particle.rotation = options.rotation || 0;
    particle.rotationSpeed = options.rotationSpeed || 0;
    particle.gravity = options.gravity || 0;
    particle.friction = options.friction || 1;

    this.list.push(particle);
    return particle;
  },

  // ============================================================
  // EFFECT PRESETS
  // ============================================================

  /**
   * Create explosion effect
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {string} size - 'small', 'medium', 'large'
   */
  createExplosion(x, y, size = 'medium') {
    const config = {
      small: { count: 8, speed: 100, particleSize: 4, lifetime: 0.3 },
      medium: { count: 15, speed: 150, particleSize: 6, lifetime: 0.4 },
      large: { count: 25, speed: 200, particleSize: 10, lifetime: 0.6 }
    };

    const c = config[size] || config.medium;
    const colors = ['#ff4444', '#ff8844', '#ffcc44', '#ffffff'];

    for (let i = 0; i < c.count; i++) {
      const angle = (i / c.count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = c.speed * (0.5 + Math.random() * 0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.create({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: c.particleSize * (0.5 + Math.random() * 0.5),
        sizeDecay: c.particleSize / c.lifetime,
        color,
        alphaDecay: 1 / c.lifetime,
        lifetime: c.lifetime * (0.8 + Math.random() * 0.4),
        friction: 0.95
      });
    }
  },

  /**
   * Create damage number
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} damage - Damage amount
   * @param {boolean} isCrit - Was critical hit
   */
  createDamage(x, y, damage, isCrit = false) {
    this.create({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vx: (Math.random() - 0.5) * 30,
      vy: -60 - Math.random() * 20,
      size: isCrit ? 18 : 14,
      color: isCrit ? '#ffff00' : '#ffffff',
      alphaDecay: 1.5,
      lifetime: 0.8,
      type: 'text',
      text: isCrit ? `${damage}!` : damage.toString(),
      gravity: 50
    });
  },

  /**
   * Create floating text
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} text - Text to display
   * @param {string} color - Text color
   */
  createText(x, y, text, color = '#ffffff') {
    this.create({
      x,
      y,
      vx: 0,
      vy: -40,
      size: 14,
      color,
      alphaDecay: 1.2,
      lifetime: 1,
      type: 'text',
      text
    });
  },

  /**
   * Create particle burst
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {string} color - Particle color
   * @param {number} count - Number of particles
   */
  createBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 40;

      this.create({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        sizeDecay: 4,
        color,
        alphaDecay: 2,
        lifetime: 0.5,
        friction: 0.9
      });
    }
  },

  /**
   * Create line effect (for chain lightning, etc.)
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {string} color - Line color
   */
  createLine(x1, y1, x2, y2, color) {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const count = Math.floor(dist / 15);

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      this.create({
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 10,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 4,
        sizeDecay: 8,
        color,
        alphaDecay: 4,
        lifetime: 0.25
      });
    }
  },

  /**
   * Create thrust/trail effect
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} angle - Direction angle
   * @param {string} color - Trail color
   */
  createThrust(x, y, angle, color = '#ff8800') {
    const spread = 0.3;
    for (let i = 0; i < 3; i++) {
      const particleAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
      const speed = 30 + Math.random() * 50;

      this.create({
        x: x + (Math.random() - 0.5) * 5,
        y: y + (Math.random() - 0.5) * 5,
        vx: Math.cos(particleAngle) * speed,
        vy: Math.sin(particleAngle) * speed,
        size: 3 + Math.random() * 3,
        sizeDecay: 6,
        color,
        alphaDecay: 3,
        lifetime: 0.3,
        friction: 0.95
      });
    }
  },

  /**
   * Create spark effect
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} count - Number of sparks
   */
  createSparks(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      this.create({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        sizeDecay: 2,
        color: '#ffff88',
        alphaDecay: 3,
        lifetime: 0.4,
        friction: 0.9,
        gravity: 200
      });
    }
  },

  /**
   * Create shield hit effect
   * @param {number} x - Impact X
   * @param {number} y - Impact Y
   * @param {number} angle - Impact angle
   */
  createShieldHit(x, y, angle) {
    const color = '#4488ff';
    const count = 8;

    for (let i = 0; i < count; i++) {
      const particleAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 50 + Math.random() * 50;

      this.create({
        x,
        y,
        vx: Math.cos(particleAngle) * speed,
        vy: Math.sin(particleAngle) * speed,
        size: 4,
        sizeDecay: 5,
        color,
        alphaDecay: 2,
        lifetime: 0.4
      });
    }
  },

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update all particles
   * @param {number} dt - Delta time
   */
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];

      // Age
      p.age += dt;
      if (p.age >= p.lifetime) {
        if (this.pool.length < this.maxPoolSize) {
          this.pool.push(this.list.splice(i, 1)[0]);
        } else {
          this.list.splice(i, 1);
        }
        continue;
      }

      // Physics
      p.vx += p.ax * dt;
      p.vy += p.ay * dt + p.gravity * dt;
      p.vx *= Math.pow(p.friction, dt * 60);
      p.vy *= Math.pow(p.friction, dt * 60);

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Decay
      p.alpha -= p.alphaDecay * dt;
      p.size -= p.sizeDecay * dt;
      p.rotation += p.rotationSpeed * dt;

      // Clamp
      p.alpha = Math.max(0, p.alpha);
      p.size = Math.max(0.1, p.size);
    }
  },

  // ============================================================
  // DRAWING
  // ============================================================

  /**
   * Draw all particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    for (const p of this.list) {
      if (p.alpha <= 0 || p.size <= 0) continue;

      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'text':
          ctx.fillStyle = p.color;
          ctx.font = `bold ${Math.round(p.size)}px Orbitron`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text, p.x, p.y);
          break;

        case 'square':
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;

        case 'circle':
        default:
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }

    ctx.globalAlpha = 1;
  },

  // ============================================================
  // UTILITY
  // ============================================================

  clear() {
    // Return all to pool
    while (this.list.length > 0) {
      if (this.pool.length < this.maxPoolSize) {
        this.pool.push(this.list.pop());
      } else {
        this.list.pop();
      }
    }
  },

  getCount() {
    return this.list.length;
  }
};

export default Particles;
