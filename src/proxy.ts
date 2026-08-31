import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // /pan era el catálogo editorial, unificado con /reserva-y-recoge en la
  // Fase 2 del Plano Mestre UX/UI. Redirige aquí (antes de cualquier render)
  // para que enlaces y buscadores reciban un 308 real: un redirect() dentro
  // de la página no puede emitir un estado HTTP propio una vez que el layout
  // compartido ya empezó a transmitir la respuesta.
  if (request.nextUrl.pathname === "/pan") {
    const familia = request.nextUrl.searchParams.get("familia");
    const destination = new URL(familia ? `/reserva-y-recoge/${familia}` : "/reserva-y-recoge", request.url);
    return NextResponse.redirect(destination, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cuenta/:path*",
    "/auth/:path*",
    "/pan",
    "/modo-produccion",
  ],
};
