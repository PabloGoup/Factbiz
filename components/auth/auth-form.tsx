"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "sign-in" | "sign-up";

type AuthResponse = {
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  needsEmailConfirmation?: boolean;
  error?: string;
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(isSignUp ? "/api/auth/sign-up" : "/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          password
        })
      });
      const payload = (await response.json()) as AuthResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible completar el acceso.");
      }

      if (payload.needsEmailConfirmation) {
        setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso antes de iniciar sesion.");
        return;
      }

      window.dispatchEvent(new Event("factibiz-auth-changed"));
      router.push("/casos-hoteleros");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible completar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-xl p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Cuenta Factibiz
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          {isSignUp ? "Crear cuenta" : "Iniciar sesion"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Usa una cuenta para guardar casos hoteleros, cargarlos despues y comparar proyectos separados por usuario.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
        <Button variant={mode === "sign-in" ? "primary" : "ghost"} onClick={() => setMode("sign-in")}>
          <LogIn className="mr-2 h-4 w-4" />
          Ingresar
        </Button>
        <Button variant={mode === "sign-up" ? "primary" : "ghost"} onClick={() => setMode("sign-up")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Registro
        </Button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        {isSignUp ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nombre</span>
            <Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Pablo" />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Correo</span>
          <Input
            className="mt-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Clave</span>
          <Input
            className="mt-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo 6 caracteres"
            required
          />
        </label>

        {message ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {message}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Procesando..." : isSignUp ? "Crear cuenta" : "Ingresar"}
        </Button>
      </form>
    </Card>
  );
}
