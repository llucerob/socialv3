// US-14.05: estructura progresiva de montos del reembolso médico general —
// 1º, 2º, 3º y 4º reembolso del año calendario del hogar.
export const TOPES_TRAMO_REEMBOLSO_GENERAL = [50000, 25000, 12500, 12500] as const

// US-25.02 (fuente única, ver CLAUDE.md): tope anual compartido por grupo
// familiar entre reembolsos generales y excepcionales.
export const TOPE_ANUAL_POR_GRUPO_FAMILIAR = 100000

export const MAX_REEMBOLSOS_GENERALES_POR_ANIO = TOPES_TRAMO_REEMBOLSO_GENERAL.length

// Identificación por nombre: el esquema no tiene una columna que distinga
// "reembolso general" de "diálisis" o de un futuro "excepcional" (EPIC 25) —
// solo tipos_ayuda.tipo ('material'/'reembolso') y tipos_ayuda.nombre (texto
// libre, US-06.01). Mismo criterio ya usado en reglas_tipos_ayuda.sql para
// diferenciar comportamiento por nombre exacto.
export const NOMBRE_TIPO_AYUDA_REEMBOLSO_GENERAL = 'Reembolso médico general'
export const NOMBRE_TIPO_AYUDA_REEMBOLSO_DIALISIS = 'Reembolso médico por diálisis'

// 🆕 EPIC 25: los 2 reembolsos excepcionales. Igual que general/diálisis,
// calcularRemanenteReembolsoAnual (lib/reembolsos/dal.ts) ya los suma
// automáticamente por ser tipo='reembolso' y no diálisis — no requiere
// cambios ahí. NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL es el punto único
// para las ramas condicionales de solicitudes/decisiones que sí son propias
// de este par (documentos exigidos, informe social exigido, sin vía de
// excepción al superar el remanente).
export const NOMBRE_TIPO_AYUDA_REEMBOLSO_CIRUGIA = 'Reembolso excepcional por cirugía'
export const NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO =
  'Reembolso excepcional por fallecimiento o servicio funerario'
export const NOMBRES_TIPO_AYUDA_REEMBOLSO_EXCEPCIONAL = [
  NOMBRE_TIPO_AYUDA_REEMBOLSO_CIRUGIA,
  NOMBRE_TIPO_AYUDA_REEMBOLSO_FALLECIMIENTO,
] as const

// US-15.03/15.04: tope mensual de diálisis — "independiente del esquema
// general de 4 reembolsos anuales" (CLAUDE.md), y calculado por PERSONA
// beneficiaria (no por grupo familiar, a diferencia del pool de
// TOPE_ANUAL_POR_GRUPO_FAMILIAR).
export const TOPE_MENSUAL_DIALISIS = 150000

// US-14.07: "la ventana de operación... (febrero a noviembre)" — se
// interpreta como un patrón que se repite cada año calendario (el programa
// no recibe solicitudes generales en diciembre-enero), no como una
// comparación literal contra "el año en curso" del sistema: así una
// solicitud correctamente fechada en marzo de cualquier año pasa la
// validación, sin depender de en qué año se ejecute el envío a evaluación.
export const MES_INICIO_VIGENCIA_REEMBOLSO_GENERAL = 2 // febrero
export const MES_FIN_VIGENCIA_REEMBOLSO_GENERAL = 11 // noviembre
