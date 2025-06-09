
export class LoadingSpinner {
  private spinnerElement: HTMLDivElement;

  constructor() {
    this.spinnerElement = document.createElement('div');
    this.spinnerElement.className = 'spinner';
    this.spinnerElement.innerHTML = `
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    `;
  }

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    element.appendChild(this.spinnerElement);
  }

  destroy(): void {
    if (this.spinnerElement.parentNode) {
      this.spinnerElement.parentNode.removeChild(this.spinnerElement);
    }
  }
}