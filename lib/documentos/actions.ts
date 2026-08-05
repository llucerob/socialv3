'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireRole } from '@/lib/auth/dal'
import {
  TIPOS_DOCUMENTO,
  ESTADOS_RETENCION_DOCUMENTO,
  type TipoDocumento,
  type EstadoValidacionDocumento,
  type EstadoRetencionDocumento,
} from './types'

// US-14.02: "como finanzas o evaluador autorizado" — no se restringe a
// "reembolso" a nivel de rol (eso lo decide la UI, mostrando el control solo
// en solicitudes de tipo reembolso); a nivel de permisos, cualquiera de
// estos tres roles puede validar cualquier documento.
const ROLES_VALIDAR_DOCUMENTOS = ['administrador', 'evaluador_social', 'finanzas'] as const

const BUCKET = 'documentos'
// Mismo límite que supabase/config.toml [storage] file_size_limit, para dar
// un mensaje de error legible en vez de que la subida falle en el storage
// con un error genérico.
const TAMANO_MAXIMO_BYTES = 50 * 1024 * 1024

export type DocumentoFormState = { error?: string } | undefined

function sanitizarNombreArchivo(nombre: string): string {
  return nombre.replace(/[^a-zA-Z0-9._-]/g, '_')
}

// US-10.01/US-10.02: subir documento a una solicitud o a un hogar (misma
// validación, distinto destino). No se restringe por rol más allá de tener
// un perfil activo válido (mismo criterio amplio de la RLS de la tabla) —
// EPIC 10 no exige restricción por rol; esa granularidad es EPIC 18/US-18.02
// (Sprint 7, no construido todavía).
async function subirDocumento(
  entidad: { solicitud_id: string; grupo_familiar_id: null } | { solicitud_id: null; grupo_familiar_id: string },
  carpeta: string,
  formData: FormData
): Promise<DocumentoFormState> {
  await getProfile()

  const tipoDocumento = formData.get('tipo_documento')?.toString() ?? ''
  const archivo = formData.get('archivo')

  if (!TIPOS_DOCUMENTO.includes(tipoDocumento as TipoDocumento)) {
    return { error: 'Selecciona un tipo de documento válido.' }
  }

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: 'Selecciona un archivo para subir.' }
  }

  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { error: 'El archivo supera el tamaño máximo permitido (50 MB).' }
  }

  const entidadId = entidad.solicitud_id ?? entidad.grupo_familiar_id
  const nombreSanitizado = sanitizarNombreArchivo(archivo.name)
  const storagePath = `${carpeta}/${entidadId}/${crypto.randomUUID()}-${nombreSanitizado}`

  const supabase = await createClient()

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, archivo, { contentType: archivo.type || 'application/octet-stream' })

  if (errorSubida) {
    return { error: 'No se pudo subir el archivo.' }
  }

  const { error: errorInsert } = await supabase.from('documentos').insert({
    solicitud_id: entidad.solicitud_id,
    grupo_familiar_id: entidad.grupo_familiar_id,
    tipo_documento: tipoDocumento as TipoDocumento,
    storage_path: storagePath,
    nombre_archivo: archivo.name,
    tamano_bytes: archivo.size,
    mime_type: archivo.type || 'application/octet-stream',
  })

  if (errorInsert) {
    // El archivo ya se subió al storage pero la fila no se pudo crear —
    // se limpia para no dejar un objeto huérfano sin registro.
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { error: 'No se pudo registrar el documento.' }
  }

  if (entidad.solicitud_id) {
    revalidatePath(`/solicitudes/${entidad.solicitud_id}`)
  } else {
    revalidatePath(`/hogares/${entidad.grupo_familiar_id}`)
  }
}

export async function subirDocumentoSolicitud(
  solicitudId: string,
  _prevState: DocumentoFormState,
  formData: FormData
): Promise<DocumentoFormState> {
  return subirDocumento(
    { solicitud_id: solicitudId, grupo_familiar_id: null },
    'solicitudes',
    formData
  )
}

export async function subirDocumentoHogar(
  grupoFamiliarId: string,
  _prevState: DocumentoFormState,
  formData: FormData
): Promise<DocumentoFormState> {
  return subirDocumento(
    { solicitud_id: null, grupo_familiar_id: grupoFamiliarId },
    'hogares',
    formData
  )
}

const ESTADOS_VALIDACION_VALIDOS: EstadoValidacionDocumento[] = ['valido', 'observado']

// US-14.02: "se puede marcar documento como válido/observado, con
// comentario opcional, y la validación queda registrada" (quién/cuándo lo
// pone el trigger set_documentos_validado_por, no esta acción). Sin
// useActionState: dos botones de submit en un mismo <form> (name="estado_
// validacion" value="valido"/"observado", mismo patrón que "accion" en
// SolicitudForm) — no hay validación de campos que mostrar al usuario.
export async function validarDocumento(documentoId: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_VALIDAR_DOCUMENTOS])

  const estadoValidacion = formData.get('estado_validacion')?.toString() ?? ''
  if (!ESTADOS_VALIDACION_VALIDOS.includes(estadoValidacion as EstadoValidacionDocumento)) {
    throw new Error('Estado de validación inválido.')
  }

  const comentario = formData.get('comentario')?.toString().trim() || null

  const supabase = await createClient()
  const { data: documento, error: errorLectura } = await supabase
    .from('documentos')
    .select('solicitud_id, grupo_familiar_id')
    .eq('id', documentoId)
    .maybeSingle()

  if (errorLectura || !documento) {
    throw new Error('Documento no encontrado.')
  }

  const { error } = await supabase
    .from('documentos')
    .update({
      estado_validacion: estadoValidacion as EstadoValidacionDocumento,
      comentario_validacion: comentario,
    })
    .eq('id', documentoId)

  if (error) {
    throw new Error('No se pudo registrar la validación del documento.')
  }

  if (documento.solicitud_id) {
    revalidatePath(`/solicitudes/${documento.solicitud_id}`)
  } else if (documento.grupo_familiar_id) {
    revalidatePath(`/hogares/${documento.grupo_familiar_id}`)
  }
}

// US-18.04: "como administrador, quiero definir estado de conservación de
// documentos" (incluye "se puede marcar documento como reemplazado" — es el
// mismo mecanismo, solo con un valor distinto). El chequeo de rol real vive
// en la función SQL (security definer): una política RLS directa no sirve
// aquí porque `documentos` ya tiene otra política de UPDATE permisiva para
// validación (administrador/evaluador_social/finanzas) — ver el comentario
// de la migración.
export async function actualizarRetencionDocumento(documentoId: string, formData: FormData): Promise<void> {
  await requireRole(['administrador'])

  const estadoRetencion = formData.get('estado_retencion')?.toString() ?? ''
  if (!ESTADOS_RETENCION_DOCUMENTO.includes(estadoRetencion as EstadoRetencionDocumento)) {
    throw new Error('Estado de conservación inválido.')
  }

  const supabase = await createClient()
  const { data: documento, error: errorLectura } = await supabase
    .from('documentos')
    .select('solicitud_id, grupo_familiar_id')
    .eq('id', documentoId)
    .maybeSingle()

  if (errorLectura || !documento) {
    throw new Error('Documento no encontrado.')
  }

  const { error } = await supabase.rpc('actualizar_estado_retencion_documento', {
    p_documento_id: documentoId,
    p_estado_retencion: estadoRetencion as EstadoRetencionDocumento,
  })

  if (error) {
    throw new Error('No se pudo actualizar el estado de conservación.')
  }

  if (documento.solicitud_id) {
    revalidatePath(`/solicitudes/${documento.solicitud_id}`)
  } else if (documento.grupo_familiar_id) {
    revalidatePath(`/hogares/${documento.grupo_familiar_id}`)
  }
}

// US-18.04: "no se elimina físicamente sin rol autorizado... la acción
// queda auditada". requireRole es la primera barrera (evita ni siquiera
// intentar el storage si el rol no corresponde); la RLS de `documentos`
// (solo administrador) y el trigger de auditoría (documentos_historial) son
// la barrera real independiente del cliente, igual criterio que el resto
// del proyecto.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma requerida por <form action>
export async function eliminarDocumento(documentoId: string, _formData: FormData): Promise<void> {
  await requireRole(['administrador'])

  const supabase = await createClient()
  const { data: documento, error: errorLectura } = await supabase
    .from('documentos')
    .select('storage_path, solicitud_id, grupo_familiar_id')
    .eq('id', documentoId)
    .maybeSingle()

  if (errorLectura || !documento) {
    throw new Error('Documento no encontrado.')
  }

  const { error: errorDelete } = await supabase.from('documentos').delete().eq('id', documentoId)
  if (errorDelete) {
    throw new Error('No se pudo eliminar el documento.')
  }

  await supabase.storage.from(BUCKET).remove([documento.storage_path])

  if (documento.solicitud_id) {
    revalidatePath(`/solicitudes/${documento.solicitud_id}`)
  } else if (documento.grupo_familiar_id) {
    revalidatePath(`/hogares/${documento.grupo_familiar_id}`)
  }
}
