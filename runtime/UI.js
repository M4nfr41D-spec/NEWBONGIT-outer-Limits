// Copyright (c) Manfred Foissner. All rights reserved.
// License: See LICENSE.txt in the project root.

// ============================================================
// UI.js - DOM User Interface Management
// ============================================================
// Handles all HTML UI updates, tooltips, modals, and interactions

import { State, getTotalScrap, getEquipped, getAllEquipped, isEquipped, isStashFull } from './State.js';

export const UI = {
  // DOM element cache
  elements: {},

  // Tooltip state
  tooltipItem: null,
  tooltipVisible: false,

  // ============================================================
  // INITIALIZATION
  // ============================================================

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.renderAll();

    console.log('[UI] Initialized');
  },

  cacheElements() {
    // Top bar
    this.elements.cellsDisplay = document.getElementById('cells-display');
    this.elements.scrapDisplay = document.getElementById('scrap-display');
    this.elements.zoneDisplay = document.getElementById('zone-display');
    this.elements.levelBadge = document.getElementById('level-badge');
    this.elements.xpBar = document.getElementById('xp-bar');
    this.elements.xpText = document.getElementById('xp-text');

    // Combat HUD
    this.elements.hpBar = document.getElementById('hp-bar');
    this.elements.hpText = document.getElementById('hp-text');
    this.elements.shieldBar = document.getElementById('shield-bar');
    this.elements.shieldText = document.getElementById('shield-text');

    // Left panel
    this.elements.equipmentPanel = document.getElementById('equipment-panel');
    this.elements.stashGrid = document.getElementById('stash-grid');

    // Right panel
    this.elements.shipStats = document.getElementById('ship-stats');
    this.elements.pilotStats = document.getElementById('pilot-stats');
    this.elements.statPointsBadge = document.getElementById('stat-points-badge');

    // Modals
    this.elements.hubModal = document.getElementById('hub-modal');
    this.elements.deathModal = document.getElementById('death-modal');
    this.elements.startModal = document.getElementById('start-modal');
    this.elements.vendorModal = document.getElementById('vendor-modal');

    // Tooltip
    this.elements.tooltip = document.getElementById('tooltip');
  },

  setupEventListeners() {
    // Hub modal buttons
    document.querySelectorAll('.act-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = e.currentTarget.dataset.act;
        if (actId && State.meta.actsUnlocked[actId]) {
          this.onActSelect(actId);
        }
      });
    });

    // Start run button
    const startBtn = document.getElementById('start-run-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.onStartRun());
    }

    // Return to hub button
    const hubBtn = document.getElementById('return-hub-btn');
    if (hubBtn) {
      hubBtn.addEventListener('click', () => this.onReturnToHub());
    }

    // Try again button
    const retryBtn = document.getElementById('try-again-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.onTryAgain());
    }

    // Stat allocation buttons
    document.querySelectorAll('.stat-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.currentTarget.dataset.stat;
        this.onAllocateStat(stat);
      });
    });

    document.querySelectorAll('.stat-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.currentTarget.dataset.stat;
        this.onDeallocateStat(stat);
      });
    });

    // Hide tooltip on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.stash-item') && !e.target.closest('.equipment-slot')) {
        this.hideTooltip();
      }
    });
  },

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  renderAll() {
    this.renderTopBar();
    this.renderEquipment();
    this.renderStash();
    this.renderStats();
    this.renderPilotStats();
  },

  renderTopBar() {
    // Cells
    if (this.elements.cellsDisplay) {
      this.elements.cellsDisplay.textContent = State.run.cells || 0;
    }

    // Scrap
    if (this.elements.scrapDisplay) {
      this.elements.scrapDisplay.textContent = getTotalScrap();
    }

    // Level
    if (this.elements.levelBadge) {
      this.elements.levelBadge.textContent = State.meta.level;
    }

    // XP Bar
    this.renderXPBar();
  },

  renderXPBar() {
    const Leveling = State.modules?.Leveling;
    if (!Leveling || !this.elements.xpBar) return;

    const progress = Leveling.getProgress();
    const needed = Leveling.getXpToNextLevel();

    this.elements.xpBar.style.width = `${progress * 100}%`;

    if (this.elements.xpText) {
      this.elements.xpText.textContent = `${Math.floor(progress * 100)}%`;
    }
  },

  renderCombatHUD() {
    // HP Bar
    if (this.elements.hpBar) {
      const hpPercent = (State.player.hp / State.player.maxHP) * 100;
      this.elements.hpBar.style.width = `${Math.max(0, hpPercent)}%`;

      // Low HP warning
      if (hpPercent < 30) {
        this.elements.hpBar.classList.add('low-hp');
      } else {
        this.elements.hpBar.classList.remove('low-hp');
      }
    }

    if (this.elements.hpText) {
      this.elements.hpText.textContent = `${Math.ceil(State.player.hp)} / ${State.player.maxHP}`;
    }

    // Shield Bar
    if (this.elements.shieldBar) {
      const shieldPercent = State.player.maxShield > 0
        ? (State.player.shield / State.player.maxShield) * 100
        : 0;
      this.elements.shieldBar.style.width = `${Math.max(0, shieldPercent)}%`;
    }

    if (this.elements.shieldText) {
      this.elements.shieldText.textContent = `${Math.ceil(State.player.shield)} / ${State.player.maxShield}`;
    }
  },

  renderZone(zone) {
    if (!this.elements.zoneDisplay) return;

    if (zone?.isBossZone) {
      this.elements.zoneDisplay.textContent = '[!] BOSS';
      this.elements.zoneDisplay.classList.add('boss-zone');
    } else {
      this.elements.zoneDisplay.textContent = `ZONE ${(zone?.zoneIndex || 0) + 1}`;
      this.elements.zoneDisplay.classList.remove('boss-zone');
    }
  },

  // ============================================================
  // EQUIPMENT RENDERING
  // ============================================================

  renderEquipment() {
    if (!this.elements.equipmentPanel) return;

    const slots = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'module', 'drone'];

    slots.forEach(slot => {
      const slotEl = this.elements.equipmentPanel.querySelector(`[data-slot="${slot}"]`);
      if (!slotEl) return;

      const item = getEquipped(slot);
      const itemDisplay = slotEl.querySelector('.item-display') || slotEl;

      if (item) {
        itemDisplay.innerHTML = `
          <div class="equipped-item" style="border-color: ${this.getRarityColor(item.rarity)}">
            <span class="item-icon">⬡</span>
            <span class="item-name">${item.name}</span>
          </div>
        `;
        itemDisplay.classList.add('has-item');

        // Click to show tooltip
        itemDisplay.onclick = (e) => {
          e.stopPropagation();
          this.showTooltip(item, e.clientX, e.clientY, true);
        };
      } else {
        itemDisplay.innerHTML = `<span class="empty-slot">${slot.toUpperCase()}</span>`;
        itemDisplay.classList.remove('has-item');
        itemDisplay.onclick = null;
      }
    });
  },

  // ============================================================
  // STASH RENDERING
  // ============================================================

  renderStash() {
    if (!this.elements.stashGrid) return;

    this.elements.stashGrid.innerHTML = '';

    for (const item of State.meta.stash) {
      // Skip if item is equipped (shouldn't be in stash, but safety check)
      if (isEquipped(item.id)) continue;

      const itemEl = document.createElement('div');
      itemEl.className = 'stash-item';
      itemEl.style.borderColor = this.getRarityColor(item.rarity);
      itemEl.dataset.itemId = item.id;

      itemEl.innerHTML = `
        <span class="item-icon">⬡</span>
        <span class="item-rarity-dot" style="background: ${this.getRarityColor(item.rarity)}"></span>
      `;

      // Click handlers
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showTooltip(item, e.clientX, e.clientY, false);
      });

      itemEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.onEquipItem(item);
      });

      this.elements.stashGrid.appendChild(itemEl);
    }
  },

  // ============================================================
  // STATS RENDERING
  // ============================================================

  renderStats() {
    if (!this.elements.shipStats) return;

    const stats = [
      { label: 'Damage', value: Math.round(State.player.damage), color: '#ff4444' },
      { label: 'Fire Rate', value: `${(1 / State.player.fireRate).toFixed(1)}/s`, color: '#ffaa00' },
      { label: 'Crit Chance', value: `${(State.player.critChance * 100).toFixed(1)}%`, color: '#ffff00' },
      { label: 'Crit Damage', value: `${(State.player.critDamage * 100).toFixed(0)}%`, color: '#ff8800' },
      { label: 'Max HP', value: State.player.maxHP, color: '#44ff44' },
      { label: 'Max Shield', value: State.player.maxShield, color: '#4488ff' },
      { label: 'Armor', value: State.player.armor, color: '#888888' },
      { label: 'Move Speed', value: State.player.moveSpeed, color: '#00ffff' }
    ];

    this.elements.shipStats.innerHTML = stats.map(s => `
      <div class="stat-row">
        <span class="stat-label">${s.label}</span>
        <span class="stat-value" style="color: ${s.color}">${s.value}</span>
      </div>
    `).join('');
  },

  renderPilotStats() {
    if (!this.elements.pilotStats) return;

    const pilotStats = State.meta.pilotStats;
    const statNames = ['strength', 'dexterity', 'intelligence', 'vitality', 'energy'];

    for (const stat of statNames) {
      const row = this.elements.pilotStats.querySelector(`[data-stat="${stat}"]`);
      if (row) {
        const valueEl = row.querySelector('.stat-value');
        if (valueEl) {
          valueEl.textContent = pilotStats[stat] || 0;
        }
      }
    }

    // Update stat points badge
    if (this.elements.statPointsBadge) {
      this.elements.statPointsBadge.textContent = State.meta.statPoints;
      this.elements.statPointsBadge.style.display = State.meta.statPoints > 0 ? 'block' : 'none';
    }
  },

  // ============================================================
  // TOOLTIP
  // ============================================================

  showTooltip(item, x, y, isEquipped = false) {
    if (!this.elements.tooltip) return;

    this.tooltipItem = item;
    this.tooltipVisible = true;

    const rarityColor = this.getRarityColor(item.rarity);

    let html = `
      <div class="tooltip-header" style="border-bottom-color: ${rarityColor}">
        <span class="tooltip-icon">⬡</span>
        <span class="tooltip-name" style="color: ${rarityColor}">${item.name}</span>
      </div>
      <div class="tooltip-type">${item.slot.toUpperCase()} - ${item.rarity.toUpperCase()}</div>
      <div class="tooltip-ilvl">Item Level: ${item.ilvl || 1}</div>
      <div class="tooltip-stats">
    `;

    // Base stats
    if (item.stats) {
      for (const [stat, value] of Object.entries(item.stats)) {
        const formatted = this.formatStatValue(stat, value);
        html += `<div class="tooltip-stat">${formatted.label}: <span style="color: #00ff88">${formatted.value}</span></div>`;
      }
    }

    // Affixes
    if (item.affixes && item.affixes.length > 0) {
      html += '<div class="tooltip-affixes">';
      for (const affix of item.affixes) {
        const formatted = this.formatStatValue(affix.stat, affix.value);
        html += `<div class="tooltip-affix" style="color: #aa88ff">${affix.name}: ${formatted.value}</div>`;
      }
      html += '</div>';
    }

    html += '</div>';

    // Actions
    html += '<div class="tooltip-actions">';
    if (isEquipped) {
      html += `<button class="tooltip-btn unequip-btn" onclick="window.Game?.UI?.onUnequipItem('${item.id}')">Unequip</button>`;
    } else {
      html += `<button class="tooltip-btn equip-btn" onclick="window.Game?.UI?.onEquipItem(window.Game?.UI?.tooltipItem)">Equip</button>`;
      html += `<button class="tooltip-btn sell-btn" onclick="window.Game?.UI?.onSellItem('${item.id}')">Sell (${item.sellValue || 10}$)</button>`;
    }
    html += '</div>';

    this.elements.tooltip.innerHTML = html;
    this.elements.tooltip.style.display = 'block';

    // Position tooltip
    const rect = this.elements.tooltip.getBoundingClientRect();
    let posX = x + 15;
    let posY = y + 15;

    // Keep on screen
    if (posX + rect.width > window.innerWidth) {
      posX = x - rect.width - 15;
    }
    if (posY + rect.height > window.innerHeight) {
      posY = y - rect.height - 15;
    }

    this.elements.tooltip.style.left = `${posX}px`;
    this.elements.tooltip.style.top = `${posY}px`;
  },

  hideTooltip() {
    if (this.elements.tooltip) {
      this.elements.tooltip.style.display = 'none';
    }
    this.tooltipVisible = false;
    this.tooltipItem = null;
  },

  formatStatValue(stat, value) {
    const labels = {
      damage: 'Damage',
      fireRate: 'Fire Rate',
      critChance: 'Crit Chance',
      critDamage: 'Crit Damage',
      shield: 'Shield',
      shieldRegen: 'Shield Regen',
      maxHP: 'Max HP',
      armor: 'Armor',
      moveSpeed: 'Move Speed',
      dodgeChance: 'Dodge Chance',
      attackSpeed: 'Attack Speed',
      scrapBonus: 'Scrap Bonus',
      xpBonus: 'XP Bonus',
      pickupRadius: 'Pickup Radius'
    };

    const isPercent = ['critChance', 'critDamage', 'dodgeChance', 'attackSpeed', 'scrapBonus', 'xpBonus'].includes(stat);

    return {
      label: labels[stat] || stat,
      value: isPercent ? `${(value * 100).toFixed(1)}%` : value
    };
  },

  getRarityColor(rarity) {
    const colors = {
      common: '#8899aa',
      uncommon: '#22dd55',
      rare: '#2288ff',
      epic: '#aa44ff',
      legendary: '#ff8800',
      mythic: '#ff4488'
    };
    return colors[rarity] || colors.common;
  },

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  onActSelect(actId) {
    console.log(`[UI] Act selected: ${actId}`);
    State.run.selectedAct = actId;

    // Update UI to show selected
    document.querySelectorAll('.act-button').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.act === actId);
    });
  },

  onStartRun() {
    const actId = State.run.selectedAct || 'act1';
    console.log(`[UI] Starting run in ${actId}`);

    // Hide hub modal
    if (this.elements.hubModal) {
      this.elements.hubModal.style.display = 'none';
    }
    if (this.elements.startModal) {
      this.elements.startModal.style.display = 'none';
    }

    // Start game
    if (State.modules?.SceneManager) {
      State.modules.SceneManager.startRun(actId);
    } else if (window.Game?.start) {
      window.Game.start(actId);
    }
  },

  onReturnToHub() {
    console.log('[UI] Returning to hub');

    // Hide death modal
    if (this.elements.deathModal) {
      this.elements.deathModal.style.display = 'none';
    }

    // Return to hub
    if (State.modules?.SceneManager) {
      State.modules.SceneManager.returnToHub();
    }
  },

  onTryAgain() {
    const actId = State.run.currentAct || 'act1';
    console.log(`[UI] Trying again in ${actId}`);

    // Hide death modal
    if (this.elements.deathModal) {
      this.elements.deathModal.style.display = 'none';
    }

    // Start new run
    if (State.modules?.SceneManager) {
      State.modules.SceneManager.startRun(actId);
    }
  },

  onEquipItem(item) {
    if (!item) return;

    console.log(`[UI] Equipping item: ${item.name}`);

    // Check if slot already has item
    const currentEquipped = getEquipped(item.slot);
    if (currentEquipped) {
      // Move current item back to stash
      State.meta.stash.push(currentEquipped);
    }

    // Remove from stash
    const stashIndex = State.meta.stash.findIndex(i => i.id === item.id);
    if (stashIndex >= 0) {
      State.meta.stash.splice(stashIndex, 1);
    }

    // Equip
    State.meta.equipment[item.slot] = item;

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    this.hideTooltip();
    this.renderEquipment();
    this.renderStash();
    this.renderStats();

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('ui_equip');
    }
  },

  onUnequipItem(itemId) {
    console.log(`[UI] Unequipping item: ${itemId}`);

    // Find equipped item
    for (const [slot, item] of Object.entries(State.meta.equipment)) {
      if (item && item.id === itemId) {
        // Check stash space
        if (isStashFull()) {
          console.warn('[UI] Stash is full!');
          return;
        }

        // Move to stash
        State.meta.stash.push(item);
        State.meta.equipment[slot] = null;

        // Recalculate stats
        if (State.modules?.Stats) {
          State.modules.Stats.calculate();
        }

        // Save
        if (State.modules?.Save) {
          State.modules.Save.save();
        }

        // Update UI
        this.hideTooltip();
        this.renderEquipment();
        this.renderStash();
        this.renderStats();

        // Play sound
        if (State.modules?.Audio) {
          State.modules.Audio.playSFX('ui_unequip');
        }

        break;
      }
    }
  },

  onSellItem(itemId) {
    console.log(`[UI] Selling item: ${itemId}`);

    // Find item in stash
    const index = State.meta.stash.findIndex(i => i.id === itemId);
    if (index < 0) return;

    const item = State.meta.stash[index];
    const sellValue = item.sellValue || 10;

    // Remove from stash
    State.meta.stash.splice(index, 1);

    // Add scrap
    State.meta.scrap += sellValue;

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    this.hideTooltip();
    this.renderStash();
    this.renderTopBar();

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('ui_click');
    }
  },

  onAllocateStat(stat) {
    if (State.meta.statPoints <= 0) return;
    if (!State.meta.pilotStats.hasOwnProperty(stat)) return;

    State.meta.pilotStats[stat]++;
    State.meta.statPoints--;

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    this.renderPilotStats();
    this.renderStats();

    // Play sound
    if (State.modules?.Audio) {
      State.modules.Audio.playSFX('ui_click');
    }
  },

  onDeallocateStat(stat) {
    if (!State.meta.pilotStats.hasOwnProperty(stat)) return;
    if (State.meta.pilotStats[stat] <= 0) return;

    State.meta.pilotStats[stat]--;
    State.meta.statPoints++;

    // Recalculate stats
    if (State.modules?.Stats) {
      State.modules.Stats.calculate();
    }

    // Save
    if (State.modules?.Save) {
      State.modules.Save.save();
    }

    // Update UI
    this.renderPilotStats();
    this.renderStats();
  },

  // ============================================================
  // MODALS
  // ============================================================

  showHubModal() {
    if (this.elements.hubModal) {
      this.elements.hubModal.style.display = 'flex';
    }
  },

  hideHubModal() {
    if (this.elements.hubModal) {
      this.elements.hubModal.style.display = 'none';
    }
  },

  showDeathModal(stats) {
    if (this.elements.deathModal) {
      // Update stats display
      const statsEl = this.elements.deathModal.querySelector('.death-stats');
      if (statsEl && stats) {
        statsEl.innerHTML = `
          <div>Zone Reached: ${stats.zone + 1}</div>
          <div>Kills: ${stats.kills}</div>
          <div>Damage Dealt: ${stats.damageDealt}</div>
          <div>Time: ${Math.floor(stats.time / 60)}:${String(Math.floor(stats.time % 60)).padStart(2, '0')}</div>
          <div>Scrap Earned: ${stats.scrap}$</div>
          <div>XP Earned: ${stats.xp}</div>
        `;
      }

      this.elements.deathModal.style.display = 'flex';
    }
  },

  hideDeathModal() {
    if (this.elements.deathModal) {
      this.elements.deathModal.style.display = 'none';
    }
  },

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  showAnnouncement(text, type = 'default') {
    const el = document.getElementById('announcement');
    if (!el) return;

    el.textContent = text;
    el.className = `announcement ${type}`;
    el.style.opacity = '1';

    // Fade out after 2 seconds
    setTimeout(() => {
      el.style.opacity = '0';
    }, 2000);
  }
};

export default UI;
