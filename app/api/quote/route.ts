import { daysBetween, hoyISO, isBeds24Configured, isCasaSlug, isIsoDate } from "@/lib/beds24/client";
import { getOfertas } from "@/lib/beds24";
import { badRequest, beds24Failure, json } from "@/lib/api";
import { getCasa } from "@/lib/content";

const MAX_NIGHTS = 30;

/**
 * GET /api/quote?casa=santuario&arrival=2026-12-18&departure=2026-12-21&adults=6&children=2
 * Bookable offers for a stay, with the total price exactly as Beds24 quotes
 * it. The checkout re-runs this on the server before calling n8n.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const casa = q.get("casa");
  if (!isCasaSlug(casa)) return badRequest("casa_invalida");
  const ficha = getCasa(casa);

  const arrival = q.get("arrival");
  const departure = q.get("departure");
  if (!isIsoDate(arrival) || !isIsoDate(departure)) return badRequest("fecha_invalida", "arrival y departure deben ser YYYY-MM-DD");
  const hoy = hoyISO();
  if (arrival < hoy) return badRequest("fecha_pasada", `arrival no puede ser anterior a ${hoy}`);
  const noches = daysBetween(arrival, departure);
  if (noches < 1) return badRequest("rango_invalido", "departure debe ser posterior a arrival");
  if (noches > MAX_NIGHTS) return badRequest("rango_muy_largo", `máximo ${MAX_NIGHTS} noches`);

  const adults = Number(q.get("adults") ?? "2");
  const children = Number(q.get("children") ?? "0");
  if (!Number.isInteger(adults) || adults < 1) return badRequest("adultos_invalidos", "adults debe ser un entero ≥ 1");
  if (!Number.isInteger(children) || children < 0) return badRequest("ninos_invalidos", "children debe ser un entero ≥ 0");
  // Children from 2 years count as guests (Bea's rule); the form sends only those.
  if (ficha && adults + children > ficha.capacidad) return badRequest("capacidad_excedida", `${ficha.nombre} recibe hasta ${ficha.capacidad} personas`);

  if (!isBeds24Configured()) return json({ error: "beds24_not_configured" }, { status: 503 });

  try {
    const ofertas = await getOfertas(casa, arrival, departure, adults, children);
    const disponible = ofertas.some((o) => o.unidadesDisponibles > 0);
    return json({ casa, arrival, departure, noches, adults, children, disponible, ofertas }, { maxAge: 60 });
  } catch (e) {
    return beds24Failure(e);
  }
}
