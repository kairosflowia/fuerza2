import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/app/api/{checkout,orders,stripe,subscriptions,admin,cron,resend,push}/**/*.{ts,tsx}", "src/app/admin/{pedidos,suscripciones,produccion,comunicaciones,contenido,configuracion,productos,inventario,analitica,clientes,pagos,mensajes}/**/*.{ts,tsx}", "src/app/admin/page.tsx", "src/app/modo-produccion/**/*.{ts,tsx}", "src/app/(public)/**/{plan-de-pan,cuenta,contacto}/**/*.{ts,tsx}", "src/app/(public)/*legal*/page.tsx", "src/components/{cart,checkout,subscriptions,account,privacy}/**/*.tsx", "src/components/admin/variant-movements-drawer.tsx", "src/lib/{notifications,order-emails,production-batches}.{ts,tsx}", "src/lib/notifications/**/*.{ts,tsx}", "src/lib/security/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([".next/**", "coverage/**", "supabase/.temp/**", "next-env.d.ts"]),
]);
