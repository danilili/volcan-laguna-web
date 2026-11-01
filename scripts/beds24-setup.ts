/**
 * One-time Beds24 setup from an invite code:
 *   pnpm beds24:setup
 * Asks for the invite code (typed without echo, or BEDS24_INVITE_CODE in the
 * environment), exchanges it at GET /authentication/setup and writes the
 * result into .env.local — BEDS24_TOKEN when Beds24 hands back a long-life
 * token, otherwise BEDS24_REFRESH_TOKEN. Token values are never printed.
 *
 * Invite codes are created in the Beds24 panel under SETTINGS > MARKETPLACE
 * > API > "Generate invite code" with read-only scopes (read:inventory,
 * read:properties), "allow linked properties" ticked and no IP whitelist.
 * The code expires after 24 h and is single-use.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Writable } from "node:stream";
import { BEDS24_BASE } from "../lib/beds24/client";

const ENV_FILE = path.join(process.cwd(), ".env.local");
const DEVICE_NAME = "volcan-laguna-web";
/** Anything that lives longer than this is treated as a long-life token. */
const LONG_LIFE_SECONDS = 7 * 24 * 3600;

type SetupResponse = { token?: string; expiresIn?: number; refreshToken?: string; success?: boolean; error?: string; code?: number };
type Details = { validToken?: boolean; token?: { scopes?: string[]; expiresIn?: number; properties?: unknown; linkedProperties?: unknown } };

async function askHidden(prompt: string): Promise<string> {
  // Readline with a muted output so the pasted code is not echoed to the terminal.
  let muted = false;
  const out = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output: out, terminal: true });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = true;
  });
}

/** Set (or replace) KEY=value lines in .env.local; keys with `null` are removed. */
function writeEnv(updates: Record<string, string | null>) {
  const lines = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const pending = new Map(Object.entries(updates));
  const next: string[] = [];
  for (const line of lines) {
    const m = /^([A-Z0-9_]+)=/.exec(line);
    if (m && pending.has(m[1])) {
      const v = pending.get(m[1]);
      pending.delete(m[1]);
      if (v !== null) next.push(`${m[1]}=${v}`);
      continue;
    }
    next.push(line);
  }
  for (const [k, v] of pending) if (v !== null) next.push(`${k}=${v}`);
  const text = next.join("\n").replace(/\n*$/, "\n");
  fs.writeFileSync(ENV_FILE, text, { mode: 0o600 });
}

async function main() {
  const code = process.env.BEDS24_INVITE_CODE?.trim() || (await askHidden("Pega el invite code de Beds24 (no se mostrará): "));
  if (!code) {
    console.error("No se recibió ningún invite code.");
    process.exit(1);
  }

  const res = await fetch(`${BEDS24_BASE}/authentication/setup`, { headers: { code, deviceName: DEVICE_NAME, accept: "application/json" } });
  const body = (await res.json().catch(() => null)) as SetupResponse | null;
  if (!res.ok || !body?.token) {
    console.error(`Beds24 rechazó el invite code (HTTP ${res.status}): ${body?.error ?? "sin detalle"}`);
    console.error("Los invite codes caducan a las 24 h y solo se pueden usar una vez; genera otro y vuelve a intentar.");
    process.exit(1);
  }

  const expiresIn = body.expiresIn ?? 0;
  const longLife = !body.refreshToken || expiresIn >= LONG_LIFE_SECONDS;
  if (longLife) {
    writeEnv({ BEDS24_TOKEN: body.token, BEDS24_REFRESH_TOKEN: "", BEDS24_INVITE_CODE: null });
    console.log(`Guardado BEDS24_TOKEN en .env.local (token de larga vida${expiresIn ? `, expiresIn=${expiresIn}s` : ""}).`);
  } else {
    writeEnv({ BEDS24_REFRESH_TOKEN: body.refreshToken!, BEDS24_TOKEN: "", BEDS24_INVITE_CODE: null });
    console.log(`Guardado BEDS24_REFRESH_TOKEN en .env.local (los tokens de acceso duran ${expiresIn}s y se renuevan solos).`);
  }

  // Show what the new token can do, without printing it.
  const det = (await fetch(`${BEDS24_BASE}/authentication/details`, { headers: { token: body.token, accept: "application/json" } })
    .then((r) => r.json())
    .catch(() => null)) as Details | null;
  console.log("token válido:", det?.validToken ?? "(?)", "· scopes:", det?.token?.scopes?.join(", ") ?? "(?)");
  if (det?.token?.properties !== undefined) console.log("propiedades:", JSON.stringify(det.token.properties), "· linked:", JSON.stringify(det.token.linkedProperties ?? null));

  const varName = longLife ? "BEDS24_TOKEN" : "BEDS24_REFRESH_TOKEN";
  console.log(`\nSiguiente paso: copia el valor de ${varName} de .env.local a las variables de entorno del proyecto en Vercel, y corre pnpm beds24:check.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
