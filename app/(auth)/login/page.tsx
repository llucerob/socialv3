"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-8 dark:border-white/10"
      >
        <div>
          <h1 className="text-xl font-semibold">Ayudas Sociales — Coinco</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ingresa con tu cuenta institucional.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-foreground py-2 font-medium text-background disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
