import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name] ?? process.env[`NEXT_PUBLIC_${name}`];

  if (!value) {
    throw new Error(`Falta la variable ${name}. Configura Supabase antes de usar la biblioteca de casos guardados.`);
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
