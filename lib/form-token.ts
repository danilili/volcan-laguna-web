/**
 * Signed timestamp for the booking form. It proves the request comes from a
 * page this server rendered and that someone took a moment to fill it in.
 * Plain server code: never import it from a client component.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Faster than this is a script: the form has at least three fields to type. */
const MIN_MS = 3_000;
/** A tab left open longer than this reloads, so the quote it shows is not stale either. */
const MAX_MS = 6 * 60 * 60 * 1000;

export type EstadoToken = "ok" | "invalido" | "rapido" | "viejo";

function firmar(marca: string, secreto: string): string {
  return createHmac("sha256", secreto).update(`reserva-web:${marca}`).digest("base64url");
}

export function crearTokenFormulario(ahora = Date.now()): string {
  const secreto = process.env.N8N_WEBHOOK_SECRET ?? "";
  const marca = String(ahora);
  return `${marca}.${firmar(marca, secreto)}`;
}

export function revisarTokenFormulario(token: unknown, ahora = Date.now()): EstadoToken {
  const secreto = process.env.N8N_WEBHOOK_SECRET;
  if (!secreto || typeof token !== "string") return "invalido";
  const [marca, firma] = token.split(".");
  if (!marca || !firma || !/^\d+$/.test(marca)) return "invalido";
  const esperada = Buffer.from(firmar(marca, secreto));
  const dada = Buffer.from(firma);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return "invalido";
  const edad = ahora - Number(marca);
  if (edad < MIN_MS) return "rapido";
  if (edad > MAX_MS) return "viejo";
  return "ok";
}
