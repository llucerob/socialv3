import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { reporteDialisisMensual } from '@/lib/reportes/dal'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Diálisis</h1>
        <a
          href={`/api/reportes/dialisis/export${queryExport ? `?${queryExport}` : ''}`}
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Exportar CSV
        </a>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="anio" className="text-sm font-medium">
            Año
          </label>
          <input
            type="number"
            id="anio"
            name="anio"
            defaultValue={anio}
            placeholder="Todos"
            className="w-24 rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mes" className="text-sm font-medium">
            Mes
          </label>
          <select
            id="mes"
            name="mes"
            defaultValue={mes}
            className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          >
            <option value="">Todos</option>
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/reportes/dialisis" className="text-sm text-zinc-500 underline dark:text-zinc-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      {filas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin reembolsos de diálisis para este filtro.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
          {filas.map((fila) => (
            <li
              key={`${fila.persona_id}-${fila.anio}-${fila.mes}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{fila.persona_nombre}</span>
                <span className="mx-2">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {MESES[fila.mes - 1]} {fila.anio}
                </span>
                <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                  Acumulado: ${fila.monto_acumulado.toLocaleString('es-CL')}
                  {' · '}
                  Saldo disponible: ${fila.saldo_disponible.toLocaleString('es-CL')}
                </div>
                {fila.tiene_excepcion && (
                  <span className="mt-1 inline-block rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700 dark:text-amber-500">
                    Excepción
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
