import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

export type SectionTone = "crema" | "blanco" | "laguna" | "arena" | "selva";

type Props = {
  children: ReactNode;
  id?: string;
  tone?: SectionTone;
  className?: string;
  /** Skip the inner Container (for full-bleed content). */
  bleed?: boolean;
  containerSize?: "narrow" | "default" | "wide";
  /** Smaller vertical padding (Home sections must fit a phone screen). */
  compact?: boolean;
  "aria-labelledby"?: string;
};

const tones: Record<SectionTone, string> = {
  crema: "bg-crema-100 text-ink-900",
  blanco: "bg-crema-50 text-ink-900",
  laguna: "bg-laguna-900 text-crema-50 [&_h1,&_h2,&_h3]:text-crema-50",
  arena: "bg-arena-100 text-ink-900",
  selva: "bg-selva-700 text-crema-50 [&_h1,&_h2,&_h3]:text-crema-50",
};

export function Section({
  children,
  id,
  tone = "crema",
  className,
  bleed = false,
  containerSize = "default",
  compact = false,
  ...rest
}: Props) {
  return (
    <section
      id={id}
      className={cn(tones[tone], compact ? "py-10 sm:py-14" : "py-14 sm:py-20 lg:py-24", className)}
      {...rest}
    >
      {bleed ? children : <Container size={containerSize}>{children}</Container>}
    </section>
  );
}

/** Eyebrow + title + optional lede. Keeps Home copy to two lines max. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {lede ? <p className="mt-3 text-lede text-ink-500 [section.bg-laguna-900_&]:text-laguna-100">{lede}</p> : null}
    </div>
  );
}
