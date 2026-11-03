import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { json } from "@/lib/api";

/**
 * POST /api/revalidate with header `x-revalidate-secret: REVALIDATE_SECRET`.
 * Marks every cached Beds24 read stale, so n8n can call it right after a
 * booking made outside the site (WhatsApp, Airbnb webhook) and the calendars
 * refresh on the next visit instead of a minute later.
 */
export async function POST(req: Request) {
  const esperado = process.env.REVALIDATE_SECRET ?? "";
  const dado = req.headers.get("x-revalidate-secret") ?? "";
  if (!esperado || !iguales(dado, esperado)) return json({ error: "unauthorized" }, { status: 401 });
  revalidateTag("beds24", "max");
  return json({ ok: true, revalidated: ["beds24"] });
}

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
