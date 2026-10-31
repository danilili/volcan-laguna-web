import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { HeroSlideshow, type Slide } from "./HeroSlideshow";
import { DateBar } from "./DateBar";

type Props = {
  frase: string;
  subtitulo?: string;
  slides: Slide[];
};

export function Hero({ frase, subtitulo, slides }: Props) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end text-crema-50" aria-labelledby="hero-titulo">
      <HeroSlideshow slides={slides} />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-32 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 rounded-pill bg-crema-50/12 px-3 py-1.5 text-sm backdrop-blur-sm">
            <Icon name="estrella" size={16} className="text-arena-500" />
            <span className="font-medium">{site.google.rating}</span>
            <span className="text-crema-50/80">· {site.google.reviews} reseñas en Google</span>
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 id="hero-titulo" className="max-w-3xl text-display text-crema-50">
            {frase}
          </h1>
        </Reveal>

        {subtitulo ? (
          <Reveal delay={0.14}>
            <p className="mt-4 max-w-xl text-lede text-crema-50/85">{subtitulo}</p>
          </Reveal>
        ) : null}

        <Reveal delay={0.2}>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/reservar" size="lg">
              Reservar
            </Button>
            <Button href="/organiza-tu-retiro" variant="inverse" size="lg">
              Organiza tu retiro
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.28} className="mt-8 sm:mt-10">
          <DateBar />
        </Reveal>
      </div>
    </section>
  );
}
