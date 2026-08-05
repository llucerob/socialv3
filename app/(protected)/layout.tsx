import { getProfile } from "@/lib/auth/dal";
import { ROL_LABELS } from "@/lib/auth/types";
import { LogoutButton } from "./logout-button";
import { NavSidebar } from "./nav-sidebar";
import { MobileNav } from "./mobile-nav";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 md:px-6 md:py-4 dark:border-white/10">
        <div>
          <p className="font-semibold">Ayudas Sociales — Coinco</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {profile.nombre} · {ROL_LABELS[profile.rol]}
          </p>
        </div>
        <LogoutButton />
      </header>
      <MobileNav rol={profile.rol} />
      <div className="flex flex-1">
        <NavSidebar rol={profile.rol} />
        <main className="flex flex-1 flex-col p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
