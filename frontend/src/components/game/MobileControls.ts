import { i18n } from '@/services/i18nService.js';

export class MobileControls {
  constructor(
    private callbacks: {
      onPlayer1Up: (pressed: boolean) => void;
      onPlayer1Down: (pressed: boolean) => void;
      onPlayer2Up: (pressed: boolean) => void;
      onPlayer2Down: (pressed: boolean) => void;
    }
  ) {}

  bindEvents(): void {
    const controls = ['p1-up', 'p1-down', 'p2-up', 'p2-down'];
    
    controls.forEach(controlId => {
      const btn = document.getElementById(controlId);
      if (btn) {
        // Touch events
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleControlStart(controlId);
        });
        
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleControlEnd(controlId);
        });

        // Mouse events for desktop testing
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.handleControlStart(controlId);
        });

        btn.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.handleControlEnd(controlId);
        });
      }
    });
  }

  private handleControlStart(controlId: string): void {
    switch (controlId) {
      case 'p1-up':
        this.callbacks.onPlayer1Up(true);
        break;
      case 'p1-down':
        this.callbacks.onPlayer1Down(true);
        break;
      case 'p2-up':
        this.callbacks.onPlayer2Up(true);
        break;
      case 'p2-down':
        this.callbacks.onPlayer2Down(true);
        break;
    }
  }

  private handleControlEnd(controlId: string): void {
    switch (controlId) {
      case 'p1-up':
        this.callbacks.onPlayer1Up(false);
        break;
      case 'p1-down':
        this.callbacks.onPlayer1Down(false);
        break;
      case 'p2-up':
        this.callbacks.onPlayer2Up(false);
        break;
      case 'p2-down':
        this.callbacks.onPlayer2Down(false);
        break;
    }
  }
}