export class GamePage {
  mount(selector: string): void {
    const element = document.querySelector(selector)
    if (!element) return

    element.innerHTML = `
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-8">Game Page</h1>
        <p class="text-gray-300">The Pong game will be here soon!</p>
      </div>
    `
  }

  destroy(): void {
    // Cleanup if needed
  }
}