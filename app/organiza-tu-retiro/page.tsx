import type { Metadata } from "next";
import { MdxPage } from "@/components/content/MdxPage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Organiza tu retiro",
  description: "Las tres casas y la laguna para tu grupo: hasta 28 personas. Cotiza tu retiro.",
};

export default function OrganizaTuRetiroPage() {
  return (
    <MdxPage
      slug="organiza-tu-retiro"
      fallbackTitle="Organiza tu retiro"
      eyebrow="Para facilitadores"
      image="/images/general/retiros-05-muelle-ceremonia-atardecer.jpg"
      size="tall"
      heroChildren={
        <Button href={whatsappUrl("Hola, quiero cotizar un retiro en Volcán Laguna.")} variant="whatsapp" size="lg">
          <Icon name="whatsapp" size={20} /> Cotizar por WhatsApp
        </Button>
      }
      after={
        <Section tone="arena" compact containerSize="narrow">
          <Todo>Formulario de cotización (Supabase, tabla cotizaciones_retiro) en la semana 3.</Todo>
        </Section>
      }
    />
  );
}
