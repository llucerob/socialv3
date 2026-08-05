import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerEntrega } from '@/lib/entregas/dal'
import { registrarEntregaRealizada, registrarEntregaFallida } from '@/lib/entregas/actions'
import { obtenerSolicitud } from '@/lib/solicitudes/dal'
import { obtenerTipoAyuda } from '@/lib/ayudas/dal'
import { listarMotivosEntregaFallidaActivos } from '@/lib/motivos-entrega/dal'
import { ESTADO_ENTREGA_LABELS } from '@/lib/entregas/types'
import { enlaceMapa } from '@/lib/rutas/mapas'
import { EntregaRealizadaForm } from '../entrega-realizada-form'
import { EntregaFallidaForm } from '../entrega-fallida-form'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// US-12.04/US-12.05/US-12.07: detalle de una entrega asignada, con las
// acciones para registrar el resultado. La RLS de entregas ya impide que un
// funcionario de terreno vea una entrega que no es suya (obtenerEntrega
// devuelve null en ese caso, igual que si no existiera).
export default async function MiEntregaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole([...ROLES_TERRENO])
  const { id } = await params
  const entrega = await obtenerEntrega(id)

  if (!entrega) {
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
        <h1 className="text-2xl font-semibold">{entrega.tipo_ayuda_nombre}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {entrega.grupo_familiar_direccion}
          {entrega.grupo_familiar_sector && ` · ${entrega.grupo_familiar_sector}`}
        </p>
        {entrega.persona_nombre && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{entrega.persona_nombre}</p>
        )}
        <p className="mt-2 text-sm">
          Estado: <span className="font-medium">{ESTADO_ENTREGA_LABELS[entrega.estado]}</span>
        </p>
        <a href={enlaceMapa(entrega)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm underline">
          Abrir en mapas
        </a>
      </div>

      {entrega.estado === 'pendiente' && (
        <div className="space-y-8">
          <EntregaRealizadaForm action={registrarRealizadaConId} requiereEvidencia={requiereEvidencia} />
          <div className="border-t border-black/10 pt-6 dark:border-white/10">
            <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              ¿No se pudo entregar?
            </h2>
            <EntregaFallidaForm action={registrarFallidaConId} motivos={motivosActivos} />
          </div>
        </div>
      )}

      {entrega.estado === 'fallida' && (
        <p className="text-sm text-amber-700 dark:text-amber-500">
          Entrega marcada como fallida
          {entrega.motivo_fallo_nombre && `: ${entrega.motivo_fallo_nombre}`}. Bodega debe
          reprogramarla antes de un nuevo intento.
        </p>
      )}

      {entrega.estado === 'realizada' && (
        <div className="rounded border border-black/10 p-4 text-sm dark:border-white/10">
          <p>
            Recibió: <span className="font-medium">{entrega.receptor_nombre}</span>
            {entrega.receptor_relacion && ` (${entrega.receptor_relacion})`}
          </p>
          {entrega.fecha_hora_entrega && (
            <p className="text-zinc-500 dark:text-zinc-400">
              {new Date(entrega.fecha_hora_entrega).toLocaleString('es-CL')}
            </p>
          )}
          {entrega.observacion_entrega && (
            <p className="mt-1 whitespace-pre-wrap">{entrega.observacion_entrega}</p>
          )}
        </div>
      )}
    </div>
  )
}
