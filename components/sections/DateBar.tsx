"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Date search bar: a plain GET form to /reservar, so it works without JS.
 * The client side only keeps the dates coherent (no past dates, departure
 * after arrival, two-night default). Phone: 2×2 grid so the hero still fits
 * one screen. Tablet+: one row.
 */

export type DateBarDefaults = {
  arrival?: string | null;
  departure?: string | null;
  personas?: number | null;
  /** Keeps the house the visitor came from through the search. */
  casa?: string | null;
};

type Props = {
  defaults?: DateBarDefaults;
  className?: string;
  /** Button label; the hero says "Disponibilidad", /reservar says "Buscar". */
  accion?: string;
};

const MAX_PERSONAS = 12;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const subscribeNoop = () => () => {};

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DateBar({ defaults = {}, className, accion = "Disponibilidad" }: Props) {
  const [arrival, setArrival] = useState(defaults.arrival ?? "");
  const [departure, setDeparture] = useState(defaults.departure ?? "");
  // The server does not know the visitor's date: undefined there, today's date once hydrated.
  const hoy = useSyncExternalStore(subscribeNoop, todayLocal, () => undefined);

  function onArrival(v: string) {
    setArrival(v);
    if (v && (!departure || departure <= v)) setDeparture(addDays(v, 2));
  }

  const field = "flex items-center gap-2.5 px-3.5 py-3 text-left sm:flex-1 sm:gap-3 sm:px-4";
  const label = "block text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500 sm:text-[11px]";
  const input =
    "block w-full min-w-0 appearance-none bg-transparent text-sm text-ink-900 outline-none [color-scheme:light] placeholder:text-ink-300 sm:text-base " +
    "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer";

  return (
    <form action="/reservar" method="get" className={cn("rounded-card bg-crema-50 text-ink-900 shadow-card", className)}>
      {defaults.casa ? <input type="hidden" name="casa" value={defaults.casa} /> : null}
      <div className="grid grid-cols-2 sm:flex sm:divide-x sm:divide-crema-200">
        <label className={cn(field, "relative border-r border-b border-crema-200 sm:border-0")}>
          <Icon name="calendario" size={20} className="text-selva-600" />
          <span className="min-w-0 flex-1">
            <span className={label}>Llegada</span>
            <input
              type="date"
              name="arrival"
              required
              min={hoy}
              value={arrival}
              onChange={(e) => onArrival(e.target.value)}
              aria-label="Fecha de llegada"
              className={input}
            />
          </span>
        </label>
        <label className={cn(field, "relative border-b border-crema-200 sm:border-0")}>
          <Icon name="calendario" size={20} className="text-selva-600" />
          <span className="min-w-0 flex-1">
            <span className={label}>Salida</span>
            <input
              type="date"
              name="departure"
              required
              min={arrival ? addDays(arrival, 1) : hoy ? addDays(hoy, 1) : undefined}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              aria-label="Fecha de salida"
              className={input}
            />
          </span>
        </label>
        <label className={cn(field, "border-r border-crema-200 sm:border-0")}>
          <Icon name="personas" size={20} className="text-selva-600" />
          <span className="min-w-0 flex-1">
            <span className={label}>Personas</span>
            <select
              name="personas"
              defaultValue={String(defaults.personas ?? 2)}
              aria-label="Número de personas"
              className="block w-full appearance-none bg-transparent text-sm text-ink-900 outline-none sm:text-base"
            >
              {Array.from({ length: MAX_PERSONAS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>
          </span>
        </label>
        <div className="flex items-center p-2">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--radius-card)-0.5rem)] bg-laguna-800 px-4 text-sm font-medium text-crema-50 transition-colors duration-200 hover:bg-laguna-700 sm:h-12 sm:px-5 sm:text-base"
          >
            {accion}
            <Icon name="flecha" size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
