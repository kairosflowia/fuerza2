import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminNavigation, getAdminSection } from "@/lib/navigation";

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

  return (
    <>
      <AdminPageHeader title={section.label} description={section.description} />
      <AdminEmptyState section={section.label} />
    </>
  );
}
