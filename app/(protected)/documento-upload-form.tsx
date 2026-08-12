'use client'

import { useActionState } from 'react'
import type { DocumentoFormState } from '@/lib/documentos/actions'
import { TIPOS_DOCUMENTO, TIPO_DOCUMENTO_LABELS } from '@/lib/documentos/types'
import { Button } from '@/components/ui/Button'

type DocumentoUploadAction = (
  state: DocumentoFormState,
  formData: FormData
) => Promise<DocumentoFormState>

export function DocumentoUploadForm({ action }: { action: DocumentoUploadAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="tipo_documento" className="text-sm font-medium text-text-primary">
          Tipo de documento *
        </label>
        <select
          id="tipo_documento"
          name="tipo_documento"
          required
          defaultValue=""
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {TIPOS_DOCUMENTO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_DOCUMENTO_LABELS[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="archivo" className="text-sm font-medium text-text-primary">
          Archivo *
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          required
          className="text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Subir documento'}
      </Button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger-fg">
          {state.error}
        </p>
      )}
    </form>
  )
}
