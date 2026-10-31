import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  eyebrow?: string;
  lede?: string;
  image?: { src: string; alt: string };
  children?: ReactNode;
  /** "tall" for landing-like pages, "short" for text pages. */
  size?: "tall" | "short";
  className?: string;
};

/** Page hero: dark lagoon background, optional photo, title + lede. Sits under the fixed header. */
export function PageHero({ title, eyebrow, lede, image, children, size = "short", className }: Props) {
  return (
    <section
      className={cn(
        "relative flex flex-col justify-end bg-laguna-900 text-crema-50",
        size === "tall" ? "min-h-[70svh]" : "min-h-[46svh]",
        className,
      )}
    >
      {image ? (
        <>
          <Image src={image.src} alt={image.alt} fill sizes="100vw" preload quality={78} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-laguna-950/60 via-laguna-950/20 to-laguna-950/80" />
        </>
      ) : null}
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-28 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        {eyebrow ? <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-500">{eyebrow}</p> : null}
        <h1 className="max-w-3xl text-h1 text-crema-50">{title}</h1>
        {lede ? <p className="mt-3 max-w-xl text-lede text-crema-50/85">{lede}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
