import { validateProductionEnvironment } from "@/lib/production-env";
export async function register(){if(process.env.NEXT_RUNTIME==="nodejs"&&process.env.VERCEL_ENV==="production"){const result=validateProductionEnvironment();if(!result.valid)throw new Error(`Configuración de producción incompleta: ${[...result.missing,...result.invalid].join(", ")}`)}}
