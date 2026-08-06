# Prompt 1 de 2 — Sistema de diseño base + layout shell (identidad Coinco)

> Pegar en Claude Code. Story acotada: establece la BASE del sistema de diseño.
> NO viste pantallas existentes todavía (eso es el Prompt 2). Contexto: las EPICs
> 00–26 ya están implementadas en blanco y negro por defecto (sin colores
> institucionales), así que NO hay colores que migrar: esto es adopción, no migración.

---

## Contexto

Stack: **Next.js (App Router) + TypeScript + Tailwind v4 + Supabase**. Las EPICs 00 a 26
ya están implementadas, construidas con el esquema blanco/negro por defecto de Tailwind
(sin paleta institucional). Vamos a introducir la identidad visual de la Municipalidad de
Coinco como un **sistema de diseño reutilizable**: tokens de color, componentes UI
transversales y el layout shell (sidebar + topbar) que las pantallas heredarán.

Esta tanda NO modifica el aspecto de las pantallas de negocio existentes. Solo crea la base.
Vestir las pantallas concretas es una tanda posterior.

Trabaja paso por paso, verificando contra los criterios de aceptación antes de continuar.

## Paso 0 — Inspección (antes de escribir nada)

No asumas el estado del código. Inspecciona y repórtame:

1. Confirma Tailwind v4 (`@import "tailwindcss"` en el CSS, sin `tailwind.config.js` con
   `theme.extend.colors` tradicional). Si es distinto, detente y avísame.
2. Muéstrame el `app/globals.css` actual.
3. Confirma que efectivamente NO hay colores institucionales hardcodeados extendidos por la
   app (un `grep` rápido de hex y de clases de color Tailwind como `bg-blue-`, `bg-indigo-`,
   `text-amber-` sobre `app/` y `components/`). Repórtame si aparece algo inesperado.
4. Revisa la estructura de rutas del App Router: ¿hay un route group tipo `(app)` o un
   layout compartido donde vivan las pantallas internas? ¿Existe ya algún sidebar/topbar,
   aunque sea neutro?
5. Confirma dónde están los assets del logo (escudo en blanco y logo horizontal a color).
   Si no están en el repo, avísame para agregarlos.

Muéstrame un resumen y **espera mi confirmación** antes de aplicar cambios.

## Paso 1 — Reemplazar `app/globals.css` con los tokens Coinco

Reemplaza el contenido completo de `app/globals.css` por exactamente esto:

```css
@import "tailwindcss";

/* ============================================================
   SISTEMA DE DISEÑO — Municipalidad de Coinco
   Colores extraídos del logo institucional oficial.
   Fuente única de verdad: NO escribir hex sueltos en componentes.
   Si falta un color, se agrega aquí, no en la pantalla.
   ============================================================ */

:root {
  /* Base heredada de create-next-app (se mantiene) */
  --background: #ffffff;
  --foreground: #171717;

  /* --- Marca — azul institucional Coinco (escala derivada de #003169) --- */
  --brand-50:  #E7EEF6;
  --brand-100: #B9CDE4;
  --brand-400: #5B87B8;
  --brand-600: #1E5799;  /* ACCIÓN: botones, enlaces, estados activos */
  --brand-800: #003169;  /* MARCA: sidebar, cabeceras, logo, énfasis. NO texto pequeño ni botones */

  /* --- Apoyo — colores del escudo, uso PUNTUAL (no como fondo de UI) --- */
  --gold:  #FFBA2F;  /* RESERVADO: excepción RSH e hitos sensibles. No es warning genérico */
  --green: #00A87A;
  --cyan:  #64D1E1;
  --red:   #FF4153;

  /* --- Semánticos — estados de solicitud/incidente (convención UI, NO el escudo) --- */
  --success-bg: #EAF3DE;  --success-fg: #3B6D11;
  --warning-bg: #FAEEDA;  --warning-fg: #854F0B;
  --danger-bg:  #FCEBEB;  --danger-fg:  #A32D2D;
  --neutral-bg: #F1EFE8;  --neutral-fg: #5F5E5A;

  /* --- Excepción RSH — máxima visibilidad, no se oculta --- */
  --exception-bg:     #FFF3D6;
  --exception-border: #FFBA2F;
  --exception-fg:     #633806;

  /* --- Superficies, texto y bordes --- */
  --surface:      #FFFFFF;
  --surface-alt:  #F1EFE8;
  --text-primary: #2C2C2A;
  --text-muted:   #888780;
  --border:       #D3D1C7;
}

@theme inline {
  /* Base heredada */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Marca */
  --color-brand-50:  var(--brand-50);
  --color-brand-100: var(--brand-100);
  --color-brand-400: var(--brand-400);
  --color-brand-600: var(--brand-600);
  --color-brand-800: var(--brand-800);

  /* Apoyo */
  --color-gold:  var(--gold);
  --color-green: var(--green);
  --color-cyan:  var(--cyan);
  --color-red:   var(--red);

  /* Semánticos */
  --color-success-bg: var(--success-bg);
  --color-success-fg: var(--success-fg);
  --color-warning-bg: var(--warning-bg);
  --color-warning-fg: var(--warning-fg);
  --color-danger-bg:  var(--danger-bg);
  --color-danger-fg:  var(--danger-fg);
  --color-neutral-bg: var(--neutral-bg);
  --color-neutral-fg: var(--neutral-fg);

  /* Excepción RSH */
  --color-exception-bg:     var(--exception-bg);
  --color-exception-border: var(--exception-border);
  --color-exception-fg:     var(--exception-fg);

  /* Superficies */
  --color-surface:      var(--surface);
  --color-surface-alt:  var(--surface-alt);
  --color-text-primary: var(--text-primary);
  --color-text-muted:   var(--text-muted);
  --color-border:       var(--border);
}

/* NOTA: se eliminó el bloque @media (prefers-color-scheme: dark) que venía por
   defecto. La identidad institucional de Coinco es de tono claro; el modo oscuro
   automático rompía los colores de marca. Si más adelante se quiere modo oscuro,
   se implementa de forma controlada con una clase .dark, no con el media query. */

body {
  background: var(--background);
  color: var(--text-primary);
  font-family: Arial, Helvetica, sans-serif;
}
```

Verifica que la app compila tras el reemplazo antes de seguir.

### Reglas de uso de los tokens (respetar en TODO el código de aquí en adelante):
- `--brand-800` (#003169) es SOLO marca: sidebar, cabeceras, títulos, logo. Nunca texto
  pequeño sobre blanco ni botones.
- `--brand-600` (#1E5799) es el color accionable: botones primarios, enlaces, activos.
- `--gold` está RESERVADO para señalar excepción RSH e hitos sensibles. No decorativo,
  no warning genérico (esos usan `--warning-*`).
- Los estados semánticos usan convención universal de color, no los colores del escudo.

## Paso 2 — Componentes UI transversales

Crea en `components/ui/`, todos tipados con TypeScript y SIN hex sueltos (solo clases de token):

### `EstadoBadge.tsx`
Badge de estado con mapa `estado → clases de token`. Cubre estados de solicitud
(`ingresada`, `aprobada`, `observada`, `rechazada`, `anulada`). Además, revisa en el código
real qué otros estados usan las EPICs existentes (incidentes, entregas, reembolsos) y agrégalos
al union type con los nombres REALES del esquema (no inventes nombres). Mapeo de tono → token:
- en curso / ingresada / abierto → `bg-brand-50 text-brand-800`
- aprobada / completada ok → `bg-success-bg text-success-fg`
- observada / en seguimiento / pendiente → `bg-warning-bg text-warning-fg`
- rechazada / crítico → `bg-danger-bg text-danger-fg`
- anulada / inactivo → `bg-neutral-bg text-neutral-fg`

### `ExcepcionRSH.tsx`
Encapsula el tratamiento visual de excepción RSH para que "no se oculta" quede garantizado
por el componente:
- `<BadgeExcepcion />` — pill `bg-exception-bg text-exception-fg border border-exception-border`
  con ícono de alerta y texto "Excepción".
- `<CardExcepcion>{children}</CardExcepcion>` — wrapper `bg-exception-bg` con franja izquierda
  `border-l-4 border-exception-border` (dorado).

### `Button.tsx`
Variantes: `primary` (`bg-brand-600 text-white`), `secondary` (borde + texto `brand-600`),
`ghost`. Estados hover/disabled con tokens.

### `Card.tsx`
Base `bg-surface border border-border rounded-xl`, con slots opcionales de header/footer.

## Paso 3 — Layout shell (sidebar + topbar)

Crea el shell institucional que las pantallas internas heredarán. Si ya existe un layout o
route group `(app)`, intégralo ahí; si no, créalo sin romper las rutas existentes.

- **Sidebar** vertical con fondo `bg-brand-800` (#003169). Arriba, el **escudo en blanco**.
  Ítems de navegación con ícono; el activo con fondo `bg-brand-600`, los inactivos en
  `text-brand-100`. Los ítems deben reflejar los módulos reales ya implementados (Inicio,
  Hogares, Solicitudes, Entregas, Reportes, etc. — usa las rutas que ya existen).
- **Topbar** con fondo `bg-surface`, borde inferior `border-border`. Muestra saludo/título
  de sección a la izquierda y, a la derecha, notificaciones + avatar del usuario.
- El área de contenido usa fondo `bg-surface-alt` (#F1EFE8) para que las Cards blancas resalten.

IMPORTANTE: este paso crea el shell y lo deja disponible como layout, pero NO reescribe el
contenido de las pantallas de negocio. Si envolver las rutas existentes en el shell altera
su render, hazlo de forma que el contenido actual siga mostrándose intacto dentro del shell.

## Criterios de aceptación

- [ ] Confirmado Tailwind v4; `app/globals.css` reemplazado; la app compila.
- [ ] Clases de token (`bg-brand-800`, `bg-exception-bg`, `bg-success-bg`, etc.) se resuelven.
- [ ] `EstadoBadge`, `BadgeExcepcion`, `CardExcepcion`, `Button`, `Card` creados y tipados,
      sin hex sueltos.
- [ ] `EstadoBadge` incluye los estados reales de las EPICs existentes (nombres del esquema).
- [ ] Sidebar con `brand-800` + escudo blanco y topbar creados como layout shell reutilizable.
- [ ] Las pantallas de negocio existentes siguen renderizando su contenido intacto dentro del shell.
- [ ] `--gold` / clases `*exception*` solo en contexto de excepción RSH / hitos sensibles.
- [ ] Verificar cada punto antes de marcar la story como completada en `docs/backlog.md`.

## Notas de scope

- Esta tanda NO viste el Dashboard ni la Ficha de hogar (eso es el Prompt 2).
- NO cambies lógica de negocio. Solo capa de presentación/base.
- Si necesitas un color que no existe como token, agrégalo a `globals.css`, no suelto.
- Idioma del proyecto: español, en nombres visibles y comentarios.
