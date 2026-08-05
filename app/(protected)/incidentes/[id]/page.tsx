import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerIncidente, obtenerHistorialIncidente } from '@/lib/incidentes/dal'
import { listarUsuarios } from '@/lib/usuarios/dal'
import {
  TIPO_INCIDENTE_LABELS,
  ESTADO_INCIDENTE_LABELS,
  DESTINATARIO_NOTIFICACION_LABELS,
} from '@/lib/incidentes/types'
import { CerrarIncidenteForm } from '../cerrar-incidente-form'
import { NotificarIncidenteForm } from '../notificar-incidente-form'

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
        <h1 className="text-2xl font-semibold">{TIPO_INCIDENTE_LABELS[incidente.tipo]}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {incidente.fecha_incidente} · estado {ESTADO_INCIDENTE_LABELS[incidente.estado]}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Usuario involucrado</h2>
          <p>{incidente.usuario_involucrado_nombre ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Responsable de seguimiento</h2>
          <p>{incidente.responsable_seguimiento_nombre ?? '—'}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Cantidad estimada de personas afectadas
          </h2>
          <p>{incidente.cantidad_personas_afectadas}</p>
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Datos afectados</h2>
          <p className="whitespace-pre-wrap">{incidente.datos_afectados}</p>
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Medidas correctivas</h2>
          <p className="whitespace-pre-wrap">{incidente.medidas_correctivas ?? 'Sin medidas correctivas registradas todavía.'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Notificación</h2>
        {incidente.notificacion_fecha ? (
          <div className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
            <p>
              Notificado el <span className="font-medium">{incidente.notificacion_fecha}</span> a{' '}
              <span className="font-medium">
                {incidente.notificacion_destinatario
                  ? DESTINATARIO_NOTIFICACION_LABELS[incidente.notificacion_destinatario]
                  : '—'}
              </span>
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Responsable: {incidente.notificacion_responsable_nombre ?? 'usuario desconocido'}
            </p>
          </div>
        ) : puedeGestionar ? (
          <NotificarIncidenteForm incidenteId={incidente.id} usuarios={usuarios} />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin notificación registrada todavía.</p>
        )}
      </section>

      {puedeGestionar && incidente.estado === 'abierto' && (
        <section className="space-y-3">
          <h2 className="font-medium">Cerrar incidente</h2>
          <CerrarIncidenteForm incidenteId={incidente.id} medidasCorrectivas={incidente.medidas_correctivas} />
        </section>
      )}

      <section>
        <h2 className="font-medium">Historial</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sin cambios registrados todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-zinc-600 dark:text-zinc-400">
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
