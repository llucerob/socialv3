import {
  TIPOS_DOCUMENTO,
  TIPO_DOCUMENTO_LABELS,
  ESTADO_VALIDACION_DOCUMENTO_LABELS,
  ESTADOS_RETENCION_DOCUMENTO,
  ESTADO_RETENCION_DOCUMENTO_LABELS,
} from '@/lib/documentos/types'
import type { DocumentoConDetalle, TipoDocumento } from '@/lib/documentos/types'
import { Button } from '@/components/ui/Button'

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function badgeValidacion(estado: DocumentoConDetalle['estado_validacion']) {
  const estilos =
    estado === 'valido'
      ? 'bg-success-bg text-success-fg'
      : estado === 'observado'
        ? 'bg-warning-bg text-warning-fg'
        : 'bg-neutral-bg text-neutral-fg'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${estilos}`}>
      {ESTADO_VALIDACION_DOCUMENTO_LABELS[estado]}
    </span>
  )
}

// US-18.04: estado de conservación — dato no sensible, visible para
// cualquiera que pueda ver el documento (a diferencia del control para
// cambiarlo, que solo se ofrece a administrador).
function badgeRetencion(estado: DocumentoConDetalle['estado_retencion']) {
  const estilos =
    estado === 'bloqueado'
      ? 'bg-danger-bg text-danger-fg'
      : estado === 'vencido' || estado === 'eliminable'
        ? 'bg-warning-bg text-warning-fg'
        : 'bg-neutral-bg text-neutral-fg'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${estilos}`}>
      {ESTADO_RETENCION_DOCUMENTO_LABELS[estado]}
    </span>
  )
}

// US-10.03/US-10.04: listado de documentos con filtro por tipo (finalidad).
// El filtro es un GET simple (?tipo_documento=...) para no requerir JS en el
// cliente, mismo patrón que la búsqueda de hogares (US-03.02).
//
// US-14.02: `puedeValidar`/`accionValidar` son opcionales — el llamador
// (solicitudes/[id]/page.tsx) solo los pasa cuando la solicitud es de tipo
// reembolso y el usuario tiene un rol autorizado; para el resto de usos de
// este componente (documentos de hogar, otras ayudas) el bloque de
// validación simplemente no se renderiza.
//
// US-18.04: `puedeGestionarRetencion`/`accionRetencion`/`accionEliminar` son
// igual de opcionales y solo los pasa un llamador con `profile.rol ===
// 'administrador'` — el resto de roles ve el estado de conservación (dato no
// sensible) pero no el control para cambiarlo ni el botón de eliminar.
export function DocumentosSection({
  documentos,
  baseHref,
  tipoFiltro,
  puedeValidar = false,
  accionValidar,
  puedeGestionarRetencion = false,
  accionRetencion,
  accionEliminar,
  preservarParams,
}: {
  documentos: DocumentoConDetalle[]
  baseHref: string
  tipoFiltro?: TipoDocumento
  puedeValidar?: boolean
  accionValidar?: (documentoId: string, formData: FormData) => Promise<void>
  puedeGestionarRetencion?: boolean
  accionRetencion?: (documentoId: string, formData: FormData) => Promise<void>
  accionEliminar?: (documentoId: string, formData: FormData) => Promise<void>
  // US-22.02: en hogares/[id], esta sección convive con el filtro de hitos
  // (?tipo_hito=...) — sin esto, un <form> GET sin más campos que los suyos
  // enviaría la búsqueda sin el otro parámetro y lo borraría de la URL.
  preservarParams?: Record<string, string>
}) {
  const documentosFiltrados = tipoFiltro
    ? documentos.filter((d) => d.tipo_documento === tipoFiltro)
    : documentos

  return (
    <div className="space-y-3">
      <form className="flex items-center gap-2 text-sm">
        {preservarParams &&
          Object.entries(preservarParams).map(([nombre, valor]) => (
            <input key={nombre} type="hidden" name={nombre} value={valor} />
          ))}
        <label htmlFor="tipo_documento_filtro" className="text-text-muted">
          Filtrar por tipo
        </label>
        <select
          id="tipo_documento_filtro"
          name="tipo_documento"
          defaultValue={tipoFiltro ?? ''}
          className="rounded-lg border border-border bg-transparent px-2 py-1 text-text-primary"
        >
          <option value="">Todos</option>
          {TIPOS_DOCUMENTO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_DOCUMENTO_LABELS[tipo]}
            </option>
          ))}
        </select>
        <Button type="submit" variante="secondary" className="px-2 py-1">
          Filtrar
        </Button>
        {tipoFiltro && (
          <a href={baseHref} className="text-brand-600 underline">
            Ver todos
          </a>
        )}
      </form>

      {documentosFiltrados.length === 0 ? (
        <p className="text-sm text-text-muted">
          {tipoFiltro ? 'Sin documentos de este tipo.' : 'Sin documentos subidos todavía.'}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {documentosFiltrados.map((documento) => {
            const validarConId = accionValidar?.bind(null, documento.id)
            const retencionConId = accionRetencion?.bind(null, documento.id)
            const eliminarConId = accionEliminar?.bind(null, documento.id)

            return (
              <li key={documento.id} className="space-y-2 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {documento.url ? (
                      <a href={documento.url} className="font-medium text-brand-600 underline">
                        {documento.nombre_archivo}
                      </a>
                    ) : (
                      <span className="font-medium text-text-primary">{documento.nombre_archivo}</span>
                    )}
                    <p className="text-xs text-text-muted">
                      {TIPO_DOCUMENTO_LABELS[documento.tipo_documento]} ·{' '}
                      {formatearTamano(documento.tamano_bytes)} · subido por{' '}
                      {documento.subido_por_nombre ?? 'usuario desconocido'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {badgeValidacion(documento.estado_validacion)}
                    {badgeRetencion(documento.estado_retencion)}
                    <span className="text-xs text-text-muted">
                      {new Date(documento.created_at).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                {documento.comentario_validacion && (
                  <p className="text-xs text-text-muted">
                    Comentario de validación: {documento.comentario_validacion}
                    {documento.validado_por_nombre && ` (${documento.validado_por_nombre})`}
                  </p>
                )}

                {puedeValidar && validarConId && (
                  <form action={validarConId} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      name="comentario"
                      placeholder="Comentario (opcional)"
                      defaultValue={documento.comentario_validacion ?? ''}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-text-primary"
                    />
                    <button
                      type="submit"
                      name="estado_validacion"
                      value="valido"
                      className="rounded-lg border border-success-fg/30 px-2 py-1 text-xs font-medium text-success-fg hover:bg-success-bg"
                    >
                      Marcar válido
                    </button>
                    <button
                      type="submit"
                      name="estado_validacion"
                      value="observado"
                      className="rounded-lg border border-warning-fg/30 px-2 py-1 text-xs font-medium text-warning-fg hover:bg-warning-bg"
                    >
                      Marcar observado
                    </button>
                  </form>
                )}

                {puedeGestionarRetencion && retencionConId && eliminarConId && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <form action={retencionConId} className="flex flex-wrap items-center gap-2">
                      <select
                        name="estado_retencion"
                        defaultValue={documento.estado_retencion}
                        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-text-primary"
                      >
                        {ESTADOS_RETENCION_DOCUMENTO.map((estado) => (
                          <option key={estado} value={estado}>
                            {ESTADO_RETENCION_DOCUMENTO_LABELS[estado]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface-alt"
                      >
                        Actualizar conservación
                      </button>
                    </form>
                    <form action={eliminarConId}>
                      <button
                        type="submit"
                        className="rounded-lg border border-danger-fg/30 px-2 py-1 text-xs font-medium text-danger-fg hover:bg-danger-bg"
                      >
                        Eliminar documento
                      </button>
                    </form>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
