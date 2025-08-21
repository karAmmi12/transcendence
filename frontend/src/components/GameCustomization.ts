import { gameCustomizationService } from '../services/gameCustomizationService.js';
import { GameSettings } from '../types/gameCustomization.js';
import { i18n } from '../services/i18nService.js';

export class GameCustomization {
  private settings: GameSettings;
  private onSettingsChange?: (settings: GameSettings) => void;

  constructor(onSettingsChange?: (settings: GameSettings) => void) {
    this.settings = gameCustomizationService.getSettings();
    this.onSettingsChange = onSettingsChange;
  }

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element);
    this.bindEvents(element);
  }

  private render(element: Element): void {
    element.innerHTML = `
      <div class="game-customization bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">${i18n.t('game.customization.title')}</h2>
          <div class="flex space-x-2">
            <button id="reset-settings" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors">
              ${i18n.t('common.reset')}
            </button>
            <button id="toggle-mode" class="px-4 py-2 rounded transition-colors ${
              this.settings.gameMode === 'classic' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }">
              ${this.settings.gameMode === 'classic' ? i18n.t('game.mode.classic') : i18n.t('game.mode.custom')}
            </button>
          </div>
        </div>

        ${this.settings.gameMode === 'custom' ? this.renderCustomSettings() : this.renderClassicMode()}
      </div>
    `;
  }

  private renderClassicMode(): string {
    return `
      <div class="text-center py-8">
        <div class="text-6xl mb-4">🏓</div>
        <h3 class="text-xl font-semibold text-white mb-2">${i18n.t('game.mode.classic')}</h3>
        <p class="text-gray-400">${i18n.t('game.mode.classicDescription')}</p>
      </div>
    `;
  }

  private renderCustomSettings(): string {
    return `
      <div class="space-y-8">
        <!-- Maps Section -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">${i18n.t('game.customization.maps')}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${gameCustomizationService.getAvailableMaps().map(map => `
              <div class="map-option ${this.settings.selectedMap === map.id ? 'selected' : ''}" data-map="${map.id}">
                <div class="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors">
                  <div class="aspect-video bg-gray-600 rounded mb-2 flex items-center justify-center">
                    <span class="text-2xl">🗺️</span>
                  </div>
                  <h4 class="font-semibold text-white">${map.name}</h4>
                  <p class="text-sm text-gray-400">${map.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Power-ups Section -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">${i18n.t('game.customization.powerups')}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${gameCustomizationService.getAvailablePowerUps().map(powerup => `
              <div class="powerup-option">
                <label class="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input type="checkbox" class="powerup-checkbox mr-3" 
                         data-powerup="${powerup.id}" 
                         ${this.settings.enabledPowerUps.includes(powerup.id) ? 'checked' : ''}>
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span class="text-2xl mr-2">${powerup.icon}</span>
                      <span class="font-semibold text-white">${powerup.name}</span>
                    </div>
                    <p class="text-sm text-gray-400">${powerup.description}</p>
                  </div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Visual Effects -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">${i18n.t('game.customization.visual')}</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Object.entries(this.settings.visualEffects).map(([key, value]) => `
              <label class="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer">
                <input type="checkbox" class="visual-effect mr-3" 
                       data-effect="${key}" ${value ? 'checked' : ''}>
                <span class="text-white">${i18n.t('game.effects.' + key)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Gameplay Settings -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">${i18n.t('game.customization.gameplay')}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-white mb-2">${i18n.t('game.settings.ballSpeed')}</label>
              <input type="range" id="ball-speed" min="2" max="8" step="0.5" 
                     value="${this.settings.gameplay.ballSpeed}" 
                     class="w-full">
              <div class="flex justify-between text-sm text-gray-400">
                <span>${i18n.t('common.slow')}</span>
                <span>${i18n.t('common.fast')}</span>
              </div>
            </div>
            
            <div>
              <label class="block text-white mb-2">${i18n.t('game.settings.paddleSpeed')}</label>
              <input type="range" id="paddle-speed" min="3" max="10" step="0.5" 
                     value="${this.settings.gameplay.paddleSpeed}" 
                     class="w-full">
              <div class="flex justify-between text-sm text-gray-400">
                <span>${i18n.t('common.slow')}</span>
                <span>${i18n.t('common.fast')}</span>
              </div>
            </div>

            <div>
              <label class="block text-white mb-2">${i18n.t('game.settings.scoreLimit')}</label>
              <select id="score-limit" class="w-full p-2 bg-gray-700 text-white rounded">
                <option value="3" ${this.settings.gameplay.scoreLimit === 3 ? 'selected' : ''}>3</option>
                <option value="5" ${this.settings.gameplay.scoreLimit === 5 ? 'selected' : ''}>5</option>
                <option value="7" ${this.settings.gameplay.scoreLimit === 7 ? 'selected' : ''}>7</option>
                <option value="10" ${this.settings.gameplay.scoreLimit === 10 ? 'selected' : ''}>10</option>
              </select>
            </div>

            <div>
              <label class="block text-white mb-2">${i18n.t('game.settings.powerupRate')}</label>
              <input type="range" id="powerup-rate" min="0" max="0.3" step="0.05" 
                     value="${this.settings.gameplay.powerUpSpawnRate}" 
                     class="w-full">
              <div class="flex justify-between text-sm text-gray-400">
                <span>${i18n.t('common.rare')}</span>
                <span>${i18n.t('common.frequent')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(element: Element): void {
    // Toggle game mode
    element.querySelector('#toggle-mode')?.addEventListener('click', () => {
      const newMode = this.settings.gameMode === 'classic' ? 'custom' : 'classic';
      this.updateSettings({ gameMode: newMode });
    });

    // Reset settings
    element.querySelector('#reset-settings')?.addEventListener('click', () => {
      gameCustomizationService.resetToDefault();
      this.settings = gameCustomizationService.getSettings();
      this.render(element);
      this.bindEvents(element);
    });

    // Map selection
    element.querySelectorAll('.map-option').forEach(mapEl => {
      mapEl.addEventListener('click', () => {
        const mapId = mapEl.getAttribute('data-map');
        if (mapId) {
          this.updateSettings({ selectedMap: mapId });
        }
      });
    });

    // Power-up toggles
    element.querySelectorAll('.powerup-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const powerupId = target.getAttribute('data-powerup');
        if (!powerupId) return;

        const enabledPowerUps = [...this.settings.enabledPowerUps];
        if (target.checked) {
          if (!enabledPowerUps.includes(powerupId)) {
            enabledPowerUps.push(powerupId);
          }
        } else {
          const index = enabledPowerUps.indexOf(powerupId);
          if (index > -1) {
            enabledPowerUps.splice(index, 1);
          }
        }
        
        this.updateSettings({ enabledPowerUps });
      });
    });

    // Visual effects
    element.querySelectorAll('.visual-effect').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const effectKey = target.getAttribute('data-effect');
        if (!effectKey) return;

        this.updateSettings({
          visualEffects: {
            ...this.settings.visualEffects,
            [effectKey]: target.checked
          }
        });
      });
    });

    // Gameplay sliders
    ['ball-speed', 'paddle-speed', 'powerup-rate'].forEach(id => {
      const slider = element.querySelector(`#${id}`) as HTMLInputElement;
      slider?.addEventListener('input', () => {
        const key = id.replace('-', '');
        this.updateSettings({
          gameplay: {
            ...this.settings.gameplay,
            [key === 'ballspeed' ? 'ballSpeed' : 
             key === 'paddlespeed' ? 'paddleSpeed' : 'powerUpSpawnRate']: parseFloat(slider.value)
          }
        });
      });
    });

    // Score limit
    const scoreLimit = element.querySelector('#score-limit') as HTMLSelectElement;
    scoreLimit?.addEventListener('change', () => {
      this.updateSettings({
        gameplay: {
          ...this.settings.gameplay,
          scoreLimit: parseInt(scoreLimit.value)
        }
      });
    });
  }

  private updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    gameCustomizationService.saveSettings(newSettings);
    
    if (this.onSettingsChange) {
      this.onSettingsChange(this.settings);
    }
    
    // Re-render pour mettre à jour l'interface
    const element = document.querySelector('.game-customization')?.parentElement;
    if (element) {
      this.render(element);
      this.bindEvents(element);
    }
  }

  getSettings(): GameSettings {
    return this.settings;
  }

  destroy(): void {
    // Cleanup si nécessaire
  }
}