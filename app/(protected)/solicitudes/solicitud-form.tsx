'use client'

import { useActionState, useState } from 'react'
import type { SolicitudFormState } from '@/lib/solicitudes/actions'
import type { Solicitud } from '@/lib/solicitudes/types'
import type { TipoAyuda } from '@/lib/ayudas/types'
import { ESTADO_PERSONA_LABELS, type Persona } from '@/lib/personas/types'
import { NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO } from '@/lib/reembolsos/tramos'
import { Button } from '@/components/ui/Button'

type SolicitudFormAction = (
  state: SolicitudFormState,
  formData: FormData
) => Promise<SolicitudFormState>

export function SolicitudForm({
  action,
  tiposAyuda,
  personasActivas,
  defaultValues,
  submitLabel,
  mostrarGuardarBorrador = false,
}: {
  action: SolicitudFormAction
  tiposAyuda: TipoAyuda[]
  personasActivas: Persona[]
  defaultValues?: Partial<Solicitud>
  submitLabel: string
  mostrarGuardarBorrador?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const [tipoAyudaId, setTipoAyudaId] = useState(
    valores?.tipo_ayuda_id ?? defaultValues?.tipo_ayuda_id ?? ''
  )

  const tipoAyudaSeleccionado = tiposAyuda.find((tipo) => tipo.id === tipoAyudaId)
  const requierePersona = tipoAyudaSeleccionado?.requiere_persona_beneficiaria ?? false
  const esReembolso = tipoAyudaSeleccionado?.tipo === 'reembolso'
  // US-25.04: "persona solicitante" no tiene columna propia — reutiliza el
  // campo genérico "motivo" (igual que "motivo de la cirugía" reutiliza el
  // mismo campo para US-25.01), solo relabelado en la UI para este tipo.
  const esFallecimiento = tipoAyudaSeleccionado?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="tipo_ayuda_id" className="text-sm font-medium text-text-primary">
          Tipo de ayuda *
        </label>
        <select
          id="tipo_ayuda_id"
          name="tipo_ayuda_id"
          required
          defaultValue={valores?.tipo_ayuda_id ?? defaultValues?.tipo_ayuda_id ?? ''}
          onChange={(e) => setTipoAyudaId(e.target.value)}
          className={claseCampo}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {tiposAyuda.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
              {tipo.estado !== 'activo' ? ' (inactivo)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="persona_id" className="text-sm font-medium text-text-primary">
          Persona beneficiaria {requierePersona ? '*' : '(opcional)'}
        </label>
        <select
          id="persona_id"
          name="persona_id"
          required={requierePersona}
          defaultValue={valores?.persona_id ?? defaultValues?.persona_id ?? ''}
          className={claseCampo}
        >
          <option value="">Sin persona específica</option>
          {personasActivas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombres} {persona.apellidos}
              {persona.estado !== 'activo' ? ` (${ESTADO_PERSONA_LABELS[persona.estado]})` : ''}
            </option>
          ))}
        </select>
        {requierePersona && (
          <p className="text-xs text-warning-fg">
            Este tipo de ayuda requiere seleccionar una persona beneficiaria.
          </p>
        )}
      </div>

      {esReembolso && (
        <div className="space-y-1">
          <label htmlFor="monto_solicitado" className="text-sm font-medium text-text-primary">
            Monto solicitado *
          </label>
          <input
            id="monto_solicitado"
            name="monto_solicitado"
            type="number"
            min={0}
            step="1"
            required={esReembolso}
            defaultValue={valores?.monto_solicitado ?? defaultValues?.monto_solicitado ?? ''}
            className={claseCampo}
          />
          <p className="text-xs text-warning-fg">
            Este tipo de ayuda requiere ingresar el monto solicitado (ej. monto de la boleta).
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="fecha_solicitud" className="text-sm font-medium text-text-primary">
          Fecha *
        </label>
        <input
          id="fecha_solicitud"
          name="fecha_solicitud"
          type="date"
          required
          defaultValue={
            valores?.fecha_solicitud ??
            defaultValues?.fecha_solicitud ??
            new Date().toISOString().slice(0, 10)
          }
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="motivo" className="text-sm font-medium text-text-primary">
          {esFallecimiento ? 'Persona solicitante *' : 'Motivo *'}
        </label>
        <textarea
          id="motivo"
          name="motivo"
          required
          rows={3}
          placeholder={esFallecimiento ? 'Nombre y relación con el integrante fallecido' : undefined}
          defaultValue={valores?.motivo ?? defaultValues?.motivo}
          className={claseCampo}
        />
        {esFallecimiento && (
          <p className="text-xs text-warning-fg">
            Indica quién solicita este reembolso en representación del hogar.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="observaciones" className="text-sm font-medium text-text-primary">
          Observaciones
        </label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          defaultValue={valores?.observaciones ?? defaultValues?.observaciones ?? ''}
          className={claseCampo}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        {mostrarGuardarBorrador && (
          <Button type="submit" name="accion" value="borrador" variante="secondary" disabled={pending}>
            Guardar como borrador
          </Button>
        )}
        <Button type="submit" name="accion" value="ingresar" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
