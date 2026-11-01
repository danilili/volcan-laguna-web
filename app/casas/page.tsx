import type { Metadata } from "next";
import { CasaCard } from "@/components/sections/CasaCard";
import { PARA_4 } from "@/components/sections/Casas";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getCasas, getImagen } from "@/lib/content";

export const metadata: Metadata = {
  title: "Casas",
  description: "Casa Santuario, Casa Los Mangos y Casa Moringa: tres casas a la orilla de la laguna, para 4 a 12 personas.",
};

export default function CasasPage() {
  const casas = getCasas();
  const principales = casas.filter((c) => !c.padre);
  const variantes = casas.filter((c) => c.padre);
  const hero = getImagen("/images/general/general-02-lago-desde-el-jardin.jpg", "La laguna desde el jardín");

  return (
    <>
      <PageHero
        eyebrow="Las casas"
        title="Tres casas, una laguna"
        lede="Ven a disfrutar de la laguna de Santa María del Oro en una casa privada, con la tranquilidad y exclusividad de compartir el espacio únicamente con tu grupo."
        image={hero}
      />
      <Section compact>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {principales.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={i * 0.06}>
              <CasaCard casa={c} alt={getImagen(c.imagenPrincipal, c.nombre).alt} priority={i === 0} className="h-full" />
            </Reveal>
          ))}
        </ul>
        {variantes.length ? (
          <>
            <SectionHeading className="mt-14" eyebrow="Entre semana" title={PARA_4.titulo} lede={PARA_4.texto} />
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:max-w-4xl">
              {variantes.map((c, i) => (
                <Reveal as="li" key={c.slug} delay={i * 0.06}>
                  <CasaCard casa={c} alt={getImagen(c.imagenPrincipal, c.nombre).alt} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </>
        ) : null}
      </Section>
    </>
  );
}
