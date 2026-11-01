/**
 * Renders the static map once into public/images/mapa/ so the site never
 * requests OpenStreetMap tiles at runtime (OSM's tile policy is for light,
 * attributed use; serving our own raster is the sanctioned way).
 *
 *   pnpm render:map               # zoom 13, 768×448 CSS px at 2× (1536×896)
 *   pnpm render:map --zoom 14     # closer in
 *
 * The property pin is centred, so <StaticMap> only overlays the marker.
 * Re-run when the pin or the zoom changes. Attribution "© OpenStreetMap
 * contributors" must stay visible on the page (ODbL).
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { site } from "../lib/site";

const TILE = 256;
const TILE_URL = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
// OSM requires a identifying User-Agent for scripted access.
const USER_AGENT = "volcan-laguna-web/render-map (volcanlagunamx@gmail.com)";

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback;
}

const zoom = arg("zoom", 13);
const cssWidth = arg("width", 768);
const cssHeight = arg("height", 448);
const scale = arg("scale", 2);
const width = cssWidth * scale;
const height = cssHeight * scale;

function tileCoords(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

async function fetchTile(z: number, x: number, y: number): Promise<Buffer> {
  const res = await fetch(TILE_URL(z, x, y), { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`tile ${z}/${x}/${y}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  // For a crisp 2× image we fetch tiles one zoom level deeper and crop the
  // same geographic extent at double the pixels (no upscaling).
  const zRender = zoom + Math.round(Math.log2(scale));
  const { x, y } = tileCoords(site.geo.lat, site.geo.lng, zRender);
  const left = x * TILE - width / 2;
  const top = y * TILE - height / 2;
  const x0 = Math.floor(left / TILE);
  const y0 = Math.floor(top / TILE);
  const x1 = Math.floor((left + width) / TILE);
  const y1 = Math.floor((top + height) / TILE);

  const tiles: { input: Buffer; left: number; top: number }[] = [];
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      const input = await fetchTile(zRender, tx, ty);
      tiles.push({ input, left: (tx - x0) * TILE, top: (ty - y0) * TILE });
      process.stdout.write(".");
    }
  }
  process.stdout.write("\n");

  const mosaic = await sharp({
    create: { width: (x1 - x0 + 1) * TILE, height: (y1 - y0 + 1) * TILE, channels: 3, background: "#e3f0f4" },
  })
    .composite(tiles)
    .png()
    .toBuffer();

  const outDir = path.join(process.cwd(), "public", "images", "mapa");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `mapa-z${zoom}.jpg`);
  await sharp(mosaic)
    .extract({ left: Math.round(left - x0 * TILE), top: Math.round(top - y0 * TILE), width, height })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);

  const meta = { zoom, scale, width, height, cssWidth, cssHeight, lat: site.geo.lat, lng: site.geo.lng, renderedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, `mapa-z${zoom}.json`), `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`wrote ${path.relative(process.cwd(), out)} (${tiles.length} tiles at z${zRender}, ${width}×${height})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
