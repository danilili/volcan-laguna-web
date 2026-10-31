import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404" title="Esta orilla no existe" lede="La página que buscas no está aquí, pero la laguna sí." />
      <Section compact>
        <Button href="/">Volver al inicio</Button>
      </Section>
    </>
  );
}
