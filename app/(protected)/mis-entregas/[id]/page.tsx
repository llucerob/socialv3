import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { tieneRol } from '@/lib/auth/roles'
import { obtenerEntrega } from '@/lib/entregas/dal'
import { registrarEntregaRealizada, registrarEntregaFallida } from '@/lib/entregas/actions'
import { obtenerSolicitud } from '@/lib/solicitudes/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { listarMotivosEntregaFallidaActivos } from '@/lib/motivos-entrega/dal'
import { enlaceMapa } from '@/lib/rutas/mapas'
import { EntregaRealizadaForm } from '../entrega-realizada-form'
import { EntregaFallidaForm } from '../entrega-fallida-form'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { ButtonExterno } from '@/components/ui/Button'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// US-12.04/US-12.05/US-12.07: detalle de una entrega asignada, con las
// acciones para registrar el resultado. Un funcionario de terreno solo abre
// las entregas asignadas a él: la RLS lo garantiza con un solo rol, y el
// chequeo explícito de abajo lo mantiene cuando además tiene un rol que lee
// todas las entregas (por ejemplo bodega). El administrador abre cualquiera.
export default async function MiEntregaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole([...ROLES_TERRENO])
  const { id } = await params
  const entrega = await obtenerEntrega(id)

  if (!entrega || (!tieneRol(profile, ['administrador']) && entrega.responsable_id !== profile.id)) {
    notFound()
  }

  // US-12.04: "es obligatorio adjuntar evidencia SI LA AYUDA LO REQUIERE"
  // (tipos_ayuda.requiere_evidencia, US-06.02) — se resuelve vía la
  // solicitud asociada para reflejarlo en el formulario.
  const solicitud = await obtenerSolicitud(entrega.solicitud_id)
  const tipoAyuda = solicitud ? await obtenerTipoAyuda(solicitud.tipo_ayuda_id) : null
  const requiereEvidencia = Boolean(tipoAyuda?.requiere_evidencia)
  const motivosActivos = entrega.estado === 'pendiente' ? await listarMotivosEntregaFallidaActivos() : []

  const registrarRealizadaConId = registrarEntregaRealizada.bind(null, id)
  const registrarFallidaConId = registrarEntregaFallida.bind(null, id)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{entrega.tipo_ayuda_nombre}</h1>
        <p className="text-sm text-text-muted">
          {entrega.grupo_familiar_direccion}
          {entrega.grupo_familiar_sector && ` · ${entrega.grupo_familiar_sector}`}
        </p>
        {entrega.persona_nombre && <p className="text-sm text-text-muted">{entrega.persona_nombre}</p>}
        <p className="mt-2 flex items-center gap-2">
          <EstadoBadge estado={entrega.estado} />
        </p>
        <ButtonExterno href={enlaceMapa(entrega)} className="mt-3">
          Abrir en mapas
        </ButtonExterno>
      </div>

      {entrega.estado === 'pendiente' && (
        <div className="space-y-8">
          <EntregaRealizadaForm action={registrarRealizadaConId} requiereEvidencia={requiereEvidencia} />
          <div className="border-t border-border pt-6">
            <h2 className="mb-3 text-sm font-medium text-text-muted">¿No se pudo entregar?</h2>
            <EntregaFallidaForm action={registrarFallidaConId} motivos={motivosActivos} />
          </div>
        </div>
      )}

      {entrega.estado === 'fallida' && (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-fg">
          Entrega marcada como fallida
          {entrega.motivo_fallo_nombre && `: ${entrega.motivo_fallo_nombre}`}. Bodega debe
          reprogramarla antes de un nuevo intento.
        </p>
      )}

      {entrega.estado === 'realizada' && (
        <Card>
          <p className="text-sm text-text-primary">
            Recibió: <span className="font-medium">{entrega.receptor_nombre}</span>
            {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
          </p>
          {entrega.fecha_hora_entrega && (
            <p className="text-sm text-text-muted">
              {new Date(entrega.fecha_hora_entrega).toLocaleString('es-CL')}
            </p>
          )}
          {entrega.observacion_entrega && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{entrega.observacion_entrega}</p>
          )}
        </Card>
      )}
    </div>
  )
}
