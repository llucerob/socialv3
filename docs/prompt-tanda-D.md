# Prompt Tanda D — Administración y transversales (cierre de la adopción del diseño Coinco)

> Pegar en Claude Code DESPUÉS de completar la Tanda C. Viste las pantallas administrativas y
> transversales de menor frecuencia, cerrando la adopción del sistema de diseño en toda la app.
> Reutiliza el sistema existente; NO reinventa componentes ni toca lógica, permisos ni auditoría.

## Contexto

Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase. La identidad Coinco ya está
adoptada en base, shell, Dashboard, Ficha de hogar y Tandas A, B y C. Componentes del sistema
disponibles (base + lo aportado por A/B/C): `EstadoBadge` (con estado de excepción),
`BadgeExcepcion`/`CardExcepcion`, `Button` (`primary`/`secondary`/`ghost`/`danger`), `Card`,
`FiltrosBar`/`CampoFiltro`, medidor de tope, indicador de conexión, y otros que hayan surgido.

Esta es la **Tanda D**, de cierre: pantallas administrativas y transversales. Menor frecuencia de
uso, pero incluye áreas sensibles (protección de datos, auditoría, roles) donde el vestido debe
respetar estrictamente los controles existentes.

### EPICs de esta tanda (usar rutas/archivos reales del repo)
- EPIC 01 — Autenticación y roles (incluye login)
- EPIC 10 — Documentos
- EPIC 16 — Reportes
- EPIC 17 — Auditoría
- EPIC 18 — Protección de datos (Ley 21.719)
- EPIC 19 — Administración
- EPIC 24 — Compras municipales (si está implementada; si fue diferida post-MVP, omitir y anotar)
- EPIC 26 — Incidentes de seguridad

Trabaja UNA pantalla/área a la vez, verificando antes de continuar.

## Paso 0 — Inspección (antes de tocar código)

El repo está en el contexto. Antes de vestir:

1. **Reutilización**: relista `components/ui/` con TODO lo acumulado por las tandas previas.
   Esta es la última tanda: debería reutilizar casi todo y crear muy poco. Anota cualquier
   patrón nuevo genuinamente necesario (p. ej. tabla de log de auditoría, tarjeta de rol/permiso).
2. **Localiza** los archivos reales de cada EPIC de la lista. Para EPIC 24, confirma si está
   implementada o fue diferida post-MVP; si no existe, omítela y regístralo.
3. **Login (EPIC 01)**: localiza la pantalla de login. Es la cara de entrada al sistema y usa el
   **logo horizontal a color** sobre fondo claro (a diferencia del escudo blanco del sidebar).
   Confirma que el asset del logo horizontal está disponible.
4. **Áreas sensibles**: para Auditoría (17) y Protección de datos (18), confirma qué controles de
   acceso y qué lógica de registro existen hoy. El vestido NO altera qué se audita, qué se registra,
   ni quién puede ver qué.
5. Identifica los datos reales que consulta cada pantalla.

Reporta inventario, mapeo EPIC→archivos y estado de EPIC 24, y **espera confirmación** antes de
aplicar cambios.

## Reglas transversales (toda la tanda)

- Reutilizar al máximo; crear componentes solo si es imprescindible, en `components/ui/`, tipados,
  sin hex sueltos.
- Todo color desde tokens. `grep` de hex / clases literales en archivos vestidos = limpio.
- NO tocar: lógica de autenticación, definición de roles/permisos, qué se audita/registra, ni la
  lógica de protección de datos. Solo presentación.
- Respetar y no debilitar ningún control de acceso existente.

## Paso 1 — EPIC 01: Login + autenticación y roles

- **Login**: pantalla centrada, fondo claro (`surface`/`surface-alt`), con el **logo horizontal
  a color** de Coinco. Card de acceso con `<Card>`, campos con el sistema, botón `<Button
  variant="primary">`. Mensajes de error con tokens `danger-*`. Sobrio e institucional.
- **Gestión de roles/usuarios**: listado y edición vestidos. Roles (`repartidor`, `evaluador`,
  `administrador`) mostrados con badges neutros/`brand`. No cambiar la lógica de permisos.

## Paso 2 — EPIC 10: Documentos

- Listado/gestión de documentos con el sistema. Filtros con `FiltrosBar` si aplica. Estados/tipos
  con tokens. Acciones con `<Button>` (eliminar = `danger`, respetando confirmaciones existentes).

## Paso 3 — EPIC 16: Reportes

- Vestir vistas de reportes con tokens y componentes. Si hay gráficos, aplicar la paleta de marca
  (`brand-*`) y tokens semánticos de forma legible; no rediseñar la lógica de los datos, solo su
  presentación. Tablas de resultados con el sistema.

## Paso 4 — EPIC 17: Auditoría

- Vestir la vista de log de auditoría. Si no existe una tabla de log reutilizable, crearla
  (timestamp, actor, acción, entidad). Tipos de acción con tokens semánticos con criterio
  (creación/edición/eliminación/acceso). NO cambiar qué eventos se registran ni su contenido.

## Paso 5 — EPIC 18: Protección de datos (Ley 21.719)

- Vestir las vistas de protección de datos (consentimientos, solicitudes de acceso/rectificación,
  o lo que exista) con el sistema. Datos sensibles con la señalización reservada y respetando
  estrictamente el control de acceso. El vestido nunca expone datos protegidos a quien hoy no los ve.

## Paso 6 — EPIC 19: Administración

- Vestir el panel de administración (parámetros del sistema, catálogos administrativos, etc.) con
  tokens y componentes. Formularios con el sistema; acciones destructivas con `danger` y sus
  confirmaciones existentes.

## Paso 7 — EPIC 26: Incidentes de seguridad

- Vestir listado + detalle de incidentes con el sistema. Estados de incidente con `<EstadoBadge>`
  usando los nombres reales del esquema. Severidad con tokens semánticos (crítica → `danger`,
  media → `warning`, baja → `neutral`/`brand`).

## Paso 8 — EPIC 24: Compras municipales (condicional)

- Solo si está implementada. Vestir con el sistema como las demás. Si fue diferida post-MVP y no
  existe en el repo, OMITIR y registrarlo en el reporte y en el backlog.

## Criterios de aceptación

- [ ] Todas las EPICs existentes de la lista vestidas con identidad Coinco vía tokens/componentes.
- [ ] EPIC 24 vestida si existe, u omitida y registrada si fue diferida.
- [ ] Login usa el logo horizontal a color sobre fondo claro; es sobrio e institucional.
- [ ] Cero hex sueltos / clases de color literales en archivos vestidos (`grep` limpio).
- [ ] Reutilización máxima; los pocos componentes nuevos quedaron en `components/ui/`, tipados.
- [ ] Auditoría y Protección de datos: presentación vestida SIN alterar qué se registra/audita ni
      los controles de acceso. Ningún dato sensible expuesto a roles no autorizados.
- [ ] Lógica de autenticación, roles y permisos intacta.
- [ ] Datos reales; nada inventado. La app compila y todo se comporta igual que antes.
- [ ] Reporte final de cierre: confirmar que TODA la app quedó con identidad Coinco; listar
      cualquier pantalla pendiente o deuda remanente.
- [ ] Actualizar `docs/backlog.md`: marcar Tanda D ✅ y la sección 8 (adopción) como completa.

## Notas de scope

- Última tanda de la adopción. No cambies lógica de negocio, auth, auditoría, consultas ni
  permisos: solo presentación.
- Idioma del proyecto: español. Revisar con `/diff` antes de commitear.
