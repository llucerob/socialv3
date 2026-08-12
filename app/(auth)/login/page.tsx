"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/lib/auth/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-sm space-y-8">
        <Image src="/logo-horizontal" alt="Municipalidad de Coinco" width={340} height={64} unoptimized className="mx-auto h-auto w-full max-w-[280px]" />

        <Card>
          <form action={formAction} className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Ayudas Sociales</h1>
              <p className="text-sm text-text-muted">Ingresa con tu cuenta institucional.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary"
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-danger-fg">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
