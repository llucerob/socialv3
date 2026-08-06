# Prompt 2 de 2 — Pantallas piloto: Dashboard + Ficha de hogar (identidad Coinco)

> Pegar en Claude Code DESPUÉS de completar el Prompt 1 (sistema de diseño base + shell).
> Esta tanda VISTE dos pantallas piloto con el sistema ya existente, para validar que los
> tokens y componentes son suficientes. Si falta algo, se detecta aquí antes de escalar al resto.

---

## Contexto

El sistema de diseño base ya está implementado (Prompt 1): tokens Coinco en `app/globals.css`,
componentes `EstadoBadge`, `BadgeExcepcion`, `CardExcepcion`, `Button`, `Card`, y el layout
shell (sidebar `brand-800` + topbar). Las EPICs 00–26 están implementadas en blanco/negro.

Ahora aplicamos la identidad a **dos pantallas piloto**: el **Dashboard del evaluador** y la
**Ficha de hogar (grupo familiar)**. Objetivo doble: dejarlas con la identidad Coinco, y
**validar el sistema de diseño** — si un componente falta o no alcanza, lo detectamos y lo
agregamos a la base (no lo parcheamos suelto en la pantalla).

Trabaja UNA pantalla a la vez, verificando antes de pasar a la siguiente.

## Paso 0 — Inspección

1. Confirma que los componentes del Prompt 1 existen y se importan bien.
2. Localiza en el código las dos pantallas reales:
   - Dashboard / pantalla de inicio del evaluador (o equivalente ya implementado).
   - Ficha de hogar / grupo familiar (la vista de detalle del hogar).
   Muéstrame sus rutas y su estado actual (qué datos ya cargan desde Supabase).
3. Confirma qué campos reales tienen disponibles (tramo RSH, integrantes, estado, sector,
   marca de excepción, hitos sensibles, historial de ayudas). NO inventes datos: usa lo que
   la pantalla ya consulta. Si un dato del diseño no existe aún, avísame y lo omites o marcas
   como pendiente, no lo falsees.

Muéstrame el resumen y **espera confirmación** antes de tocar código.

## Paso 1 — Dashboard del evaluador

Aplica la identidad usando SOLO tokens y componentes de la base. Estructura objetivo:

- Dentro del shell (sidebar + topbar ya existentes del Prompt 1).
- **Fila de métricas** (Cards `bg-surface`): por evaluar, observadas, excepciones RSH,
  aprobadas del mes. Números en `text-brand-800`, etiquetas en `text-text-muted`. Usa los
  conteos REALES que la pantalla pueda calcular; si alguno no está disponible, omítelo.
- **Cola "Solicitudes por evaluar"** en una `Card`: filas con avatar (iniciales), nombre del
  hogar, glosa (tipo de ayuda · sector · RSH), y `<EstadoBadge>` a la derecha. Las filas con
  excepción RSH usan `<CardExcepcion>` o el fondo/badge de excepción — la excepción NO se oculta.
- **Panel lateral** con "Accesos rápidos" (`Button` primario/secundario hacia rutas reales) y
  "Requiere atención" (excepciones esperando informe, stock bajo, hogares sin georreferenciar
  — solo los que la data real permita calcular).

Regla: si necesitas un patrón visual que no cubre ningún componente base, PÁRATE, agrégalo a
`components/ui/` como componente reutilizable, y recién úsalo. No escribas estilos sueltos.

Verifica contra criterios de aceptación antes de pasar a la ficha.

## Paso 2 — Ficha de hogar (grupo familiar)

Aplica la identidad, recordando que el grupo familiar es la unidad central del sistema:

- **Cabecera de la ficha** con `bg-brand-800`: nombre del hogar, código GF, estado
  (`<EstadoBadge>`), sector/dirección. Escudo o marca sutil si corresponde.
- **Si el hogar tiene excepción RSH**, envuelve la cabecera o un bloque destacado en
  `<CardExcepcion>` con `<BadgeExcepcion>` — visible de inmediato, no escondido en un tab.
- **Bloque de datos clave** (Cards o grid): tramo RSH (destacado en `brand-600`), integrantes,
  ayudas del año, etc. — con datos reales.
- **Hitos sensibles**: si el rol del usuario tiene acceso, muéstralos con señalización `gold`
  (banner tipo `bg-exception-bg border-l-4 border-exception-border` con ícono de candado).
  Respeta el control de acceso por rol que YA exista en el código; no lo debilites.
- **Botones** de acción (Nueva solicitud, Ver historial) con `<Button>` primario/secundario.

Regla de componentes reutilizables igual que en el Paso 1.

## Criterios de aceptación

- [ ] Dashboard y Ficha de hogar renderizan dentro del shell, con identidad Coinco vía tokens.
- [ ] Ambas pantallas usan EXCLUSIVAMENTE componentes/tokens de la base (cero hex sueltos;
      `grep` de hex y clases de color literales en ambos archivos = sin resultados).
- [ ] La excepción RSH es visible de inmediato en ambas pantallas cuando aplica (no oculta).
- [ ] Los hitos sensibles respetan el control de acceso por rol existente.
- [ ] Todos los datos mostrados son reales (de Supabase); nada inventado. Lo no disponible se
      omite o marca como pendiente, no se falsea.
- [ ] Si se creó algún componente nuevo, quedó en `components/ui/` como reutilizable, no inline.
- [ ] Reporte final: lista de qué componentes de la base fueron suficientes y cuáles hubo que
      agregar (esto informa cómo vestir el resto de pantallas después).
- [ ] Verificar cada punto antes de marcar como completado en `docs/backlog.md`.

## Notas de scope

- Solo estas DOS pantallas. El resto de las EPICs se visten en tandas posteriores, una o pocas
  por vez.
- NO cambies lógica de negocio ni consultas; solo la capa de presentación.
- Idioma del proyecto: español.
