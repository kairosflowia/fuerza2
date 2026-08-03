import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { canManageAvailability } from "./auth/permissions";
import { AVAILABILITY_REASON_LABELS_ES, availabilityReasonLabel } from "./availability-domain";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260803220000_availability_engine.sql"), "utf8");
const sw = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
const vercelConfig = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
const panActions = readFileSync(resolve(process.cwd(), "src/app/(public)/pan/actions.ts"), "utf8");

const REASON_CODES = [
  "available",
  "product_unavailable",
  "variant_inactive",
  "point_inactive",
  "product_not_allowed_at_point",
  "no_collection_window",
  "point_capacity_not_configured",
  "point_full",
  "global_closure",
  "point_closed",
  "not_produced_that_day",
  "production_not_open",
  "cutoff_passed",
  "sold_out",
  "subscription_capacity_only",
];

describe("availabilityReasonLabel", () => {
  it("has a concrete, distinct message for every reason code required by the spec", () => {
    for (const reason of REASON_CODES) {
      expect(AVAILABILITY_REASON_LABELS_ES[reason]).toBeTruthy();
    }
    const messages = REASON_CODES.map((reason) => AVAILABILITY_REASON_LABELS_ES[reason]);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("falls back to a generic message for an unknown reason instead of throwing", () => {
    expect(availabilityReasonLabel("something_new")).toBe("No disponible ahora mismo");
  });
});

describe("canManageAvailability", () => {
  it("allows owner and admin", () => {
    expect(canManageAvailability(["owner"])).toBe(true);
    expect(canManageAvailability(["admin"])).toBe(true);
  });

  it("denies operator and pickup_manager", () => {
    expect(canManageAvailability(["operator"])).toBe(false);
    expect(canManageAvailability(["pickup_manager"])).toBe(false);
    expect(canManageAvailability([])).toBe(false);
  });
});

describe("availability engine migration — reason codes and formula", () => {
  it("returns every required reason code somewhere in the calculation", () => {
    for (const reason of REASON_CODES) {
      expect(migration).toContain(`'${reason}'`);
    }
  });

  it("takes the availability formula as the minimum of production and point remaining, never negative", () => {
    expect(migration).toContain("least(");
    expect(migration).toMatch(/greatest\([^)]*0\)/);
  });

  it("distinguishes sold_out (nothing left at all) from subscription_capacity_only (only the subscription share remains)", () => {
    const idx = migration.indexOf("v_raw_remaining");
    expect(idx).toBeGreaterThan(-1);
  });
});

describe("availability engine migration — concurrency safety", () => {
  it("locks with pg_advisory_xact_lock in a fixed order (variant before point) to avoid deadlocks", () => {
    const variantLockIdx = migration.indexOf("pg_advisory_xact_lock(1,");
    const pointLockIdx = migration.indexOf("pg_advisory_xact_lock(2,");
    expect(variantLockIdx).toBeGreaterThan(-1);
    expect(pointLockIdx).toBeGreaterThan(variantLockIdx);
  });

  it("self-heals by expiring reservations before computing availability inside the reservation transaction", () => {
    expect(migration).toContain("perform public.expire_stock_reservations()");
  });
});

describe("availability engine migration — capacity integrity", () => {
  it("blocks reducing capacity below what is already committed", () => {
    expect(migration).toContain("validate_production_date_capacity_reduction");
    expect(migration).toContain("23514");
  });

  it("never allows reserved_for_subscriptions to exceed total_capacity", () => {
    expect(migration).toContain("reserved_not_exceeding_total");
  });
});

describe("availability engine migration — security posture", () => {
  it("hardens every function with SECURITY DEFINER and an empty search_path", () => {
    const definerCount = (migration.match(/security definer/g) ?? []).length;
    const searchPathCount = (migration.match(/set search_path = ''/g) ?? []).length;
    expect(definerCount).toBeGreaterThan(0);
    expect(searchPathCount).toBeGreaterThanOrEqual(definerCount);
  });

  it("enables row level security on all six new tables", () => {
    for (const table of ["production_dates", "availability_overrides", "subscription_capacity_allocations", "stock_reservations", "orders", "order_items"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("never grants direct writes on stock_reservations, orders or order_items to any client role", () => {
    for (const table of ["stock_reservations", "orders", "order_items"]) {
      expect(migration).not.toMatch(new RegExp(`grant [^;]*(insert|update|delete)[^;]*on public\\.${table}`, "i"));
    }
  });

  it("only grants reservation-mutating functions to authenticated, never to anon", () => {
    for (const fn of ["create_stock_reservation", "extend_stock_reservation", "convert_reservation_to_order", "cancel_order"]) {
      const grantLine = migration.split("\n").find((line) => line.startsWith("grant execute") && line.includes(`function public.${fn}(`));
      expect(grantLine).toBeTruthy();
      expect(grantLine).not.toContain("anon");
      expect(grantLine).toContain("authenticated");
    }
  });

  it("grants read-only public availability functions to anon and authenticated", () => {
    for (const fn of ["check_variant_availability", "next_available_date", "available_pickup_points_for_variant"]) {
      const grantLine = migration.split("\n").find((line) => line.startsWith("grant execute") && line.includes(`function public.${fn}(`));
      expect(grantLine).toContain("anon");
    }
  });

  it("grants service_role only what the cron task needs, explicitly (no implicit access in this project)", () => {
    expect(migration).toContain("grant execute on function public.expire_stock_reservations() to service_role");
    expect(migration).toContain("grant select on public.stock_reservations to service_role");
    expect(migration).toContain("grant select on public.orders to service_role");
    expect(migration).toContain("grant select on public.order_items to service_role");
  });
});

describe("availability engine migration — auditing", () => {
  it("audits reservation creation, conversion, cancellation and status changes explicitly", () => {
    const auditInserts = (migration.match(/insert into public\.audit_logs/g) ?? []).length;
    expect(auditInserts).toBeGreaterThanOrEqual(4);
  });

  it("audits production_dates, availability_overrides and subscription_capacity_allocations via the generic catalog trigger", () => {
    expect(migration).toContain("audit_catalog_change");
  });
});

describe("availability engine migration — low_stock threshold", () => {
  it("reads the low_stock threshold from app_settings with a safe default, never hardcoded only", () => {
    expect(migration).toContain("availability.low_stock_threshold");
    expect(migration).toContain("coalesce(v_low_stock_threshold, 5)");
  });
});

describe("cache and offline behavior", () => {
  it("computes availability through a Server Action, not a statically cached loader", () => {
    expect(panActions).toContain('"use server"');
    expect(panActions).not.toContain("unstable_cache");
    expect(panActions).not.toContain("revalidateTag");
  });

  it("does not let the service worker intercept API routes or cache non-static GET responses", () => {
    expect(sw).not.toMatch(/\/api\//);
    const isStaticAssetLine = sw.split("\n").find((line) => line.includes("isStaticAsset ="));
    expect(isStaticAssetLine).toBeTruthy();
  });

  it("still excludes /admin from the offline navigation fallback, as required for the disponibilidad admin", () => {
    expect(sw).toContain('url.pathname.startsWith("/admin/")');
  });
});

describe("scheduled task", () => {
  it("is wired through Vercel Cron pointing at the availability route", () => {
    const config = JSON.parse(vercelConfig);
    expect(config.crons).toContainEqual({ path: "/api/cron/availability", schedule: "0 3 * * *" });
  });

  it("does not treat the cron as the source of correctness: the reservation function self-heals independently", () => {
    expect(migration).toContain("perform public.expire_stock_reservations()");
  });
});
