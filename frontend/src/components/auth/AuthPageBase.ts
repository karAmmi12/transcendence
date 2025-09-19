import { i18n } from '@/services/i18nService';
import { ErrorMessage } from './ErrorMessage';
import { OAuthButtons } from './OAuthButtons';
import { authService } from '@services/authService';

export abstract class AuthPageBase 
{
  protected languageListener: (() => void) | null = null;
  protected errorMessage: ErrorMessage;
  protected oauthButtons: OAuthButtons;

  constructor() 
  {
    this.errorMessage = new ErrorMessage();
    this.oauthButtons = new OAuthButtons();
  }

  mount(selector: string): void 
  {
    const element = document.querySelector(selector);
    if (!element) 
      return;

    this.render(element);
    this.destroy();

    this.languageListener = () => {
      this.render(element);
      this.bindEvents();
    };

    window.addEventListener('languageChanged', this.languageListener);
    this.bindEvents();
  }

  protected abstract getTitle(): string;
  protected abstract renderForm(): string;
  protected abstract handleFormSubmit(formData: FormData): Promise<void>;
  protected abstract renderFooterLinks(): string;

  private render(element: Element): void 
  {
    element.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
              ${this.getTitle()}
            </h2>
          </div>
          
          ${this.errorMessage.render()}

          <form id="auth-form" class="mt-8 space-y-6">
            ${this.renderForm()}
            ${this.oauthButtons.render()}
            ${this.renderFooterLinks()}
          </form>
        </div>
      </div>
    `;
  }

  protected bindEvents(): void 
  {
    const form = document.getElementById('auth-form') as HTMLFormElement;
    
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      this.errorMessage.hide();

      try 
      {
        await this.handleFormSubmit(formData);
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
      } catch (error) 
      {
        this.errorMessage.show((error as Error).message);
      }
    });

    this.oauthButtons.bindEvents(this.handleOAuth.bind(this));
  }

  protected handleOAuth(provider: string): void 
  {
    if (provider === 'google') 
    {
      authService.initiateGoogleLogin();
    } else 
    {
      console.log('OAuth provider not implemented:', provider);
    }
  }

  destroy(): void 
  {
    if (this.languageListener) 
    {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}