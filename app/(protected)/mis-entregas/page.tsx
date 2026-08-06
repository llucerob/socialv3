import { requireRole } from '@/lib/auth/dal'
import { listarMisEntregas } from '@/lib/entregas/dal'
import { listarMotivosEntregaFallidaActivos } from '@/lib/motivos-entrega/dal'
import { MisEntregasOffline } from './mis-entregas-offline'

const ROLES_TERRENO = ['administrador', 'terreno_repartidor'] as const

// US-12.03: "el funcionario ve solo sus entregas" (la RLS de entregas ya
// filtra por responsable_id = auth.uid() para terreno_repartidor) ·
// "se muestra dirección, beneficiario y ayuda" · "se muestra estado" ·
// "no se muestra información sensible innecesaria" — sin motivo de
// solicitud, observaciones internas, evaluación social ni otros documentos.
// US-20.01: tarjetas grandes en vez de tabla densa, pensadas para teléfono.
// EPIC 27: la carga inicial sigue siendo Server Component (auth + datos
// frescos, sin cambios) — el markup de lista/detalle y el registro de
// resultados se movieron a MisEntregasOffline (cliente), que cachea esta
// misma carga en IndexedDB para seguir funcionando si se corta la señal
// después de este punto.
export default async function MisEntregasPage() {
  await requireRole([...ROLES_TERRENO])
  const [entregas, motivos] = await Promise.all([listarMisEntregas(), listarMotivosEntregaFallidaActivos()])

  return <MisEntregasOffline entregasIniciales={entregas} motivosIniciales={motivos} />
}
