/**
 * Beds24 API v2 client (read-only). Beds24 is the only source of prices,
 * availability and minimum stays; the site never computes a price.
 *
 * Auth: BEDS24_TOKEN is a long-life token (read-only) sent as the `token`
 * header directly. If instead BEDS24_REFRESH_TOKEN is set, a 24 h access
 * token is fetched from /authentication/token and memoised. Both come from
 * an invite code created in the Beds24 panel (SETTINGS > MARKETPLACE > API)
 * and exchanged once with `pnpm beds24:setup` (scripts/beds24-setup.ts).
 *
 * Pricing model in Bea's account (checked 2026-11-01): rooms have no daily
 * prices (price1..16 are empty). Each room has a rack rate and the calendar
 * carries a per-night multiplier (0.75 Mon–Thu, 1 Fri–Sun, 1.3 on some
 * "para 4" weekend nights); Beds24 applies it and /inventory/rooms/offers
 * returns the total for the stay. That total is the only price the site
 * shows live; the calendar is used for availability and minimum stay only.
 * Rooms are paired as dependencies (Los Mangos ↔ para 4, Santuario ↔ para 4),
 * so booking one closes the other.
 *
 * Spec: https://beds24.com/api/v2/apiV2.yaml. Credits: 100 per 5 minutes
 * per account; the X-Request-Cost / X-Five-Min-Limit-Remaining headers are
 * logged when BEDS24_DEBUG=1.
 *
 * This file has no Next.js imports so scripts (tsx) can use it; the cached
 * wrappers live in lib/beds24.ts.
 */

import { site } from "../site";

export const BEDS24_BASE = "https://api.beds24.com/v2";
export const PROPERTY_ID = site.beds24.propertyId;
export const ROOMS = site.beds24.rooms;
export type CasaSlug = keyof typeof ROOMS;

export function isCasaSlug(v: unknown): v is CasaSlug {
  return typeof v === "string" && v in ROOMS;
}

export class Beds24Error extends Error {
  constructor(
    message: string,
    /** Beds24's own error code when the body carried one. */
    readonly code?: number,
    /** HTTP status of the failing response (0 = not configured). */
    readonly status: number = 0,
  ) {
    super(message);
    this.name = "Beds24Error";
  }
}

export function isBeds24Configured(): boolean {
  return Boolean(process.env.BEDS24_TOKEN || process.env.BEDS24_REFRESH_TOKEN);
}

/* ------------------------------------------------------------------ auth */

let memo: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const longLife = process.env.BEDS24_TOKEN;
  if (longLife) return longLife;
  const refresh = process.env.BEDS24_REFRESH_TOKEN;
  if (!refresh) throw new Beds24Error("Beds24 no está configurado (falta BEDS24_TOKEN)", undefined, 0);
  if (memo && memo.expiresAt > Date.now() + 60_000) return memo.token;
  const res = await fetch(`${BEDS24_BASE}/authentication/token`, { headers: { refreshToken: refresh, accept: "application/json" } });
  const body = (await res.json().catch(() => null)) as { token?: string; expiresIn?: number; error?: string } | null;
  if (!res.ok || !body?.token) throw new Beds24Error(body?.error ?? `No se pudo obtener el token (HTTP ${res.status})`, undefined, res.status);
  memo = { token: body.token, expiresAt: Date.now() + (body.expiresIn ?? 3600) * 1000 };
  return memo.token;
}

/* ------------------------------------------------------------------- http */

type Query = Record<string, string | number | boolean | readonly (string | number)[] | undefined>;

type ApiOk<T> = { success: true; type?: string; count?: number; data: T; pages?: { nextPageExists: boolean; nextPageLink?: string } };
type ApiErr = { success: false; type: "error"; code: number; error: string };

async function api<T>(path: string, query: Query = {}): Promise<T> {
  const url = new URL(BEDS24_BASE + path);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
    else url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { token: await getToken(), accept: "application/json" } });
  if (process.env.BEDS24_DEBUG === "1") {
    console.log(`[beds24] ${path} ${res.status} cost=${res.headers.get("x-request-cost")} left=${res.headers.get("x-five-min-limit-remaining")}`);
  }
  const body = (await res.json().catch(() => null)) as ApiOk<T> | ApiErr | null;
  if (!res.ok || !body || body.success === false) {
    const err = body && "error" in body ? body : null;
    throw new Beds24Error(err?.error ?? `Beds24 HTTP ${res.status}`, err?.code, res.status);
  }
  return body.data;
}

/* ------------------------------------------------------------ raw calls */

export type AuthDetails = {
  validToken: boolean;
  token?: { scopes?: string[]; expiresIn?: number; ownerId?: number; properties?: unknown; linkedProperties?: unknown; [k: string]: unknown };
  [k: string]: unknown;
};

/** GET /authentication/details — what the token can do. Used by scripts/beds24-check.ts. */
export async function fetchAuthDetails(): Promise<AuthDetails> {
  const res = await fetch(`${BEDS24_BASE}/authentication/details`, { headers: { token: await getToken(), accept: "application/json" } });
  const body = (await res.json().catch(() => null)) as AuthDetails | ApiErr | null;
  if (!res.ok || !body) throw new Beds24Error((body as ApiErr | null)?.error ?? `Beds24 HTTP ${res.status}`, undefined, res.status);
  return body as AuthDetails;
}

type CalendarItem = {
  from: string;
  to: string;
  numAvail?: number;
  minStay?: number;
  maxStay?: number;
  override?: "none" | "blackout" | "exception" | "noCheckIn" | "noCheckOut" | "noCheckInOrCheckOut";
};
type CalendarRoom = { roomId: number; propertyId?: number; calendar: CalendarItem[] };

/** One night in a room's calendar, as the site consumes it. */
export type DiaCalendario = {
  /** YYYY-MM-DD, the night (check-in date for that night). */
  fecha: string;
  /** numAvail > 0 and not blacked out. */
  disponible: boolean;
  /** Minimum nights for a stay starting that night (null when Beds24 did not say). */
  minStay: number | null;
  /** Check-in restriction for that date. */
  override: CalendarItem["override"] | null;
};

function expandCalendar(items: CalendarItem[], startDate: string, endDate: string): DiaCalendario[] {
  const byDay = new Map<string, DiaCalendario>();
  for (const it of items) {
    for (const fecha of eachDay(it.from, it.to)) {
      if (fecha < startDate || fecha > endDate) continue;
      const override = it.override ?? "none";
      byDay.set(fecha, {
        fecha,
        disponible: (it.numAvail ?? 0) > 0 && override !== "blackout",
        minStay: it.minStay ?? null,
        override,
      });
    }
  }
  // Nights Beds24 did not mention are unknown: treat as unavailable.
  return eachDay(startDate, endDate).map((fecha) => byDay.get(fecha) ?? { fecha, disponible: false, minStay: null, override: null });
}

/**
 * GET /inventory/rooms/calendar for several rooms in one call (1 credit),
 * each expanded to one entry per night of [startDate, endDate].
 */
export async function fetchCalendarios(slugs: readonly CasaSlug[], startDate: string, endDate: string): Promise<Record<CasaSlug, DiaCalendario[]>> {
  const rooms = await api<CalendarRoom[]>("/inventory/rooms/calendar", {
    propertyId: PROPERTY_ID,
    roomId: slugs.map((s) => ROOMS[s]),
    startDate,
    endDate,
    includeNumAvail: true,
    includeMinStay: true,
    includeOverride: true,
  });
  const out = {} as Record<CasaSlug, DiaCalendario[]>;
  for (const slug of slugs) out[slug] = expandCalendar(rooms.find((r) => r.roomId === ROOMS[slug])?.calendar ?? [], startDate, endDate);
  return out;
}

/** GET /inventory/rooms/calendar for one room, expanded to one entry per night. */
export async function fetchCalendario(slug: CasaSlug, startDate: string, endDate: string): Promise<DiaCalendario[]> {
  const all = await fetchCalendarios([slug], startDate, endDate);
  return all[slug];
}

type OfferRoom = { roomId: number; propertyId: number; offers?: { offerId: number; offerName?: string; price?: number; unitsAvailable?: number }[] };

/** A bookable offer for a stay. `total` is the full price for all nights, straight from Beds24. */
export type Oferta = { offerId: number; nombre: string; total: number; unidadesDisponibles: number };

function parseOffers(room: OfferRoom | undefined): Oferta[] {
  return (room?.offers ?? [])
    .filter((o) => typeof o.price === "number")
    .map((o) => ({ offerId: o.offerId, nombre: o.offerName ?? "", total: o.price as number, unidadesDisponibles: o.unitsAvailable ?? 0 }));
}

/**
 * GET /inventory/rooms/offers for several rooms in one call (1 credit) for the
 * same arrival/departure and occupancy. A room with no bookable offer (not
 * available, minimum stay not met, over capacity) comes back as [].
 */
export async function fetchOfertasCasas(slugs: readonly CasaSlug[], arrival: string, departure: string, numAdults: number, numChildren = 0): Promise<Record<CasaSlug, Oferta[]>> {
  const rooms = await api<OfferRoom[]>("/inventory/rooms/offers", {
    propertyId: PROPERTY_ID,
    roomId: slugs.map((s) => ROOMS[s]),
    arrival,
    departure,
    numAdults,
    numChildren,
  });
  const out = {} as Record<CasaSlug, Oferta[]>;
  for (const slug of slugs) out[slug] = parseOffers(rooms.find((r) => r.roomId === ROOMS[slug]));
  return out;
}

/** GET /inventory/rooms/offers for one room, arrival/departure and occupancy. */
export async function fetchOfertas(slug: CasaSlug, arrival: string, departure: string, numAdults: number, numChildren = 0): Promise<Oferta[]> {
  const all = await fetchOfertasCasas([slug], arrival, departure, numAdults, numChildren);
  return all[slug];
}

/* ------------------------------------------------------------------ dates */

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Inclusive list of YYYY-MM-DD from `from` to `to`. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD. */
export function dayOfWeek(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** Nearest Friday on or after `iso` (that Friday's own date when it is one). */
export function nextFriday(iso: string): string {
  return addDays(iso, (5 - dayOfWeek(iso) + 7) % 7);
}

/** Today in the property's time zone (Mexico City / Nayarit, no DST). */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
