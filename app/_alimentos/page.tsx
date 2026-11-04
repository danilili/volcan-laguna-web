import type { Metadata } from "next";
import Image from "next/image";
import { MdxPage } from "@/components/content/MdxPage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { getImagenesDeCarpeta } from "@/lib/content";

// Hidden for launch at Bea's request (the "_" keeps this folder out of the routes). Rename to app/alimentos to publish it.
export const metadata: Metadata = {
  title: "Alimentos",
  description: "Cocina casera, de temporada y con vista al lago, para tu estancia o tu retiro.",
};

export default function AlimentosPage() {
  const fotos = getImagenesDeCarpeta("alimentos");
  return (
    <MdxPage
      slug="alimentos"
      fallbackTitle="Alimentos"
      eyebrow="Cocina"
      image="/images/alimentos/alimentos-10-buffet-con-vista-al-lago.jpg"
      after={
        fotos.length ? (
          <Section tone="blanco" compact>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {fotos.map((f, i) => (
                <Reveal as="li" key={f.src} delay={(i % 3) * 0.04}>
                  <div className="relative aspect-square overflow-hidden rounded-card">
                    <Image src={f.src} alt={f.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
                  </div>
                </Reveal>
              ))}
            </ul>
          </Section>
        ) : null
      }
    />
  );
}
