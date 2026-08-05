'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { rutEsValido, normalizarRut } from './rut'
import { buscarPersonaPorRut } from './dal'
import type { EstadoPersona } from './types'

const ROLES_GESTION_PERSONAS = ['administrador', 'evaluador_social'] as const
const ESTADOS_PERSONA: EstadoPersona[] = [
  'activo',
  'ya_no_pertenece_hogar',
  'fallecido',
  'pendiente_validacion',
]

type ValoresPersonaFormulario = {
  rut: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  parentesco: string
}

export type PersonaFormState =
  | { error?: string; warning?: string; valores: ValoresPersonaFormulario }
  | undefined

function leerCampos(formData: FormData): ValoresPersonaFormulario {
  return {
    rut: formData.get('rut')?.toString().trim() ?? '',
    nombres: formData.get('nombres')?.toString().trim() ?? '',
    apellidos: formData.get('apellidos')?.toString().trim() ?? '',
    fecha_nacimiento: formData.get('fecha_nacimiento')?.toString() ?? '',
    parentesco: formData.get('parentesco')?.toString().trim() ?? '',
  }
}

function validarCampos(campos: ReturnType<typeof leerCampos>): string | null {
  if (
    !campos.rut ||
    !campos.nombres ||
    !campos.apellidos ||
    !campos.fecha_nacimiento ||
    !campos.parentesco
  ) {
    return 'Todos los campos son obligatorios.'
  }

  if (!rutEsValido(campos.rut)) {
    return 'El RUT ingresado no es válido.'
  }

  return null
}

export async function agregarIntegrante(
  grupoFamiliarId: string,
  _prevState: PersonaFormState,
  formData: FormData
): Promise<PersonaFormState> {
  await requireRole([...ROLES_GESTION_PERSONAS])

  const campos = leerCampos(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  const rutNormalizado = normalizarRut(campos.rut)!
  const confirmarDuplicado = formData.get('confirmar_duplicado')?.toString() === 'true'

  if (!confirmarDuplicado) {
    const existente = await buscarPersonaPorRut(rutNormalizado)
    if (existente) {
      const hogar = existente.grupo_familiar_direccion
        ? ` (hogar: ${existente.grupo_familiar_direccion})`
        : ''
      return {
        warning: `Ya existe una persona con este RUT: ${existente.nombres} ${existente.apellidos}${hogar}. Si continúas, se creará un registro nuevo de todas formas.`,
        valores: campos,
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('personas').insert({
    grupo_familiar_id: grupoFamiliarId,
    rut: rutNormalizado,
    nombres: campos.nombres,
    apellidos: campos.apellidos,
    fecha_nacimiento: campos.fecha_nacimiento,
    parentesco: campos.parentesco,
  })

  if (error) {
    return { error: 'No se pudo agregar el integrante.', valores: campos }
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
  redirect(`/hogares/${grupoFamiliarId}`)
}

export async function actualizarIntegrante(
  id: string,
  grupoFamiliarId: string,
  _prevState: PersonaFormState,
  formData: FormData
): Promise<PersonaFormState> {
  await requireRole([...ROLES_GESTION_PERSONAS])

  const campos = leerCampos(formData)
  const errorValidacion = validarCampos(campos)
  if (errorValidacion) {
    return { error: errorValidacion, valores: campos }
  }

  const rutNormalizado = normalizarRut(campos.rut)!

  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({
      rut: rutNormalizado,
      nombres: campos.nombres,
      apellidos: campos.apellidos,
      fecha_nacimiento: campos.fecha_nacimiento,
      parentesco: campos.parentesco,
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar el integrante.', valores: campos }
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
  redirect(`/hogares/${grupoFamiliarId}`)
}

// US-04.03: cambio de estado separado de la edición general (mismo patrón
// que grupos_familiares/US-03.05). "Historial no se elimina": el registro no
// se borra nunca, solo cambia de estado, y personas_historial guarda cada
// transición (misma migración de US-04.01).
export async function cambiarEstadoIntegrante(
  id: string,
  grupoFamiliarId: string,
  formData: FormData
): Promise<void> {
  await requireRole([...ROLES_GESTION_PERSONAS])

  const nuevoEstado = formData.get('estado')?.toString() as EstadoPersona | undefined
  if (!nuevoEstado || !ESTADOS_PERSONA.includes(nuevoEstado)) {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del integrante.')
  }

  revalidatePath(`/hogares/${grupoFamiliarId}`)
}
