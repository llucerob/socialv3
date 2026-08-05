import Link from 'next/link'
import type { NavItem } from '@/lib/dashboard/nav'

// Lista de items compartida entre NavSidebar (escritorio) y MobileNav
// (teléfono, US-20.01) — mismo marcado, distinto contenedor.
export function NavItemsList({ items }: { items: NavItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          {item.disponible ? (
            <Link
              href={item.href}
              className="block rounded px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ) : (
            <span className="flex items-center justify-between rounded px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600">
              {item.label}
              <span className="text-xs">Próximamente</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
