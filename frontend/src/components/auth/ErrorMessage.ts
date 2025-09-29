export class ErrorMessage 
{
  render(): string 
  {
    return `
      <div id="error-message" class="hidden bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative">
        <span id="error-description"></span>
      </div>
    `;
  }

  show(message: string): void 
  {
    const errorMessage = document.getElementById('error-message');
    const errorDescription = document.getElementById('error-description');
    if (errorMessage && errorDescription) 
    {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');
    }
  }

  hide(): void 
  {
    const errorMessage = document.getElementById('error-message');
    errorMessage?.classList.add('hidden');
  }
}