import Link from "next/link";

import { EmptyState } from "@/components/ui/states";

export default function AdminNotFound() {
  return (
    <EmptyState
      title="No encontramos esta página"
      description="Puede que el enlace haya cambiado o que el elemento ya no exista."
      action={<Link className="button button--primary" href="/admin">Volver al panel</Link>}
    />
  );
}
