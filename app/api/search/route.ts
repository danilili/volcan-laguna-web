import { isBeds24Configured } from "@/lib/beds24/client";
import { buscarCasas, parseBusqueda } from "@/lib/busqueda";
import { badRequest, beds24Failure, json } from "@/lib/api";

/**
 * GET /api/search?arrival=2026-12-18&departure=2026-12-21&personas=6&casa=santuario
 * Every house for a stay: the total Beds24 quotes for the ones that can be
 * booked and the reason for the ones that cannot. Same data /reservar renders.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const parsed = parseBusqueda({ arrival: q.get("arrival"), departure: q.get("departure"), personas: q.get("personas"), casa: q.get("casa") });
  if (parsed.errores.length) return badRequest("busqueda_invalida", parsed.errores.map((e) => e.mensaje).join(" "));
  if (!parsed.busqueda) return badRequest("fechas_requeridas", "arrival y departure son obligatorios (YYYY-MM-DD)");

  if (!isBeds24Configured()) return json({ error: "beds24_not_configured" }, { status: 503 });

  try {
    const resultados = await buscarCasas(parsed.busqueda);
    return json(
      {
        ...parsed.busqueda,
        casas: resultados.map((r) => ({ casa: r.slug, nombre: r.casa.nombre, capacidad: r.casa.capacidad, estado: r.estado, total: r.total, ofertaId: r.ofertaId, minStay: r.minStay })),
      },
      { maxAge: 60 },
    );
  } catch (e) {
    return beds24Failure(e);
  }
}
