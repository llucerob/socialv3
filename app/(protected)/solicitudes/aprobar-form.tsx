'use client'

import { useActionState } from 'react'
import { aprobarSolicitud, type DecisionFormState } from '@/lib/decisiones/actions'
import { TOPE_ANUAL_POR_GRUPO_FAMILIAR, TOPE_MENSUAL_DIALISIS } from '@/lib/reembolsos/tramos'
import { Button } from '@/components/ui/Button'
import { MedidorTope } from '@/components/ui/MedidorTope'
import { CamposBeneficio, type DatosBeneficioAprobacion } from './campos-beneficio'

export function AprobarForm({
  solicitudId,
  esReembolso,
  topeReembolsoGeneral,
  topeDialisis,
  remanenteExcepcional,
  beneficio,
}: {
  solicitudId: string
  esReembolso: boolean
  // MR-08: solo para un beneficio periódico.
  beneficio?: DatosBeneficioAprobacion
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
        <div className="space-y-1">
          <MedidorTope
            etiqueta="Tope anual del hogar (compartido: general + excepcionales)"
            total={TOPE_ANUAL_POR_GRUPO_FAMILIAR}
            disponible={topeReembolsoGeneral.remanenteAnual}
          />
          <p className="text-xs text-text-muted">
            {topeReembolsoGeneral.bloqueadoPorTramos || topeReembolsoGeneral.remanenteAnual <= 0 ? (
              <>No se puede aprobar: el hogar ya agotó los reembolsos generales disponibles este año.</>
            ) : (
              <>
                {topeReembolsoGeneral.numeroReembolso}º reembolso del año · tope máximo aprobable para esta
                solicitud: ${topeReembolsoGeneral.topeFinal.toLocaleString('es-CL')}
              </>
            )}
          </p>
        </div>
      )}

      {topeDialisis && (
        <div className="space-y-1">
          <MedidorTope
            etiqueta="Tope mensual de diálisis (persona beneficiaria)"
            total={TOPE_MENSUAL_DIALISIS}
            disponible={topeDialisis.saldoDisponible}
          />
          {topeDialisis.saldoDisponible <= 0 && (
            <p className="text-xs text-text-muted">
              No se puede aprobar por la vía normal: saldo mensual de diálisis agotado.
            </p>
          )}
        </div>
      )}

      {remanenteExcepcional && (
        <div className="space-y-1">
          <MedidorTope
            etiqueta="Tope anual del hogar (compartido: general + excepcionales)"
            total={TOPE_ANUAL_POR_GRUPO_FAMILIAR}
            disponible={remanenteExcepcional.remanenteAnual}
          />
          {remanenteExcepcional.remanenteAnual <= 0 && (
            <p className="text-xs text-text-muted">
              No se puede aprobar: el hogar ya agotó el remanente anual compartido de reembolsos.
            </p>
          )}
        </div>
      )}

      {esReembolso ? (
        <div className="space-y-1">
          <label htmlFor="monto_aprobado" className="text-sm font-medium text-text-primary">
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
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="cantidad_aprobada" className="text-sm font-medium text-text-primary">
            Cantidad o detalle aprobado *
          </label>
          <input
            id="cantidad_aprobada"
            name="cantidad_aprobada"
            required
            placeholder="ej. 2 cajas de mercadería"
            defaultValue={valores?.cantidad_aprobada}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
          />
        </div>
      )}

      {beneficio && (
        <CamposBeneficio
          beneficio={beneficio}
          valores={valores}
          sufijoId="aprobar"
          claseCampo="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
      )}

      <div className="space-y-1">
        <label htmlFor="comentario" className="text-sm font-medium text-text-primary">
          Comentario (opcional)
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={2}
          defaultValue={valores?.comentario}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Aprobar solicitud'}
      </Button>
    </form>
  )
}
