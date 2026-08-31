"use client";

import { useRef, useState, useTransition } from "react";

import { discontinueProductAction, toggleProductStatusAction } from "@/app/admin/productos/actions";
import { ConfirmDialog } from "@/components/ui";
import { ActionMenu } from "@/components/ui/menu";
import { EyeIcon, EyeOffIcon, TrashIcon } from "@/components/ui/icons";

/**
 * ActionMenu desmonta su contenido al cerrarse (children solo se renderiza
 * mientras open=true) -- un ConfirmDialog anidado dentro perdería su propio
 * estado "abierto" en el mismo clic que lo dispara, porque el clic también
 * cierra el menú padre. Por eso el diálogo vive aquí, hermano del menú, no
 * dentro de sus children (Fase 10 del Plano Mestre).
 */
export function ProductRowActions({ productId, productSlug, productName, status }: { productId: string; productSlug: string; productName: string; status: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const confirmDiscontinue = () => {
    const form = new FormData();
    form.set("id", productId);
    form.set("slug", productSlug);
    startTransition(() => { discontinueProductAction(form); });
  };

  return (
    <>
      <ActionMenu label={`Más acciones para ${productName}`}>
        {status === "active" || status === "draft" ? (
          <form action={toggleProductStatusAction}>
            <input type="hidden" name="id" value={productId} />
            <input type="hidden" name="slug" value={productSlug} />
            <input type="hidden" name="next" value={status === "active" ? "draft" : "active"} />
            <button type="submit" className="menu__item">
              {status === "active" ? <EyeOffIcon /> : <EyeIcon />}
              {status === "active" ? "Pasar a borrador" : "Publicar"}
            </button>
          </form>
        ) : null}
        <button ref={triggerRef} type="button" className="menu__item" data-destructive onClick={() => setConfirmOpen(true)}>
          <TrashIcon />
          Retirar producto
        </button>
      </ActionMenu>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDiscontinue}
        title={`¿Retirar "${productName}" del catálogo?`}
        confirmLabel="Sí, retirar"
        destructive
        loading={pending}
        returnFocusRef={triggerRef}
      >
        <p>Dejará de estar disponible para reserva. Esta acción no se puede deshacer desde aquí.</p>
      </ConfirmDialog>
    </>
  );
}
