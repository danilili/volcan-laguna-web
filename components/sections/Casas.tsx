import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import type { Casa } from "@/lib/content";
import { getImagen } from "@/lib/content";
import { CasaCard } from "./CasaCard";

export const PARA_4 = {
  titulo: "Para 4 personas · de lunes a jueves",
  texto:
    "Una recámara principal y una más, con el muelle y el jardín para ustedes. Los fines de semana estas opciones se abren solo una semana antes, cuando la casa completa sigue libre.",
};

/* Phone: horizontal snap row. Tablet+: grid. */
const row = "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:overflow-visible sm:px-0";
const item = "w-[82%] shrink-0 snap-center sm:w-auto";

export function Casas({ casas, variantes = [], titulo, texto }: { casas: Casa[]; variantes?: Casa[]; titulo: string; texto?: string }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Las casas" title={titulo} lede={texto} />
        <Button href="/casas" variant="secondary" size="sm" className="hidden sm:inline-flex">
          Ver todas
        </Button>
      </div>

      <ul className={`${row} mt-8 sm:grid-cols-2 lg:grid-cols-3`}>
        {casas.map((c, i) => (
          <Reveal as="li" key={c.slug} delay={i * 0.06} className={item}>
            <CasaCard casa={c} alt={getImagen(c.imagenPrincipal, c.nombre).alt} priority={i === 0} className="h-full" />
          </Reveal>
        ))}
      </ul>

      {variantes.length ? (
        <>
          <SectionHeading className="mt-12" eyebrow="Entre semana" title={PARA_4.titulo} lede={PARA_4.texto} />
          <ul className={`${row} mt-6 sm:grid-cols-2 lg:max-w-4xl`}>
            {variantes.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.06} className={item}>
                <CasaCard casa={c} alt={getImagen(c.imagenPrincipal, c.nombre).alt} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-6 sm:hidden">
        <Button href="/casas" variant="secondary" fullWidth>
          Ver todas las casas
        </Button>
      </div>
    </>
  );
}
