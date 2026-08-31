import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui";
export default function Configuration() {
  return (
    <>
      <AdminPageHeader title="Configuración" description="Controles de lanzamiento y operación." />
      <div className="admin-dashboard-grid">
        <Card>
          <p className="eyebrow">Venta</p>
          <h2>Antelación de reserva</h2>
          <Link href="/admin/configuracion/reservas">Configurar mínimo de días</Link>
        </Card>
        <Card>
          <p className="eyebrow">Legal</p>
          <h2>Datos legales</h2>
          <Link href="/admin/configuracion/legal">Completar datos del titular</Link>
        </Card>
        <Card>
          <p className="eyebrow">Sistema</p>
          <h2>Salud del sistema</h2>
          <Link href="/admin/configuracion/sistema">Revisar servicios y alertas</Link>
        </Card>
      </div>
    </>
  );
}
