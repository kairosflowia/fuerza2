import { headers } from "next/headers";

export async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") === "https" ? "https" : "http";
  return configured || (host ? `${protocol}://${host}` : "http://localhost:3000");
}
