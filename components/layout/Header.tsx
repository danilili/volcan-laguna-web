"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { nav, site, whatsappUrl } from "@/lib/site";

/**
 * Fixed header. Transparent over the hero (light text), solid off-white once
 * the page scrolls. "Reservar" is always visible; on phones the nav lives in a
 * full-screen overlay.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the overlay when the route changes (derived state, no effect).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-200",
        solid ? "bg-crema-50/92 text-laguna-900 shadow-[0_1px_0_0_rgb(7_30_39/0.08)] backdrop-blur-md" : "bg-transparent text-crema-50",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name}, inicio`}>
          <span className="relative block h-9 w-9 sm:h-10 sm:w-10">
            <Image
              src="/brand/vl-emblema-blanco.png"
              alt=""
              fill
              sizes="40px"
              className={cn("object-contain transition-opacity duration-200", solid ? "opacity-0" : "opacity-100")}
              preload
            />
            <Image
              src="/brand/vl-emblema-negro.png"
              alt=""
              fill
              sizes="40px"
              className={cn("object-contain transition-opacity duration-200", solid ? "opacity-100" : "opacity-0")}
            />
          </span>
          <span className="font-display text-lg leading-none tracking-tight sm:text-xl">
            Volcán <span className="font-light">Laguna</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-pill px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                  solid ? "hover:bg-laguna-900/6" : "hover:bg-crema-50/12",
                  active && (solid ? "bg-laguna-900/6" : "bg-crema-50/12"),
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/reservar" size="sm" className="sm:h-11 sm:px-5">
            Reservar
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-pill transition-colors duration-200 md:hidden",
              solid ? "hover:bg-laguna-900/6" : "hover:bg-crema-50/12",
            )}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "cerrar" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        id="menu-movil"
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-laguna-900 text-crema-50 transition-[opacity,transform] duration-200 ease-out md:hidden",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav aria-label="Principal (móvil)" className="flex flex-1 flex-col justify-center gap-1 px-6">
          {[...nav, { href: "/organiza-tu-retiro", label: "Organiza tu retiro" }, { href: "/contacto", label: "Contacto" }].map(
            (item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-display rounded-lg px-3 py-3 text-3xl tracking-tight text-crema-50 hover:bg-crema-50/8"
                style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                tabIndex={open ? 0 : -1}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex flex-col gap-3 border-t border-crema-50/10 px-6 py-6">
          <Button href={whatsappUrl("Hola, me interesa hospedarme en Volcán Laguna.")} variant="whatsapp" fullWidth tabIndex={open ? 0 : -1}>
            <Icon name="whatsapp" size={22} /> Escríbenos por WhatsApp
          </Button>
          <a href={`tel:+${site.phone}`} className="text-center text-sm text-laguna-300" tabIndex={open ? 0 : -1}>
            {site.phoneDisplay}
          </a>
        </div>
      </div>
    </header>
  );
}
