"use client";

import { useEffect, useState } from "react";

type Device = {
  id: string;
  platform: string;
  device_name: string | null;
  status: string;
  last_used_at: string | null;
  created_at: string;
};

const toBytes = (value: string) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

/**
 * Activación de avisos push. El permiso del navegador solo se pide al pulsar
 * "Activar avisos" (nunca al cargar la página).
 */
export function PushNotifications({ initialDevices }: { initialDevices: Device[] }) {
  const [supported, setSupported] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [devices, setDevices] = useState(initialDevices);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const capable = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(capable);
    if (capable) setPermission(Notification.permission);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(!ios || standalone);
  }, []);

  async function activate() {
    setMessage("");
    if (!supported || !installed) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setMessage("Puedes activarlas más adelante desde esta página.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
      setMessage("Los avisos todavía no están configurados.");
      return;
    }
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(key) });
    const json = subscription.toJSON();
    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, platform: "pwa", deviceName: navigator.platform }),
    });
    if (!response.ok) {
      setMessage("No hemos podido activar este dispositivo.");
      return;
    }
    const { id } = await response.json();
    setDevices((current) => [
      { id, platform: "pwa", device_name: navigator.platform, status: "active", last_used_at: new Date().toISOString(), created_at: new Date().toISOString() },
      ...current.filter((device) => device.id !== id),
    ]);
    setMessage("Avisos activados en este dispositivo.");
  }

  async function remove(id: string) {
    const response = await fetch("/api/push/subscriptions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setDevices((current) => current.map((device) => (device.id === id ? { ...device, status: "revoked" } : device)));
  }

  const activeDevices = devices.filter((device) => device.status === "active");

  return (
    <div className="fz-push">
      {!supported ? (
        <p className="fz-push__note">Este navegador no admite notificaciones push.</p>
      ) : !installed ? (
        <p className="fz-push__note">En iPhone o iPad, añade FUERZA a la pantalla de inicio antes de activar los avisos.</p>
      ) : permission === "denied" ? (
        <p className="fz-push__note">Has bloqueado los avisos en este navegador. Puedes permitirlos desde los ajustes del navegador.</p>
      ) : (
        <button type="button" className="fz-btn fz-btn--block" onClick={activate}>
          {activeDevices.length ? "Activar en este dispositivo" : "Activar avisos"}
        </button>
      )}
      {message ? <p className="fz-push__note" role="status">{message}</p> : null}
      {activeDevices.length ? (
        <ul className="fz-push__devices">
          {activeDevices.map((device) => (
            <li key={device.id}>
              <span>
                {device.device_name || device.platform}
                <small>Última actividad {device.last_used_at ? new Date(device.last_used_at).toLocaleDateString("es-ES") : "sin registrar"}</small>
              </span>
              <button type="button" className="fz-text-button" onClick={() => remove(device.id)}>Desactivar</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
