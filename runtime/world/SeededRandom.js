// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// SEEDEDRANDOM.js - Deterministic Random Number Generator
// ============================================================
// Mulberry32 PRNG for reproducible procedural generation

/**
 * Seeded Random Number Generator using Mulberry32 algorithm
 * Provides deterministic random numbers for procedural generation
 */
export class SeededRandom {
  /**
   * Create a seeded RNG
   * @param {number} seed - Initial seed value
   */
  constructor(seed) {
    this.seed = seed >>> 0; // Ensure unsigned 32-bit
    this.initialSeed = this.seed;
  }

  /**
   * Create from string (hashes string to seed)
   * @param {string} str - String to hash
   * @returns {SeededRandom} New RNG instance
   */
  static fromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit
    }
    return new SeededRandom(Math.abs(hash));
  }

  /**
   * Create from current time
   * @returns {SeededRandom} New RNG instance
   */
  static fromTime() {
    return new SeededRandom(Date.now());
  }

  /**
   * Get next random number [0, 1)
   * @returns {number} Random float
   */
  next() {
    // Mulberry32 algorithm
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Get random integer in range [min, max]
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Get random float in range [min, max)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float
   */
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  /**
   * Get random boolean with probability
   * @param {number} probability - Probability of true (0-1)
   * @returns {boolean} Random boolean
   */
  nextBool(probability = 0.5) {
    return this.next() < probability;
  },

  /**
   * Pick random element from array
   * @param {Array} array - Array to pick from
   * @returns {*} Random element
   */
  pick(array) {
    if (!array || array.length === 0) return undefined;
    return array[this.nextInt(0, array.length - 1)];
  },

  /**
   * Shuffle array in place (Fisher-Yates)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Same array, shuffled
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  /**
   * Pick weighted random from options
   * @param {Object} weights - Object with option: weight pairs
   * @returns {string} Selected option key
   */
  weightedPick(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * total;

    for (const [key, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return key;
    }

    // Fallback to last option
    return entries[entries.length - 1][0];
  },

  /**
   * Generate Gaussian/normal distributed random number
   * @param {number} mean - Mean value
   * @param {number} stdDev - Standard deviation
   * @returns {number} Normally distributed value
   */
  nextGaussian(mean = 0, stdDev = 1) {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  },

  /**
   * Generate random point in circle
   * @param {number} centerX - Circle center X
   * @param {number} centerY - Circle center Y
   * @param {number} radius - Circle radius
   * @returns {{x: number, y: number}} Random point
   */
  pointInCircle(centerX, centerY, radius) {
    const angle = this.next() * Math.PI * 2;
    const r = radius * Math.sqrt(this.next()); // Uniform distribution
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  },

  /**
   * Generate random point in rectangle
   * @param {number} x - Rectangle left
   * @param {number} y - Rectangle top
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {{x: number, y: number}} Random point
   */
  pointInRect(x, y, width, height) {
    return {
      x: x + this.next() * width,
      y: y + this.next() * height
    };
  },

  /**
   * Reset to initial seed
   */
  reset() {
    this.seed = this.initialSeed;
  },

  /**
   * Clone with current state
   * @returns {SeededRandom} New RNG with same state
   */
  clone() {
    const rng = new SeededRandom(this.seed);
    rng.initialSeed = this.initialSeed;
    return rng;
  },

  /**
   * Fork (create new RNG seeded from current)
   * @returns {SeededRandom} New RNG seeded from current random
   */
  fork() {
    return new SeededRandom(this.nextInt(0, 2147483647));
  }
}

// ============================================================
// NOISE GENERATION
// ============================================================

/**
 * Simple 1D Perlin-like noise
 * @param {SeededRandom} rng - RNG instance
 * @param {number} x - Position
 * @param {number} frequency - Noise frequency
 * @returns {number} Noise value [-1, 1]
 */
export function noise1D(rng, x, frequency = 1) {
  const xi = Math.floor(x * frequency);
  const t = (x * frequency) - xi;

  // Use seed-based lookup
  const savedSeed = rng.seed;

  rng.seed = xi * 0x45d9f3b;
  const a = rng.next() * 2 - 1;

  rng.seed = (xi + 1) * 0x45d9f3b;
  const b = rng.next() * 2 - 1;

  rng.seed = savedSeed;

  // Smoothstep interpolation
  const s = t * t * (3 - 2 * t);
  return a + s * (b - a);
}

/**
 * Simple 2D value noise
 * @param {SeededRandom} rng - RNG instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} frequency - Noise frequency
 * @returns {number} Noise value [0, 1]
 */
export function noise2D(rng, x, y, frequency = 1) {
  const xi = Math.floor(x * frequency);
  const yi = Math.floor(y * frequency);
  const tx = (x * frequency) - xi;
  const ty = (y * frequency) - yi;

  const savedSeed = rng.seed;

  // Get corner values
  const getValue = (px, py) => {
    rng.seed = (px * 0x45d9f3b + py * 0x6D2B79F5) >>> 0;
    return rng.next();
  };

  const v00 = getValue(xi, yi);
  const v10 = getValue(xi + 1, yi);
  const v01 = getValue(xi, yi + 1);
  const v11 = getValue(xi + 1, yi + 1);

  rng.seed = savedSeed;

  // Bilinear interpolation with smoothstep
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);

  const a = v00 + sx * (v10 - v00);
  const b = v01 + sx * (v11 - v01);

  return a + sy * (b - a);
}

/**
 * Fractal Brownian Motion (layered noise)
 * @param {SeededRandom} rng - RNG instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} octaves - Number of layers
 * @param {number} persistence - Amplitude falloff
 * @param {number} frequency - Base frequency
 * @returns {number} Noise value [0, 1]
 */
export function fbm2D(rng, x, y, octaves = 4, persistence = 0.5, frequency = 1) {
  let value = 0;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise2D(rng, x, y, frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return value / maxValue;
}

export default SeededRandom;
