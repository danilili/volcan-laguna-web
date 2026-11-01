"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { HeroSlideshow, type Slide } from "./HeroSlideshow";

export type HeroVideoSource = { src: string; type: "video/mp4" | "video/webm" };
export type HeroVideoConfig = {
  /** Sources for wide screens (1080p). WebM first, MP4 fallback. */
  desktop: HeroVideoSource[];
  /** Lighter sources for phones (720p). */
  mobile: HeroVideoSource[];
  poster: string;
};

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Muted looping hero video on top of the photo slideshow.
 * - The slideshow renders first (it is the LCP); the video mounts after the
 *   page has loaded and fades in once it is actually playing.
 * - Phones get the 720p files; wide screens the 1080p ones.
 * - No video under prefers-reduced-motion, Save-Data or slow connections.
 * - Pauses while scrolled out of view.
 */
export function HeroVideo({ video, slides }: { video: HeroVideoConfig; slides: Slide[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<HeroVideoSource[] | null>(null);
  const [playing, setPlaying] = useState(false);

  // Decide after mount: never during SSR, never before the page has loaded.
  useEffect(() => {
    if (reduce) return;
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return;

    const pick = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setSources(mobile ? video.mobile : video.desktop);
    };
    if (document.readyState === "complete") {
      const id = window.setTimeout(pick, 300);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", pick, { once: true });
    return () => window.removeEventListener("load", pick);
  }, [reduce, video]);

  // Pause when out of view (saves battery while reading the rest of the page).
  useEffect(() => {
    const el = ref.current;
    if (!el || !sources) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sources]);

  return (
    <>
      <HeroSlideshow slides={slides} />
      {sources ? (
        <video
          ref={ref}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out",
            playing ? "opacity-100" : "opacity-0",
          )}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="auto"
          poster={video.poster}
          aria-hidden
          onPlaying={() => setPlaying(true)}
          onError={() => setSources(null)}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : null}
      {sources ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b from-laguna-950/55 via-laguna-950/10 to-laguna-950/70 transition-opacity duration-1000",
            playing ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      ) : null}
    </>
  );
}
