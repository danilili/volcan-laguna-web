/**
 * Cached Beds24 reads for the app. Each call is cached ~1 minute (profile
 * "minutes") and tagged so `revalidateTag("beds24")` from /api/revalidate
 * can flush it right after n8n creates a booking.
 */

import { cacheLife, cacheTag } from "next/cache";
import { fetchCalendario, fetchOfertas, ROOMS, type CasaSlug, type DiaCalendario, type Oferta } from "./beds24/client";

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
