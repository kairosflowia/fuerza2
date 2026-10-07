"use client";

import { useActionState } from "react";

import { submitContactAction, type ContactActionState } from "@/app/(public)/contacto/actions";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from "@/components/ui/icons";

const initialState: ContactActionState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);

  return (
    <section className="fz-contact-form" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="fz-display">Envíanos tu consulta</h2>

      {state.status === "success" ? (
        <div className="fz-contact-form__success" role="status">
          <span aria-hidden="true"><CheckIcon /></span>
          <p><strong>Mensaje enviado</strong>{state.message}</p>
        </div>
      ) : (
        <form action={formAction} aria-describedby="contact-form-status">
          <div className="fz-field">
            <label htmlFor="contact-name">Nombre</label>
            <input id="contact-name" name="name" autoComplete="name" placeholder="Tu nombre" required />
          </div>
          <div className="fz-field">
            <label htmlFor="contact-email">Correo electrónico</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
          </div>
          <div className="fz-field">
            <label htmlFor="contact-phone">Teléfono <span>(opcional)</span></label>
            <input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="+34 600 123 456" />
          </div>
          <div className="fz-field fz-field--select">
            <label htmlFor="contact-reason">Motivo</label>
            <select id="contact-reason" name="reason" required defaultValue="">
              <option value="" disabled>Selecciona un motivo</option>
              <option value="general">Consulta general</option>
              <option value="recogida">Reserva y recogida</option>
              <option value="colaboracion">Colaboración</option>
            </select>
            <ChevronDownIcon aria-hidden="true" />
          </div>
          <div className="fz-field">
            <label htmlFor="contact-message">Mensaje</label>
            <textarea id="contact-message" name="message" rows={4} maxLength={4000} placeholder="Cuéntanos en qué podemos ayudarte…" required />
          </div>
          <label className="fz-consent" htmlFor="contact-consent">
            <input id="contact-consent" name="consent" type="checkbox" required />
            <span>He leído la información sobre privacidad y acepto que mis datos se utilicen para responder a esta consulta.</span>
          </label>
          <button type="submit" className="fz-btn fz-btn--block" disabled={pending} aria-busy={pending || undefined}>
            {pending ? "Enviando…" : "Enviar mensaje"}
            {pending ? null : <ArrowRightIcon />}
          </button>
          <div id="contact-form-status" aria-live="polite">
            {state.status === "error" ? (
              <p className="fz-contact-form__error" role="alert">{state.message}</p>
            ) : (
              <p className="fz-contact-form__note">Respondemos en un plazo de 1 a 2 días hábiles.</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
