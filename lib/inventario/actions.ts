'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { mensajeErrorBeneficio } from '@/lib/beneficios/types'

// US-11.01 criterio: "solo usuarios autorizados pueden modificar inventario".
// Como bodega/administrador (US-11.01/US-11.02/US-11.03), mismo criterio en
// las tres historias de escritura de este EPIC.
const ROLES_INVENTARIO = ['administrador', 'bodega_logistica'] as const

type ValoresProductoFormulario = {
  nombre: string
  categoria: string
  unidad_medida: string
  stock_minimo: string
}

export type ProductoFormState = { error?: string; valores: ValoresProductoFormulario } | undefined

export async function crearProducto(
  _prevState: ProductoFormState,
  formData: FormData
): Promise<ProductoFormState> {
  await requireRole([...ROLES_INVENTARIO])

  const valores: ValoresProductoFormulario = {
    nombre: formData.get('nombre')?.toString().trim() ?? '',
    categoria: formData.get('categoria')?.toString().trim() ?? '',
    unidad_medida: formData.get('unidad_medida')?.toString().trim() ?? '',
    stock_minimo: formData.get('stock_minimo')?.toString().trim() ?? '0',
  }

  if (!valores.nombre || !valores.categoria || !valores.unidad_medida) {
    return { error: 'Nombre, categoría y unidad de medida son obligatorios.', valores }
  }

  const stockMinimo = valores.stock_minimo ? Number(valores.stock_minimo) : 0
  if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
    return { error: 'El stock mínimo debe ser un número entero mayor o igual a cero.', valores }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: valores.nombre,
      categoria: valores.categoria,
      unidad_medida: valores.unidad_medida,
      stock_minimo: stockMinimo,
    })
    .select('id')
    .single()

  if (error || !data) {
    return {
      error:
        error?.code === '23505'
          ? 'Ya existe un producto con ese nombre.'
          : 'No se pudo crear el producto.',
      valores,
    }
  }

  revalidatePath('/inventario')
  redirect('/inventario')
}

type ValoresEntradaFormulario = { cantidad: string; observacion: string; compra_id: string }

export type EntradaFormState = { error?: string; valores: ValoresEntradaFormulario } | undefined

// US-11.02: "se puede registrar cantidad ingresada" · "el stock aumenta
// automáticamente" (vía trigger aplicar_movimiento_stock, no aquí) · "se
// registra usuario, fecha y observación" (columnas registrado_por/created_at/
// observacion) · "el movimiento queda auditado" (la fila insertada es en sí
// el registro de auditoría). US-24.03: "puede referenciar una compra
// registrada" — compra_id es opcional, no todo ingreso viene de una compra
// formal (EPIC 24 es P2/post-MVP; el ingreso manual sigue funcionando igual).
export async function registrarEntradaStock(
  productoId: string,
  _prevState: EntradaFormState,
  formData: FormData
): Promise<EntradaFormState> {
  await requireRole([...ROLES_INVENTARIO])

  const cantidadRaw = formData.get('cantidad')?.toString().trim() ?? ''
  const observacion = formData.get('observacion')?.toString().trim() || null
  const compraId = formData.get('compra_id')?.toString().trim() || null
  const valores = { cantidad: cantidadRaw, observacion: observacion ?? '', compra_id: compraId ?? '' }

  const cantidad = Number(cantidadRaw)
  if (!cantidadRaw || !Number.isInteger(cantidad) || cantidad <= 0) {
    return { error: 'La cantidad debe ser un número entero mayor a cero.', valores }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('movimientos_stock').insert({
    producto_id: productoId,
    tipo: 'entrada',
    cantidad,
    observacion,
    compra_id: compraId,
  })

  if (error) {
    return { error: 'No se pudo registrar la entrada de stock.', valores }
  }

  revalidatePath('/inventario')
  if (compraId) {
    revalidatePath(`/inventario/compras/${compraId}`)
  }
  redirect('/inventario')
}

type ValoresSalidaFormulario = { producto_id: string; cantidad: string; observacion: string }

export type SalidaFormState = { error?: string; valores: ValoresSalidaFormulario } | undefined

// US-11.03: "la salida se asocia a una solicitud aprobada". 'pendiente_stock'
// también es válido como punto de partida: es el estado que deja esta misma
// acción cuando falla por falta de stock, y bodega debe poder reintentar
// desde ahí una vez que llega nuevo stock.
const ESTADOS_VALIDOS_SALIDA = ['aprobada', 'aprobada_excepcion', 'pendiente_stock']

// MR-08: en un beneficio periódico la salida es de un período (cada caja
// del mes se descuenta por separado). El trigger de movimientos_stock valida
// que el período pertenezca al beneficio y ya haya comenzado.
export async function registrarSalidaStock(
  solicitudId: string,
  periodo: string | null,
  _prevState: SalidaFormState,
  formData: FormData
): Promise<SalidaFormState> {
  await requireRole([...ROLES_INVENTARIO])

  const productoId = formData.get('producto_id')?.toString() ?? ''
  const cantidadRaw = formData.get('cantidad')?.toString().trim() ?? ''
  const observacion = formData.get('observacion')?.toString().trim() || null
  const valores = { producto_id: productoId, cantidad: cantidadRaw, observacion: observacion ?? '' }

  if (!productoId) {
    return { error: 'Selecciona un producto.', valores }
  }

  const cantidad = Number(cantidadRaw)
  if (!cantidadRaw || !Number.isInteger(cantidad) || cantidad <= 0) {
    return { error: 'La cantidad debe ser un número entero mayor a cero.', valores }
  }

  const supabase = await createClient()

  const { data: solicitud, error: errorSolicitud } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', solicitudId)
    .maybeSingle()

  if (errorSolicitud || !solicitud) {
    return { error: 'Solicitud no encontrada.', valores }
  }

  if (!ESTADOS_VALIDOS_SALIDA.includes(solicitud.estado)) {
    return { error: 'La solicitud debe estar aprobada para registrar una salida de stock.', valores }
  }

  const { error: errorInsert } = await supabase.from('movimientos_stock').insert({
    producto_id: productoId,
    tipo: 'salida',
    cantidad,
    solicitud_id: solicitudId,
    periodo,
    observacion,
  })

  if (errorInsert) {
    if (errorInsert.message?.includes('STOCK_INSUFICIENTE')) {
      await supabase.rpc('actualizar_estado_stock_solicitud', {
        p_solicitud_id: solicitudId,
        p_nuevo_estado: 'pendiente_stock',
      })
      revalidatePath(`/solicitudes/${solicitudId}`)
      return {
        error: 'Stock insuficiente: la solicitud quedó marcada como pendiente de stock.',
        valores,
      }
    }
    return {
      error: mensajeErrorBeneficio(errorInsert.message) ?? 'No se pudo registrar la salida de stock.',
      valores,
    }
  }

  // Si la solicitud estaba pendiente de stock y esta salida sí se pudo
  // registrar, vuelve a quedar aprobada. Simplificación: siempre restaura a
  // 'aprobada' — hoy decisiones_solicitud tampoco distingue si la aprobación
  // original fue por excepción (ver lib/decisiones/types.ts), y esa
  // distinción no es un criterio de aceptación de esta historia; el único
  // objetivo aquí es no dejar la solicitud bloqueada.
  if (solicitud.estado === 'pendiente_stock') {
    await supabase.rpc('actualizar_estado_stock_solicitud', {
      p_solicitud_id: solicitudId,
      p_nuevo_estado: 'aprobada',
    })
  }

  revalidatePath(`/solicitudes/${solicitudId}`)
  revalidatePath('/entregas')
}
