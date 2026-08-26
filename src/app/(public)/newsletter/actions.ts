"use server";

import { createHash, randomUUID } from "node:crypto";

import { enforceRateLimit } from "@/lib/security/rate-limit";
import { siteOrigin } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export interface NewsletterActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

const CONSENT_VERSION = "2026-08";
const SUCCESS_MESSAGE = "¡Gracias! Ya formas parte de la lista de FUERZA.";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function subscribeToNewsletterAction(_state: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  if (!(await enforceRateLimit("newsletter.subscribe", 5, 900)).allowed) {
    return { status: "error", message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }
  const email = value(formData, "email");
  const consent = formData.get("consent") === "on";
  if (!validEmail(email)) return { status: "error", message: "Revisa el correo electrónico." };
  if (!consent) return { status: "error", message: "Marca la casilla para recibir novedades por correo." };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const confirmUrl = `${await siteOrigin()}/newsletter/confirmar?token=${token}`;

  const db = createAdminClient();
  const { data, error } = await db.rpc("newsletter_subscribe", {
    p_email: email,
    p_consent: true,
    p_consent_version: CONSENT_VERSION,
    p_source: "web_home",
    p_confirm_token_hash: hashToken(token),
    p_token_expires_at: expiresAt,
    p_confirm_url: confirmUrl,
  });
  const result = data?.[0];
  if (error || !result?.ok) {
    return { status: "error", message: "No hemos podido completar la suscripción. Inténtalo más tarde." };
  }
  return { status: "success", message: `${SUCCESS_MESSAGE} Revisa tu correo para confirmar la suscripción.` };
}

export async function confirmNewsletterAction(_state: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  if (!(await enforceRateLimit("newsletter.confirm", 10, 900)).allowed) {
    return { status: "error", message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }
  const token = value(formData, "token");
  if (!token) return { status: "error", message: "Enlace de confirmación no válido." };

  const unsubscribeToken = randomUUID();
  const unsubscribeUrl = `${await siteOrigin()}/newsletter/baja?token=${unsubscribeToken}`;

  const db = createAdminClient();
  const { data, error } = await db.rpc("newsletter_confirm", {
    p_token_hash: hashToken(token),
    p_unsubscribe_token_hash: hashToken(unsubscribeToken),
    p_unsubscribe_url: unsubscribeUrl,
  });
  const result = data?.[0];
  if (error || !result?.ok) {
    return { status: "error", message: "El enlace ha caducado o no es válido. Vuelve a suscribirte para recibir uno nuevo." };
  }
  return { status: "success", message: SUCCESS_MESSAGE };
}

export async function unsubscribeNewsletterAction(_state: NewsletterActionState, formData: FormData): Promise<NewsletterActionState> {
  if (!(await enforceRateLimit("newsletter.unsubscribe", 10, 900)).allowed) {
    return { status: "error", message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }
  const token = value(formData, "token");
  const reason = value(formData, "reason");
  if (!token) return { status: "error", message: "Enlace no válido." };

  const db = createAdminClient();
  const { data, error } = await db.rpc("newsletter_unsubscribe", { p_token_hash: hashToken(token), p_reason: reason || null });
  const result = data?.[0];
  if (error || !result?.ok) {
    return { status: "error", message: "No hemos podido procesar la baja. El enlace puede haber caducado." };
  }
  return { status: "success", message: "Te has dado de baja de la newsletter de FUERZA." };
}
