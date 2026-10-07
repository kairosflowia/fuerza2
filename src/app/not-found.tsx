import { NotFoundContent } from "@/components/public/not-found-content";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

/** 404 para direcciones fuera de los grupos públicos: no hay layout de grupo, así que lleva cabecera y pie propios. */
export default function NotFound() {
  return (
    <div className="fz">
      <PublicHeader />
      <NotFoundContent />
      <PublicFooter />
    </div>
  );
}
