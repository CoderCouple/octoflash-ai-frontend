/**
 * Runtime config — the single place every consumer reads the API base URL,
 * regardless of environment.
 *
 *   web build : import.meta.env.VITE_API_URL  (Vite injects at build time)
 *   desktop   : window.octoflash.config.apiUrl  (set by Electron main → preload)
 *   fallback  : http://localhost:8000           (local FastAPI dev default)
 *
 * Resolution is lazy so tests can monkey-patch globalThis before importing.
 */

export const DEFAULT_API_URL = "http://localhost:8000";

export type RuntimeConfig = {
  apiUrl: string;
};

declare global {
  interface Window {
    octoflash?: {
      config?: Partial<RuntimeConfig>;
    };
  }
}

let cached: RuntimeConfig | null = null;

export function getRuntimeConfig(): RuntimeConfig {
  if (cached) return cached;

  const fromDesktop =
    typeof window !== "undefined" ? window.octoflash?.config?.apiUrl : undefined;

  // Vite replaces `import.meta.env.*` literals at build time. Wrapped in a
  // typeof check so this file also compiles in the Node-based desktop main
  // process, where `import.meta.env` is undefined.
  const fromVite =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
      : undefined;

  const config: RuntimeConfig = {
    apiUrl: fromDesktop ?? fromVite ?? DEFAULT_API_URL,
  };
  cached = config;
  return config;
}

/** Test/desktop-IPC hook: overwrite the cached config. */
export function setRuntimeConfig(next: Partial<RuntimeConfig>): void {
  cached = { ...getRuntimeConfig(), ...next };
}
