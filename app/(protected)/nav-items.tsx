'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/lib/dashboard/nav'
import { NavIcon } from './nav-icons'

// Lista de items compartida entre NavSidebar (escritorio) y MobileNav
// (teléfono, US-20.01) — mismo marcado, distinto contenedor. Cliente por
// `usePathname` (Paso 3, Prompt 1: el ítem activo se resalta con brand-600).
export function NavItemsList({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const activo = pathname === item.href || pathname?.startsWith(`${item.href}/`)

        return (
          <li key={item.href}>
            {item.disponible ? (
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activo
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-100 hover:bg-brand-600/40 hover:text-white'
                }`}
              >
                <NavIcon label={item.label} />
                {item.label}
              </Link>
            ) : (
              <span className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-brand-100/50">
                <span className="flex items-center gap-3">
                  <NavIcon label={item.label} />
                  {item.label}
                </span>
                <span className="text-xs">Próximamente</span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
