import type { ReactNode } from "react";
import { Mdx } from "@/components/content/Mdx";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Todo } from "@/components/ui/Todo";
import { getImagen, getPagina } from "@/lib/content";

type Props = {
  slug: string;
  fallbackTitle: string;
  eyebrow?: string;
  lede?: string;
  image?: string;
  size?: "tall" | "short";
  heroChildren?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
};

/** Hero + MDX body for a content page; shows a TODO when the MDX isn't exported yet. */
export function MdxPage({ slug, fallbackTitle, eyebrow, lede, image, size, heroChildren, before, after }: Props) {
  const page = getPagina(slug);
  const hero = image ? getImagen(image, page?.titulo ?? fallbackTitle) : undefined;
  return (
    <>
      <PageHero eyebrow={eyebrow} title={page?.titulo ?? fallbackTitle} lede={lede ?? page?.resumen} image={hero} size={size}>
        {heroChildren}
      </PageHero>
      {before}
      <Section compact containerSize="narrow">
        {page ? <Mdx source={page.body} /> : <Todo>Falta exportar content/{slug}.mdx desde el staging (scripts/export-wordpress.ts).</Todo>}
        {page?.actualizado ? <p className="mt-8 text-xs text-ink-500">Última actualización: {page.actualizado}</p> : null}
      </Section>
      {after}
    </>
  );
}
