import { MisEntregasOffline } from '../(protected)/mis-entregas/mis-entregas-offline'

// EPIC 27 (US-27.02/US-27.03) — shell de respaldo que el service worker
// devuelve (next-pwa `fallbacks.document`, ver next.config.ts) cuando una
// navegación falla por falta de conexión. Deliberadamente FUERA de
// (protected): por definición se sirve cuando el servidor es inalcanzable,
// así que no puede depender de requireRole() (que necesita red) — la
// protección real sigue siendo que IndexedDB solo se puebla desde una
// sesión ya autenticada (ver mis-entregas/page.tsx), nunca desde esta
// página. Sin datos de servidor: MisEntregasOffline, sin `entregasIniciales`,
// lee directo de IndexedDB.
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <p className="mb-4 rounded border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
        Sin conexión — mostrando la última ruta guardada en este dispositivo.
      </p>
      <MisEntregasOffline entregasIniciales={null} motivosIniciales={null} />
    </div>
  )
}
