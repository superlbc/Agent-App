// FIX: Removed the reference to 'vite/client' as it was causing a type definition resolution error.
// Manually defining the types for `import.meta.env` to ensure `import.meta.env.DEV` is recognized
// by TypeScript, which resolves errors in `services/apiService.ts`.

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_CLIENT_SECRET: string;
  // Dual Agent Architecture
  readonly VITE_DEFAULT_NOTES_AGENT_ID: string;
  readonly VITE_DEFAULT_INTERROGATION_AGENT_ID: string;
  // Legacy (deprecated)
  readonly VITE_DEFAULT_BOT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}