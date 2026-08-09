import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Fuerza Habitual contracts", () => {
  it("prices Stripe items from the server-fetched basket, never from the request body", () => {
    const createRoute = read("src/app/api/subscriptions/create/route.ts");
    expect(createRoute).toContain("item.unit_price_cents_snapshot");
    expect(createRoute).not.toMatch(/body\.(price|amount|unit_amount)/);
  });

  it("uses Stripe Payment Element and webhook authority", () => {
    expect(read("src/components/subscriptions/basket-configurator.tsx")).toContain("<PaymentElement");
    const confirmation = read("src/app/(public)/plan-de-pan/confirmacion/page.tsx");
    expect(confirmation).toContain("customer_id");
    expect(confirmation).not.toContain("update(");
  });

  it("handles recurring events in the existing signed webhook", () => {
    const webhook = read("src/app/api/stripe/webhook/route.ts");
    for (const event of ["invoice.paid", "invoice.payment_failed", "customer.subscription.", "customer.subscription.deleted"]) {
      expect(webhook).toContain(event);
    }
    expect(webhook).toContain("constructEvent");
  });

  it("keeps private subscription routes and POST requests out of the service-worker cache", () => {
    const worker = read("public/sw.js");
    expect(worker).toContain("/plan-de-pan/membresias");
    expect(worker).toContain('url.pathname.startsWith("/cuenta/")');
    expect(worker).toContain('request.method !== "GET"');
  });

  it("uses one database ledger and idempotent invoice conversion", () => {
    const migration = read("supabase/migrations/20260808210000_fuerza_habitual_redesign.sql");
    expect(migration).toContain("stripe_event_id = p_event_id");
    expect(migration).toContain("pg_advisory_xact_lock");
  });
});
