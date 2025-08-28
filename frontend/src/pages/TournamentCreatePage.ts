import { i18n } from '@/services/i18nService.js';
import { authService } from '@services/authService';
import { tournamentService } from '@services/tournamentService';

export class TournamentCreatePage {
  private participantCount: number = 8;
  private isAuthenticated: boolean = false;
  private participants: string[] = [];

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    // Extraire les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    this.participantCount = parseInt(urlParams.get('participants') || '8');
    this.isAuthenticated = mode === 'authenticated';

    this.render(element);
    this.bindEvents();
  }

  private render(element: Element): void {
    const currentUser = authService.getCurrentUser();
    
    element.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-gray-800 rounded-lg p-8">
          <h1 class="text-3xl font-bold text-center mb-8">
            ${i18n.t('tournament.create.title')}
          </h1>
          
          ${this.isAuthenticated ? `
            <div class="mb-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
              <p class="text-blue-300">
                <strong>${i18n.t('tournament.create.youAreIncluded')}</strong><br>
                ${i18n.t('tournament.create.enterOtherParticipants', { count: this.participantCount - 1 })}
              </p>
              <div class="mt-2 flex items-center gap-2">
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">1</span>
                </div>
                <span class="text-white font-medium">${currentUser?.username || 'You'}</span>
                <span class="text-green-400">✓ ${i18n.t('tournament.create.confirmed')}</span>
              </div>
            </div>
          ` : `
            <div class="mb-6 p-4 bg-purple-900/30 rounded-lg border border-purple-700/50">
              <p class="text-purple-300">
                ${i18n.t('tournament.create.enterAllParticipants', { count: this.participantCount })}
              </p>
            </div>
          `}

          <form id="tournament-form" class="space-y-4">
            <div id="participants-container">
              ${this.renderParticipantInputs()}
            </div>
            
            <div class="flex gap-4 pt-6">
              <button 
                type="button" 
                id="cancel-btn" 
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                ${i18n.t('common.cancel')}
              </button>
              <button 
                type="submit" 
                id="create-tournament-btn"
                class="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                ${i18n.t('tournament.create.createTournament')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderParticipantInputs(): string {
    const startIndex = this.isAuthenticated ? 2 : 1; // Commencer à 2 si utilisateur connecté
    const endIndex = this.participantCount;
    
    let inputs = '';
    for (let i = startIndex; i <= endIndex; i++) {
      inputs += `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <span class="text-white font-bold">${i}</span>
          </div>
          <input 
            type="text" 
            id="participant-${i}"
            placeholder="${i18n.t('tournament.create.participantPlaceholder', { number: i })}"
            class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
            required
            maxlength="20"
          />
        </div>
      `;
    }
    
    return inputs;
  }

  private bindEvents(): void {
    const form = document.getElementById('tournament-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-btn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleCreateTournament();
    });

    cancelBtn?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
    });

    // Validation en temps réel
    const inputs = document.querySelectorAll('input[id^="participant-"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.validateForm());
    });
  }

  private validateForm(): void {
    const inputs = document.querySelectorAll('input[id^="participant-"]') as NodeListOf<HTMLInputElement>;
    const submitBtn = document.getElementById('create-tournament-btn') as HTMLButtonElement;
    
    const allFilled = Array.from(inputs).every(input => input.value.trim().length > 0);
    const allUnique = new Set(Array.from(inputs).map(input => input.value.trim().toLowerCase())).size === inputs.length;
    
    submitBtn.disabled = !allFilled || !allUnique;
    
    // Afficher erreur si doublons
    if (!allUnique && Array.from(inputs).some(input => input.value.trim().length > 0)) {
      // Vous pouvez ajouter un message d'erreur ici
    }
  }

  private async handleCreateTournament(): Promise<void> {
    try {
      const inputs = document.querySelectorAll('input[id^="participant-"]') as NodeListOf<HTMLInputElement>;
      const enteredParticipants = Array.from(inputs).map(input => input.value.trim());
      
      // Construire la liste finale des 8 participants
      const finalParticipants: string[] = [];
      
      if (this.isAuthenticated) {
        const currentUser = authService.getCurrentUser();
        finalParticipants.push(currentUser?.username || 'Player 1');
        finalParticipants.push(...enteredParticipants);
      } else {
        finalParticipants.push(...enteredParticipants);
      }

      // Créer le tournoi via le service
      const tournament = await tournamentService.createTournament(finalParticipants);
      
      // Rediriger vers la page du tournoi
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: `/tournament/${tournament.id}` 
      }));
      
    } catch (error) {
      console.error('Failed to create tournament:', error);
      // Afficher erreur à l'utilisateur
    }
  }
}