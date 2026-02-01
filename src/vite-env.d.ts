/// <reference types="vite/client" />

// Vite Environment Variables Type Definitions
// These provide TypeScript support for import.meta.env

interface ImportMetaEnv {
  /** API Base URL - Set in .env files or runtime configuration */
  readonly VITE_API_URL: string;

  /** Current mode (development/production) */
  readonly MODE: string;

  /** Is development mode */
  readonly DEV: boolean;

  /** Is production mode */
  readonly PROD: boolean;

  /** Is server-side rendering */
  readonly SSR: boolean;

  /** Base public path */
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime API configuration (for dynamic configuration at deploy time)
interface Window {
  __API_CONFIG__?: {
    baseUrl: string;
    version?: string;
    environment?: string;
  };
}
