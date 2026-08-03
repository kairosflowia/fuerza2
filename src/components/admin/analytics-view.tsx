import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { euro, integer } from "@/lib/analytics";

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <Card className="analytics-metric"><p>{label}</p><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</Card>;
}

export function AnalyticsFilters({ params, points, products }: { params: Record<string,string|undefined>; points: {id:string;name:string}[]; products: {id:string;name:string}[] }) {
  return <form className="analytics-filters">
    <label>Periodo<select name="periodo" defaultValue={params.periodo ?? "7d"}>{[["today","Hoy"],["yesterday","Ayer"],["7d","Últimos 7 días"],["30d","Últimos 30 días"],["month","Mes actual"],["custom","Intervalo personalizado"]].map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <label>Desde<input type="date" name="desde" defaultValue={params.desde}/></label><label>Hasta<input type="date" name="hasta" defaultValue={params.hasta}/></label>
    <label>Punto<select name="punto" defaultValue={params.punto ?? ""}><option value="">Todos</option>{points.map(point=><option key={point.id} value={point.id}>{point.name}</option>)}</select></label>
    <label>Producto<select name="producto" defaultValue={params.producto ?? ""}><option value="">Todos</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
    <label>Origen<select name="origen" defaultValue={params.origen ?? ""}><option value="">Todos</option><option value="one_off">Venta suelta</option><option value="subscription">Plan de Pan</option></select></label>
    <button className="button button--primary">Aplicar filtros</button>
  </form>;
}

type RankedRow = { product_id?: string; pickup_point_id?: string; product_name_snapshot?: string; point_name?: string; units?: number; orders?: number; revenue_cents?: number };
export function RankedTable({ title, rows, kind }: { title: string; rows: RankedRow[]; kind: "products"|"points" }) {
  if (!rows.length) return <EmptyState title={title} description="No hay datos reales para el periodo seleccionado."/>;
  return <section className="analytics-table"><h2>{title}</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{kind === "products" ? "Producto" : "Punto"}</th><th>Unidades</th><th>Pedidos</th><th>Ingresos</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.product_id ?? row.pickup_point_id}-${index}`}><td>{row.product_name_snapshot ?? row.point_name}</td><td>{integer(row.units)}</td><td>{integer(row.orders)}</td><td>{euro(row.revenue_cents)}</td></tr>)}</tbody></table></div></section>;
}

export function AnalyticsLinks() {
  return <nav className="analytics-tabs" aria-label="Vistas de analítica"><Link href="/admin">Resumen</Link><Link href="/admin/analitica/productos">Productos</Link><Link href="/admin/analitica/clientes">Clientes</Link><Link href="/admin/analitica/suscripciones">Plan de Pan</Link><Link href="/admin/analitica/puntos">Puntos</Link></nav>;
}
