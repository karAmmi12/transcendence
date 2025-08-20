export interface MatchData {
    id: number;
    opponent: string;
    result: string; // win | loss
    score: {
        player: number;
        opponent: number;
    }
    date: string;
    duration: string;
    gameMode: string; // local | online | tournament
}