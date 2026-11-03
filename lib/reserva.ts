/**
 * Checkout helpers: the guest's contact details and the URLs between the
 * search, the confirmation form and the "received" page. Prices never come
 * from here (Beds24 quotes, n8n books).
 */

import type { CasaSlug } from "./beds24/client";

export type Huesped = { nombre: string; telefono: string; correo: string; mensaje: string };
export type ErroresHuesped = Partial<Record<keyof Huesped, string>>;

const MAX = { nombre: 120, correo: 160, mensaje: 500 } as const;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Reads and validates the guest fields of the booking form. Messages are shown next to each field. */
export function parseHuesped(fd: FormData): { huesped: Huesped; errores: ErroresHuesped } {
  const nombre = texto(fd.get("nombre"), MAX.nombre);
  const telefonoTexto = texto(fd.get("telefono"), 30);
  const telefono = telefonoTexto.replace(/\D/g, "");
  const correo = texto(fd.get("correo"), MAX.correo);
  const mensaje = texto(fd.get("mensaje"), MAX.mensaje);

  const errores: ErroresHuesped = {};
  if (nombre.length < 3) errores.nombre = "Escribe tu nombre completo.";
  if (telefono.length < 10 || telefono.length > 13) errores.telefono = "Escribe un teléfono con 10 dígitos (con WhatsApp).";
  if (correo && !CORREO.test(correo)) errores.correo = "Revisa el correo.";

  return { huesped: { nombre, telefono, correo, mensaje }, errores };
}

export type ParamsReserva = { casa: CasaSlug; arrival: string; departure: string; personas: number };

export function buildConfirmarUrl(p: ParamsReserva): string {
  const q = new URLSearchParams({ casa: p.casa, arrival: p.arrival, departure: p.departure, personas: String(p.personas) });
  return `/reservar/confirmar?${q}`;
}

/** The "received" page gets the folio and the stay, never the guest's data. */
export function buildConfirmadaUrl(p: ParamsReserva & { folio: string; total: number }): string {
  const q = new URLSearchParams({ folio: p.folio, casa: p.casa, arrival: p.arrival, departure: p.departure, personas: String(p.personas), total: String(Math.round(p.total)) });
  return `/reservar/confirmada?${q}`;
}

/** Half the total, rounded to whole pesos: what Bea asks for to confirm. */
export function anticipo(total: number): number {
  return Math.round(total / 2);
}
