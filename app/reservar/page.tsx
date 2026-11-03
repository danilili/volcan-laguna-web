import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Calendario, diasDelMes, type Seleccion } from "@/components/reservar/Calendario";
import { ResultadoCasa } from "@/components/reservar/ResultadoCasa";
import { CasaDatos } from "@/components/sections/CasaDatos";
import { DateBar } from "@/components/sections/DateBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getCalendario } from "@/lib/beds24";
import { daysBetween, hoyISO, isBeds24Configured, type CasaSlug } from "@/lib/beds24/client";
import { buscarCasas, parseBusqueda, type BusquedaParse, type Resultado } from "@/lib/busqueda";
import { getCasa, getCasas, getImagen } from "@/lib/content";
import { formatDateRange, plural } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reservar",
  description: "Elige tus fechas y consulta la disponibilidad y el precio de las casas de Volcán Laguna en tiempo real.",
};

type SearchParams = PageProps<"/reservar">["searchParams"];

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

async function leer(searchParams: SearchParams): Promise<BusquedaParse & { mes: string | null }> {
  // Everything below depends on today's date and the query: render at request time.
  await connection();
  const sp = await searchParams;
  const parsed = parseBusqueda({ arrival: first(sp.arrival), departure: first(sp.departure), personas: first(sp.personas), casa: first(sp.casa) });
  const mes = first(sp.mes);
  return { ...parsed, mes: mes && /^\d{4}-\d{2}$/.test(mes) ? mes : null };
}

/* ------------------------------------------------------------------ page */

export default function ReservarPage({ searchParams }: PageProps<"/reservar">) {
  const hero = getImagen("/images/santuario/santuario-02-muelle-privado-lago.jpg", "Muelle privado al lago");
  return (
    <>
      <PageHero eyebrow="Reservar" title="Elige tus fechas" lede="Disponibilidad y precio en tiempo real, directo de nuestro sistema de reservas." image={hero}>
        <Suspense fallback={null}>
          <CasaElegida searchParams={searchParams} />
        </Suspense>
      </PageHero>
      <Section compact>
        <Suspense fallback={<DateBar accion="Buscar" />}>
          <Buscador searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Cargando />}>
          <Resultados searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  );
}

async function CasaElegida({ searchParams }: { searchParams: SearchParams }) {
  const { casa } = await leer(searchParams);
  const c = casa ? getCasa(casa) : null;
  if (!c) return null;
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-pill bg-crema-50/12 px-3 py-1.5 text-sm">
      <Icon name="check" size={16} className="text-arena-500" /> {c.nombre}
    </p>
  );
}

async function Buscador({ searchParams }: { searchParams: SearchParams }) {
  const { arrival, departure, personas, casa } = await leer(searchParams);
  return <DateBar accion="Buscar" defaults={{ arrival, departure, personas, casa }} />;
}

function Cargando() {
  return (
    <div className="mt-8 space-y-4" aria-busy="true" aria-label="Consultando disponibilidad">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-card bg-crema-200/60" />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- results */

async function Resultados({ searchParams }: { searchParams: SearchParams }) {
  const q = await leer(searchParams);
  const hoy = hoyISO();

  if (q.errores.length) {
    return (
      <div className="mt-6 rounded-card border border-arena-300 bg-arena-100 p-4 text-sm text-arena-700">
        <ul className="list-disc space-y-1 pl-5">
          {q.errores.map((e) => (
            <li key={e.campo + e.mensaje}>{e.mensaje}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!isBeds24Configured()) return <SinBeds24 />;

  // No dates yet: pick a house, then its calendar.
  if (!q.busqueda) {
    return (
      <>
        {q.casa ? (
          <div className="mt-8">
            <CalendarioCasa casa={q.casa} seleccion={{ arrival: q.arrival, departure: null }} personas={q.personas} mes={q.mes} hoy={hoy} />
          </div>
        ) : null}
        <OpcionesCasa actual={q.casa} personas={q.personas} />
      </>
    );
  }

  const b = q.busqueda;
  let resultados: Resultado[];
  try {
    resultados = await buscarCasas(b);
  } catch (e) {
    console.error("[reservar]", e);
    return <SinBeds24 />;
  }
  const disponibles = resultados.filter((r) => r.estado === "disponible");
  const resto = resultados.filter((r) => r.estado !== "disponible");

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-arena-600">
            {formatDateRange(b.arrival, b.departure)} · {plural(b.noches, "noche", "noches")} · {plural(b.personas, "persona", "personas")}
          </p>
          <h2 className="mt-1 text-h3">
            {disponibles.length === 0
              ? "No hay casas libres en esas fechas"
              : disponibles.length === 1
                ? "Una casa disponible"
                : `${disponibles.length} casas disponibles`}
          </h2>
        </div>
        <p className="text-sm text-ink-500">Precios totales de nuestro sistema de reservas, en pesos mexicanos.</p>
      </div>

      {disponibles.length ? (
        <ul className="mt-5 space-y-4">
          {disponibles.map((r) => (
            <li key={r.slug}>
              <ResultadoCasa r={r} busqueda={b} destacada={r.slug === b.casa} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-card bg-crema-50 p-5 shadow-card">
          <p className="text-ink-700">Prueba otras fechas en el calendario o escríbenos: a veces podemos acomodar llegadas y salidas.</p>
          <Button href={whatsappUrl(`Hola, busco casa ${formatDateRange(b.arrival, b.departure)} para ${plural(b.personas, "persona", "personas")}. ¿Qué opciones hay?`)} variant="whatsapp" size="sm" className="mt-4">
            <Icon name="whatsapp" size={18} /> Preguntar por WhatsApp
          </Button>
        </div>
      )}

      {b.casa ? (
        <div className="mt-10">
          <CalendarioCasa casa={b.casa} seleccion={{ arrival: b.arrival, departure: b.departure }} personas={b.personas} mes={q.mes} hoy={hoy} />
        </div>
      ) : null}

      {resto.length ? (
        <>
          <h2 className="mt-10 text-h3">Las demás casas en esas fechas</h2>
          <ul className="mt-4 space-y-4">
            {resto.map((r) => (
              <li key={r.slug}>
                <ResultadoCasa r={r} busqueda={b} destacada={r.slug === b.casa} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function SinBeds24() {
  return (
    <div className="mt-8 rounded-card bg-crema-50 p-5 shadow-card">
      <p className="text-ink-700">No pudimos consultar la disponibilidad en este momento. Escríbenos y te confirmamos fechas y precio al instante.</p>
      <Button href={whatsappUrl("Hola, quiero reservar en Volcán Laguna.")} variant="whatsapp" size="sm" className="mt-4">
        <Icon name="whatsapp" size={18} /> Reservar por WhatsApp
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------- calendar */

const MESES_VISIBLES = 2;

function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

function sumarMeses(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function CalendarioCasa({ casa, seleccion, personas, mes, hoy }: { casa: CasaSlug; seleccion: Seleccion; personas: number; mes: string | null; hoy: string }) {
  const ficha = getCasa(casa);
  if (!ficha) return null;

  const mesActual = mesDe(hoy);
  let inicio = mes ?? (seleccion.arrival ? mesDe(seleccion.arrival) : mesActual);
  if (inicio < mesActual) inicio = mesActual;
  const meses = Array.from({ length: MESES_VISIBLES }, (_, i) => sumarMeses(inicio, i));
  const desde = diasDelMes(meses[0])[0] < hoy ? hoy : diasDelMes(meses[0])[0];
  const hasta = diasDelMes(meses[meses.length - 1]).at(-1)!;

  let noches: Awaited<ReturnType<typeof getCalendario>> = [];
  try {
    noches = daysBetween(desde, hasta) >= 0 ? await getCalendario(casa, desde, hasta) : [];
  } catch (e) {
    console.error("[reservar] calendario", e);
    return <SinBeds24 />;
  }

  const href = (s: Seleccion, m?: string) => {
    const q = new URLSearchParams({ casa, personas: String(personas) });
    if (s.arrival) q.set("arrival", s.arrival);
    if (s.departure) q.set("departure", s.departure);
    if (m) q.set("mes", m);
    return `/reservar?${q}#calendario`;
  };

  return (
    <div id="calendario" className="scroll-mt-24">
      <Calendario
        nombre={ficha.nombre}
        noches={noches}
        meses={meses}
        hoy={hoy}
        seleccion={seleccion}
        hrefFor={(s) => href(s, s.arrival ? undefined : inicio)}
        mesAnterior={inicio > mesActual ? href(seleccion, sumarMeses(inicio, -1)) : null}
        mesSiguiente={href(seleccion, sumarMeses(inicio, 1))}
      />
    </div>
  );
}

/* --------------------------------------------------------- house picker */

function OpcionesCasa({ actual, personas }: { actual: CasaSlug | null; personas: number }) {
  const casas = getCasas().filter((c) => c.slug !== actual);
  return (
    <div className="mt-10">
      <h2 className="text-h3">{actual ? "¿Otra casa?" : "¿Qué casa te interesa?"}</h2>
      <p className="mt-1 text-sm text-ink-500">Elige una para ver su calendario, o busca directamente con tus fechas arriba.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {casas.map((c) => {
          const img = getImagen(c.imagenPrincipal, c.nombre);
          return (
            <li key={c.slug}>
              <Link
                href={`/reservar?casa=${c.slug}&personas=${personas}#calendario`}
                scroll={false}
                className="group flex items-center gap-3 rounded-card bg-crema-50 p-2.5 pr-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="relative block h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight text-laguna-900">{c.nombre}</span>
                  <CasaDatos capacidad={c.capacidad} recamaras={c.recamaras} size={16} className="mt-1 text-xs" />
                </span>
                <Icon name="chevron" size={18} className="-rotate-90 text-ink-300 transition-colors group-hover:text-laguna-800" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
