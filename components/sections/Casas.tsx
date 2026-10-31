import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import type { Casa } from "@/lib/content";
import { getImagen } from "@/lib/content";
import { CasaCard } from "./CasaCard";

export function Casas({ casas, titulo, texto }: { casas: Casa[]; titulo: string; texto?: string }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Las casas" title={titulo} lede={texto} />
        <Button href="/casas" variant="secondary" size="sm" className="hidden sm:inline-flex">
          Ver todas
        </Button>
      </div>

      {/* Phone: horizontal snap row. Tablet+: grid. */}
      <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {casas.map((c, i) => (
          <Reveal as="li" key={c.slug} delay={i * 0.06} className="w-[82%] shrink-0 snap-center sm:w-auto">
            <CasaCard casa={c} alt={getImagen(c.imagenPrincipal, c.nombre).alt} priority={i === 0} className="h-full" />
          </Reveal>
        ))}
      </ul>
      <div className="mt-6 sm:hidden">
        <Button href="/casas" variant="secondary" fullWidth>
          Ver todas las casas
        </Button>
      </div>
    </>
  );
}
