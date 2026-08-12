# Prompt — Saldar deuda: columnas Sector y Tramo RSH en listado de solicitudes

> Pegar en Claude Code. Story chica y acotada que cierra la deuda dejada por la Tanda A:
> el listado de solicitudes se vistió sin las columnas de sector y tramo RSH porque
> `listarSolicitudes()` no traía esos campos. Esta story extiende la consulta y agrega las
> columnas a la pantalla YA vestida. Volumen del listado: decenas de filas (join directo, sin
> preocupación de rendimiento).

## Contexto

Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase. El sistema de diseño Coinco
ya está adoptado en el listado de solicitudes (Tanda A). Faltan dos columnas —**sector** y
**tramo RSH**— que se omitieron porque `listarSolicitudes()` no las devuelve: ambas viven en el
grupo familiar, no en la solicitud. El sector y el RSH son datos del grupo familiar relacionado.

Objetivo: extender la consulta para traer esos dos campos vía join con la tabla de grupos
familiares, tiparlos, y agregar las dos columnas al listado ya vestido, usando los componentes
del sistema de diseño existentes. No cambiar nada más.

## Paso 0 — Inspección (antes de tocar código)

1. Localiza `listarSolicitudes()` (o la función real que alimenta el listado) y muéstrame su
   `select` actual y el tipo TypeScript que retorna.
2. Confirma en el esquema el nombre real de la relación entre `solicitudes` y el grupo familiar
   (nombre de la tabla —¿`grupos_familiares`?— y de la foreign key), y los nombres reales de los
   campos de **sector** y **tramo RSH** en esa tabla.
3. Muéstrame el componente del listado ya vestido y cómo define hoy sus columnas.
4. Confirma si el tramo RSH y su condición de excepción (>40%) ya se representan en algún lado
   con `EstadoBadge`/`BadgeExcepcion`, para reutilizar el mismo tratamiento.

Reporta hallazgos y **espera confirmación** antes de aplicar cambios.

## Paso 1 — Extender la consulta

Modifica `listarSolicitudes()` para incluir el join anidado al grupo familiar y devolver sector
y tramo RSH. Usar los nombres reales detectados en el Paso 0. Referencia (ajustar nombres):

```typescript
.from('solicitudes').select(`
  id, tipo_ayuda, fecha, estado, grupo_familiar_id,
  grupo_familiar:grupos_familiares ( sector, tramo_rsh )
`)
```

- No cambiar filtros, orden ni paginación existentes; solo agregar los campos al select.
- Si ya existe un tipo/DTO para el resultado, extiéndelo con los dos campos nuevos (evitar `any`).
- Manejar el caso de relación nula (solicitud sin grupo familiar asociado, si es posible en los
  datos): el campo se muestra vacío/"—", no rompe el render.

## Paso 2 — Agregar las columnas al listado (ya vestido)

Usando SOLO tokens y componentes del sistema existente:

- **Columna Sector**: texto simple con el sistema (`text-text-primary` / `text-text-muted`).
- **Columna Tramo RSH**: el valor destacado en `text-brand-600` (consistente con cómo se muestra
  el RSH en la Ficha de hogar). Si la fila corresponde a una excepción sobre RSH 40%, aplicar el
  tratamiento de excepción YA existente (el estado/tono `exception` / `aprobada_excepcion` que la
  Tanda A dejó en `EstadoBadge`, o `BadgeExcepcion`) — la excepción no se oculta.
- Ubicar las columnas en el orden del diseño original: hogar · tipo de ayuda · **sector** ·
  **tramo RSH** · fecha · estado. Ajustar si el orden real del listado difiere, manteniendo
  coherencia visual.
- Sin hex sueltos ni clases de color literales.

## Criterios de aceptación

- [ ] `listarSolicitudes()` devuelve sector y tramo RSH vía join, con tipos actualizados (sin `any`).
- [ ] Filtros, orden y paginación existentes intactos; la consulta solo sumó campos.
- [ ] Las dos columnas aparecen en el listado ya vestido, con tokens/componentes del sistema.
- [ ] El tramo RSH se muestra destacado (`brand-600`) y las excepciones RSH quedan visibles con
      el tratamiento existente, no ocultas.
- [ ] Filas sin grupo familiar asociado (si ocurren) muestran "—" sin romper el render.
- [ ] Cero hex sueltos / clases de color literales en el archivo del listado.
- [ ] La app compila; el resto del listado se comporta igual que antes.
- [ ] Actualizar en `docs/backlog.md`: marcar la deuda del listado (sección 8) como resuelta ✅.

## Notas de scope

- Solo el listado de solicitudes. No tocar detalle, evaluación ni otras pantallas.
- Solo se extiende la consulta con dos campos; no se rediseña la query ni se cambian permisos.
- Idioma del proyecto: español. Revisar con `/diff` antes de commitear.
