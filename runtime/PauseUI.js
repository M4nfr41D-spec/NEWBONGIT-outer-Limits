// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// PAUSEUI.js - Pause Menu System
// ============================================================
// Handles pause overlay, inventory management during pause

import { State } from './State.js';
import { UI } from './UI.js';

export const PauseUI = {
  // Pause state
  isPaused: false,
  activeTab: 'inventory',

  // DOM elements
  overlay: null,
  tabs: {},

  // ============================================================
  // INITIALIZATION
  // ============================================================

  init() {
    this.overlay = document.getElementById('pause-overlay');
    this.setupEventListeners();

    console.log('[PauseUI] Initialized');
  },

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.pause-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.unpause());
    }

    // Quit button
    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => this.quitToHub());
    }
  },

  // ============================================================
  // PAUSE CONTROL
  // ============================================================

  toggle() {
    if (this.isPaused) {
      this.unpause();
    } else {
      this.pause();
    }
  },

  pause() {
    if (!State.run.active) return;
    if (this.isPaused) return;

    this.isPaused = true;
    State.ui.paused = true;

    // Show overlay
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.overlay.classList.add('visible');
    }

    // Refresh UI content
    this.refreshContent();

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('menu_open');
    }

    console.log('[PauseUI] Game paused');
  },

  unpause() {
    if (!this.isPaused) return;

    this.isPaused = false;
    State.ui.paused = false;

    // Hide overlay
    if (this.overlay) {
      this.overlay.classList.remove('visible');
      setTimeout(() => {
        if (!this.isPaused) {
          this.overlay.style.display = 'none';
        }
      }, 300);
    }

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('menu_close');
    }

    console.log('[PauseUI] Game resumed');
  },

  quitToHub() {
    this.unpause();

    // End run
    if (State.modules?.SceneManager) {
      State.modules.SceneManager.endRun('quit');
    }
  },

  // ============================================================
  // TAB MANAGEMENT
  // ============================================================

  switchTab(tabName) {
    this.activeTab = tabName;
    State.ui.pauseTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.pause-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.pause-content').forEach(content => {
      content.classList.toggle('active', content.dataset.content === tabName);
    });

    // Refresh content for this tab
    this.refreshTabContent(tabName);
  },

  refreshContent() {
    this.refreshTabContent(this.activeTab);
  },

  refreshTabContent(tabName) {
    switch (tabName) {
      case 'inventory':
        this.renderInventoryTab();
        break;
      case 'equipment':
        this.renderEquipmentTab();
        break;
      case 'stats':
        this.renderStatsTab();
        break;
      case 'skills':
        this.renderSkillsTab();
        break;
    }
  },

  // ============================================================
  // TAB RENDERERS
  // ============================================================

  renderInventoryTab() {
    const container = document.querySelector('[data-content="inventory"] .tab-body');
    if (!container) return;

    // Filter controls
    let html = `
      <div class="inventory-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="weapon">Weapons</button>
        <button class="filter-btn" data-filter="shield">Shields</button>
        <button class="filter-btn" data-filter="engine">Engines</button>
        <button class="filter-btn" data-filter="module">Modules</button>
      </div>
      <div class="inventory-grid">
    `;

    // Render stash items
    const filter = State.ui.filterSlot || 'all';
    for (const item of State.meta.stash) {
      if (filter !== 'all' && item.slot !== filter) continue;

      const rarityColor = UI.getRarityColor(item.rarity);
      html += `
        <div class="inventory-item" data-item-id="${item.id}" style="border-color: ${rarityColor}">
          <div class="item-icon">⬡</div>
          <div class="item-name">${item.name}</div>
          <div class="item-rarity" style="color: ${rarityColor}">${item.rarity}</div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Setup filter buttons
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        State.ui.filterSlot = e.currentTarget.dataset.filter;
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderInventoryTab();
      });
    });

    // Setup item clicks
    container.querySelectorAll('.inventory-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const itemId = item.dataset.itemId;
        const itemData = State.meta.stash.find(i => i.id === itemId);
        if (itemData) {
          UI.showTooltip(itemData, e.clientX, e.clientY, false);
        }
      });
    });
  },

  renderEquipmentTab() {
    const container = document.querySelector('[data-content="equipment"] .tab-body');
    if (!container) return;

    const slots = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'module', 'drone'];

    let html = '<div class="equipment-grid">';

    for (const slot of slots) {
      const item = State.meta.equipment[slot];
      const rarityColor = item ? UI.getRarityColor(item.rarity) : '#3a5570';

      html += `
        <div class="equipment-slot-large" data-slot="${slot}" style="border-color: ${rarityColor}">
          <div class="slot-label">${slot.toUpperCase()}</div>
          ${item ? `
            <div class="slot-item">
              <div class="item-icon">⬡</div>
              <div class="item-name">${item.name}</div>
              <div class="item-rarity" style="color: ${rarityColor}">${item.rarity}</div>
            </div>
          ` : `
            <div class="slot-empty">Empty</div>
          `}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Setup slot clicks
    container.querySelectorAll('.equipment-slot-large').forEach(slotEl => {
      slotEl.addEventListener('click', (e) => {
        const slot = slotEl.dataset.slot;
        const item = State.meta.equipment[slot];
        if (item) {
          UI.showTooltip(item, e.clientX, e.clientY, true);
        }
      });
    });
  },

  renderStatsTab() {
    const container = document.querySelector('[data-content="stats"] .tab-body');
    if (!container) return;

    // Ship stats
    let html = `
      <div class="stats-section">
        <h3>Ship Stats</h3>
        <div class="stats-grid">
          <div class="stat-row"><span>Damage</span><span class="stat-value">${Math.round(State.player.damage)}</span></div>
          <div class="stat-row"><span>Fire Rate</span><span class="stat-value">${(1 / State.player.fireRate).toFixed(1)}/s</span></div>
          <div class="stat-row"><span>Crit Chance</span><span class="stat-value">${(State.player.critChance * 100).toFixed(1)}%</span></div>
          <div class="stat-row"><span>Crit Damage</span><span class="stat-value">${(State.player.critDamage * 100).toFixed(0)}%</span></div>
          <div class="stat-row"><span>Max HP</span><span class="stat-value">${State.player.maxHP}</span></div>
          <div class="stat-row"><span>Max Shield</span><span class="stat-value">${State.player.maxShield}</span></div>
          <div class="stat-row"><span>Armor</span><span class="stat-value">${State.player.armor}</span></div>
          <div class="stat-row"><span>Move Speed</span><span class="stat-value">${State.player.moveSpeed}</span></div>
          <div class="stat-row"><span>Dodge Chance</span><span class="stat-value">${(State.player.dodgeChance * 100).toFixed(1)}%</span></div>
        </div>
      </div>
    `;

    // Pilot stats
    html += `
      <div class="stats-section">
        <h3>Pilot Stats <span class="points-badge">${State.meta.statPoints} points</span></h3>
        <div class="pilot-stats">
    `;

    const pilotStats = [
      { id: 'strength', name: 'Strength', desc: '+0.5% damage per point' },
      { id: 'dexterity', name: 'Dexterity', desc: '+0.3% attack speed, +0.2% crit' },
      { id: 'intelligence', name: 'Intelligence', desc: '+1% cooldown reduction' },
      { id: 'vitality', name: 'Vitality', desc: '+3 max HP per point' },
      { id: 'energy', name: 'Energy', desc: '+2 max shield per point' }
    ];

    for (const stat of pilotStats) {
      const value = State.meta.pilotStats[stat.id] || 0;
      html += `
        <div class="pilot-stat-row" data-stat="${stat.id}">
          <div class="stat-info">
            <span class="stat-name">${stat.name}</span>
            <span class="stat-desc">${stat.desc}</span>
          </div>
          <div class="stat-controls">
            <button class="stat-btn minus" ${value <= 0 ? 'disabled' : ''}>-</button>
            <span class="stat-value">${value}</span>
            <button class="stat-btn plus" ${State.meta.statPoints <= 0 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    container.innerHTML = html;

    // Setup stat buttons
    container.querySelectorAll('.stat-btn.plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.pilot-stat-row');
        const stat = row.dataset.stat;
        UI.onAllocateStat(stat);
        this.renderStatsTab();
      });
    });

    container.querySelectorAll('.stat-btn.minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.pilot-stat-row');
        const stat = row.dataset.stat;
        UI.onDeallocateStat(stat);
        this.renderStatsTab();
      });
    });
  },

  renderSkillsTab() {
    const container = document.querySelector('[data-content="skills"] .tab-body');
    if (!container) return;

    let html = `
      <div class="skills-header">
        <h3>Skill Trees</h3>
        <span class="points-badge">${State.meta.skillPoints} skill points</span>
      </div>
      <div class="skill-trees">
    `;

    // Placeholder skill trees
    const trees = [
      { id: 'offense', name: 'Offense', color: '#ff4444' },
      { id: 'defense', name: 'Defense', color: '#4488ff' },
      { id: 'utility', name: 'Utility', color: '#44ff88' }
    ];

    for (const tree of trees) {
      html += `
        <div class="skill-tree" data-tree="${tree.id}">
          <div class="tree-header" style="background: linear-gradient(to right, ${tree.color}33, transparent)">
            <span class="tree-name">${tree.name}</span>
          </div>
          <div class="tree-nodes">
            <div class="skill-node locked">
              <div class="node-icon">?</div>
              <div class="node-name">Coming Soon</div>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    html += '<p class="skills-note">Skill trees will be fully implemented in a future update.</p>';

    container.innerHTML = html;
  },

  // ============================================================
  // RUN STATS DISPLAY
  // ============================================================

  renderRunStats() {
    const container = document.querySelector('.run-stats');
    if (!container) return;

    container.innerHTML = `
      <div class="run-stat">
        <span class="label">Zone</span>
        <span class="value">${State.run.currentZone + 1}</span>
      </div>
      <div class="run-stat">
        <span class="label">Kills</span>
        <span class="value">${State.run.stats.kills}</span>
      </div>
      <div class="run-stat">
        <span class="label">Scrap</span>
        <span class="value">${State.run.scrapEarned}$</span>
      </div>
      <div class="run-stat">
        <span class="label">Time</span>
        <span class="value">${this.formatTime(State.run.stats.timeElapsed)}</span>
      </div>
    `;
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

export default PauseUI;
