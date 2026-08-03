"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeReturnPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

function unavailable(): AuthActionState {
  return { status: "error", message: "La autenticación todavía no está configurada en este entorno." };
}

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function callbackUrl(next: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") === "https" ? "https" : "http";
  const origin = configured || (host ? `${protocol}://${host}` : "http://localhost:3000");
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeReturnPath(next));
  return url.toString();
}

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return unavailable();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeReturnPath(value(formData, "next"));
  if (!validEmail(email) || password.length < 8) {
    return { status: "error", message: "Revisa el correo y la contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { status: "error", message: "No hemos podido iniciar sesión con esos datos." };
  }

  if (next.startsWith("/admin")) {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (roles?.some(({ role }) => role !== "customer")) {
      await supabase.rpc("log_admin_event", { event_action: "admin.login" });
    }
  }
  redirect(next);
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return unavailable();
  const fullName = value(formData, "full_name");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const confirmation = value(formData, "password_confirmation");
  if (fullName.length < 1 || fullName.length > 120 || !validEmail(email) || password.length < 8 || password !== confirmation) {
    return { status: "error", message: "Revisa los datos. La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: await callbackUrl("/cuenta") },
  });
  if (error) return { status: "error", message: "No hemos podido completar la solicitud. Inténtalo más tarde." };
  return { status: "success", message: "Revisa tu correo para confirmar la cuenta antes de acceder." };
}

export async function requestPasswordResetAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return unavailable();
  const email = value(formData, "email");
  if (validEmail(email)) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: await callbackUrl("/cuenta/restablecer") });
  }
  return { status: "success", message: "Si existe una cuenta con ese correo, recibirás instrucciones para continuar." };
}

export async function updatePasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return unavailable();
  const password = value(formData, "password");
  const confirmation = value(formData, "password_confirmation");
  if (password.length < 8 || password !== confirmation) {
    return { status: "error", message: "Las contraseñas deben coincidir y tener al menos 8 caracteres." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: "El enlace ha caducado o no es válido. Solicita uno nuevo." };
  return { status: "success", message: "La contraseña se ha actualizado. Ya puedes volver a tu cuenta." };
}

export async function updateProfileAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return unavailable();
  const fullName = value(formData, "full_name");
  const phone = value(formData, "phone");
  if (fullName.length < 1 || fullName.length > 120 || phone.length > 30) {
    return { status: "error", message: "Revisa el nombre y el teléfono." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Tu sesión ha caducado. Vuelve a acceder." };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", user.id);
  if (error) return { status: "error", message: "No hemos podido guardar los cambios." };
  return { status: "success", message: "Perfil actualizado." };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/cuenta/acceder");
}
