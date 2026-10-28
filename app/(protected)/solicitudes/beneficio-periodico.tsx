import Link from 'next/link'
import {
  ESTADO_BENEFICIO_LABELS,
  PERIODICIDAD_BENEFICIO_LABELS,
  etiquetaPeriodo,
  parametroDePeriodo,
  type HistorialCambioBeneficio,
  type PeriodoBeneficio,
  type ResumenBeneficio,
} from '@/lib/beneficios/types'
import { ESTADO_ENTREGA_LABELS, MODALIDAD_ENTREGA_LABELS } from '@/lib/entregas/types'
import { Card } from '@/components/ui/Card'
import { BadgeExcepcion } from '@/components/ui/ExcepcionRSH'
import { formatearFecha } from '@/lib/fechas'
import { CambiarModalidadForm, SuspenderBeneficioForm } from './beneficio-forms'

type BeneficioAction = Parameters<typeof SuspenderBeneficioForm>[0]['action']

const CLASES_ESTADO: Record<ResumenBeneficio['estado'], string> = {
  vigente: 'bg-success-bg text-success-fg',
  completado: 'bg-success-bg text-success-fg',
  suspendido: 'bg-neutral-bg text-neutral-fg',
  vencido: 'bg-neutral-bg text-neutral-fg',
}

function estadoPeriodo(periodo: PeriodoBeneficio): string {
  switch (periodo.estado_periodo) {
    case 'entregado': {
      const conAtraso =
        periodo.mes_entrega && periodo.mes_entrega !== periodo.periodo ? ` en ${etiquetaPeriodo(periodo.mes_entrega)}` : ''
      const modalidad = periodo.modalidad ? ` (${MODALIDAD_ENTREGA_LABELS[periodo.modalidad].toLowerCase()})` : ''
      return `Entregado${conAtraso}${modalidad}`
    }
    case 'no_entregado':
      return 'No se retiró a tiempo (se pierde)'
    case 'cancelado':
      return 'Cancelado'
    case 'por_venir':
      return 'Por venir (estimado)'
    case 'abierto': {
      const plazo = periodo.ventana_hasta !== periodo.periodo ? ` · puede retirarse hasta ${etiquetaPeriodo(periodo.ventana_hasta)}` : ''
      const estado = periodo.estado_entrega
        ? ESTADO_ENTREGA_LABELS[periodo.estado_entrega]
        : periodo.salida_registrada
          ? 'Listo para entregar'
          : 'Falta salida de stock'
      return `${estado}${plazo}`
    }
  }
}

// MR-08: resumen del beneficio y su calendario de entregas. Cada período
// enlaza a ?periodo=, que es el período con el que trabaja la sección
// "Entrega" de la solicitud.
export function BeneficioPeriodico({
  beneficio,
  periodos,
  periodoSeleccionado,
  mesActual,
  solicitudId,
  historial,
  accionCambiarModalidad,
  accionSuspender,
}: {
  beneficio: ResumenBeneficio
  periodos: PeriodoBeneficio[]
  periodoSeleccionado: string
  mesActual: string
  solicitudId: string
  historial: HistorialCambioBeneficio[]
  // Solo para gestor social, aprobador y administrador, con el beneficio vigente.
  accionCambiarModalidad?: BeneficioAction
  accionSuspender?: BeneficioAction
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium text-text-primary">Beneficio</h2>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${CLASES_ESTADO[beneficio.estado]}`}>
            {ESTADO_BENEFICIO_LABELS[beneficio.estado]}
          </span>
          {beneficio.es_excepcion && <BadgeExcepcion texto="Aprobado por excepción RSH" />}
        </div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-text-muted">Periodicidad</dt>
            <dd className="font-medium text-text-primary">{PERIODICIDAD_BENEFICIO_LABELS[beneficio.periodicidad]}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Modalidad</dt>
            <dd className="font-medium text-text-primary">{MODALIDAD_ENTREGA_LABELS[beneficio.modalidad]}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Vigencia</dt>
            <dd className="font-medium text-text-primary">
              {etiquetaPeriodo(beneficio.vigente_desde)} a {formatearFecha(beneficio.vigente_hasta)}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Avance</dt>
            <dd className="font-medium text-text-primary">
              {beneficio.periodos_entregados} de {beneficio.total_periodos} entregados
              {beneficio.periodos_no_entregados > 0 && ` · ${beneficio.periodos_no_entregados} no retirados`}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Última entrega</dt>
            <dd className="font-medium text-text-primary">
              {beneficio.ultima_entrega ? new Date(beneficio.ultima_entrega).toLocaleString('es-CL') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Próxima entrega</dt>
            <dd className="font-medium text-text-primary">
              {beneficio.proximo_periodo ? etiquetaPeriodo(beneficio.proximo_periodo) : '—'}
            </dd>
          </div>
        </dl>
        {beneficio.estado === 'suspendido' && beneficio.motivo_suspension && (
          <p className="mt-3 rounded-lg bg-neutral-bg px-3 py-2 text-sm text-neutral-fg">
            Suspendido: {beneficio.motivo_suspension}
          </p>
        )}
        {beneficio.estado === 'vencido' && (
          <p className="mt-3 rounded-lg bg-neutral-bg px-3 py-2 text-sm text-neutral-fg">
            El beneficio venció el {formatearFecha(beneficio.vigente_hasta)}. Para seguir recibiendo la ayuda, el hogar
            necesita una nueva solicitud y evaluación.
          </p>
        )}
      </Card>

      <ol className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
        {periodos.map((periodo) => {
          const seleccionado = periodo.periodo === periodoSeleccionado
          return (
            <li key={periodo.periodo}>
              <Link
                href={`/solicitudes/${solicitudId}?periodo=${parametroDePeriodo(periodo.periodo)}`}
                aria-current={seleccionado ? 'true' : undefined}
                className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-alt ${seleccionado ? 'bg-brand-50' : ''}`}
              >
                <span className="font-medium capitalize text-text-primary">
                  {etiquetaPeriodo(periodo.periodo)}
                  {periodo.periodo === mesActual && (
                    <span className="ml-2 text-xs font-normal normal-case text-text-muted">(mes en curso)</span>
                  )}
                </span>
                <span className="text-text-muted">
                  {estadoPeriodo(periodo)}
                  {periodo.fecha_hora_entrega && ` · ${new Date(periodo.fecha_hora_entrega).toLocaleDateString('es-CL')}`}
                  {seleccionado && <span className="ml-2 font-semibold text-brand-800">← en la sección Entrega</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-text-muted">
        {beneficio.periodicidad === 'mensual'
          ? 'Cada entrega se retira en su mes; un mes que no se retira se pierde.'
          : 'Cada entrega puede retirarse con atraso hasta antes de que toque la siguiente. Si se retira con atraso, las siguientes se recalculan desde ese mes; si no se retira en su plazo, se pierde.'}
      </p>

      {(accionCambiarModalidad || accionSuspender) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {accionCambiarModalidad && (
            <details className="rounded-xl border border-border bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-brand-800">Cambiar la modalidad de entrega</summary>
              <div className="mt-3">
                <CambiarModalidadForm action={accionCambiarModalidad} modalidadActual={beneficio.modalidad} />
              </div>
            </details>
          )}
          {accionSuspender && (
            <details className="rounded-xl border border-border bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-danger-fg">Suspender el beneficio</summary>
              <div className="mt-3">
                <SuspenderBeneficioForm action={accionSuspender} />
              </div>
            </details>
          )}
        </div>
      )}

      {historial.length > 0 && (
        <ul className="space-y-1 text-sm text-text-muted">
          {historial.map((cambio) => (
            <li key={cambio.id}>
              {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}: {cambio.valor_anterior ?? '—'} →{' '}
              {cambio.valor_nuevo ?? '—'}
              {cambio.motivo && ` · motivo: ${cambio.motivo}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
