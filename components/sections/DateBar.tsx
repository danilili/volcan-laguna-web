import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Visual-only date bar (week 1). In week 2 it becomes the real availability
 * search backed by Beds24; every field links to /reservar for now.
 * Phone: 2×2 grid so the hero still fits one screen. Tablet+: one row.
 */
export function DateBar({ className }: { className?: string }) {
  const field =
    "flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-laguna-900/4 sm:flex-1 sm:gap-3 sm:px-4";
  const label = "block text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500 sm:text-[11px]";
  const value = "block truncate text-sm sm:text-base";

  return (
    <div className={cn("rounded-card bg-crema-50 text-ink-900 shadow-card", className)}>
      <div className="grid grid-cols-2 sm:flex sm:divide-x sm:divide-crema-200">
        <Link href="/reservar" className={cn(field, "border-r border-b border-crema-200 sm:border-0")}>
          <Icon name="calendario" size={20} className="text-selva-600" />
          <span className="min-w-0">
            <span className={label}>Llegada</span>
            <span className={value}>Elige fecha</span>
          </span>
        </Link>
        <Link href="/reservar" className={cn(field, "border-b border-crema-200 sm:border-0")}>
          <Icon name="calendario" size={20} className="text-selva-600" />
          <span className="min-w-0">
            <span className={label}>Salida</span>
            <span className={value}>Elige fecha</span>
          </span>
        </Link>
        <Link href="/reservar" className={cn(field, "border-r border-crema-200 sm:border-0")}>
          <Icon name="personas" size={20} className="text-selva-600" />
          <span className="min-w-0">
            <span className={label}>Huéspedes</span>
            <span className={value}>¿Cuántos son?</span>
          </span>
        </Link>
        <div className="flex items-center p-2">
          <Link
            href="/reservar"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--radius-card)-0.5rem)] bg-laguna-800 px-4 text-sm font-medium text-crema-50 transition-colors duration-200 hover:bg-laguna-700 sm:h-12 sm:px-5 sm:text-base"
          >
            Disponibilidad
            <Icon name="flecha" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
