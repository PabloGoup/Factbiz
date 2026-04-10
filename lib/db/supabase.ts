import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name] ?? process.env[`NEXT_PUBLIC_${name}`];

  if (!value) {
    throw new Error(`Falta la variable ${name}. Configura Supabase antes de usar la biblioteca de casos guardados.`);
  }

  return value;
}

function getSupabasePublicKey() {
  const value =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Falta la clave publica de Supabase. Configura SUPABASE_PUBLISHABLE_KEY o SUPABASE_ANON_KEY para usar el inicio de sesion."
    );
  }

  return value;
}

export function createSupabaseAdminClient() {
  const url = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createSupabaseAuthClient() {
  const url = getRequiredEnv("SUPABASE_URL");
  const publicKey = getSupabasePublicKey();

  return createClient(url, publicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
