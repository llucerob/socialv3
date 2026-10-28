import type { ReactNode } from 'react'

// MR-07: cómo se completa una ayuda con entrega física, paso a paso, con
// quién hace cada uno. Solo presenta: el estado de cada paso lo calcula la
// página de la solicitud con los datos que ya tiene.
export type EstadoPaso = 'hecho' | 'actual' | 'pendiente'

export type PasoEntrega = {
  titulo: string
  responsable: string
  detalle?: string
  estado: EstadoPaso
}

const CLASES_MARCA: Record<EstadoPaso, string> = {
  hecho: 'bg-success-fg text-white',
  actual: 'bg-brand-800 text-white',
  pendiente: 'border-2 border-border bg-surface text-text-muted',
}

const TEXTO_ESTADO: Record<EstadoPaso, string> = {
  hecho: 'Hecho',
  actual: 'Paso actual',
  pendiente: 'Pendiente',
}

export function PasosEntrega({ pasos, proximoPaso }: { pasos: PasoEntrega[]; proximoPaso: ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pasos.map((paso, index) => (
          <li key={paso.titulo} className="flex items-start gap-3">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${CLASES_MARCA[paso.estado]}`}
              aria-hidden="true"
            >
              {paso.estado === 'hecho' ? '✓' : index + 1}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-semibold ${paso.estado === 'pendiente' ? 'text-text-muted' : 'text-text-primary'}`}
              >
                {paso.titulo}
                <span className="sr-only"> — {TEXTO_ESTADO[paso.estado]}</span>
              </span>
              <span className="block text-xs text-text-muted">{paso.responsable}</span>
              {paso.detalle && <span className="mt-0.5 block text-xs text-text-primary">{paso.detalle}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
        <span className="font-semibold">Próximo paso: </span>
        {proximoPaso}
      </div>
    </div>
  )
}
