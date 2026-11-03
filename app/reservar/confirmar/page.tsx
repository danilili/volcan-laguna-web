import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioReserva } from "@/components/reservar/FormularioReserva";
import { CasaDatos } from "@/components/sections/CasaDatos";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getOfertas } from "@/lib/beds24";
import { isBeds24Configured, type CasaSlug } from "@/lib/beds24/client";
import { parseBusqueda, type Busqueda } from "@/lib/busqueda";
import { getCasa, getImagen, type Casa } from "@/lib/content";
import { formatDateLong, formatMXN, plural } from "@/lib/format";
import { anticipo } from "@/lib/reserva";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confirmar reserva",
  description: "Revisa tu estancia en Volcán Laguna y déjanos tu contacto para apartar las fechas.",
  robots: { index: false, follow: false },
};

type SearchParams = PageProps<"/reservar/confirmar">["searchParams"];

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export default function ConfirmarPage({ searchParams }: PageProps<"/reservar/confirmar">) {
  return (
    <>
      <PageHero eyebrow="Reservar" title="Confirma tu reserva" lede="Revisa tu estancia y déjanos tu contacto. No se cobra nada en línea." />
      <Section compact>
        <Suspense fallback={<Cargando />}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  );
}

function Cargando() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10" aria-busy="true" aria-label="Confirmando disponibilidad">
      <div className="h-96 animate-pulse rounded-card bg-crema-200/60" />
      <div className="h-96 animate-pulse rounded-card bg-crema-200/60" />
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: SearchParams }) {
  // Depends on today's date and the query: render at request time.
  await connection();
  const sp = await searchParams;
  const parsed = parseBusqueda({ arrival: first(sp.arrival), departure: first(sp.departure), personas: first(sp.personas), casa: first(sp.casa) });
  const b = parsed.busqueda;
  const casa = parsed.casa;
  const ficha = casa ? getCasa(casa) : null;

  if (!b || !casa || !ficha) {
    return <Volver mensaje={parsed.errores[0]?.mensaje ?? "Elige la casa y las fechas para continuar."} />;
  }
  if (ficha.capacidad < b.personas) {
    return <Volver mensaje={`${ficha.nombre} recibe hasta ${plural(ficha.capacidad, "persona", "personas")}.`} b={b} casa={casa} />;
  }
  if (!isBeds24Configured()) return <Volver mensaje="No pudimos consultar la disponibilidad en este momento." b={b} casa={casa} whatsapp />;

  let total: number | null;
  try {
    const ofertas = await getOfertas(casa, b.arrival, b.departure, b.personas);
    total = ofertas.find((o) => o.unidadesDisponibles > 0)?.total ?? null;
  } catch (e) {
    console.error("[reservar/confirmar]", e instanceof Error ? e.message : e);
    return <Volver mensaje="No pudimos consultar la disponibilidad en este momento." b={b} casa={casa} whatsapp />;
  }
  if (total === null) return <Volver mensaje={`${ficha.nombre} ya no está disponible en esas fechas.`} b={b} casa={casa} whatsapp />;

  const fechas = `del ${formatDateLong(b.arrival)} al ${formatDateLong(b.departure)}`;
  const mensajeWhatsApp = `Hola, quiero reservar ${ficha.nombre} ${fechas} para ${plural(b.personas, "persona", "personas")}. Total ${formatMXN(total)}.`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
      <Resumen ficha={ficha} b={b} casa={casa} total={total} />
      <div>
        <h2 className="text-h3">Tus datos</h2>
        <p className="mt-1 text-sm text-ink-500">Solo lo necesario para apartar y escribirte.</p>
        <div className="mt-5">
          <FormularioReserva casa={casa} arrival={b.arrival} departure={b.departure} personas={b.personas} total={total} mensajeWhatsApp={mensajeWhatsApp} />
        </div>
      </div>
    </div>
  );
}

function Resumen({ ficha, b, casa, total }: { ficha: Casa; b: Busqueda; casa: CasaSlug; total: number }) {
  const img = getImagen(ficha.imagenPrincipal, ficha.nombre);
  const cambiar = `/reservar?${new URLSearchParams({ casa, arrival: b.arrival, departure: b.departure, personas: String(b.personas) })}`;
  const filas = [
    { label: "Llegada", valor: `${formatDateLong(b.arrival)} · ${site.checkIn}` },
    { label: "Salida", valor: `${formatDateLong(b.departure)} · ${site.checkOut}` },
    { label: "Estancia", valor: plural(b.noches, "noche", "noches") },
    { label: "Personas", valor: String(b.personas) },
  ];
  return (
    <aside className="overflow-hidden rounded-card bg-crema-50 shadow-card lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-[16/9]">
        <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
      </div>
      <div className="p-5">
        <h2 className="font-display text-2xl leading-tight text-laguna-900">{ficha.nombre}</h2>
        <CasaDatos capacidad={ficha.capacidad} recamaras={ficha.recamaras} banos={ficha.banos} className="mt-1.5" />
        <dl className="mt-4 divide-y divide-crema-200 text-sm">
          {filas.map((f) => (
            <div key={f.label} className="flex justify-between gap-4 py-2">
              <dt className="text-ink-500">{f.label}</dt>
              <dd className="text-right text-ink-900">{f.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-crema-200 pt-4">
          <p className="text-sm text-ink-500">Total de la estancia</p>
          <p className="font-display text-3xl leading-none text-laguna-900">{formatMXN(total)}</p>
        </div>
        <p className="mt-2 text-right text-sm text-ink-700">
          Anticipo para confirmar (50 %): <span className="font-medium text-ink-900">{formatMXN(anticipo(total))}</span>
        </p>
        <p className="mt-3 text-xs text-ink-500">Precio de nuestro sistema de reservas, en pesos mexicanos. Casa completa para tu grupo.</p>
        <Link href={cambiar} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-laguna-800 underline-offset-2 hover:underline">
          <Icon name="calendario" size={16} /> Cambiar fechas
        </Link>
      </div>
    </aside>
  );
}

function Volver({ mensaje, b, casa, whatsapp = false }: { mensaje: string; b?: Busqueda; casa?: CasaSlug; whatsapp?: boolean }) {
  const q = b ? new URLSearchParams({ ...(casa ? { casa } : {}), arrival: b.arrival, departure: b.departure, personas: String(b.personas) }) : null;
  return (
    <div className="mx-auto max-w-xl rounded-card bg-crema-50 p-5 shadow-card sm:p-6">
      <p className="text-ink-700">{mensaje}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={q ? `/reservar?${q}` : "/reservar"} size="sm">
          <Icon name="calendario" size={18} /> {b ? "Ver otras fechas" : "Buscar fechas"}
        </Button>
        {whatsapp ? (
          <Button href={whatsappUrl("Hola, quiero reservar en Volcán Laguna.")} variant="whatsapp" size="sm">
            <Icon name="whatsapp" size={18} /> Reservar por WhatsApp
          </Button>
        ) : null}
      </div>
    </div>
  );
}
