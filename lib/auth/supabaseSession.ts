import { NextResponse } from "next/server";
import type { Session, User } from "@supabase/supabase-js";

import { createSupabaseAuthClient } from "@/lib/db/supabase";

const ACCESS_TOKEN_COOKIE = "factibiz_sb_access_token";
const REFRESH_TOKEN_COOKIE = "factibiz_sb_refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export class UnauthorizedError extends Error {
  constructor(message = "Debes iniciar sesion para usar esta funcion.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function readCookieFromRequest(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

export function setAuthCookies(response: NextResponse, session: Session) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0
  });
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : ""
  };
}

export async function getAuthUserFromRequest(request: Request) {
  const accessToken = readCookieFromRequest(request, ACCESS_TOKEN_COOKIE);

  if (!accessToken) {
    throw new UnauthorizedError();
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new UnauthorizedError("Tu sesion expiro. Vuelve a iniciar sesion.");
  }

  return data.user;
}
