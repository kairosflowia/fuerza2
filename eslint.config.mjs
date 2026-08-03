import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/app/api/{checkout,orders,stripe}/**/*.{ts,tsx}", "src/app/admin/pedidos/**/*.{ts,tsx}", "src/components/{cart,checkout}/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([".next/**", "coverage/**", "supabase/.temp/**", "next-env.d.ts"]),
]);
