'use client'

import { useActionState } from 'react'
import { aprobarSolicitud, type DecisionFormState } from '@/lib/decisiones/actions'

export function AprobarForm({
  solicitudId,
  esReembolso,
  topeReembolsoGeneral,
  topeDialisis,
  remanenteExcepcional,
}: {
  solicitudId: string
  esReembolso: boolean
  // US-14.05/14.06: informativo — el tope real se valida igual en el
  // servidor (aprobarSolicitud), esto solo evita un viaje de ida y vuelta
  // innecesario cuando el monto ya se ve fuera de rango.
  topeReembolsoGeneral?: {
    numeroReembolso: number
    topeFinal: number
    bloqueadoPorTramos: boolean
    remanenteAnual: number
  }
  // US-15.03/15.04: idem, para el tope mensual de diálisis (por persona).
  topeDialisis?: {
    acumuladoMensual: number
    saldoDisponible: number
  }
  // US-25.02/25.03/25.05: idem, para el remanente anual compartido de un
  // reembolso excepcional (cirugía o fallecimiento) — sin tramo propio, a
  // diferencia del reembolso general.
  remanenteExcepcional?: {
    remanenteAnual: number
  }
}) {
  const accion = aprobarSolicitud.bind(null, solicitudId)
  const [state, formAction, pending] = useActionState<DecisionFormState, FormData>(
    accion,
    undefined
  )
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-md space-y-3">
      {topeReembolsoGeneral && (
        <p className="rounded border border-black/10 bg-black/5 px-3 py-2 text-xs text-zinc-600 dark:border-white/20 dark:bg-white/10 dark:text-zinc-400">
          {topeReembolsoGeneral.bloqueadoPorTramos || topeReembolsoGeneral.remanenteAnual <= 0 ? (
            <>No se puede aprobar: el hogar ya agotó los reembolsos generales disponibles este año.</>
          ) : (
            <>
              {topeReembolsoGeneral.numeroReembolso}º reembolso del año · tope máximo aprobable: $
              {topeReembolsoGeneral.topeFinal.toLocaleString('es-CL')} (remanente anual del hogar: $
              {topeReembolsoGeneral.remanenteAnual.toLocaleString('es-CL')})
            </>
          )}
        </p>
      )}

      {topeDialisis && (
        <p className="rounded border border-black/10 bg-black/5 px-3 py-2 text-xs text-zinc-600 dark:border-white/20 dark:bg-white/10 dark:text-zinc-400">
          {topeDialisis.saldoDisponible <= 0 ? (
            <>No se puede aprobar por la vía normal: saldo mensual de diálisis agotado.</>
          ) : (
            <>
              Acumulado mensual de diálisis: ${topeDialisis.acumuladoMensual.toLocaleString('es-CL')} · saldo
              disponible: ${topeDialisis.saldoDisponible.toLocaleString('es-CL')}
            </>
          )}
        </p>
      )}

      {remanenteExcepcional && (
        <p className="rounded border border-black/10 bg-black/5 px-3 py-2 text-xs text-zinc-600 dark:border-white/20 dark:bg-white/10 dark:text-zinc-400">
          {remanenteExcepcional.remanenteAnual <= 0 ? (
            <>No se puede aprobar: el hogar ya agotó el remanente anual compartido de reembolsos.</>
          ) : (
            <>Remanente anual compartido del hogar: ${remanenteExcepcional.remanenteAnual.toLocaleString('es-CL')}</>
          )}
        </p>
      )}

      {esReembolso ? (
        <div className="space-y-1">
          <label htmlFor="monto_aprobado" className="text-sm font-medium">
            Monto aprobado *
          </label>
          <input
            id="monto_aprobado"
            name="monto_aprobado"
            type="number"
            min={0}
            max={
              topeReembolsoGeneral?.topeFinal ??
              topeDialisis?.saldoDisponible ??
              remanenteExcepcional?.remanenteAnual
            }
            step="1"
            required
            defaultValue={valores?.monto_aprobado}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="cantidad_aprobada" className="text-sm font-medium">
            Cantidad o detalle aprobado *
          </label>
          <input
            id="cantidad_aprobada"
            name="cantidad_aprobada"
            required
            placeholder="ej. 2 cajas de mercadería"
            defaultValue={valores?.cantidad_aprobada}
            className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="comentario" className="text-sm font-medium">
          Comentario (opcional)
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={2}
          defaultValue={valores?.comentario}
          className="w-full rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Aprobar solicitud'}
      </button>
    </form>
  )
}
