"use client";

import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Input, Select, Textarea } from "@/components/ui/fields";

const isDevelopment = process.env.NODE_ENV === "development";

export function ContactForm() {
  const [showDevelopmentNotice, setShowDevelopmentNotice] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDevelopment) setShowDevelopmentNotice(true);
  }

  return (
    <div className="contact-form-shell">
      <form aria-describedby="contact-form-status" className="contact-form" onSubmit={handleSubmit}>
        <Input id="contact-name" label="Nombre" name="name" autoComplete="name" required disabled={!isDevelopment} />
        <Input id="contact-email" label="Correo electrónico" name="email" type="email" autoComplete="email" required disabled={!isDevelopment} />
        <Input id="contact-phone" label="Teléfono" optional name="phone" type="tel" autoComplete="tel" disabled={!isDevelopment} />
        <Select id="contact-reason" label="Motivo" name="reason" required disabled={!isDevelopment} defaultValue="">
          <option value="" disabled>Selecciona un motivo</option>
          <option value="general">Consulta general</option>
          <option value="recogida">Reserva y recogida</option>
          <option value="colaboracion">Colaboración</option>
        </Select>
        <Textarea id="contact-message" label="Mensaje" name="message" required rows={6} disabled={!isDevelopment} />
        <Checkbox
          label="He leído la información sobre privacidad y acepto que mis datos se utilicen para responder a esta consulta."
          name="consent"
          id="contact-consent"
          required
          disabled={!isDevelopment}
        />
        <Button type="submit" disabled={!isDevelopment}>Enviar mensaje</Button>
      </form>
      <div id="contact-form-status" aria-live="polite">
        {showDevelopmentNotice ? (
          <Alert variant="information" title="Envío no disponible">
            El formulario es una demostración visual. No se ha enviado ningún dato.
          </Alert>
        ) : (
          <p className="form-note">
            {isDevelopment
              ? "El envío está desactivado en esta fase y ningún dato saldrá del navegador."
              : "El formulario estará disponible cuando podamos atender y proteger correctamente cada consulta."}
          </p>
        )}
      </div>
    </div>
  );
}
