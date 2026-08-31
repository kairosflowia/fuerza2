"use client";

import { useRef, useState, useTransition } from "react";

import { updateOrderStatus } from "@/app/admin/pedidos/actions";
import { Button, ConfirmDialog, Textarea, useToast } from "@/components/ui";

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { push } = useToast();

  const confirm = () => {
    const form = new FormData();
    form.set("id", orderId);
    form.set("status", "cancelled");
    form.set("reason", reason);
    startTransition(async () => {
      try {
        await updateOrderStatus(form);
        setOpen(false);
        push({ title: "Pedido cancelado.", variant: "success" });
      } catch (error) {
        push({ title: "No se ha podido cancelar", description: error instanceof Error ? error.message : undefined, variant: "error" });
      }
    });
  };

  return (
    <>
      <Button ref={triggerRef} type="button" variant="destructive" onClick={() => setOpen(true)}>Cancelar pedido</Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title="¿Cancelar este pedido?"
        confirmLabel="Sí, cancelar pedido"
        destructive
        loading={pending}
        returnFocusRef={triggerRef}
      >
        <p>Se liberará el estoque reservado para este pedido y no se podrá deshacer.</p>
        <Textarea id="cancel-reason" label="Motivo" optional value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </>
  );
}
