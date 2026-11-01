import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { mapsUrl, nav, site, whatsappUrl } from "@/lib/site";
import { Year } from "./Year";

const links = [
  ...nav,
  { href: "/organiza-tu-retiro", label: "Organiza tu retiro" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function Footer() {
  const a = site.address;
  return (
    <footer className="bg-laguna-950 text-crema-50">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-3" aria-label={`${site.name}, inicio`}>
            <Image src="/brand/vl-emblema-blanco.png" alt="" width={44} height={44} />
            <span className="font-display text-2xl leading-none tracking-tight">
              Volcán <span className="font-light">Laguna</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-laguna-300">{site.tagline}, Nayarit.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-crema-50">
            <Icon name="google" size={16} />
            <span className="font-medium">{site.google.rating}</span>
            <span className="text-laguna-300">· {site.google.reviews} reseñas en Google</span>
          </p>
        </div>

        {/* Contact */}
        <div>
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-arena-500">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 hover:text-arena-300">
                <Icon name="whatsapp" size={18} className="mt-0.5 text-arena-500" />
                <span>WhatsApp {site.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={`tel:+${site.phone}`} className="inline-flex items-start gap-2 hover:text-arena-300">
                <Icon name="telefono" size={18} className="mt-0.5 text-arena-500" />
                <span>{site.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-start gap-2 break-all hover:text-arena-300">
                <Icon name="correo" size={18} className="mt-0.5 text-arena-500" />
                <span>{site.email}</span>
              </a>
            </li>
            <li>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 hover:text-arena-300">
                <Icon name="ubicacion" size={18} className="mt-0.5 text-arena-500" />
                <address className="not-italic">
                  {a.street}, {a.neighborhood}
                  <br />
                  {a.city}, {a.stateShort}, C.P. {a.zip}
                </address>
              </a>
            </li>
          </ul>
        </div>

        {/* Stay info */}
        <div>
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-arena-500">Tu estancia</h2>
          <ul className="mt-4 space-y-3 text-sm text-crema-50/90">
            <li className="flex items-start gap-2">
              <Icon name="reloj" size={18} className="mt-0.5 text-arena-500" />
              <span>
                Entrada {site.checkIn} · Salida {site.checkOut}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="calendario" size={18} className="mt-0.5 text-arena-500" />
              <span>Estancia mínima {site.minNights} noches ({site.minNightsHighSeason} en temporada alta)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="sinInternet" size={18} className="mt-0.5 text-arena-500" />
              <span>
                Sin internet. <span className="text-laguna-300">{site.wifiNote}</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="musica" size={18} className="mt-0.5 text-arena-500" />
              <span>Música a volumen moderado y hasta las 12 de la noche</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" size={18} className="mt-0.5 text-arena-500" />
              <span>Sin mascotas · No se fuma dentro</span>
            </li>
          </ul>
        </div>

        {/* Links */}
        <div>
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-arena-500">Explora</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm md:grid-cols-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-arena-300">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/reservar" className="font-medium text-arena-500 hover:text-arena-300">
                Reservar
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-crema-50/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-laguna-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © <Year /> {site.name}. Todos los derechos reservados.
          </p>
          <p className="flex gap-4">
            <Link href="/legal/terminos" className="hover:text-crema-50">
              Términos y condiciones
            </Link>
            <Link href="/legal/privacidad" className="hover:text-crema-50">
              Aviso de privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
