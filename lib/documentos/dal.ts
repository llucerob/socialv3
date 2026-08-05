import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Documento, DocumentoConDetalle } from './types'

const BUCKET = 'documentos'
// Corta duración: la URL firmada se genera de nuevo en cada carga de página
// (no se persiste ni se comparte), así que no hace falta que dure más que
// el tiempo de descarga.
const SEGUNDOS_VIGENCIA_URL = 60

async function resolverDetalle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentos: Documento[]
): Promise<DocumentoConDetalle[]> {
  const idsUnicos = [
    ...new Set(
      [...documentos.map((d) => d.subido_por), ...documentos.map((d) => d.validado_por)].filter(
        (id): id is string => id !== null
      )
    ),
  ]
  const nombresPorId = new Map<string, string | null>()
  await Promise.all(
    idsUnicos.map(async (id) => {
      const { data: nombre } = await supabase.rpc('nombre_usuario', { p_user_id: id })
      nombresPorId.set(id, nombre ?? null)
    })
  )

  return Promise.all(
    documentos.map(async (documento) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(documento.storage_path, SEGUNDOS_VIGENCIA_URL)

      return {
        ...documento,
        url: data?.signedUrl ?? null,
        subido_por_nombre: nombresPorId.get(documento.subido_por) ?? null,
        validado_por_nombre: documento.validado_por
          ? nombresPorId.get(documento.validado_por) ?? null
          : null,
      }
    })
  )
}

export async function listarDocumentosDeSolicitud(
  solicitudId: string
): Promise<DocumentoConDetalle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return resolverDetalle(supabase, data as Documento[])
}

export async function listarDocumentosDeHogar(
  grupoFamiliarId: string
): Promise<DocumentoConDetalle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('grupo_familiar_id', grupoFamiliarId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return resolverDetalle(supabase, data as Documento[])
}
