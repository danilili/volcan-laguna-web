import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { mapsDirectionsUrl, site } from "@/lib/site";

/**
 * Static map built from OpenStreetMap tiles with the property pin centered.
 * No API key needed. TODO (before launch): swap for Google Static Maps or
 * Mapbox Static with a key, or self-host the tiles; OSM's tile policy is for
 * light use only.
 */

const TILE = 256;

function tileCoords(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

type Props = {
  zoom?: number;
  /** Rendered size in CSS px; tiles are laid out to cover it. */
  width?: number;
  height?: number;
  className?: string;
  /** Wrap in a link to Google Maps directions (default true). */
  link?: boolean;
};

export function StaticMap({ zoom = 14, width = 768, height = 448, className, link = true }: Props) {
  const { x, y } = tileCoords(site.geo.lat, site.geo.lng, zoom);
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  // Pixel offset of the pin inside its tile, so we can center it.
  const offX = (x - cx) * TILE;
  const offY = (y - cy) * TILE;
  const originX = width / 2 - offX; // where tile (cx, cy) starts
  const originY = height / 2 - offY;
  const tilesX = Math.ceil(originX / TILE) + 1;
  const tilesY = Math.ceil(originY / TILE) + 1;
  const spanX = Math.ceil((width - originX) / TILE) + 1;
  const spanY = Math.ceil((height - originY) / TILE) + 1;

  const tiles: { left: number; top: number; src: string; key: string }[] = [];
  for (let dx = -tilesX; dx <= spanX; dx++) {
    for (let dy = -tilesY; dy <= spanY; dy++) {
      const left = originX + dx * TILE;
      const top = originY + dy * TILE;
      if (left + TILE < 0 || top + TILE < 0 || left > width || top > height) continue;
      const tx = cx + dx;
      const ty = cy + dy;
      tiles.push({
        left,
        top,
        key: `${tx}-${ty}`,
        src: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
      });
    }
  }

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  const map = (
    <div
      className={cn("relative overflow-hidden rounded-card bg-laguna-100 shadow-card", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={`Mapa: ${site.name}, ${site.address.street}, ${site.address.neighborhood}, ${site.address.city}, ${site.address.stateShort}`}
    >
      {tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.key}
          src={t.src}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          decoding="async"
          className="absolute block max-w-none select-none"
          style={{
            left: pct(t.left, width),
            top: pct(t.top, height),
            width: pct(TILE, width),
            height: pct(TILE, height),
          }}
        />
      ))}
      {/* Soft sand wash so the map sits inside the palette */}
      <div className="pointer-events-none absolute inset-0 bg-arena-500/10 mix-blend-multiply" />
      {/* Pin, centered */}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="rounded-pill bg-laguna-900 px-3 py-1 text-xs font-medium whitespace-nowrap text-crema-50 shadow-float">
          {site.name}
        </span>
        <Icon name="ubicacion" size={36} className="-mt-1 text-arena-600 drop-shadow" />
      </div>
      <span className="absolute right-2 bottom-1 text-[10px] text-ink-500/80">© OpenStreetMap</span>
    </div>
  );

  if (!link) return map;
  return (
    <a
      href={mapsDirectionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      aria-label="Abrir indicaciones en Google Maps"
    >
      {map}
    </a>
  );
}
