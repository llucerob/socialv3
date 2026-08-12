import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerIncidente, obtenerHistorialIncidente } from '@/lib/incidentes/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import {
  TIPO_INCIDENTE_LABELS,
  DESTINATARIO_NOTIFICACION_LABELS,
} from '@/lib/incidentes/types'
import { CerrarIncidenteForm } from '../cerrar-incidente-form'
import { NotificarIncidenteForm } from '../notificar-incidente-form'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

const ROLES_VER_INCIDENTES = ['administrador', 'auditor_consulta'] as const
const ROLES_GESTION_INCIDENTES = ['administrador'] as const

export default async function DetalleIncidentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireRole([...ROLES_VER_INCIDENTES])
  const incidente = await obtenerIncidente(id)

  if (!incidente) {
    notFound()
  }

  const puedeGestionar = (ROLES_GESTION_INCIDENTES as readonly string[]).includes(profile.rol)
  const historial = await obtenerHistorialIncidente(id)
  const usuarios = puedeGestionar && !incidente.notificacion_fecha ? await listarUsuarios() : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{TIPO_INCIDENTE_LABELS[incidente.tipo]}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
          <span>{incidente.fecha_incidente}</span>
          <EstadoBadge estado={incidente.estado} />
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-text-muted">Usuario involucrado</h2>
          <p className="text-text-primary">{incidente.usuario_involucrado_nombre ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-text-muted">Responsable de seguimiento</h2>
          <p className="text-text-primary">{incidente.responsable_seguimiento_nombre ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-text-muted">
            Cantidad estimada de personas afectadas
          </h2>
          <p className="text-text-primary">{incidente.cantidad_personas_afectadas}</p>
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-text-muted">Datos afectados</h2>
          <p className="whitespace-pre-wrap text-text-primary">{incidente.datos_afectados}</p>
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-text-muted">Medidas correctivas</h2>
          <p className="whitespace-pre-wrap text-text-primary">
            {incidente.medidas_correctivas ?? 'Sin medidas correctivas registradas todavía.'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-text-primary">Notificación</h2>
        {incidente.notificacion_fecha ? (
          <Card>
            <p className="text-sm text-text-primary">
              Notificado el <span className="font-medium">{incidente.notificacion_fecha}</span> a{' '}
              <span className="font-medium">
                {incidente.notificacion_destinatario
                  ? DESTINATARIO_NOTIFICACION_LABELS[incidente.notificacion_destinatario]
                  : '—'}
              </span>
            </p>
            <p className="text-sm text-text-muted">
              Responsable: {incidente.notificacion_responsable_nombre ?? 'usuario desconocido'}
            </p>
          </Card>
        ) : puedeGestionar ? (
          <NotificarIncidenteForm incidenteId={incidente.id} usuarios={usuarios} />
        ) : (
          <p className="text-sm text-text-muted">Sin notificación registrada todavía.</p>
        )}
      </section>

      {puedeGestionar && incidente.estado === 'abierto' && (
        <section className="space-y-3">
          <h2 className="font-medium text-text-primary">Cerrar incidente</h2>
          <CerrarIncidenteForm incidenteId={incidente.id} medidasCorrectivas={incidente.medidas_correctivas} />
        </section>
      )}

      <section>
        <h2 className="font-medium text-text-primary">Historial</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-text-muted">
                {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
