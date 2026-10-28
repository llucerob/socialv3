import {
  PERIODICIDADES_BENEFICIO,
  PERIODICIDAD_BENEFICIO_LABELS,
  type PeriodicidadBeneficio,
} from '@/lib/beneficios/types'
import { MODALIDAD_ENTREGA_LABELS } from '@/lib/entregas/types'

export type DatosBeneficioAprobacion = {
  // La propuesta del gestor social o, si no hay, la del catálogo.
  periodicidadSugerida: PeriodicidadBeneficio
  permiteEntregaLocal: boolean
}

// MR-08: al aprobar un beneficio periódico se confirma su periodicidad y su
// modalidad de entrega (por defecto a domicilio). Compartido por la
// aprobación regular y la excepción RSH.
export function CamposBeneficio({
  beneficio,
  valores,
  sufijoId,
  claseCampo,
}: {
  beneficio: DatosBeneficioAprobacion
  valores?: { periodicidad?: string; modalidad_entrega?: string }
  sufijoId: string
  claseCampo: string
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-border-subtle p-3">
      <legend className="px-1 text-sm font-medium">Beneficio periódico (hasta diciembre)</legend>
      <div className="space-y-1">
        <label htmlFor={`periodicidad_${sufijoId}`} className="text-sm font-medium">
          Periodicidad *
        </label>
        <select
          id={`periodicidad_${sufijoId}`}
          name="periodicidad"
          required
          defaultValue={valores?.periodicidad ?? beneficio.periodicidadSugerida}
          className={claseCampo}
        >
          {PERIODICIDADES_BENEFICIO.map((periodicidad) => (
            <option key={periodicidad} value={periodicidad}>
              {PERIODICIDAD_BENEFICIO_LABELS[periodicidad]}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-muted">Parte este mes y se entrega cada período hasta el 31 de diciembre.</p>
      </div>
      <div className="space-y-1">
        <span className="text-sm font-medium">Modalidad de entrega *</span>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="modalidad_entrega"
              value="domicilio"
              defaultChecked={(valores?.modalidad_entrega ?? 'domicilio') === 'domicilio'}
            />
            {MODALIDAD_ENTREGA_LABELS.domicilio}
          </label>
          {beneficio.permiteEntregaLocal && (
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="modalidad_entrega"
                value="local"
                defaultChecked={valores?.modalidad_entrega === 'local'}
              />
              {MODALIDAD_ENTREGA_LABELS.local}
            </label>
          )}
        </div>
        {beneficio.permiteEntregaLocal && (
          <p className="text-xs text-text-muted">
            Aunque sea a domicilio, la persona puede retirar en el local la entrega de cualquier mes.
          </p>
        )}
      </div>
    </fieldset>
  )
}
