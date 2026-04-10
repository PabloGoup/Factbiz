import { NextResponse } from "next/server";
import { z } from "zod";

import { setAuthCookies, serializeUser } from "@/lib/auth/supabaseSession";
import { createSupabaseAuthClient } from "@/lib/db/supabase";

const signUpSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(6, "La clave debe tener al menos 6 caracteres.")
});

export async function POST(request: Request) {
  try {
    const body = signUpSchema.parse(await request.json());
    const supabase = createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: body.name ? { full_name: body.name } : undefined
      }
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "No fue posible crear la cuenta." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      user: serializeUser(data.user),
      needsEmailConfirmation: !data.session
    });

    if (data.session) {
      setAuthCookies(response, data.session);
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Solicitud invalida.", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible crear la cuenta." },
      { status: 500 }
    );
  }
}
