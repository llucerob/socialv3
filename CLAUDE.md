# Sistema de Ayudas Sociales — Municipalidad de Coinco

Sistema web para administrar ayudas sociales del Departamento Social: hogares, solicitudes, evaluación social, aprobación, inventario, entregas, reembolsos médicos y reportes.

## Documentación de referencia (leer bajo demanda, no está precargada aquí)

- `docs/maestro.md` — contexto de negocio completo. Consúltalo si una regla no está clara.
- `docs/backlog.md` — fuente de verdad de historias de usuario. Cada historia tiene ID (US-XX.XX), prioridad, dependencias y criterios de aceptación. **No implementes una funcionalidad sin haber leído su historia correspondiente primero.**

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Estilo de commits: convencional (`feat:`, `fix:`, `chore:`)

## Principio central del proyecto

**El grupo familiar (hogar), no la persona individual, es la unidad de gestión.** Toda ayuda —incluso las que se asocian a un integrante específico, como pañales o reembolsos— debe quedar trazada en el historial del hogar. Al modelar datos nuevos, pregúntate siempre: ¿esto cuelga de `grupos_familiares`?

## Reglas de negocio que nunca deben romperse

- **Elegibilidad RSH:** un hogar con tramo RSH > 40% no puede aprobarse por flujo regular. Requiere excepción explícita (nunca oculta) con informe social asociado.
- **Tope anual de reembolsos médicos:** $100.000 **por grupo familiar**, compartido entre reembolso general y excepcional (cirugía/fallecimiento). Un solo cálculo de remanente (ver US-25.02) debe ser la fuente única — no dupliques esta lógica en otro lugar.
- **Diálisis:** tope mensual $150.000, independiente del esquema general de 4 reembolsos anuales.
- **Excepciones nunca se ocultan:** cualquier ayuda aprobada por excepción (RSH o reembolso) debe quedar visualmente marcada como tal en el historial y en reportes.
- **Hitos e informes sociales son datos sensibles:** requieren RLS restringido a evaluador social/aprobador/administrador. Terreno, bodega y compras nunca acceden a ellos.

## Convención de trabajo por historia

Para cada historia de usuario (US-XX.XX):
1. Migración de base de datos si la historia lo requiere.
2. API / lógica de negocio (rutas de Next.js o funciones de Supabase).
3. Frontend que consume esa API.
4. Verifica tu propio trabajo contra los criterios de aceptación de la historia antes de darla por terminada.

## Seguimiento de avance

Al completar una historia, márcala en `docs/backlog.md` agregando `✅` junto a su ID. Antes de empezar una historia nueva, revisa si sus dependencias ya están marcadas como completas.

## Notas técnicas ya decididas (no las redecidas)

- **EPIC 27 (offline PWA de terreno):** usar el plugin `next-pwa` en vez de escribir el service worker a mano. Alcance acotado: solo cortes momentáneos de señal durante la jornada, no trabajo multi-día offline.
- **US-13.04 (ruteo por cercanía):** usar `@turf/turf` para cálculo de distancia (haversine) + heurística greedy de vecino más cercano, ejecutado en el servidor (API route), no en el cliente. No usar servicios externos de ruteo por calles en esta iteración.

## Comandos (completar una vez configurado el proyecto)

- Dev: `npm run dev`
- Lint: `npm run lint`
- Tests: _pendiente de definir_
