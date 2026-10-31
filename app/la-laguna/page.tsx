import type { Metadata } from "next";
import Image from "next/image";
import { Laguna } from "@/components/sections/Laguna";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { getImagen, getImagenesDeCarpeta } from "@/lib/content";

export const metadata: Metadata = {
  title: "La laguna",
  description: "La Laguna de Santa María del Oro: un cráter volcánico lleno de agua, a 45 minutos de Tepic.",
};

export default function LaLagunaPage() {
  const hero = getImagen("/images/general/general-05-amanecer-en-el-lago.jpg", "Amanecer en la laguna");
  const fotos = getImagenesDeCarpeta("general").filter((f) => f.src.includes("/general-"));
  return (
    <>
      <PageHero eyebrow="El lugar" title="Una laguna dentro de un volcán" lede="Agua tibia, selva baja y silencio. Así es Santa María del Oro." image={hero} size="tall" />
      <Section compact>
        <Laguna titulo="Qué hacer en la laguna" texto="Cuatro experiencias que se organizan desde la casa." />
      </Section>
      <Section tone="blanco" compact containerSize="narrow">
        <Todo>Texto de la laguna (historia, clima, temporada) pendiente de redactar con Bea; no existe en el staging.</Todo>
        {fotos.length ? (
          <ul className="mt-8 grid grid-cols-2 gap-2 sm:gap-3">
            {fotos.map((f, i) => (
              <Reveal as="li" key={f.src} delay={(i % 2) * 0.05} className={i % 3 === 0 ? "col-span-2" : ""}>
                <div className={`relative overflow-hidden rounded-card ${i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                  <Image src={f.src} alt={f.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
              </Reveal>
            ))}
          </ul>
        ) : null}
      </Section>
    </>
  );
}
