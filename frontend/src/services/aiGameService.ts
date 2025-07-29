export class AIGameService {
  constructor() {}
  
  // Toutes les méthodes vides pour éviter les erreurs
  updatePlayerPaddle(y: number): void {}
  async createGame(difficulty?: any): Promise<any> { return {}; }
  startGameLoop(callback: any): void {}
  stopGameLoop(): void {}
  getGameId(): string | null { return null; }
  async changeDifficulty(difficulty: any): Promise<void> {}
  async endGame(): Promise<void> {}
}