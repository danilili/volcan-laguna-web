import { addDays, daysBetween, hoyISO, isBeds24Configured, isCasaSlug, isIsoDate } from "@/lib/beds24/client";
import { getCalendario } from "@/lib/beds24";
import { badRequest, beds24Failure, json } from "@/lib/api";

/** Longest range a single call may ask for (the calendar UI pages by month). */
const MAX_DAYS = 124;
const DEFAULT_DAYS = 92;

/**
 * GET /api/availability?casa=santuario&from=2026-11-10&to=2026-12-31
 * Per-night availability, nightly rate (Beds24 price1) and minimum stay for
 * one house. Nothing here is computed by the site.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const casa = q.get("casa");
  if (!isCasaSlug(casa)) return badRequest("casa_invalida", "casa debe ser santuario, los-mangos, moringa, santuario-para-4 o los-mangos-para-4");

  const hoy = hoyISO();
  const from = q.get("from") ?? hoy;
  const to = q.get("to") ?? addDays(from, DEFAULT_DAYS);
  if (!isIsoDate(from) || !isIsoDate(to)) return badRequest("fecha_invalida", "from y to deben ser YYYY-MM-DD");
  if (from < hoy) return badRequest("fecha_pasada", `from no puede ser anterior a ${hoy}`);
  const dias = daysBetween(from, to);
  if (dias < 0) return badRequest("rango_invalido", "to debe ser igual o posterior a from");
  if (dias > MAX_DAYS) return badRequest("rango_muy_largo", `máximo ${MAX_DAYS} días por consulta`);

  if (!isBeds24Configured()) return json({ error: "beds24_not_configured" }, { status: 503 });

  try {
    const noches = await getCalendario(casa, from, to);
    return json({ casa, from, to, noches }, { maxAge: 60 });
  } catch (e) {
    return beds24Failure(e);
  }
}
