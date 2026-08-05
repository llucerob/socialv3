"use client";

import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="rounded border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      Cerrar sesión
    </button>
  );
}
