import { redirect } from "next/navigation";

// La cesta y el pago se unificaron en /carrito (menos fricción: un solo
// paso en vez de cesta -> checkout). Se mantiene esta ruta como redirect
// por si queda algún enlace o marcador antiguo. force-dynamic para que el
// redirect se emita en cada petición (una redirect estática prerenderizada
// no se sirve como 307 real en este Next.js).
export const dynamic = "force-dynamic";

export default function CheckoutRedirect() {
  redirect("/carrito");
}
