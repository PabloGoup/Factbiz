import { NextResponse } from "next/server";

import { clearAuthCookies, getAuthUserFromRequest, serializeUser, UnauthorizedError } from "@/lib/auth/supabaseSession";

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible leer la sesion." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
