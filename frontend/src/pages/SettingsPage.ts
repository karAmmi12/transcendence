export class SettingsPage {
  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    element.innerHTML = `
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-8">Settings</h1>
        <p class="text-gray-300">Configure your settings here.</p>
        <form id="settings-form" class="mt-8 space-y-4">
          <div>
            <label for="username" class="block text-gray-200">Username</label>
            <input type="text" id="username" class="w-full p-2 bg-gray-800 text-gray-200 rounded" />
          </div>
          <div>
            <label for="email" class="block text-gray-200">Email</label>
            <input type="email" id="email" class="w-full p-2 bg-gray-800 text-gray-200 rounded" />
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Save Settings</button>
        </form>
      </div>
    `;

    const form = document.getElementById('settings-form') as HTMLFormElement;
    form.addEventListener('submit', this.handleSubmit);
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    // Handle form submission logic here
    console.log('Settings saved!');
  }

  destroy(): void {
    // Cleanup if needed
  }
}