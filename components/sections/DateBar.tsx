import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Visual-only date bar (week 1). In week 2 it becomes the real availability
 * search backed by Beds24; every field links to /reservar for now.
 */
export function DateBar() {
  const field =
    "flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-laguna-900/4 sm:py-4";
  return (
    <div className="rounded-card bg-crema-50 text-ink-900 shadow-card">
      <div className="flex flex-col divide-y divide-crema-200 sm:flex-row sm:divide-x sm:divide-y-0">
        <Link href="/reservar" className={field}>
          <Icon name="calendario" size={22} className="text-selva-600" />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Llegada</span>
            <span className="block truncate text-sm sm:text-base">Elige fecha</span>
          </span>
        </Link>
        <Link href="/reservar" className={field}>
          <Icon name="calendario" size={22} className="text-selva-600" />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Salida</span>
            <span className="block truncate text-sm sm:text-base">Elige fecha</span>
          </span>
        </Link>
        <Link href="/reservar" className={field}>
          <Icon name="personas" size={22} className="text-selva-600" />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Huéspedes</span>
            <span className="block truncate text-sm sm:text-base">¿Cuántos son?</span>
          </span>
        </Link>
        <div className="p-2 sm:flex sm:items-center">
          <Link
            href="/reservar"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius-card)-0.5rem)] bg-laguna-800 px-5 font-medium text-crema-50 transition-colors duration-200 hover:bg-laguna-700 sm:w-auto"
          >
            Ver disponibilidad
            <Icon name="flecha" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
