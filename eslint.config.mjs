import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/app/api/{checkout,orders,stripe,subscriptions,admin,cron,resend,push}/**/*.{ts,tsx}", "src/app/admin/{pedidos,suscripciones,produccion,comunicaciones,contenido,configuracion,productos,inventario}/**/*.{ts,tsx}", "src/app/(public)/**/{plan-de-pan,cuenta}/**/*.{ts,tsx}", "src/components/{cart,checkout,subscriptions,account,privacy}/**/*.tsx", "src/lib/{notifications,order-emails}.{ts,tsx}", "src/lib/notifications/**/*.{ts,tsx}", "src/lib/security/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([".next/**", "coverage/**", "supabase/.temp/**", "next-env.d.ts"]),
]);
