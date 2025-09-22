import type { ProfileComponents } from '@/types/index.js';

export class ProfileLayout
{
  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur de la mise en page du profil
   * @param isOwnProfile Si c'est le profil de l'utilisateur actuel
   * @param components Composants du profil
   */
  constructor(
    private isOwnProfile: boolean,
    private components: ProfileComponents
  )
  {
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Rend la mise en page du profil
   */
  render(): string
  {
    if (this.isOwnProfile)
    {
      return `
        <div class="max-w-6xl mx-auto px-4 py-8">
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div class="xl:col-span-2 space-y-8">
              ${this.components.header.render()}
              ${this.components.stats.render()}
              ${this.components.history ? this.components.history.render() : ''}
            </div>
            <div class="space-y-8">
              ${this.components.friends ? this.components.friends.render() : ''}
            </div>
          </div>
        </div>
      `;
    } else
    {
      // Layout pour les autres profils (sans historique des matchs)
      return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="space-y-8">
            ${this.components.header.render()}
            ${this.components.stats.render()}
          </div>
        </div>
      `;
    }
  }

  /**
   * Attache les événements aux composants
   */
  bindEvents(onFriendAction?: (action: string) => Promise<void>): void
  {
    // Attacher les événements du ProfileHeader pour les autres profils
    if (!this.isOwnProfile && onFriendAction)
    {
      this.components.header.bindEvents({ onFriendAction });
    }

    // Attacher les événements des autres composants
    if (this.components.friends)
    {
      this.components.friends.bindEvents();
    }
  }
}