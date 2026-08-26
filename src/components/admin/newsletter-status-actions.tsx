import { resendNewsletterConfirmationAction, setNewsletterStatusAction } from "@/app/admin/clientes/suscritos/actions";
import { Button } from "@/components/ui";

export function NewsletterStatusActions({ subscriberId, status, canReactivate }: { subscriberId: string; status: string; canReactivate: boolean }) {
  return (
    <>
      {status === "pendiente" ? (
        <form action={resendNewsletterConfirmationAction}>
          <input type="hidden" name="subscriber_id" value={subscriberId} />
          <Button type="submit" variant="secondary">Reenviar confirmación</Button>
        </form>
      ) : null}
      {status !== "baja" ? (
        <form action={setNewsletterStatusAction}>
          <input type="hidden" name="subscriber_id" value={subscriberId} />
          <input type="hidden" name="status" value="baja" />
          <Button type="submit" variant="secondary">Marcar baja</Button>
        </form>
      ) : null}
      {status !== "bloqueado" ? (
        <form action={setNewsletterStatusAction}>
          <input type="hidden" name="subscriber_id" value={subscriberId} />
          <input type="hidden" name="status" value="bloqueado" />
          <Button type="submit" variant="destructive">Bloquear</Button>
        </form>
      ) : null}
      {canReactivate ? (
        <form action={setNewsletterStatusAction}>
          <input type="hidden" name="subscriber_id" value={subscriberId} />
          <input type="hidden" name="status" value="activo" />
          <Button type="submit" variant="secondary">Reactivar</Button>
        </form>
      ) : null}
    </>
  );
}
