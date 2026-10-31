import { StaticMap } from "@/components/layout/StaticMap";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { mapsDirectionsUrl, site, whatsappUrl } from "@/lib/site";

/* TODO: confirm travel times with Bea. */
const comoLlegar = [
  { desde: "Tepic", tiempo: "≈ 45 min", nota: "por la carretera a Santa María del Oro" },
  { desde: "Guadalajara", tiempo: "≈ 2 h 30 min", nota: "por la autopista a Tepic" },
  { desde: "Puerto Vallarta", tiempo: "≈ 3 h 30 min", nota: "vía Compostela y Tepic" },
];

export function Mapa({ titulo, texto }: { titulo: string; texto?: string }) {
  const a = site.address;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-5 lg:gap-12">
      <Reveal className="lg:col-span-3">
        <StaticMap zoom={13} />
      </Reveal>
      <Reveal delay={0.08} className="lg:col-span-2">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-600">Cómo llegar</p>
        <h2 className="text-h2">{titulo}</h2>
        {texto ? <p className="mt-3 text-lede text-ink-500">{texto}</p> : null}
        <address className="mt-4 flex items-start gap-2 text-ink-700 not-italic">
          <Icon name="ubicacion" size={20} className="mt-0.5 text-selva-600" />
          <span>
            {a.street}, {a.neighborhood}, {a.city}, {a.stateShort} {a.zip}
          </span>
        </address>
        <ul className="mt-4 divide-y divide-crema-300 border-y border-crema-300 text-sm">
          {comoLlegar.map((c) => (
            <li key={c.desde} className="flex items-baseline justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium text-laguna-900">Desde {c.desde}</span>
                <span className="hidden text-ink-500 sm:inline"> · {c.nota}</span>
              </span>
              <span className="whitespace-nowrap text-ink-700">{c.tiempo}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={mapsDirectionsUrl} variant="secondary">
            <Icon name="ubicacion" size={18} /> Abrir en Maps
          </Button>
          <Button href={whatsappUrl("Hola, ¿me ayudan con indicaciones para llegar a Volcán Laguna?")} variant="whatsapp">
            <Icon name="whatsapp" size={18} /> WhatsApp
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
