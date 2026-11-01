import type { Metadata } from "next";
import Image from "next/image";
import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Mdx, type MdxOverrides } from "@/components/content/Mdx";
import { Laguna } from "@/components/sections/Laguna";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { getImagen, getPagina, splitSecciones } from "@/lib/content";

export const metadata: Metadata = {
  title: "La laguna",
  description: "La Laguna de Santa María del Oro, Nayarit: un cráter volcánico lleno de agua, a una hora de Tepic. Aves, kayak, caminatas y silencio.",
};

/* One large photo per section of Bea's text, in reading order. */
const FOTOS = [
  { src: "/images/general/general-02-lago-desde-el-jardin.jpg", alt: "La laguna desde el jardín, entre los árboles" },
  { src: "/images/general/general-01-lancha-lago.jpg", alt: "Una lancha llega al muelle de Volcán Laguna" },
  { src: "/images/general/retiros-03-jardin-arboles.jpg", alt: "Los grandes árboles del jardín" },
  { src: "/images/santuario/santuario-10-jardin-noche.jpg", alt: "El jardín de noche, con las luces encendidas" },
];

/** Paragraphs that are only italics become pull quotes. */
function Parrafo({ children }: ComponentProps<"p">) {
  const kids = Children.toArray(children);
  if (kids.length === 1 && isValidElement(kids[0]) && kids[0].type === "em") {
    const em = kids[0] as ReactElement<{ children?: ReactNode }>;
    return (
      <blockquote className="my-8 border-l-2 border-arena-500 pl-5 font-display text-xl leading-snug text-laguna-900 sm:text-2xl">
        {em.props.children}
      </blockquote>
    );
  }
  return <p>{children}</p>;
}

const overrides: MdxOverrides = { p: Parrafo };

export default function LaLagunaPage() {
  const page = getPagina("la-laguna");
  const hero = getImagen("/images/general/general-04-vista-aerea-volcan-laguna.jpg", "Volcán Laguna desde el aire");
  const secciones = page ? splitSecciones(page.body) : [];

  return (
    <>
      <PageHero eyebrow="El lugar" title={page?.titulo ?? "La laguna"} image={hero} size="tall" />

      {secciones.map((s, i) => {
        const foto = FOTOS[i] ? getImagen(FOTOS[i].src, FOTOS[i].alt) : null;
        const fotoDerecha = i % 2 === 1;
        return (
          <Section key={s.titulo ?? "intro"} tone={i % 2 === 0 ? "crema" : "blanco"} compact>
            <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
              {foto ? (
                <Reveal className={cn("lg:col-span-6", fotoDerecha && "lg:order-2")}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card shadow-card">
                    <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" preload={i === 0} />
                  </div>
                </Reveal>
              ) : null}
              <Reveal delay={0.08} className="lg:col-span-6">
                {s.titulo ? <h2 className="text-h2 text-laguna-900">{s.titulo}</h2> : null}
                <Mdx source={s.body} className={cn(s.titulo && "mt-5")} overrides={overrides} />
              </Reveal>
            </div>
          </Section>
        );
      })}

      <Section tone="laguna" compact>
        <Laguna titulo="Qué hacer en la laguna" texto="Lo que se organiza desde la casa, incluido o con costo extra." showLink={false} />
      </Section>

      <Section tone="arena" compact containerSize="narrow">
        <div className="text-center">
          <h2 className="text-h2">¿Nos visitas?</h2>
          <p className="mt-3 text-lede text-ink-500">Tres casas con acceso privado a la laguna, o el terreno completo para tu retiro.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/casas" size="lg">
              Ver las casas
            </Button>
            <Button href="/organiza-tu-retiro" variant="secondary" size="lg">
              Organiza tu retiro
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
