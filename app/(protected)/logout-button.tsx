"use client";

import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-alt"
    >
      Cerrar sesión
    </button>
  );
}
