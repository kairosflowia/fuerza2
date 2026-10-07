/* eslint-disable @next/next/no-img-element -- ilustraciones vectoriales de marca. */
import type { ReactNode } from "react";

function CalendarArt() {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <rect x="10" y="18" width="62" height="58" rx="7" stroke="#11100E" strokeWidth="4" />
      <path d="M10 34h62" stroke="#11100E" strokeWidth="4" />
      <rect x="10" y="18" width="62" height="16" rx="7" fill="#11100E" />
      <path d="M26 12v12M56 12v12" stroke="#11100E" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 46h8M38 46h8M24 58h8M38 58h4" stroke="#11100E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="68" cy="68" r="19" fill="#E4572E" stroke="#FBF6ED" strokeWidth="4" />
      <path d="M68 58v11h8" stroke="#FBF6ED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StepItem({ number, art, title, children }: { number: number; art: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <li className="fz-step">
      <span className="fz-step__number" aria-hidden="true">{number}</span>
      <span className="fz-step__art" aria-hidden="true">{art}</span>
      <div>
        <h3>
          <span className="sr-only">Paso {number}: </span>
          {title}
        </h3>
        <p>{children}</p>
      </div>
    </li>
  );
}

export function HomeSteps() {
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="sr-only">Cómo funciona</h2>
      <ol className="fz-steps" role="list">
        <StepItem number={1} art={<img src="/illustrations/woman-bread-bust.svg" alt="" width={82} height={96} />} title="Haz tu pedido">
          Elige tus panes y productos favoritos.
        </StepItem>
        <StepItem number={2} art={<CalendarArt />} title={<>Selecciona fecha<br />y punto de recogida</>}>
          Tú decides cuándo y dónde.
        </StepItem>
        <StepItem number={3} art={<img src="/illustrations/man-hat-bread.png" alt="" width={80} height={96} />} title="Recoge tu pedido">
          Te avisaremos cuando esté listo.
        </StepItem>
      </ol>
    </section>
  );
}
