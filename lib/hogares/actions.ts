'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { listarSectoresActivos } from '@/lib/sectores/dal'
import { obtenerGrupoFamiliar } from './dal'

type ValoresGrupoFamiliarFormulario = {
  direccion: string
  sector: string
  telefono: string | null
  observaciones: string | null
  fecha_actualizacion_rsh: string | null
  tramo_rsh: number | null | typeof Number.NaN
  latitud: number | null | typeof Number.NaN
  longitud: number | null | typeof Number.NaN
}

export type GrupoFamiliarFormState =
  | { error?: string; valores: ValoresGrupoFamiliarFormulario }
  | undefined

const ROLES_GESTION_HOGARES = ['administrador', 'evaluador_social'] as const

function parseNumero(value: FormDataEntryValue | null): number | null | typeof Number.NaN {
  const raw = value?.toString().trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : Number.NaN
}

function leerCamposFormulario(formData: FormData): ValoresGrupoFamiliarFormulario {
  return {
    direccion: formData.get('direccion')?.toString().trim() ?? '',
    sector: formData.get('sector')?.toString().trim() ?? '',
    telefono: formData.get('telefono')?.toString().trim() || null,
    observaciones: formData.get('observaciones')?.toString().trim() || null,
    fecha_actualizacion_rsh: formData.get('fecha_actualizacion_rsh')?.toString() || null,
    tramo_rsh: parseNumero(formData.get('tramo_rsh')),
    latitud: parseNumero(formData.get('latitud')),
    longitud: parseNumero(formData.get('longitud')),
  }
}

// US-03.06: coordenadas opcionales, pero si se ingresan deben ser válidas y
// venir de a par (no tiene sentido guardar solo latitud o solo longitud).
function validarCampos(campos: ReturnType<typeof leerCamposFormulario>): string | null {
  if (!campos.direccion || !campos.sector) {
    return 'Dirección y sector son obligatorios.'
  }

  if (Number.isNaN(campos.tramo_rsh)) {
    return 'El tramo RSH debe ser un número.'
  }

  if (campos.tramo_rsh !== null && (campos.tramo_rsh < 0 || campos.tramo_rsh > 100)) {
    return 'El tramo RSH debe estar entre 0 y 100.'
  }

  if (Number.isNaN(campos.latitud) || Number.isNaN(campos.longitud)) {
    return 'Latitud y longitud deben ser números.'
  }

  if ((campos.latitud === null) !== (campos.longitud === null)) {
    return 'Ingresa latitud y longitud juntas, o deja ambas vacías.'
  }

  if (campos.latitud !== null && (campos.latitud < -90 || campos.latitud > 90)) {
    return 'La latitud debe estar entre -90 y 90.'
  }

  if (campos.longitud !== null && (campos.longitud < -180 || campos.longitud > 180)) {
    return 'La longitud debe estar entre -180 y 180.'
  }

  return null
}

// US-19.02: "los hogares pueden asociarse a un sector" del catálogo — el
// <select> del formulario ya solo ofrece sectores activos, esta es la
// validación del lado del servidor equivalente (mismo criterio que
// documentos.tipo_documento en subirDocumento, lib/documentos/actions.ts).
async function sectorEsValido(nombre: string): Promise<boolean> {
  const sectoresActivos = await listarSectoresActivos()
  return sectoresActivos.some((sector) => sector.nombre === nombre)
}

export async function crearGrupoFamiliar(
  _prevState: GrupoFamiliarFormState,
  formData: FormData
): Promise<GrupoFamiliarFormState> {
  await requireRole([...ROLES_GESTION_HOGARES])

  const campos = leerCamposFormulario(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  if (!(await sectorEsValido(campos.sector))) {
    return { error: 'Selecciona un sector válido del catálogo.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos_familiares')
    .insert({
      direccion: campos.direccion,
      sector: campos.sector,
      telefono: campos.telefono,
      tramo_rsh: campos.tramo_rsh,
      fecha_actualizacion_rsh: campos.fecha_actualizacion_rsh,
      observaciones: campos.observaciones,
      latitud: campos.latitud,
      longitud: campos.longitud,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'No se pudo crear el grupo familiar.', valores: campos }
  }

  revalidatePath('/hogares')
  redirect(`/hogares/${data.id}`)
}

export async function actualizarGrupoFamiliar(
  id: string,
  _prevState: GrupoFamiliarFormState,
  formData: FormData
): Promise<GrupoFamiliarFormState> {
  await requireRole([...ROLES_GESTION_HOGARES])

  const campos = leerCamposFormulario(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  // US-19.02: se acepta el sector activo elegido en el <select>, o el que el
  // hogar ya tenía (aunque haya sido desactivado después) — igual criterio
  // que el <option> extra de hogar-form.tsx: editar otros campos no debe
  // forzar un cambio de sector que el usuario no pidió explícitamente.
  const hogarActual = await obtenerGrupoFamiliar(id)
  const sectorSinCambios = hogarActual?.sector === campos.sector
  if (!sectorSinCambios && !(await sectorEsValido(campos.sector))) {
    return { error: 'Selecciona un sector válido del catálogo.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('grupos_familiares')
    .update({
      direccion: campos.direccion,
      sector: campos.sector,
      telefono: campos.telefono,
      tramo_rsh: campos.tramo_rsh,
      fecha_actualizacion_rsh: campos.fecha_actualizacion_rsh,
      observaciones: campos.observaciones,
      latitud: campos.latitud,
      longitud: campos.longitud,
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar el grupo familiar.', valores: campos }
  }

  revalidatePath('/hogares')
  revalidatePath(`/hogares/${id}`)
  redirect(`/hogares/${id}`)
}

// US-03.05: marcar hogar como inactivo / reactivarlo. Acción separada del
// formulario general de edición (mismo patrón que profiles: el estado no se
// edita como un campo más, tiene su propio control con su propio texto).
// El cambio queda auditado automáticamente por el trigger de
// grupos_familiares_historial (misma migración de US-03.01).
export async function cambiarEstadoGrupoFamiliar(id: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_GESTION_HOGARES])

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('grupos_familiares')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del grupo familiar.')
  }

  revalidatePath(`/hogares/${id}`)
  revalidatePath('/hogares')
}
