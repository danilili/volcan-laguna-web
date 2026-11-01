import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { getImagen } from "@/lib/content";

type Experiencia = {
  icon: IconName;
  titulo: string;
  texto: string;
  /** Optional photo; without one the card is a plain lagoon-blue tile with a large icon. */
  src?: string;
  costo: "incluido" | "extra";
};

/* The four experiences, confirmed by Bea. */
const experiencias: Experiencia[] = [
  { icon: "laguna", titulo: "Nadar en la laguna", texto: "Agua tibia casi todo el año, desde el muelle.", src: "/images/los-mangos/mangos-08-acceso-al-agua.jpg", costo: "incluido" },
  { icon: "kayak", titulo: "Kayak y paddleboard", texto: "Rema desde el muelle, a tu ritmo.", src: "/images/los-mangos/mangos-04-muelle-lago.jpg", costo: "incluido" },
  { icon: "lancha", titulo: "Paseo en lancha", texto: "La vuelta al cráter, desde el muelle propio.", src: "/images/los-mangos/mangos-06-paseo-en-lancha.jpg", costo: "extra" },
  { icon: "temazcal", titulo: "Temazcal y masajes", texto: "Con previa reserva, en la casa.", costo: "extra" },
];

const etiqueta = {
  incluido: { label: "Incluido", className: "bg-selva-600 text-crema-50" },
  extra: { label: "Costo extra", className: "bg-arena-500 text-laguna-950" },
};

type Props = {
  titulo: string;
  texto?: string;
  /** Hide the "Conoce la laguna" button (e.g. on /la-laguna itself). */
  showLink?: boolean;
};

const card =
  "group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card bg-laguna-900 p-4 text-crema-50 shadow-card sm:aspect-[4/5]";

export function Laguna({ titulo, texto, showLink = true }: Props) {
  return (
    <>
      <SectionHeading eyebrow="La laguna" title={titulo} lede={texto} align="center" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {experiencias.map((e, i) => {
          const img = e.src ? getImagen(e.src, e.titulo) : null;
          const tag = etiqueta[e.costo];
          const inner = (
            <>
              {img ? (
                <>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, 48vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-laguna-950/85 via-laguna-950/20 to-transparent" />
                </>
              ) : (
                <Icon
                  name={e.icon}
                  size={96}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] text-crema-50/25 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
              )}
              <span className={cn("absolute top-3 left-3 rounded-pill px-2.5 py-1 text-[11px] font-medium", tag.className)}>{tag.label}</span>
              <div className="relative">
                <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-pill bg-crema-50/15 backdrop-blur-sm">
                  <Icon name={e.icon} size={22} />
                </span>
                <p className="font-display text-lg leading-tight sm:text-xl">{e.titulo}</p>
                <p className="mt-1 hidden text-sm text-crema-50/80 sm:block">{e.texto}</p>
              </div>
            </>
          );
          return (
            <Reveal as="li" key={e.titulo} delay={i * 0.06}>
              {showLink ? (
                <Link href="/la-laguna" className={card}>
                  {inner}
                </Link>
              ) : (
                <div className={card}>{inner}</div>
              )}
            </Reveal>
          );
        })}
      </ul>
      {showLink ? (
        <div className="mt-6 text-center">
          <Button href="/la-laguna" variant="secondary">
            Conoce la laguna
          </Button>
        </div>
      ) : null}
    </>
  );
}
