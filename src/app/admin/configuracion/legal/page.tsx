import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button, Card, Input } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
const fields=[['legal.controller_name','Titular o razón social'],['legal.tax_id','CIF/NIF'],['legal.fiscal_address','Domicilio fiscal'],['legal.contact_email','Correo legal']] as const;
async function save(form:FormData){"use server";const identity=await getCurrentIdentity();if(!identity?.roles.includes("owner"))throw new Error("forbidden");const db=createAdminClient()as any;for(const[key]of fields){const value=String(form.get(key)??"").trim();await db.from("app_settings").update({value:value?JSON.stringify(value):null,updated_by:identity.user.id}).eq("key",key)}revalidatePath("/admin/configuracion/legal");redirect("/admin/configuracion/legal")}
export default async function LegalSettings(){const identity=await getCurrentIdentity();if(!identity?.roles.includes("owner"))redirect("/cuenta/acceso-denegado");const db=createAdminClient()as any,{data}=await db.from("app_settings").select("key,value").in("key",fields.map(([key])=>key));const get=(key:string)=>{const raw=data?.find((row:any)=>row.key===key)?.value;return typeof raw==="string"?raw:""};return <><AdminPageHeader title="Datos legales" description="Campos pendientes de revisión humana. Guardarlos no convierte los borradores en asesoramiento jurídico."/><Card><form action={save} className="admin-form">{fields.map(([key,label])=><Input key={key} id={key} name={key} label={label} defaultValue={get(key)} optional/>)}<Button type="submit">Guardar borrador legal</Button></form></Card></>}
