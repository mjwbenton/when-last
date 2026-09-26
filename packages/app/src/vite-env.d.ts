/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_BACKUP_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
