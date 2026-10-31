/**
 * One-off export of the WordPress staging (Elementor Cloud + MotoPress) to the
 * MDX/JSON files under `content/`.
 *
 * Run with `pnpm export:wp` from the project root. Public REST endpoints only,
 * no authentication, nothing is written to WordPress. The script is
 * idempotent: everything it produces is deleted and regenerated on each run.
 *
 * Output (all content stays in Spanish, code and comments in English):
 *   content/casas/<slug>.mdx           5 houses (MotoPress room types)
 *   content/home.mdx                   Home copy + curated hero/section texts
 *   content/alimentos.mdx              Food page
 *   content/organiza-tu-retiro.mdx     "Organize your retreat" page
 *   content/legal/terminos.mdx         Terms
 *   content/legal/privacidad.mdx       Privacy notice
 *   content/retiros.json               Past/upcoming retreats (posts)
 *   content/retiros-pendientes.json    Retreats without photos / dates
 *   content/imagenes.json              Manifest of every file in public/images
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STAGING = "https://stg-3lf40z.elementor.cloud";
const API = `${STAGING}/wp-json/wp/v2`;
const FETCH_TIMEOUT_MS = 30_000;

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const IMAGES_DIR = path.join(ROOT, "public", "images");

const PAGE_IDS = {
  home: 11,
  alimentos: 254,
  organizaTuRetiro: 1407,
  terminos: 317,
  privacidad: 1546,
} as const;

const CATEGORY_PAST = 104;
const CATEGORY_UPCOMING = 103;
/** Post that is only an editorial example on staging; never migrated. */
const EXCLUDED_POST_IDS = new Set([1374]);

/** Fixed data from CLAUDE.md (prices are MXN per night, Mon–Thu / Fri–Sun). */
interface HouseConfig {
  slug: string;
  nombre: string;
  wpId: number;
  beds24RoomId: number;
  capacidad: number;
  recamaras: number;
  precioDesde: number;
  precioFinDeSemana: number;
  /** Folder under public/images that holds this house's photos. */
  imageDir: string;
  /** Set for the "para 4" variants that share the parent house's photos. */
  parentSlug?: string;
  /** Filename filter used to pick a subset of the parent's gallery. */
  galleryInclude?: RegExp;
}

const HOUSES: HouseConfig[] = [
  {
    slug: "santuario",
    nombre: "Casa Santuario",
    wpId: 1297,
    beds24RoomId: 728650,
    capacidad: 10,
    recamaras: 5,
    precioDesde: 11250,
    precioFinDeSemana: 15000,
    imageDir: "santuario",
  },
  {
    slug: "los-mangos",
    nombre: "Casa Los Mangos",
    wpId: 1299,
    beds24RoomId: 728645,
    capacidad: 12,
    recamaras: 3,
    precioDesde: 5625,
    precioFinDeSemana: 7500,
    imageDir: "los-mangos",
  },
  {
    slug: "moringa",
    nombre: "Casa Moringa",
    wpId: 1338,
    beds24RoomId: 728649,
    capacidad: 6,
    recamaras: 2,
    precioDesde: 2850,
    precioFinDeSemana: 3800,
    imageDir: "moringa",
  },
  {
    slug: "santuario-para-4",
    nombre: "Casa Santuario para 4",
    wpId: 1384,
    beds24RoomId: 728651,
    capacidad: 4,
    recamaras: 2,
    precioDesde: 4500,
    precioFinDeSemana: 6000,
    imageDir: "santuario",
    parentSlug: "santuario",
    // Exterior + shared spaces + main bedroom/bath + one second bedroom.
    galleryInclude:
      /vista-aerea|muelle-privado|jacuzzi-vista|jacuzzi-noche|terraza|comedor-exterior|-sala\.|cocina|recamara-principal|bano-principal|vista-al-lago|-17-recamara\./,
  },
  {
    slug: "los-mangos-para-4",
    nombre: "Casa Los Mangos para 4",
    wpId: 1382,
    beds24RoomId: 728648,
    capacidad: 4,
    recamaras: 2,
    precioDesde: 2550,
    precioFinDeSemana: 3400,
    imageDir: "los-mangos",
    parentSlug: "los-mangos",
    // Skips the bunk-bed room and the second-floor shots that stay closed.
    galleryInclude:
      /vista-aerea-casa|muelle-privado|lago-desde-el-muelle|-jardin\.|terraza-sillas|chimenea|-sala\.|cocina|recamara-principal|-17-recamara\.|-bano\./,
  },
];

/** Canonical amenity keys (order matters: it is the output order). */
const AMENITY_SET = [
  "laguna",
  "muelle",
  "jacuzzi",
  "kayak",
  "lancha",
  "temazcal",
  "masaje",
  "yoga",
  "cocina",
  "recamara",
  "bano",
  "estacionamiento",
  "jardin",
  "chimenea",
  "asador",
  "limpieza",
  "alberca",
  "terraza",
  "vista",
];

/** MotoPress facility term name → amenity key (null = ignore). */
const FACILITY_TO_AMENITY: Record<string, string | null> = {
  "acceso al lago": "laguna",
  "muelle privado": "muelle",
  jacuzzi: "jacuzzi",
  cocina: "cocina",
  estacionamiento: "estacionamiento",
  jardin: "jardin",
  chimenea: "chimenea",
  asador: "asador",
  terraza: "terraza",
  "muebles exteriores": "terraza",
  "vista al lago": "vista",
  "comedor exterior": "comedor-exterior",
  "cama kingsize": "recamara",
  "cama king size": "recamara",
  "cama matrimonial": "recamara",
  pantalla: "pantalla",
  "entrada autonoma": "entrada-autonoma",
  "detector de humo": "detector-de-humo",
  // Kitchen gear collapses into the equipped kitchen.
  cafetera: "cocina",
  especias: "cocina",
  estufa: "cocina",
  "horno tostador": "cocina",
  lavavajillas: "cocina",
  licuadora: "cocina",
  microondas: "cocina",
  refrigerador: "cocina",
};

/** Restores accents on common filename words when generating alt texts. */
const ACCENTED_WORDS: Record<string, string> = {
  aerea: "aérea",
  jardin: "jardín",
  bano: "baño",
  banos: "baños",
  recamara: "recámara",
  recamaras: "recámaras",
  manana: "mañana",
  arboles: "árboles",
  sesion: "sesión",
  meditacion: "meditación",
  relajacion: "relajación",
  circulo: "círculo",
  salon: "salón",
  dia: "día",
  volcan: "volcán",
  pudin: "pudín",
  cafe: "café",
  tortillas: "tortillas",
  cereales: "cereales",
  chia: "chía",
  escaleras: "escaleras",
  buganvilias: "buganvilias",
};

/** Human label per image folder, used for generated alt texts. */
const FOLDER_LABEL: Record<string, string> = {
  santuario: "Casa Santuario",
  "los-mangos": "Casa Los Mangos",
  moringa: "Casa Moringa",
  alimentos: "Alimentos en Volcán Laguna",
  general: "Volcán Laguna",
  "retiro-junio-2026": "Retiro de junio 2026 en Volcán Laguna",
};

/** Staging paths → routes of the new site. Posts and rooms are added at runtime. */
const ROUTE_MAP: Record<string, string> = {
  "/": "/",
  "/home": "/",
  "/alimentos": "/alimentos",
  "/organiza-tu-retiro": "/organiza-tu-retiro",
  "/home/retiros": "/retiros",
  "/retiros": "/retiros",
  "/terminos-y-condiciones": "/legal/terminos",
  "/aviso-de-privacidad": "/legal/privacidad",
  "/our-gallery": "/galeria",
  "/contacto": "/contacto",
  // Old permalink; the staging answers with a 301 to /retiro-soundhealing/.
  "/retiro-junio-2026": "/retiros/retiro-soundhealing",
};

// ---------------------------------------------------------------------------
// WordPress REST types (only the fields we read)
// ---------------------------------------------------------------------------

interface WpRendered {
  rendered: string;
}

interface WpTerm {
  id: number;
  name: string;
  taxonomy: string;
}

interface WpPost {
  id: number;
  slug: string;
  link: string;
  date: string;
  modified: string;
  title: WpRendered;
  content: WpRendered;
  excerpt?: WpRendered;
  featured_media?: number;
  categories?: number[];
  _embedded?: { "wp:term"?: WpTerm[][] };
}

interface WpMedia {
  id: number;
  source_url: string;
  alt_text: string;
  title: WpRendered;
  mime_type?: string;
  media_details?: { width?: number; height?: number };
}

// ---------------------------------------------------------------------------
// Report collected while running
// ---------------------------------------------------------------------------

const report = {
  elementorFallback: [] as string[],
  unresolvedLinks: new Set<string>(),
  unmatchedImages: [] as string[],
  droppedImages: new Set<string>(),
  warnings: [] as string[],
};

function warn(message: string): void {
  report.warnings.push(message);
  console.warn(`  ! ${message}`);
}

// ---------------------------------------------------------------------------
// Fetch helpers (30 s timeout, one retry)
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "user-agent": "volcan-laguna-export/1.0" },
      });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      lastError = error;
      if (attempt === 1) console.warn(`  retrying ${url} (${String(error)})`);
    }
  }
  throw new Error(`Failed to fetch ${url}: ${String(lastError)}`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Pages through a collection endpoint until it returns empty or 400. */
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page < 50; page++) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await fetchWithRetry(`${API}/${endpoint}${sep}per_page=100&page=${page}`);
    if (res.status === 400) break;
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${endpoint} page ${page}`);
    const batch = (await res.json()) as T[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
  }
  return items;
}

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  copy: "©",
  reg: "®",
  trade: "™",
  middot: "·",
  bull: "•",
  deg: "°",
  iexcl: "¡",
  iquest: "¿",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
  Uuml: "Ü",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugify(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Plain text from an HTML fragment (tags removed, entities decoded). */
function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts at a word boundary and appends an ellipsis when needed. */
function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length).replace(/[,;:.\s]+$/, "")}…`;
}

function isoDate(wpDate: string): string {
  return wpDate.slice(0, 10);
}

/**
 * Normalizes a filename for matching disk files against the media library:
 * lower case, no extension, no accents, no `-scaled`, `-1920x1080`, `-e123…`
 * or single-digit `-1` suffixes.
 */
function normalizeImageName(filename: string): string {
  let name = stripAccents(decodeURIComponent(path.basename(filename)).toLowerCase());
  name = name.replace(/\.[a-z0-9]+$/, "");
  let previous = "";
  while (previous !== name) {
    previous = name;
    name = name
      .replace(/-scaled$/, "")
      .replace(/-\d+x\d+$/, "")
      .replace(/-e\d{9,}$/, "")
      .replace(/-\d$/, "");
  }
  return name.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Minimal HTML parser
// ---------------------------------------------------------------------------

interface ElementNode {
  type: "element";
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

interface TextNode {
  type: "text";
  text: string;
}

type HtmlNode = ElementNode | TextNode;

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function parseHtml(html: string): HtmlNode[] {
  const root: ElementNode = { type: "element", tag: "root", attrs: {}, children: [] };
  const stack: ElementNode[] = [root];
  const tokenRe =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;

  let last = 0;
  let match: RegExpExecArray | null;
  const pushText = (text: string) => {
    if (text) stack[stack.length - 1].children.push({ type: "text", text });
  };

  while ((match = tokenRe.exec(html))) {
    if (match.index > last) pushText(html.slice(last, match.index));
    last = tokenRe.lastIndex;

    if (match[0].startsWith("<!")) continue;

    if (match[1]) {
      const tag = match[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const tag = match[2].toLowerCase();
    const element: ElementNode = {
      type: "element",
      tag,
      attrs: parseAttributes(match[3] ?? ""),
      children: [],
    };
    stack[stack.length - 1].children.push(element);

    if (tag === "script" || tag === "style") {
      // Raw text elements: swallow everything up to the closing tag.
      const close = html.indexOf(`</${tag}`, last);
      if (close >= 0) {
        tokenRe.lastIndex = close;
        last = close;
      }
      continue;
    }

    if (!VOID_TAGS.has(tag) && !match[4]) stack.push(element);
  }
  if (last < html.length) pushText(html.slice(last));
  return root.children;
}

function classList(node: ElementNode): string {
  return node.attrs.class ?? "";
}

function hasClass(node: ElementNode, pattern: RegExp): boolean {
  return pattern.test(classList(node));
}

function findAll(nodes: HtmlNode[], predicate: (node: ElementNode) => boolean): ElementNode[] {
  const found: ElementNode[] = [];
  const walk = (list: HtmlNode[]) => {
    for (const node of list) {
      if (node.type !== "element") continue;
      if (predicate(node)) {
        found.push(node);
        continue;
      }
      walk(node.children);
    }
  };
  walk(nodes);
  return found;
}

// ---------------------------------------------------------------------------
// HTML → Markdown
// ---------------------------------------------------------------------------

interface ConvertOptions {
  /** Keep inline images (rewritten to local /images paths). */
  images?: boolean;
  /** Elements whose class matches any of these are dropped with their subtree. */
  dropClasses?: RegExp[];
}

interface RenderContext extends Required<ConvertOptions> {
  inListItem: boolean;
}

const DROP_TAGS = new Set([
  "script",
  "style",
  "svg",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "iframe",
  "noscript",
  "video",
  "audio",
  "template",
  "canvas",
]);

const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "div",
  "section",
  "article",
  "main",
  "aside",
  "header",
  "footer",
  "nav",
  "figure",
  "figcaption",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "details",
  "summary",
  "hr",
  "pre",
  "address",
  "dl",
  "dt",
  "dd",
]);

/** Local path lookup shared by the converter: normalized image name → /images/... */
let imageIndex = new Map<string, string>();
/** Staging path → new route; filled with posts and rooms at runtime. */
const routeMap: Record<string, string> = { ...ROUTE_MAP };

function escapeMdx(text: string): string {
  return text.replace(/[{}]/g, (m) => `\\${m}`).replace(/<(?=[a-zA-Z/!?])/g, "\\<");
}

function inlineText(text: string): string {
  return escapeMdx(decodeEntities(text).replace(/\s+/g, " "));
}

function rewriteHref(href: string): string | null {
  if (!href || href === "#") return null;
  if (href.startsWith("#")) return null;
  let url: URL;
  try {
    url = new URL(href, STAGING);
  } catch {
    return href;
  }
  if (url.origin !== STAGING) return href;
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (/\/wp-content\/uploads\//.test(pathname)) {
    const local = imageIndex.get(normalizeImageName(pathname));
    if (local) return local;
    report.droppedImages.add(path.basename(pathname));
    return null;
  }
  if (routeMap[pathname]) return routeMap[pathname] + url.hash;
  report.unresolvedLinks.add(pathname);
  return pathname + url.hash;
}

function localImage(src: string): { src: string; alt: string } | null {
  const local = imageIndex.get(normalizeImageName(src.split("?")[0]));
  if (!local) {
    report.droppedImages.add(path.basename(src));
    return null;
  }
  return { src: local, alt: "" };
}

function renderInline(nodes: HtmlNode[], ctx: RenderContext): string {
  let out = "";
  for (const node of nodes) {
    if (node.type === "text") {
      out += inlineText(node.text);
      continue;
    }
    if (DROP_TAGS.has(node.tag)) continue;
    if (ctx.dropClasses.some((re) => hasClass(node, re))) continue;

    switch (node.tag) {
      case "br":
        out += ctx.inListItem ? " — " : "  \n";
        break;
      case "img": {
        if (!ctx.images) break;
        const image = localImage(node.attrs.src ?? "");
        if (image) out += `![${inlineText(node.attrs.alt ?? "")}](${image.src})`;
        break;
      }
      case "strong":
      case "b": {
        const inner = renderInline(node.children, ctx).trim();
        if (inner) out += ` **${inner}** `;
        break;
      }
      case "em":
      case "i": {
        if (/\bfa[srlb]?\b|\bfa-/.test(classList(node))) break; // Font Awesome icon
        const inner = renderInline(node.children, ctx).trim();
        if (inner) out += ` *${inner}* `;
        break;
      }
      case "code": {
        const inner = renderInline(node.children, ctx).trim();
        if (inner) out += `\`${inner}\``;
        break;
      }
      case "a": {
        const inner = renderInline(node.children, ctx).trim();
        if (!inner) break;
        const href = rewriteHref(node.attrs.href ?? "");
        const isButton = /wp-block-button__link|wp-element-button/.test(classList(node));
        if (!href) {
          // Buttons pointing nowhere ("#", anchors to removed forms) disappear;
          // other dead links keep their text.
          if (!isButton) out += inner;
          break;
        }
        out += `[${inner}](${href})`;
        break;
      }
      default:
        out += renderInline(node.children, ctx);
    }
  }
  return out;
}

function headingLevel(tag: string): number {
  // No H1 in bodies: the page title is rendered by the layout.
  const level = Number(tag[1]);
  return Math.min(Math.max(level, 2), 4);
}

function renderListItem(node: ElementNode, ctx: RenderContext, depth: number, marker: string): string[] {
  const inlineNodes: HtmlNode[] = [];
  const nested: ElementNode[] = [];
  for (const child of node.children) {
    if (child.type === "element" && (child.tag === "ul" || child.tag === "ol")) nested.push(child);
    else inlineNodes.push(child);
  }
  const itemCtx: RenderContext = { ...ctx, inListItem: true };
  const text = cleanInline(renderInline(inlineNodes, itemCtx)).replace(/\s*\n\s*/g, " ");
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  if (text) lines.push(`${indent}${marker} ${text}`);
  for (const list of nested) lines.push(...renderList(list, ctx, depth + (text ? 1 : 0)));
  return lines;
}

function renderList(node: ElementNode, ctx: RenderContext, depth: number): string[] {
  const ordered = node.tag === "ol";
  const lines: string[] = [];
  let index = 0;
  for (const child of node.children) {
    if (child.type !== "element") continue;
    if (child.tag !== "li") {
      // Tolerate stray wrappers inside lists.
      lines.push(...renderBlocks([child], ctx));
      continue;
    }
    index += 1;
    lines.push(...renderListItem(child, ctx, depth, ordered ? `${index}.` : "-"));
  }
  return lines;
}

function cleanInline(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/ +([,.;:!?)])/g, "$1")
    .replace(/\( +/g, "(")
    .trim();
}

function renderTable(node: ElementNode, ctx: RenderContext): string[] {
  const rows = findAll(node.children, (n) => n.tag === "tr");
  const lines: string[] = [];
  for (const row of rows) {
    const cells = row.children
      .filter((c): c is ElementNode => c.type === "element" && (c.tag === "td" || c.tag === "th"))
      .map((cell) => cleanInline(renderInline(cell.children, { ...ctx, inListItem: true })))
      .filter(Boolean);
    if (!cells.length) continue;
    const [first, ...rest] = cells;
    const label = /^\*\*.*\*\*$/.test(first) ? first : `**${first}**`;
    lines.push(rest.length ? `- ${label} — ${rest.join(" · ")}` : `- ${label}`);
  }
  return lines;
}

function renderBlocks(nodes: HtmlNode[], ctx: RenderContext): string[] {
  const blocks: string[] = [];
  let pending: HtmlNode[] = [];

  const flush = () => {
    if (!pending.length) return;
    const text = cleanInline(renderInline(pending, ctx));
    pending = [];
    if (text) blocks.push(text);
  };

  for (const node of nodes) {
    if (node.type === "text") {
      pending.push(node);
      continue;
    }
    if (DROP_TAGS.has(node.tag)) continue;
    if (ctx.dropClasses.some((re) => hasClass(node, re))) continue;

    if (!BLOCK_TAGS.has(node.tag)) {
      pending.push(node);
      continue;
    }
    flush();

    const cls = classList(node);
    switch (node.tag) {
      case "p": {
        // Getwid "advanced heading" paragraphs are decorative eyebrow kickers
        // ("A LA ORILLA DE LA LAGUNA"); the new design has no place for them.
        if (/wp-block-getwid-advanced-heading__content/.test(cls)) break;
        const text = cleanInline(renderInline(node.children, ctx));
        if (text) blocks.push(text);
        break;
      }
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const text = cleanInline(renderInline(node.children, ctx)).replace(/\s*\n\s*/g, " ");
        if (text) blocks.push(`${"#".repeat(headingLevel(node.tag))} ${text}`);
        break;
      }
      case "ul":
      case "ol":
        blocks.push(renderList(node, ctx, 0).join("\n"));
        break;
      case "li":
        blocks.push(renderListItem(node, ctx, 0, "-").join("\n"));
        break;
      case "blockquote": {
        const inner = renderBlocks(node.children, ctx).join("\n\n");
        if (inner) blocks.push(inner.replace(/^/gm, "> "));
        break;
      }
      case "table":
        blocks.push(renderTable(node, ctx).join("\n"));
        break;
      case "details": {
        for (const child of node.children) {
          if (child.type === "element" && child.tag === "summary") {
            const text = cleanInline(renderInline(child.children, ctx));
            if (text) blocks.push(`### ${text}`);
          } else blocks.push(...renderBlocks([child], ctx));
        }
        break;
      }
      case "summary":
      case "dt": {
        const text = cleanInline(renderInline(node.children, ctx));
        if (text) blocks.push(`### ${text}`);
        break;
      }
      case "hr":
        blocks.push("---");
        break;
      case "figcaption": {
        const text = cleanInline(renderInline(node.children, ctx));
        if (text) blocks.push(`*${text}*`);
        break;
      }
      case "pre": {
        const text = decodeEntities(node.children.map((c) => (c.type === "text" ? c.text : "")).join(""));
        if (text.trim()) blocks.push(`\`\`\`\n${text.replace(/\n$/, "")}\n\`\`\``);
        break;
      }
      default: {
        // Generic containers (div/section/figure/…) plus a few Getwid blocks.
        if (/wp-block-getwid-testimonial\b/.test(cls)) {
          blocks.push(renderTestimonial(node, ctx));
          break;
        }
        if (/wp-block-getwid-icon-box\b/.test(cls)) {
          const text = renderBlocks(node.children, ctx).join(" ").trim();
          if (text) blocks.push(`- ${text}`);
          break;
        }
        if (/wp-block-getwid-accordion__header\b/.test(cls)) {
          const text = cleanInline(renderInline(node.children, ctx));
          if (text) blocks.push(`### ${text}`);
          break;
        }
        blocks.push(...renderBlocks(node.children, ctx));
      }
    }
  }
  flush();
  return blocks.filter(Boolean);
}

function renderTestimonial(node: ElementNode, ctx: RenderContext): string {
  const content = findAll(node.children, (n) => /wp-block-getwid-testimonial__content\b/.test(classList(n)));
  const title = findAll(node.children, (n) => /wp-block-getwid-testimonial__title\b/.test(classList(n)));
  const subtitle = findAll(node.children, (n) => /wp-block-getwid-testimonial__subtitle\b/.test(classList(n)));
  const quote = content.map((n) => cleanInline(renderInline(n.children, ctx))).filter(Boolean).join("\n\n");
  const meta = [...title, ...subtitle]
    .map((n) => cleanInline(renderInline(n.children, ctx)))
    .filter(Boolean)
    .join(" · ");
  const lines = quote ? [quote] : [];
  if (meta) lines.push(`— ${meta}`);
  return lines.join("\n\n").replace(/^/gm, "> ");
}

/**
 * Joins the rendered blocks. Consecutive list items produced by icon boxes
 * are glued into one list; everything else is separated by a blank line.
 */
function joinBlocks(blocks: string[]): string {
  let out = "";
  for (const block of blocks) {
    if (!out) {
      out = block;
      continue;
    }
    const prevIsItem = /(^|\n)- [^\n]*$/.test(out);
    const isItem = /^- /.test(block);
    out += prevIsItem && isItem ? `\n${block}` : `\n\n${block}`;
  }
  return out;
}

/** Removes headings that have nothing under them (e.g. an image-only gallery). */
function removeEmptyHeadings(markdown: string): string {
  const lines = markdown.split("\n");
  const keep: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^(#{2,6}) /.exec(line);
    if (heading) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const next = lines[j];
      const nextHeading = next ? /^(#{2,6}) /.exec(next) : null;
      const isEmpty = j >= lines.length || (nextHeading !== null && nextHeading[1].length <= heading[1].length);
      if (isEmpty) continue;
    }
    keep.push(line);
  }
  return keep.join("\n");
}

function stripShortcodes(html: string): string {
  return html.replace(/\[\/?[a-zA-Z][\w-]*(?:\s[^\]]*)?\]/g, "");
}

function htmlToMarkdown(html: string, options: ConvertOptions = {}): string {
  const ctx: RenderContext = {
    images: options.images ?? true,
    dropClasses: options.dropClasses ?? [],
    inListItem: false,
  };
  const nodes = parseHtml(stripShortcodes(html));
  const markdown = joinBlocks(renderBlocks(nodes, ctx));
  return removeEmptyHeadings(markdown)
    .replace(/[ \t]+\n/g, (m) => (m.startsWith("  ") ? "  \n" : "\n"))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Elementor pages often return an empty `content.rendered`. In that case we
 * read the public page and convert the Elementor widgets in document order.
 */
async function elementorFallback(slug: string, options: ConvertOptions): Promise<string> {
  const html = await fetchText(`${STAGING}/${slug}/`);
  const nodes = parseHtml(html);
  const widgets = findAll(nodes, (n) => /elementor-widget-(heading|text-editor|icon-list)\b/.test(classList(n)));
  const ctx: RenderContext = {
    images: options.images ?? true,
    dropClasses: options.dropClasses ?? [],
    inListItem: false,
  };
  const blocks = widgets.flatMap((widget) => renderBlocks(widget.children, ctx));
  report.elementorFallback.push(slug);
  return removeEmptyHeadings(joinBlocks(blocks)).replace(/\n{3,}/g, "\n\n").trim();
}

async function contentToMarkdown(post: WpPost, options: ConvertOptions = {}): Promise<string> {
  const html = post.content.rendered;
  const text = htmlToText(stripShortcodes(html.replace(/<style[\s\S]*?<\/style>/g, "")));
  if (text.length >= 40) return htmlToMarkdown(html, options);
  warn(`"${post.slug}" has no usable content.rendered; using the public page (Elementor fallback).`);
  return elementorFallback(post.slug, options);
}

// ---------------------------------------------------------------------------
// YAML frontmatter
// ---------------------------------------------------------------------------

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

function isPlainObject(value: unknown): value is Record<string, YamlValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function yamlScalar(value: YamlValue): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const text = String(value);
  const plain =
    /^[A-Za-z0-9][A-Za-z0-9_/.-]*$/.test(text) &&
    !/^(true|false|null|yes|no|on|off|y|n|~)$/i.test(text) &&
    !/^[\d.]+$/.test(text);
  return plain ? text : JSON.stringify(text);
}

function toYamlLines(value: YamlValue, indent = 0): string[] {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}[]`];
    return value.flatMap((item) => {
      if (isPlainObject(item) || Array.isArray(item)) {
        const lines = toYamlLines(item, indent + 2);
        lines[0] = `${pad}- ${lines[0].trimStart()}`;
        return lines;
      }
      return [`${pad}- ${yamlScalar(item)}`];
    });
  }
  if (isPlainObject(value)) {
    const lines: string[] = [];
    for (const [key, item] of Object.entries(value)) {
      if (Array.isArray(item) && !item.length) lines.push(`${pad}${key}: []`);
      else if (isPlainObject(item) || Array.isArray(item)) {
        lines.push(`${pad}${key}:`);
        lines.push(...toYamlLines(item, indent + 2));
      } else lines.push(`${pad}${key}: ${yamlScalar(item)}`);
    }
    return lines;
  }
  return [`${pad}${yamlScalar(value)}`];
}

function frontmatter(data: Record<string, YamlValue>, comments: Record<string, string> = {}): string {
  const lines = toYamlLines(data).map((line) => {
    const key = /^([A-Za-z0-9_]+):/.exec(line)?.[1];
    return key && comments[key] ? `${line} # ${comments[key]}` : line;
  });
  return `---\n${lines.join("\n")}\n---\n`;
}

// ---------------------------------------------------------------------------
// Image manifest (public/images/**)
// ---------------------------------------------------------------------------

interface ImageEntry {
  alt: string;
  width: number;
  height: number;
  /** true when the alt came from the staging media library */
  altFromStaging: boolean;
}

interface DiskImage {
  absolute: string;
  /** Public URL path, e.g. /images/santuario/x.jpg */
  publicPath: string;
  /** Folder relative to public/images, e.g. retiros/bihanafit */
  folder: string;
  key: string;
}

function walkImages(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkImages(full));
    else if (/\.(jpe?g|png|webp|gif|avif)$/i.test(entry.name)) files.push(full);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function listDiskImages(): DiskImage[] {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return walkImages(IMAGES_DIR).map((absolute) => {
    const relative = path.relative(IMAGES_DIR, absolute).split(path.sep).join("/");
    return {
      absolute,
      publicPath: `/images/${relative}`,
      folder: path.posix.dirname(relative),
      key: normalizeImageName(relative),
    };
  });
}

/** Reads width/height from JPEG (SOF) or PNG (IHDR) headers. */
function readDimensionsFromHeader(file: string): { width: number; height: number } | null {
  const buffer = fs.readFileSync(file);
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      if (marker === 0xd9 || marker === 0xda) break;
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/** macOS `sips` fallback for formats the header reader does not cover. */
function readDimensionsWithSips(files: string[]): Map<string, { width: number; height: number }> {
  const result = new Map<string, { width: number; height: number }>();
  if (!files.length) return result;
  try {
    const output = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", ...files], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    let current: string | null = null;
    let width = 0;
    let height = 0;
    for (const line of output.split("\n")) {
      if (!line.startsWith(" ")) {
        if (current && width && height) result.set(current, { width, height });
        current = line.trim() || null;
        width = 0;
        height = 0;
      } else if (/pixelWidth:/.test(line)) width = Number(line.split(":")[1]);
      else if (/pixelHeight:/.test(line)) height = Number(line.split(":")[1]);
    }
    if (current && width && height) result.set(current, { width, height });
  } catch (error) {
    warn(`sips failed: ${String(error)}`);
  }
  return result;
}

function titleFromFilename(file: DiskImage): string {
  const base = path.basename(file.publicPath).replace(/\.[a-z0-9]+$/i, "");
  const folderTokens = new Set(file.folder.split("/").flatMap((f) => f.split("-")));
  const tokens = base
    .split("-")
    .filter((t) => t && !/^\d+$/.test(t))
    .filter((t, i) => !(i === 0 && (folderTokens.has(t) || t === "mangos" || t === "retiros" || t === "retiro")))
    .filter((t) => !(t === "junio" && file.folder === "retiro-junio-2026"));
  const phrase = tokens
    .map((t) => ACCENTED_WORDS[t] ?? t)
    .join(" ")
    .trim();
  return phrase ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : "";
}

function generatedAlt(file: DiskImage, retreatTitles: Map<string, string>): string {
  const phrase = titleFromFilename(file);
  const [top, sub] = file.folder.split("/");
  let label = FOLDER_LABEL[file.folder] ?? FOLDER_LABEL[top] ?? "Volcán Laguna";
  if (top === "retiros" && sub) {
    const title = retreatTitles.get(sub) ?? sub.split("-").map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");
    label = `retiro ${title} en Volcán Laguna`;
  }
  if (!phrase) return label.charAt(0).toUpperCase() + label.slice(1);
  if (top === "retiros") {
    const n = /-(\d+)\.[a-z]+$/i.exec(file.publicPath)?.[1];
    return `${label.charAt(0).toUpperCase() + label.slice(1)}${n ? ` — foto ${Number(n)}` : ""}`;
  }
  return `${phrase}, ${label}`;
}

function buildImageManifest(
  disk: DiskImage[],
  mediaByKey: Map<string, WpMedia>,
  retreatTitles: Map<string, string>,
): Record<string, ImageEntry> {
  const manifest: Record<string, ImageEntry> = {};
  const needSips: string[] = [];
  const dimensions = new Map<string, { width: number; height: number }>();

  for (const file of disk) {
    const dims = readDimensionsFromHeader(file.absolute);
    if (dims) dimensions.set(file.absolute, dims);
    else needSips.push(file.absolute);
  }
  for (const [file, dims] of readDimensionsWithSips(needSips)) dimensions.set(file, dims);

  for (const file of disk) {
    const media = mediaByKey.get(file.key);
    const stagingAlt = media?.alt_text?.trim() ?? "";
    if (!media) report.unmatchedImages.push(file.publicPath);
    const dims = dimensions.get(file.absolute);
    if (!dims) warn(`Could not read dimensions of ${file.publicPath}`);
    manifest[file.publicPath] = {
      alt: stagingAlt || generatedAlt(file, retreatTitles),
      width: dims?.width ?? 0,
      height: dims?.height ?? 0,
      altFromStaging: Boolean(stagingAlt),
    };
  }
  return manifest;
}

// ---------------------------------------------------------------------------
// Houses
// ---------------------------------------------------------------------------

function facilityNames(room: WpPost): string[] {
  const groups = room._embedded?.["wp:term"] ?? [];
  return groups.flat().filter((t) => t.taxonomy === "mphb_room_type_facility").map((t) => t.name);
}

function deriveAmenities(room: WpPost, plainText: string): string[] {
  const keys = new Set<string>();
  for (const name of facilityNames(room)) {
    const normalized = stripAccents(name.toLowerCase()).trim();
    const mapped = FACILITY_TO_AMENITY[normalized];
    if (mapped === null) continue;
    if (mapped) keys.add(mapped);
    else {
      const key = slugify(name);
      warn(`Unknown facility "${name}" on ${room.slug}; added as "${key}".`);
      keys.add(key);
    }
  }
  const text = stripAccents(plainText.toLowerCase());
  const textHints: Array<[RegExp, string]> = [
    [/\bjacuzzi\b/, "jacuzzi"],
    [/\bmuelle\b/, "muelle"],
    [/\blago\b|\blaguna\b/, "laguna"],
    [/\bchimenea\b/, "chimenea"],
    [/\basador\b/, "asador"],
    [/\bestacionamiento\b/, "estacionamiento"],
    [/\bjardin\b/, "jardin"],
    [/\bterraza\b/, "terraza"],
    [/\bcocina\b/, "cocina"],
    [/\brecamara/, "recamara"],
    [/\bbano/, "bano"],
    [/\bvista al lago\b|\bse ve el lago\b|\bse ve la laguna\b/, "vista"],
    [/\bkayak\b/, "kayak"],
    [/\blancha\b/, "lancha"],
    [/\btemazcal\b/, "temazcal"],
    [/\bmasaje/, "masaje"],
    [/\byoga\b/, "yoga"],
    [/\balberca\b/, "alberca"],
    [/\blimpieza\b/, "limpieza"],
  ];
  for (const [re, key] of textHints) if (re.test(text)) keys.add(key);
  // Every house has bedrooms and bathrooms even when the copy does not say so.
  keys.add("recamara");
  keys.add("bano");

  const ordered = AMENITY_SET.filter((k) => keys.has(k));
  const extras = [...keys].filter((k) => !AMENITY_SET.includes(k)).sort();
  return [...ordered, ...extras];
}

function parseBathrooms(html: string): number | null {
  const text = stripAccents(htmlToText(html).toLowerCase());
  const explicit = /(\d+(?:[.,]\d+)?)\s+banos?\b/.exec(text);
  if (explicit) return Number(explicit[1].replace(",", "."));
  // Otherwise count the private/full baths listed under "Dónde vas a dormir".
  const own = sleepingItems(html).filter((item) => /bano (propio|completo)/.test(stripAccents(item.toLowerCase()))).length;
  return own || null;
}

/** Text of each <li> inside the "Dónde vas a dormir" block (or the whole content). */
function sleepingItems(html: string): string[] {
  const section = /<div class="vl-dormir">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? html;
  return findAll(parseHtml(section), (n) => n.tag === "li").map((li) => htmlToText(li.children.map(nodeToHtml).join("")));
}

function parseBedrooms(html: string): number | null {
  const bedrooms = sleepingItems(html).filter((item) => /^(recamara|segunda recamara|primera recamara)/i.test(stripAccents(item)));
  return bedrooms.length || null;
}

function parseCapacity(plainText: string): number | null {
  const match = /m[aá]ximo\s+(\d+)\s+hu[eé]spedes/i.exec(plainText);
  return match ? Number(match[1]) : null;
}

/** Serializes a parsed node back to HTML (used for small sub-fragments). */
function nodeToHtml(node: HtmlNode): string {
  if (node.type === "text") return node.text;
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => ` ${k}="${v.replace(/"/g, "&quot;")}"`)
    .join("");
  if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrs}>`;
  return `<${node.tag}${attrs}>${node.children.map(nodeToHtml).join("")}</${node.tag}>`;
}

interface HouseOutput {
  slug: string;
  banosTodo: boolean;
  gallery: number;
  filledFromBrief: string[];
}

async function exportHouses(
  rooms: WpPost[],
  disk: DiskImage[],
  manifest: Record<string, ImageEntry>,
  mediaById: Map<number, WpMedia>,
): Promise<HouseOutput[]> {
  const outDir = path.join(CONTENT_DIR, "casas");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const results: HouseOutput[] = [];
  for (const house of HOUSES) {
    const room = rooms.find((r) => r.id === house.wpId);
    if (!room) {
      warn(`Room type ${house.wpId} (${house.slug}) not found on staging; skipped.`);
      continue;
    }
    const html = room.content.rendered;
    const plain = htmlToText(html);
    const filledFromBrief: string[] = [];

    const capacity = parseCapacity(plain) ?? (filledFromBrief.push("capacidad"), house.capacidad);
    if (capacity !== house.capacidad) warn(`${house.slug}: staging capacity ${capacity} differs from brief ${house.capacidad}; using staging.`);
    const bedrooms = parseBedrooms(html) ?? (filledFromBrief.push("recamaras"), house.recamaras);
    if (bedrooms !== house.recamaras) warn(`${house.slug}: staging bedrooms ${bedrooms} differs from brief ${house.recamaras}; using staging.`);
    const bathrooms = parseBathrooms(html);
    filledFromBrief.push("precioDesde", "precioFinDeSemana", "beds24RoomId");

    const body = await contentToMarkdown(room, { images: false });
    const excerpt = htmlToText(room.excerpt?.rendered ?? "");
    const summary = truncate(excerpt || plain, 140);

    const folderFiles = disk.filter((f) => f.folder === house.imageDir);
    const galleryFiles = house.galleryInclude
      ? folderFiles.filter((f) => house.galleryInclude!.test(path.basename(f.publicPath)))
      : folderFiles;

    const featured = room.featured_media ? mediaById.get(room.featured_media) : undefined;
    const featuredLocal = featured ? imageIndex.get(normalizeImageName(featured.source_url)) : undefined;
    const mainImage = featuredLocal && galleryFiles.some((f) => f.publicPath === featuredLocal)
      ? featuredLocal
      : galleryFiles[0]?.publicPath ?? "";
    if (!featuredLocal) warn(`${house.slug}: featured image not matched locally; using first gallery photo.`);

    const data: Record<string, YamlValue> = {
      slug: house.slug,
      nombre: house.nombre,
      wpId: house.wpId,
      beds24RoomId: house.beds24RoomId,
      capacidad: capacity,
      recamaras: bedrooms,
      banos: bathrooms ?? 0,
      precioDesde: house.precioDesde,
      precioFinDeSemana: house.precioFinDeSemana,
      resumen: summary,
      imagenPrincipal: mainImage,
      amenidades: deriveAmenities(room, plain),
      galeria: galleryFiles.map((f) => ({ src: f.publicPath, alt: manifest[f.publicPath]?.alt ?? "" })),
    };
    const comments: Record<string, string> = {};
    if (bathrooms === null) comments.banos = "TODO: no aparece en el staging; confirmar con Bea";
    else if (house.parentSlug) comments.banos = "TODO: solo los baños mencionados en el texto; confirmar con Bea";

    let mdx = frontmatter(data, comments);
    if (house.parentSlug) {
      mdx += `\n{/* TODO: el staging usa la misma galería que ${house.nombre.replace(" para 4", "")}; aquí va un subconjunto elegido por nombre de archivo. Revisar con Bea qué fotos corresponden a las dos recámaras que se abren. */}\n`;
    }
    mdx += `\n${body}\n`;
    fs.writeFileSync(path.join(outDir, `${house.slug}.mdx`), mdx);
    routeMap[`/accommodation/${room.slug}`] = `/casas/${house.slug}`;
    results.push({ slug: house.slug, banosTodo: bathrooms === null, gallery: galleryFiles.length, filledFromBrief });
    console.log(`  casas/${house.slug}.mdx (${galleryFiles.length} fotos)`);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

async function exportPage(
  page: WpPost,
  outFile: string,
  options: ConvertOptions,
  fallbackSummary: string,
): Promise<void> {
  const body = await contentToMarkdown(page, options);
  const excerpt = htmlToText(page.excerpt?.rendered ?? "");
  const data: Record<string, YamlValue> = {
    titulo: htmlToText(page.title.rendered),
    resumen: truncate(excerpt || fallbackSummary || htmlToText(page.content.rendered), 140),
    wpId: page.id,
    actualizado: isoDate(page.modified),
  };
  const target = path.join(CONTENT_DIR, outFile);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${frontmatter(data)}\n${body}\n`);
  console.log(`  ${outFile}`);
}

/** Site tagline from the public Home header (theme "site description"). */
async function fetchHeroPhrase(): Promise<{ phrase: string; fromStaging: boolean }> {
  try {
    const html = await fetchText(`${STAGING}/`);
    const match = /class="[^"]*site-description[^"]*"[^>]*>([^<]{5,120})</.exec(html);
    const phrase = match ? htmlToText(match[1]) : "";
    if (phrase && phrase.length <= 60) return { phrase, fromStaging: true };
  } catch (error) {
    warn(`Could not read the public Home: ${String(error)}`);
  }
  return { phrase: "La laguna te recibe", fromStaging: false };
}

/**
 * Short texts for the Home sections. The brief caps every Home block at two
 * lines (~120 characters), so these are condensed from the staging copy
 * (Home slider, Getwid sections, "Organiza tu retiro" and the fixed data in
 * CLAUDE.md) rather than exported verbatim.
 */
const HOME_SECTIONS: Record<string, { titulo: string; texto: string }> = {
  somos: {
    titulo: "Somos tres casas frente a la laguna",
    texto: "Para familias, grupos de amigos y retiros de hasta 28 personas. Se rentan completas, por separado o juntas.",
  },
  casas: {
    titulo: "Nuestras casas",
    texto: "Casa Santuario, Casa Los Mangos y Casa Moringa: cocina equipada, jardín, terraza y acceso privado al agua.",
  },
  laguna: {
    titulo: "Qué hacer en el lago",
    texto: "Un lago dentro de un cráter, con agua tibia casi todo el año: nadar, pasear en lancha o no hacer nada.",
  },
  retiros: {
    titulo: "Retiros",
    texto: "Retiros holísticos dentro del cráter de una laguna volcánica, lejos de la rutina. Organiza el tuyo aquí.",
  },
  alimentos: {
    titulo: "Alimentos",
    texto: "Cocina basada en plantas hecha aquí mismo, solo para huéspedes y retiros. Eliges tus platillos antes de llegar.",
  },
  resenas: {
    titulo: "Lo que dicen nuestros huéspedes",
    texto: "4.9 ★ en Google (27 reseñas): vistas a la laguna, rincones bellos y los sonidos de la naturaleza.",
  },
  mapa: {
    titulo: "Cómo llegar",
    texto: "Paseo de la Rivera, La Laguna, Santa María del Oro, Nayarit. A menos de una hora de Tepic; conviene venir en auto.",
  },
};

const HOME_SUBTITLE =
  "Tres casas a la orilla de la Laguna de Santa María del Oro, cada una con acceso privado al agua.";

async function exportHome(page: WpPost): Promise<{ fraseHero: string; heroFromStaging: boolean }> {
  for (const [key, section] of Object.entries(HOME_SECTIONS)) {
    if (section.texto.length > 120) throw new Error(`HOME_SECTIONS.${key}.texto exceeds 120 characters`);
  }
  const hero = await fetchHeroPhrase();
  const body = await contentToMarkdown(page, {
    images: false,
    dropClasses: [/\bmphb-/, /wp-block-getwid-map\b/, /wp-block-spacer\b/],
  });
  const data: Record<string, YamlValue> = {
    titulo: "Volcán Laguna",
    fraseHero: hero.phrase,
    subtituloHero: HOME_SUBTITLE,
    secciones: HOME_SECTIONS,
    wpId: page.id,
    actualizado: isoDate(page.modified),
  };
  const comments: Record<string, string> = {};
  if (!hero.fromStaging) comments.fraseHero = "TODO: propuesta; el Home del staging no tiene frase hero";
  fs.writeFileSync(path.join(CONTENT_DIR, "home.mdx"), `${frontmatter(data, comments)}\n${body}\n`);
  console.log("  home.mdx");
  return { fraseHero: hero.phrase, heroFromStaging: hero.fromStaging };
}

// ---------------------------------------------------------------------------
// Retreats
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Finds "del 9 al 12 de octubre de 2026" / "del 30 de abril al 3 de mayo de 2027". */
function parseDateRange(text: string, fallbackYear: number): { start: string; end: string } | null {
  const t = stripAccents(text.toLowerCase());
  const month = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
  let m = new RegExp(`(\\d{1,2})\\s+de\\s+${month}\\s+(?:al|a|hasta el|-|–)\\s+(\\d{1,2})\\s+de\\s+${month}(?:\\s+(?:de|del)\\s+(\\d{4}))?`).exec(t);
  if (m) {
    const year = Number(m[5] ?? fallbackYear);
    return {
      start: `${year}-${pad2(MONTHS[m[2]])}-${pad2(Number(m[1]))}`,
      end: `${year}-${pad2(MONTHS[m[4]])}-${pad2(Number(m[3]))}`,
    };
  }
  m = new RegExp(`(\\d{1,2})\\s+(?:al|a|hasta el|-|–|y)\\s+(\\d{1,2})\\s+de\\s+${month}(?:\\s+(?:de|del)\\s+(\\d{4}))?`).exec(t);
  if (m) {
    const year = Number(m[4] ?? fallbackYear);
    const mm = pad2(MONTHS[m[3]]);
    return { start: `${year}-${mm}-${pad2(Number(m[1]))}`, end: `${year}-${mm}-${pad2(Number(m[2]))}` };
  }
  return null;
}

interface RetreatImage {
  src: string;
  alt: string;
}

interface Retreat {
  wpId: number;
  slug: string;
  titulo: string;
  estado: "pasado" | "proximo";
  fecha: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  resumen: string;
  contenido: string;
  imagenes: RetreatImage[];
}

function uploadNamesIn(html: string): string[] {
  const names = new Set<string>();
  const re = /wp-content\/uploads\/[^"'\s)]+\.(?:jpe?g|png|webp)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) names.add(normalizeImageName(m[0]));
  return [...names];
}

/** Picks the local folder for a retreat: by the images its post embeds, else by slug tokens. */
function matchRetreatFolder(post: WpPost, disk: DiskImage[], folders: string[]): string | null {
  const byKey = new Map(disk.map((f) => [f.key, f.folder]));
  const votes = new Map<string, number>();
  for (const key of uploadNamesIn(post.content.rendered)) {
    const folder = byKey.get(key);
    if (folder && folders.includes(folder)) votes.set(folder, (votes.get(folder) ?? 0) + 1);
  }
  if (votes.size) return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const stop = new Set(["retiro", "retiros", "con", "de", "del", "la", "el", "en", "y", "para"]);
  const slugTokens = new Set(post.slug.split("-").filter((t) => !stop.has(t)));
  let best: { folder: string; matched: number; total: number } | null = null;
  for (const folder of folders) {
    const tokens = path.posix.basename(folder).split("-").filter((t) => !stop.has(t));
    const matched = tokens.filter((t) => slugTokens.has(t)).length;
    if (!matched || matched !== tokens.length) continue;
    if (!best || matched > best.matched || (matched === best.matched && tokens.length < best.total)) {
      best = { folder, matched, total: tokens.length };
    }
  }
  return best?.folder ?? null;
}

function exportRetreats(
  posts: Array<{ post: WpPost; estado: Retreat["estado"] }>,
  disk: DiskImage[],
  manifest: Record<string, ImageEntry>,
): { retreats: Retreat[]; sinFotos: string[]; sinFechas: string[] } {
  const folders = [...new Set(disk.filter((f) => /^retiros\/|^retiro-/.test(f.folder)).map((f) => f.folder))];
  const retreats: Retreat[] = [];
  const sinFotos: string[] = [];
  const sinFechas: string[] = [];

  for (const { post, estado } of posts) {
    const title = htmlToText(post.title.rendered);
    const plain = htmlToText(stripShortcodes(post.content.rendered));
    const year = Number(post.date.slice(0, 4));
    const range = parseDateRange(`${title}. ${plain.slice(0, 800)}`, year);
    if (!range) sinFechas.push(post.slug);

    const folder = matchRetreatFolder(post, disk, folders);
    const images: RetreatImage[] = folder
      ? disk.filter((f) => f.folder === folder).map((f) => ({ src: f.publicPath, alt: manifest[f.publicPath]?.alt ?? "" }))
      : [];
    if (!folder) sinFotos.push(post.slug);

    const contenido = htmlToMarkdown(post.content.rendered, {
      images: false,
      dropClasses: [/wp-block-buttons\b/, /wp-block-gallery\b/],
    });
    const excerpt = htmlToText(post.excerpt?.rendered ?? "");

    retreats.push({
      wpId: post.id,
      slug: post.slug,
      titulo: title,
      estado,
      fecha: post.date,
      fechaInicio: range?.start ?? null,
      fechaFin: range?.end ?? null,
      resumen: truncate(excerpt || plain, 160),
      contenido,
      imagenes: images,
    });
    routeMap[new URL(post.link).pathname.replace(/\/+$/, "")] = `/retiros/${post.slug}`;
    console.log(`  retiro ${post.slug} [${estado}] ${images.length} fotos${range ? ` ${range.start}→${range.end}` : ""}`);
  }

  retreats.sort((a, b) => (a.fechaInicio ?? a.fecha).localeCompare(b.fechaInicio ?? b.fecha) * -1);
  return { retreats, sinFotos, sinFechas };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function cleanOutputs(): void {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.rmSync(path.join(CONTENT_DIR, "casas"), { recursive: true, force: true });
  for (const file of [
    "home.mdx",
    "alimentos.mdx",
    "organiza-tu-retiro.mdx",
    "legal/terminos.mdx",
    "legal/privacidad.mdx",
    "retiros.json",
    "retiros-pendientes.json",
    "imagenes.json",
  ]) {
    fs.rmSync(path.join(CONTENT_DIR, file), { force: true });
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    throw new Error("Run this script from the project root (pnpm export:wp).");
  }
  console.log(`Exporting ${STAGING} → ${path.relative(ROOT, CONTENT_DIR)}/`);
  cleanOutputs();

  // 1. Fetch everything we need from the staging.
  console.log("Fetching staging…");
  const [rooms, pages, pastPosts, upcomingPosts, media] = await Promise.all([
    fetchJson<WpPost[]>(`${API}/mphb_room_type?per_page=20&_embed`),
    fetchJson<WpPost[]>(`${API}/pages?include=${Object.values(PAGE_IDS).join(",")}&per_page=20`),
    fetchJson<WpPost[]>(`${API}/posts?categories=${CATEGORY_PAST}&per_page=30`),
    fetchJson<WpPost[]>(`${API}/posts?categories=${CATEGORY_UPCOMING}&per_page=30`),
    fetchAllPages<WpMedia>("media"),
  ]);
  console.log(`  ${rooms.length} room types, ${pages.length} pages, ${pastPosts.length} past posts, ${upcomingPosts.length} upcoming posts, ${media.length} media items`);

  const pageById = new Map(pages.map((p) => [p.id, p]));
  for (const [name, id] of Object.entries(PAGE_IDS)) {
    if (!pageById.has(id)) throw new Error(`Page ${id} (${name}) not found on staging`);
  }

  const mediaByKey = new Map<string, WpMedia>();
  for (const item of media) {
    const key = normalizeImageName(item.source_url);
    if (!mediaByKey.has(key)) mediaByKey.set(key, item);
  }
  const mediaById = new Map(media.map((m) => [m.id, m]));

  // 2. Disk images → shared index used to rewrite staging URLs.
  const disk = listDiskImages();
  imageIndex = new Map(disk.map((f) => [f.key, f.publicPath]));
  console.log(`  ${disk.length} files in public/images`);

  // Retreat titles help the generated alt texts for retiros/<folder>.
  const retreatPosts = [
    ...pastPosts.map((post) => ({ post, estado: "pasado" as const })),
    ...upcomingPosts.map((post) => ({ post, estado: "proximo" as const })),
  ].filter(({ post }) => {
    if (EXCLUDED_POST_IDS.has(post.id)) {
      console.log(`  skipping example post ${post.id} (${post.slug})`);
      return false;
    }
    return true;
  });
  const retreatFolders = [...new Set(disk.filter((f) => f.folder.startsWith("retiros/")).map((f) => f.folder))];
  const retreatTitles = new Map<string, string>();
  for (const { post } of retreatPosts) {
    const folder = matchRetreatFolder(post, disk, retreatFolders);
    if (folder) retreatTitles.set(path.posix.basename(folder), htmlToText(post.title.rendered));
  }

  // 3. Image manifest.
  console.log("Building imagenes.json…");
  const manifest = buildImageManifest(disk, mediaByKey, retreatTitles);
  const manifestOut: Record<string, { alt: string; width: number; height: number }> = {};
  for (const [key, entry] of Object.entries(manifest)) {
    manifestOut[key] = { alt: entry.alt, width: entry.width, height: entry.height };
  }
  fs.writeFileSync(path.join(CONTENT_DIR, "imagenes.json"), `${JSON.stringify(manifestOut, null, 2)}\n`);

  // 4. Houses (also registers /accommodation/* routes for link rewriting).
  console.log("Writing casas…");
  const houses = await exportHouses(rooms, disk, manifest, mediaById);

  // 5. Retreats (registers post routes too).
  console.log("Writing retiros.json…");
  const { retreats, sinFotos, sinFechas } = exportRetreats(retreatPosts, disk, manifest);
  fs.writeFileSync(path.join(CONTENT_DIR, "retiros.json"), `${JSON.stringify(retreats, null, 2)}\n`);
  fs.writeFileSync(
    path.join(CONTENT_DIR, "retiros-pendientes.json"),
    `${JSON.stringify({ sinFotos, sinFechas, excluidos: [...EXCLUDED_POST_IDS] }, null, 2)}\n`,
  );

  // 6. Pages.
  console.log("Writing pages…");
  const home = await exportHome(pageById.get(PAGE_IDS.home)!);
  await exportPage(pageById.get(PAGE_IDS.alimentos)!, "alimentos.mdx", { images: true }, "");
  await exportPage(
    pageById.get(PAGE_IDS.organizaTuRetiro)!,
    "organiza-tu-retiro.mdx",
    { images: true, dropClasses: [/\bvlf-(ok|js|form)\b/, /\bvlf\b/] },
    "",
  );
  await exportPage(pageById.get(PAGE_IDS.terminos)!, "legal/terminos.mdx", { images: false }, "");
  await exportPage(pageById.get(PAGE_IDS.privacidad)!, "legal/privacidad.mdx", { images: false }, "");

  // 7. Summary.
  const withStagingAlt = Object.values(manifest).filter((e) => e.altFromStaging).length;
  console.log("\nDone.");
  console.log(`  casas: ${houses.length} (baños TODO: ${houses.filter((h) => h.banosTodo).map((h) => h.slug).join(", ") || "none"})`);
  console.log(`  retiros: ${retreats.filter((r) => r.estado === "pasado").length} pasados, ${retreats.filter((r) => r.estado === "proximo").length} próximos`);
  console.log(`  retiros sin fotos: ${sinFotos.join(", ") || "none"}; sin fechas: ${sinFechas.join(", ") || "none"}`);
  console.log(`  imágenes: ${disk.length} (alt del staging: ${withStagingAlt}, alt generado: ${disk.length - withStagingAlt})`);
  console.log(`  fraseHero: "${home.fraseHero}" ${home.heroFromStaging ? "(staging)" : "(TODO, propuesta)"}`);
  console.log(`  Elementor fallback: ${report.elementorFallback.join(", ") || "none"}`);
  if (report.unmatchedImages.length) console.log(`  sin match en medios: ${report.unmatchedImages.join(", ")}`);
  if (report.droppedImages.size) console.log(`  imágenes del staging sin archivo local (omitidas): ${[...report.droppedImages].join(", ")}`);
  if (report.unresolvedLinks.size) console.log(`  links internos sin ruta nueva: ${[...report.unresolvedLinks].join(", ")}`);
  if (report.warnings.length) console.log(`  warnings: ${report.warnings.length}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
