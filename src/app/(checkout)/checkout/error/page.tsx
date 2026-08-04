import Link from "next/link";
export default function CheckoutError(){return <main id="main-content"><h1>No se ha completado el pago</h1><p>La encomienda no está confirmada. Puedes volver a la cesta e intentarlo de nuevo.</p><Link className="button button--primary" href="/carrito">Volver a la cesta</Link></main>}
