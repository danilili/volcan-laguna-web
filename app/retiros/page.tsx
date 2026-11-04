import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { getImagen, getRetirosPasados, getRetirosProximos, type Retiro } from "@/lib/content";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Retiros",
  description: "Retiros de yoga, bienestar y comunidad a la orilla de la laguna. Próximas fechas y retiros pasados.",
};

function RetiroCard({ r, i }: { r: Retiro; i: number }) {
  const foto = getImagen(r.imagenes[0]?.src ?? "/images/general/retiros-03-jardin-arboles.jpg", r.titulo);
  return (
    <Reveal as="li" delay={(i % 3) * 0.06}>
      <Link href={`/retiros/${r.slug}`} className="group flex h-full flex-col overflow-hidden rounded-card bg-crema-50 shadow-card transition-transform duration-200 hover:-translate-y-0.5">
        <span className="relative block aspect-[4/3] overflow-hidden">
          <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </span>
        <span className="flex flex-1 flex-col p-4 sm:p-5">
          {r.fechaInicio ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-arena-600">
              <Icon name="calendario" size={14} /> {formatDateRange(r.fechaInicio, r.fechaFin)}
            </span>
          ) : null}
          <span className="mt-1 font-display text-xl leading-tight text-laguna-900">{r.titulo}</span>
          <span className="mt-2 line-clamp-2 text-sm text-ink-500">{r.resumen}</span>
        </span>
      </Link>
    </Reveal>
  );
}

export default function RetirosPage() {
  const proximos = getRetirosProximos();
  const pasados = getRetirosPasados();
  const hero = getImagen("/images/general/retiros-05-muelle-ceremonia-atardecer.jpg", "Ceremonia al atardecer en el muelle de Volcán Laguna");

  return (
    <>
      <PageHero
        eyebrow="Retiros"
        title="Un lugar para volver a ti"
        lede="Ofrecemos hospedaje y toda la logística para que maestros y facilitadores creen experiencias transformadoras en un santuario de conexión con la naturaleza."
        image={hero}
        size="tall"
      >
        <Button href="/organiza-tu-retiro" size="lg">
          Organiza tu retiro
        </Button>
      </PageHero>

      <Section compact>
        <SectionHeading eyebrow="Próximas fechas" title={proximos.length ? "Próximos retiros" : "Pronto anunciaremos nuevas fechas"} />
        {proximos.length ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((r, i) => (
              <RetiroCard key={r.slug} r={r} i={i} />
            ))}
          </ul>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-ink-700">Mientras tanto, si organizas retiros, la laguna está lista para el tuyo.</p>
            <Todo>Los retiros se migrarán a Supabase en la semana 3; por ahora salen de content/retiros.json.</Todo>
          </div>
        )}
      </Section>

      {pasados.length ? (
        <Section tone="blanco" compact>
          <SectionHeading eyebrow="Memoria" title="Retiros que ya pasaron por aquí" />
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pasados.map((r, i) => (
              <RetiroCard key={r.slug} r={r} i={i} />
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
