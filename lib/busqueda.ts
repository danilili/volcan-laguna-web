/**
 * Date search across the five houses. Beds24 is the only source of prices
 * and availability: the total comes straight from its offers and the
 * "why not" reasons are read from its calendar. Two Beds24 calls per search
 * (offers + calendar for all rooms), both cached ~1 minute.
 */

import { getCalendarios, getOfertasCasas } from "./beds24";
import { addDays, daysBetween, dayOfWeek, hoyISO, isCasaSlug, isIsoDate, ROOMS, type CasaSlug, type DiaCalendario } from "./beds24/client";
import { getCasas, type Casa } from "./content";
import { site } from "./site";

export const MAX_NOCHES = 30;
export const MAX_PERSONAS = 12;

export type Busqueda = {
  arrival: string;
  departure: string;
  noches: number;
  personas: number;
  /** House the visitor came from (/casas/[slug] → Reservar). */
  casa: CasaSlug | null;
};

export type BusquedaInput = { arrival?: string | null; departure?: string | null; personas?: string | number | null; casa?: string | null };

/** Validation problems in the visitor's words. `arrival`/`departure` missing is not an error: it means "no search yet". */
export type BusquedaError = { campo: "arrival" | "departure" | "personas"; mensaje: string };

export type BusquedaParse = { busqueda: Busqueda | null; errores: BusquedaError[]; casa: CasaSlug | null; personas: number; arrival: string | null; departure: string | null };

export function parseBusqueda(input: BusquedaInput): BusquedaParse {
  const errores: BusquedaError[] = [];
  const casa = isCasaSlug(input.casa) ? input.casa : null;
  const hoy = hoyISO();

  const personasRaw = input.personas === undefined || input.personas === null || input.personas === "" ? 2 : Number(input.personas);
  const personas = Number.isInteger(personasRaw) && personasRaw >= 1 && personasRaw <= MAX_PERSONAS ? personasRaw : 2;
  if (personas !== personasRaw) errores.push({ campo: "personas", mensaje: `Indica entre 1 y ${MAX_PERSONAS} personas.` });

  const arrival = isIsoDate(input.arrival) ? input.arrival : null;
  const departure = isIsoDate(input.departure) ? input.departure : null;
  if (input.arrival && !arrival) errores.push({ campo: "arrival", mensaje: "La fecha de llegada no es válida." });
  if (input.departure && !departure) errores.push({ campo: "departure", mensaje: "La fecha de salida no es válida." });

  if (!arrival || !departure) return { busqueda: null, errores, casa, personas, arrival, departure };

  if (arrival < hoy) errores.push({ campo: "arrival", mensaje: "La llegada no puede ser una fecha pasada." });
  const noches = daysBetween(arrival, departure);
  if (noches < 1) errores.push({ campo: "departure", mensaje: "La salida debe ser después de la llegada." });
  else if (noches < site.minNights) errores.push({ campo: "departure", mensaje: `La estancia mínima es de ${site.minNights} noches.` });
  else if (noches > MAX_NOCHES) errores.push({ campo: "departure", mensaje: `Máximo ${MAX_NOCHES} noches por reserva.` });

  if (errores.length) return { busqueda: null, errores, casa, personas, arrival, departure };
  return { busqueda: { arrival, departure, noches, personas, casa }, errores, casa, personas, arrival, departure };
}

export type EstadoResultado =
  /** Beds24 quoted it: `total` is the price for the whole stay. */
  | "disponible"
  /** More people than the house takes. Beds24 is not asked. */
  | "capacidad"
  /** At least one night is taken or blacked out. */
  | "ocupada"
  /** "Para 4" variant on a weekend Bea has not opened yet. */
  | "fin-de-semana"
  /** The stay is shorter than the minimum Beds24 asks for those nights. */
  | "minimo"
  /** Beds24 returned no offer and the calendar gives no clearer reason. */
  | "no-disponible";

export type Resultado = {
  casa: Casa;
  slug: CasaSlug;
  estado: EstadoResultado;
  total: number | null;
  ofertaId: number | null;
  /** Minimum stay Beds24 asks for on the arrival night. */
  minStay: number | null;
};

const ORDEN: EstadoResultado[] = ["disponible", "fin-de-semana", "minimo", "ocupada", "capacidad", "no-disponible"];

/**
 * Runs the search. Houses the visitor can book come first; the one they came
 * from (`busqueda.casa`) leads its group.
 */
export async function buscarCasas(busqueda: Busqueda): Promise<Resultado[]> {
  const casas = getCasas().filter((c): c is Casa & { slug: CasaSlug } => isCasaSlug(c.slug));
  const caben = casas.filter((c) => c.capacidad >= busqueda.personas).map((c) => c.slug);
  const ultimaNoche = addDays(busqueda.departure, -1);

  const [ofertas, calendarios] = caben.length
    ? await Promise.all([
        getOfertasCasas(caben, busqueda.arrival, busqueda.departure, busqueda.personas),
        getCalendarios(caben, busqueda.arrival, ultimaNoche),
      ])
    : [{} as Record<CasaSlug, never[]>, {} as Record<CasaSlug, DiaCalendario[]>];

  const resultados = casas.map<Resultado>((casa) => {
    const slug = casa.slug;
    if (casa.capacidad < busqueda.personas) return { casa, slug, estado: "capacidad", total: null, ofertaId: null, minStay: null };
    const oferta = (ofertas[slug] ?? []).find((o) => o.unidadesDisponibles > 0) ?? null;
    const noches = calendarios[slug] ?? [];
    const minStay = noches[0]?.minStay ?? null;
    if (oferta) return { casa, slug, estado: "disponible", total: oferta.total, ofertaId: oferta.offerId, minStay };
    return { casa, slug, estado: razon(casa, busqueda, noches), total: null, ofertaId: null, minStay };
  });

  return resultados.sort((a, b) => {
    const porEstado = ORDEN.indexOf(a.estado) - ORDEN.indexOf(b.estado);
    if (porEstado !== 0) return porEstado;
    if (a.slug === busqueda.casa) return -1;
    if (b.slug === busqueda.casa) return 1;
    return 0;
  });
}

function razon(casa: Casa, b: Busqueda, noches: DiaCalendario[]): EstadoResultado {
  if (!noches.length) return "no-disponible";
  if (noches.some((n) => !n.disponible)) return "ocupada";
  const minStay = noches[0].minStay ?? 0;
  if (minStay > b.noches) {
    const dow = dayOfWeek(b.arrival);
    if (casa.padre && minStay >= 7 && (dow === 5 || dow === 6)) return "fin-de-semana";
    return "minimo";
  }
  return "no-disponible";
}

export const TODAS_LAS_CASAS = Object.keys(ROOMS) as CasaSlug[];
