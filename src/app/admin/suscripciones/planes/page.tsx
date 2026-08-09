import{toggleSubscribableAction}from"../actions";import{AdminPageHeader}from"@/components/admin/admin-page-header";import{Badge,Button,EmptyState}from"@/components/ui";import{createClient}from"@/lib/supabase/server";
export default async function SubscribableVariantsAdmin(){
  const db:any=await createClient();
  const[{data:variants},{data:products}]=await Promise.all([
    db.from("product_variants").select("id,name,status,price_cents,subscribable,product_id").eq("status","active").not("price_cents","is",null).order("name"),
    db.from("products").select("id,name"),
  ]);
  const productName=(id:string)=>products?.find((p:any)=>p.id===id)?.name??"Producto";
  const rows=(variants??[]).map((v:any)=>({...v,productName:productName(v.product_id)})).sort((a:any,b:any)=>a.productName.localeCompare(b.productName)||a.name.localeCompare(b.name));
  return <>
    <AdminPageHeader title="Panes en Fuerza Habitual" description="Marca qué variantes activas y con precio pueden añadirse a la cesta de una membresía." />
    {rows.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Producto</th><th>Variante</th><th>Membresía</th><th>Acciones</th></tr></thead><tbody>
      {rows.map((v:any)=><tr key={v.id}>
        <td>{v.productName}</td>
        <td>{v.name}</td>
        <td><Badge variant={v.subscribable?"success":"neutral"}>{v.subscribable?"Disponible":"No disponible"}</Badge></td>
        <td className="admin-table__actions">
          <form action={toggleSubscribableAction}>
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="enabled" value={(!v.subscribable).toString()} />
            <Button type="submit" variant="secondary">{v.subscribable?"Quitar de membresía":"Añadir a membresía"}</Button>
          </form>
        </td>
      </tr>)}
    </tbody></table></div>:<EmptyState title="Sin variantes publicables" description="Publica al menos un producto con precio en /admin/productos antes de curar Fuerza Habitual." />}
  </>;
}
