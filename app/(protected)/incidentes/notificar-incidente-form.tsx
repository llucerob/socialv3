'use client'

import { useActionState } from 'react'
import { registrarNotificacionIncidente, type NotificarIncidenteState } from '@/lib/incidentes/actions'
import { DESTINATARIO_NOTIFICACION_LABELS } from '@/lib/incidentes/types'
import type { Usuario } from '@/lib/usuarios/types'
import { Button } from '@/components/ui/Button'

// US-26.04: "campo de fecha de notificación · campo de destinatario
// (Agencia / titulares / ambos) · campo de responsable · no automatiza el
// envío de la notificación, solo deja registro manual del hecho".
export function NotificarIncidenteForm({ incidenteId, usuarios }: { incidenteId: string; usuarios: Usuario[] }) {
  const accion = registrarNotificacionIncidente.bind(null, incidenteId)
  const [state, formAction, pending] = useActionState<NotificarIncidenteState, FormData>(accion, undefined)
  const valores = state?.valores
  const claseCampo = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary'

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <div className="space-y-1">
        <label htmlFor="notificacion_fecha" className="text-sm font-medium text-text-primary">
          Fecha de notificación *
        </label>
        <input
          type="date"
          id="notificacion_fecha"
          name="notificacion_fecha"
          required
          defaultValue={valores?.notificacion_fecha}
          className={claseCampo}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notificacion_destinatario" className="text-sm font-medium text-text-primary">
          Destinatario *
        </label>
        <select
          id="notificacion_destinatario"
          name="notificacion_destinatario"
          required
          defaultValue={valores?.notificacion_destinatario ?? ''}
          className={claseCampo}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {Object.entries(DESTINATARIO_NOTIFICACION_LABELS).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="notificacion_responsable_id" className="text-sm font-medium text-text-primary">
          Responsable de la notificación *
        </label>
        <select
          id="notificacion_responsable_id"
          name="notificacion_responsable_id"
          required
          defaultValue={valores?.notificacion_responsable_id ?? ''}
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

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" variante="secondary" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar notificación'}
      </Button>
    </form>
  )
}
