/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCORING_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 