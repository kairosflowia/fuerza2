import type { ReactNode } from "react";

import { PageHeader } from "../ui/layout";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return <PageHeader title={title} description={description} actions={actions} compact />;
}
