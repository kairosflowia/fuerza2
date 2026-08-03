import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FakePushProvider } from "@/lib/notifications/push-provider";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("PWA push", () => {
  it("uses a fake provider by default", async () => {
    expect((await new FakePushProvider().send({ endpoint: "https://example.test", p256dh: "x", auth: "x" }, "{}")).ok).toBe(true);
  });
  it("classifies invalid subscriptions", async () => {
    expect(await new FakePushProvider("invalid").send({ endpoint: "https://example.test", p256dh: "x", auth: "x" }, "{}")).toMatchObject({ ok: false, invalid: true });
  });
  it("asks permission only from the activation action", () => {
    const component = read("src/components/account/push-notifications.tsx");
    expect(component).toContain("onClick={activate}");
    expect(component.indexOf("requestPermission")).toBeGreaterThan(component.indexOf("async function activate"));
  });
  it("validates internal deep links in the worker", () => {
    const worker = read("public/sw.js");
    expect(worker).toContain('data.url.startsWith("/")');
    expect(worker).toContain('!data.url.startsWith("//")');
    expect(worker).toContain("notificationclick");
  });
  it("keeps push on the shared outbox", () => {
    const push = read("src/lib/notifications/push.ts");
    expect(push).toContain("notification_events");
    expect(push).toContain("notification_deliveries");
    expect(push).not.toContain("client_secret");
  });
});
