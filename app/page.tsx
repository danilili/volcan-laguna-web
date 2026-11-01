import { Section } from "@/components/ui/Section";
import { Alimentos, Casas, Hero, Laguna, Mapa, Resenas, Retiros, Somos } from "@/components/sections";
import { getCasas, getCasasPrincipales, getHome, getImagen, getResenas, getRetirosProximos } from "@/lib/content";

/* Hero loop cut from Bea's "This is Volcán Laguna 2025" reel (see scripts/hero-video.sh). */
const HERO_VIDEO = {
  desktop: [{ src: "/video/hero-1080.mp4", type: "video/mp4" as const }],
  mobile: [{ src: "/video/hero-720.mp4", type: "video/mp4" as const }],
  poster: "/video/hero-poster.jpg",
};

/* Aerial photos: poster/fallback for the hero video (and the whole hero under reduced motion). */
const HERO_SLIDES = [
  "/images/general/general-04-vista-aerea-volcan-laguna.jpg",
  "/images/santuario/santuario-01-vista-aerea-jacuzzi-lago.jpg",
  "/images/general/general-05-amanecer-en-el-lago.jpg",
];

export default function HomePage() {
  const home = getHome();
  const s = home.secciones;
  const casas = getCasas();
  const principales = getCasasPrincipales();
  const proximo = getRetirosProximos()[0] ?? null;
  const slides = HERO_SLIDES.map((src) => getImagen(src, "Volcán Laguna desde el aire"));

  return (
    <>
      <Hero frase={home.fraseHero} subtitulo={home.subtituloHero} slides={slides} video={HERO_VIDEO} />

      <Section id="somos" compact>
        <Somos
          titulo={s.somos?.titulo ?? "Somos…"}
          texto={s.somos?.texto}
          casas={casas.map((c) => ({
            slug: c.slug,
            nombre: c.nombre,
            capacidad: c.capacidad,
            recamaras: c.recamaras,
            precioDesde: c.precioDesde,
            imagenPrincipal: c.imagenPrincipal,
            alt: getImagen(c.imagenPrincipal, c.nombre).alt,
          }))}
        />
      </Section>

      <Section id="casas" tone="blanco" compact>
        <Casas casas={principales} titulo={s.casas?.titulo ?? "Tres casas, una laguna"} texto={s.casas?.texto} />
      </Section>

      <Section id="la-laguna" compact>
        <Laguna titulo={s.laguna?.titulo ?? "La laguna"} texto={s.laguna?.texto} />
      </Section>

      <Section id="retiros" tone="laguna" compact>
        <Retiros titulo={s.retiros?.titulo ?? "Retiros"} texto={s.retiros?.texto} proximo={proximo} />
      </Section>

      <Section id="alimentos" tone="blanco" compact>
        <Alimentos titulo={s.alimentos?.titulo ?? "Alimentos"} texto={s.alimentos?.texto} />
      </Section>

      <Section id="resenas" compact>
        <Resenas titulo={s.resenas?.titulo ?? "Lo que dicen nuestros huéspedes"} texto={s.resenas?.texto} resenas={getResenas()} />
      </Section>

      <Section id="mapa" tone="blanco" compact>
        <Mapa titulo={s.mapa?.titulo ?? "A la orilla de la laguna"} texto={s.mapa?.texto} />
      </Section>
    </>
  );
}
