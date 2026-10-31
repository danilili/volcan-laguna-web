import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Casas y retiros en la Laguna de Santa María del Oro`,
    template: `%s · ${site.name}`,
  },
  description:
    "Tres casas a la orilla de la Laguna de Santa María del Oro, Nayarit. Hospedaje para familias y grupos, retiros y alimentos con vista al lago.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a2a36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
