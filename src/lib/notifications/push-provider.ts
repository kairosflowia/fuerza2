import webpush from "web-push";

export type PushResult = { ok: boolean; invalid?: boolean; temporary?: boolean; error?: string };
export interface PushProvider {
  send(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<PushResult>;
}

export class FakePushProvider implements PushProvider {
  constructor(private readonly mode = process.env.FAKE_PUSH_MODE ?? "success") {}
  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
  ): Promise<PushResult> {
    void subscription;
    void payload;
    if (this.mode === "invalid") return { ok: false, invalid: true, error: "410" };
    if (this.mode === "failure") return { ok: false, temporary: true, error: "temporary" };
    return { ok: true };
  }
}

export class WebPushProvider implements PushProvider {
  async send(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<PushResult> {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) return { ok: false, error: "vapid_not_configured" };
    webpush.setVapidDetails(subject, publicKey, privateKey);
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 300, urgency: "high", timeout: 10_000 });
      return { ok: true };
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
      return { ok: false, invalid: statusCode === 404 || statusCode === 410, temporary: statusCode === 408 || statusCode === 429 || statusCode >= 500, error: `http_${statusCode || "unknown"}` };
    }
  }
}

export function getPushProvider(): PushProvider {
  return process.env.PUSH_PROVIDER === "webpush" ? new WebPushProvider() : new FakePushProvider();
}
