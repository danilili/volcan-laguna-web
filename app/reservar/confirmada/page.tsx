import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { isCasaSlug, isIsoDate } from "@/lib/beds24/client";
import { getCasa } from "@/lib/content";
import { formatDateLong, formatMXN, plural } from "@/lib/format";
import { anticipo } from "@/lib/reserva";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Solicitud recibida",
  description: "Tu solicitud de reserva en Volcán Laguna quedó registrada.",
  robots: { index: false, follow: false },
};

type SearchParams = PageProps<"/reservar/confirmada">["searchParams"];

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export default function ConfirmadaPage({ searchParams }: PageProps<"/reservar/confirmada">) {
  return (
    <>
      <PageHero eyebrow="Reservar" title="¡Recibimos tu solicitud!" lede="Tus fechas ya quedaron apartadas. Te escribimos por WhatsApp para confirmar." />
      <Section compact>
        <Suspense fallback={<div className="mx-auto h-80 max-w-2xl animate-pulse rounded-card bg-crema-200/60" />}>
          <Detalle searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  );
}

async function Detalle({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const sp = await searchParams;
  const folio = (first(sp.folio) ?? "").replace(/[^0-9a-z-]/gi, "").slice(0, 12);
  const casa = first(sp.casa);
  const ficha = isCasaSlug(casa) ? getCasa(casa) : null;
  const arrival = first(sp.arrival);
  const departure = first(sp.departure);
  const personas = Number(first(sp.personas));
  const total = Number(first(sp.total));

  if (!folio) {
    return (
      <div className="mx-auto max-w-xl rounded-card bg-crema-50 p-5 shadow-card sm:p-6">
        <p className="text-ink-700">Para reservar, empieza eligiendo tus fechas.</p>
        <Button href="/reservar" size="sm" className="mt-4">
          <Icon name="calendario" size={18} /> Buscar fechas
        </Button>
      </div>
    );
  }

  const estancia = ficha && isIsoDate(arrival) && isIsoDate(departure);
  const texto = `Hola, acabo de enviar una solicitud de reserva en el sitio (folio ${folio})${ficha ? ` para ${ficha.nombre}` : ""}.`;
  const pasos = [
    `Beatriz te escribe por WhatsApp al número que nos diste para el anticipo del 50 %${total > 0 ? ` (${formatMXN(anticipo(total))})` : ""}.`,
    "Con el anticipo tu reserva queda confirmada y te mandamos las indicaciones para llegar.",
    `Entrada a partir de las ${site.checkIn} y salida a las ${site.checkOut}.`,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card bg-crema-50 p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-arena-600">Folio</p>
            <p className="mt-1 font-display text-3xl leading-none text-laguna-900">{folio}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-selva-600 px-3 py-1 text-xs font-medium text-crema-50">
            <Icon name="check" size={14} /> Fechas apartadas
          </span>
        </div>

        {estancia ? (
          <dl className="mt-5 divide-y divide-crema-200 text-sm">
            <Fila label="Casa" valor={ficha.nombre} />
            <Fila label="Llegada" valor={`${formatDateLong(arrival)} · ${site.checkIn}`} />
            <Fila label="Salida" valor={`${formatDateLong(departure)} · ${site.checkOut}`} />
            {personas > 0 ? <Fila label="Personas" valor={plural(personas, "persona", "personas")} /> : null}
            {total > 0 ? <Fila label="Total" valor={formatMXN(total)} /> : null}
          </dl>
        ) : null}

        <h2 className="mt-6 text-h3">¿Qué sigue?</h2>
        <ol className="mt-3 space-y-2.5 text-ink-700">
          {pasos.map((p, i) => (
            <li key={p} className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arena-500 text-xs font-medium text-laguna-950">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={whatsappUrl(texto)} variant="whatsapp">
            <Icon name="whatsapp" size={20} /> Escribir por WhatsApp
          </Button>
          <Button href="/" variant="secondary">
            Volver al inicio
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-500">Guarda tu folio. Si en 24 horas no te hemos escrito, mándanos un WhatsApp.</p>
      </div>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right text-ink-900">{valor}</dd>
    </div>
  );
}
