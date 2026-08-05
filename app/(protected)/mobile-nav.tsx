import { NAV_BY_ROL } from '@/lib/dashboard/nav'
import type { RolUsuario } from '@/lib/auth/types'
import { NavItemsList } from './nav-items'

// US-20.01: "la interfaz funciona correctamente en teléfono... se puede
// operar sin acceder a módulos administrativos" — equivalente angosto de
// NavSidebar. <details>/<summary> nativo evita agregar estado de cliente
// solo para un menú colapsable (mismo criterio del resto del proyecto:
// formularios y navegación planos, sin JS a menos que sea indispensable).
export function MobileNav({ rol }: { rol: RolUsuario }) {
  const items = NAV_BY_ROL[rol]

  return (
    <details className="border-b border-black/10 md:hidden dark:border-white/10">
      <summary className="cursor-pointer list-none px-6 py-3 text-sm font-medium select-none">
        Menú
      </summary>
      <div className="px-4 pb-4">
        <NavItemsList items={items} />
      </div>
    </details>
  )
}
