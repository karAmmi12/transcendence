export class Logger {
  static log(message: any, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  }

  static error(message: any, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(message, ...args);
    }
  }
}