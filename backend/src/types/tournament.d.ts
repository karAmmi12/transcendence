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
    final: TournamentMatch | null;
}

export interface TournamentResponse {
    id: number;
    status: 'waiting' | 'in_progress' | 'completed';
    participants: TournamentParticipant[];
    bracket: TournamentBracket;
    currentMatch?: {
        id: number;
        round: string;
        player1: string;
        player2: string;
    };
    winner?: string;
}

export interface FinishMatchBody {
    winner: string; // Nom du gagnant (alias ou username)
    scores: {
        player1: number;
        player2: number;
    };
}

export interface MatchResult {
    success: boolean;
    message: string;
    result?: {
        winner: string;
        scores: { player1: number; player2: number };
    };
    tournament?: {
        status: 'in_progress' | 'completed';
        nextMatch?: {
            id: number;
            round: string;
            player1: string;
            player2: string;
        } | null;
        tournamentWinner?: string;
    };
}