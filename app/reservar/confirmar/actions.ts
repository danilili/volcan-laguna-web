"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { fetchOfertas, isBeds24Configured } from "@/lib/beds24/client";
import { parseBusqueda } from "@/lib/busqueda";
import { getCasa } from "@/lib/content";
import { formatMXN } from "@/lib/format";
import { crearReservaWeb, isN8nConfigured, type ReservaError } from "@/lib/n8n";
import { buildConfirmadaUrl, parseHuesped, type ErroresHuesped, type Huesped } from "@/lib/reserva";

/**
 * Booking form state. `general` is the message shown above the submit
 * button; the field keys go next to their inputs. On success the action
 * redirects to /reservar/confirmada, so there is no success state here.
 */
export type EstadoReserva = {
  errores: ErroresHuesped & { general?: string };
  valores?: Partial<Huesped>;
};

const APARTAMOS = "escríbenos por WhatsApp y la apartamos.";

const MENSAJES: Record<ReservaError, string> = {
  datos_invalidos: "Revisa los datos del formulario.",
  conflicto: `Esas fechas se acaban de ocupar. Prueba otras fechas o ${APARTAMOS}`,
  ocupado: `Esas fechas se acaban de ocupar en el calendario. Prueba otras fechas o ${APARTAMOS}`,
  sin_confirmar: `No pudimos registrar la reserva. Mejor ${APARTAMOS}`,
  error: `No pudimos registrar la reserva. Mejor ${APARTAMOS}`,
  reserva_fallida: `No pudimos registrar la reserva. Mejor ${APARTAMOS}`,
  n8n_unavailable: `Nuestro sistema de reservas no responde en este momento. Mejor ${APARTAMOS}`,
  n8n_not_configured: `Nuestro sistema de reservas no responde en este momento. Mejor ${APARTAMOS}`,
};

function texto(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" ? v : null;
}

export async function reservar(_prev: EstadoReserva, fd: FormData): Promise<EstadoReserva> {
  const parsed = parseBusqueda({ arrival: texto(fd.get("arrival")), departure: texto(fd.get("departure")), personas: texto(fd.get("personas")), casa: texto(fd.get("casa")) });
  const b = parsed.busqueda;
  const casa = parsed.casa;
  const ficha = casa ? getCasa(casa) : null;
  if (!b || !casa || !ficha) return { errores: { general: "Las fechas de tu búsqueda ya no son válidas. Vuelve a buscar." } };
  if (ficha.capacidad < b.personas) return { errores: { general: `${ficha.nombre} recibe hasta ${ficha.capacidad} personas.` } };

  const { huesped, errores } = parseHuesped(fd);
  if (Object.keys(errores).length) return { errores, valores: huesped };

  if (!isBeds24Configured() || !isN8nConfigured()) return { errores: { general: MENSAJES.n8n_not_configured }, valores: huesped };

  // Fresh quote, no cache: the price and the availability must hold at the moment of booking.
  let total: number | null;
  try {
    const ofertas = await fetchOfertas(casa, b.arrival, b.departure, b.personas);
    total = ofertas.find((o) => o.unidadesDisponibles > 0)?.total ?? null;
  } catch (e) {
    console.error("[reservar] cotización", e instanceof Error ? e.message : e);
    return { errores: { general: `No pudimos confirmar el precio con nuestro sistema de reservas. Inténtalo en un momento o ${APARTAMOS}` }, valores: huesped };
  }
  if (total === null) return { errores: { general: MENSAJES.ocupado }, valores: huesped };

  // The guest confirms the number they saw; if Beds24 changed it meanwhile, say so instead of booking blind.
  const visto = Number(fd.get("total"));
  if (Number.isFinite(visto) && visto > 0 && Math.round(visto) !== Math.round(total)) {
    return { errores: { general: `El total cambió a ${formatMXN(total)}. Vuelve a la búsqueda para verlo actualizado antes de reservar.` }, valores: huesped };
  }

  const r = await crearReservaWeb({ casa, arrival: b.arrival, departure: b.departure, personas: b.personas, ...huesped, total });
  if (!r.ok) return { errores: { general: MENSAJES[r.error] }, valores: huesped };

  // The nights are taken now: drop the cached calendars and offers before the redirect.
  updateTag("beds24");
  redirect(buildConfirmadaUrl({ casa, arrival: b.arrival, departure: b.departure, personas: b.personas, folio: r.folio, total }));
}
