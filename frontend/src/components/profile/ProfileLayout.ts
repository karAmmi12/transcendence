import type { ProfileHeader } from './ProfileHeader';
import type { StatsCard } from './StatsCard';
import type { MatchHistoryCard } from './MatchHistoryCard';
import type { FriendsSection } from './FriendsSection';
import type { QuickActionsCard } from './QuickActionsCard';

export interface ProfileComponents {
  header: ProfileHeader;
  stats: StatsCard;
  history: MatchHistoryCard;
  friends?: FriendsSection;
  actions?: QuickActionsCard;
}

export class ProfileLayout {
  constructor(
    private isOwnProfile: boolean,
    private components: ProfileComponents
  ) {}

  render(): string {
    return `
      <div class="max-w-6xl mx-auto px-4 py-8">
        ${this.components.header.render()}
        
        <div class="grid ${this.isOwnProfile ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8">
          <!-- Colonne principale -->
          <div class="${this.isOwnProfile ? 'lg:col-span-2' : 'w-full'} space-y-8">
            ${this.components.stats.render()}
            ${this.components.history.render()}
          </div>
          
          <!-- Sidebar - seulement pour son propre profil -->
          ${this.isOwnProfile ? `
            <div class="space-y-8">
              ${this.components.friends?.render() || ''}
              ${this.components.actions?.render() || ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  bindEvents(onFriendAction?: (action: string) => Promise<void>): void {
    // Attacher les événements du ProfileHeader pour les autres profils
    if (!this.isOwnProfile && onFriendAction) {
      this.components.header.bindEvents(onFriendAction);
    }

    // Attacher les événements des autres composants
    if (this.components.friends) {
      this.components.friends.bindEvents();
    }

    if (this.components.actions) {
      this.components.actions.bindEvents();
    }
  }
}