# Prompt Tanda A — Núcleo del flujo diario (adopción del diseño Coinco)

> Pegar en Claude Code DESPUÉS de completar los Prompts 1 y 2 (sistema base + shell +
> Dashboard + Ficha de hogar). Viste las pantallas que el evaluador usa a diario.
> Reutiliza el sistema de diseño existente; NO reinventa componentes.

## Contexto

Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase. La identidad visual de
la Municipalidad de Coinco ya está establecida como sistema de diseño (tokens en
`globals.css`, componentes en `components/ui/`, layout shell con sidebar `brand-800` + topbar).
Ya se vistieron Dashboard y Ficha de hogar. El resto (EPICs 00–26) sigue en blanco/negro y se
adopta por tandas. Esta es la Tanda A: el núcleo del flujo diario del evaluador.

Pantallas de esta tanda (usar las rutas/archivos reales del repo):
- Solicitudes — listado (con filtros)
- Solicitudes — detalle
- Evaluación social
- Aprobación / rechazo
- Personas integrantes
- Catálogo de ayudas

Trabaja UNA pantalla a la vez, verificando antes de pasar a la siguiente.

## Paso 0 — Inventario del sistema de diseño existente (antes de tocar pantallas)

El repo está en el contexto. Antes de vestir nada, inventaría lo que YA existe:
1. Lista `components/ui/` (y carpetas de componentes compartidos). Para cada uno, una línea de
   qué hace y qué props expone. Foco en lo que los pilotos (Prompt 2) pudieron agregar más allá
   del set base `EstadoBadge` / `BadgeExcepcion` / `CardExcepcion` / `Button` / `Card`: tabla
   reutilizable, bloque de filtros, stepper de estados, encabezado de ficha, grupo de métricas.
2. Confirma tokens en `app/globals.css` (`brand-*`, `success-*`, `warning-*`, `danger-*`,
   `neutral-*`, `exception-*`).
3. Localiza los archivos reales de las pantallas de esta tanda y confirma rutas.
4. Para cada pantalla, identifica qué datos reales consulta hoy a Supabase (no inventar).

Muéstrame el inventario y el mapeo pantalla → archivo, y espera mi confirmación antes de aplicar.

## Regla transversal de componentes

- Si el patrón YA existe como componente, úsalo tal cual.
- Si NO existe, CRÉALO en `components/ui/`, tipado y sin hex sueltos, y recién úsalo. Nunca
  color suelto en la pantalla.
- Todo color viene de tokens. `grep` de hex o clases literales (`bg-blue-`, `text-amber-`, etc.)
  en los archivos vestidos debe quedar sin resultados.
- Excepción RSH SIEMPRE vía `BadgeExcepcion` / `CardExcepcion`: visible de inmediato, nunca oculta.

## Paso 1 — Solicitudes: listado
Tabla con hogar, tipo de ayuda, sector, RSH, fecha y `<EstadoBadge>`. Filas con excepción RSH
señalizadas, no escondidas. Barra de filtros (estado, tipo, sector, fecha) con componentes del
sistema; si no hay componente de filtros, créalo. Acciones hacia el detalle con `<Button>`.
Conservar paginación/orden existentes; solo vestir.

## Paso 2 — Solicitudes: detalle
Encabezado con `brand-800` (o el componente de encabezado si los pilotos lo crearon): hogar,
tipo, estado (`<EstadoBadge>`), fecha. Si es excepción RSH, envolver el bloque en
`<CardExcepcion>` con `<BadgeExcepcion>` arriba, no en pestaña secundaria. Secciones en `<Card>`.
Acciones (evaluar, aprobar, rechazar) con `<Button>`, respetando permisos de rol.

## Paso 3 — Evaluación social
Formulario/vista vestido con tokens y componentes. Campos y validaciones NO se tocan; solo
presentación. Si muestra RSH y su condición de excepción, tratamiento consistente con listado
y detalle.

## Paso 4 — Aprobación / rechazo
Estados resultantes con `<EstadoBadge>`. Aprobar = `<Button variant="primary">`; rechazar =
secundaria o de peligro (`danger-*` si se trata como destructiva). Conservar transición de
estados y permisos.

## Paso 5 — Personas integrantes
Listado/gestión de integrantes del grupo familiar; dejar claro a qué hogar pertenecen (el grupo
familiar es la unidad central). Tabla o tarjetas con el sistema. Marcas de dato sensible con la
señalización `gold` reservada, respetando acceso por rol.

## Paso 6 — Catálogo de ayudas
Listado (tipos de ayuda, materiales, montos/topes) vestido con tokens y componentes. Estados de
disponibilidad/stock con tokens semánticos. Conservar lógica de topes y categorías.

## Criterios de aceptación

- [ ] Cada pantalla renderiza dentro del shell, con identidad Coinco vía tokens y componentes.
- [ ] Cero hex sueltos y cero clases de color literales (`grep` limpio) en los archivos vestidos.
- [ ] Componentes existentes reutilizados; los nuevos quedaron en `components/ui/`, tipados.
- [ ] Excepción RSH visible de inmediato donde aplica (listado, detalle, evaluación).
- [ ] Datos reales de Supabase; nada inventado. Lo no disponible se omite o marca pendiente.
- [ ] Permisos por rol y lógica de negocio intactos (solo cambió presentación).
- [ ] La app compila y cada pantalla se comporta igual que antes.
- [ ] Reporte final: componentes reutilizados y nuevos creados (insumo para Tandas B, C, D).
- [ ] Actualizar `docs/backlog.md` al cerrar la tanda.

## Notas de scope
- Solo estas 6 pantallas. Terreno/móvil (B), reembolsos/informes (C), administración (D) van después.
- No cambies lógica de negocio, consultas ni permisos: solo presentación.
- Idioma: español. Al terminar, revisar con `/diff` antes de commitear.