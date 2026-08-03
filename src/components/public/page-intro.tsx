import { Breadcrumbs } from "./breadcrumbs";

interface PageIntroProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function PageIntro({ title, description, eyebrow }: PageIntroProps) {
  return (
    <header className="institutional-hero">
      <Breadcrumbs items={[{ label: title }]} />
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p className="institutional-hero__lead">{description}</p>
    </header>
  );
}
