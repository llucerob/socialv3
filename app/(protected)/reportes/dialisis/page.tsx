import { requireRole } from '@/lib/auth/dal'
import { reporteDialisisMensual } from '@/lib/reportes/dal'
import { ButtonLink } from '@/components/ui/Button'
import { FiltrosBar, CampoFiltro } from '@/components/ui/FiltrosBar'
import { BadgeExcepcion } from '@/components/ui/ExcepcionRSH'

const ROLES_REPORTE = ['administrador', 'finanzas', 'auditor_consulta'] as const

type SearchParams = {
  anio?: string
  mes?: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// US-17.04: "reembolsos por diálisis y acumulados mensuales, para controlar
// el tope de $150.000... se muestra beneficiario, mes, monto acumulado,
// saldo disponible, excepciones si existen". El criterio de aceptación no
// exige filtros — año/mes son un agregado adicional razonable para un
// reporte mensual (mismo espíritu que los filtros extra de auditoría).
export default async function ReporteDialisisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole([...ROLES_REPORTE])
  const { anio = '', mes = '' } = await searchParams

  const filas = await reporteDialisisMensual({
    anio: anio ? Number(anio) : undefined,
    mes: mes ? Number(mes) : undefined,
  })

  const hayFiltros = anio || mes
  const queryExport = new URLSearchParams(Object.entries({ anio, mes }).filter(([, valor]) => valor)).toString()
  const claseCampo = 'rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">Diálisis</h1>
        <ButtonLink href={`/api/reportes/dialisis/export${queryExport ? `?${queryExport}` : ''}`} variante="secondary">
          Exportar CSV
        </ButtonLink>
      </div>

      <FiltrosBar hrefLimpiar={hayFiltros ? '/reportes/dialisis' : undefined}>
        <CampoFiltro label="Año" htmlFor="anio">
          <input
            type="number"
            id="anio"
            name="anio"
            defaultValue={anio}
            placeholder="Todos"
            className={`w-24 ${claseCampo}`}
          />
        </CampoFiltro>
        <CampoFiltro label="Mes" htmlFor="mes">
          <select id="mes" name="mes" defaultValue={mes} className={claseCampo}>
            <option value="">Todos</option>
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </CampoFiltro>
      </FiltrosBar>

      {filas.length === 0 ? (
        <p className="text-sm text-text-muted">Sin reembolsos de diálisis para este filtro.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filas.map((fila) => (
            <li
              key={`${fila.persona_id}-${fila.anio}-${fila.mes}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text-primary">{fila.persona_nombre}</span>
                <span className="mx-2">·</span>
                <span className="text-text-muted">
                  {MESES[fila.mes - 1]} {fila.anio}
                </span>
                <div className="mt-1 text-text-muted">
                  Acumulado: ${fila.monto_acumulado.toLocaleString('es-CL')}
                  {' · '}
                  Saldo disponible: ${fila.saldo_disponible.toLocaleString('es-CL')}
                </div>
                {fila.tiene_excepcion && (
                  <span className="mt-1 inline-block">
                    <BadgeExcepcion />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
