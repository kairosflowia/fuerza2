import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
  "font-src 'self' data:",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://api.resend.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  production ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() { return [{ source: "/:path*", headers: securityHeaders }, { source: "/admin/:path*", headers: [{ key:"Cache-Control",value:"private, no-store" }] }, { source:"/cuenta/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}] }, { source:"/checkout/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}] }]; },
};
export default nextConfig;
