const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

/** "$11,250" style, no decimals. */
export function formatMXN(amount: number): string {
  return mxn.format(amount).replace(/\s?MXN/, "");
}

/** "11,250" without currency symbol. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-MX").format(n);
}

/** "12 de junio de 2026" from an ISO date (date-only, no timezone drift). */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "12–15 jun 2026" style range. */
export function formatDateRange(startIso: string, endIso?: string | null): string {
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", { ...opts, timeZone: "UTC" }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  };
  if (!endIso || endIso === startIso) {
    return fmt(startIso, { day: "numeric", month: "short", year: "numeric" });
  }
  const sameMonth = startIso.slice(0, 7) === endIso.slice(0, 7);
  const start = sameMonth
    ? fmt(startIso, { day: "numeric" })
    : fmt(startIso, { day: "numeric", month: "short" });
  const end = fmt(endIso, { day: "numeric", month: "short", year: "numeric" });
  return `${start}–${end}`;
}

/** "1 baño" / "2.5 baños" — pluralises on anything that is not exactly 1. */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${formatNumber(n)} ${n === 1 ? singular : pluralForm}`;
}
