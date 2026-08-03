import { readFileSync } from "node:fs";import { resolve } from "node:path";import { describe,expect,it } from "vitest";import { sanitizeLog } from "@/lib/observability";import { validateProductionEnvironment } from "@/lib/production-env";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("production hardening",()=>{
it("redacts secrets and masks email logs",()=>expect(sanitizeLog({password:"x",client_secret:"y",email:"person@example.com"})).toEqual({password:"[redacted]",client_secret:"[redacted]",email:"pe***@example.com"}));
it("rejects fake providers, localhost and Stripe test in production",()=>{const result=validateProductionEnvironment({NODE_ENV:"production",NEXT_PUBLIC_SITE_URL:"http://localhost:3000",EMAIL_PROVIDER:"fake",PUSH_PROVIDER:"fake",STRIPE_SECRET_KEY:"sk_test_x"} as NodeJS.ProcessEnv);expect(result.valid).toBe(false);expect(result.invalid).toEqual(expect.arrayContaining(["NEXT_PUBLIC_SITE_URL","EMAIL_PROVIDER","PUSH_PROVIDER","STRIPE_MODE"]))});
it("sets restrictive headers compatible with Stripe",()=>{const config=read("next.config.ts");expect(config).toContain("frame-ancestors 'none'");expect(config).toContain("https://js.stripe.com");expect(config).toContain("Strict-Transport-Security");expect(config).not.toContain("default-src *")});
it("requires cron secrets instead of silently opening jobs",()=>{for(const route of ["availability","communications"])expect(read(`src/app/api/cron/${route}/route.ts`)).toContain("cron_not_configured")});
it("rate limits auth, checkout, order lookup and push",()=>{for(const file of ["src/app/(public)/cuenta/actions.ts","src/app/api/checkout/create/route.ts","src/app/api/orders/[code]/route.ts","src/app/api/push/subscriptions/route.ts"])expect(read(file)).toContain("enforceRateLimit")});
it("keeps private pages and exports no-store",()=>{expect(read("next.config.ts")).toContain("private, no-store");expect(read("src/app/api/orders/[code]/route.ts")).not.toContain("customer_email")});
it("uses no advertising tracker",()=>{const pkg=read("package.json");for(const name of ["google-analytics","hotjar","mixpanel","segment"])expect(pkg).not.toContain(name)});
});
