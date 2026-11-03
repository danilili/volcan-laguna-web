import Image from "next/image";
import Link from "next/link";
import { CasaDatos } from "@/components/sections/CasaDatos";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Busqueda, EstadoResultado, Resultado } from "@/lib/busqueda";
import { cn } from "@/lib/cn";
import { getImagen } from "@/lib/content";
import { formatDateLong, formatMXN, plural } from "@/lib/format";
import { buildConfirmarUrl } from "@/lib/reserva";
import { whatsappUrl } from "@/lib/site";

/** Why a house cannot be booked, in the visitor's words. */
function motivo(estado: EstadoResultado, r: Resultado): string {
  switch (estado) {
    case "capacidad":
      return `Recibe hasta ${plural(r.casa.capacidad, "persona", "personas")}.`;
    case "ocupada":
      return "Ocupada en esas fechas.";
    case "fin-de-semana":
      return "Este fin de semana aún no se abre para 4 personas: se abre una semana antes, si la casa completa sigue libre.";
    case "minimo":
      return `En esas fechas pide una estancia mínima de ${plural(r.minStay ?? 0, "noche", "noches")}.`;
    default:
      return "No disponible en esas fechas.";
  }
}

export function buildReservaUrl(r: Resultado, b: Busqueda): string {
  const q = new URLSearchParams({ casa: r.slug, arrival: b.arrival, departure: b.departure, personas: String(b.personas) });
  return `/reservar?${q}`;
}

export function ResultadoCasa({ r, busqueda, destacada = false }: { r: Resultado; busqueda: Busqueda; destacada?: boolean }) {
  const img = getImagen(r.casa.imagenPrincipal, r.casa.nombre);
  const disponible = r.estado === "disponible" && r.total !== null;
  const fechas = `del ${formatDateLong(busqueda.arrival)} al ${formatDateLong(busqueda.departure)}`;
  const personas = plural(busqueda.personas, "persona", "personas");

  return (
    <article
      className={cn(
        "grid overflow-hidden rounded-card bg-crema-50 shadow-card sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
        !disponible && "opacity-90",
        destacada && "ring-2 ring-arena-500",
      )}
    >
      <Link href={`/casas/${r.casa.slug}`} className="relative block aspect-[4/3] sm:aspect-auto sm:min-h-[220px]" aria-label={`Ver ${r.casa.nombre}`}>
        <Image src={img.src} alt={img.alt} fill sizes="(min-width: 640px) 40vw, 100vw" className={cn("object-cover", !disponible && "grayscale-[0.4]")} />
        <span
          className={cn(
            "absolute top-3 left-3 rounded-pill px-2.5 py-1 text-xs font-medium",
            disponible ? "bg-selva-600 text-crema-50" : "bg-crema-50/90 text-ink-700",
          )}
        >
          {disponible ? "Disponible" : r.estado === "fin-de-semana" ? "Aún no se abre" : "No disponible"}
        </span>
      </Link>

      <div className="flex flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div>
            <h3 className="font-display text-2xl leading-tight text-laguna-900">{r.casa.nombre}</h3>
            <CasaDatos capacidad={r.casa.capacidad} recamaras={r.casa.recamaras} banos={r.casa.banos} className="mt-1.5" />
          </div>
          {disponible ? (
            <p className="text-right">
              <span className="block font-display text-3xl leading-none text-laguna-900">{formatMXN(r.total!)}</span>
              <span className="mt-1 block text-xs text-ink-500">
                total · {plural(busqueda.noches, "noche", "noches")}
              </span>
            </p>
          ) : null}
        </div>

        {disponible ? (
          <p className="mt-3 text-sm text-ink-700">
            Casa completa para tu grupo {fechas}. Entrada 13:00, salida 15:00.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-700">{motivo(r.estado, r)}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {disponible ? (
            <>
              <Button href={buildConfirmarUrl({ casa: r.slug, arrival: busqueda.arrival, departure: busqueda.departure, personas: busqueda.personas })} size="sm">
                Reservar <Icon name="flecha" size={18} />
              </Button>
              <Button
                href={whatsappUrl(`Hola, quiero reservar ${r.casa.nombre} ${fechas} para ${personas}. Total ${formatMXN(r.total!)}.`)}
                variant="whatsapp"
                size="sm"
              >
                <Icon name="whatsapp" size={18} /> Por WhatsApp
              </Button>
              <Button href={buildReservaUrl(r, busqueda)} variant="ghost" size="sm">
                <Icon name="calendario" size={18} /> Calendario
              </Button>
            </>
          ) : r.estado === "fin-de-semana" ? (
            <>
              <Button
                href={whatsappUrl(`Hola, me interesa ${r.casa.nombre} ${fechas} para ${personas}. ¿Me avisan si se abre el fin de semana?`)}
                variant="whatsapp"
                size="sm"
              >
                <Icon name="whatsapp" size={18} /> Avísenme si se abre
              </Button>
              <Button href={buildReservaUrl(r, busqueda)} variant="secondary" size="sm">
                Ver calendario
              </Button>
            </>
          ) : (
            <Button href={buildReservaUrl(r, busqueda)} variant="secondary" size="sm">
              <Icon name="calendario" size={18} /> Ver otras fechas
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
