import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import type { Retiro } from "@/lib/content";
import { getImagen } from "@/lib/content";
import { formatDateRange } from "@/lib/format";

export function Retiros({ titulo, texto, proximo }: { titulo: string; texto?: string; proximo: Retiro | null }) {
  const foto = getImagen("/images/general/retiros-05-muelle-ceremonia-atardecer.jpg", "Ceremonia al atardecer en el muelle de Volcán Laguna");
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <Reveal className="relative aspect-[4/3] overflow-hidden rounded-card shadow-card lg:order-2">
        <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        {proximo ? (
          <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-pill bg-crema-50/92 px-3 py-1.5 text-sm text-laguna-900 backdrop-blur-sm">
            <Icon name="calendario" size={16} className="text-arena-600" />
            Próximo: {proximo.fechaInicio ? formatDateRange(proximo.fechaInicio, proximo.fechaFin) : "fecha por confirmar"}
          </span>
        ) : null}
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-500">Retiros</p>
        <h2 className="text-h2">{titulo}</h2>
        {texto ? <p className="mt-3 max-w-md text-lede text-laguna-100">{texto}</p> : null}
        {proximo ? (
          <p className="mt-4 text-crema-50/90">
            <span className="font-display text-xl">{proximo.titulo}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/retiros">Ver retiros</Button>
          <Button href="/organiza-tu-retiro" variant="inverse">
            Organiza el tuyo
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
