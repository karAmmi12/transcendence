import { i18n } from '@/services/i18nService';
import { userService } from '@services/userService';
import { User } from '@/types/index.js';

export class ThemeSelectionModal
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private modal: HTMLElement | null = null;
  private user: User;
  private onSuccess: (newTheme: string) => void;

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur du modal de sélection de thème
   * @param user Utilisateur actuel
   * @param onSuccess Callback appelé en cas de succès
   */
  constructor(user: User, onSuccess: (newTheme: string) => void)
  {
    this.user = user;
    this.onSuccess = onSuccess;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Affiche le modal de sélection de thème
   */
  show(): void
  {
    this.createModal();
    this.bindEvents();

    // Animation d'apparition
    setTimeout(() =>
    {
      this.modal?.classList.remove('opacity-0');
      this.modal?.classList.add('opacity-100');
      const content = this.modal?.querySelector('.modal-content');
      content?.classList.remove('scale-95');
      content?.classList.add('scale-100');
    }, 10);
  }

  /**
   * Ferme le modal avec animation
   */
  close(): void
  {
    if (!this.modal) return;

    // Animation de fermeture
    this.modal.classList.remove('opacity-100');
    this.modal.classList.add('opacity-0');
    const content = this.modal.querySelector('.modal-content');
    content?.classList.remove('scale-100');
    content?.classList.add('scale-95');

    setTimeout(() =>
    {
      document.removeEventListener('keydown', this.handleKeydown);
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Crée et ajoute le modal au DOM
   */
  private createModal(): void
  {
    // Supprimer le modal existant s'il y en a un
    this.close();

    this.modal = document.createElement('div');
    this.modal.id = 'theme-selection-modal';
    this.modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';

    this.modal.innerHTML = `
      <div class="modal-content bg-gray-800 rounded-lg max-w-3xl w-full transform scale-95 transition-transform duration-300">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold text-white">${i18n.t('profile.themes.title')}</h2>
              <p class="text-gray-400 mt-1">${i18n.t('profile.themes.description')}</p>
            </div>
            <button id="close-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Current theme display -->
          <div class="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <img
                  id="current-theme-preview"
                  src="/images/themes/${this.user.theme || 'classic'}.png"
                  alt="${this.getThemeName(this.user.theme || 'classic')}"
                  class="w-16 h-12 rounded border border-gray-500 object-cover"
                  onerror="this.src='/images/themes/classic.png'"
                />
              </div>
              <div>
                <h3 class="text-white font-medium">${i18n.t('profile.themes.currentTheme')}</h3>
                <p id="current-theme-name" class="text-gray-300">${this.getThemeName(this.user.theme || 'classic')}</p>
              </div>
            </div>
          </div>

          <!-- Theme Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            ${this.renderThemeOptions()}
          </div>

          <!-- Error Message -->
          <div id="theme-error-message" class="hidden bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
            <span id="theme-error-description"></span>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-4 border-t border-gray-700">
            <button
              type="button"
              id="cancel-theme"
              class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              ${i18n.t('common.cancel')}
            </button>
            <button
              type="button"
              id="save-theme"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <span id="theme-spinner" class="hidden mr-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </span>
              <span id="theme-text">${i18n.t('profile.themes.saveTheme')}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  /**
   * Rend les options de thème
   */
  private renderThemeOptions(): string
  {
    const themes = [
      { id: 'classic', name: i18n.t('game.themes.classic') },
      { id: 'neon', name: i18n.t('game.themes.neon') },
      { id: 'retro', name: i18n.t('game.themes.retro') },
      { id: 'cyberpunk', name: 'Cyberpunk' },
      { id: 'space', name: 'Space' },
      { id: 'italian', name: i18n.t('game.themes.italian') },
      { id: 'matrix', name: i18n.t('game.themes.matrix') },
      { id: 'lava', name: i18n.t('game.themes.lava') }
    ];

    return themes.map(theme => `
      <div class="theme-option relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
        theme.id === this.user.theme ? 'ring-2 ring-primary-500' : ''
      }" data-theme-id="${theme.id}">
        <div class="relative overflow-hidden rounded-lg border-2 border-gray-600 hover:border-primary-400 transition-colors">
          <!-- Image d'aperçu -->
          <img
            src="/images/themes/${theme.id}.png"
            alt="${theme.name}"
            class="w-full h-24 object-cover"
            onerror="this.src='/images/themes/classic.png'"
          />

          <!-- Overlay avec nom -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span class="text-white font-medium text-sm text-center px-2">${theme.name}</span>
          </div>

          <!-- Indicateur thème actuel -->
          ${theme.id === this.user.theme ? `
            <div class="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              ${i18n.t('profile.themes.current')}
            </div>
          ` : ''}

          <!-- Indicateur sélection -->
          <div class="theme-selected absolute top-2 left-2 bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 transition-opacity duration-200">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>

        <!-- Nom du thème -->
        <p class="text-center text-white text-sm font-medium mt-2">${theme.name}</p>
      </div>
    `).join('');
  }

  // ==========================================
  // MÉTHODES PRIVÉES D'ÉVÉNEMENTS
  // ==========================================

  /**
   * Attache les événements au modal
   */
  private bindEvents(): void
  {
    if (!this.modal) return;

    let selectedTheme = this.user.theme || 'classic';

    // Fermer le modal
    const closeBtn = this.modal.querySelector('#close-modal');
    const cancelBtn = this.modal.querySelector('#cancel-theme');

    [closeBtn, cancelBtn].forEach(btn =>
    {
      btn?.addEventListener('click', () => this.close());
    });

    // Fermer en cliquant sur l'overlay
    this.modal.addEventListener('click', (e) =>
    {
      if (e.target === this.modal)
      {
        this.close();
      }
    });

    // Sélection de thème
    this.modal.querySelectorAll('.theme-option').forEach(option =>
    {
      option.addEventListener('click', () =>
      {
        const themeId = (option as HTMLElement).dataset.themeId!;

        // Mettre à jour la sélection visuelle
        this.modal?.querySelectorAll('.theme-option').forEach(opt =>
        {
          opt.classList.remove('ring-2', 'ring-primary-500');
          const selected = opt.querySelector('.theme-selected');
          selected?.classList.add('opacity-0');
        });

        option.classList.add('ring-2', 'ring-primary-500');
        const selectedIndicator = option.querySelector('.theme-selected');
        selectedIndicator?.classList.remove('opacity-0');

        // Mettre à jour l'aperçu du thème actuel
        const currentPreview = this.modal?.querySelector('#current-theme-preview') as HTMLImageElement;
        const currentName = this.modal?.querySelector('#current-theme-name');

        if (currentPreview)
        {
          currentPreview.src = `/images/themes/${themeId}.jpg`;
          currentPreview.alt = this.getThemeName(themeId);
        }
        if (currentName)
        {
          currentName.textContent = this.getThemeName(themeId);
        }

        // Activer le bouton de sauvegarde si différent du thème actuel
        const saveBtn = this.modal?.querySelector('#save-theme') as HTMLButtonElement;
        if (saveBtn)
        {
          saveBtn.disabled = themeId === this.user.theme;
        }

        selectedTheme = themeId;
      });
    });

    // Sauvegarde
    const saveBtn = this.modal.querySelector('#save-theme');
    saveBtn?.addEventListener('click', () => this.handleSaveTheme(selectedTheme));

    // Échapper pour fermer
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Gestionnaire d'événement pour la touche Échap
   */
  private handleKeydown = (e: KeyboardEvent): void =>
  {
    if (e.key === 'Escape')
    {
      this.close();
    }
  };

  /**
   * Gère la sauvegarde du thème
   */
  private async handleSaveTheme(themeId: string): Promise<void>
  {
    if (!this.modal) return;

    const saveBtn = this.modal.querySelector('#save-theme') as HTMLButtonElement;
    const saveText = this.modal.querySelector('#theme-text') as HTMLElement;
    const saveSpinner = this.modal.querySelector('#theme-spinner') as HTMLElement;

    // Show loading state
    saveBtn.disabled = true;
    saveText.textContent = i18n.t('common.saving');
    saveSpinner.classList.remove('hidden');
    this.hideError();

    try
    {
      const success = await userService.saveUserTheme(themeId);

      if (!success)
      {
        throw new Error(i18n.t('profile.themes.errors.saveFailed'));
      }

      // Succès - mettre à jour l'utilisateur local
      this.user.theme = themeId;
      this.onSuccess(themeId);

      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: themeId }
      }));
      this.close();

    } catch (error)
    {
      console.error('❌ Theme save error:', error);
      this.showError((error as Error).message);

      // Reset loading state on error
      saveBtn.disabled = false;
      saveText.textContent = i18n.t('profile.themes.saveTheme');
      saveSpinner.classList.add('hidden');
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Obtenir le nom d'affichage du thème
   */
  private getThemeName(themeId: string): string
  {
    const nameMap: Record<string, string> = {
      classic: i18n.t('game.themes.classic'),
      neon: i18n.t('game.themes.neon'),
      retro: i18n.t('game.themes.retro'),
      cyberpunk: 'Cyberpunk',
      space: 'Space',
      italian: i18n.t('game.themes.italian'),
      matrix: i18n.t('game.themes.matrix'),
      lava: i18n.t('game.themes.lava')
    };

    return nameMap[themeId] || nameMap.classic;
  }

  /**
   * Affiche un message d'erreur
   */
  private showError(message: string): void
  {
    if (!this.modal) return;

    const errorMessage = this.modal.querySelector('#theme-error-message');
    const errorDescription = this.modal.querySelector('#theme-error-description');

    if (errorMessage && errorDescription)
    {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');

      // Auto-hide après 5 secondes
      setTimeout(() =>
      {
        errorMessage.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Cache le message d'erreur
   */
  private hideError(): void
  {
    if (!this.modal) return;

    const errorMessage = this.modal.querySelector('#theme-error-message');
    errorMessage?.classList.add('hidden');
  }
}