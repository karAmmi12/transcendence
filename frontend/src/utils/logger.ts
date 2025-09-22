export class Logger {
  static log(message: any, ...args: any[]): void {
    if (import.meta.env.PROD) return; // Ne log pas en production
    console.log(message, ...args);
  }

  static error(message: any, ...args: any[]): void {
    if (import.meta.env.PROD) return; // Ne log pas en production
    Logger.error(message, ...args);
  }

  static warn(message: any, ...args: any[]): void {
    if (import.meta.env.PROD) return; // Ne log pas en production
    console.warn(message, ...args);
  }
}