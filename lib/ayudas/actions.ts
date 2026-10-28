'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

// US-06.02: "modificación solo por administrador" — a diferencia de
// grupos_familiares/personas, evaluador_social NO puede escribir aquí.
const ROLES_GESTION_AYUDAS = ['administrador'] as const

type ValoresTipoAyudaFormulario = {
  nombre: string
  descripcion: string | null
  tipo: string
  requiere_aprobacion: boolean
  requiere_entrega: boolean
  requiere_evidencia: boolean
  requiere_persona_beneficiaria: boolean
  requiere_documentos: boolean
  permite_entrega_local: boolean
  tiene_tope_monetario: boolean
  tope_monetario: number | null
  periodicidad: string | null
}

export type TipoAyudaFormState =
  | { error?: string; valores: ValoresTipoAyudaFormulario }
  | undefined

function leerCampos(formData: FormData): ValoresTipoAyudaFormulario {
  const tieneTope = formData.get('tiene_tope_monetario') === 'on'
  const topeRaw = formData.get('tope_monetario')?.toString().trim()
  const tope = tieneTope ? (topeRaw ? Number(topeRaw) : Number.NaN) : null

  return {
    nombre: formData.get('nombre')?.toString().trim() ?? '',
    descripcion: formData.get('descripcion')?.toString().trim() || null,
    tipo: formData.get('tipo')?.toString().trim() ?? '',
    requiere_aprobacion: formData.get('requiere_aprobacion') === 'on',
    requiere_entrega: formData.get('requiere_entrega') === 'on',
    requiere_evidencia: formData.get('requiere_evidencia') === 'on',
    requiere_persona_beneficiaria: formData.get('requiere_persona_beneficiaria') === 'on',
    requiere_documentos: formData.get('requiere_documentos') === 'on',
    permite_entrega_local: formData.get('permite_entrega_local') === 'on',
    tiene_tope_monetario: tieneTope,
    tope_monetario: tope,
    periodicidad: formData.get('periodicidad')?.toString().trim() || null,
  }
}

function validarCampos(campos: ValoresTipoAyudaFormulario): string | null {
  if (!campos.nombre || !campos.tipo) {
    return 'Nombre y tipo son obligatorios.'
  }

  if (campos.tiene_tope_monetario && (campos.tope_monetario === null || Number.isNaN(campos.tope_monetario))) {
    return 'Si la ayuda tiene tope monetario, debes ingresar el monto.'
  }

  if (campos.tope_monetario !== null && !Number.isNaN(campos.tope_monetario) && campos.tope_monetario < 0) {
    return 'El tope monetario no puede ser negativo.'
  }

  return null
}

function datosParaGuardar(campos: ValoresTipoAyudaFormulario) {
  return {
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    tipo: campos.tipo,
    requiere_aprobacion: campos.requiere_aprobacion,
    requiere_entrega: campos.requiere_entrega,
    requiere_evidencia: campos.requiere_evidencia,
    requiere_persona_beneficiaria: campos.requiere_persona_beneficiaria,
    requiere_documentos: campos.requiere_documentos,
    // MR-06: sin entrega física no hay entrega en local.
    permite_entrega_local: campos.requiere_entrega && campos.permite_entrega_local,
    tiene_tope_monetario: campos.tiene_tope_monetario,
    tope_monetario: campos.tiene_tope_monetario ? campos.tope_monetario : null,
    periodicidad: campos.periodicidad,
  }
}

export async function crearTipoAyuda(
  _prevState: TipoAyudaFormState,
  formData: FormData
): Promise<TipoAyudaFormState> {
  await requireRole([...ROLES_GESTION_AYUDAS])

  const campos = leerCampos(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_ayuda')
    .insert(datosParaGuardar(campos))
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'No se pudo crear el tipo de ayuda.', valores: campos }
  }

  revalidatePath('/ayudas')
  redirect(`/ayudas/${data.id}`)
}

export async function actualizarTipoAyuda(
  id: string,
  _prevState: TipoAyudaFormState,
  formData: FormData
): Promise<TipoAyudaFormState> {
  await requireRole([...ROLES_GESTION_AYUDAS])

  const campos = leerCampos(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tipos_ayuda')
    .update(datosParaGuardar(campos))
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar el tipo de ayuda.', valores: campos }
  }

  revalidatePath('/ayudas')
  revalidatePath(`/ayudas/${id}`)
  redirect(`/ayudas/${id}`)
}

// US-06.03: activar/desactivar, acción separada del edit general (mismo
// patrón que grupos_familiares/personas). Auditado por el trigger de
// tipos_ayuda_historial (misma migración de US-06.02).
export async function cambiarEstadoTipoAyuda(id: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_GESTION_AYUDAS])

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tipos_ayuda')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del tipo de ayuda.')
  }

  revalidatePath(`/ayudas/${id}`)
  revalidatePath('/ayudas')
}
