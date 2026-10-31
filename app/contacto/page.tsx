import type { Metadata } from "next";
import { Mapa } from "@/components/sections/Mapa";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { getImagen } from "@/lib/content";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o correo. Paseo de la Rivera, La Laguna, Santa María del Oro, Nayarit.",
};

export default function ContactoPage() {
  const hero = getImagen("/images/general/general-03-escalinata-flores.jpg", "Escalinata con flores hacia la laguna");
  return (
    <>
      <PageHero eyebrow="Contacto" title="Hablemos" lede="Respondemos por WhatsApp casi siempre el mismo día." image={hero}>
        <div className="flex flex-wrap gap-3">
          <Button href={whatsappUrl()} variant="whatsapp" size="lg">
            <Icon name="whatsapp" size={20} /> {site.phoneDisplay}
          </Button>
          <Button href={`mailto:${site.email}`} variant="inverse" size="lg">
            <Icon name="correo" size={20} /> Correo
          </Button>
        </div>
      </PageHero>
      <Section compact>
        <Mapa titulo="Cómo llegar" texto="A la orilla de la laguna, en el pueblo de La Laguna." />
      </Section>
      <Section tone="blanco" compact containerSize="narrow">
        <Todo>Formulario de contacto (correo como copia; WhatsApp es el canal principal) en la semana 3.</Todo>
      </Section>
    </>
  );
}
