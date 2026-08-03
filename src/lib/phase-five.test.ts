import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { directionsUrl, evaluatePickupPointForDate, isoWeekday, mainBakery, type EvaluatePickupPointInput } from "./pickup-points-domain";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260803210000_pickup_points_operations.sql"), "utf8");

function baseInput(overrides: Partial<EvaluatePickupPointInput> = {}): EvaluatePickupPointInput {
  return {
    point: { status: "active", accepts_all_products: true },
    date: "2026-08-10", // a Monday
    windows: [{ weekday: 1, starts_at: "09:00", ends_at: "11:00", is_active: true }],
    capacityDefaults: [{ weekday: 1, max_units: 20 }],
    exceptions: [],
    globalClosures: [],
    ...overrides,
  };
}

describe("isoWeekday", () => {
  it("maps Monday to 1 and Sunday to 7", () => {
    expect(isoWeekday("2026-08-10")).toBe(1); // Monday
    expect(isoWeekday("2026-08-16")).toBe(7); // Sunday
    expect(isoWeekday("2026-08-15")).toBe(6); // Saturday
  });
});

describe("evaluatePickupPointForDate — precedence and validity", () => {
  it("is valid when point is active, product accepted, no closures, window and capacity configured", () => {
    const result = evaluatePickupPointForDate(baseInput());
    expect(result.isValid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.collectionWindow).toEqual({ startsAt: "09:00", endsAt: "11:00" });
    expect(result.capacity).toBe(20);
  });

  it("rejects a point that is not active", () => {
    const result = evaluatePickupPointForDate(baseInput({ point: { status: "draft", accepts_all_products: true } }));
    expect(result).toMatchObject({ isValid: false, reason: "point_not_active" });
  });

  it("rejects a product not accepted when the point does not accept all products", () => {
    const result = evaluatePickupPointForDate(baseInput({
      point: { status: "active", accepts_all_products: false },
      productId: "prod-1",
      acceptedProductIds: new Set(["prod-2"]),
    }));
    expect(result).toMatchObject({ isValid: false, reason: "product_not_accepted" });
  });

  it("accepts a product when the point accepts all products, regardless of the explicit set", () => {
    const result = evaluatePickupPointForDate(baseInput({
      point: { status: "active", accepts_all_products: true },
      productId: "prod-1",
      acceptedProductIds: new Set(),
    }));
    expect(result.isValid).toBe(true);
  });

  it("precedence 1: a global closure wins even with a valid weekly window and capacity", () => {
    const result = evaluatePickupPointForDate(baseInput({
      globalClosures: [{ starts_on: "2026-08-09", ends_on: "2026-08-11" }],
    }));
    expect(result).toMatchObject({ isValid: false, reason: "globally_closed" });
  });

  it("precedence 2: a 'closed' exception wins over a valid weekly window", () => {
    const result = evaluatePickupPointForDate(baseInput({
      exceptions: [{ exception_date: "2026-08-10", type: "closed", collection_starts_at: null, collection_ends_at: null, capacity_override: null }],
    }));
    expect(result).toMatchObject({ isValid: false, reason: "point_exception_closed" });
  });

  it("an 'extraordinary_opening' exception provides a window even with no weekly window configured", () => {
    const result = evaluatePickupPointForDate(baseInput({
      windows: [],
      exceptions: [{ exception_date: "2026-08-10", type: "extraordinary_opening", collection_starts_at: "07:00", collection_ends_at: "08:00", capacity_override: null }],
    }));
    expect(result.isValid).toBe(true);
    expect(result.collectionWindow).toEqual({ startsAt: "07:00", endsAt: "08:00" });
  });

  it("rejects when no collection window exists for that weekday and there is no schedule exception", () => {
    const result = evaluatePickupPointForDate(baseInput({ windows: [] }));
    expect(result).toMatchObject({ isValid: false, reason: "no_collection_window" });
  });

  it("distinguishes 'not configured' capacity (no row) from an explicit zero", () => {
    const notConfigured = evaluatePickupPointForDate(baseInput({ capacityDefaults: [] }));
    expect(notConfigured).toMatchObject({ isValid: false, reason: "capacity_not_configured" });

    const explicitZero = evaluatePickupPointForDate(baseInput({ capacityDefaults: [{ weekday: 1, max_units: 0 }] }));
    expect(explicitZero).toMatchObject({ isValid: false, reason: "capacity_zero" });
  });

  it("precedence 4 vs exception: a capacity_override exception wins over the weekly default", () => {
    const result = evaluatePickupPointForDate(baseInput({
      capacityDefaults: [{ weekday: 1, max_units: 20 }],
      exceptions: [{ exception_date: "2026-08-10", type: "capacity_override", collection_starts_at: null, collection_ends_at: null, capacity_override: 3 }],
    }));
    expect(result.isValid).toBe(true);
    expect(result.capacity).toBe(3);
  });
});

describe("directionsUrl", () => {
  it("prefers coordinates when present", () => {
    const url = directionsUrl({ latitude: 43.55, longitude: -5.92, address_line_1: "Calle Falsa 1", city: "Avilés" });
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=43.55,-5.92");
  });

  it("falls back to the address when there are no coordinates", () => {
    const url = directionsUrl({ latitude: null, longitude: null, address_line_1: "Calle Falsa 1", city: "Avilés" });
    expect(url).toContain("Calle%20Falsa%201");
  });

  it("returns null when neither coordinates nor address are available", () => {
    expect(directionsUrl({ latitude: null, longitude: null, address_line_1: null, city: null })).toBeNull();
  });
});

describe("mainBakery", () => {
  it("finds the point flagged as the main bakery", () => {
    const points = [{ is_main_bakery: false, id: "a" }, { is_main_bakery: true, id: "b" }];
    expect(mainBakery(points)?.id).toBe("b");
  });

  it("returns null when no point is flagged", () => {
    expect(mainBakery([{ is_main_bakery: false, id: "a" }])).toBeNull();
  });
});

describe("pickup points migration", () => {
  it("allows at most one main bakery", () => {
    expect(migration).toContain("pickup_points_single_main_bakery_idx");
    expect(migration).toContain("main_bakery_requires_bakery_type");
  });

  it("blocks overlapping collection windows and invalid ranges", () => {
    expect(migration).toContain("overlapping_collection_window");
    expect(migration).toContain("invalid_window_range");
  });

  it("never allows anon direct access to tables mixing public and internal columns", () => {
    expect(migration).toContain("revoke select on public.pickup_points from anon");
    expect(migration).not.toMatch(/grant select[^;]*to anon[^;]*pickup_point_opening_hours/);
  });

  it("exposes public data only through views that exclude internal columns", () => {
    expect(migration).toContain("create view public.pickup_points_public");
    expect(migration).not.toMatch(/create view public\.pickup_points_public[\s\S]*?contact_email[\s\S]*?from public\.pickup_points/);
  });

  it("treats capacity as not-null, so absence of a row is distinct from zero", () => {
    expect(migration).toContain("max_units integer not null check (max_units >= 0)");
  });

  it("audits writes to pickup points and calendar tables", () => {
    for (const table of ["pickup_points", "pickup_point_exceptions", "global_closures", "product_pickup_points"]) {
      expect(migration).toContain(`'${table}'`);
    }
    expect(migration).toContain("audit_catalog_change");
  });

  it("does not cache admin mutations offline", () => {
    const sw = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(sw).toContain('url.pathname.startsWith("/admin/")');
  });
});
