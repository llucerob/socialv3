import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { obtenerPersona, obtenerHistorialPersona } from '@/lib/personas/dal'
import { actualizarIntegrante } from '@/lib/personas/actions'
import { PersonaForm } from '../../persona-form'

export default async function EditarIntegrantePage({
  params,
}: {
  params: Promise<{ id: string; personaId: string }>
}) {
  const { id, personaId } = await params
  await requireRole(['administrador', 'evaluador_social'])

  const persona = await obtenerPersona(personaId)
  if (!persona || persona.grupo_familiar_id !== id) {
    notFound()
  }

  const historial = await obtenerHistorialPersona(personaId)
  const actualizarConIds = actualizarIntegrante.bind(null, personaId, id)

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Editar integrante</h1>
        <PersonaForm
          action={actualizarConIds}
          defaultValues={persona}
          submitLabel="Guardar cambios"
        />
      </div>

      <section>
        <h2 className="font-medium">Historial de cambios sensibles</h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin cambios registrados todavía.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {historial.map((cambio) => (
              <li key={cambio.id} className="text-zinc-600 dark:text-zinc-400">
                {new Date(cambio.creado_en).toLocaleString('es-CL')} · {cambio.campo}:{' '}
                {cambio.valor_anterior ?? '—'} → {cambio.valor_nuevo ?? '—'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
