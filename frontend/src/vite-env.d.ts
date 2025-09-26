/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ✅ Ajouter les types pour process.env en environnement browser
declare var process: {
  env: {
    NODE_ENV?: string
    [key: string]: string | undefined
  }
}
