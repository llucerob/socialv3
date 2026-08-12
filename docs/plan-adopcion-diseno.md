# Plan de adopción del sistema de diseño — resto de la aplicación

> Contexto: sistema de gestión de ayudas sociales, Municipalidad de Coinco.
> Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase.
> Las EPICs 00–26 están implementadas con estilo blanco/negro por defecto.
> Esto es adopción (aplicar identidad sobre base neutra), no migración de colores conflictivos.

## Estado actual

Ya vestido — Prompts 1 y 2 (completados):
- Sistema de diseño base: tokens Coinco en `globals.css`, componentes `EstadoBadge`,
  `BadgeExcepcion`, `CardExcepcion`, `Button`, `Card`.
- Layout shell: sidebar `brand-800` + escudo blanco, topbar.
- Pantallas piloto: Dashboard del evaluador + Ficha de hogar (grupo familiar).

## Principio de agrupación

Las ~24 pantallas restantes se agrupan en 4 tandas, no en un solo prompt (batch gigante
que falla) ni una por pantalla (agotador, pierde reutilización). Criterio:
- Frecuencia de uso: primero lo diario, al final lo administrativo.
- Afinidad visual: pantallas parecidas juntas, para reutilizar decisiones.
- Contexto coherente: terreno/móvil separado de escritorio por sus restricciones propias.

Cada tanda = 1 prompt independiente y verificable. Se corren en orden; entre una y otra,
revisar con `/diff` antes de continuar.

---

## Tanda A · Núcleo del flujo diario
Prioridad máxima · uso constante.
- Solicitudes (listado + detalle)
- Evaluación social
- Aprobación / rechazo
- Personas integrantes
- Catálogo de ayudas

Patrón dominante: listados con filtros + fichas de detalle + formularios de cambio de estado.

## Tanda B · Entregas y terreno
Incluye PWA móvil — restricciones visuales distintas del escritorio.
- Entregas en domicilio
- Rutas de entrega por cercanía geográfica (EPIC 13)
- Experiencia móvil para terreno (EPIC 20)
- Modo offline acotado de la PWA (EPIC 27)

## Tanda C · Reembolsos e informes
Tocan el tope por grupo familiar y la excepción RSH.
- Reembolso médico general (EPIC 14)
- Diálisis (EPIC 15)
- Reembolsos excepcionales — cirugía y fallecimiento (EPIC 25)
- Informes sociales (EPIC 23)
- Hitos sensibles

## Tanda D · Administración y transversales
Menor frecuencia · cierre.
- Documentos · Reportes · Auditoría · Protección de datos · Administración
- Compras municipales · Incidentes de seguridad (EPIC 26) · Autenticación y roles (EPIC 01)

---

## Notas de ejecución

- Antes de cada tanda, verificar componentes del sistema base (Prompts 1–2) y los nuevos que
  hayan agregado los pilotos. Reutilizar, no re-inventar.
- Si falta un patrón, se agrega como componente en `components/ui/` y recién se usa. Nunca
  estilos sueltos.
- No cambiar lógica de negocio ni consultas; solo presentación.
- Respetar el control de acceso por rol existente (hitos sensibles, protección de datos).
- Datos siempre reales desde Supabase; lo no disponible se omite o marca como pendiente.
- Idioma del proyecto: español.
- Cada tanda se cierra actualizando `docs/backlog.md`.