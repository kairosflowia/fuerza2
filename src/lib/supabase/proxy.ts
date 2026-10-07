import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment, isSupabaseConfigured } from "./env";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnvironment();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  // Zona privada de la cuenta: resumen, pedidos, perfil y Plan de Pan. /cuenta/acceder,
  // /cuenta/crear, /cuenta/recuperar, etc. siguen siendo públicas.
  const accountArea = pathname === "/cuenta" || ["/cuenta/pedidos", "/cuenta/perfil", "/cuenta/plan-de-pan"].some((base) => pathname === base || pathname.startsWith(`${base}/`));
  const requiresSession = accountArea || pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/modo-produccion";
  if (requiresSession && !data?.claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/cuenta/acceder";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
