// Renders icon.svg to icon48.png and icon128.png.
// Run with: node scripts/icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const svg = await readFile(resolve(root, "icon.svg"));

for (const size of [16, 32, 48, 128]) {
  const out = resolve(root, `icon${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`wrote icon${size}.png`);
}
