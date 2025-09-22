import { i18n } from '@/services/i18nService';

export interface Match
{
  id: number;
  player1: string | any;
  player2: string | any;
  winner?: string | any;
  status: 'pending' | 'in_progress' | 'completed';
  score1?: number;
  score2?: number;
}

export interface BracketData
{
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match;
}

export class TournamentBracket
{
  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur du bracket de tournoi
   * @param bracket Données du bracket
   */
  constructor(private bracket: BracketData)
  {
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Rend le bracket de tournoi
   */
  render(): string
  {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-6 text-center">${i18n.t('tournament.bracket.title')}</h3>

        <!-- Bracket SVG -->
        <div class="tournament-bracket-svg overflow-x-auto">
          ${this.renderSVGBracket()}
        </div>

        <!-- Légende -->
        <div class="mt-6 flex justify-center">
          <div class="flex gap-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-gray-600"></div>
              <span class="text-gray-400">${i18n.t('tournament.legend.pending')}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span class="text-gray-400">${i18n.t('tournament.legend.inProgress')}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-gray-400">${i18n.t('tournament.legend.completed')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attache les événements aux éléments du bracket
   */
  bindEvents(): void
  {
    // Ajouter des événements hover et click sur les matchs
    setTimeout(() =>
    {
      const matches = document.querySelectorAll('.tournament-match');
      matches.forEach(matchElement =>
      {
        matchElement.addEventListener('mouseenter', () =>
        {
          matchElement.classList.add('opacity-80');
        });

        matchElement.addEventListener('mouseleave', () =>
        {
          matchElement.classList.remove('opacity-80');
        });

        matchElement.addEventListener('click', () =>
        {
          const matchId = matchElement.getAttribute('data-match-id');
          // Émettre un événement pour voir les détails du match
          window.dispatchEvent(new CustomEvent('viewMatchDetails', {
            detail: { matchId }
          }));
        });
      });
    }, 100);
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Rend le bracket en SVG
   */
  private renderSVGBracket(): string
  {
    const width = 950;
    const height = 600;

    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto max-w-4xl mx-auto">
        <!-- Dégradés et filtres -->
        <defs>
          ${this.renderGradients()}
          ${this.renderFilters()}
        </defs>

        <!-- Lignes de connexion -->
        ${this.renderConnections()}

        <!-- Quarts de finale -->
        ${this.renderQuarterFinals()}

        <!-- Demi-finales -->
        ${this.renderSemiFinals()}

        <!-- Finale -->
        ${this.renderFinal()}

        <!-- Titre des rounds -->
        ${this.renderRoundTitles()}
      </svg>
    `;
  }

  /**
   * Rend les dégradés
   */
  private renderGradients(): string
  {
    return `
      <linearGradient id="matchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1F2937;stop-opacity:1" />
      </linearGradient>

      <linearGradient id="winnerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#059669;stop-opacity:0.3" />
      </linearGradient>

      <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#2563EB;stop-opacity:0.3" />
      </linearGradient>

      <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#1F2937;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
      </linearGradient>
    `;
  }

  /**
   * Rend les filtres
   */
  private renderFilters(): string
  {
    return `
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    `;
  }

  /**
   * Rend les connexions entre les rounds
   */
  private renderConnections(): string
  {
    let connections = '';

    // Connexions Quarts -> Demi-finales
    connections += this.renderConnection(220, 120, 420, 200); // QF1 -> SF1
    connections += this.renderConnection(220, 240, 420, 200); // QF2 -> SF1
    connections += this.renderConnection(220, 360, 420, 400); // QF3 -> SF2
    connections += this.renderConnection(220, 480, 420, 400); // QF4 -> SF2

    // Connexions Demi-finales -> Finale
    connections += this.renderConnection(620, 200, 720, 300); // SF1 -> F
    connections += this.renderConnection(620, 400, 720, 300); // SF2 -> F

    return connections;
  }

  /**
   * Rend une connexion entre deux points
   */
  private renderConnection(x1: number, y1: number, x2: number, y2: number): string
  {
    const midX = (x1 + x2) / 2;

    return `
      <path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}"
            stroke="#4B5563"
            stroke-width="4"
            fill="none"
            stroke-dasharray="5,5"
            opacity="0.6"/>
    `;
  }

  /**
   * Rend les quarts de finale
   */
  private renderQuarterFinals(): string
  {
    let html = '';
    const positions = [
      { x: 20, y: 80 },   // QF1
      { x: 20, y: 200 },  // QF2
      { x: 20, y: 320 },  // QF3
      { x: 20, y: 440 }   // QF4
    ];

    this.bracket.quarterFinals.forEach((match, index) =>
    {
      const pos = positions[index];
      html += this.renderMatch(match, pos.x, pos.y, `QF${index + 1}`);
    });

    return html;
  }

  /**
   * Rend les demi-finales
   */
  private renderSemiFinals(): string
  {
    let html = '';
    const positions = [
      { x: 420, y: 160 }, // SF1
      { x: 420, y: 360 }  // SF2
    ];

    this.bracket.semiFinals.forEach((match, index) =>
    {
      const pos = positions[index];
      html += this.renderMatch(match, pos.x, pos.y, `SF${index + 1}`);
    });

    return html;
  }

  /**
   * Rend la finale
   */
  private renderFinal(): string
  {
    return this.renderMatch(this.bracket.final, 720, 260, 'F');
  }

  /**
   * Rend un match individuel
   */
  private renderMatch(match: Match, x: number, y: number, label: string): string
  {
    const width = 200;
    const height = 80;

    const fillColor = this.getMatchFillColor(match);
    const strokeColor = this.getMatchStrokeColor(match);

    // ✅ Fonction helper robuste pour extraire les noms
    const player1Name = this.extractPlayerName(match.player1);
    const player2Name = this.extractPlayerName(match.player2);
    const winnerName = this.extractPlayerName(match.winner);

    return `
      <g class="tournament-match" data-match-id="${match.id}">
        <!-- Fond du match avec animation si en cours -->
        <rect x="${x}" y="${y}"
              width="${width}" height="${height}"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="2"
              rx="8"
              filter="url(#shadow)"
              class="transition-all duration-300 hover:opacity-80 cursor-pointer ${match.status === 'in_progress' ? 'animate-pulse' : ''}"/>

        <!-- Label du match -->
        <text x="${x + 10}" y="${y + 15}"
              font-family="Orbitron, monospace"
              font-size="10"
              font-weight="bold"
              fill="#9CA3AF">
          ${label}
        </text>

        <!-- Statut du match avec animation -->
        <circle cx="${x + width - 15}" cy="${y + 12}"
                r="4"
                fill="${this.getStatusColor(match.status)}"
                class="${match.status === 'in_progress' ? 'animate-pulse' : ''}"/>

        <!-- Joueur 1 -->
        <g class="player ${winnerName === player1Name ? 'winner' : ''}">
          <!-- Fond du joueur avec coloration selon le statut -->
          <rect x="${x + 5}" y="${y + 25}"
                width="${width - 10}" height="20"
                fill="${this.getPlayerBackgroundColor(match, player1Name, winnerName)}"
                stroke="${winnerName === player1Name ? '#10B981' : 'transparent'}"
                stroke-width="${winnerName === player1Name ? '1' : '0'}"
                rx="4"/>

          <!-- Nom du joueur -->
          <text x="${x + 10}" y="${y + 38}"
                font-family="Arial, sans-serif"
                font-size="12"
                font-weight="${winnerName === player1Name ? 'bold' : 'normal'}"
                fill="${this.getPlayerTextColor(match, player1Name, winnerName)}">
            ${this.truncateText(player1Name, 12)}
          </text>

          <!-- Score du joueur 1 -->
          ${match.score1 !== undefined ? `
            <text x="${x + width - 15}" y="${y + 38}"
                  font-family="Orbitron, monospace"
                  font-size="14"
                  font-weight="bold"
                  fill="${this.getScoreColor(match, player1Name, winnerName)}">
              ${match.score1}
            </text>
          ` : ''}

          <!-- Icône de victoire -->
          ${winnerName === player1Name && match.status === 'completed' ? `
            <text x="${x + width - 35}" y="${y + 38}"
                  font-size="12"
                  fill="#10B981">
              👑
            </text>
          ` : ''}
        </g>

        <!-- Joueur 2 -->
        <g class="player ${winnerName === player2Name ? 'winner' : ''}">
          <!-- Fond du joueur avec coloration selon le statut -->
          <rect x="${x + 5}" y="${y + 50}"
                width="${width - 10}" height="20"
                fill="${this.getPlayerBackgroundColor(match, player2Name, winnerName)}"
                stroke="${winnerName === player2Name ? '#10B981' : 'transparent'}"
                stroke-width="${winnerName === player2Name ? '1' : '0'}"
                rx="4"/>

          <!-- Nom du joueur -->
          <text x="${x + 10}" y="${y + 63}"
                font-family="Arial, sans-serif"
                font-size="12"
                font-weight="${winnerName === player2Name ? 'bold' : 'normal'}"
                fill="${this.getPlayerTextColor(match, player2Name, winnerName)}">
            ${this.truncateText(player2Name, 12)}
          </text>

          <!-- Score du joueur 2 -->
          ${match.score2 !== undefined ? `
            <text x="${x + width - 15}" y="${y + 63}"
                  font-family="Orbitron, monospace"
                  font-size="14"
                  font-weight="bold"
                  fill="${this.getScoreColor(match, player2Name, winnerName)}">
              ${match.score2}
            </text>
          ` : ''}

          <!-- Icône de victoire -->
          ${winnerName === player2Name && match.status === 'completed' ? `
            <text x="${x + width - 35}" y="${y + 63}"
                  font-size="12"
                  fill="#10B981">
              👑
            </text>
          ` : ''}
        </g>

        <!-- Ligne de séparation entre les joueurs -->
        <line x1="${x + 8}" y1="${y + 45}"
              x2="${x + width - 8}" y2="${y + 45}"
              stroke="#4B5563"
              stroke-width="1"/>
      </g>
    `;
  }

  /**
   * Rend les titres des rounds
   */
  private renderRoundTitles(): string
  {
    return `
      <text x="120" y="30"
            font-family="Orbitron, monospace"
            font-size="14"
            font-weight="bold"
            fill="#9CA3AF"
            text-anchor="middle">
        ${i18n.t('tournament.rounds.quarterFinals')}
      </text>

      <text x="520" y="30"
            font-family="Orbitron, monospace"
            font-size="14"
            font-weight="bold"
            fill="#9CA3AF"
            text-anchor="middle">
        ${i18n.t('tournament.rounds.semiFinals')}
      </text>

      <text x="820" y="30"
            font-family="Orbitron, monospace"
            font-size="14"
            font-weight="bold"
            fill="#9CA3AF"
            text-anchor="middle">
        ${i18n.t('tournament.rounds.final')}
      </text>
    `;
  }

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Extrait le nom du joueur de manière robuste
   */
  private extractPlayerName(player: any): string
  {
    if (!player) return 'TBD';

    // Si c'est déjà une chaîne
    if (typeof player === 'string') return player;

    // Si c'est un objet avec une propriété name
    if (typeof player === 'object')
    {
      if (player.name && typeof player.name === 'string') return player.name;
      if (player.username && typeof player.username === 'string') return player.username;
    }

    // Fallback
    return 'TBD';
  }

  /**
   * Obtenir la couleur de fond du joueur
   */
  private getPlayerBackgroundColor(match: Match, playerName: string, winnerName: string | null): string
  {
    if (match.status === 'completed')
    {
      if (winnerName === playerName)
      {
        return 'url(#winnerGradient)'; // Vert pour le gagnant
      } else
      {
        return 'rgba(239, 68, 68, 0.2)'; // Rouge subtil pour le perdant
      }
    } else if (match.status === 'in_progress')
    {
      return 'url(#activeGradient)'; // Bleu pour le match en cours
    }
    return 'transparent'; // Transparent pour les matchs en attente
  }

  /**
   * Obtenir la couleur du texte du joueur
   */
  private getPlayerTextColor(match: Match, playerName: string, winnerName: string | null): string
  {
    if (match.status === 'completed')
    {
      if (winnerName === playerName)
      {
        return '#10B981'; // Vert pour le gagnant
      } else
      {
        return '#9CA3AF'; // Gris pour le perdant
      }
    } else if (match.status === 'in_progress')
    {
      return '#60A5FA'; // Bleu pour le match en cours
    } else if (playerName === 'TBD')
    {
      return '#6B7280'; // Gris foncé pour TBD
    }
    return '#E5E7EB'; // Blanc par défaut
  }

  /**
   * Obtenir la couleur du score
   */
  private getScoreColor(match: Match, playerName: string, winnerName: string | null): string
  {
    if (match.status === 'completed')
    {
      if (winnerName === playerName)
      {
        return '#10B981'; // Vert pour le score gagnant
      } else
      {
        return '#EF4444'; // Rouge pour le score perdant
      }
    }
    return '#9CA3AF'; // Gris par défaut
  }

  /**
   * Obtenir la couleur de remplissage du match
   */
  private getMatchFillColor(match: Match): string
  {
    switch (match.status)
    {
      case 'in_progress': return 'url(#activeGradient)';
      case 'completed': return 'url(#completedGradient)';
      default: return '#374151';
    }
  }

  /**
   * Obtenir la couleur de bordure du match
   */
  private getMatchStrokeColor(match: Match): string
  {
    switch (match.status)
    {
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      default: return '#4B5563';
    }
  }

  /**
   * Obtenir la couleur du statut
   */
  private getStatusColor(status: string): string
  {
    switch (status)
    {
      case 'pending': return '#6B7280';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  }

  /**
   * Tronque le texte à une longueur maximale
   */
  private truncateText(text: any, maxLength: number): string
  {
    // ✅ Assurer que text est une chaîne
    const actualText = this.extractPlayerName(text);

    if (actualText.length <= maxLength) return actualText;
    return actualText.substring(0, maxLength - 3) + '...';
  }
}