// Bundle the extension into dist/octoflash-extension.zip for Chrome Web Store upload.
// Run with: node scripts/zip.mjs
import { mkdir, rm, readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, join } from "node:path";
import { createDeflateRaw } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Buffer } from "node:buffer";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");

const INCLUDE = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "background.js",
  "icon16.png",
  "icon32.png",
  "icon48.png",
  "icon128.png",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// Minimal stored-only zip (no compression) — small files, simpler than streaming deflate.
function crc32(buf) {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

const localHeaders = [];
const centralHeaders = [];
let offset = 0;

for (const name of INCLUDE) {
  const path = resolve(root, name);
  let data;
  try {
    data = await readFile(path);
  } catch (e) {
    console.warn(`skip missing ${name}`);
    continue;
  }
  const crc = crc32(data);
  const nameBuf = Buffer.from(name, "utf-8");

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8); // stored
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);

  const localPart = Buffer.concat([local, nameBuf, data]);
  localHeaders.push(localPart);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(offset, 42);
  centralHeaders.push(Buffer.concat([central, nameBuf]));

  offset += localPart.length;
}

const localBuf = Buffer.concat(localHeaders);
const centralBuf = Buffer.concat(centralHeaders);

const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(centralHeaders.length, 8);
end.writeUInt16LE(centralHeaders.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(localBuf.length, 16);
end.writeUInt16LE(0, 20);

const zipPath = resolve(dist, "octoflash-extension.zip");
await writeFile(zipPath, Buffer.concat([localBuf, centralBuf, end]));
console.log(`wrote ${relative(root, zipPath)} (${localHeaders.length} files)`);
