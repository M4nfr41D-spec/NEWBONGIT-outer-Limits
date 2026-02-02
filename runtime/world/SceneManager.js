// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// SCENEMANAGER.js - Scene Transitions and State
// ============================================================
// Handles scene switching, transitions, and loading screens

import { State, resetRun, resetPlayer } from '../State.js';

export const SceneManager = {
  // Current scene
  current: 'hub',
  previous: null,

  // Transition state
  transitioning: false,
  transitionProgress: 0,
  transitionDuration: 0.6,
  transitionType: 'fade', // 'fade', 'slide', 'none'
  transitionCallback: null,

  // Loading state
  loading: false,
  loadingProgress: 0,
  loadingText: 'Loading...',

  // Scene callbacks
  scenes: {},

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize scene manager
   */
  init() {
    this.current = 'hub';
    this.transitioning = false;
    this.loading = false;

    console.log('[SceneManager] Initialized');
  },

  /**
   * Register scene callbacks
   * @param {string} name - Scene name
   * @param {object} callbacks - { onEnter, onExit, onUpdate, onDraw }
   */
  registerScene(name, callbacks) {
    this.scenes[name] = callbacks;
    console.log(`[SceneManager] Registered scene: ${name}`);
  },

  // ============================================================
  // SCENE TRANSITIONS
  // ============================================================

  /**
   * Change to a new scene
   * @param {string} sceneName - Target scene
   * @param {object} options - Transition options
   */
  changeTo(sceneName, options = {}) {
    if (this.transitioning) {
      console.warn('[SceneManager] Already transitioning');
      return;
    }

    if (sceneName === this.current) {
      console.warn(`[SceneManager] Already in scene: ${sceneName}`);
      return;
    }

    const {
      transition = 'fade',
      duration = 0.6,
      data = {},
      callback = null
    } = options;

    console.log(`[SceneManager] Transitioning: ${this.current} → ${sceneName}`);

    this.transitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionType = transition;
    this.transitionCallback = callback;
    this.transitionTarget = sceneName;
    this.transitionData = data;

    // Start exit phase
    this.transitionPhase = 'exit';
  },

  /**
   * Update transition
   * @param {number} dt - Delta time
   */
  updateTransition(dt) {
    if (!this.transitioning) return;

    this.transitionProgress += dt / (this.transitionDuration / 2);

    if (this.transitionProgress >= 1) {
      if (this.transitionPhase === 'exit') {
        // Midpoint - switch scenes
        this.executeSceneSwitch();
        this.transitionProgress = 0;
        this.transitionPhase = 'enter';
      } else {
        // Complete
        this.transitioning = false;
        this.transitionProgress = 0;

        if (this.transitionCallback) {
          this.transitionCallback();
          this.transitionCallback = null;
        }
      }
    }
  },

  /**
   * Execute the actual scene switch
   */
  executeSceneSwitch() {
    // Exit current scene
    if (this.scenes[this.current]?.onExit) {
      this.scenes[this.current].onExit();
    }

    // Switch
    this.previous = this.current;
    this.current = this.transitionTarget;

    // Enter new scene
    if (this.scenes[this.current]?.onEnter) {
      this.scenes[this.current].onEnter(this.transitionData);
    }

    console.log(`[SceneManager] Now in scene: ${this.current}`);
  },

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  /**
   * Show loading screen
   * @param {string} text - Loading text
   */
  showLoading(text = 'Loading...') {
    this.loading = true;
    this.loadingProgress = 0;
    this.loadingText = text;
  },

  /**
   * Update loading progress
   * @param {number} progress - Progress 0-1
   * @param {string} text - Optional text update
   */
  updateLoading(progress, text = null) {
    this.loadingProgress = Math.min(1, Math.max(0, progress));
    if (text) this.loadingText = text;
  },

  /**
   * Hide loading screen
   */
  hideLoading() {
    this.loading = false;
    this.loadingProgress = 0;
  },

  // ============================================================
  // GAME FLOW
  // ============================================================

  /**
   * Start a new run
   * @param {string} actId - Act to start
   */
  startRun(actId) {
    console.log(`[SceneManager] Starting run in ${actId}`);

    // Reset run state
    resetRun();
    State.run.active = true;
    State.run.currentAct = actId;
    State.run.currentZone = 0;

    // Reset player position
    resetPlayer();

    // Track total runs
    State.meta.totalRuns++;

    // Transition to combat
    this.changeTo('combat', {
      transition: 'fade',
      duration: 0.8,
      data: { actId, zoneIndex: 0 }
    });
  },

  /**
   * Enter next zone
   */
  nextZone() {
    if (!State.run.active) return;

    State.run.currentZone++;
    resetPlayer();

    console.log(`[SceneManager] Entering zone ${State.run.currentZone + 1}`);

    // Brief transition
    this.changeTo('combat', {
      transition: 'fade',
      duration: 0.5,
      data: {
        actId: State.run.currentAct,
        zoneIndex: State.run.currentZone
      }
    });
  },

  /**
   * End run (death or completion)
   * @param {string} reason - 'death' or 'completed'
   */
  endRun(reason) {
    if (!State.run.active) return;

    console.log(`[SceneManager] Run ended: ${reason}`);

    // Finalize run stats
    State.run.active = false;

    // Transfer earnings to meta
    State.meta.scrap += State.run.scrapEarned;

    // Update records
    if (State.run.currentZone > State.meta.highestZone) {
      State.meta.highestZone = State.run.currentZone;
    }

    // Add playtime
    State.meta.totalPlaytime += State.run.stats.timeElapsed;
    State.meta.totalKills += State.run.stats.kills;

    // Show death/victory modal
    if (reason === 'death') {
      this.showDeathScreen();
    } else {
      this.showVictoryScreen();
    }
  },

  showDeathScreen() {
    // Death modal handled by UI module
    State.ui.showDeathModal = true;
  },

  showVictoryScreen() {
    State.ui.showVictoryModal = true;
  },

  /**
   * Return to hub
   */
  returnToHub() {
    State.ui.showDeathModal = false;
    State.ui.showVictoryModal = false;

    this.changeTo('hub', {
      transition: 'fade',
      duration: 0.8
    });
  },

  // ============================================================
  // UPDATE & DRAW
  // ============================================================

  /**
   * Update current scene
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Update transition
    if (this.transitioning) {
      this.updateTransition(dt);
    }

    // Update current scene
    if (!this.loading && this.scenes[this.current]?.onUpdate) {
      this.scenes[this.current].onUpdate(dt);
    }
  },

  /**
   * Draw transition overlay
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawTransition(ctx, width, height) {
    if (!this.transitioning) return;

    let alpha;
    if (this.transitionPhase === 'exit') {
      alpha = this.transitionProgress;
    } else {
      alpha = 1 - this.transitionProgress;
    }

    switch (this.transitionType) {
      case 'fade':
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, width, height);
        break;

      case 'slide':
        const slideX = this.transitionPhase === 'exit'
          ? -width * this.transitionProgress
          : width * (1 - this.transitionProgress);
        ctx.fillStyle = '#000000';
        ctx.fillRect(slideX, 0, width, height);
        break;
    }
  },

  /**
   * Draw loading screen
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawLoading(ctx, width, height) {
    if (!this.loading) return;

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, width, height);

    // Loading text
    ctx.fillStyle = '#00d4ff';
    ctx.font = '24px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.loadingText, width / 2, height / 2 - 30);

    // Progress bar
    const barWidth = 300;
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 10;

    // Background
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(barX, barY, barWidth * this.loadingProgress, barHeight);

    // Border
    ctx.strokeStyle = '#3a5570';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Percentage
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Exo 2';
    ctx.fillText(`${Math.floor(this.loadingProgress * 100)}%`, width / 2, barY + 30);
  },

  // ============================================================
  // GETTERS
  // ============================================================

  isInCombat() {
    return this.current === 'combat';
  },

  isInHub() {
    return this.current === 'hub';
  },

  isTransitioning() {
    return this.transitioning;
  },

  isLoading() {
    return this.loading;
  }
};

export default SceneManager;
