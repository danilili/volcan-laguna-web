"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import { CasaDatos } from "./CasaDatos";

export type CasaResumen = {
  slug: string;
  nombre: string;
  capacidad: number;
  recamaras: number;
  banos: number;
  precioNoche: number;
  imagenPrincipal: string;
  alt: string;
};

type Opcion = { id: string; label: string; detalle: string; slugs: string[]; href?: string };

const opciones: Opcion[] = [
  { id: "2-4", label: "2 a 4", detalle: "Una casa pequeña con muelle y vista.", slugs: ["los-mangos-para-4", "santuario-para-4"] },
  { id: "5-6", label: "5 a 6", detalle: "Casa Moringa, entre los árboles.", slugs: ["moringa"] },
  { id: "7-10", label: "7 a 10", detalle: "Casa Santuario, con jacuzzi al lago.", slugs: ["santuario"] },
  { id: "11-12", label: "11 a 12", detalle: "Casa Los Mangos, la más amplia.", slugs: ["los-mangos"] },
  { id: "retiro", label: "Retiro o evento", detalle: "Las tres casas juntas, hasta 28 personas.", slugs: [], href: "/organiza-tu-retiro" },
];

/** "Somos…" group-size selector. Highlights the house(s) that fit. */
export function Somos({ casas, titulo, texto }: { casas: CasaResumen[]; titulo: string; texto?: string }) {
  const [sel, setSel] = useState(opciones[2]);
  const elegidas = sel.slugs.map((s) => casas.find((c) => c.slug === s)).filter((c): c is CasaResumen => !!c);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-600">Encuentra tu casa</p>
        <h2 className="text-h2">{titulo}</h2>
        {texto ? <p className="mt-3 max-w-md text-lede text-ink-500">{texto}</p> : null}

        <div role="tablist" aria-label="Tamaño del grupo" className="mt-6 flex flex-wrap gap-2">
          {opciones.map((o) => {
            const active = o.id === sel.id;
            return (
              <button
                key={o.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSel(o)}
                className={cn(
                  "h-11 rounded-pill border px-4 text-sm font-medium transition-colors duration-200",
                  active
                    ? "border-laguna-800 bg-laguna-800 text-crema-50"
                    : "border-laguna-800/20 bg-crema-50 text-laguna-800 hover:border-laguna-800/50",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-ink-700">{sel.detalle}</p>
      </div>

      <div role="tabpanel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {sel.href ? (
          <Link
            href={sel.href}
            className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-card bg-laguna-900 p-5 text-crema-50 shadow-card"
          >
            <Image
              src="/images/general/retiros-01-tapetes-yoga.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-laguna-950/80 to-transparent" />
            <div className="relative">
              <p className="font-display text-2xl">Organiza tu retiro</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-crema-50/85">
                Cotiza las casas juntas <Icon name="flecha" size={16} />
              </p>
            </div>
          </Link>
        ) : (
          elegidas.map((c) => (
            <Link
              key={c.slug}
              href={`/casas/${c.slug}`}
              className="group flex items-center gap-4 rounded-card bg-crema-50 p-3 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="relative block h-24 w-28 shrink-0 overflow-hidden rounded-[calc(var(--radius-card)-0.5rem)]">
                <Image
                  src={c.imagenPrincipal}
                  alt={c.alt}
                  fill
                  sizes="112px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl leading-tight text-laguna-900">{c.nombre}</span>
                <CasaDatos capacidad={c.capacidad} recamaras={c.recamaras} banos={c.banos} size={16} className="mt-1 text-ink-500" />
                <span className="mt-1 block text-sm">
                  <span className="font-medium text-laguna-900">{formatMXN(c.precioNoche)}</span> / noche
                </span>
              </span>
              <Icon name="flecha" size={20} className="mr-1 text-arena-600" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
