import { requireRole } from '@/lib/auth/dal'
import type { RolUsuario } from '@/lib/auth/types'
import {
  reporteAyudasEntregadas,
  reporteHogaresBeneficiados,
  reporteReembolsosMedicos,
  reporteReembolsosExcepcionales,
  reporteDialisisMensual,
  reporteEntregasPendientesFallidas,
} from '@/lib/reportes/dal'
import { filasACsv } from '@/lib/reportes/csv'
import type { TipoReembolsoFiltro, TipoExcepcionFiltro, EstadoEntregaFiltroReporte } from '@/lib/reportes/types'

// US-17.06: "exportar reportes... la exportación respeta filtros aplicados
// ... respeta permisos del usuario... no se exportan documentos privados".
// Una sola ruta dinámica para los cinco reportes de EPIC 17, cada uno con el
// mismo rol autorizado que su página (ver app/(protected)/reportes/*) y
// reutilizando exactamente la misma función RPC que la página, para que la
// exportación nunca pueda divergir del listado que el usuario ve en
// pantalla. Ningún reporte toca la tabla `documentos` (evidencia/archivos),
// así que "no exportar documentos privados" se cumple por construcción.
type ReporteSlug =
  | 'ayudas-entregadas'
  | 'hogares-beneficiados'
  | 'reembolsos-medicos'
  | 'reembolsos-excepcionales'
  | 'dialisis'
  | 'entregas-pendientes-fallidas'

const ROLES_POR_REPORTE: Record<ReporteSlug, readonly RolUsuario[]> = {
  'ayudas-entregadas': ['administrador', 'auditor_consulta'],
  'hogares-beneficiados': ['administrador', 'auditor_consulta'],
  'reembolsos-medicos': ['administrador', 'finanzas'],
  'reembolsos-excepcionales': ['administrador', 'finanzas'],
  dialisis: ['administrador', 'finanzas', 'auditor_consulta'],
  'entregas-pendientes-fallidas': ['administrador', 'bodega_logistica'],
}

const REPORTES_VALIDOS = Object.keys(ROLES_POR_REPORTE) as ReporteSlug[]

function esReporteValido(valor: string): valor is ReporteSlug {
  return (REPORTES_VALIDOS as string[]).includes(valor)
}

export async function GET(request: Request, { params }: { params: Promise<{ reporte: string }> }) {
  const { reporte } = await params
  if (!esReporteValido(reporte)) {
    return new Response('Reporte no encontrado', { status: 404 })
  }

  await requireRole([...ROLES_POR_REPORTE[reporte]])

  const searchParams = new URL(request.url).searchParams
  const csv = await construirCsv(reporte, searchParams)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${reporte}.csv"`,
    },
  })
}

async function construirCsv(reporte: ReporteSlug, searchParams: URLSearchParams): Promise<string> {
  switch (reporte) {
    case 'ayudas-entregadas': {
      const filas = await reporteAyudasEntregadas({
        fechaDesde: searchParams.get('fecha_desde') || undefined,
        fechaHasta: searchParams.get('fecha_hasta') || undefined,
        tipoAyudaId: searchParams.get('tipo_ayuda_id') || undefined,
        sector: searchParams.get('sector') || undefined,
      })
      return filasACsv(
        ['Fecha', 'Tipo de ayuda', 'Sector', 'Dirección', 'Beneficiario', 'Monto', 'Excepción'],
        filas.map((f) => [
          f.fecha,
          f.tipo_ayuda_nombre,
          f.sector,
          f.direccion,
          f.persona_nombre,
          f.monto,
          f.es_excepcion ? 'Sí' : 'No',
        ])
      )
    }
    case 'hogares-beneficiados': {
      const filas = await reporteHogaresBeneficiados({
        fechaDesde: searchParams.get('fecha_desde') || undefined,
        fechaHasta: searchParams.get('fecha_hasta') || undefined,
        sector: searchParams.get('sector') || undefined,
      })
      return filasACsv(
        ['Dirección', 'Sector', 'Cantidad de ayudas', 'Última ayuda'],
        filas.map((f) => [f.direccion, f.sector, f.cantidad_ayudas, f.fecha_ultima_ayuda])
      )
    }
    case 'reembolsos-medicos': {
      const tipoReembolsoRaw = searchParams.get('tipo_reembolso')
      const tipoReembolso =
        tipoReembolsoRaw === 'general' || tipoReembolsoRaw === 'dialisis'
          ? (tipoReembolsoRaw as TipoReembolsoFiltro)
          : undefined
      const filas = await reporteReembolsosMedicos({
        fechaDesde: searchParams.get('fecha_desde') || undefined,
        fechaHasta: searchParams.get('fecha_hasta') || undefined,
        tipoReembolso,
      })
      return filasACsv(
        [
          'Fecha solicitud',
          'Tipo',
          'Dirección',
          'Beneficiario',
          'Monto solicitado',
          'Monto aprobado',
          'Monto pagado',
          'Estado',
          'Excepción',
        ],
        filas.map((f) => [
          f.fecha_solicitud,
          f.tipo_reembolso_nombre,
          f.direccion,
          f.persona_nombre,
          f.monto_solicitado,
          f.monto_aprobado,
          f.monto_pagado,
          f.estado,
          f.es_excepcion ? 'Sí' : 'No',
        ])
      )
    }
    case 'reembolsos-excepcionales': {
      const tipoExcepcionRaw = searchParams.get('tipo_excepcion')
      const tipoExcepcion =
        tipoExcepcionRaw === 'cirugia' || tipoExcepcionRaw === 'fallecimiento'
          ? (tipoExcepcionRaw as TipoExcepcionFiltro)
          : undefined
      const filas = await reporteReembolsosExcepcionales({
        fechaDesde: searchParams.get('fecha_desde') || undefined,
        fechaHasta: searchParams.get('fecha_hasta') || undefined,
        tipoExcepcion,
      })
      return filasACsv(
        [
          'Fecha solicitud',
          'Tipo',
          'Dirección',
          'Beneficiario',
          'Monto solicitado',
          'Monto aprobado',
          'Monto pagado',
          'Estado',
        ],
        filas.map((f) => [
          f.fecha_solicitud,
          f.tipo_reembolso_nombre,
          f.direccion,
          f.persona_nombre,
          f.monto_solicitado,
          f.monto_aprobado,
          f.monto_pagado,
          f.estado,
        ])
      )
    }
    case 'dialisis': {
      const anio = searchParams.get('anio')
      const mes = searchParams.get('mes')
      const filas = await reporteDialisisMensual({
        anio: anio ? Number(anio) : undefined,
        mes: mes ? Number(mes) : undefined,
      })
      return filasACsv(
        ['Beneficiario', 'Año', 'Mes', 'Monto acumulado', 'Saldo disponible', 'Excepción'],
        filas.map((f) => [
          f.persona_nombre,
          f.anio,
          f.mes,
          f.monto_acumulado,
          f.saldo_disponible,
          f.tiene_excepcion ? 'Sí' : 'No',
        ])
      )
    }
    case 'entregas-pendientes-fallidas': {
      const estadoRaw = searchParams.get('estado')
      const estado =
        estadoRaw === 'pendiente' || estadoRaw === 'fallida' ? (estadoRaw as EstadoEntregaFiltroReporte) : undefined
      const filas = await reporteEntregasPendientesFallidas({
        estado,
        responsableId: searchParams.get('responsable_id') || undefined,
        sector: searchParams.get('sector') || undefined,
      })
      return filasACsv(
        ['Estado', 'Fecha programada', 'Responsable', 'Tipo de ayuda', 'Sector', 'Dirección', 'Motivo de falla', 'Observación'],
        filas.map((f) => [
          f.estado,
          f.fecha_programada,
          f.responsable_nombre,
          f.tipo_ayuda_nombre,
          f.sector,
          f.direccion,
          f.motivo_fallo,
          f.observacion_fallo,
        ])
      )
    }
  }
}
