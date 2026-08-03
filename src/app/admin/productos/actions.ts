"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CatalogActionState = { ok:boolean; message?:string; errors?:Record<string,string> };
const text=(f:FormData,n:string)=>String(f.get(n)??"").trim();
const integer=(f:FormData,n:string)=>{const v=text(f,n);return v===""?null:Number.parseInt(v,10)};
const slugOk=(v:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);

async function authorized() { const identity=await getCurrentIdentity(); if(!identity||!canAccessAdminSection(identity.roles,"productos")) throw new Error("forbidden"); return createClient(); }
function refresh(slug?:string){ revalidateTag("catalog","max"); revalidatePath("/pan"); if(slug)revalidatePath(`/pan/${slug}`); revalidatePath("/admin/productos"); }

export async function saveFamilyAction(_s:CatalogActionState, f:FormData):Promise<CatalogActionState>{
  const name=text(f,"name"),slug=text(f,"slug"),id=text(f,"id"); if(!name||!slugOk(slug))return{ok:false,errors:{name:"Indica un nombre.",slug:"Usa minúsculas, números y guiones."}};
  const db=await authorized(); const payload={name,slug,description:text(f,"description")||null,color_key:text(f,"color_key")||"terracota",display_order:integer(f,"display_order")??0,status:text(f,"status")==="active"?"active" as const:"hidden" as const};
  const result=id?await db.from("product_families").update(payload).eq("id",id):await db.from("product_families").insert(payload); if(result.error)return{ok:false,message:"No se ha guardado. Comprueba que el slug no esté repetido."}; refresh(); return{ok:true,message:"Familia guardada."};
}

function productPayload(f:FormData){return{family_id:text(f,"family_id"),name:text(f,"name"),slug:text(f,"slug"),short_description:text(f,"short_description")||null,long_description:text(f,"long_description")||null,flour_type:text(f,"flour_type")||null,flour_origin:text(f,"flour_origin")||null,fermentation_hours:integer(f,"fermentation_hours"),display_order:integer(f,"display_order")??0,seo_title:text(f,"seo_title")||null,seo_description:text(f,"seo_description")||null};}
function validateProduct(f:FormData){const p=productPayload(f),errors:Record<string,string>={}; if(!p.name)errors.name="El nombre es obligatorio.";if(!slugOk(p.slug))errors.slug="Usa minúsculas, números y guiones.";if(!p.family_id)errors.family_id="Selecciona una familia.";if(!p.short_description)errors.short_description="La descripción corta es obligatoria para publicar.";for(let i=0;i<10;i++){const price=integer(f,`price_cents_${i}`);if(price!==null&&price<0)errors[`price_cents_${i}`]="El precio no puede ser negativo."}return{p,errors};}

export async function saveProductAction(_s:CatalogActionState,f:FormData):Promise<CatalogActionState>{
 const {p,errors}=validateProduct(f); if(Object.keys(errors).length)return{ok:false,errors}; const db=await authorized(); const id=text(f,"id"); const requested=text(f,"status") as "draft"|"active"|"seasonal"|"unavailable"|"discontinued"; let productId=id;
 if(id){const r=await db.from("products").update({...p,status:"draft"}).eq("id",id);if(r.error)return{ok:false,message:r.error.message};}else{const r=await db.from("products").insert({...p,status:"draft"}).select("id").single();if(r.error)return{ok:false,message:"No se ha creado. Comprueba el slug."};productId=r.data.id;}
 const variants=Array.from({length:10},(_,i)=>({name:text(f,`variant_name_${i}`),price:integer(f,`price_cents_${i}`),weight:integer(f,`weight_grams_${i}`),vat:Number(text(f,`vat_rate_${i}`)||"0"),display_order:i})).filter(v=>v.name);await db.from("product_variants").delete().eq("product_id",productId);if(variants.length){const vr=await db.from("product_variants").insert(variants.map(v=>({product_id:productId,name:v.name,price_cents:v.price,approximate_weight_grams:v.weight,vat_rate:v.vat,display_order:v.display_order,status:v.price===null?"draft" as const:"active" as const})));if(vr.error)return{ok:false,message:vr.error.message};}
 await db.from("product_production_weekdays").delete().eq("product_id",productId); const days=f.getAll("weekday").map(Number).filter(d=>d>=1&&d<=7);if(days.length)await db.from("product_production_weekdays").insert(days.map(weekday=>({product_id:productId,weekday,is_active:true})));
 const allergenIds=f.getAll("allergen").map(String);await db.from("product_allergens").delete().eq("product_id",productId);if(allergenIds.length)await db.from("product_allergens").insert(allergenIds.map(allergen_id=>({product_id:productId,allergen_id,presence_type:"contains" as const})));
 const mayIds=f.getAll("may_contain").map(String);if(mayIds.length)await db.from("product_allergens").insert(mayIds.map(allergen_id=>({product_id:productId,allergen_id,presence_type:"may_contain" as const})));
 const ingredients=text(f,"ingredients").split(",").map(x=>x.trim()).filter(Boolean);await db.from("product_ingredients").delete().eq("product_id",productId);for(const [display_order,name] of ingredients.entries()){const found=await db.from("ingredients").upsert({name},{onConflict:"name"}).select("id").single();if(found.data)await db.from("product_ingredients").insert({product_id:productId,ingredient_id:found.data.id,display_order});}
 const publish=await db.from("products").update({status:requested||"draft"}).eq("id",productId);if(publish.error)return{ok:false,message:"No se puede publicar: completa una variante activa y el texto obligatorio."};refresh(p.slug);redirect(`/admin/productos/${productId}`);
}
export async function discontinueProductAction(f:FormData){const db=await authorized(),id=text(f,"id"),slug=text(f,"slug");await db.from("products").update({status:"discontinued"}).eq("id",id);refresh(slug);redirect("/admin/productos");}
export async function uploadProductImageAction(f:FormData){const db=await authorized(),productId=text(f,"product_id"),slug=text(f,"slug"),alt=text(f,"alt_text"),file=f.get("image");if(!(file instanceof File)||!alt||file.size>8388608||!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type))return;const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"}[file.type];const path=`${productId}/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});if(!up.error)await db.from("product_images").insert({product_id:productId,storage_path:path,alt_text:alt,is_primary:f.get("is_primary")==="on"});refresh(slug);}
export async function removeProductImageAction(f:FormData){const db=await authorized(),id=text(f,"image_id"),path=text(f,"storage_path"),slug=text(f,"slug");const removed=await db.from("product_images").delete().eq("id",id);if(!removed.error)await db.storage.from("product-images").remove([path]);refresh(slug);}
