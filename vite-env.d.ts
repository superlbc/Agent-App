// FIX: Removed the reference to 'vite/client' as it was causing a type definition resolution error.
// Manually defining the types for `import.meta.env` to ensure `import.meta.env.DEV` is recognized
// by TypeScript, which resolves errors in `services/apiService.ts`.

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly DEFAULT_BOT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}