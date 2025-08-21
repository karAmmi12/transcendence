export interface MatchHistory {
    id: number;
    opponent: string;
    result: 'win' | 'loss';
    score: {
        player: number;
        opponent: number;
    }
    date: string;
    duration?: number;
    gameMode: 'local' | 'remote' | 'tournament';
    tournament_id?: number;
    opponent_avatar?: string;
}