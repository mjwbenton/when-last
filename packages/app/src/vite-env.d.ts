/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKUP_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
