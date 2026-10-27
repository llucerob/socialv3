'use client'

import { useActionState } from 'react'
import type { IncidenteFormState } from '@/lib/incidentes/actions'
import { TIPOS_INCIDENTE, TIPO_INCIDENTE_LABELS } from '@/lib/incidentes/types'
import type { Usuario } from '@/lib/usuarios/types'
import { Button } from '@/components/ui/Button'
import { fechaHoyChile } from '@/lib/fechas'

type IncidenteFormAction = (state: IncidenteFormState, formData: FormData) => Promise<IncidenteFormState>

// US-26.01: "campos mínimos: fecha, usuario involucrado, tipo de incidente,
// datos afectados, cantidad estimada de personas afectadas, medidas
// correctivas, responsable de seguimiento, estado" — estado nace en
// 'abierto' por defecto (columna, no input de este formulario).
export function IncidenteForm({ action, usuarios }: { action: IncidenteFormAction; usuarios: Usuario[] }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="fecha_incidente" className="text-sm font-medium text-text-primary">
          Fecha del incidente *
        </label>
        <input
          type="date"
          id="fecha_incidente"
          name="fecha_incidente"
          required
          defaultValue={valores?.fecha_incidente ?? fechaHoyChile()}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="tipo" className="text-sm font-medium text-text-primary">
          Tipo de incidente *
        </label>
        <select id="tipo" name="tipo" required defaultValue={valores?.tipo ?? ''} className={claseCampo}>
          <option value="" disabled>
            Selecciona…
          </option>
          {TIPOS_INCIDENTE.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_INCIDENTE_LABELS[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="usuario_involucrado_id" className="text-sm font-medium text-text-primary">
          Usuario involucrado (opcional)
        </label>
        <select
          id="usuario_involucrado_id"
          name="usuario_involucrado_id"
          defaultValue={valores?.usuario_involucrado_id ?? ''}
          className={claseCampo}
        >
          <option value="">Sin usuario específico</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="datos_afectados" className="text-sm font-medium text-text-primary">
          Datos afectados *
        </label>
        <textarea
          id="datos_afectados"
          name="datos_afectados"
          required
          rows={3}
          defaultValue={valores?.datos_afectados}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cantidad_personas_afectadas" className="text-sm font-medium text-text-primary">
          Cantidad estimada de personas afectadas *
        </label>
        <input
          type="number"
          id="cantidad_personas_afectadas"
          name="cantidad_personas_afectadas"
          min={0}
          step="1"
          required
          defaultValue={valores?.cantidad_personas_afectadas}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="responsable_seguimiento_id" className="text-sm font-medium text-text-primary">
          Responsable de seguimiento *
        </label>
        <select
          id="responsable_seguimiento_id"
          name="responsable_seguimiento_id"
          required
          defaultValue={valores?.responsable_seguimiento_id ?? ''}
          className={claseCampo}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="medidas_correctivas" className="text-sm font-medium text-text-primary">
          Medidas correctivas (opcional)
        </label>
        <textarea
          id="medidas_correctivas"
          name="medidas_correctivas"
          rows={3}
          defaultValue={valores?.medidas_correctivas}
          className={claseCampo}
        />
        <p className="text-xs text-text-muted">
          Puede completarse ahora o más adelante — se exige antes de poder cerrar el incidente.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar incidente'}
      </Button>
    </form>
  )
}
