import { PickupPointForm } from "@/components/admin/pickup-point-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewPickupPointPage() {
  return (
    <>
      <AdminPageHeader title="Nuevo punto de recogida" description="Guarda primero los datos básicos. El horario, las ventanas y la capacidad se configuran después de crear el punto." />
      <PickupPointForm />
    </>
  );
}
