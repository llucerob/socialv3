'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'

const ROLES_COMPRAS = ['administrador', 'bodega_logistica'] as const

type ValoresCompraFormulario = {
  producto_id: string
  proveedor_id: string
  numero_orden_compra: string
  fecha_compra: string
  fecha_recepcion: string
  cantidad: string
  valor_unitario: string
  valor_total: string
  documento_tributario: string
}

export type CompraFormState = { error?: string; valores: ValoresCompraFormulario } | undefined

function leerCampos(formData: FormData): ValoresCompraFormulario {
  return {
    producto_id: formData.get('producto_id')?.toString() ?? '',
    proveedor_id: formData.get('proveedor_id')?.toString() ?? '',
    numero_orden_compra: formData.get('numero_orden_compra')?.toString().trim() ?? '',
    fecha_compra: formData.get('fecha_compra')?.toString() ?? '',
    fecha_recepcion: formData.get('fecha_recepcion')?.toString() ?? '',
    cantidad: formData.get('cantidad')?.toString().trim() ?? '',
    valor_unitario: formData.get('valor_unitario')?.toString().trim() ?? '',
    valor_total: formData.get('valor_total')?.toString().trim() ?? '',
    documento_tributario: formData.get('documento_tributario')?.toString().trim() ?? '',
  }
}

// US-24.02: campos mínimos del backlog. Sin criterios de aceptación propios
// más allá de esos campos — se valida lo mínimo razonable (obligatorios,
// números válidos y no negativos), mismo estándar que crearProducto.
export async function crearCompra(
  _prevState: CompraFormState,
  formData: FormData
): Promise<CompraFormState> {
  await requireRole([...ROLES_COMPRAS])

  const campos = leerCampos(formData)

  if (!campos.producto_id) return { error: 'Selecciona un producto.', valores: campos }
  if (!campos.proveedor_id) return { error: 'Selecciona un proveedor.', valores: campos }
  if (!campos.numero_orden_compra) return { error: 'El número de orden de compra es obligatorio.', valores: campos }
  if (!campos.fecha_compra) return { error: 'La fecha de compra es obligatoria.', valores: campos }

  const cantidad = Number(campos.cantidad)
  if (!campos.cantidad || !Number.isInteger(cantidad) || cantidad <= 0) {
    return { error: 'La cantidad debe ser un número entero mayor a cero.', valores: campos }
  }

  const valorUnitario = Number(campos.valor_unitario)
  if (!campos.valor_unitario || Number.isNaN(valorUnitario) || valorUnitario < 0) {
    return { error: 'El valor unitario debe ser un número válido.', valores: campos }
  }

  const valorTotal = Number(campos.valor_total)
  if (!campos.valor_total || Number.isNaN(valorTotal) || valorTotal < 0) {
    return { error: 'El valor total debe ser un número válido.', valores: campos }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compras')
    .insert({
      producto_id: campos.producto_id,
      proveedor_id: campos.proveedor_id,
      numero_orden_compra: campos.numero_orden_compra,
      fecha_compra: campos.fecha_compra,
      fecha_recepcion: campos.fecha_recepcion || null,
      cantidad,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      documento_tributario: campos.documento_tributario || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'No se pudo registrar la compra.', valores: campos }
  }

  revalidatePath('/inventario/compras')
  redirect(`/inventario/compras/${data.id}`)
}
