'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { listarEntregasDeSector } from '@/lib/entregas/dal'
import { ordenarParaRuta } from './geo'

// US-13.01/US-13.02: "como logística" agrupa/asigna y ajusta manualmente el
// orden — mismo rol que EPIC 11/12.
const ROLES_LOGISTICA = ['administrador', 'bodega_logistica'] as const

// US-13.01: "se puede asignar un responsable al grupo" — asignación masiva
// sobre el resultado del filtro por sector + selección múltiple. Solo
// afecta entregas que sigan 'pendiente' (mismo criterio que el asignar
// individual de EPIC 12): si alguna seleccionada cambió de estado entre que
// se cargó la página y se envió el formulario, esa fila queda excluida del
// update en vez de fallar todo el lote.
export type AsignacionLoteFormState = { error?: string } | undefined

export async function asignarResponsableLote(
  _prevState: AsignacionLoteFormState,
  formData: FormData
): Promise<AsignacionLoteFormState> {
  await requireRole([...ROLES_LOGISTICA])

  const entregaIds = formData.getAll('entrega_id').map((valor) => valor.toString())
  const responsableId = formData.get('responsable_id')?.toString().trim() ?? ''
  const fechaProgramada = formData.get('fecha_programada')?.toString().trim() ?? ''

  if (entregaIds.length === 0) {
    return { error: 'Selecciona al menos una entrega.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('entregas')
    .update({
      responsable_id: responsableId || null,
      ...(fechaProgramada ? { fecha_programada: fechaProgramada } : {}),
    })
    .in('id', entregaIds)
    .eq('estado', 'pendiente')

  if (error) {
    return { error: 'No se pudo asignar el responsable al grupo seleccionado.' }
  }

  revalidatePath('/entregas')
  revalidatePath('/rutas')
}

// US-13.02: ajuste manual del orden — intercambia la posición de la entrega
// con su vecino inmediato (arriba o abajo) dentro de la lista ya ordenada
// del sector. "El ajuste manual queda registrado (quién y cuándo)" lo cubre
// automáticamente entregas_historial, que ya audita orden_ruta (ver
// add_orden_ruta_entregas.sql) — no se necesita código adicional para eso.
// Sin useActionState (mismo patrón que cambiarEstadoTipoAyuda en
// lib/ayudas/actions.ts): es un botón simple, sin validación de formulario
// que mostrar al usuario.
export async function moverEntregaEnRuta(
  entregaId: string,
  direccion: 'arriba' | 'abajo',
  formData: FormData
): Promise<void> {
  await requireRole([...ROLES_LOGISTICA])

  const sector = formData.get('sector')?.toString().trim() ?? ''
  if (!sector) {
    throw new Error('Sector no especificado.')
  }

  const entregasSector = ordenarParaRuta(
    (await listarEntregasDeSector(sector)).filter((entrega) => entrega.estado === 'pendiente')
  )
  const index = entregasSector.findIndex((entrega) => entrega.id === entregaId)
  if (index === -1) {
    throw new Error('Entrega no encontrada en este sector.')
  }

  const vecinoIndex = direccion === 'arriba' ? index - 1 : index + 1
  if (vecinoIndex < 0 || vecinoIndex >= entregasSector.length) {
    // Ya está en el extremo de la lista — no-op silencioso, no es un error.
    return
  }

  const actual = entregasSector[index]
  const vecino = entregasSector[vecinoIndex]

  // Si el sector nunca pasó por un cálculo de ruta, orden_ruta puede venir
  // null para ambas filas — se usa la posición actual en la lista ya
  // ordenada (por fecha_programada/created_at) como base del intercambio,
  // para que el primer ajuste manual arranque con un valor numérico real.
  const ordenActual = actual.orden_ruta ?? index + 1
  const ordenVecino = vecino.orden_ruta ?? vecinoIndex + 1

  const supabase = await createClient()
  const [resultadoActual, resultadoVecino] = await Promise.all([
    supabase.from('entregas').update({ orden_ruta: ordenVecino }).eq('id', actual.id),
    supabase.from('entregas').update({ orden_ruta: ordenActual }).eq('id', vecino.id),
  ])

  if (resultadoActual.error || resultadoVecino.error) {
    throw new Error('No se pudo reordenar la ruta.')
  }

  revalidatePath('/entregas')
  revalidatePath('/rutas')
}

// US-13.04 (recomendación técnica): punto de origen configurable — solo
// administrador lo ajusta (configuración de sistema, no gestión de casos;
// mismo criterio que EPIC 06 con tipos_ayuda).
export type ConfiguracionRutasFormState = { error?: string } | undefined

export async function actualizarConfiguracionRutas(
  _prevState: ConfiguracionRutasFormState,
  formData: FormData
): Promise<ConfiguracionRutasFormState> {
  await requireRole(['administrador'])

  const nombre = formData.get('origen_nombre')?.toString().trim() ?? ''
  const latitudRaw = formData.get('origen_latitud')?.toString().trim() ?? ''
  const longitudRaw = formData.get('origen_longitud')?.toString().trim() ?? ''

  if (!nombre) {
    return { error: 'El nombre del punto de origen es obligatorio.' }
  }

  const latitud = Number(latitudRaw)
  const longitud = Number(longitudRaw)

  if (!latitudRaw || Number.isNaN(latitud) || latitud < -90 || latitud > 90) {
    return { error: 'La latitud debe ser un número entre -90 y 90.' }
  }
  if (!longitudRaw || Number.isNaN(longitud) || longitud < -180 || longitud > 180) {
    return { error: 'La longitud debe ser un número entre -180 y 180.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('configuracion_rutas')
    .update({ origen_nombre: nombre, origen_latitud: latitud, origen_longitud: longitud })
    .eq('id', 1)

  if (error) {
    return { error: 'No se pudo guardar la configuración.' }
  }

  revalidatePath('/rutas/configuracion')
}
