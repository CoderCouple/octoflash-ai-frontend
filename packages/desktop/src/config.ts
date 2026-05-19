import fs from "node:fs";
import { paths } from "./paths";

export type DesktopConfig = {
  apiUrl: string;
  /** If true, electron-updater will check on startup. */
  autoUpdate: boolean;
  /** Custom window state (size, position) persisted across runs. */
  window?: { width: number; height: number; x?: number; y?: number };
};

const DEFAULTS: DesktopConfig = {
  // Backend runs on :8008 in dev (Docker proxy holds :8000).
  apiUrl: "http://localhost:8008",
  autoUpdate: false,
};

let cached: DesktopConfig | null = null;

export function loadConfig(): DesktopConfig {
  if (cached) return cached;
  const file = paths.configFile();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(DEFAULTS, null, 2));
    cached = DEFAULTS;
  } else {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<DesktopConfig>;
      cached = { ...DEFAULTS, ...raw };
    } catch {
      cached = DEFAULTS;
    }
  }

  // Env override — useful for `OCTOFLASH_API_URL=... electron .` during dev,
  // without touching the persisted config file.
  const envOverride = process.env.OCTOFLASH_API_URL;
  if (envOverride) {
    cached = { ...cached, apiUrl: envOverride };
  }
  return cached;
}

export function saveConfig(next: Partial<DesktopConfig>): DesktopConfig {
  const merged = { ...loadConfig(), ...next };
  fs.writeFileSync(paths.configFile(), JSON.stringify(merged, null, 2));
  cached = merged;
  return merged;
}
