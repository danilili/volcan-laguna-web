import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { getImagenesDeCarpeta } from "@/lib/content";

/** Six photos, one sentence. */
export function Alimentos({ titulo, texto }: { titulo: string; texto?: string }) {
  const fotos = getImagenesDeCarpeta("alimentos")
    .filter((f) => /alimentos-(01|04|06|08|10|13)/.test(f.src))
    .slice(0, 6);
  // Fallback if the manifest isn't there yet.
  const list = fotos.length === 6 ? fotos : [1, 4, 6, 8, 10, 13].map((n) => ({
    src: `/images/alimentos/alimentos-${String(n).padStart(2, "0")}.jpg`,
    alt: "Alimentos en Volcán Laguna",
    width: 1920,
    height: 1280,
  }));

  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-arena-600">Alimentos</p>
        <h2 className="text-h2">{titulo}</h2>
        {texto ? <p className="mt-3 text-lede text-ink-500">{texto}</p> : null}
      </div>
      <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        {list.map((f, i) => (
          <Reveal as="li" key={f.src} delay={i * 0.04}>
            <Link href="/alimentos" className="group relative block aspect-square overflow-hidden rounded-[0.9rem] sm:rounded-card">
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </Link>
          </Reveal>
        ))}
      </ul>
      <div className="mt-6 text-center">
        <Button href="/alimentos" variant="secondary">
          Conoce la cocina
        </Button>
      </div>
    </>
  );
}
