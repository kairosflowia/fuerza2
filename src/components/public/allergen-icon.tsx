import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

const baseProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const PATHS: Record<string, string> = {
  gluten: "M6 20c5-5 8-10 11-17M8 15l-4-1m7-3L7 9m7-2-3-2m-4 11 1 4m3-8 1 4m2-8 2 3",
  crustaceans: "M7 15c-2 0-3-2-2-4M17 15c2 0 3-2 2-4M9 9c0-3 1-5 3-5s3 2 3 5c0 4-1 7-3 9-2-2-3-5-3-9Z",
  eggs: "M12 21c4 0 6-3 6-7 0-5-3-10-6-10S6 9 6 14c0 4 2 7 6 7Z",
  fish: "M4 12c3-3 7-5 11-5 2 3 2 7 0 10-4 0-8-2-11-5Zm11-5 4-2v14l-4-2M9 11h.01",
  peanuts: "M9 4C6 4 5 7 6 9c-2 1-3 4-1 6-1 3 1 6 4 6s5-2 5-5c2-1 3-4 1-6 1-3-1-6-4-6-.7 0-1.4.1-2 .3Z",
  soybeans: "M8 3c-3 3-3 9 0 14 3 4 8 4 10 0M9 8c1.5.5 3 .5 4.5 0M9 13c1.5.5 3 .5 4.5 0",
  milk: "M10 3h4v3l2 3v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3Zm-1 8h6",
  nuts: "M12 3c3 1 5 4 5 8 0 5-2 9-5 10-3-1-5-5-5-10 0-4 2-7 5-8Zm-2.5 6h5",
  celery: "M7 21V9c0-3 1-5 2-6M12 21V7c0-2 1-4 2-5M17 21V9c0-3-1-5-2-6",
  mustard: "M12 12a8 8 0 1 1 0-8m0 8a8 8 0 1 0 0 8m-1-8h.01M9 9h.01M9 15h.01M15 9h.01M15 15h.01",
  sesame: "M12 3c2 3 2 5 0 7-2-2-2-4 0-7ZM6 9c3 1 5 2 6 4-3 1-5 0-6-4Zm12 0c-3 1-5 2-6 4 3 1 5 0 6-4ZM7 16c2-2 4-2 5 0-2 2-4 2-5 0Zm10 0c-2-2-4-2-5 0 2 2 4 2 5 0Z",
  sulphites: "M12 3c3 4 6 8 6 12a6 6 0 0 1-12 0c0-4 3-8 6-12Zm-2 12h4",
  lupin: "M12 3v6M12 9c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5Zm0 4v2",
  molluscs: "M12 4c4 0 7 3 7 7 0 4-3 7-7 7-1 0-1.5-.5-1.5-1.5S11 15 12 15c2 0 3.5-1.5 3.5-4S14 7 12 7c-2.5 0-4.5 2-4.5 4.5 0 1 .3 1.8.8 2.5",
};

const GENERIC_PATH = "M12 3v18M3 12h18";

export function AllergenIcon({ code, ...props }: { code: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d={PATHS[code] ?? GENERIC_PATH} />
    </svg>
  );
}

export function AllergenBadge({ code, name }: { code: string; name: string }) {
  return (
    <div className="allergen-badge">
      <span className={cn("allergen-badge__mark", `allergen-badge__mark--${code}`)}>
        <AllergenIcon code={code} />
      </span>
      <span className="allergen-badge__label">{name}</span>
    </div>
  );
}
