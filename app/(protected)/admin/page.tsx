import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'

const SECCIONES = [
  {
    href: '/admin/usuarios',
    titulo: 'Usuarios',
    descripcion: 'Crear usuarios, cambiar sus roles o activar/desactivar su cuenta.',
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
      <h1 className="text-2xl font-semibold text-text-primary">Administración</h1>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((seccion) => (
          <li key={seccion.href}>
            <Link
              href={seccion.href}
              className="block rounded-xl border border-border bg-surface p-4 hover:bg-surface-alt"
            >
              <p className="font-medium text-text-primary">{seccion.titulo}</p>
              <p className="mt-1 text-sm text-text-muted">{seccion.descripcion}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
