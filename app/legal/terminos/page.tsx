import type { Metadata } from "next";
import { MdxPage } from "@/components/content/MdxPage";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return <MdxPage slug="legal/terminos" fallbackTitle="Términos y condiciones" eyebrow="Legal" />;
}
