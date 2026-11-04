import { Icon, type IconName } from "@/components/ui/Icon";
import type { Casa } from "@/lib/content";

type Item = { icon: IconName; label: string };

/** What every stay includes; jacuzzi and fireplace are added from the house's amenities. */
const INCLUIDO: Item[] = [
  { icon: "muelle", label: "Muelle y acceso al lago" },
  { icon: "kayak", label: "Kayak" },
  { icon: "paddleboard", label: "Paddleboard" },
  { icon: "limpieza", label: "Servicio de limpieza" },
  { icon: "cocina", label: "Cocina equipada" },
  { icon: "jardin", label: "Jardín y terraza" },
  { icon: "estacionamiento", label: "Estacionamiento" },
];

/** Services booked separately (at reservation time or by WhatsApp). */
const CON_COSTO: Item[] = [
  { icon: "masaje", label: "Masajes" },
  { icon: "temazcal", label: "Temazcal" },
  { icon: "lancha", label: "Paseo en lancha" },
  { icon: "cascada", label: "Tour a las cascadas en el ecoparque Arcadia" },
];

/** First line of "Incluido": what part of the property the stay covers. */
function casaLabel(casa: Casa): string {
  if (casa.padre) return "La casa para ustedes, con 2 recámaras abiertas";
  if (casa.slug === "moringa") return "La casita completa, con jardín propio";
  return "Casa y terreno completos";
}

function Lista({ titulo, items, nota }: { titulo: string; items: Item[]; nota?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl text-laguna-900">{titulo}</h2>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-2.5 text-sm text-ink-700">
            <Icon name={it.icon} size={22} className="mt-px text-selva-600" />
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
      {nota ? <p className="mt-3 text-xs text-ink-500">{nota}</p> : null}
    </div>
  );
}

/** "Incluido" and "Con costo extra" blocks for a house page. */
export function CasaServicios({ casa }: { casa: Casa }) {
  const incluido: Item[] = [{ icon: "casa", label: casaLabel(casa) }, ...INCLUIDO];
  if (casa.amenidades.includes("jacuzzi")) incluido.splice(2, 0, { icon: "jacuzzi", label: "Jacuzzi" });
  if (casa.amenidades.includes("chimenea")) incluido.push({ icon: "chimenea", label: "Chimenea" });

  return (
    <div className="mt-8 grid gap-8 rounded-card bg-crema-50 p-5 shadow-card sm:p-6 lg:grid-cols-2 lg:gap-10">
      <Lista titulo="Incluido" items={incluido} />
      <Lista titulo="Con costo extra" items={CON_COSTO} nota="Se contratan al reservar o por WhatsApp." />
    </div>
  );
}
