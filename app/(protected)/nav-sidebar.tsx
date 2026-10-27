import Image from 'next/image'
import { navParaRoles } from '@/lib/dashboard/nav'
import type { RolUsuario } from '@/lib/auth/types'
import { NavItemsList } from './nav-items'

// US-20.01: "la interfaz funciona correctamente en teléfono" — un sidebar
// fijo de 224px se comería más de la mitad del ancho en un teléfono, así que
// queda oculto bajo `md` (ver MobileNav para el equivalente angosto).
// Sistema de diseño Coinco (Prompt 1, Paso 3): fondo brand-800 institucional
// + escudo. El escudo es un placeholder generado (ver app/escudo-blanco) —
// reemplazar por el asset oficial cuando exista, sin tocar este layout.
export function NavSidebar({ roles }: { roles: RolUsuario[] }) {
  const items = navParaRoles(roles)

  return (
    <nav className="hidden w-56 shrink-0 flex-col bg-brand-800 p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Image src="/escudo-blanco" alt="" width={32} height={32} unoptimized />
        <span className="text-sm font-semibold text-white">Ayudas Sociales</span>
      </div>
      <NavItemsList items={items} />
    </nav>
  )
}
