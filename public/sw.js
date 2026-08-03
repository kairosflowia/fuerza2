const CACHE_NAME = "fuerza-static-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/fuerza.jpeg", "/manifest.webmanifest", "/icon", "/apple-icon"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname === "/cuenta" || url.pathname.startsWith("/cuenta/") || url.pathname === "/checkout" || url.pathname.startsWith("/checkout/") || url.pathname.startsWith("/pedido/") || url.pathname.startsWith("/plan-de-pan/checkout") || url.pathname.includes("/configurar")) {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const isStaticAsset = url.pathname.startsWith("/_next/static/") ||
    ["font", "image", "style", "script"].includes(request.destination);

  if (isStaticAsset) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const url = typeof data.url === "string" && data.url.startsWith("/") && !data.url.startsWith("//") ? data.url : "/cuenta";
  event.waitUntil(self.registration.showNotification(data.title || "FUERZA", {
    body: data.body || "Tienes una actualización.", icon: data.icon || "/icon", badge: data.badge || "/icon",
    tag: data.tag || "fuerza-update", data: { url }, renotify: false,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.url;
  const path = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/cuenta";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) { await client.focus(); if ("navigate" in client) await client.navigate(path); return; }
    }
    return self.clients.openWindow(path);
  }));
});
