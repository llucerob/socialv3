'use client'

import { useActionState } from 'react'
import type { DocumentoFormState } from '@/lib/documentos/actions'
import { TIPOS_DOCUMENTO, TIPO_DOCUMENTO_LABELS } from '@/lib/documentos/types'

type DocumentoUploadAction = (
  state: DocumentoFormState,
  formData: FormData
) => Promise<DocumentoFormState>

export function DocumentoUploadForm({ action }: { action: DocumentoUploadAction }) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="tipo_documento" className="text-sm font-medium">
          Tipo de documento *
        </label>
        <select
          id="tipo_documento"
          name="tipo_documento"
          required
          defaultValue=""
          className="rounded border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/20"
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
        <label htmlFor="archivo" className="text-sm font-medium">
          Archivo *
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          required
          className="text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Subiendo…' : 'Subir documento'}
      </button>

      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
