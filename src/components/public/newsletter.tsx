import { Button, Checkbox, Input } from "@/components/ui";

export function Newsletter() {
  return (
    <div className="newsletter" aria-labelledby="newsletter-title">
      <div>
        <p className="eyebrow">Desde el obrador</p>
        <h2 id="newsletter-title">Te contamos lo que sale del horno</h2>
        <p>Lo que horneamos, lo que cambia y poco más. Activaremos esta lista cuando esté lista para recibir correos.</p>
      </div>
      <div className="newsletter__form" aria-describedby="newsletter-status">
        <Input id="newsletter-email" label="Tu correo" type="email" disabled />
        <Checkbox id="newsletter-consent" label="Quiero recibir novedades de FUERZA por correo." description="Podrás darte de baja cuando quieras." disabled />
        <Button disabled>Suscribirme</Button>
        <p id="newsletter-status" className="form-status">La suscripción por correo estará disponible más adelante.</p>
      </div>
    </div>
  );
}
