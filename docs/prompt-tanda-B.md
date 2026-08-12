# Prompt Tanda B — Entregas y terreno (adopción del diseño Coinco)

> Pegar en Claude Code DESPUÉS de completar la Tanda A y saldar la deuda del listado.
> Viste las pantallas de entregas, rutas y la experiencia de terreno (incluida la PWA offline).
> Reutiliza el sistema de diseño existente; NO reinventa componentes ni toca lógica de negocio,
> geoespacial u offline.

## Contexto

Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase. Mapas con Leaflet +
react-leaflet + Mapbox; rutas con `@turf/turf` (nearest-neighbor server-side). La identidad
Coinco ya está adoptada en el sistema base, shell, Dashboard, Ficha de hogar y el núcleo del
flujo diario (Tanda A). Componentes disponibles del sistema, incluyendo lo que aportó la Tanda A:
`EstadoBadge` (con estado/tono `exception` / `aprobada_excepcion`), `BadgeExcepcion`/`CardExcepcion`,
`Button` (variantes `primary`/`secondary`/`ghost`/`danger`), `Card`, `FiltrosBar`/`CampoFiltro`.

Esta es la **Tanda B**: entregas y terreno. Incluye contexto de escritorio (oficina) y móvil
(repartidor en terreno). Objetivo: aplicar la identidad Coinco usando EXCLUSIVAMENTE el sistema
de diseño existente, sin tocar lógica.

### EPICs de esta tanda (usar rutas/archivos reales del repo)
- EPIC 12 — Entregas en domicilio (registro/gestión de entregas)
- EPIC 13 — Rutas de entrega por cercanía geográfica (mapa + optimización)
- EPIC 20 — Experiencia móvil para terreno
- EPIC 27 — Modo offline acotado de la PWA (repartidor en terreno)

Trabaja UNA pantalla/área a la vez, verificando antes de continuar.

## Paso 0 — Inspección (antes de tocar código)

El repo está en el contexto. Antes de vestir nada:

1. **Reutilización**: relista `components/ui/` y confirma qué hay disponible (en especial
   `FiltrosBar`/`CampoFiltro`, `Button variant="danger"`, el estado de excepción en `EstadoBadge`).
   Si algún patrón nuevo de esta tanda no existe (p. ej. tarjeta de parada de ruta, indicador de
   estado de conexión), anótalo para crearlo como componente reutilizable.
2. **Localiza** los archivos reales de EPIC 12, 13, 20 y 27 y confirma sus rutas.
3. **Móvil vs escritorio** — punto clave: determina cómo está resuelto hoy lo móvil de terreno.
   ¿Hay vistas/rutas móviles DEDICADAS (p. ej. una sección para repartidor), o las mismas
   pantallas son responsive? Reporta cuál es el caso, porque define la estrategia:
   - Si hay vistas móviles dedicadas → vestirlas como pantallas propias, optimizadas para uso a
     una mano y pantalla chica.
   - Si es responsive → vestir una sola vez y verificar en ambos viewports (móvil ~380px y desktop).
4. **Mapas**: identifica los componentes de mapa (Leaflet/react-leaflet) y qué de su apariencia
   es configurable vía props/estilos SIN tocar la lógica de datos, capas o el cálculo de rutas.
5. **PWA/offline (EPIC 27)**: localiza service worker, lógica de sincronización y estados de
   conexión. Identifica SOLO los puntos de UI (banners, indicadores, badges de "sin conexión",
   "pendiente de sincronizar") que se pueden vestir. La lógica offline NO se toca.

Reporta inventario, mapeo EPIC→archivos y la estrategia móvil detectada, y **espera mi
confirmación** antes de aplicar cambios.

## Reglas transversales (toda la tanda)

- Reutilizar componentes existentes. Si falta un patrón, crearlo en `components/ui/`, tipado y
  sin hex sueltos, y recién usarlo. Nunca color suelto en la pantalla.
- Todo color desde tokens. `grep` de hex / clases de color literales en archivos vestidos = limpio.
- NO tocar lógica de negocio, geoespacial (`@turf`, optimización de rutas) ni offline (service
  worker, sync, caché). Solo capa de presentación.
- Respetar permisos por rol (el `repartidor` ve lo suyo; no ampliar ni reducir alcances).
- Datos reales de Supabase; lo no disponible se omite o marca pendiente, no se inventa.

## Paso 1 — EPIC 12: Entregas en domicilio

- Listado/gestión de entregas con el sistema. Estado de cada entrega con `<EstadoBadge>`
  (usar los estados reales del esquema: p. ej. programada / en_ruta / entregada / fallida).
- Filtros con `FiltrosBar`/`CampoFiltro` (por estado, fecha, sector/localidad, repartidor).
- Detalle de entrega en `<Card>`: hogar, dirección, ítems, evidencia si existe. Acciones con
  `<Button>` (confirmar entrega = primary; marcar fallida = `danger` si aplica).
- Si la entrega corresponde a un hogar con excepción RSH, mantener visible el tratamiento de
  excepción de forma consistente con el resto de la app.

## Paso 2 — EPIC 13: Rutas de entrega (mapa)

- Vestir el contenedor de la vista de ruta (paneles, listado de paradas, controles) con tokens y
  componentes. El mapa Leaflet en sí: ajustar solo apariencia configurable (marcadores, colores
  de línea de ruta usando tokens de marca donde se pueda) SIN tocar el cálculo `@turf` ni las capas.
- Listado ordenado de paradas de la ruta: si no existe una tarjeta/ítem de parada reutilizable,
  crearla (número de orden, hogar, dirección, estado de entrega con `<EstadoBadge>`).
- Marcadores de mapa: si se pueden estilar, usar `brand-600`/`brand-800` para la ruta y color
  distinto para el punto actual; respetar cualquier codificación de estado existente.

## Paso 3 — EPIC 20: Experiencia móvil de terreno

Según la estrategia detectada en el Paso 0:
- **Vistas dedicadas**: vestirlas priorizando legibilidad en exterior (buen contraste),
  objetivos táctiles grandes (botones cómodos para el pulgar), y jerarquía clara de la tarea
  actual (qué entregar / a quién / dónde). Usar `<Button>` de buen tamaño, `<Card>` por entrega.
- **Responsive**: vestir una vez y verificar en ~380px y desktop; asegurar que la navegación del
  shell colapse adecuadamente en móvil.
- Estados de la tarea de terreno con `<EstadoBadge>`. Nada de hex suelto.

## Paso 4 — EPIC 27: Modo offline de la PWA (solo UI)

- Vestir ÚNICAMENTE los elementos de interfaz del estado offline/sincronización: banner o
  indicador de "sin conexión", badges de "pendiente de sincronizar", avisos de datos en caché.
  Si no existe un componente de indicador de conexión, crearlo como reutilizable.
- Usar tokens semánticos con criterio: sin conexión / pendiente → `warning-*`; sincronizado →
  `success-*`; error de sync → `danger-*`. Coherente con el resto de estados de la app.
- NO modificar el service worker, la estrategia de caché, la cola de sincronización ni la lógica
  de resolución de conflictos. Si algo de eso necesitara cambios para el diseño, PÁRATE y avísame
  en vez de tocarlo.

## Criterios de aceptación

- [ ] EPIC 12, 13, 20 y 27 vestidas con identidad Coinco vía tokens y componentes del sistema.
- [ ] Cero hex sueltos / clases de color literales en los archivos vestidos (`grep` limpio).
- [ ] Componentes existentes reutilizados (`FiltrosBar`, `Button danger`, estado de excepción);
      los nuevos (parada de ruta, indicador de conexión, etc.) quedaron en `components/ui/`, tipados.
- [ ] Estrategia móvil aplicada según lo detectado; si responsive, verificado en ~380px y desktop.
- [ ] Mapas y rutas: solo apariencia; lógica `@turf`/capas/datos intacta.
- [ ] Offline (EPIC 27): solo UI vestida; service worker, sync y caché SIN cambios.
- [ ] Permisos por rol (repartidor) y lógica de negocio intactos.
- [ ] Datos reales; nada inventado. La app compila y todo se comporta igual que antes.
- [ ] Reporte final: componentes reutilizados y nuevos creados (insumo para Tandas C y D) +
      confirmación explícita de que no se tocó lógica offline/geoespacial.
- [ ] Actualizar `docs/backlog.md`: marcar Tanda B ✅ en la sección 8.

## Notas de scope

- Solo estas 4 EPICs. Reembolsos/informes (C) y administración (D) van después.
- No cambies lógica de negocio, geoespacial, offline, consultas ni permisos: solo presentación.
- Idioma del proyecto: español. Revisar con `/diff` antes de commitear.
