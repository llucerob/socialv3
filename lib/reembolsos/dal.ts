import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { listarSolicitudes } from '@/lib/solicitudes/dal'
import type { SolicitudConRelaciones } from '@/lib/solicitudes/types'
import {
  TOPES_TRAMO_REEMBOLSO_GENERAL,
  TOPE_ANUAL_POR_GRUPO_FAMILIAR,
  TOPE_MENSUAL_DIALISIS,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS,
} from './tramos'
import type {
  PagoReembolso,
  PagoReembolsoConNombre,
  TopeReembolsoGeneral,
  AcumuladoDialisisMensual,
} from './types'

// Nav ("Reembolsos", lib/dashboard/nav.ts) apuntaba a esta ruta marcada
// `disponible: false` — EPIC 14/25 (crear, aprobar, pagar reembolsos) ya
// estaban completos vía el flujo genérico de /solicitudes, pero finanzas y
// administrador no tenían una vista propia para ubicarlos entre el resto de
// solicitudes (cajas de mercadería, pañales, etc.). Reutiliza
// `listarSolicitudes` (misma fuente que /solicitudes) filtrando por
// `tipos_ayuda.tipo === 'reembolso'` — sin query nueva, sin duplicar el
// cálculo de remanente (que sigue viviendo exclusivamente en este archivo).
export async function listarSolicitudesReembolso(): Promise<SolicitudConRelaciones[]> {
  const solicitudes = await listarSolicitudes()
  return solicitudes.filter((s) => s.tipo_ayuda_tipo === 'reembolso')
}

type FilaDecisionAprobada = {
  monto_aprobado: number | null
  solicitudes: {
    fecha_solicitud: string
    tipos_ayuda: { nombre: string; tipo: string } | null
  } | null
}

// US-25.02 (fuente única, ver CLAUDE.md): decisiones aprobadas del hogar en
// el año calendario dado. Un solo fetch (filtrado un nivel — solicitudes —
// vía embedded filter de PostgREST, que sí es confiable; el filtro por año y
// por tipos_ayuda.nombre se hace en JS sobre el segundo nivel embebido, en
// vez de forzar un filtro de dos niveles que PostgREST no soporta bien) que
// alimenta tanto el conteo de reembolsos generales (US-14.05) como el
// remanente anual compartido (US-25.02) — evita duplicar la consulta.
async function listarDecisionesAprobadasDelHogar(
  grupoFamiliarId: string,
  anio: number
): Promise<FilaDecisionAprobada[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decisiones_solicitud')
    .select('monto_aprobado, solicitudes!inner(fecha_solicitud, tipos_ayuda(nombre, tipo))')
    .eq('decision', 'aprobada')
    .eq('solicitudes.grupo_familiar_id', grupoFamiliarId)

  if (error) throw error

  const filas = data as unknown as FilaDecisionAprobada[]
  return filas.filter((fila) => fila.solicitudes?.fecha_solicitud.startsWith(`${anio}-`))
}

// US-25.02: "cuánto queda disponible del tope anual de $100.000 por grupo
// familiar, considerando lo ya utilizado en reembolsos generales y
// excepcionales del año" — diálisis queda excluida a propósito: tiene su
// propio tope mensual independiente (EPIC 15, CLAUDE.md). Esta es la fuente
// única de este cálculo; EPIC 25 (reembolsos excepcionales, todavía no
// construido) debe reutilizar esta misma función cuando se implemente, no
// duplicar la lógica.
export async function calcularRemanenteReembolsoAnual(
  grupoFamiliarId: string,
  anio: number
): Promise<number> {
  const decisiones = await listarDecisionesAprobadasDelHogar(grupoFamiliarId, anio)

  const totalUsado = decisiones.reduce((total, fila) => {
    const tipoAyuda = fila.solicitudes?.tipos_ayuda
    if (tipoAyuda?.tipo !== 'reembolso') return total
    if (tipoAyuda.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS) return total
    return total + (fila.monto_aprobado ?? 0)
  }, 0)

  return Math.max(0, TOPE_ANUAL_POR_GRUPO_FAMILIAR - totalUsado)
}

// US-14.05: "cuenta cuántos reembolsos médicos generales ya fueron
// aprobados este año calendario para el grupo familiar" — a diferencia del
// remanente anual (que suma general + excepcional), este conteo es
// exclusivo del reembolso general: determina el tramo 1º-4º.
export async function contarReembolsosGeneralesAprobados(
  grupoFamiliarId: string,
  anio: number
): Promise<number> {
  const decisiones = await listarDecisionesAprobadasDelHogar(grupoFamiliarId, anio)
  return decisiones.filter(
    (fila) => fila.solicitudes?.tipos_ayuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL
  ).length
}

// US-14.05: "el tope final aprobable... es el menor valor entre (a) el tope
// teórico del tramo... y (b) el remanente disponible del pool anual".
export async function calcularTopeReembolsoGeneral(
  grupoFamiliarId: string,
  anio: number
): Promise<TopeReembolsoGeneral> {
  const [aprobadosGenerales, remanenteAnual] = await Promise.all([
    contarReembolsosGeneralesAprobados(grupoFamiliarId, anio),
    calcularRemanenteReembolsoAnual(grupoFamiliarId, anio),
  ])

  const bloqueadoPorTramos = aprobadosGenerales >= TOPES_TRAMO_REEMBOLSO_GENERAL.length
  const indiceTramo = Math.min(aprobadosGenerales, TOPES_TRAMO_REEMBOLSO_GENERAL.length - 1)
  const topeTramo = TOPES_TRAMO_REEMBOLSO_GENERAL[indiceTramo]

  return {
    numeroReembolso: aprobadosGenerales + 1,
    topeTramo,
    remanenteAnual,
    topeFinal: Math.min(topeTramo, remanenteAnual),
    bloqueadoPorTramos,
  }
}

type FilaDecisionDialisisAprobada = {
  monto_aprobado: number | null
  solicitudes: {
    fecha_solicitud: string
    tipos_ayuda: { nombre: string } | null
  } | null
}

// US-15.03: "el cálculo se realiza por persona beneficiaria" (a diferencia
// del pool de EPIC 14, que es por grupo familiar) · "considera mes
// calendario". El criterio original dice "reembolsos aprobados o pagados,
// según regla definida" sin especificar cuál — se usa "aprobados"
// (decisiones_solicitud.decision = 'aprobada'), la misma base que ya usa el
// remanente anual de US-25.02/14.05, para no introducir un segundo criterio
// de cómputo en el mismo módulo.
async function listarDecisionesDialisisAprobadasDePersona(
  personaId: string,
  anio: number,
  mes: number
): Promise<FilaDecisionDialisisAprobada[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decisiones_solicitud')
    .select('monto_aprobado, solicitudes!inner(fecha_solicitud, tipos_ayuda(nombre))')
    .eq('decision', 'aprobada')
    .eq('solicitudes.persona_id', personaId)

  if (error) throw error

  const prefijoMes = `${anio}-${String(mes).padStart(2, '0')}`
  const filas = data as unknown as FilaDecisionDialisisAprobada[]
  return filas.filter(
    (fila) =>
      fila.solicitudes?.tipos_ayuda?.nombre === NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS &&
      fila.solicitudes?.fecha_solicitud.startsWith(`${prefijoMes}-`)
  )
}

// US-15.03: "el sistema muestra acumulado actual" / "saldo disponible del
// mes" — tope mensual de diálisis, independiente del pool anual general.
export async function calcularAcumuladoDialisisMensual(
  personaId: string,
  anio: number,
  mes: number
): Promise<AcumuladoDialisisMensual> {
  const decisiones = await listarDecisionesDialisisAprobadasDePersona(personaId, anio, mes)
  const acumuladoMensual = decisiones.reduce((total, fila) => total + (fila.monto_aprobado ?? 0), 0)

  return {
    acumuladoMensual,
    saldoDisponible: Math.max(0, TOPE_MENSUAL_DIALISIS - acumuladoMensual),
  }
}

export async function obtenerPagoDeSolicitud(
  solicitudId: string
): Promise<PagoReembolsoConNombre | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pagos_reembolso')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const pago = data as PagoReembolso
  const { data: nombre } = await supabase.rpc('nombre_usuario', {
    p_user_id: pago.registrado_por,
  })

  return { ...pago, registrado_por_nombre: nombre ?? null }
}
