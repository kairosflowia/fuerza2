"use client";

import { useActionState } from "react";

import { submitContactAction, type ContactActionState } from "@/app/(public)/contacto/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Input, Select, Textarea } from "@/components/ui/fields";

const initialState: ContactActionState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);

  if (state.status === "success") {
    return (
      <div className="contact-form-shell">
        <Alert variant="success" title="Mensaje enviado">{state.message}</Alert>
      </div>
    );
  }

  return (
    <div className="contact-form-shell">
      <form action={formAction} aria-describedby="contact-form-status" className="contact-form">
        <Input id="contact-name" label="Nombre" name="name" autoComplete="name" required />
        <Input id="contact-email" label="Correo electrónico" name="email" type="email" autoComplete="email" required />
        <Input id="contact-phone" label="Teléfono" optional name="phone" type="tel" autoComplete="tel" />
        <Select id="contact-reason" label="Motivo" name="reason" required defaultValue="">
          <option value="" disabled>Selecciona un motivo</option>
          <option value="general">Consulta general</option>
          <option value="recogida">Reserva y recogida</option>
          <option value="colaboracion">Colaboración</option>
        </Select>
        <Textarea id="contact-message" label="Mensaje" name="message" required rows={6} maxLength={4000} />
        <Checkbox
          label="He leído la información sobre privacidad y acepto que mis datos se utilicen para responder a esta consulta."
          name="consent"
          id="contact-consent"
          required
        />
        <Button type="submit" loading={pending} loadingLabel="Enviando…">Enviar mensaje</Button>
      </form>
      <div id="contact-form-status" aria-live="polite">
        {state.status === "error" ? (
          <Alert variant="error" title="No se ha podido enviar">{state.message}</Alert>
        ) : (
          <p className="form-note">Respondemos en un plazo de 1 a 2 días hábiles.</p>
        )}
      </div>
    </div>
  );
}
