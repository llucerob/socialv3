export type EstadoTipoAyuda = 'activo' | 'inactivo'

export type TipoAyuda = {
  id: string
  nombre: string
  descripcion: string | null
  tipo: string
  estado: EstadoTipoAyuda
  requiere_aprobacion: boolean
  requiere_entrega: boolean
  requiere_evidencia: boolean
  requiere_persona_beneficiaria: boolean
  requiere_documentos: boolean
  // MR-06: la ayuda se puede entregar en el Departamento Social, además de
  // a domicilio. Solo tiene efecto si requiere_entrega.
  permite_entrega_local: boolean
  tiene_tope_monetario: boolean
  tope_monetario: number | null
  periodicidad: string | null
  creado_por: string | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export type HistorialCambioTipoAyuda = {
  id: string
  tipo_ayuda_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  creado_en: string
}
