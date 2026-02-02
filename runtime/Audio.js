// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// AUDIO.js - Web Audio API Sound System
// ============================================================
// Handles music and sound effects with proper volume control

import { State } from './State.js';
import { Assets } from './AssetLoader.js';

export const Audio = {
  // Audio context (created on user interaction)
  context: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,

  // Current music
  currentMusic: null,
  currentMusicKey: null,
  musicFadeInterval: null,

  // SFX pool for overlapping sounds
  sfxPool: {},
  poolSize: 5,

  // State
  initialized: false,
  muted: false,

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize audio system
   * Must be called after user interaction (click/key)
   */
  init() {
    if (this.initialized) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();

      // Create gain nodes
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      this.musicGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = State.meta.settings.musicVolume;

      this.sfxGain = this.context.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = State.meta.settings.sfxVolume;

      // Resume context if suspended
      if (this.context.state === 'suspended') {
        document.addEventListener('click', () => this.context.resume(), { once: true });
        document.addEventListener('keydown', () => this.context.resume(), { once: true });
      }

      this.initialized = true;
      console.log('[Audio] Initialized');
    } catch (error) {
      console.warn('[Audio] Web Audio API not supported:', error);
    }
  },

  // ============================================================
  // MUSIC
  // ============================================================

  /**
   * Play background music
   * @param {string} key - Music key (without 'music_' prefix)
   * @param {boolean} loop - Loop the music
   * @param {number} fadeIn - Fade in duration in seconds
   */
  playMusic(key, loop = true, fadeIn = 0.5) {
    const fullKey = 'music_' + key;

    // Don't restart same music
    if (this.currentMusicKey === fullKey && this.currentMusic) {
      return;
    }

    // Fade out current music
    if (this.currentMusic) {
      this.fadeOutMusic(0.3);
    }

    // Get audio element
    const audio = Assets.getAudio(fullKey);
    if (!audio) {
      console.warn(`[Audio] Music not found: ${fullKey}`);
      return;
    }

    // Clone for independent playback
    const music = audio.cloneNode();
    music.loop = loop;
    music.volume = 0;

    // Connect to music gain (if using Web Audio)
    // For simple implementation, use volume directly
    music.play().catch(e => {
      console.warn('[Audio] Music autoplay blocked:', e);
    });

    // Fade in
    const targetVolume = State.meta.settings.musicVolume;
    const steps = fadeIn * 60; // 60fps
    let step = 0;

    const fadeInterval = setInterval(() => {
      step++;
      music.volume = Math.min(targetVolume, (step / steps) * targetVolume);
      if (step >= steps) {
        clearInterval(fadeInterval);
      }
    }, 1000 / 60);

    this.currentMusic = music;
    this.currentMusicKey = fullKey;

    // Handle track end
    music.addEventListener('ended', () => {
      if (!loop && this.currentMusic === music) {
        this.currentMusic = null;
        this.currentMusicKey = null;
      }
    });
  },

  /**
   * Fade out current music
   * @param {number} duration - Fade duration in seconds
   */
  fadeOutMusic(duration = 0.5) {
    if (!this.currentMusic) return;

    const music = this.currentMusic;
    const startVolume = music.volume;
    const steps = duration * 60;
    let step = 0;

    clearInterval(this.musicFadeInterval);
    this.musicFadeInterval = setInterval(() => {
      step++;
      music.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step >= steps) {
        clearInterval(this.musicFadeInterval);
        music.pause();
        music.currentTime = 0;
      }
    }, 1000 / 60);

    this.currentMusic = null;
    this.currentMusicKey = null;
  },

  /**
   * Stop music immediately
   */
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
  },

  /**
   * Pause music
   */
  pauseMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
    }
  },

  /**
   * Resume music
   */
  resumeMusic() {
    if (this.currentMusic) {
      this.currentMusic.play().catch(() => {});
    }
  },

  // ============================================================
  // SOUND EFFECTS
  // ============================================================

  /**
   * Play sound effect
   * @param {string} key - SFX key
   * @param {number} volume - Volume multiplier (0-1)
   * @param {number} pitch - Pitch multiplier (0.5-2)
   * @param {boolean} randomize - Add slight random variation
   */
  playSFX(key, volume = 1, pitch = 1, randomize = true) {
    if (this.muted) return;

    const audio = Assets.getAudio(key);
    if (!audio) {
      // Try with number suffix
      const audio1 = Assets.getAudio(key + '_1');
      if (audio1) {
        this.playSFXVariant(key, volume, pitch);
        return;
      }
      return;
    }

    // Clone for overlapping sounds
    const sound = audio.cloneNode();

    // Apply settings
    const baseVolume = State.meta.settings.sfxVolume;
    sound.volume = Math.min(1, baseVolume * volume);

    // Pitch variation
    if (randomize) {
      sound.playbackRate = pitch + (Math.random() - 0.5) * 0.1;
    } else {
      sound.playbackRate = pitch;
    }

    // Play
    sound.play().catch(() => {});

    // Clean up after playing
    sound.addEventListener('ended', () => {
      sound.remove?.();
    });
  },

  /**
   * Play random variant of SFX (for sounds with _1, _2, _3 suffixes)
   * @param {string} baseKey - Base key without number
   * @param {number} volume - Volume multiplier
   * @param {number} pitch - Pitch multiplier
   */
  playSFXVariant(baseKey, volume = 1, pitch = 1) {
    // Find available variants
    const variants = [];
    for (let i = 1; i <= 5; i++) {
      if (Assets.hasAudio(`${baseKey}_${i}`)) {
        variants.push(`${baseKey}_${i}`);
      }
    }

    if (variants.length === 0) {
      // Try without suffix
      if (Assets.hasAudio(baseKey)) {
        this.playSFX(baseKey, volume, pitch);
      }
      return;
    }

    // Pick random variant
    const key = variants[Math.floor(Math.random() * variants.length)];
    this.playSFX(key, volume, pitch, true);
  },

  /**
   * Play positional sound (louder when closer)
   * @param {string} key - SFX key
   * @param {number} x - Sound world X
   * @param {number} y - Sound world Y
   * @param {number} maxDistance - Max hearing distance
   */
  playSFXPositional(key, x, y, maxDistance = 500) {
    // Calculate distance from player
    const dx = x - State.player.x;
    const dy = y - State.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) return;

    // Volume falloff
    const volume = Math.max(0, 1 - distance / maxDistance);

    // Slight pan based on position (simplified)
    const pan = Math.max(-1, Math.min(1, dx / maxDistance));

    this.playSFX(key, volume, 1 + pan * 0.05);
  },

  // ============================================================
  // VOLUME CONTROL
  // ============================================================

  /**
   * Set music volume
   * @param {number} volume - Volume (0-1)
   */
  setMusicVolume(volume) {
    State.meta.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = State.meta.settings.musicVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = State.meta.settings.musicVolume;
    }
  },

  /**
   * Set SFX volume
   * @param {number} volume - Volume (0-1)
   */
  setSFXVolume(volume) {
    State.meta.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = State.meta.settings.sfxVolume;
    }
  },

  /**
   * Mute/unmute all audio
   * @param {boolean} mute - Mute state
   */
  setMute(mute) {
    this.muted = mute;
    if (this.masterGain) {
      this.masterGain.gain.value = mute ? 0 : 1;
    }
    if (this.currentMusic) {
      this.currentMusic.muted = mute;
    }
  },

  /**
   * Toggle mute
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.setMute(!this.muted);
    return this.muted;
  },

  // ============================================================
  // SPECIAL EFFECTS
  // ============================================================

  /**
   * Play UI sound
   * @param {string} type - UI sound type (click, hover, error, success, equip, unequip)
   */
  playUI(type) {
    this.playSFX(`ui_${type}`, 0.5, 1, false);
  },

  /**
   * Play pickup sound based on type/rarity
   * @param {string} type - Pickup type (item, health, cell, scrap)
   * @param {string} rarity - Item rarity (for items)
   */
  playPickup(type, rarity = 'common') {
    if (type === 'item') {
      if (rarity === 'legendary' || rarity === 'mythic') {
        this.playSFX('pickup_legendary', 1, 1, false);
      } else if (rarity === 'rare' || rarity === 'epic') {
        this.playSFX('pickup_rare', 0.8, 1, false);
      } else {
        this.playSFX('pickup_item', 0.6, 1);
      }
    } else {
      this.playSFXVariant(`pickup_${type}`, 0.5);
    }
  },

  /**
   * Play combat impact sound
   * @param {string} type - Impact type (player_hit, enemy_hit, enemy_death, shield_hit)
   */
  playCombat(type) {
    switch (type) {
      case 'player_hit':
        this.playSFX('player_hit', 0.8);
        break;
      case 'player_death':
        this.playSFX('player_death', 1);
        break;
      case 'player_shoot':
        this.playSFXVariant('player_shoot', 0.4);
        break;
      case 'enemy_hit':
        this.playSFXVariant('enemy_hit', 0.5);
        break;
      case 'enemy_death':
        this.playSFXVariant('enemy_death', 0.6);
        break;
      case 'enemy_shoot':
        this.playSFXVariant('enemy_shoot', 0.3);
        break;
      case 'shield_hit':
        this.playSFX('shield_hit', 0.6);
        break;
      case 'shield_break':
        this.playSFX('shield_break', 0.8);
        break;
    }
  },

  /**
   * Play announcement sound
   * @param {string} type - Announcement type (level_up, boss_spawn, achievement, zone)
   */
  playAnnouncement(type) {
    switch (type) {
      case 'level_up':
        this.playSFX('level_up', 0.8);
        break;
      case 'boss':
        this.playSFX('boss_spawn', 1);
        break;
      case 'elite':
        this.playSFX('elite_spawn', 0.7);
        break;
      case 'achievement':
        this.playSFX('achievement', 0.8);
        break;
      case 'zone':
        this.playSFX('zone_transition', 0.6);
        break;
      case 'skill':
        this.playSFX('skill_unlock', 0.8);
        break;
    }
  }
};

export default Audio;
