import type { Metadata } from "next";
import { MdxPage } from "@/components/content/MdxPage";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default function PrivacidadPage() {
  return <MdxPage slug="legal/privacidad" fallbackTitle="Aviso de privacidad" eyebrow="Legal" />;
}
