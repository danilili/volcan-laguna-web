/**
 * Bridge to n8n for web bookings. The site never creates a reservation on its
 * own: it re-checks the offer against Beds24 and POSTs the request to the
 * "VL · reserva-web" webhook, which calls "VL · crear-reserva" (Supabase +
 * Beds24 + Google Calendar + WhatsApp to Bea) and answers with the folio.
 *
 * Contract (see the sticky note in VL · reserva-web):
 *   POST {casa, arrival, departure, personas, nombre, telefono, correo, total, origen: "web", mensaje}
 *   header X-VL-Web-Secret: N8N_WEBHOOK_SECRET
 *   200 {ok: true, reserva_id, folio, estado: "tentativa", resumen}
 *   409 {ok: false, error: "conflicto" | "ocupado" | "error", detalle}
 *   400 {ok: false, error: "datos_invalidos", detalle, errores}
 *   502 {ok: false, error: "reserva_fallida", detalle}
 */

import type { CasaSlug } from "./beds24/client";

/** Production URL of the webhook; N8N_BOOKING_WEBHOOK overrides it (e.g. the test URL). */
const DEFAULT_WEBHOOK = "https://reservalia.app.n8n.cloud/webhook/vl-reserva-web";
/** crear-reserva talks to Supabase, Beds24 and Google Calendar: give it time. */
const TIMEOUT_MS = 90_000;

export type SolicitudReserva = {
  casa: CasaSlug;
  arrival: string;
  departure: string;
  personas: number;
  nombre: string;
  telefono: string;
  correo: string;
  /** Total Beds24 quoted for the stay, in MXN. */
  total: number;
  mensaje: string;
};

export type ReservaCreada = { ok: true; reservaId: string; folio: string; estado: string; resumen: string };

export type ReservaError =
  | "datos_invalidos"
  | "conflicto"
  | "ocupado"
  | "sin_confirmar"
  | "error"
  | "reserva_fallida"
  | "n8n_unavailable"
  | "n8n_not_configured";

export type ReservaRechazada = { ok: false; error: ReservaError; detalle: string; status: number };
export type RespuestaReserva = ReservaCreada | ReservaRechazada;

const ERRORES_N8N = new Set<ReservaError>(["datos_invalidos", "conflicto", "ocupado", "sin_confirmar", "error", "reserva_fallida"]);

export function isN8nConfigured(): boolean {
  return Boolean(process.env.N8N_WEBHOOK_SECRET);
}

export async function crearReservaWeb(solicitud: SolicitudReserva): Promise<RespuestaReserva> {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: "n8n_not_configured", detalle: "Falta N8N_WEBHOOK_SECRET.", status: 0 };
  const url = process.env.N8N_BOOKING_WEBHOOK || DEFAULT_WEBHOOK;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-vl-web-secret": secret },
      body: JSON.stringify({ ...solicitud, origen: "web" }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    console.error("[n8n] reserva-web no respondió", e instanceof Error ? e.message : e);
    return { ok: false, error: "n8n_unavailable", detalle: "n8n no respondió.", status: 0 };
  }

  const texto = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
  } catch {
    // Not JSON: n8n's own error page (inactive workflow, wrong secret).
  }

  if (res.ok && data.ok === true) {
    return {
      ok: true,
      reservaId: String(data.reserva_id ?? ""),
      folio: String(data.folio ?? data.reserva_id ?? "").slice(0, 12),
      estado: String(data.estado ?? "tentativa"),
      resumen: String(data.resumen ?? ""),
    };
  }

  const reportado = typeof data.error === "string" ? (data.error as ReservaError) : null;
  const error: ReservaError = reportado && ERRORES_N8N.has(reportado) ? reportado : "n8n_unavailable";
  console.error("[n8n] reserva rechazada", res.status, reportado ?? texto.slice(0, 200));
  return { ok: false, error, detalle: typeof data.detalle === "string" ? data.detalle : "", status: res.status };
}
