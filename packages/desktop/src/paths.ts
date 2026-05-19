import { app } from "electron";
import path from "node:path";
import fs from "node:fs";

/** Centralized location for all on-disk paths the desktop app reads or writes. */
export const paths = {
  userData: () => app.getPath("userData"),
  downloads: () => app.getPath("downloads"),
  temp: () => app.getPath("temp"),

  /** ~/Library/Application Support/Octoflash AI/projects */
  projects: () => ensure(path.join(app.getPath("userData"), "projects")),
  /** ~/Library/Application Support/Octoflash AI/cache */
  cache: () => ensure(path.join(app.getPath("userData"), "cache")),
  /** ~/Library/Application Support/Octoflash AI/logs */
  logs: () => ensure(path.join(app.getPath("userData"), "logs")),

  /** Runtime config file. Written on first launch with defaults. */
  configFile: () => path.join(app.getPath("userData"), "config.json"),

  /** Recently opened projects (list of {id,title,path,openedAt}). */
  recentsFile: () => path.join(app.getPath("userData"), "recents.json"),
};

function ensure(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
