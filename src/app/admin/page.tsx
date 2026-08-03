import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

const dashboardAreas = [
  {
    title: "Producción de hoy",
    description: "Todavía no hay datos de producción.",
  },
  {
    title: "Producción de mañana",
    description: "Todavía no hay datos de producción.",
  },
  {
    title: "Pedidos pendientes",
    description: "Los pedidos aparecerán aquí cuando activemos las reservas.",
  },
  {
    title: "Incidencias",
    description: "Las incidencias operativas aparecerán aquí cuando exista actividad real.",
  },
] as const;

export default function AdminHomePage() {
  return (
    <>
      <AdminPageHeader
        title="Panel del obrador"
        description="La estructura operativa de FUERZA, preparada para crecer por fases."
      />
      <div className="admin-dashboard-grid">
        {dashboardAreas.map((area) => (
          <Card key={area.title}>
            <EmptyState title={area.title} description={area.description} />
          </Card>
        ))}
      </div>
      <section className="admin-quick-links" aria-labelledby="quick-links-title">
        <h2 id="quick-links-title">Accesos rápidos</h2>
        <div>
          <Link className="button button--secondary" href="/admin/produccion">Producción</Link>
          <Link className="button button--secondary" href="/admin/pedidos">Pedidos</Link>
          <Link className="button button--secondary" href="/admin/productos">Productos</Link>
          <Link className="button button--secondary" href="/admin/disponibilidad">Disponibilidad</Link>
        </div>
      </section>
    </>
  );
}
