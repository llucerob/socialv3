'use client'

import { useActionState } from 'react'
import type { InformeSocialFormState } from '@/lib/informes-sociales/actions'
import { NIVELES_CONFIDENCIALIDAD, NIVEL_CONFIDENCIALIDAD_LABELS } from '@/lib/informes-sociales/types'
import type { Persona } from '@/lib/personas/types'
import type { SolicitudConRelaciones } from '@/lib/solicitudes/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type InformeSocialFormAction = (
  state: InformeSocialFormState,
  formData: FormData
) => Promise<InformeSocialFormState>

const INPUT_CLASSNAME = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-text-primary'

export function InformeSocialForm({
  action,
  integrantes,
  solicitudes,
  solicitudPreseleccionada,
}: {
  action: InformeSocialFormAction
  integrantes: Persona[]
  solicitudes: SolicitudConRelaciones[]
  // US-05.05/US-23.03: cuando se llega desde una solicitud sin informe
  // asociado ("registrar informe social para esta solicitud"), la
  // preselecciona y ya no se puede cambiar — evita crear un informe para
  // esta excepción que termine vinculado a otra solicitud por error.
  solicitudPreseleccionada?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const valores = state?.valores

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <Card header={<h2 className="font-medium text-text-primary">Identificación</h2>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="fecha_informe" className="text-sm font-medium text-text-primary">
              Fecha del informe *
            </label>
            <input
              id="fecha_informe"
              name="fecha_informe"
              type="date"
              required
              defaultValue={valores?.fecha_informe ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="nivel_confidencialidad" className="text-sm font-medium text-text-primary">
              Nivel de confidencialidad *
            </label>
            <select
              id="nivel_confidencialidad"
              name="nivel_confidencialidad"
              required
              defaultValue={valores?.nivel_confidencialidad ?? ''}
              className={INPUT_CLASSNAME}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {NIVELES_CONFIDENCIALIDAD.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {NIVEL_CONFIDENCIALIDAD_LABELS[nivel]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="persona_id" className="text-sm font-medium text-text-primary">
              Beneficiario asociado
            </label>
            <select
              id="persona_id"
              name="persona_id"
              defaultValue={valores?.persona_id ?? ''}
              className={INPUT_CLASSNAME}
            >
              <option value="">Ninguno (informe del hogar en general)</option>
              {integrantes.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.nombres} {persona.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="solicitud_id" className="text-sm font-medium text-text-primary">
              Solicitud asociada
            </label>
            {solicitudPreseleccionada ? (
              <>
                <input type="hidden" name="solicitud_id" value={solicitudPreseleccionada} />
                <p className={`${INPUT_CLASSNAME} text-text-muted`}>
                  {solicitudes.find((s) => s.id === solicitudPreseleccionada)?.tipo_ayuda_nombre ?? 'Solicitud seleccionada'}
                </p>
              </>
            ) : (
              <select
                id="solicitud_id"
                name="solicitud_id"
                defaultValue={valores?.solicitud_id ?? ''}
                className={INPUT_CLASSNAME}
              >
                <option value="">Ninguna (informe general del hogar)</option>
                {solicitudes.map((solicitud) => (
                  <option key={solicitud.id} value={solicitud.id}>
                    {solicitud.tipo_ayuda_nombre} · {solicitud.fecha_solicitud}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      <Card header={<h2 className="font-medium text-text-primary">Motivo y evaluación</h2>}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="motivo" className="text-sm font-medium text-text-primary">
              Motivo del informe *
            </label>
            <textarea id="motivo" name="motivo" required rows={2} defaultValue={valores?.motivo ?? ''} className={INPUT_CLASSNAME} />
          </div>

          <div className="space-y-1">
            <label htmlFor="evaluacion_social" className="text-sm font-medium text-text-primary">
              Evaluación social *
            </label>
            <textarea
              id="evaluacion_social"
              name="evaluacion_social"
              required
              rows={4}
              defaultValue={valores?.evaluacion_social ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="antecedentes_familiares" className="text-sm font-medium text-text-primary">
              Antecedentes familiares *
            </label>
            <textarea
              id="antecedentes_familiares"
              name="antecedentes_familiares"
              required
              rows={3}
              defaultValue={valores?.antecedentes_familiares ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>
        </div>
      </Card>

      <Card header={<h2 className="font-medium text-text-primary">Situación del hogar</h2>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="situacion_habitacional" className="text-sm font-medium text-text-primary">
                Situación habitacional *
              </label>
              <textarea
                id="situacion_habitacional"
                name="situacion_habitacional"
                required
                rows={3}
                defaultValue={valores?.situacion_habitacional ?? ''}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="situacion_economica" className="text-sm font-medium text-text-primary">
                Situación económica *
              </label>
              <textarea
                id="situacion_economica"
                name="situacion_economica"
                required
                rows={3}
                defaultValue={valores?.situacion_economica ?? ''}
                className={INPUT_CLASSNAME}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="situacion_salud" className="text-sm font-medium text-text-primary">
              Situación de salud (si aplica)
            </label>
            <textarea
              id="situacion_salud"
              name="situacion_salud"
              rows={2}
              defaultValue={valores?.situacion_salud ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>
        </div>
      </Card>

      <Card header={<h2 className="font-medium text-text-primary">Recomendación</h2>}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="recomendacion_profesional" className="text-sm font-medium text-text-primary">
              Recomendación profesional *
            </label>
            <textarea
              id="recomendacion_profesional"
              name="recomendacion_profesional"
              required
              rows={3}
              defaultValue={valores?.recomendacion_profesional ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ayuda_sugerida" className="text-sm font-medium text-text-primary">
              Ayuda sugerida
            </label>
            <input
              id="ayuda_sugerida"
              name="ayuda_sugerida"
              placeholder="Ej. reembolso médico general, autorización de excepción RSH…"
              defaultValue={valores?.ayuda_sugerida ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="observaciones" className="text-sm font-medium text-text-primary">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={2}
              defaultValue={valores?.observaciones ?? ''}
              className={INPUT_CLASSNAME}
            />
          </div>
        </div>
      </Card>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Registrar informe social'}
      </Button>
    </form>
  )
}
