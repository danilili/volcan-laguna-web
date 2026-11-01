/**
 * Smoke test for the Beds24 token in .env.local:
 *   pnpm beds24:check
 * Prints what the token can do, then a week of Casa Santuario's calendar and
 * a weekend quote. Read-only; nothing is written to Beds24.
 */

import fs from "node:fs";
import path from "node:path";
import { addDays, fetchAuthDetails, fetchCalendario, fetchOfertas, hoyISO, isBeds24Configured } from "../lib/beds24/client";

// Minimal .env.local loader (no dotenv dependency).
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
process.env.BEDS24_DEBUG ??= "1";

async function main() {
  if (!isBeds24Configured()) {
    console.error("Falta BEDS24_TOKEN (o BEDS24_REFRESH_TOKEN) en .env.local");
    process.exit(1);
  }
  const details = await fetchAuthDetails();
  console.log("token válido:", details.validToken, "· scopes:", details.token?.scopes ?? "(?)");

  const hoy = hoyISO();
  const cal = await fetchCalendario("santuario", hoy, addDays(hoy, 6));
  console.table(cal.map((d) => ({ noche: d.fecha, disponible: d.disponible, precio: d.precio, minStay: d.minStay, override: d.override })));

  // Next Friday → Sunday.
  const dow = new Date(`${hoy}T00:00:00Z`).getUTCDay();
  const viernes = addDays(hoy, ((5 - dow + 7) % 7) || 7);
  const ofertas = await fetchOfertas("santuario", viernes, addDays(viernes, 2), 2);
  console.log(`ofertas santuario ${viernes} → ${addDays(viernes, 2)} (2 adultos):`, ofertas);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
