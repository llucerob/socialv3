import { getProfile } from "@/lib/auth/dal";
import { NavSidebar } from "./nav-sidebar";
import { MobileNav } from "./mobile-nav";
import { Topbar } from "./topbar";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col">
      <Topbar nombre={profile.nombre} rol={profile.rol} />
      <MobileNav rol={profile.rol} />
      <div className="flex flex-1">
        <NavSidebar rol={profile.rol} />
        <main className="flex flex-1 flex-col bg-surface-app p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
