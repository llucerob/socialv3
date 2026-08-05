'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRoleHitos, ROLES_REGISTRAR_HITOS } from './dal'
import type { TipoHito } from './types'

type ValoresHitoFormulario = {
  tipo: string
  categoria: string
  comentario: string
  fecha_hito: string
  persona_id: string
}

export type HitoFormState = { error?: string; valores: ValoresHitoFormulario } | undefined

const TIPOS_VALIDOS: TipoHito[] = ['familiar', 'social', 'salud']

// US-22.01: tipo/categoría/comentario/fecha obligatorios, integrante
// asociado opcional. "Se registra automáticamente el usuario y la fecha de
// registro" se resuelve con los defaults de columna (creado_por/created_at),
// igual que evaluaciones_sociales.
export async function registrarHito(
  grupoFamiliarId: string,
  _prevState: HitoFormState,
  formData: FormData
): Promise<HitoFormState> {
  // Solo evaluador_social/administrador registran hitos (US-22.01: "como
  // asistente social..."). aprobador puede leer (ROLES_VER_HITOS) pero no
  // escribir, por eso se audita/gatea con el conjunto más restrictivo.
  await requireRoleHitos(ROLES_REGISTRAR_HITOS, `/hogares/${grupoFamiliarId}/hitos/nuevo`, grupoFamiliarId)

  const campos = leerCampos(formData)

  if (!TIPOS_VALIDOS.includes(campos.tipo as TipoHito)) {
    return { error: 'Selecciona un tipo de hito válido.', valores: campos }
  }

  if (!campos.categoria) {
    return { error: 'La categoría es obligatoria.', valores: campos }
  }

  if (!campos.comentario) {
    return { error: 'El comentario es obligatorio.', valores: campos }
  }

  if (!campos.fecha_hito) {
    return { error: 'La fecha del hito es obligatoria.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('hitos').insert({
    grupo_familiar_id: grupoFamiliarId,
    persona_id: campos.persona_id || null,
    tipo: campos.tipo as TipoHito,
    categoria: campos.categoria,
    comentario: campos.comentario,
    fecha_hito: campos.fecha_hito,
  })

  if (error) {
    return { error: 'No se pudo registrar el hito.', valores: campos }
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
  redirect(`/hogares/${grupoFamiliarId}`)
}

function leerCampos(formData: FormData): ValoresHitoFormulario {
  return {
    tipo: formData.get('tipo')?.toString() ?? '',
    categoria: formData.get('categoria')?.toString().trim() ?? '',
    comentario: formData.get('comentario')?.toString().trim() ?? '',
    fecha_hito: formData.get('fecha_hito')?.toString() ?? '',
    persona_id: formData.get('persona_id')?.toString() ?? '',
  }
}
