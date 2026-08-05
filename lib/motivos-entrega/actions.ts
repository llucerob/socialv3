'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

const ROLES_GESTION_MOTIVOS = ['administrador'] as const

type ValoresMotivoFormulario = { nombre: string }

export type MotivoFormState = { error?: string; valores: ValoresMotivoFormulario } | undefined

function leerCampos(formData: FormData): ValoresMotivoFormulario {
  return { nombre: formData.get('nombre')?.toString().trim() ?? '' }
}

export async function crearMotivoEntregaFallida(
  _prevState: MotivoFormState,
  formData: FormData
): Promise<MotivoFormState> {
  await requireRole([...ROLES_GESTION_MOTIVOS])

  const campos = leerCampos(formData)
  if (!campos.nombre) {
    return { error: 'El nombre del motivo es obligatorio.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('motivos_entrega_fallida')
    .insert({ nombre: campos.nombre })
    .select('id')
    .single()

  if (error || !data) {
    return {
      error: error?.code === '23505' ? 'Ya existe un motivo con ese nombre.' : 'No se pudo crear el motivo.',
      valores: campos,
    }
  }

  revalidatePath('/admin/motivos-entrega')
  redirect(`/admin/motivos-entrega/${data.id}`)
}

export async function actualizarMotivoEntregaFallida(
  id: string,
  _prevState: MotivoFormState,
  formData: FormData
): Promise<MotivoFormState> {
  await requireRole([...ROLES_GESTION_MOTIVOS])

  const campos = leerCampos(formData)
  if (!campos.nombre) {
    return { error: 'El nombre del motivo es obligatorio.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('motivos_entrega_fallida')
    .update({ nombre: campos.nombre })
    .eq('id', id)

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe un motivo con ese nombre.' : 'No se pudo actualizar el motivo.',
      valores: campos,
    }
  }

  revalidatePath('/admin/motivos-entrega')
  revalidatePath(`/admin/motivos-entrega/${id}`)
  redirect(`/admin/motivos-entrega/${id}`)
}

// US-19.03: "se pueden activar o desactivar motivos". Sin eliminación física
// en ningún punto de este módulo — "los motivos históricos se conservan" se
// cumple por construcción (entregas.motivo_fallo sigue apuntando al mismo
// registro, solo deja de ofrecerse para nuevas entregas fallidas).
export async function cambiarEstadoMotivoEntregaFallida(id: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_GESTION_MOTIVOS])

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('motivos_entrega_fallida')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del motivo.')
  }

  revalidatePath(`/admin/motivos-entrega/${id}`)
  revalidatePath('/admin/motivos-entrega')
}
