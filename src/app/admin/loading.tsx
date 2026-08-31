import { Loading } from "@/components/ui/loading";

export default function AdminLoading() {
  return (
    <div className="state" aria-live="polite">
      <Loading label="Cargando…" />
    </div>
  );
}
