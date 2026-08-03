import { Loading } from "@/components/ui/loading";

export default function GlobalLoading() {
  return (
    <main id="main-content" className="status-page" aria-live="polite">
      <Loading label="Cargando contenido" />
    </main>
  );
}
