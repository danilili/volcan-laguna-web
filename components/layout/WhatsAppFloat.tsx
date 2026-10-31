import { Icon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/site";

const defaultMessage = "Hola, me interesa hospedarme en Volcán Laguna.";

/** Floating WhatsApp button, bottom-right, always visible. */
export function WhatsAppFloat({ message = defaultMessage }: { message?: string }) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-pill bg-whatsapp text-white shadow-float transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-whatsapp-dark sm:right-6 sm:bottom-6"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
