// export interface MatchResponse {
//     id: number;
//     mode: 'local' | 'online' | 'tournament'
//     player1: Player;
//     player2: Player;
//     status: 'in_progress' | 'finished'
//     createdAt: string;
// }

export interface MatchResponse {
    success: boolean;
    message?: string;
}

export interface Player {
    name: string;
    isUser: boolean;
}