const serverRequired=["NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY","CRON_SECRET"] as const;
export function validateProductionEnvironment(env:NodeJS.ProcessEnv=process.env){
  if(env.NODE_ENV!=="production")return{valid:true,missing:[] as string[],invalid:[] as string[]};
  // Escape hatch explícito para la fase de pre-lanzamiento (bugs/layout, sin
  // Stripe/email reales todavía): sin esta variable, el comportamiento es
  // exactamente el mismo de siempre -- solo se activa si alguien la pone a
  // propósito, y basta con quitarla para que la comprobación vuelva a bloquear.
  if(env.ALLOW_INCOMPLETE_PRODUCTION_ENV==="true")return{valid:true,missing:[] as string[],invalid:[] as string[]};
  const missing=serverRequired.filter(name=>!env[name]?.trim());const invalid=[] as string[];
  if(env.NEXT_PUBLIC_SITE_URL?.includes("localhost"))invalid.push("NEXT_PUBLIC_SITE_URL");
  if(env.EMAIL_PROVIDER==="fake")invalid.push("EMAIL_PROVIDER");if(env.PUSH_PROVIDER==="fake")invalid.push("PUSH_PROVIDER");
  if(env.STRIPE_SECRET_KEY?.startsWith("sk_test_")&&!env.ALLOW_STRIPE_TEST_IN_PRODUCTION)invalid.push("STRIPE_MODE");
  return{valid:missing.length===0&&invalid.length===0,missing:[...missing],invalid};
}
