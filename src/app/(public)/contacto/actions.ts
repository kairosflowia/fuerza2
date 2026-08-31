"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const CONSENT_VERSION = "2026-08";

export interface ContactActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

const REASON_VALUES = new Set(["general", "recogida", "colaboracion"]);

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function submitContactAction(_state: ContactActionState, formData: FormData): Promise<ContactActionState> {
  if (!(await enforceRateLimit("contact.submit", 5, 900)).allowed) {
    return { status: "error", message: "Demasiados envíos seguidos. Espera unos minutos e inténtalo de nuevo." };
  }

  const name = value(formData, "name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  const reason = value(formData, "reason");
  const message = value(formData, "message");
  const consent = formData.get("consent") === "on";

  if (!name || !email || !message || !REASON_VALUES.has(reason)) {
    return { status: "error", message: "Revisa que todos los campos obligatorios estén completos." };
  }
  if (!consent) {
    return { status: "error", message: "Necesitamos tu consentimiento para poder responderte." };
  }

  const db = (await createClient()) as any;
  const { data, error } = await db.rpc("submit_contact_message", {
    p_name: name,
    p_email: email,
    p_phone: phone || null,
    p_reason: reason,
    p_message: message,
    p_consent: consent,
    p_consent_version: CONSENT_VERSION,
  });
  const result = data?.[0];

  if (error || !result?.ok) {
    return { status: "error", message: "No hemos podido enviar tu mensaje. Inténtalo de nuevo en unos minutos." };
  }

  return { status: "success", message: "Hemos recibido tu mensaje. Te responderemos a la mayor brevedad al correo que nos has indicado." };
}
