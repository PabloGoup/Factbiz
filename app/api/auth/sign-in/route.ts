import { NextResponse } from "next/server";
import { z } from "zod";

import { setAuthCookies, serializeUser } from "@/lib/auth/supabaseSession";
import { createSupabaseAuthClient } from "@/lib/db/supabase";

const signInSchema = z.object({
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(6, "La clave debe tener al menos 6 caracteres.")
});

export async function POST(request: Request) {
  try {
    const body = signInSchema.parse(await request.json());
    const supabase = createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "No fue posible iniciar sesion con esas credenciales." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ user: serializeUser(data.user) });
    setAuthCookies(response, data.session);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Solicitud invalida.", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible iniciar sesion." },
      { status: 500 }
    );
  }
}
