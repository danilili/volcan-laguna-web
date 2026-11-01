import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { mapsDirectionsUrl, site } from "@/lib/site";

/**
 * Static map rendered once from OpenStreetMap tiles by `pnpm render:map`
 * (scripts/render-map.ts) into public/images/mapa/, so the site never
 * calls the OSM tile servers at runtime. The pin is centred in the render;
 * this component only overlays the marker. Attribution is required (ODbL).
 */

/** Renders that exist in public/images/mapa (re-run the script to add a zoom). */
const RENDERS: Record<number, { src: string; width: number; height: number }> = {
  13: { src: "/images/mapa/mapa-z13.jpg", width: 1536, height: 896 },
};

type Props = {
  zoom?: keyof typeof RENDERS;
  className?: string;
  /** Wrap in a link to Google Maps directions (default true). */
  link?: boolean;
};

export function StaticMap({ zoom = 13, className, link = true }: Props) {
  const render = RENDERS[zoom] ?? RENDERS[13];

  const map = (
    <div
      className={cn("relative overflow-hidden rounded-card bg-laguna-100 shadow-card", className)}
      style={{ aspectRatio: `${render.width} / ${render.height}` }}
      role="img"
      aria-label={`Mapa: ${site.name}, ${site.address.street}, ${site.address.neighborhood}, ${site.address.city}, ${site.address.stateShort}`}
    >
      <Image src={render.src} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover select-none" />
      {/* Soft sand wash so the map sits inside the palette */}
      <div className="pointer-events-none absolute inset-0 bg-arena-500/10 mix-blend-multiply" />
      {/* Pin, centred */}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="rounded-pill bg-laguna-900 px-3 py-1 text-xs font-medium whitespace-nowrap text-crema-50 shadow-float">
          {site.name}
        </span>
        <Icon name="ubicacion" size={36} className="-mt-1 text-arena-600 drop-shadow" />
      </div>
      <span className="absolute right-2 bottom-1 text-[10px] text-ink-500/80">© OpenStreetMap contributors</span>
    </div>
  );

  if (!link) return map;
  return (
    <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="block" aria-label="Abrir indicaciones en Google Maps">
      {map}
    </a>
  );
}
