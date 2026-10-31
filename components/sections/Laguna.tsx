import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { getImagen } from "@/lib/content";

type Experiencia = { icon: IconName; titulo: string; texto: string; src: string };

/* TODO: confirm the four experiences and their photos with Bea. */
const experiencias: Experiencia[] = [
  { icon: "lancha", titulo: "Paseo en lancha", texto: "Al amanecer o al atardecer, la laguna en silencio.", src: "/images/general/general-01-lancha-lago.jpg" },
  { icon: "kayak", titulo: "Kayak", texto: "Rema desde el muelle, a tu ritmo.", src: "/images/general/general-05-amanecer-en-el-lago.jpg" },
  { icon: "temazcal", titulo: "Temazcal", texto: "Ceremonia con guía, al pie del volcán.", src: "/images/general/retiros-04-jacuzzi-noche.jpg" },
  { icon: "yoga", titulo: "Yoga y masajes", texto: "Clases y masajes en casa, con previa reserva.", src: "/images/general/retiros-01-tapetes-yoga.jpg" },
];

export function Laguna({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <>
      <SectionHeading eyebrow="La laguna" title={titulo} lede={texto} align="center" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {experiencias.map((e, i) => {
          const img = getImagen(e.src, e.titulo);
          return (
            <Reveal as="li" key={e.titulo} delay={i * 0.06}>
              <Link
                href="/la-laguna"
                className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card bg-laguna-900 p-4 text-crema-50 shadow-card sm:aspect-[4/5]"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 24vw, 48vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-laguna-950/85 via-laguna-950/20 to-transparent" />
                <div className="relative">
                  <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-pill bg-crema-50/15 backdrop-blur-sm">
                    <Icon name={e.icon} size={22} />
                  </span>
                  <p className="font-display text-lg leading-tight sm:text-xl">{e.titulo}</p>
                  <p className="mt-1 hidden text-sm text-crema-50/80 sm:block">{e.texto}</p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </>
  );
}
