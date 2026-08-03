const publicEnvironmentNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export interface SupabasePublicEnvironment {
  url: string;
  anonKey: string;
}

export function getSupabasePublicEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): SupabasePublicEnvironment {
  const missing = publicEnvironmentNames.filter((name) => !environment[name]?.trim());
  if (missing.length) {
    throw new Error(`Faltan variables públicas de Supabase: ${missing.join(", ")}`);
  }

  const url = environment.NEXT_PUBLIC_SUPABASE_URL as string;
  try {
    new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida.");
  }

  return { url, anonKey: environment.NEXT_PUBLIC_SUPABASE_ANON_KEY as string };
}

export function isSupabaseConfigured(environment: NodeJS.ProcessEnv = process.env) {
  try {
    getSupabasePublicEnvironment(environment);
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseServiceRoleKey(environment: NodeJS.ProcessEnv = process.env) {
  const key = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.");
  return key;
}
