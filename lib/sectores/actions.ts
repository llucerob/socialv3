'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

// Mismo criterio que tipos_ayuda (US-06.02): mantenedor de sistema, escritura
// solo administrador.
const ROLES_GESTION_SECTORES = ['administrador'] as const

type ValoresSectorFormulario = { nombre: string }

export type SectorFormState = { error?: string; valores: ValoresSectorFormulario } | undefined

function leerCampos(formData: FormData): ValoresSectorFormulario {
  return { nombre: formData.get('nombre')?.toString().trim() ?? '' }
}

export async function crearSector(
  _prevState: SectorFormState,
  formData: FormData
): Promise<SectorFormState> {
  await requireRole([...ROLES_GESTION_SECTORES])

  const campos = leerCampos(formData)
  if (!campos.nombre) {
    return { error: 'El nombre del sector es obligatorio.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sectores')
    .insert({ nombre: campos.nombre })
    .select('id')
    .single()

  if (error || !data) {
    return {
      error: error?.code === '23505' ? 'Ya existe un sector con ese nombre.' : 'No se pudo crear el sector.',
      valores: campos,
    }
  }

  revalidatePath('/admin/sectores')
  redirect(`/admin/sectores/${data.id}`)
}

export async function actualizarSector(
  id: string,
  _prevState: SectorFormState,
  formData: FormData
): Promise<SectorFormState> {
  await requireRole([...ROLES_GESTION_SECTORES])

  const campos = leerCampos(formData)
  if (!campos.nombre) {
    return { error: 'El nombre del sector es obligatorio.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('sectores').update({ nombre: campos.nombre }).eq('id', id)

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe un sector con ese nombre.' : 'No se pudo actualizar el sector.',
      valores: campos,
    }
  }

  revalidatePath('/admin/sectores')
  revalidatePath(`/admin/sectores/${id}`)
  redirect(`/admin/sectores/${id}`)
}

// US-19.02: "se pueden desactivar sectores". Auditado por el trigger de
// sectores_historial (misma migración).
export async function cambiarEstadoSector(id: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_GESTION_SECTORES])

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('sectores').update({ estado: nuevoEstado }).eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del sector.')
  }

  revalidatePath(`/admin/sectores/${id}`)
  revalidatePath('/admin/sectores')
}
