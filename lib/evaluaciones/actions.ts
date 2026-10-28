'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import type { RecomendacionEvaluacion } from './types'
import { PERIODICIDADES_BENEFICIO, type PeriodicidadBeneficio } from '@/lib/beneficios/types'

const ROLES_EVALUACION = ['administrador', 'evaluador_social'] as const

type ValoresEvaluacionFormulario = {
  fundamento: string
  recomendacion: string
  periodicidad_propuesta?: string
}

export type EvaluacionFormState =
  | { error?: string; valores: ValoresEvaluacionFormulario }
  | undefined

// US-08.01: fundamento obligatorio (no puede quedar vacío), recomendación
// aprobar/rechazar, asociada a la solicitud, con fecha/usuario registrados
// por las columnas created_at/evaluador_id (default auth.uid()). Solo se
// puede registrar mientras la solicitud está "en evaluación" — es la
// dependencia explícita de la historia (US-07.03).
export async function registrarEvaluacion(
  solicitudId: string,
  _prevState: EvaluacionFormState,
  formData: FormData
): Promise<EvaluacionFormState> {
  await requireRole([...ROLES_EVALUACION])

  const fundamento = formData.get('fundamento')?.toString().trim() ?? ''
  const recomendacion = formData.get('recomendacion')?.toString() ?? ''
  const periodicidadRaw = formData.get('periodicidad_propuesta')?.toString() ?? ''
  const valores = { fundamento, recomendacion, periodicidad_propuesta: periodicidadRaw }

  if (!fundamento) {
    return { error: 'El fundamento no puede quedar vacío.', valores }
  }

  if (recomendacion !== 'aprobar' && recomendacion !== 'rechazar') {
    return { error: 'Debes seleccionar una recomendación (aprobar o rechazar).', valores }
  }

  const supabase = await createClient()
  const { data: solicitud, error: errorLectura } = await supabase
    .from('solicitudes')
    .select('estado, tipos_ayuda(periodicidad_beneficio)')
    .eq('id', solicitudId)
    .maybeSingle()

  if (errorLectura || !solicitud) {
    return { error: 'Solicitud no encontrada.', valores }
  }

  if (solicitud.estado !== 'en_evaluacion') {
    return {
      error: 'Solo se puede registrar una evaluación mientras la solicitud está en evaluación.',
      valores,
    }
  }

  // MR-08: si la ayuda es un beneficio periódico y se recomienda aprobar,
  // el gestor social propone con qué periodicidad se entrega.
  const esPeriodica = Boolean(
    (solicitud.tipos_ayuda as unknown as { periodicidad_beneficio: string | null } | null)?.periodicidad_beneficio
  )
  const periodicidadPropuesta =
    esPeriodica && recomendacion === 'aprobar' && PERIODICIDADES_BENEFICIO.includes(periodicidadRaw as PeriodicidadBeneficio)
      ? (periodicidadRaw as PeriodicidadBeneficio)
      : null
  if (esPeriodica && recomendacion === 'aprobar' && !periodicidadPropuesta) {
    return { error: 'Propón la periodicidad del beneficio.', valores }
  }

  const { error } = await supabase.from('evaluaciones_sociales').insert({
    solicitud_id: solicitudId,
    fundamento,
    recomendacion: recomendacion as RecomendacionEvaluacion,
    periodicidad_propuesta: periodicidadPropuesta,
  })

  if (error) {
    return { error: 'No se pudo registrar la evaluación.', valores }
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
}
