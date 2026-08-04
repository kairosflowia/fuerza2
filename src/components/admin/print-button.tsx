"use client";
export function PrintButton({ className = "button button--secondary" }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.print()}>Imprimir</button>;
}
