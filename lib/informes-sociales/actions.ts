'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { ROLES_REGISTRAR_INFORMES } from './dal'
import { NIVELES_CONFIDENCIALIDAD, type NivelConfidencialidadInforme } from './types'

type ValoresInformeFormulario = {
  persona_id: string
  solicitud_id: string
  fecha_informe: string
  motivo: string
  evaluacion_social: string
  antecedentes_familiares: string
  situacion_habitacional: string
  situacion_economica: string
  situacion_salud: string
  recomendacion_profesional: string
  ayuda_sugerida: string
  nivel_confidencialidad: string
  observaciones: string
}

export type InformeSocialFormState = { error?: string; valores: ValoresInformeFormulario } | undefined

function leerCampos(formData: FormData): ValoresInformeFormulario {
  return {
    persona_id: formData.get('persona_id')?.toString() ?? '',
    solicitud_id: formData.get('solicitud_id')?.toString() ?? '',
    fecha_informe: formData.get('fecha_informe')?.toString() ?? '',
    motivo: formData.get('motivo')?.toString().trim() ?? '',
    evaluacion_social: formData.get('evaluacion_social')?.toString().trim() ?? '',
    antecedentes_familiares: formData.get('antecedentes_familiares')?.toString().trim() ?? '',
    situacion_habitacional: formData.get('situacion_habitacional')?.toString().trim() ?? '',
    situacion_economica: formData.get('situacion_economica')?.toString().trim() ?? '',
    situacion_salud: formData.get('situacion_salud')?.toString().trim() ?? '',
    recomendacion_profesional: formData.get('recomendacion_profesional')?.toString().trim() ?? '',
    ayuda_sugerida: formData.get('ayuda_sugerida')?.toString().trim() ?? '',
    nivel_confidencialidad: formData.get('nivel_confidencialidad')?.toString() ?? '',
    observaciones: formData.get('observaciones')?.toString().trim() ?? '',
  }
}

// US-23.01: campos obligatorios según los "campos mínimos" del backlog que
// además tienen contenido real que validar (fecha, motivo, evaluación
// social, antecedentes familiares, situación habitacional/económica,
// recomendación profesional, nivel de confidencialidad). "Situación de
// salud" queda opcional ("si aplica", explícito en el backlog); "ayuda
// sugerida" y "observaciones" no están en los criterios de aceptación como
// obligatorios.
export async function crearInformeSocial(
  grupoFamiliarId: string,
  _prevState: InformeSocialFormState,
  formData: FormData
): Promise<InformeSocialFormState> {
  await requireRole([...ROLES_REGISTRAR_INFORMES])

  const campos = leerCampos(formData)

  if (!campos.fecha_informe) return { error: 'La fecha del informe es obligatoria.', valores: campos }
  if (!campos.motivo) return { error: 'El motivo es obligatorio.', valores: campos }
  if (!campos.evaluacion_social) return { error: 'La evaluación social es obligatoria.', valores: campos }
  if (!campos.antecedentes_familiares) {
    return { error: 'Los antecedentes familiares son obligatorios.', valores: campos }
  }
  if (!campos.situacion_habitacional) {
    return { error: 'La situación habitacional es obligatoria.', valores: campos }
  }
  if (!campos.situacion_economica) {
    return { error: 'La situación económica es obligatoria.', valores: campos }
  }
  if (!campos.recomendacion_profesional) {
    return { error: 'La recomendación profesional es obligatoria.', valores: campos }
  }
  if (!NIVELES_CONFIDENCIALIDAD.includes(campos.nivel_confidencialidad as NivelConfidencialidadInforme)) {
    return { error: 'Selecciona un nivel de confidencialidad válido.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('informes_sociales').insert({
    grupo_familiar_id: grupoFamiliarId,
    persona_id: campos.persona_id || null,
    solicitud_id: campos.solicitud_id || null,
    fecha_informe: campos.fecha_informe,
    motivo: campos.motivo,
    evaluacion_social: campos.evaluacion_social,
    antecedentes_familiares: campos.antecedentes_familiares,
    situacion_habitacional: campos.situacion_habitacional,
    situacion_economica: campos.situacion_economica,
    situacion_salud: campos.situacion_salud || null,
    recomendacion_profesional: campos.recomendacion_profesional,
    ayuda_sugerida: campos.ayuda_sugerida || null,
    nivel_confidencialidad: campos.nivel_confidencialidad as NivelConfidencialidadInforme,
    observaciones: campos.observaciones || null,
  })

  if (error) {
    return { error: 'No se pudo registrar el informe social.', valores: campos }
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
  if (campos.solicitud_id) {
    revalidatePath(`/solicitudes/${campos.solicitud_id}`)
  }
  redirect(`/hogares/${grupoFamiliarId}?tab=seguimiento`)
}
