import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import type { Resena } from "@/lib/content";
import { mapsUrl, site } from "@/lib/site";

export function Resenas({ titulo, texto, resenas }: { titulo: string; texto?: string; resenas: Resena[] }) {
  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-pill bg-crema-50 px-4 py-2 shadow-card">
          <Icon name="google" size={20} />
          <span className="font-display text-2xl text-laguna-900">{site.google.rating}</span>
          <span className="flex text-arena-500" aria-label={`${site.google.rating} de 5 estrellas`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} name="estrella" size={16} />
            ))}
          </span>
          <span className="text-sm text-ink-500">{site.google.reviews} reseñas</span>
        </p>
        <h2 className="text-h2">{titulo}</h2>
        {texto ? <p className="mt-3 text-lede text-ink-500">{texto}</p> : null}
      </div>

      {resenas.length ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resenas.slice(0, 3).map((r, i) => (
            <Reveal as="li" key={r.autor + i} delay={i * 0.06} className="flex flex-col rounded-card bg-crema-50 p-5 shadow-card">
              <span className="flex text-arena-500" aria-hidden>
                {Array.from({ length: r.estrellas ?? 5 }).map((_, j) => (
                  <Icon key={j} name="estrella" size={14} />
                ))}
              </span>
              <blockquote className="mt-3 flex-1 text-ink-700">“{r.texto}”</blockquote>
              <footer className="mt-4 text-sm text-ink-500">
                <span className="font-medium text-laguna-900">{r.autor}</span>
                {r.fecha ? <span> · {r.fecha}</span> : null}
              </footer>
            </Reveal>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 text-center">
        <Button href={mapsUrl} variant="secondary">
          Lee las reseñas en Google
        </Button>
      </div>
    </>
  );
}
