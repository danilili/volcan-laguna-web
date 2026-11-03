"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { reservar, type EstadoReserva } from "@/app/reservar/confirmar/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { CasaSlug } from "@/lib/beds24/client";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import { anticipo } from "@/lib/reserva";
import { whatsappUrl } from "@/lib/site";

/**
 * Guest details for the booking. Submits to the `reservar` server action,
 * which re-quotes Beds24 and sends the request to n8n; on success the action
 * redirects, so this component only ever renders the form and its errors.
 */

type Props = {
  casa: CasaSlug;
  arrival: string;
  departure: string;
  personas: number;
  /** Total the visitor saw; the action re-checks it against Beds24. */
  total: number;
  /** Prefilled WhatsApp text for the fallback link. */
  mensajeWhatsApp: string;
};

const inicial: EstadoReserva = { errores: {} };

export function FormularioReserva({ casa, arrival, departure, personas, total, mensajeWhatsApp }: Props) {
  const [estado, action, pending] = useActionState(reservar, inicial);
  const v = estado.valores ?? {};
  const e = estado.errores;
  const id = useId();

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="casa" value={casa} />
      <input type="hidden" name="arrival" value={arrival} />
      <input type="hidden" name="departure" value={departure} />
      <input type="hidden" name="personas" value={personas} />
      <input type="hidden" name="total" value={Math.round(total)} />

      <Campo id={`${id}-nombre`} label="Nombre completo" error={e.nombre}>
        <input id={`${id}-nombre`} name="nombre" type="text" required minLength={3} maxLength={120} autoComplete="name" defaultValue={v.nombre} className={input(e.nombre)} />
      </Campo>
      <Campo id={`${id}-telefono`} label="Teléfono con WhatsApp" hint="Por ahí te contactamos para confirmar." error={e.telefono}>
        <input id={`${id}-telefono`} name="telefono" type="tel" required inputMode="tel" autoComplete="tel" placeholder="33 1234 5678" defaultValue={v.telefono} className={input(e.telefono)} />
      </Campo>
      <Campo id={`${id}-correo`} label="Correo" hint="Opcional." error={e.correo}>
        <input id={`${id}-correo`} name="correo" type="email" maxLength={160} autoComplete="email" defaultValue={v.correo} className={input(e.correo)} />
      </Campo>
      <Campo id={`${id}-mensaje`} label="¿Algo que debamos saber?" hint="Hora aproximada de llegada, niños, una celebración…" error={e.mensaje}>
        <textarea id={`${id}-mensaje`} name="mensaje" rows={3} maxLength={500} defaultValue={v.mensaje} className={cn(input(e.mensaje), "resize-y")} />
      </Campo>

      {e.general ? (
        <div role="alert" className="rounded-card border border-arena-300 bg-arena-100 p-4 text-sm text-arena-700">
          <p>{e.general}</p>
          <a href={whatsappUrl(mensajeWhatsApp)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-medium text-laguna-800 underline-offset-2 hover:underline">
            <Icon name="whatsapp" size={16} /> Abrir WhatsApp
          </a>
        </div>
      ) : null}

      <div className="rounded-card bg-crema-100 p-4 text-sm text-ink-700">
        <p>
          <span className="font-medium text-ink-900">No se cobra nada en línea.</span> Al recibir tu solicitud apartamos las fechas y te escribimos por WhatsApp para el anticipo del 50 % ({formatMXN(anticipo(total))}). Con el anticipo tu reserva queda confirmada.
        </p>
      </div>

      <Button type="submit" disabled={pending} fullWidth size="lg" aria-busy={pending}>
        {pending ? "Enviando tu solicitud…" : "Enviar solicitud de reserva"}
        {pending ? null : <Icon name="flecha" size={20} />}
      </Button>

      <p className="text-xs text-ink-500">
        Al enviar aceptas las{" "}
        <Link href="/legal/terminos" className="underline underline-offset-2">
          políticas de la casa
        </Link>{" "}
        y el{" "}
        <Link href="/legal/privacidad" className="underline underline-offset-2">
          aviso de privacidad
        </Link>
        .
      </p>
    </form>
  );
}

function input(error?: string): string {
  return cn(
    "block w-full rounded-lg border bg-crema-50 px-3.5 py-3 text-base text-ink-900 outline-none placeholder:text-ink-300 focus:border-laguna-800 focus:ring-2 focus:ring-arena-500/40",
    error ? "border-arena-600" : "border-crema-300",
  );
}

function Campo({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-arena-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
