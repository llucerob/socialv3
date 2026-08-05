import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import type { RolUsuario } from '@/lib/auth/types'

type ReporteDisponible = {
  href: string
  titulo: string
  descripcion: string
  roles: readonly RolUsuario[]
}

// US-17.01 a US-17.05: cada reporte define sus propios roles autorizados
// (el mismo "como <rol>, quiero..." de su historia) — esta página solo
// filtra qué tarjetas mostrar; el control de acceso real vive en cada
// subpágina (requireRole) y en la función SQL que consulta (chequeo de rol
// interno, mismo patrón que auditoría).
const REPORTES: ReporteDisponible[] = [
  {
    href: '/reportes/ayudas-entregadas',
    titulo: 'Ayudas entregadas',
    descripcion: 'Ayudas entregadas o pagadas por período, tipo de ayuda y sector.',
    roles: ['administrador', 'auditor_consulta'],
  },
  {
    href: '/reportes/hogares-beneficiados',
    titulo: 'Hogares beneficiados',
    descripcion: 'Cobertura del programa: hogares que recibieron al menos una ayuda.',
    roles: ['administrador', 'auditor_consulta'],
  },
  {
    href: '/reportes/reembolsos-medicos',
    titulo: 'Reembolsos médicos',
    descripcion: 'Montos solicitados, aprobados y pagados por reembolso médico.',
    roles: ['administrador', 'finanzas'],
  },
  {
    href: '/reportes/dialisis',
    titulo: 'Diálisis',
    descripcion: 'Acumulado mensual y saldo disponible del tope de diálisis por beneficiario.',
    roles: ['administrador', 'finanzas', 'auditor_consulta'],
  },
  {
    href: '/reportes/reembolsos-excepcionales',
    titulo: 'Reembolsos excepcionales',
    descripcion: 'Reembolsos excepcionales por cirugía y por fallecimiento, por separado del reembolso general.',
    roles: ['administrador', 'finanzas'],
  },
  {
    href: '/reportes/entregas-pendientes-fallidas',
    titulo: 'Entregas pendientes y fallidas',
    descripcion: 'Entregas por reprogramar, con motivo de falla y responsable.',
    roles: ['administrador', 'bodega_logistica'],
  },
]

const ROLES_CON_REPORTES = ['administrador', 'auditor_consulta', 'finanzas', 'bodega_logistica'] as const

export default async function ReportesPage() {
  const profile = await requireRole([...ROLES_CON_REPORTES])
  const reportes = REPORTES.filter((reporte) => reporte.roles.includes(profile.rol))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reportes</h1>

      {reportes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay reportes disponibles para tu rol.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {reportes.map((reporte) => (
            <li key={reporte.href}>
              <Link
                href={reporte.href}
                className="block rounded border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <p className="font-medium">{reporte.titulo}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{reporte.descripcion}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
