"use client";

import { useRef, useState } from "react";
import type { Video } from "@/lib/content";

/**
 * House walkthrough player: poster + big play button, then the native
 * controls with sound. Nothing loads until the guest asks for it
 * (`preload="none"`); the file lives in Vercel Blob, not in the repo.
 */
export function CasaVideo({ video, titulo }: { video: Video; titulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    const el = ref.current;
    if (!el) return;
    setStarted(true);
    el.play().catch(() => {});
  };

  return (
    <figure className="mt-10">
      <div className="relative aspect-[1920/972] overflow-hidden rounded-card bg-laguna-950 shadow-card">
        <video
          ref={ref}
          className="h-full w-full object-cover"
          controls={started}
          preload="none"
          playsInline
          poster={video.poster}
          src={video.src}
          aria-label={`Recorrido en video de ${titulo}`}
          onPlay={() => setStarted(true)}
        />
        {!started ? (
          <button
            type="button"
            onClick={start}
            aria-label={`Reproducir el recorrido de ${titulo}`}
            className="group absolute inset-0 flex items-center justify-center bg-gradient-to-t from-laguna-950/60 via-transparent to-transparent"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-crema-50/95 text-laguna-900 shadow-card transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105 sm:h-24 sm:w-24">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="absolute bottom-4 left-4 right-4 text-left text-sm text-crema-50 sm:text-base">
              Recorrido en video · con sonido
            </span>
          </button>
        ) : null}
      </div>
      <figcaption className="mt-2 text-xs text-ink-500">
        Grabado por Bea; el video pesa alrededor de 25 MB y se descarga solo al dar play.
      </figcaption>
    </figure>
  );
}
