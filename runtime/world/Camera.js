// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// CAMERA.js - Viewport Management
// ============================================================
// Handles camera following, smoothing, and screen shake

import { State } from '../State.js';

export const Camera = {
  // Camera position
  x: 0,
  y: 0,

  // Target position
  targetX: 0,
  targetY: 0,

  // Smoothing
  smoothing: 5, // Lower = smoother, higher = snappier

  // Screen shake
  shakeIntensity: 0,
  shakeDecay: 5,
  shakeOffsetX: 0,
  shakeOffsetY: 0,

  // Bounds
  minX: 0,
  minY: 0,
  maxX: Infinity,
  maxY: Infinity,

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize camera
   * @param {number} x - Initial X
   * @param {number} y - Initial Y
   */
  init(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  },

  /**
   * Set camera bounds based on zone
   * @param {number} zoneWidth - Zone width
   * @param {number} zoneHeight - Zone height
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   */
  setBounds(zoneWidth, zoneHeight, screenWidth, screenHeight) {
    this.minX = 0;
    this.minY = 0;
    this.maxX = Math.max(0, zoneWidth - screenWidth);
    this.maxY = Math.max(0, zoneHeight - screenHeight);
  },

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update camera each frame
   * @param {number} dt - Delta time
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   */
  update(dt, screenWidth, screenHeight) {
    // Update target to follow player
    this.followPlayer(screenWidth, screenHeight);

    // Smooth movement toward target
    const lerpFactor = 1 - Math.exp(-this.smoothing * dt);
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Clamp to bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    // Update screen shake
    this.updateShake(dt);
  },

  /**
   * Set target to follow player
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   */
  followPlayer(screenWidth, screenHeight) {
    // Center camera on player
    this.targetX = State.player.x - screenWidth / 2;
    this.targetY = State.player.y - screenHeight / 2;

    // Clamp target to bounds
    this.targetX = Math.max(this.minX, Math.min(this.maxX, this.targetX));
    this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
  },

  // ============================================================
  // SCREEN SHAKE
  // ============================================================

  /**
   * Trigger screen shake
   * @param {number} intensity - Shake intensity
   */
  shake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  },

  /**
   * Update screen shake
   * @param {number} dt - Delta time
   */
  updateShake(dt) {
    if (this.shakeIntensity > 0) {
      // Random offset
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 10;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 10;

      // Decay
      this.shakeIntensity -= this.shakeDecay * dt;
      if (this.shakeIntensity < 0.01) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  },

  // ============================================================
  // TRANSFORM
  // ============================================================

  /**
   * Apply camera transform to context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  applyTransform(ctx) {
    ctx.translate(
      -Math.round(this.x + this.shakeOffsetX),
      -Math.round(this.y + this.shakeOffsetY)
    );
  },

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X
   * @param {number} screenY - Screen Y
   * @returns {{x: number, y: number}} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x + this.shakeOffsetX,
      y: screenY + this.y + this.shakeOffsetY
    };
  },

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X
   * @param {number} worldY - World Y
   * @returns {{x: number, y: number}} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x - this.shakeOffsetX,
      y: worldY - this.y - this.shakeOffsetY
    };
  },

  /**
   * Check if world position is visible on screen
   * @param {number} worldX - World X
   * @param {number} worldY - World Y
   * @param {number} margin - Extra margin
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @returns {boolean} True if visible
   */
  isVisible(worldX, worldY, margin, screenWidth, screenHeight) {
    const screen = this.worldToScreen(worldX, worldY);
    return screen.x >= -margin &&
           screen.x <= screenWidth + margin &&
           screen.y >= -margin &&
           screen.y <= screenHeight + margin;
  },

  /**
   * Get visible area rectangle
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {number} margin - Extra margin
   * @returns {{x: number, y: number, width: number, height: number}} Visible rect
   */
  getVisibleRect(screenWidth, screenHeight, margin = 0) {
    return {
      x: this.x - margin,
      y: this.y - margin,
      width: screenWidth + margin * 2,
      height: screenHeight + margin * 2
    };
  },

  // ============================================================
  // GETTERS
  // ============================================================

  getX() {
    return this.x + this.shakeOffsetX;
  },

  getY() {
    return this.y + this.shakeOffsetY;
  },

  /**
   * Instantly move camera to position
   * @param {number} x - Target X
   * @param {number} y - Target Y
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  },

  /**
   * Center on position
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   */
  centerOn(x, y, screenWidth, screenHeight) {
    this.x = x - screenWidth / 2;
    this.y = y - screenHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // Clamp
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }
};

export default Camera;
