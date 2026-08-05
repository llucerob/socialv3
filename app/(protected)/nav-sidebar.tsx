import { NAV_BY_ROL } from '@/lib/dashboard/nav'
import type { RolUsuario } from '@/lib/auth/types'
import { NavItemsList } from './nav-items'

// US-20.01: "la interfaz funciona correctamente en teléfono" — un sidebar
// fijo de 224px se comería más de la mitad del ancho en un teléfono, así que
// queda oculto bajo `md` (ver MobileNav para el equivalente angosto).
export function NavSidebar({ rol }: { rol: RolUsuario }) {
  const items = NAV_BY_ROL[rol]

  return (
    <nav className="hidden w-56 shrink-0 border-r border-black/10 p-4 md:block dark:border-white/10">
      <NavItemsList items={items} />
    </nav>
  )
}
