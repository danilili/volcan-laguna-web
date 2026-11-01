import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Casa } from "@/lib/content";
import { formatMXN } from "@/lib/format";
import { CasaDatos } from "./CasaDatos";

/**
 * House card. Shows the normal nightly rate (week 2: live price from Beds24;
 * the site never computes prices).
 */
type Props = {
  casa: Casa;
  alt: string;
  className?: string;
  priority?: boolean;
  /**
   * "Para 4" variants only: true when Beds24 has opened this weekend (the
   * full house is still free one week out). Week 2 feeds it; false for now.
   */
  finDeSemanaAbierto?: boolean;
};

export function CasaCard({ casa, alt, className, priority = false, finDeSemanaAbierto = false }: Props) {
  const variante = !!casa.padre;
  return (
    <Link
      href={`/casas/${casa.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card bg-crema-50 shadow-card transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={casa.imagenPrincipal}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 85vw"
          preload={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 left-3 rounded-pill bg-crema-50/90 px-2.5 py-1 text-xs font-medium text-laguna-900 backdrop-blur-sm">
          Hasta {casa.capacidad} personas
        </span>
        {variante ? (
          finDeSemanaAbierto ? (
            <span className="absolute top-3 right-3 rounded-pill bg-selva-600 px-2.5 py-1 text-xs font-medium text-crema-50 shadow-float">
              ¡Este fin de semana disponible!
            </span>
          ) : (
            <span className="absolute top-3 right-3 rounded-pill bg-arena-500 px-2.5 py-1 text-xs font-medium text-laguna-950">
              Lun–jue
            </span>
          )
        ) : null}
      </span>
      <span className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="font-display text-2xl leading-tight text-laguna-900">{casa.nombre}</span>
        <span className="mt-1.5 line-clamp-2 text-sm text-ink-500">{casa.resumen}</span>
        <span className="mt-4 flex items-end justify-between gap-3">
          <CasaDatos capacidad={casa.capacidad} recamaras={casa.recamaras} banos={casa.banos} />
          <span className="text-right">
            <span className="block font-display text-xl text-laguna-900">
              {formatMXN(casa.precioNoche)}
              <span className="font-sans text-xs text-ink-500"> / noche</span>
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
