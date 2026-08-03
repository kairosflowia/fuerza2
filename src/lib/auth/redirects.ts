const defaultPath = "/cuenta";

export function safeReturnPath(value: string | null | undefined, fallback = defaultPath) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "http://localhost");
    return url.origin === "http://localhost" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
