import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export function StatusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  );
}

export function WheatIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 20c5-5 8-10 11-17M8 15l-4-1m7-3L7 9m7-2-3-2m-4 11 1 4m3-8 1 4m2-8 2 3" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 8h14l-1.1 12.1a2 2 0 0 1-2 1.9H8.1a2 2 0 0 1-2-1.9L5 8Z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17 7h.01" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M15 8.5h-2a2 2 0 0 0-2 2V12H9v3h2v6h3v-6h2.2l.8-3H14v-1.2c0-.44.36-.8.8-.8H16V8.5Z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 4v10.5a2.5 2.5 0 1 1-2.5-2.5c.18 0 .34.02.5.05" />
      <path d="M14 4c.3 2 1.8 3.6 4 4" />
    </svg>
  );
}
