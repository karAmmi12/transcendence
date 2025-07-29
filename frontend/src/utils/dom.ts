//siuu Fix temporaire pour la fonction de traduction poour dockercompose
// const t = (key: string, ...args: any[]) => key;

export class DOMUtils {
  static updateTranslations(): void {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = t(key);
      }
    });

    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key) {
        (element as HTMLInputElement).placeholder = t(key);
      }
    });

    // Update all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      if (key) {
        element.setAttribute('title', t(key));
      }
    });

    // Update all elements with data-i18n-aria-label attribute
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      if (key) {
        element.setAttribute('aria-label', t(key));
      }
    });
  }

  static translateElement(element: HTMLElement, key: string, params?: { [key: string]: string }): void {
    element.textContent = t(key, params);
  }
}

// Listen for language changes globally
window.addEventListener('languageChanged', () => {
  DOMUtils.updateTranslations();
});