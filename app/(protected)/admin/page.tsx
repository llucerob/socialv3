import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'

const SECCIONES = [
  {
    href: '/admin/usuarios',
    titulo: 'Usuarios',
    descripcion: 'Ver usuarios del sistema, cambiar su rol o activar/desactivar su cuenta.',
  },
  {
    href: '/admin/sectores',
    titulo: 'Sectores',
    descripcion: 'Sectores territoriales para clasificar hogares y organizar entregas.',
  },
  {
    href: '/admin/motivos-entrega',
    titulo: 'Motivos de entrega fallida',
    descripcion: 'Catálogo de motivos que usa terreno al registrar una entrega fallida.',
  },
]

// EPIC 19 — Administración del sistema.
export default async function AdminPage() {
  await requireRole(['administrador'])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administración</h1>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((seccion) => (
          <li key={seccion.href}>
            <Link
              href={seccion.href}
              className="block rounded border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <p className="font-medium">{seccion.titulo}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{seccion.descripcion}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
