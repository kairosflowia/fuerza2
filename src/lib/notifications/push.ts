import { getPushProvider } from "@/lib/notifications/push-provider";
import { createAdminClient } from "@/lib/supabase/admin";

const supportedEvents = new Set(["order-confirmed", "payment-failed", "order-ready", "order-cancelled", "pickup-reminder", "pickup-window-changed", "subscription-started", "subscription-payment-failed", "subscription-action-required", "subscription-cycle-confirmed"]);

function payloadFor(event: any) {
  const link = event.entity_type === "subscriptions" ? `/cuenta/plan-de-pan/${event.entity_id}` : "/cuenta";
  const messages: Record<string, [string, string]> = {
    "order-confirmed": ["Pedido confirmado", `Tu pedido ${event.payload?.order_code ?? ""} está confirmado.`],
    "payment-failed": ["Pago no completado", "Revisa el pago desde tu cuenta."],
    "order-ready": ["Tu pan está listo", `Recógelo con el código ${event.payload?.order_code ?? ""}.`],
    "order-cancelled": ["Pedido cancelado", "Consulta los detalles en tu cuenta."],
    "pickup-reminder": ["Recuerda tu recogida", `Tu pedido ${event.payload?.order_code ?? ""} te espera.`],
    "pickup-window-changed": ["Horario actualizado", "Consulta la nueva ventana de recogida."],
    "subscription-started": ["Plan de Pan activo", "Tu suscripción ya está en marcha."],
    "subscription-payment-failed": ["Cobro pendiente", "Revisa el método de pago."],
    "subscription-action-required": ["Acción necesaria", "Revisa tu Plan de Pan."],
    "subscription-cycle-confirmed": ["Recogida confirmada", "Tu próximo ciclo está confirmado."],
  };
  const [title, body] = messages[event.event_key] ?? ["FUERZA", "Tienes una actualización."];
  return JSON.stringify({ title, body, icon: "/icon", badge: "/icon", tag: `${event.event_key}:${event.entity_id}`, url: link });
}

export async function processPushNotifications(limit = 50) {
  const db = createAdminClient() as any;
  const { data: events } = await db.from("notification_events").select("id,event_key,entity_type,entity_id,recipient_id,payload,status").in("status", ["pending", "processing", "sent", "partially_sent", "failed"]).not("recipient_id", "is", null).lte("scheduled_for", new Date().toISOString()).order("created_at").limit(limit);
  const provider = getPushProvider();
  let sent = 0;
  let failed = 0;
  for (const event of events ?? []) {
    if (!supportedEvents.has(event.event_key)) continue;
    const category = event.event_key.startsWith("subscription-") ? "subscription" : event.event_key.startsWith("pickup-") ? "reminder" : "operational";
    const { data: preference } = await db.from("notification_preferences").select("enabled").eq("customer_id", event.recipient_id).eq("channel", "push").eq("category", category).maybeSingle();
    if (preference?.enabled === false) continue;
    const { data: devices } = await db.from("push_subscriptions").select("id,endpoint,p256dh,auth,status").eq("customer_id", event.recipient_id).eq("status", "active");
    for (const device of devices ?? []) {
      const { data: last } = await db.from("notification_deliveries").select("attempt_number,status").eq("notification_event_id", event.id).eq("channel", "push").eq("push_subscription_id", device.id).order("attempt_number", { ascending: false }).limit(1).maybeSingle();
      if (["sent", "delivered"].includes(last?.status) || Number(last?.attempt_number) >= 3) continue;
      const result = await provider.send(device, payloadFor(event));
      await db.from("notification_deliveries").insert({ notification_event_id: event.id, provider: process.env.PUSH_PROVIDER ?? "fake", recipient_email: "[push]", channel: "push", push_subscription_id: device.id, status: result.ok ? "sent" : "failed", attempt_number: Number(last?.attempt_number ?? 0) + 1, error_code: result.error, sent_at: result.ok ? new Date().toISOString() : null });
      if (result.invalid) await db.from("push_subscriptions").update({ status: "invalid" }).eq("id", device.id);
      if (result.ok) sent += 1;
      else failed += 1;
    }
  }
  return { sent, failed };
}
