import type { SVGProps } from "react";

/**
 * Volcán Laguna line icons. 24 px grid, 1.5 stroke, round caps.
 * Hand-drawn for the brand; no icon library. Keep shapes simple and quiet.
 */

export type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function make(paths: React.ReactNode, filled = false) {
  function IconSvg({ title, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {paths}
      </svg>
    );
  }
  return IconSvg;
}

export const icons = {
  /* ---- Lugar y experiencias ---- */
  laguna: make(
    <>
      <path d="M4 12.5 8.5 6l3 4.2L13.5 8l6 6.5" />
      <path d="M3 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" />
      <path d="M3 20.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" />
    </>,
  ),
  muelle: make(
    <>
      <path d="M3 8h13l5 3" />
      <path d="M3 12h13" />
      <path d="M6 8v8.5M11 8v8.5M16 8v8.5" />
      <path d="M3 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" />
    </>,
  ),
  jacuzzi: make(
    <>
      <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2Z" />
      <path d="M6 19v2M18 19v2" />
      <path d="M8 8.5c0-1.5 1-1.5 1-3M12 8.5c0-1.5 1-1.5 1-3M16 8.5c0-1.5 1-1.5 1-3" />
    </>,
  ),
  kayak: make(
    <>
      <path d="M2 13c4-4.5 16-4.5 20 0-4 4.5-16 4.5-20 0Z" />
      <path d="M10 13h4" />
      <path d="M5 4l3 3M16 17l3 3M8 7l8 10" />
    </>,
  ),
  lancha: make(
    <>
      <path d="M3 13h18l-2.5 5h-13L3 13Z" />
      <path d="M7 13V8h7l3 5" />
      <path d="M10 8V5h3" />
    </>,
  ),
  temazcal: make(
    <>
      <path d="M3 18a9 9 0 0 1 18 0H3Z" />
      <path d="M10 18v-4h4v4" />
      <path d="M9 6c0-1.5 1-1.5 1-3M14 6c0-1.5 1-1.5 1-3" />
    </>,
  ),
  masaje: make(
    <>
      <rect x="6" y="15" width="12" height="4" rx="2" />
      <rect x="7.5" y="10.5" width="9" height="4" rx="2" />
      <rect x="9" y="6" width="6" height="4" rx="2" />
      <path d="M12 2.5v1.5" />
    </>,
  ),
  yoga: make(
    <>
      <circle cx="12" cy="4" r="1.75" />
      <path d="M12 7.5v5.5" />
      <path d="M7.5 11.5 12 13l4.5-1.5" />
      <path d="M5 18.5c1.5-3.5 4.5-5.5 7-5.5s5.5 2 7 5.5" />
      <path d="M5 18.5h14" />
    </>,
  ),
  cocina: make(
    <>
      <path d="M4 12h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-2Z" />
      <path d="M2.5 12h19" />
      <path d="M12 12V8" />
      <path d="M12 8c-3 0-4-2-4-4 2 0 4 1 4 4Z" />
      <path d="M12 8c3 0 4-2 4-4-2 0-4 1-4 4Z" />
    </>,
  ),
  /* ---- Casa ---- */
  recamara: make(
    <>
      <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 15h18" />
      <path d="M6 9V6h12v3" />
      <path d="M3 18v2M21 18v2" />
    </>,
  ),
  bano: make(
    <>
      <path d="M4 21V8a4 4 0 0 1 8 0" />
      <path d="M9 9.5h6" />
      <path d="M12 13v1M12 17v1M9 13v1M9 17v1M15 13v1M15 17v1" />
    </>,
  ),
  estacionamiento: make(
    <>
      <path d="M5 16l1.5-5h11L19 16" />
      <path d="M3 16h18v3H3Z" />
      <path d="M6 19v2M18 19v2" />
      <path d="M7 17.5h.5M16.5 17.5H17" />
    </>,
  ),
  jardin: make(
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c-4 0-6-3-6-7 4 0 6 3 6 7Z" />
      <path d="M12 13c4 0 6-3 6-7-4 0-6 3-6 7Z" />
      <path d="M5 21h14" />
    </>,
  ),
  chimenea: make(
    <>
      <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 1.5-3.5.5 1.5 1.5 2 2.5 2 0-2-1-4 0-7Z" />
      <path d="M5 21h14" />
    </>,
  ),
  asador: make(
    <>
      <path d="M4 9h16a8 8 0 0 1-16 0Z" />
      <path d="M12 17v4M8.5 21l2-4M15.5 21l-2-4" />
      <path d="M8 6c0-1 1-1 1-2.5M12 6c0-1 1-1 1-2.5M16 6c0-1 1-1 1-2.5" />
    </>,
  ),
  limpieza: make(
    <>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75Z" />
      <path d="M19 15l.5 1.5 1.5.5-1.5.5L19 19l-.5-1.5-1.5-.5 1.5-.5Z" />
    </>,
  ),
  alberca: make(
    <>
      <path d="M7 19V5a2 2 0 0 1 4 0v1M17 19V5a2 2 0 0 0-4 0v1" />
      <path d="M7 9h10M7 13h10" />
      <path d="M3 20.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" />
    </>,
  ),
  terraza: make(
    <>
      <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" />
      <path d="M12 3v18M9 21h6" />
      <path d="M12 12v0" />
    </>,
  ),
  vista: make(
    <>
      <circle cx="17" cy="7" r="2.5" />
      <path d="M3 19l6-9 4 6 2-3 6 6" />
      <path d="M3 19h18" />
    </>,
  ),
  /* ---- Contacto y UI ---- */
  whatsapp: make(
    <>
      <path d="M3 21l1.5-4.5A9 9 0 1 1 8 19.5L3 21Z" />
      <path d="M9 8.5c0 4 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1a5 5 0 0 1-3-3l1-1-1-2-1.5 1Z" />
    </>,
  ),
  calendario: make(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
  ),
  personas: make(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.5a5 5 0 0 1 4.5 5.5" />
    </>,
  ),
  ubicacion: make(
    <>
      <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </>,
  ),
  reloj: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  ),
  sinInternet: make(
    <>
      <path d="M3 3l18 18" />
      <path d="M5 10a12 12 0 0 1 4.5-2.7M12 6a12 12 0 0 1 7 4" />
      <path d="M8.5 13.5a7 7 0 0 1 2.5-1.3M15.5 13.5a7 7 0 0 0-1-.8" />
      <path d="M12 18h.01" />
    </>,
  ),
  correo: make(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>,
  ),
  telefono: make(
    <>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </>,
  ),
  menu: make(<path d="M4 7h16M4 12h16M4 17h16" />),
  cerrar: make(<path d="M6 6l12 12M18 6 6 18" />),
  flecha: make(<path d="M5 12h14M13 6l6 6-6 6" />),
  chevron: make(<path d="M6 9l6 6 6-6" />),
  check: make(<path d="M5 12l5 5L20 7" />),
  estrella: make(
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" strokeWidth={0} />,
    true,
  ),
  google: make(
    <>
      <path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3A9 9 0 0 0 21 12.2Z" strokeWidth={0} />
      <path d="M12 21a8.6 8.6 0 0 0 6-2.2l-3-2.3a5.4 5.4 0 0 1-8-2.8H4v2.4A9 9 0 0 0 12 21Z" strokeWidth={0} />
      <path d="M7 13.7a5.4 5.4 0 0 1 0-3.4V7.9H4a9 9 0 0 0 0 8.2l3-2.4Z" strokeWidth={0} />
      <path d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 4 7.9l3 2.4A5.4 5.4 0 0 1 12 6.6Z" strokeWidth={0} />
    </>,
    true,
  ),
} as const;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

/** Amenity key (from content frontmatter) → icon. Unknown keys fall back to "check". */
export const amenityIcon: Record<string, IconName> = {
  laguna: "laguna",
  lago: "laguna",
  muelle: "muelle",
  jacuzzi: "jacuzzi",
  kayak: "kayak",
  kayaks: "kayak",
  lancha: "lancha",
  temazcal: "temazcal",
  masaje: "masaje",
  masajes: "masaje",
  yoga: "yoga",
  cocina: "cocina",
  recamara: "recamara",
  recamaras: "recamara",
  bano: "bano",
  banos: "bano",
  estacionamiento: "estacionamiento",
  jardin: "jardin",
  chimenea: "chimenea",
  asador: "asador",
  limpieza: "limpieza",
  alberca: "alberca",
  terraza: "terraza",
  vista: "vista",
  "sin-internet": "sinInternet",
};

export const amenityLabel: Record<string, string> = {
  laguna: "Acceso a la laguna",
  lago: "Acceso a la laguna",
  muelle: "Muelle privado",
  jacuzzi: "Jacuzzi",
  kayak: "Kayaks",
  kayaks: "Kayaks",
  lancha: "Paseo en lancha",
  temazcal: "Temazcal",
  masaje: "Masajes",
  masajes: "Masajes",
  yoga: "Espacio para yoga",
  cocina: "Cocina equipada",
  recamara: "Recámaras",
  recamaras: "Recámaras",
  bano: "Baños",
  banos: "Baños",
  estacionamiento: "Estacionamiento",
  jardin: "Jardín",
  chimenea: "Chimenea",
  asador: "Asador",
  limpieza: "Limpieza incluida",
  alberca: "Alberca",
  terraza: "Terraza",
  vista: "Vista al lago",
  "sin-internet": "Sin internet",
};
