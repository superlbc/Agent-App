// FIX: Removed the reference to 'vite/client' as it was causing a type definition resolution error.
// Manually defining the types for `import.meta.env` to ensure `import.meta.env.DEV` is recognized
// by TypeScript, which resolves errors in `services/apiService.ts`.

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  // Dual Agent Architecture
  readonly DEFAULT_NOTES_AGENT_ID: string;
  readonly DEFAULT_INTERROGATION_AGENT_ID: string;
  // Legacy (deprecated)
  readonly DEFAULT_BOT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}