/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" at build time to include the perf counter in a production build (see `npm run perf`). */
  readonly VITE_PERF?: string;
}
