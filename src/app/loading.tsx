import { PageLoading } from "@/components/public/page-loading";

/** Respaldo para rutas sin carga propia: mismo fondo y estilo que el resto de la web pública. */
export default function GlobalLoading() {
  return (
    <div className="fz">
      <PageLoading />
    </div>
  );
}
