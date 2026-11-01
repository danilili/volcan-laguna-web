import { Suspense } from "react";
import { getFinDeSemanaAbierto } from "@/lib/beds24";
import { isCasaSlug } from "@/lib/beds24/client";
import { cn } from "@/lib/cn";

/**
 * Tag on the "para 4" cards. Default "Lun–jue"; when Beds24 has opened the
 * coming weekend for that variant it becomes "¡Este fin de semana
 * disponible!". The Beds24 read is cached about a minute and streams in
 * behind the default, so the static cards never wait on it.
 */
export function EtiquetaVariante({ slug, className }: { slug: string; className?: string }) {
  return (
    <Suspense fallback={<Etiqueta abierto={false} className={className} />}>
      <EtiquetaEnVivo slug={slug} className={className} />
    </Suspense>
  );
}

async function EtiquetaEnVivo({ slug, className }: { slug: string; className?: string }) {
  const abierto = isCasaSlug(slug) ? await getFinDeSemanaAbierto(slug) : false;
  return <Etiqueta abierto={abierto} className={className} />;
}

function Etiqueta({ abierto, className }: { abierto: boolean; className?: string }) {
  return abierto ? (
    <span className={cn("rounded-pill bg-selva-600 px-2.5 py-1 text-xs font-medium text-crema-50 shadow-float", className)}>¡Este fin de semana disponible!</span>
  ) : (
    <span className={cn("rounded-pill bg-arena-500 px-2.5 py-1 text-xs font-medium text-laguna-950", className)}>Lun–jue</span>
  );
}
