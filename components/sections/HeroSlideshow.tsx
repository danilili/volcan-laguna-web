"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

export type Slide = { src: string; alt: string };

/**
 * Full-bleed crossfading photos with a slow Ken Burns drift.
 * Under prefers-reduced-motion it shows the first photo, static.
 * Replace with a muted looping video when Bea's footage exists (TODO).
 */
export function HeroSlideshow({ slides, interval = 7000 }: { slides: Slide[]; interval?: number }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => window.clearInterval(id);
  }, [reduce, slides.length, interval]);

  const visible = reduce ? [slides[0]] : slides;

  return (
    <div className="absolute inset-0 overflow-hidden bg-laguna-950" aria-hidden>
      {visible.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1600ms] ease-out",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="100vw"
              quality={78}
              preload={i === 0}
              className={cn("object-cover", active && !reduce && "animate-ken-burns")}
              // Restart the Ken Burns animation each time a slide becomes active.
              key={`${s.src}-${active}`}
            />
          </div>
        );
      })}
      {/* Legibility gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-laguna-950/55 via-laguna-950/10 to-laguna-950/70" />
    </div>
  );
}
