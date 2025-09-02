export interface CreateTournamentBody {
    participants: string[]; // Array de 8 noms/alias
}

export interface TournamentParticipant {
    name: string;
    isUser: boolean;
    userId?: number;
}

export interface TournamentMatch {
    id: number;
    round: number; // 1=quarters, 2=semis, 3=final
    position: number; // Position dans le round
    player1: TournamentParticipant | null;
    player2: TournamentParticipant | null;
    winner: TournamentParticipant | null;
    status: 'pending' | 'in_progress' | 'completed';
    matchId?: number; // ID du match dans la table matches
}

export interface TournamentBracket {
    quarterFinals: TournamentMatch[];
    semiFinals: TournamentMatch[];
    final: TournamentMatch;
}

// ✅ Type unifié pour les deux opérations (création et fin de match)
export interface TournamentResponse {
    success: boolean;
    message: string;
    tournament: {
        id: number;
        status: 'waiting' | 'in_progress' | 'completed';
        participants: TournamentParticipant[];
        bracket: TournamentBracket;
        nextMatch?: {
            id: number;
            matchNumber: number; // ✅ Ajout du tournament_match_number
            round: string;
            player1: string;
            player2: string;
        } | null;
        winner?: string; // Nom du gagnant final (si tournoi terminé)
    };
}

export interface FinishMatchBody {
    tournamentId: number;
    matchNumber: number; // ✅ tournament_match_number
    winner: string; // Nom du gagnant (alias ou username)
    scores: {
        player1: number;
        player2: number;
    };
}

// ⚠️ Supprimer MatchResult car remplacé par TournamentResponse unifié