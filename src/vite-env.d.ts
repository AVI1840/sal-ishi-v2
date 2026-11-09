/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITION?: string;
  readonly VITE_CITIZEN_CHAT?: string;
  readonly VITE_AI_ENDPOINT?: string;
  readonly VITE_FEEDBACK_EMAIL?: string;
}

/** חותמת הבנייה (vite.config.ts). */
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;
