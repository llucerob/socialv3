'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { mensajeErrorBeneficio } from './types'

// MR-08: quien evalúa o decide el beneficio puede cambiar su modalidad o
// suspenderlo. Las reglas las valida la base (cambiar_modalidad_beneficio,
// suspender_beneficio); aquí solo se revisa lo que falta para no ir a la base.
const ROLES_GESTION_BENEFICIO = ['administrador', 'evaluador_social', 'aprobador'] as const

export type BeneficioFormState = { error?: string; valores: { motivo: string; modalidad?: string } } | undefined

export async function cambiarModalidadBeneficio(
  solicitudId: string,
  grupoFamiliarId: string,
  _prevState: BeneficioFormState,
  formData: FormData
): Promise<BeneficioFormState> {
  await requireRole([...ROLES_GESTION_BENEFICIO])

  const modalidad = formData.get('modalidad')?.toString() ?? ''
  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  const valores = { motivo, modalidad }

  if (modalidad !== 'domicilio' && modalidad !== 'local') {
    return { error: 'Selecciona la modalidad.', valores }
  }
  if (!motivo) {
    return { error: 'El motivo es obligatorio.', valores }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cambiar_modalidad_beneficio', {
    p_solicitud_id: solicitudId,
    p_modalidad: modalidad,
    p_motivo: motivo,
  })

  if (error) {
    return { error: mensajeErrorBeneficio(error.message) ?? 'No se pudo cambiar la modalidad.', valores }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath(`/hogares/${grupoFamiliarId}`)
  revalidatePath('/entregas')
}

export async function suspenderBeneficio(
  solicitudId: string,
  grupoFamiliarId: string,
  _prevState: BeneficioFormState,
  formData: FormData
): Promise<BeneficioFormState> {
  await requireRole([...ROLES_GESTION_BENEFICIO])

  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  const valores = { motivo }

  if (!motivo) {
    return { error: 'El motivo de la suspensión es obligatorio.', valores }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('suspender_beneficio', {
    p_solicitud_id: solicitudId,
    p_motivo: motivo,
  })

  if (error) {
    return { error: mensajeErrorBeneficio(error.message) ?? 'No se pudo suspender el beneficio.', valores }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath(`/hogares/${grupoFamiliarId}`)
  revalidatePath('/entregas')
  revalidatePath('/mis-entregas')
}
