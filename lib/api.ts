import { Beds24Error } from "./beds24/client";

/** JSON response helpers for route handlers. */
export function json(data: unknown, init: ResponseInit & { maxAge?: number } = {}): Response {
  const { maxAge, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  if (maxAge !== undefined) headers.set("cache-control", `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}`);
  else headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...rest, headers });
}

export function badRequest(error: string, detail?: string): Response {
  return json({ error, detail }, { status: 400 });
}

/** Maps a Beds24 failure to a response the UI can act on (503 = not configured, 502 = upstream). */
export function beds24Failure(e: unknown): Response {
  if (e instanceof Beds24Error) {
    if (e.status === 0) return json({ error: "beds24_not_configured" }, { status: 503 });
    console.error("[beds24]", e.message, e.code ?? "", e.status);
    return json({ error: "beds24_unavailable", detail: e.message }, { status: 502 });
  }
  console.error("[beds24]", e);
  return json({ error: "beds24_unavailable" }, { status: 502 });
}
