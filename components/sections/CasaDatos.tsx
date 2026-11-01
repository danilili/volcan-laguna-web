import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";

type Props = {
  capacidad: number;
  recamaras: number;
  banos?: number;
  size?: 16 | 18;
  className?: string;
};

/** Guests · bedrooms · bathrooms, each with its icon and label. Shared by cards and tiles. */
export function CasaDatos({ capacidad, recamaras, banos, size = 18, className }: Props) {
  const datos = [
    { icon: "personas" as const, label: `Hasta ${capacidad}` },
    { icon: "recamara" as const, label: plural(recamaras, "recámara", "recámaras") },
    ...(banos ? [{ icon: "bano" as const, label: plural(banos, "baño", "baños") }] : []),
  ];
  return (
    <span className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700", className)}>
      {datos.map((d) => (
        <span key={d.icon} className="inline-flex items-center gap-1 whitespace-nowrap">
          <Icon name={d.icon} size={size} className="text-selva-600" /> {d.label}
        </span>
      ))}
    </span>
  );
}
