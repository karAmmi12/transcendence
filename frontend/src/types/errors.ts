export class TwoFactorRequiredError extends Error {
  constructor(message: string, public userId: number) {
    super(message);
    this.name = 'TwoFactorRequiredError';
  }
}