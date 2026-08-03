import { EmptyState } from "../ui/states";

interface AdminEmptyStateProps {
  section: string;
  description?: string;
}

export function AdminEmptyState({ section, description }: AdminEmptyStateProps) {
  return (
    <EmptyState
      title={`Todavía no hay datos de ${section.toLowerCase()}.`}
      description={description ?? "Esta función se implementará en una fase posterior del proyecto."}
    />
  );
}
