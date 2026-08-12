# Prompt Tanda C — Reembolsos e informes (adopción del diseño Coinco)

> Pegar en Claude Code DESPUÉS de completar la Tanda B. Viste las pantallas de reembolsos
> (general, diálisis, excepcionales) e informes sociales, incluidos hitos sensibles.
> Reutiliza el sistema de diseño existente; NO reinventa componentes ni toca lógica de negocio,
> en especial el cálculo del tope anual por grupo familiar.

## Contexto

Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase. La identidad Coinco ya está
adoptada en base, shell, Dashboard, Ficha de hogar, núcleo diario (Tanda A) y entregas/terreno
(Tanda B). Componentes del sistema disponibles: `EstadoBadge` (incluye estado/tono `exception` /
`aprobada_excepcion`), `BadgeExcepcion`/`CardExcepcion`, `Button` (`primary`/`secondary`/`ghost`/
`danger`), `Card`, `FiltrosBar`/`CampoFiltro`, más lo que hayan agregado las Tandas A y B.

Esta es la **Tanda C**: reembolsos e informes. Es el área con las reglas de negocio más
sensibles del sistema —tope anual por grupo familiar y excepción RSH—, así que la disciplina de
"solo presentación" es especialmente crítica aquí.

### Reglas de negocio a RESPETAR (no modificar, solo visualizar)
- El **tope anual de reembolso es por grupo familiar**, compartido entre reembolsos generales y
  excepcionales, con **fuente única de verdad** (US-25.02). Esta tanda NO recalcula ni duplica esa
  lógica: solo la muestra consumiendo el valor ya calculado.
- La **validación de período** del reembolso general usa la **fecha de solicitud**, no la de la
  boleta. No tocar.
- La **excepción RSH** (>40%) no se oculta jamás.

### EPICs de esta tanda (usar rutas/archivos reales del repo)
- EPIC 14 — Reembolso médico general
- EPIC 15 — Diálisis
- EPIC 25 — Reembolsos excepcionales (cirugía y fallecimiento)
- EPIC 23 — Informes sociales
- Hitos sensibles (tratamiento transversal donde aparezcan)

Trabaja UNA pantalla a la vez, verificando antes de continuar.

## Paso 0 — Inspección (antes de tocar código)

El repo está en el contexto. Antes de vestir:

1. **Reutilización**: relista `components/ui/` y confirma componentes disponibles (de base +
   Tandas A/B). Anota patrones nuevos que esta tanda podría necesitar (p. ej. barra/medidor de
   tope consumido vs. disponible, tabla de reembolsos con montos, encabezado de informe social).
2. **Tope por grupo familiar**: localiza la fuente única de verdad del cálculo del tope (US-25.02)
   —función/servicio/hook— y confirma qué valor expone (tope total, consumido, disponible). La
   pantalla debe CONSUMIR ese valor, no recalcularlo. Muéstrame cómo se accede hoy.
3. **Localiza** los archivos reales de EPIC 14, 15, 25 y 23, y dónde aparecen los hitos sensibles.
4. **Control de acceso**: confirma cómo se protegen hoy los hitos sensibles y los datos de
   informes (roles/permisos). El vestido NO debe debilitar esos controles.
5. Para cada pantalla, identifica los datos reales que consulta a Supabase.

Reporta inventario, mapeo EPIC→archivos y cómo se accede al tope, y **espera confirmación** antes
de aplicar cambios.

## Reglas transversales (toda la tanda)

- Reutilizar componentes; si falta un patrón, crearlo en `components/ui/`, tipado, sin hex sueltos.
- Todo color desde tokens. `grep` de hex / clases literales en archivos vestidos = limpio.
- NO tocar: cálculo del tope (US-25.02), validación de período por fecha de solicitud, permisos
  de rol, ni ninguna consulta. Solo presentación.
- Excepción RSH y datos sensibles: tratamiento visible y consistente (`BadgeExcepcion`/
  `CardExcepcion`; señalización `gold` reservada para excepción e hitos sensibles).

## Paso 1 — EPIC 14: Reembolso médico general

- Listado + detalle vestidos. Estado con `<EstadoBadge>`; filtros con `FiltrosBar`.
- **Tope por grupo familiar visible**: mostrar tope total, consumido y disponible del grupo
  familiar, consumiendo el valor de la fuente única. Si no existe un componente de medidor/barra
  de tope, crearlo (reutilizable, porque EPIC 15 y 25 también lo usan). Destacar con tokens:
  disponible en `success`/`brand`, cercano al límite en `warning`, superado en `danger`.
- Montos y fechas con el sistema. No exponer la fecha de boleta como si fuera la de validación de
  período: respetar que el período se valida por fecha de solicitud (solo mostrar, no recalcular).

## Paso 2 — EPIC 15: Diálisis

- Vestir listado/detalle de reembolsos de diálisis con el sistema. Reutilizar el medidor de tope
  del Paso 1 (mismo tope por grupo familiar, compartido).
- Estados con `<EstadoBadge>`; montos y periodicidad con tokens. Sin duplicar lógica de tope.

## Paso 3 — EPIC 25: Reembolsos excepcionales (cirugía y fallecimiento)

- Vestir con el sistema. Estos comparten el MISMO tope anual por grupo familiar que los generales:
  el medidor de tope debe reflejar el consumo combinado (general + excepcional), consumiendo la
  fuente única. No crear un segundo cálculo.
- Los casos excepcionales suelen implicar excepción RSH: aplicar `CardExcepcion`/`BadgeExcepcion`
  de forma prominente. La excepción no se oculta.
- Acciones con `<Button>` (aprobar = primary; rechazar = `danger` si se trata como destructiva),
  respetando permisos.

## Paso 4 — EPIC 23: Informes sociales

- Vestir la vista/editor de informes sociales con tokens y componentes. Encabezado con `brand-800`
  identificando el grupo familiar (unidad central).
- Estructura del informe en `<Card>`s. No cambiar el modelo de datos ni los campos del informe;
  solo su presentación.
- Si el informe contiene datos sensibles, respetar el control de acceso por rol existente.

## Paso 5 — Hitos sensibles (transversal)

- Donde aparezcan hitos sensibles (en informes, ficha, reembolsos), aplicar la señalización
  reservada: banner/bloque `bg-exception-bg border-l-4 border-exception-border` con ícono de
  candado y el `gold` reservado. Visible solo para roles autorizados; NO debilitar el control de
  acceso. El vestido nunca expone un dato sensible a un rol que hoy no lo ve.

## Criterios de aceptación

- [ ] EPIC 14, 15, 25 y 23 vestidas con identidad Coinco vía tokens y componentes del sistema.
- [ ] Cero hex sueltos / clases de color literales en archivos vestidos (`grep` limpio).
- [ ] El tope por grupo familiar se MUESTRA consumiendo la fuente única (US-25.02); no se
      recalcula ni duplica. El medidor de tope quedó como componente reutilizable.
- [ ] EPIC 25 refleja el consumo combinado (general + excepcional) del MISMO tope.
- [ ] Validación de período (fecha de solicitud) intacta; no se alteró por el vestido.
- [ ] Excepción RSH e hitos sensibles visibles con el tratamiento reservado; control de acceso
      por rol intacto (ningún dato sensible expuesto a roles no autorizados).
- [ ] Datos reales de Supabase; nada inventado. La app compila y todo se comporta igual que antes.
- [ ] Reporte final: componentes reutilizados y nuevos (medidor de tope, etc.) + confirmación de
      que no se tocó el cálculo del tope ni la validación de período.
- [ ] Actualizar `docs/backlog.md`: marcar Tanda C ✅ en la sección 8.

## Notas de scope

- Solo estas EPICs. Administración/transversales (D) va después.
- No cambies lógica de negocio (tope, período), consultas ni permisos: solo presentación.
- Idioma del proyecto: español. Revisar con `/diff` antes de commitear.
