'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

// Mismo criterio que productos/movimientos_stock (EPIC 11): administrador y
// bodega_logistica, no "cualquier rol válido".
const ROLES_PROVEEDORES = ['administrador', 'bodega_logistica'] as const

type ValoresProveedorFormulario = { nombre: string; rut: string; contacto: string }

export type ProveedorFormState = { error?: string; valores: ValoresProveedorFormulario } | undefined

function leerCampos(formData: FormData): ValoresProveedorFormulario {
  return {
    nombre: formData.get('nombre')?.toString().trim() ?? '',
    rut: formData.get('rut')?.toString().trim() ?? '',
    contacto: formData.get('contacto')?.toString().trim() ?? '',
  }
}

export async function crearProveedor(
  _prevState: ProveedorFormState,
  formData: FormData
): Promise<ProveedorFormState> {
  await requireRole([...ROLES_PROVEEDORES])

  const campos = leerCampos(formData)
  if (!campos.nombre || !campos.rut) {
    return { error: 'Nombre y RUT son obligatorios.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .insert({ nombre: campos.nombre, rut: campos.rut, contacto: campos.contacto || null })
    .select('id')
    .single()

  if (error || !data) {
    return {
      error: error?.code === '23505' ? 'Ya existe un proveedor con ese RUT.' : 'No se pudo crear el proveedor.',
      valores: campos,
    }
  }

  revalidatePath('/inventario/proveedores')
  redirect(`/inventario/proveedores/${data.id}`)
}

export async function actualizarProveedor(
  id: string,
  _prevState: ProveedorFormState,
  formData: FormData
): Promise<ProveedorFormState> {
  await requireRole([...ROLES_PROVEEDORES])

  const campos = leerCampos(formData)
  if (!campos.nombre || !campos.rut) {
    return { error: 'Nombre y RUT son obligatorios.', valores: campos }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proveedores')
    .update({ nombre: campos.nombre, rut: campos.rut, contacto: campos.contacto || null })
    .eq('id', id)

  if (error) {
    return {
      error: error.code === '23505' ? 'Ya existe un proveedor con ese RUT.' : 'No se pudo actualizar el proveedor.',
      valores: campos,
    }
  }

  revalidatePath('/inventario/proveedores')
  revalidatePath(`/inventario/proveedores/${id}`)
  redirect(`/inventario/proveedores/${id}`)
}

// US-24.01: "listado de proveedores activos" implica poder desactivar uno
// que ya no corresponda — mismo patrón que sectores/motivos_entrega_fallida.
export async function cambiarEstadoProveedor(id: string, formData: FormData): Promise<void> {
  await requireRole([...ROLES_PROVEEDORES])

  const nuevoEstado = formData.get('estado')?.toString()
  if (nuevoEstado !== 'activo' && nuevoEstado !== 'inactivo') {
    throw new Error('Estado inválido.')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').update({ estado: nuevoEstado }).eq('id', id)

  if (error) {
    throw new Error('No se pudo cambiar el estado del proveedor.')
  }

  revalidatePath(`/inventario/proveedores/${id}`)
  revalidatePath('/inventario/proveedores')
}
