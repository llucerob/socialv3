// Sistema de diseño Coinco — Tanda C: medidor de tope consumido/disponible,
// reutilizado por reembolso general (EPIC 14), diálisis (EPIC 15) y
// excepcionales (EPIC 25) — estos dos últimos comparten el MISMO tope anual
// por grupo familiar que el general (CLAUDE.md), así que basta un único
// componente parametrizado por `total`/`disponible`. SOLO presentación:
// recibe valores ya calculados por la fuente única (US-25.02,
// lib/reembolsos/dal.ts) — no hace ninguna cuenta de negocio, solo deriva el
// tono visual a partir del remanente que le pasan.
export function MedidorTope({
  etiqueta,
  total,
  disponible,
  detalle,
}: {
  etiqueta: string
  total: number
  disponible: number
  detalle?: string
}) {
  const consumido = Math.max(0, total - disponible)
  const proporcionDisponible = total > 0 ? disponible / total : 0
  const agotado = disponible <= 0
  const cercaDelLimite = !agotado && proporcionDisponible <= 0.2

  const tono = agotado
    ? { texto: 'text-danger-fg', barra: 'bg-danger-fg' }
    : cercaDelLimite
      ? { texto: 'text-warning-fg', barra: 'bg-warning-fg' }
      : { texto: 'text-brand-800', barra: 'bg-brand-600' }

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-text-primary">{etiqueta}</span>
        <span className={`font-semibold ${tono.texto}`}>
          ${disponible.toLocaleString('es-CL')} disponible
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full rounded-full ${tono.barra}`}
          style={{ width: `${Math.min(100, (consumido / total) * 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">
        ${consumido.toLocaleString('es-CL')} usado de ${total.toLocaleString('es-CL')}
        {detalle ? ` · ${detalle}` : ''}
      </p>
    </div>
  )
}
