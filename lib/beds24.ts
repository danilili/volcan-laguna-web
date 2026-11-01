/**
 * Cached Beds24 reads for the app. Each call is cached ~1 minute (profile
 * "minutes") and tagged so `revalidateTag("beds24")` from /api/revalidate
 * can flush it right after n8n creates a booking.
 */

import { cacheLife, cacheTag } from "next/cache";
import { addDays, dayOfWeek, fetchCalendario, fetchCalendarios, fetchOfertas, fetchOfertasCasas, hoyISO, isBeds24Configured, nextFriday, ROOMS, type CasaSlug, type DiaCalendario, type Oferta } from "./beds24/client";

export * from "./beds24/client";

export async function getCalendario(slug: CasaSlug, startDate: string, endDate: string): Promise<DiaCalendario[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("beds24", `beds24:room:${ROOMS[slug]}`);
  return fetchCalendario(slug, startDate, endDate);
}

export async function getOfertas(slug: CasaSlug, arrival: string, departure: string, numAdults: number, numChildren = 0): Promise<Oferta[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("beds24", `beds24:room:${ROOMS[slug]}`);
  return fetchOfertas(slug, arrival, departure, numAdults, numChildren);
}

/** Offers for several houses at once (one Beds24 call), e.g. the date search. */
export async function getOfertasCasas(slugs: readonly CasaSlug[], arrival: string, departure: string, numAdults: number, numChildren = 0): Promise<Record<CasaSlug, Oferta[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("beds24", ...slugs.map((s) => `beds24:room:${ROOMS[s]}`));
  return fetchOfertasCasas(slugs, arrival, departure, numAdults, numChildren);
}

/** Calendars for several houses at once (one Beds24 call). */
export async function getCalendarios(slugs: readonly CasaSlug[], startDate: string, endDate: string): Promise<Record<CasaSlug, DiaCalendario[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("beds24", ...slugs.map((s) => `beds24:room:${ROOMS[s]}`));
  return fetchCalendarios(slugs, startDate, endDate);
}

/**
 * Whether Beds24 has opened the coming weekend (Fri + Sat nights) for a "para
 * 4" variant: both nights free with a minimum stay the weekend can meet. Bea
 * keeps those weekends at a 7-night minimum and lowers it one week out when
 * the full house is still free. On Saturday/Sunday it looks at the next
 * weekend. Never throws: without Beds24 it is simply false.
 */
export async function getFinDeSemanaAbierto(slug: CasaSlug): Promise<boolean> {
  "use cache";
  cacheLife("minutes");
  cacheTag("beds24", `beds24:room:${ROOMS[slug]}`);
  if (!isBeds24Configured()) return false;
  const hoy = hoyISO();
  const dow = dayOfWeek(hoy);
  const viernes = nextFriday(dow === 6 || dow === 0 ? addDays(hoy, 1) : hoy);
  try {
    const noches = await fetchCalendario(slug, viernes, addDays(viernes, 1));
    return noches.length === 2 && noches.every((n) => n.disponible && (n.minStay ?? 1) <= 2);
  } catch (e) {
    console.error("[beds24] fin de semana", slug, e instanceof Error ? e.message : e);
    return false;
  }
}
