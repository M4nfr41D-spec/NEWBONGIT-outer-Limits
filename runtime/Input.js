// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// INPUT.js - Keyboard and Mouse Input Handler
// ============================================================
// Manages all player input with key state tracking

import { State } from './State.js';

export const Input = {
  // Key states
  keys: {},
  keysJustPressed: {},
  keysJustReleased: {},

  // Mouse state
  mouse: {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    pressed: false,
    justPressed: false,
    justReleased: false,
    button: 0
  },

  // Canvas reference
  canvas: null,

  // Key mappings
  keyMap: {
    // Movement
    'KeyW': 'up',
    'ArrowUp': 'up',
    'KeyS': 'down',
    'ArrowDown': 'down',
    'KeyA': 'left',
    'ArrowLeft': 'left',
    'KeyD': 'right',
    'ArrowRight': 'right',

    // Actions
    'Space': 'shoot',
    'ShiftLeft': 'boost',
    'ShiftRight': 'boost',
    'KeyE': 'interact',
    'KeyQ': 'ability',

    // UI
    'Escape': 'pause',
    'Tab': 'inventory',
    'KeyI': 'inventory',
    'KeyM': 'map'
  },

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize input system
   * @param {HTMLCanvasElement} canvas - Game canvas
   */
  init(canvas) {
    this.canvas = canvas;

    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse events
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events (mobile support)
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Focus handling
    window.addEventListener('blur', () => this.onBlur());

    console.log('[Input] Initialized');
  },

  // ============================================================
  // KEYBOARD HANDLERS
  // ============================================================

  onKeyDown(e) {
    const code = e.code;

    // Don't capture if typing in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Prevent default for game keys
    if (this.keyMap[code]) {
      e.preventDefault();
    }

    // Track state
    if (!this.keys[code]) {
      this.keysJustPressed[code] = true;
    }
    this.keys[code] = true;

    // Handle pause toggle
    if (code === 'Escape') {
      State.ui.paused = !State.ui.paused;
      if (State.modules?.PauseUI) {
        if (State.ui.paused) {
          State.modules.PauseUI.show();
        } else {
          State.modules.PauseUI.hide();
        }
      }
    }
  },

  onKeyUp(e) {
    const code = e.code;
    this.keys[code] = false;
    this.keysJustReleased[code] = true;
  },

  // ============================================================
  // MOUSE HANDLERS
  // ============================================================

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // Update world coordinates if camera is available
    if (State.modules?.Camera) {
      this.mouse.worldX = this.mouse.x + State.modules.Camera.getX();
      this.mouse.worldY = this.mouse.y + State.modules.Camera.getY();
    } else {
      this.mouse.worldX = this.mouse.x;
      this.mouse.worldY = this.mouse.y;
    }
  },

  onMouseDown(e) {
    this.mouse.pressed = true;
    this.mouse.justPressed = true;
    this.mouse.button = e.button;

    // Update position
    this.onMouseMove(e);
  },

  onMouseUp(e) {
    this.mouse.pressed = false;
    this.mouse.justReleased = true;
    this.mouse.button = e.button;
  },

  // ============================================================
  // TOUCH HANDLERS
  // ============================================================

  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
      this.mouse.pressed = true;
      this.mouse.justPressed = true;

      if (State.modules?.Camera) {
        this.mouse.worldX = this.mouse.x + State.modules.Camera.getX();
        this.mouse.worldY = this.mouse.y + State.modules.Camera.getY();
      }
    }
  },

  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;

      if (State.modules?.Camera) {
        this.mouse.worldX = this.mouse.x + State.modules.Camera.getX();
        this.mouse.worldY = this.mouse.y + State.modules.Camera.getY();
      }
    }
  },

  onTouchEnd(e) {
    this.mouse.pressed = false;
    this.mouse.justReleased = true;
  },

  // ============================================================
  // BLUR HANDLER
  // ============================================================

  onBlur() {
    // Clear all keys when window loses focus
    this.keys = {};
    this.mouse.pressed = false;
  },

  // ============================================================
  // FRAME UPDATE
  // ============================================================

  /**
   * Clear one-frame states (call at end of frame)
   */
  update() {
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this.mouse.justPressed = false;
    this.mouse.justReleased = false;
  },

  // ============================================================
  // QUERY METHODS
  // ============================================================

  /**
   * Check if a key/action is currently pressed
   * @param {string} action - Action name or key code
   * @returns {boolean} True if pressed
   */
  isPressed(action) {
    // Check by action name
    for (const [code, name] of Object.entries(this.keyMap)) {
      if (name === action && this.keys[code]) {
        return true;
      }
    }
    // Check by raw key code
    return this.keys[action] || false;
  },

  /**
   * Check if a key/action was just pressed this frame
   * @param {string} action - Action name or key code
   * @returns {boolean} True if just pressed
   */
  isJustPressed(action) {
    for (const [code, name] of Object.entries(this.keyMap)) {
      if (name === action && this.keysJustPressed[code]) {
        return true;
      }
    }
    return this.keysJustPressed[action] || false;
  },

  /**
   * Check if a key/action was just released this frame
   * @param {string} action - Action name or key code
   * @returns {boolean} True if just released
   */
  isJustReleased(action) {
    for (const [code, name] of Object.entries(this.keyMap)) {
      if (name === action && this.keysJustReleased[code]) {
        return true;
      }
    }
    return this.keysJustReleased[action] || false;
  },

  /**
   * Get mouse position in screen coordinates
   * @returns {{x: number, y: number}} Screen position
   */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  },

  /**
   * Get mouse position in world coordinates
   * @returns {{x: number, y: number}} World position
   */
  getMouseWorldPosition() {
    return { x: this.mouse.worldX, y: this.mouse.worldY };
  },

  /**
   * Check if mouse/touch is pressed
   * @returns {boolean} True if pressed
   */
  isMousePressed() {
    return this.mouse.pressed;
  },

  /**
   * Check if mouse/touch was just pressed
   * @returns {boolean} True if just pressed
   */
  isMouseJustPressed() {
    return this.mouse.justPressed;
  },

  /**
   * Get movement direction vector
   * @returns {{x: number, y: number}} Normalized direction (-1 to 1)
   */
  getMovementVector() {
    let x = 0;
    let y = 0;

    if (this.isPressed('left')) x -= 1;
    if (this.isPressed('right')) x += 1;
    if (this.isPressed('up')) y -= 1;
    if (this.isPressed('down')) y += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    return { x, y };
  },

  /**
   * Get aim direction from player to mouse
   * @param {number} playerX - Player world X
   * @param {number} playerY - Player world Y
   * @returns {{x: number, y: number, angle: number}} Normalized aim direction and angle
   */
  getAimDirection(playerX, playerY) {
    const dx = this.mouse.worldX - playerX;
    const dy = this.mouse.worldY - playerY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      return { x: 1, y: 0, angle: 0 };
    }

    return {
      x: dx / len,
      y: dy / len,
      angle: Math.atan2(dy, dx)
    };
  },

  /**
   * Get 8-directional movement direction name
   * @returns {string} Direction name
   */
  getDirection8() {
    const v = this.getMovementVector();

    if (v.x === 0 && v.y === 0) return 'none';

    const angle = Math.atan2(v.y, v.x);
    const deg = (angle * 180 / Math.PI + 360) % 360;

    // 8 directions, 45 degrees each
    if (deg >= 337.5 || deg < 22.5) return 'right';
    if (deg >= 22.5 && deg < 67.5) return 'down-right';
    if (deg >= 67.5 && deg < 112.5) return 'down';
    if (deg >= 112.5 && deg < 157.5) return 'down-left';
    if (deg >= 157.5 && deg < 202.5) return 'left';
    if (deg >= 202.5 && deg < 247.5) return 'up-left';
    if (deg >= 247.5 && deg < 292.5) return 'up';
    if (deg >= 292.5 && deg < 337.5) return 'up-right';

    return 'right';
  }
};

export default Input;
