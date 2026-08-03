import { PageHeader } from "../ui/layout";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <PageHeader title={title} description={description} compact />;
}
