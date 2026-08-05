import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  FilaAyudaEntregada,
  FiltrosAyudasEntregadas,
  FilaHogarBeneficiado,
  FiltrosHogaresBeneficiados,
  FilaReembolsoMedico,
  FiltrosReembolsosMedicos,
  FilaReembolsoExcepcional,
  FiltrosReembolsosExcepcionales,
  FilaDialisisMensual,
  FiltrosDialisis,
  FilaEntregaPendienteFallida,
  FiltrosEntregasPendientesFallidas,
} from './types'

// US-17.01 a US-17.05: mismo criterio que auditoría (lib/auditoria/dal.ts) —
// el filtrado ocurre en la función SQL (security definer), no en JS, para no
// traer y cruzar en el cliente varias tablas con RLS distinta por rol.
export async function reporteAyudasEntregadas(filtros: FiltrosAyudasEntregadas): Promise<FilaAyudaEntregada[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_ayudas_entregadas', {
    p_fecha_desde: filtros.fechaDesde || null,
    p_fecha_hasta: filtros.fechaHasta || null,
    p_tipo_ayuda_id: filtros.tipoAyudaId || null,
    p_sector: filtros.sector || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de ayudas entregadas: ${error.message}`)
  return data ?? []
}

export async function reporteHogaresBeneficiados(
  filtros: FiltrosHogaresBeneficiados
): Promise<FilaHogarBeneficiado[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_hogares_beneficiados', {
    p_fecha_desde: filtros.fechaDesde || null,
    p_fecha_hasta: filtros.fechaHasta || null,
    p_sector: filtros.sector || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de hogares beneficiados: ${error.message}`)
  return data ?? []
}

export async function reporteReembolsosMedicos(filtros: FiltrosReembolsosMedicos): Promise<FilaReembolsoMedico[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_reembolsos_medicos', {
    p_fecha_desde: filtros.fechaDesde || null,
    p_fecha_hasta: filtros.fechaHasta || null,
    p_tipo_reembolso: filtros.tipoReembolso || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de reembolsos médicos: ${error.message}`)
  return data ?? []
}

// 🆕 US-25.07
export async function reporteReembolsosExcepcionales(
  filtros: FiltrosReembolsosExcepcionales
): Promise<FilaReembolsoExcepcional[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_reembolsos_excepcionales', {
    p_fecha_desde: filtros.fechaDesde || null,
    p_fecha_hasta: filtros.fechaHasta || null,
    p_tipo_excepcion: filtros.tipoExcepcion || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de reembolsos excepcionales: ${error.message}`)
  return data ?? []
}

export async function reporteDialisisMensual(filtros: FiltrosDialisis): Promise<FilaDialisisMensual[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_dialisis_mensual', {
    p_anio: filtros.anio ?? null,
    p_mes: filtros.mes ?? null,
    p_persona_id: filtros.personaId || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de diálisis: ${error.message}`)
  return data ?? []
}

export async function reporteEntregasPendientesFallidas(
  filtros: FiltrosEntregasPendientesFallidas
): Promise<FilaEntregaPendienteFallida[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reporte_entregas_pendientes_fallidas', {
    p_estado: filtros.estado || null,
    p_responsable_id: filtros.responsableId || null,
    p_sector: filtros.sector || null,
  })

  if (error) throw new Error(`Error al consultar el reporte de entregas pendientes y fallidas: ${error.message}`)
  return data ?? []
}

// Filtro "sector" compartido por los cinco reportes: grupos_familiares es de
// lectura abierta a cualquier rol válido (ver rls_grupos_familiares.sql), así
// que no hace falta una función RPC — a diferencia de las consultas de
// arriba, que sí cruzan tablas con RLS más restrictiva según el rol.
export async function listarSectoresDisponibles(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('grupos_familiares').select('sector')
  if (error) throw error
  return [...new Set((data ?? []).map((fila) => fila.sector as string))].sort()
}
