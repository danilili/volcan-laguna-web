import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Mdx } from "@/components/content/Mdx";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { getImagen, getRetiro, getRetiros } from "@/lib/content";
import { formatDateRange } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";

export function generateStaticParams() {
  return getRetiros().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/retiros/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = getRetiro(slug);
  return r ? { title: r.titulo, description: r.resumen } : {};
}

export default async function RetiroPage({ params }: PageProps<"/retiros/[slug]">) {
  const { slug } = await params;
  const r = getRetiro(slug);
  if (!r) notFound();
  const hero = getImagen(r.imagenes[0]?.src ?? "/images/general/retiros-02-salon-chimenea.jpg", r.titulo);
  const resto = r.imagenes.slice(1, 9);

  return (
    <>
      <PageHero
        eyebrow={r.estado === "proximo" ? "Próximo retiro" : "Retiro pasado"}
        title={r.titulo}
        lede={r.fechaInicio ? formatDateRange(r.fechaInicio, r.fechaFin) : undefined}
        image={hero}
      >
        {r.estado === "proximo" ? (
          <Button href={whatsappUrl(`Hola, me interesa el retiro "${r.titulo}".`)} variant="whatsapp" size="lg">
            <Icon name="whatsapp" size={20} /> Quiero más información
          </Button>
        ) : null}
      </PageHero>
      <Section compact containerSize="narrow">
        <Mdx source={r.contenido} />
        {resto.length ? (
          <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3">
            {resto.map((g, i) => (
              <Reveal as="li" key={g.src} delay={(i % 2) * 0.05} className={i % 3 === 0 ? "col-span-2" : ""}>
                <div className={`relative overflow-hidden rounded-card ${i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                  <Image src={g.src} alt={g.alt || getImagen(g.src).alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
              </Reveal>
            ))}
          </ul>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/retiros" variant="secondary">
            Todos los retiros
          </Button>
          <Button href="/organiza-tu-retiro">Organiza el tuyo</Button>
        </div>
      </Section>
    </>
  );
}
