import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminNavigation, getAdminSection } from "@/lib/navigation";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";

interface AdminSectionPageProps {
  params: Promise<{ section: string }>;
}

export function generateStaticParams() {
  return adminNavigation.map(({ slug }) => ({ section: slug }));
}

export async function generateMetadata({ params }: AdminSectionPageProps): Promise<Metadata> {
  const section = getAdminSection((await params).section);
  return { title: section?.label ?? "Administración" };
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const section = getAdminSection((await params).section);
  if (!section) notFound();
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, section.slug)) redirect("/cuenta/acceso-denegado");

  return (
    <>
      <AdminPageHeader title={section.label} description={section.description} />
      {section.slug === "usuarios" ? (
        <AdminEmptyState section="Usuarios. Solo el propietario podrá asignar funciones elevadas cuando se implemente esta gestión" />
      ) : <AdminEmptyState section={section.label} />}
    </>
  );
}
