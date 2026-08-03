import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { adminPermissions, canAccessAdmin, canAccessAdminSection, canManageRole, visibleAdminSections } from "@/lib/auth/permissions";
import { safeReturnPath } from "@/lib/auth/redirects";
import { getSupabasePublicEnvironment, getSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { adminNavigation } from "@/lib/navigation";

describe("authentication security boundaries", () => {
  it("accepts only local return paths", () => {
    expect(safeReturnPath("/admin/produccion?dia=hoy")).toBe("/admin/produccion?dia=hoy");
    expect(safeReturnPath("https://example.com/robo")).toBe("/cuenta");
    expect(safeReturnPath("//example.com/robo")).toBe("/cuenta");
    expect(safeReturnPath(null)).toBe("/cuenta");
  });

  it("validates public environment without exposing the service key", () => {
    const environment = {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
    } satisfies NodeJS.ProcessEnv;
    expect(getSupabasePublicEnvironment(environment)).toEqual({ url: "https://project.supabase.co", anonKey: "public-anon-key" });
    expect(getSupabaseServiceRoleKey(environment)).toBe("server-only-key");
    expect(isSupabaseConfigured(environment)).toBe(true);
    expect(isSupabaseConfigured({ NODE_ENV: "test" })).toBe(false);
    const browserClient = readFileSync(resolve(process.cwd(), "src/lib/supabase/client.ts"), "utf8");
    expect(browserClient).not.toContain("SERVICE_ROLE");
  });

  it("uses verified auth methods instead of trusting getSession on the server", () => {
    const session = readFileSync(resolve(process.cwd(), "src/lib/auth/session.ts"), "utf8");
    const proxy = readFileSync(resolve(process.cwd(), "src/lib/supabase/proxy.ts"), "utf8");
    expect(session).toContain("auth.getUser()");
    expect(proxy).toContain("auth.getClaims()");
    expect(`${session}\n${proxy}`).not.toContain("auth.getSession()");
  });
});

describe("centralized administrative permissions", () => {
  it("enforces the role matrix", () => {
    expect(canAccessAdmin(["customer"])).toBe(false);
    expect(canAccessAdmin(["pickup_manager"])).toBe(false);
    expect(canAccessAdmin(["operator"])).toBe(true);
    expect(canAccessAdminSection(["operator"], "produccion")).toBe(true);
    expect(canAccessAdminSection(["operator"], "pagos")).toBe(false);
    expect(canAccessAdminSection(["admin"], "auditoria")).toBe(true);
    expect(canAccessAdminSection(["admin"], "usuarios")).toBe(false);
    expect(canAccessAdminSection(["owner"], "usuarios")).toBe(true);
  });

  it("shows only permitted navigation and reserves role management for owner", () => {
    const operatorSections = visibleAdminSections(["operator"], adminNavigation).map(({ slug }) => slug);
    expect(operatorSections).toEqual(["produccion", "pedidos", "disponibilidad", "puntos-de-recogida"]);
    expect(canManageRole(["admin"], "operator")).toBe(false);
    expect(canManageRole(["owner"], "admin")).toBe(true);
    expect(adminPermissions.owner).toEqual(["*"]);
  });
});

describe("database and PWA contracts", () => {
  const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260803170000_auth_foundation.sql"), "utf8");

  it("enables RLS and keeps consent and audit history immutable", () => {
    for (const table of ["profiles", "user_roles", "customer_consents", "audit_logs", "app_settings"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    const policies = migration.match(/create policy [\s\S]*?;/gi) ?? [];
    expect(policies.filter((policy) => policy.includes("customer_consents")).join("\n")).not.toMatch(/for (update|delete)/i);
    expect(policies.filter((policy) => policy.includes("audit_logs")).join("\n")).not.toMatch(/for (update|delete)/i);
  });

  it("prevents direct role writes and admin creation by non-owner", () => {
    expect(migration).toContain("if not app_private.has_role('owner')");
    expect(migration).toContain("event_action = 'admin.login' and not app_private.has_any_admin_role()");
    expect(migration).toContain("revoke all on public.profiles, public.user_roles");
    expect(migration).not.toContain("grant insert on public.user_roles to authenticated");
  });

  it("never caches private navigations", () => {
    const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain('url.pathname.startsWith("/admin/")');
    expect(worker).toContain('url.pathname.startsWith("/cuenta/")');
    const privateBranch = worker.slice(worker.indexOf('url.pathname === "/admin"'), worker.indexOf("event.respondWith(fetch(request).catch"));
    expect(privateBranch).toContain("event.respondWith(fetch(request))");
    expect(privateBranch).not.toContain("caches.match");
  });
});
