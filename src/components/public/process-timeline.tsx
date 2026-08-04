"use client";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

export type ProcessStep = {
  number: string;
  title: string;
  text: string;
  image: string;
};

export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="process-timeline">
      <ol className="process-timeline__list">
        {steps.map((step, index) => {
          const isActive = index === active;
          return (
            <li key={step.number} className="process-timeline__item" data-active={isActive}>
              <button
                type="button"
                className="process-timeline__trigger"
                aria-expanded={isActive}
                aria-controls={`process-panel-${step.number}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <span className="process-timeline__number">{step.number}</span>
                <span className="process-timeline__title">{step.title}</span>
              </button>
              <span className="process-timeline__bar" aria-hidden="true" />
              <div id={`process-panel-${step.number}`} className="process-timeline__body" role="region">
                <p>{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="process-visual" aria-hidden="true">
        {steps.map((step, index) => (
          <div key={step.number} className={cn("process-visual__frame", index === active && "process-visual__frame--active")}>
            <Image src={step.image} alt="" fill sizes="(max-width: 767px) 100vw, 40vw" style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
