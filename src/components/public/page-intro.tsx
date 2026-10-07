import { Breadcrumbs } from "./breadcrumbs";

interface PageIntroProps {
  title: string;
  description: string;
  eyebrow?: string;
  /** "editorial": cabecera de la nueva web pública (sin migas, título grande). */
  variant?: "default" | "editorial";
  /** Solo en la variante editorial: muestra "Inicio / título". */
  breadcrumbs?: boolean;
}

export function PageIntro({ title, description, eyebrow, variant = "default", breadcrumbs = false }: PageIntroProps) {
  if (variant === "editorial") {
    return (
      <header className="fz-intro">
        {breadcrumbs ? <Breadcrumbs items={[{ label: title }]} /> : null}
        {eyebrow ? <p className="fz-eyebrow">{eyebrow}</p> : null}
        <h1 className="fz-display">{title}</h1>
        <p className="fz-intro__lead">{description}</p>
      </header>
    );
  }

  return (
    <header className="institutional-hero">
      <Breadcrumbs items={[{ label: title }]} />
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p className="institutional-hero__lead">{description}</p>
    </header>
  );
}
