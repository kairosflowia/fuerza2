/**
 * Estado de carga entre páginas públicas. Vive dentro del layout de cada
 * grupo (la cabecera se mantiene) y solo aparece si la navegación tarda más
 * de ~300 ms, para no parpadear en cambios rápidos.
 */
export function PageLoading() {
  return (
    <main id="main-content" className="fz-page-loading" aria-busy="true">
      <div className="fz-page-loading__inner" role="status">
        <span className="fz-spinner" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    </main>
  );
}
