export interface InputConfig {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  label?: string;
}

export class AuthFormInput 
{
  constructor(private config: InputConfig) {}

  render(): string 
  {
    return `
      <div>
        <label for="${this.config.id}" class="block text-sm font-medium text-gray-300">
          ${this.config.label || ''}
        </label>
        <input 
          id="${this.config.id}" 
          name="${this.config.name}" 
          type="${this.config.type}" 
          ${this.config.required ? 'required' : ''}
          class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
          placeholder="${this.config.placeholder || ''}"
        />
      </div>
    `;
  }
}