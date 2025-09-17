/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QUESTION_GENERATION_API_URL: string
  readonly VITE_AI_MATCHING_SERVICE_URL: string
  readonly VITE_BUSINESS_SERVICE_URL: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}