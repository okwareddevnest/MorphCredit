/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MERCHANT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 