import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Content layer: reads MDX/JSON from `content/` synchronously at render time.
 * Sync reads are deliberate: with Cache Components enabled, uncached async
 * I/O during prerender forces a Suspense boundary; sync fs is simply static.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Imagen = { src: string; alt: string };

export type Casa = {
  slug: string;
  nombre: string;
  wpId?: number;
  beds24RoomId: number;
  capacidad: number;
  recamaras: number;
  banos: number;
  precioDesde: number;
  precioFinDeSemana: number;
  resumen: string;
  imagenPrincipal: string;
  amenidades: string[];
  galeria: Imagen[];
  /** Parent house for the "para 4" variants (derived). */
  padre?: string;
  body: string;
};

export type HomeSeccion = { titulo: string; texto: string };
export type Home = {
  titulo: string;
  fraseHero: string;
  subtituloHero?: string;
  secciones: Partial<Record<"somos" | "casas" | "laguna" | "retiros" | "alimentos" | "resenas" | "mapa", HomeSeccion>>;
  body: string;
};

export type Pagina = {
  slug: string;
  titulo: string;
  resumen?: string;
  wpId?: number;
  actualizado?: string;
  body: string;
};

export type Retiro = {
  wpId: number;
  slug: string;
  titulo: string;
  estado: "pasado" | "proximo";
  fecha: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  resumen: string;
  contenido: string;
  imagenes: Imagen[];
};

export type ImagenMeta = { alt: string; width: number; height: number };

function readMdx<T extends Record<string, unknown>>(rel: string): { data: T; body: string } | null {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { data: data as T, body: content.trim() };
}

/** YAML dates come back as Date objects from gray-matter; keep them as YYYY-MM-DD strings. */
function toDateString(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return undefined;
}

function readJson<T>(rel: string, fallback: T): T {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

/* ---------------------------------------------------------------- Casas */

const CASAS_ORDER = ["santuario", "los-mangos", "moringa", "santuario-para-4", "los-mangos-para-4"];

export function getCasas(): Casa[] {
  const dir = path.join(CONTENT_DIR, "casas");
  if (!fs.existsSync(dir)) return [];
  const casas = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const parsed = readMdx<Omit<Casa, "body">>(`casas/${f}`);
      if (!parsed) return null;
      const d = parsed.data;
      const casa: Casa = {
        ...d,
        slug: d.slug ?? slug,
        amenidades: d.amenidades ?? [],
        galeria: d.galeria ?? [],
        padre: slug.endsWith("-para-4") ? slug.replace(/-para-4$/, "") : undefined,
        body: parsed.body,
      };
      return casa;
    })
    .filter((c): c is Casa => c !== null);

  return casas.sort((a, b) => CASAS_ORDER.indexOf(a.slug) - CASAS_ORDER.indexOf(b.slug));
}

export function getCasa(slug: string): Casa | null {
  return getCasas().find((c) => c.slug === slug) ?? null;
}

/** The three main houses (no "para 4" variants). */
export function getCasasPrincipales(): Casa[] {
  return getCasas().filter((c) => !c.padre);
}

/** Variants of a house (e.g. "santuario" → ["santuario-para-4"]). */
export function getVariantes(slug: string): Casa[] {
  return getCasas().filter((c) => c.padre === slug);
}

/* ----------------------------------------------------------------- Home */

export function getHome(): Home {
  const parsed = readMdx<Omit<Home, "body">>("home.mdx");
  return {
    titulo: parsed?.data.titulo ?? "Volcán Laguna",
    fraseHero: parsed?.data.fraseHero ?? "La laguna te recibe", // TODO: confirm with Bea
    subtituloHero: parsed?.data.subtituloHero,
    secciones: parsed?.data.secciones ?? {},
    body: parsed?.body ?? "",
  };
}

/* -------------------------------------------------------------- Páginas */

export function getPagina(slug: string): Pagina | null {
  const parsed = readMdx<Omit<Pagina, "body" | "slug">>(`${slug}.mdx`);
  if (!parsed) return null;
  return { slug, ...parsed.data, actualizado: toDateString(parsed.data.actualizado), body: parsed.body };
}

/* -------------------------------------------------------------- Retiros */

export function getRetiros(): Retiro[] {
  return readJson<Retiro[]>("retiros.json", []);
}

export function getRetirosProximos(): Retiro[] {
  return getRetiros()
    .filter((r) => r.estado === "proximo")
    .sort((a, b) => (a.fechaInicio ?? a.fecha).localeCompare(b.fechaInicio ?? b.fecha));
}

export function getRetirosPasados(): Retiro[] {
  return getRetiros()
    .filter((r) => r.estado === "pasado")
    .sort((a, b) => (b.fechaInicio ?? b.fecha).localeCompare(a.fechaInicio ?? a.fecha));
}

export function getRetiro(slug: string): Retiro | null {
  return getRetiros().find((r) => r.slug === slug) ?? null;
}

/* ------------------------------------------------------------- Imágenes */

let imagenesCache: Record<string, ImagenMeta> | null = null;

export function getImagenes(): Record<string, ImagenMeta> {
  if (!imagenesCache) imagenesCache = readJson<Record<string, ImagenMeta>>("imagenes.json", {});
  return imagenesCache;
}

/** Metadata for one image path ("/images/..."). Falls back to 3:2 at 1920 px. */
export function getImagen(src: string, altFallback = ""): ImagenMeta & { src: string } {
  const meta = getImagenes()[src];
  return {
    src,
    alt: meta?.alt ?? altFallback,
    width: meta?.width ?? 1920,
    height: meta?.height ?? 1280,
  };
}

/** All images under a public/images folder, e.g. "alimentos". */
export function getImagenesDeCarpeta(folder: string): (ImagenMeta & { src: string })[] {
  const prefix = `/images/${folder}/`;
  return Object.entries(getImagenes())
    .filter(([src]) => src.startsWith(prefix) && !src.slice(prefix.length).includes("/"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([src, meta]) => ({ src, ...meta }));
}

/* -------------------------------------------------------------- Reseñas */

export type Resena = { autor: string; texto: string; fecha?: string; estrellas?: number };

/** Google reviews curated by hand in content/resenas.json (TODO: fill with Bea). */
export function getResenas(): Resena[] {
  return readJson<Resena[]>("resenas.json", []);
}
