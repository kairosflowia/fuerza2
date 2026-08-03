import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAnalyticsPeriod, rowsToCsv } from "@/lib/analytics";

const read = (path:string) => readFileSync(resolve(process.cwd(),path),"utf8");
describe("business analytics",()=>{
  it("resolves bounded custom periods and comparisons",()=>{const period=resolveAnalyticsPeriod("custom","2026-07-01","2026-07-07");expect(period).toEqual({start:"2026-07-01",end:"2026-07-07",previousStart:"2026-06-24",previousEnd:"2026-06-30"})});
  it("escapes CSV and includes UTF-8 BOM",()=>{const csv=rowsToCsv(["Producto"],[["Pan, \"grande\""]]);expect(csv.startsWith("\uFEFF")).toBe(true);expect(csv).toContain('"Pan, ""grande"""')});
  it("keeps aggregation server-side and excludes personal fields",()=>{const sql=read("supabase/migrations/20260803280000_business_analytics.sql");expect(sql).toContain("get_business_analytics");expect(sql).toContain("Europe/Madrid");expect(sql).not.toContain("customer_email");expect(sql).not.toContain("customer_phone")});
  it("exports only an allow-list with private no-store responses",()=>{const route=read("src/app/api/admin/analitica/export/route.ts");expect(route).toContain("private, no-store");expect(route).toContain("invalid_export");expect(route).not.toContain("stripe_payment_intent")});
  it("does not install advertising analytics",()=>{const pkg=read("package.json");for(const tracker of ["google-analytics","mixpanel","hotjar","segment"])expect(pkg).not.toContain(tracker)});
});
