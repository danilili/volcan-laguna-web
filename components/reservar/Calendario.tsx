import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { addDays, dayOfWeek, type DiaCalendario } from "@/lib/beds24/client";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/**
 * Availability calendar for one house, straight from Beds24's calendar
 * (availability and minimum stay; prices only appear in a quote). Every day
 * is a link, so the visitor can pick arrival and departure without JS: first
 * click sets the arrival, the next one the departure.
 */

export type Seleccion = { arrival: string | null; departure: string | null };

type Props = {
  nombre: string;
  /** Nights from Beds24 covering every month in `meses` (from today on). */
  noches: DiaCalendario[];
  /** Months to draw, as YYYY-MM. */
  meses: string[];
  hoy: string;
  seleccion: Seleccion;
  /** Builds the href for a day click, given the new selection. */
  hrefFor: (s: Seleccion) => string;
  /** Hrefs for the month navigation (null = disabled). */
  mesAnterior: string | null;
  mesSiguiente: string | null;
};

const DIAS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function nombreMes(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function diasDelMes(ym: string): string[] {
  const [y, m] = ym.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
}

export function Calendario({ nombre, noches, meses, hoy, seleccion, hrefFor, mesAnterior, mesSiguiente }: Props) {
  const porFecha = new Map(noches.map((n) => [n.fecha, n]));
  const { arrival, departure } = seleccion;
  const eligiendoSalida = Boolean(arrival && !departure);

  // With an arrival chosen, departures run up to the first taken night (that morning is still a valid checkout).
  let maxSalida: string | null = null;
  if (eligiendoSalida && arrival) {
    for (let d = addDays(arrival, 1); ; d = addDays(d, 1)) {
      const n = porFecha.get(d);
      if (!n) {
        maxSalida = d;
        break;
      }
      if (!n.disponible) {
        maxSalida = d;
        break;
      }
    }
  }

  function celda(fecha: string) {
    const n = porFecha.get(fecha);
    const pasado = fecha < hoy;
    const esLlegada = fecha === arrival;
    const esSalida = fecha === departure;
    const enEstancia = Boolean(arrival && departure && fecha > arrival && fecha < departure);
    const disponible = Boolean(n?.disponible);
    const dia = Number(fecha.slice(8));
    const minStay = n?.minStay ?? null;
    const minimoAlto = disponible && minStay !== null && minStay > site.minNights;

    let href: string | null = null;
    if (!pasado) {
      if (eligiendoSalida && arrival && fecha > arrival && maxSalida && fecha <= maxSalida) href = hrefFor({ arrival, departure: fecha });
      else if (disponible && !esLlegada) href = hrefFor({ arrival: fecha, departure: null });
      else if (disponible && esLlegada && departure) href = hrefFor({ arrival: fecha, departure: null });
    }

    const base = "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm tabular-nums";
    const estilo = pasado
      ? "text-ink-300"
      : esLlegada || esSalida
        ? "bg-laguna-800 font-medium text-crema-50"
        : enEstancia
          ? "bg-arena-100 text-laguna-900"
          : disponible
            ? "bg-crema-50 text-ink-900 shadow-[inset_0_0_0_1px_var(--color-crema-300)]"
            : "bg-crema-200/70 text-ink-300 line-through decoration-ink-300/70";
    const contenido = (
      <>
        <span>{dia}</span>
        {minimoAlto && !esLlegada && !esSalida ? <span className="text-[9px] leading-none text-arena-700">mín. {minStay}</span> : null}
        {fecha === hoy ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-arena-500" aria-hidden /> : null}
      </>
    );
    const etiqueta = `${dia} de ${nombreMes(fecha.slice(0, 7))}${pasado ? "" : disponible ? ", disponible" : ", ocupado"}`;

    return href ? (
      <Link key={fecha} href={href} scroll={false} aria-label={etiqueta} className={cn(base, estilo, "transition-colors hover:bg-arena-300/60 hover:text-laguna-900")}>
        {contenido}
      </Link>
    ) : (
      <span key={fecha} aria-label={etiqueta} className={cn(base, estilo)}>
        {contenido}
      </span>
    );
  }

  return (
    <div className="rounded-card bg-crema-50 p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-arena-600">Disponibilidad</p>
          <h3 className="font-display text-2xl text-laguna-900">{nombre}</h3>
        </div>
        <p className="text-sm text-ink-500">
          {eligiendoSalida ? "Ahora elige la salida." : arrival && departure ? "Cambia la llegada tocando otro día." : "Toca el día de llegada."}
        </p>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {meses.map((ym, i) => {
          const dias = diasDelMes(ym);
          const offset = (dayOfWeek(dias[0]) + 6) % 7; // Monday first
          return (
            <section key={ym} aria-label={nombreMes(ym)}>
              <div className="flex items-center justify-between">
                {i === 0 ? (
                  <NavMes href={mesAnterior} dir="prev" />
                ) : (
                  <span className="h-9 w-9" />
                )}
                <h4 className="font-display text-lg capitalize text-laguna-900">{nombreMes(ym)}</h4>
                {i === meses.length - 1 ? <NavMes href={mesSiguiente} dir="next" /> : <span className="h-9 w-9" />}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-500">
                {DIAS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: offset }, (_, k) => (
                  <span key={`pad-${k}`} />
                ))}
                {dias.map(celda)}
              </div>
            </section>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-500">
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-crema-50 shadow-[inset_0_0_0_1px_var(--color-crema-300)]" /> Disponible
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-crema-200" /> Ocupado
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-laguna-800" /> Tu llegada y salida
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="text-[10px] text-arena-700">mín. 7</span> estancia mínima en esa noche
        </li>
      </ul>
    </div>
  );
}

function NavMes({ href, dir }: { href: string | null; dir: "prev" | "next" }) {
  const label = dir === "prev" ? "Mes anterior" : "Mes siguiente";
  const cls = "inline-flex h-9 w-9 items-center justify-center rounded-pill border border-crema-300 text-laguna-800";
  if (!href) return <span className={cn(cls, "opacity-30")} aria-hidden />;
  return (
    <Link href={href} scroll={false} aria-label={label} className={cn(cls, "hover:bg-laguna-800/5")}>
      <Icon name="chevron" size={18} className={dir === "prev" ? "rotate-90" : "-rotate-90"} />
    </Link>
  );
}
