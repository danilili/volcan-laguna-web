import type { Metadata } from "next";
import { Suspense } from "react";
import { DateBar } from "@/components/sections/DateBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { getCasa, getImagen } from "@/lib/content";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reservar",
  description: "Consulta fechas y precios por noche y reserva tu casa en Volcán Laguna.",
};

async function CasaElegida({ searchParams }: { searchParams: PageProps<"/reservar">["searchParams"] }) {
  const { casa } = await searchParams;
  const slug = Array.isArray(casa) ? casa[0] : casa;
  const c = slug ? getCasa(slug) : null;
  if (!c) return null;
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-pill bg-crema-50/12 px-3 py-1.5 text-sm">
      <Icon name="check" size={16} className="text-arena-500" /> {c.nombre}
    </p>
  );
}

export default function ReservarPage({ searchParams }: PageProps<"/reservar">) {
  const hero = getImagen("/images/santuario/santuario-02-muelle-privado-lago.jpg", "Muelle privado al lago");
  return (
    <>
      <PageHero eyebrow="Reservar" title="Elige tus fechas" lede="Precios por noche en vivo y confirmación inmediata." image={hero}>
        <Suspense fallback={null}>
          <CasaElegida searchParams={searchParams} />
        </Suspense>
      </PageHero>
      <Section compact>
        <DateBar />
        <div className="mt-8 space-y-4">
          <Todo>Semana 2: buscador y calendario con precios y disponibilidad de Beds24; checkout que llama al webhook de n8n (origen web).</Todo>
          <p className="text-ink-700">Mientras tanto, reserva directo con nosotros:</p>
          <Button href={whatsappUrl("Hola, quiero reservar en Volcán Laguna.")} variant="whatsapp">
            <Icon name="whatsapp" size={20} /> Reservar por WhatsApp
          </Button>
        </div>
      </Section>
    </>
  );
}
