# Prompt — Refinamiento institucional del sistema de diseño (estilo Regalos de Navidad)

> Pegar en Claude Code. NO es una tanda nueva ni re-viste pantallas. Las 4 tandas de adopción
> ya corrieron: toda la app consume los tokens de `app/globals.css` y los componentes de
> `components/ui/`. Esto REFINA el lenguaje visual en la RAÍZ para que `socialv3` se sienta más
> institucional, tomando el estilo del proyecto hermano Regalos de Navidad
> (github.com/llucerob/regalos-navidad), que ya está en producción para la misma municipalidad.
> Ambos comparten el azul #003169: esto refina la identidad, no la cambia.

## Objetivo

Portar el CARÁCTER visual de Regalos de Navidad al sistema de diseño de social, sin tocar la
lógica semántica que ya funciona (excepción RSH, estados, permisos, medidor de tope, etc.) y sin
recorrer pantallas una por una. Se cambian 2 lugares —`app/globals.css` y los componentes base de
`components/ui/`— y el cambio se propaga a toda la app.

## Diferencias a cerrar (observadas comparando ambos repos)

| Aspecto        | social hoy                     | Regalos (objetivo)                         |
|----------------|--------------------------------|--------------------------------------------|
| Tipografía     | Arial/Helvetica genérica       | Montserrat Variable                        |
| Fondo app      | Blanco puro #FFFFFF            | Azulado #F2F6FB                             |
| Color de texto | Gris-tierra #2C2C2A           | Azul-gris #1B2B40                           |
| Neutros        | Beige cálido (#F1EFE8/#D3D1C7) | Slate frío (ring-slate-200)                 |
| Tarjetas       | borde + rounded-xl             | rounded-2xl + shadow-sm + ring-1 slate      |
| Botones        | brand-600 #1E5799             | azul #003169, min-h-11, semibold, rounded-lg|
| Foco (a11y)    | sin estilo definido            | outline celeste 3px visible                 |
| Títulos        | peso variable                  | extrabold, tracking-tight, azul             |

## Paso 0 — Inspección (antes de cambiar nada)

El repo de social está en el contexto. El de Regalos es público:
github.com/llucerob/regalos-navidad (referencia clave: `src/app/globals.css`,
`src/app/layout.tsx`, `src/components/ui.tsx`).

1. Lee `app/globals.css` y `app/layout.tsx` actuales de social. Confirma los tokens y la carga de
   fuente (hoy Geist vía next/font).
2. Lista `components/ui/` y, para cada componente base (`Button`, `Card`, `EstadoBadge`,
   `ExcepcionRSH`, `MedidorTope`, `FiltrosBar`, `BannerSensible`, etc.), identifica qué radios,
   sombras, bordes y pesos tipográficos usa hoy. Esos son los puntos que el refinamiento toca.
3. Confirma que NO hay hex sueltos en pantallas que debieran venir de tokens (debería estar limpio
   tras las tandas; si algo quedó suelto, anótalo pero no lo arregles aquí salvo que bloquee).

Reporta hallazgos y **espera mi confirmación** antes de aplicar cambios.

## Paso 1 — Tipografía: Montserrat

- Agregar la fuente. Regalos usa el paquete `@fontsource-variable/montserrat` importado en el
  layout raíz; replicar ese enfoque (o `next/font` con Montserrat si se prefiere consistencia con
  el patrón actual). Instalar la dependencia.
- En `app/layout.tsx`: cargar Montserrat y exponerla como variable de fuente; quitar Geist si deja
  de usarse. `lang="es-CL"`.
- En `app/globals.css`: `--font-sans: "Montserrat Variable", ui-sans-serif, system-ui, "Segoe UI",
  sans-serif;` y que `body` use `var(--font-sans)` (hoy tiene Arial/Helvetica hardcodeada — quitarla).

## Paso 2 — Refinar tokens base en `app/globals.css`

Ajustar SOLO superficies, texto, neutros y fondo; CONSERVAR intactos los tokens semánticos que las
tandas ya usan (brand-*, gold, success/warning/danger/neutral, exception-*). Cambios:

- **Fondo de la app**: introducir `--surface-app: #F2F6FB` (azulado) y que el `body`/contenedor de
  contenido lo use, en vez del blanco puro actual. Las tarjetas blancas resaltan sobre él.
- **Texto primario**: `--text-primary: #1B2B40` (azul-gris) en vez de #2C2C2A.
- **Neutros fríos**: migrar los neutros/bordes cálidos (beige #F1EFE8 / #D3D1C7) hacia la familia
  slate que usa Regalos (p. ej. borde `#E2E8F0`/slate-200, texto apagado slate-600). Mantener los
  NOMBRES de token (`--border`, `--text-muted`, `--surface-alt`) para no romper consumidores; solo
  cambiar sus valores.
- **Foco accesible**: añadir regla global `:focus-visible { outline: 3px solid var(--cyan);
  outline-offset: 2px; }`.
- Conservar la nota de "modo oscuro deshabilitado a propósito" y `color-scheme: light`.
- NO cambiar los hex de marca (#003169, #1E5799) ni los semánticos: su contraste ya fue validado.

## Paso 3 — Refinar los componentes base de `components/ui/`

Aplicar el carácter de Regalos a los componentes, usando SIEMPRE tokens (sin hex sueltos):

- **Button**: altura mínima `min-h-11`, `rounded-lg`, `px-5 py-2.5`, `text-[15px] font-semibold`,
  `transition`, estados `disabled:opacity-50`. Variante primaria sobre el azul de marca
  (#003169 / `brand-800`) con hover a azul más oscuro; secundaria con borde de 2px; mantener la
  variante `danger` que ya existe. (Regalos usa el azul oscuro para el botón primario — alinear.)
- **Card**: `rounded-2xl bg-surface p-5 sm:p-6 shadow-sm ring-1 ring-[color del borde slate]`
  en vez de borde simple + rounded-xl. Sombra sutil, no dura.
- **Título/encabezados** (si hay componente de título, o en el patrón de cabecera): `font-extrabold
  tracking-tight` en azul de marca para h1; subtítulos en texto apagado.
- **EstadoBadge / insignias**: adoptar el patrón `rounded-full px-3 py-1 text-xs font-bold
  ring-1 ring-inset` de Regalos, conservando el mapeo de estados y el tono de excepción actuales.
- **Alertas/BannerSensible/ExcepcionRSH**: conservar su semántica y el dorado reservado; solo
  alinear radios/padding/peso al nuevo lenguaje (borde-l-4, `rounded-lg`, `leading-relaxed`).
- El resto de componentes (`MedidorTope`, `ParadaRuta`, `FiltrosBar`, etc.) heredan el cambio por
  usar Button/Card/tokens; ajustarlos solo si quedan visualmente desalineados.

## Paso 4 — Verificación de propagación (no auditar las 24 pantallas)

Levantar la app y revisar SOLO 4 pantallas representativas para confirmar que el refinamiento se
propagó y nada se rompió:
- Dashboard del evaluador
- Ficha de hogar (con un caso de excepción RSH visible)
- Un listado con filtros (p. ej. Solicitudes)
- Login

En cada una verificar: Montserrat aplicada, fondo azulado, tarjetas con sombra/ring, botones y
focus nuevos, y que la excepción RSH y los estados siguen con su tratamiento correcto.

## Criterios de aceptación

- [ ] Montserrat cargada y aplicada globalmente; Arial/Helvetica eliminada del body.
- [ ] `globals.css`: fondo azulado, texto azul-gris, neutros fríos, focus-visible accesible; tokens
      semánticos y de marca (hex) SIN cambios.
- [ ] Nombres de token preservados (ningún consumidor roto); solo cambiaron valores de neutros/fondo/texto.
- [ ] `Button` y `Card` refinados al patrón de Regalos (radios, sombra, ring, pesos), vía tokens.
- [ ] Semántica intacta: excepción RSH, estados, permisos, medidor de tope, dorado reservado — sin cambios.
- [ ] Cero hex sueltos introducidos en esta tarea (`grep` limpio en los archivos tocados).
- [ ] Las 4 pantallas de verificación se ven refinadas y funcionan igual que antes.
- [ ] La app compila (`npm run build`/`typecheck`).
- [ ] Actualizar `docs/backlog.md` (sección 8): añadir una línea de "Refinamiento institucional
      (estilo Regalos de Navidad)" como ✅, apuntando a que fue cambio de raíz, no de pantallas.

## Notas de scope

- NO re-vestir pantallas una por una. El cambio vive en `globals.css`, `layout.tsx` y los
  componentes base. Las pantallas heredan.
- NO cambiar lógica de negocio, consultas, permisos ni la semántica de color.
- Conservar el azul #003169 y el dorado reservado de excepción: esto refina, no reinventa.
- Idioma del proyecto: español. Revisar con `/diff` antes de commitear.
