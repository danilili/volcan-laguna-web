import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mdx } from "@/components/content/Mdx";
import { CasaServicios } from "@/components/sections/CasaServicios";
import { CasaVideo } from "@/components/sections/CasaVideo";
import { amenityIcon, amenityLabel } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { getCasa, getCasas, getImagen, getVariantes } from "@/lib/content";
import { formatMXN } from "@/lib/format";
import { site, whatsappUrl } from "@/lib/site";

/** Amenities already shown in the key facts or the "Incluido" block, plus kitchen gear folded into "cocina equipada". */
const AMENIDADES_CUBIERTAS = new Set([
  "laguna", "lago", "muelle", "kayak", "kayaks", "cocina", "recamara", "recamaras", "bano", "banos",
  "estacionamiento", "jardin", "terraza", "chimenea", "jacuzzi", "limpieza", "yoga",
  "tostador", "especias", "licuadora", "microondas", "detector-de-humo", "cafetera", "estufa", "refrigerador",
]);

export function generateStaticParams() {
  return getCasas().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/casas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const casa = getCasa(slug);
  if (!casa) return {};
  return {
    title: casa.nombre,
    description: casa.resumen,
    openGraph: { images: [{ url: casa.imagenPrincipal }] },
  };
}

export default async function CasaPage({ params }: PageProps<"/casas/[slug]">) {
  const { slug } = await params;
  const casa = getCasa(slug);
  if (!casa) notFound();

  const hero = getImagen(casa.imagenPrincipal, casa.nombre);
  const galeria = casa.galeria.filter((g) => g.src !== casa.imagenPrincipal).slice(0, 8);
  const variantes = getVariantes(casa.slug);
  const padre = casa.padre ? getCasa(casa.padre) : null;
  const extras = casa.amenidades.filter((a) => !AMENIDADES_CUBIERTAS.has(a));

  const datos = [
    { icon: "personas" as const, label: `Hasta ${casa.capacidad} personas` },
    { icon: "recamara" as const, label: `${casa.recamaras} ${casa.recamaras === 1 ? "recámara" : "recámaras"}` },
    ...(casa.banos ? [{ icon: "bano" as const, label: `${casa.banos} ${casa.banos === 1 ? "baño" : "baños"}` }] : []),
    { icon: "reloj" as const, label: `Entrada ${site.checkIn} · Salida ${site.checkOut}` },
    { icon: "calendario" as const, label: `Mínimo ${site.minNights} noches` },
  ];

  return (
    <>
      <PageHero eyebrow={padre ? `Parte de ${padre.nombre}` : "Casa"} title={casa.nombre} lede={casa.resumen} image={hero} size="tall">
        <div className="flex flex-wrap items-center gap-3">
          <Button href={`/reservar?casa=${casa.slug}`} size="lg">
            Reservar
          </Button>
          <p className="text-crema-50/90">
            <span className="font-display text-2xl text-crema-50">{formatMXN(casa.precioNoche)}</span> / noche
          </p>
        </div>
      </PageHero>

      <Section compact>
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Key facts */}
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-ink-700">
              {datos.map((d) => (
                <li key={d.label} className="inline-flex items-center gap-2">
                  <Icon name={d.icon} size={20} className="text-selva-600" /> {d.label}
                </li>
              ))}
            </ul>

            {/* What the stay includes and what is booked separately */}
            <CasaServicios casa={casa} />

            {/* Remaining amenities not already covered above */}
            {extras.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {extras.map((a) => (
                  <li key={a} className="inline-flex items-center gap-1.5 rounded-pill border border-laguna-800/15 px-3 py-1.5 text-xs text-ink-700">
                    <Icon name={amenityIcon[a] ?? "check"} size={16} className="text-selva-600" />
                    {amenityLabel[a] ?? a.replace(/-/g, " ")}
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Walkthrough video (only houses with `video` in their frontmatter) */}
            {casa.video ? <CasaVideo video={casa.video} titulo={casa.nombre} /> : null}

            {/* Long description, collapsed */}
            {casa.body ? (
              <details className="group mt-8 rounded-card bg-crema-50 p-5 shadow-card open:pb-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl text-laguna-900 [&::-webkit-details-marker]:hidden">
                  Conoce la casa a detalle
                  <Icon name="chevron" size={22} className="transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <Mdx source={casa.body} className="mt-4" />
              </details>
            ) : null}

            {/* Gallery */}
            {galeria.length ? (
              <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3">
                {galeria.map((g, i) => {
                  const meta = getImagen(g.src, g.alt);
                  return (
                    <Reveal as="li" key={g.src} delay={(i % 2) * 0.05} className={i % 3 === 0 ? "col-span-2" : ""}>
                      <div className={`relative overflow-hidden rounded-card ${i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                        <Image src={g.src} alt={g.alt || meta.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
                      </div>
                    </Reveal>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {/* Sticky booking card */}
          <aside className="lg:col-span-1">
            <div className="rounded-card bg-crema-50 p-5 shadow-card lg:sticky lg:top-28">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Precio por noche</p>
              <p className="mt-1 font-display text-3xl text-laguna-900">{formatMXN(casa.precioNoche)}</p>
              <p className="mt-1 text-sm text-ink-500">La disponibilidad y el total se confirman al reservar.</p>
              <div className="mt-5 flex flex-col gap-2">
                <Button href={`/reservar?casa=${casa.slug}`} fullWidth>
                  Ver fechas y reservar
                </Button>
                <Button href={whatsappUrl(`Hola, me interesa ${casa.nombre}.`)} variant="whatsapp" fullWidth>
                  <Icon name="whatsapp" size={20} /> Preguntar por WhatsApp
                </Button>
              </div>
              {variantes.length || padre ? (
                <div className="mt-5 border-t border-crema-200 pt-4 text-sm">
                  {variantes.map((v) => (
                    <p key={v.slug}>
                      ¿Son 4 o menos?{" "}
                      <Link href={`/casas/${v.slug}`} className="font-medium text-laguna-700 underline underline-offset-2">
                        {v.nombre}
                      </Link>{" "}
                      a {formatMXN(v.precioNoche)} / noche.
                    </p>
                  ))}
                  {padre ? (
                    <p>
                      ¿Son más?{" "}
                      <Link href={`/casas/${padre.slug}`} className="font-medium text-laguna-700 underline underline-offset-2">
                        {padre.nombre} completa
                      </Link>{" "}
                      para {padre.capacidad}.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <ul className="mt-5 space-y-1.5 border-t border-crema-200 pt-4 text-xs text-ink-500">
                {site.policies.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-500 italic">{site.wifiNote}</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
