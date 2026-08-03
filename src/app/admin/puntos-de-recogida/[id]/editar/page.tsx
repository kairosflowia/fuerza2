import { notFound } from "next/navigation";

import { PickupPointForm } from "@/components/admin/pickup-point-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { createClient } from "@/lib/supabase/server";

export default async function EditPickupPointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: point } = await db.from("pickup_points").select("*").eq("id", id).maybeSingle();
  if (!point) notFound();

  return (
    <>
      <AdminPageHeader title={`Editar ${point.name}`} description="Identificación, localización, contacto interno y publicación." />
      <PickupPointForm defaults={point} />
    </>
  );
}
