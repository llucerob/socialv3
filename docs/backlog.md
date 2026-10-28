# Backlog MVP v3 — Sistema de Ayudas Sociales
### Municipalidad de Coinco — Departamento Social

> **Nota de versión:** esta versión cierra las tres brechas mayores identificadas en la revisión de trazabilidad contra el Contexto Maestro v2 (matriz de la sección 61): reembolsos excepcionales por cirugía y fallecimiento (EPIC 25), gestión de incidentes de seguridad (EPIC 26), y modo offline para la PWA de terreno con ruteo automático por cercanía (EPIC 27, más revisión de EPIC 13 y EPIC 03). Los cambios están marcados con **🆕**. Todo lo no mencionado se mantiene igual que en la v2.

**Resumen de cambios de esta versión:**
- 🆕 US-03.06 — Registrar coordenadas del domicilio (nuevo prerrequisito P0 para ruteo automático).
- 🆕 EPIC 13 revisado — se agrega cálculo automático de orden por cercanía geográfica (US-13.04, US-13.05); US-13.02 (ajuste manual) sube de P2 a P1 como función de override, no como mecanismo principal.
- 🆕 EPIC 25 — Reembolsos excepcionales por cirugía y por fallecimiento/servicio funerario (antes sin historias).
- 🆕 EPIC 26 — Gestión de incidentes de seguridad (antes sin historias; relevante de cara a Ley 21.719, vigente desde el 1 de diciembre de 2026).
- 🆕 EPIC 27 — Modo offline acotado para la PWA de terreno (cola local de cambios + sincronización automática al reconectar; **no** contempla trabajo multi-día sin conexión).
- 🆕 US-21.07 a US-21.10 — nuevas pruebas de aceptación del MVP.
- Actualización de sprints, backlog mínimo imprescindible, historias post-MVP, riesgos y resultado esperado.
- 🆕 **Recomendación técnica agregada a US-13.04:** librería (`@turf/turf`), algoritmo de referencia (vecino más cercano) y camino de evolución futuro (PostGIS / OSRM), como cierre de la revisión de los EPICs nuevos (13, 25, 26 y 27). Los EPICs 25, 26 y 27 se revisaron y no requirieron cambios adicionales de contenido — quedan tal como se definieron en esta versión.
- 🆕 **EPIC 14 revisado — cálculo automático de tramos del reembolso general:** se agregan US-14.05 (calcular número de reembolso y tope), US-14.06 (bloquear fuera de tope) y US-14.07 (validar período febrero-noviembre), cerrando el último gap funcional pendiente. Decisión confirmada: el tope anual de $100.000 es **por grupo familiar**, compartido entre reembolsos generales y excepcionales — US-25.02 pasa a ser la fuente única de ese cálculo, reutilizada por ambos EPICs.
- 🆕 **EPIC 01 / EPIC 19 revisados — roles múltiples por usuario (2026-10-27):** un usuario puede tener varios roles y el administrador los asigna desde la ficha del usuario. Ver la sección "EPIC 01 y EPIC 19 — Roles múltiples por usuario" más abajo.

---

## 1. Criterio de priorización

- **P0 — Crítico MVP:** imprescindible para que el sistema funcione.
- **P1 — Importante MVP:** necesario para operación real, pero puede construirse después del flujo base.
- **P2 — Mejora controlada:** deseable para una versión posterior del MVP o primera iteración post-MVP.

---

## EPICs 00–02, 04, 06–12, 14–24 — sin cambios respecto a la v2

*(Se omiten aquí por brevedad; el contenido completo de estos EPICs — preparación técnica, autenticación y roles, panel principal, personas integrantes, catálogo de ayudas, solicitudes, evaluación social, aprobación y rechazo, documentos, entregas en domicilio, reembolsos médicos general y diálisis, auditoría, reportes, protección de datos, administración, hitos, informes sociales y compras municipales — se mantiene exactamente igual que en `Backlog_MVP_v2_Sistema_de_Ayudas_Sociales.md`. Este documento v3 solo detalla los EPICs modificados o nuevos: EPIC 03, EPIC 13, EPIC 20, EPIC 21, EPIC 25, EPIC 26 y EPIC 27. Excepción: EPIC 01 y EPIC 19 se revisaron después de cerrada la v3 para admitir roles múltiples, ver la sección siguiente.)*

---

## EPIC 01 y EPIC 19 — Roles múltiples por usuario 🆕 (revisión 2026-10-27)

**Motivo.** La v2 definió siete roles (US-01.03) y le asignaba exactamente uno a cada usuario. Ese modelo sirve en un equipo grande, pero el Departamento Social de Coinco es chico: la misma persona evalúa y aprueba, o aprueba y lleva la bodega. Con un solo rol por usuario, esa persona no podía hacer su trabajo sin recibir el rol de administrador, que le da acceso a todo. También queda resuelta la nota de trazabilidad del Contexto Maestro (sección 44) sobre "Administrativo Social", "Encargado de Compras" y "Jefatura/Dirección": se cubren combinando los roles existentes, sin crear roles nuevos.

**Los siete roles se mantienen.** Lo que cambia es que se combinan:

| Rol | Qué habilita |
|---|---|
| Administrador | Todo el sistema: catálogos, usuarios, incidentes y cualquier acción de los demás roles. |
| Gestor social (antes "Evaluador social", ver MR-05) | Hogares, integrantes y solicitudes; evaluación social, hitos e informes sociales. |
| Aprobador | Aprueba y rechaza solicitudes (incluida la excepción RSH); lee evaluaciones, hitos e informes. |
| Bodega / logística | Inventario, proveedores, compras y gestión de entregas. |
| Terreno / repartidor | Sus entregas asignadas y rutas, con registro del resultado (también offline). |
| Finanzas | Validación de boletas y registro de pagos de reembolsos. |
| Auditor / consulta | Solo lectura: auditoría, incidentes y reportes. |

### US-01.03 ✅ — Definir roles del sistema (revisada)
**Criterios de aceptación actualizados:**
- Un usuario puede tener uno o varios roles.
- Cada permiso se concede si el usuario tiene **alguno** de los roles que lo habilitan (unión de permisos). En las reglas de visibilidad (documentos sensibles, informes sociales, entregas) el usuario ve la unión de lo que permite cada uno de sus roles.
- Las vistas se adaptan a la combinación: el menú y el dashboard muestran la unión de los de cada rol, sin entradas repetidas y en un orden fijo.
- Un usuario sin ningún rol, o con la cuenta inactiva, no opera (sin cambios respecto de la v2).

### US-19.01 ✅ — Administrar usuarios (revisada)
**Criterios de aceptación actualizados:**
- El administrador asigna los roles de cada usuario con una casilla por rol, con la descripción de lo que habilita cada uno.
- Cada cambio de roles queda auditado en el historial del usuario (antes y después, con etiquetas legibles).
- El administrador puede ajustar sus propios roles (por ejemplo, sumarse "Aprobador"), pero no puede quitarse "Administrador" ni desactivar su propia cuenta, para que el sistema nunca quede sin administrador.

### Decisiones de negocio tomadas en esta revisión
1. **Evaluar y decidir la misma solicitud se permite, pero nunca en silencio.** Con roles múltiples, una persona puede tener evaluador y aprobador. Si registró una evaluación social de la solicitud y después la aprueba o la rechaza, la decisión queda marcada como "Evaluada y decidida por la misma persona", en la propia solicitud y en su historial (que también recorre la auditoría, EPIC 16). No se bloquea porque en un equipo chico a veces hay una sola jefatura; se deja trazado, en la misma línea que "las excepciones nunca se ocultan".
2. **El aprobador lee informes sociales de confidencialidad alta.** Quien decide una excepción (RSH o reembolso excepcional) puede leer el informe en que se apoya. Confidencialidad alta sigue oculta para finanzas, bodega, terreno y auditor.

### Implementación
- **Datos:** `profiles.roles` (lista de `rol_usuario`) reemplaza a `profiles.rol`. La migración copia el rol actual de cada usuario a la lista, así que nadie pierde acceso. Se eliminan `profiles.rol` y la función `current_role()`.
- **Base de datos:** `tiene_rol(array[...])` y `tiene_algun_rol()` reemplazan a `current_role()` en 50 políticas RLS y en todas las funciones SQL que preguntaban por el rol (migración `20260818000001_roles_multiples.sql`). Las funciones de visibilidad (`puede_ver_documento`, `puede_ver_informe_social`, el listado de entregas pendientes) se reescribieron a mano para devolver la unión de permisos.
- **Marca de misma persona:** columna `decisiones_solicitud.decidida_por_quien_evaluo`, calculada por un trigger al insertar la decisión, así cubre los cuatro caminos de decisión (aprobación regular, excepción RSH, excepción de diálisis y rechazo) (migración `20260818000002_decision_misma_persona.sql`).
- **App:** `tieneRol(profile, ROLES_X)` en `lib/auth/roles.ts` reemplaza las comparaciones con un solo rol; `navParaRoles()` y `seccionesParaRoles()` combinan el menú y el dashboard.

### Verificación
- Matriz de lectura por usuario sobre las 33 tablas con RLS: cada rol individual ve lo que le corresponde y un usuario sin roles no ve nada (salvo su propio perfil).
- Combinaciones probadas en la base: evaluador + aprobador (evalúa, decide y la decisión queda marcada; un aprobador que no evaluó no queda marcado), aprobador + bodega (ve inventario y evaluaciones, no puede evaluar), terreno + bodega (ve todas las entregas pendientes, no solo las propias), finanzas + bodega (unión de documentos), sin roles e inactivo (no operan).
- En navegador: el administrador asignó evaluador + aprobador a un usuario; ese usuario vio el menú y el dashboard combinados, evaluó y aprobó una solicitud, y la decisión quedó marcada. El administrador no pudo quitarse su propio rol.
- Pantallas principales de cada rol: las permitidas cargan y las no permitidas redirigen a "sin permiso".
- `tsc`, `lint` y `next build` limpios.

### Despliegue a producción
- La migración elimina `profiles.rol` y `current_role()`: el código anterior falla sin esa columna, así que la app nueva y las migraciones deben desplegarse juntas, con un respaldo previo de la base.
- Migraciones pendientes en producción a la fecha: `20260817000001` a `20260817000003` (revisión de Sprints 1–3) y `20260818000001`–`20260818000002` (roles múltiples).
- Después de desplegar, el administrador debe revisar los roles de cada funcionario y sumar los que correspondan. La migración solo conserva el rol que cada uno tenía.

---

## EPIC 03 — Gestión de grupos familiares 🆕 (una historia agregada)

### US-03.01 a US-03.05 — sin cambios respecto a la v2.

### 🆕 US-03.06 ✅ — Registrar coordenadas del domicilio
Como evaluador social o administrativo,
quiero registrar la latitud y longitud del domicilio del hogar,
para que el sistema pueda calcular un orden de visitas por cercanía geográfica.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:**
- Se puede registrar coordenadas manualmente (ingreso numérico) o marcando un punto en un mapa simple.
- El campo es opcional al crear el hogar, pero queda visualmente marcado como "pendiente de georreferenciar" si no se completa.
- Un hogar sin coordenadas puede seguir operando con normalidad en todo el sistema (solicitudes, entregas, etc.); solo queda excluido del cálculo fino de orden de ruta (ver US-13.04).
- El cambio de coordenadas queda auditado.
📎 Nota: esta historia resuelve el gap señalado en la sección 5 del Contexto Maestro v2 ("el grupo familiar no tenía captura de coordenadas en el backlog"). Pasa de ser un ajuste menor a un prerrequisito directo de EPIC 13, dada la decisión de usar ruteo automático por cercanía.

🆕 Recomendación técnica (mapa satelital para marcar el punto):

Librería: Leaflet (o react-leaflet para Next.js) — gratuita, código abierto, sin API key propia. En Next.js requiere carga dinámica con ssr: false, ya que depende del DOM del navegador.
Proveedor de imagen satelital: Mapbox (incluye estilo satelital, nivel gratuito generoso, sin la fricción de facturación de Google). No usar Google Maps: aunque tiene nivel gratuito (10.000 cargas/mes), exige crear una cuenta de Google Cloud con tarjeta de crédito habilitada desde el inicio — fricción administrativa innecesaria para el volumen de este proyecto.
Evitar Esri World Imagery como opción "sin registro": sus términos de uso actuales restringen uso comercial y ya piden registro — no es la opción sin condiciones que solía ser.
Interacción: clic en el mapa → map.on('click', (e) => ...) entrega e.latlng.lat / e.latlng.lng directamente — se cae el pin y se completan los campos de coordenadas del formulario.
⚠️ Verificar antes de implementar: confirmar el nivel gratuito vigente de Mapbox en mapbox.com/pricing — estas condiciones cambian con frecuencia, igual que ocurrió con Google en 2025.

> **Estado:** el ingreso numérico manual, el marcado "pendiente de georreferenciar" (`GeorreferenciacionBadge`) y la auditoría del cambio (trigger `log_grupo_familiar_cambio_critico`) ya estaban completos de una implementación previa — lo único que faltaba era el mapa. Agregado `components/mapa/SelectorCoordenadas.tsx` (`react-leaflet` + `leaflet`, cargado con `next/dynamic({ssr:false})` en `hogar-form.tsx` porque Leaflet depende de `window`/`document`). Capa satelital de Mapbox si existe `NEXT_PUBLIC_MAPBOX_TOKEN` (variable nueva en `.env.example`, sin valor por defecto); si no está configurada, cae a teselas de OpenStreetMap (gratuitas, sin token) sin bloquear la historia — se lo advierte al usuario en el propio formulario, no en silencio. El mapa abre centrado en la comuna de Coinco cuando el hogar no tiene coordenadas todavía. Los campos numéricos y el mapa quedan sincronizados en ambas direcciones (clic/arrastre del marcador actualiza los inputs; tipear en los inputs recentra el mapa) sobre el mismo estado de React — no se agregó ningún campo ni endpoint nuevo, solo la capa de interacción. El ícono default de Leaflet (que no resuelve bien bajo el bundler de Next.js) se sirve desde unpkg en la misma versión instalada, en vez de pelear con imports de asset binarios. Verificado end-to-end en navegador: mapa centrado en Coinco al crear un hogar nuevo sin coordenadas; en un hogar existente, clic en el mapa y edición manual del campo Latitud actualizaron el marcador y el campo contrario correctamente; al guardar, la base de datos quedó con las coordenadas nuevas y la fila de auditoría correspondiente en `grupos_familiares_historial` (campos `latitud`/`longitud`, valor anterior y nuevo). **No verificado:** la vista satelital real de Mapbox, al no contar con un token en este entorno de desarrollo — el fallback a OpenStreetMap sí se verificó y funciona correctamente.
---

## EPIC 13 — Rutas de entrega 🆕 (revisado: ruteo automático por cercanía)

> **🆕 Cambio de enfoque respecto a la v2.** En la v2, la agrupación por sector (US-13.01) era el mecanismo principal de "ruta" y el ordenamiento fino quedaba diferido (US-13.02, manual, P2). Tras la conversación de alcance, se definió que el **orden de visitas debe calcularse automáticamente por cercanía geográfica**, no solo por sector. Esto convierte a US-13.02 en una función secundaria de ajuste manual (override), y agrega dos historias nuevas como mecanismo principal.

### US-13.01 ✅ — Agrupar entregas por sector
**Prioridad:** P0 · **Dependencias:** US-12.01. *(sin cambios respecto a la v2 — sigue siendo el primer filtro antes de calcular el orden fino).*

### 🆕 US-13.04 ✅ — Calcular orden sugerido de visitas por cercanía geográfica
Como logística,
quiero que el sistema calcule automáticamente el orden de visitas dentro de un sector,
para reducir tiempo de traslado del funcionario en terreno.
**Prioridad:** P0 · **Dependencias:** US-13.01, US-03.06.
**Criterios de aceptación:**
- El cálculo usa las coordenadas de cada hogar (US-03.06) dentro del sector ya agrupado (US-13.01).
- El algoritmo aplicado es una heurística simple de vecino más cercano sobre distancia en línea recta (fórmula haversine), partiendo de un punto de origen configurable (por ejemplo, la sede municipal o el punto de inicio del funcionario).
- **No se requiere** integración con un servicio externo de ruteo por calles (Google Directions, OSRM, etc.) en esta iteración — queda explícitamente para una versión posterior, tal como lo plantea el propio Contexto Maestro (sección 35).
- Los hogares sin coordenadas registradas (US-03.06 pendiente) quedan agrupados al final de la lista del sector, con una marca visual de "sin georreferenciar", sin bloquear el cálculo del resto.
- El orden calculado queda editable manualmente (ver US-13.02).

**🆕 Recomendación técnica:**
- **Librería para el cálculo de distancia:** usar [`@turf/turf`](https://turfjs.org/) (o el paquete modular `@turf/distance`) — MIT, gratuita, activamente mantenida (v7.x), corre tanto en cliente como en servidor (Node.js), por lo que puede ejecutarse en una API route de Next.js o en una Supabase Edge Function. Internamente calcula distancia mediante fórmula haversine, que es exactamente lo que exige el criterio de aceptación anterior. Alternativa más liviana si no se quiere el toolkit completo: `haversine-distance` (sin dependencias).
- **El algoritmo de "vecino más cercano" no lo entrega ninguna librería** — es lógica greedy simple de implementar (recorrer los hogares pendientes, elegir el más cercano al punto actual, repetir). Referencia de implementación:

```js
import { point, distance } from '@turf/turf';

function ordenarPorCercania(origen, hogares) {
  const pendientes = [...hogares];
  const ruta = [];
  let actual = point(origen); // [lng, lat] de la sede municipal, por ejemplo

  while (pendientes.length > 0) {
    let masCercanoIdx = 0;
    let menorDistancia = Infinity;

    pendientes.forEach((hogar, i) => {
      const d = distance(actual, point([hogar.lng, hogar.lat]), { units: 'kilometers' });
      if (d < menorDistancia) {
        menorDistancia = d;
        masCercanoIdx = i;
      }
    });

    const siguiente = pendientes.splice(masCercanoIdx, 1)[0];
    ruta.push(siguiente);
    actual = point([siguiente.lng, siguiente.lat]);
  }

  return ruta;
}
```

- **Dónde ejecutarlo:** en el servidor (API route / Edge Function), no en el cliente — es un cálculo ligado a la integridad de los datos de la ruta, no a la interacción del usuario, y así se evita recalcularlo distinto en cada dispositivo.
- **Por qué no PostGIS todavía:** Supabase permite activar la extensión PostGIS (gratuita, `create extension postgis;`) y resolver esto con el operador `<->` sobre un índice espacial, lo cual es más eficiente a gran escala. Para el volumen de hogares por ruta diaria esperado en Coinco, esto agrega complejidad de mantenimiento sin un beneficio real todavía — se recomienda **migrar a PostGIS solo si el volumen de hogares por sector crece significativamente** (cientos+) o si se necesitan consultas geoespaciales más sofisticadas (ej. "hogares dentro de X km de un punto").
- **Camino de evolución futuro (no en esta iteración):** cuando se quiera pasar de "distancia en línea recta" a "distancia real por camino" (tal como el propio Contexto Maestro sugiere en la sección 35 como versión posterior), las opciones gratuitas son **OSRM** (Open Source Routing Machine, autohospedado) o, si no se quiere mantener infraestructura propia, servicios pagos como Google Directions API o Mapbox Directions.

### US-13.02 ✅ — Ajustar manualmente el orden sugerido ⬆️
Como logística,
quiero poder reordenar manualmente las entregas de una ruta ya calculada,
para corregir casos donde el cálculo automático no refleje bien la realidad del terreno (caminos cortados, preferencia del funcionario, urgencias).
**Prioridad:** ⬆️ P1 (antes P2) · **Dependencias:** 🆕 US-13.04.
**Criterios de aceptación:** se puede reordenar manualmente sobre el resultado de US-13.04 · el funcionario en terreno ve el orden final ya ajustado · el ajuste manual queda registrado (quién y cuándo lo modificó).

> **Nota de re-priorización:** sube de P2 a P1 porque, al pasar a ser una función de *override* sobre un cálculo automático (en lugar de ser el único mecanismo de orden), su ausencia sería más costosa operativamente — el logística necesita poder corregir casos donde la heurística de distancia en línea recta no representa bien un camino rural real (ríos, cerros, caminos cortados).

### US-13.03 ✅ — Abrir dirección en aplicación de mapas
**Prioridad:** P1 · **Dependencias:** US-12.03. *(sin cambios respecto a la v2)*

### 🆕 US-13.05 ✅ — Marcar hogares pendientes de georreferenciar
Como logística o administrador,
quiero ver un listado de hogares sin coordenadas registradas,
para priorizar su regularización y mejorar progresivamente la calidad del ruteo automático.
**Prioridad:** P1 · **Dependencias:** US-03.06, 🆕 US-13.04.
**Criterios de aceptación:** listado filtrable de hogares sin coordenadas · se puede acceder directamente a la ficha del hogar para completarlas · el listado se actualiza en tiempo real conforme se van georreferenciando hogares.

> **Estado (US-13.01 a US-13.05):** verificado end-to-end en local (REST directo para RLS + navegador real con cuatro roles: administrador, bodega, dos funcionarios de terreno). El sector se filtra en JS sobre el resultado ya embebido de `listarEntregas()` (join de dos niveles entregas→solicitudes→grupos_familiares que PostgREST no filtra de forma confiable en un solo request) — a la escala de una comuna esto es correcto y evita pelear con las limitaciones de embedded filters de PostgREST. El orden calculado y los ajustes manuales viven en una sola columna `entregas.orden_ruta`, auditada automáticamente por el mismo trigger de `entregas_historial` que ya existía (EPIC 12) — no se necesitó código nuevo para "el ajuste manual queda registrado (quién y cuándo)": el intercambio de posición (▲/▼) y el cálculo automático son ambos un UPDATE sobre esa columna. El cálculo (US-13.04) corre en una API route dedicada (`app/api/rutas/calcular-orden`), no en una Server Action, conforme a la decisión técnica ya tomada (ver CLAUDE.md) — usa `@turf/turf` para la distancia haversine y una heurística greedy de vecino más cercano, partiendo de un punto de origen configurable en una tabla singleton (`configuracion_rutas`, editable solo por administrador en `/rutas/configuracion`, mismo criterio de EPIC 06). Verificado con un caso de prueba de 4 hogares (uno cercano al origen, uno lejano, uno muy cercano al primero, y uno sin coordenadas): el cálculo produjo el orden correcto (cercano → segundo-cercano → lejano → sin-georreferenciar-al-final), y un ajuste manual posterior (mover arriba/abajo) persistió correctamente y quedó reflejado tanto para bodega como para el funcionario de terreno en `/rutas` (agrupado por sector, con el orden ya ajustado — US-13.02). "Abrir en mapas" (US-13.03) genera un link de Google Maps con lat/lng cuando existen coordenadas, y cae a una búsqueda por texto de la dirección cuando no — verificado en las cuatro superficies que listan entregas (`/entregas`, `/mis-entregas`, `/mis-entregas/[id]`, `/rutas`). US-13.05 (`/hogares/pendientes-georreferenciar`) verificado con actualización en tiempo real genuina: se actualizó la coordenada de un hogar directamente en la base de datos mientras la página estaba abierta (sin recargar) y el hogar desapareció del listado automáticamente, confirmando la suscripción a Supabase Realtime (tabla agregada a la publicación `supabase_realtime`, respetando la RLS existente de `grupos_familiares`). RLS verificada explícitamente: evaluador social no puede leer ni escribir `configuracion_rutas` ni entrar a `/entregas`/`/rutas`; bodega puede leer pero no actualizar `configuracion_rutas` (0 filas afectadas, sin error) ni acceder a `/rutas/configuracion`; solo administrador puede editar el punto de origen.

---

## EPIC 14 — Reembolsos médicos 🆕 (revisado: cálculo automático de tramos y período de vigencia)

> **🆕 Cambio respecto a la v2.** En la v2, EPIC 14 no tenía historias de cálculo automático de tramos, a diferencia de diálisis (EPIC 15) y de los casos excepcionales (EPIC 25). Se agregan tres historias que cierran esta brecha, reutilizando el mismo cálculo de remanente anual compartido de 🆕 US-25.02 — con la decisión ya confirmada de que **el tope anual de $100.000 es por grupo familiar**, compartido entre reembolsos generales y excepcionales.

### US-14.01 ✅ — Crear solicitud de reembolso médico general
**Prioridad:** P0 · **Dependencias:** EPIC 07.

### US-14.02 ✅ — Validar documentos de reembolso
**Prioridad:** P1 · **Dependencias:** US-14.01.

### US-14.03 ✅ — Aprobar monto de reembolso ⬆️
**Prioridad:** P0 · **Dependencias:** US-14.01, 🆕 US-14.05.
**Criterio actualizado respecto a la v2:** el monto aprobado no puede superar ni el monto solicitado ni el tope calculado automáticamente en 🆕 US-14.05 (lo que sea menor).

### US-14.04 ✅ — Registrar pago de reembolso
**Prioridad:** P0 · **Dependencias:** US-14.03.

### 🆕 US-14.05 ✅ — Calcular automáticamente el número de reembolso y su tope correspondiente
Como sistema,
quiero calcular automáticamente qué número de reembolso general corresponde a una solicitud (1º, 2º, 3º o 4º) y su tope asociado,
para aplicar correctamente la estructura progresiva de montos definida en el proyecto ($50.000 / $25.000 / $12.500 / $12.500).
**Prioridad:** P0 · **Dependencias:** US-14.01, 🆕 US-25.02.
**Criterios de aceptación:**
- El sistema cuenta cuántos reembolsos médicos **generales** ya fueron aprobados este año calendario para el grupo familiar, y determina si la solicitud actual corresponde al 1º, 2º, 3º o 4º.
- Si el hogar ya tiene 4 reembolsos generales aprobados en el año, el sistema bloquea una nueva solicitud general (el hogar solo podría acceder a un reembolso excepcional vía EPIC 25, si corresponde).
- El sistema calcula, además, el **remanente disponible del pool anual de $100.000 por grupo familiar**, reutilizando exactamente el mismo cálculo ya definido en 🆕 US-25.02 (suma de reembolsos generales + excepcionales aprobados este año) — no se duplica la lógica, se reutiliza.
- El **tope final aprobable** para la solicitud es el **menor valor** entre (a) el tope teórico del tramo correspondiente (50k/25k/12,5k/12,5k) y (b) el remanente disponible del pool anual. Esto asegura que un reembolso excepcional usado antes en el año reduzca correctamente lo disponible para los reembolsos generales posteriores, y viceversa.

> **📎 Nota de consistencia:** esta historia formaliza que 🆕 US-25.02 pasa a ser la **fuente única de cálculo** del remanente anual por grupo familiar — tanto EPIC 14 como EPIC 25 la reutilizan, en vez de mantener dos cálculos independientes que podrían divergir con el tiempo.

### 🆕 US-14.06 ✅ — Bloquear aprobación fuera de los topes calculados
Como sistema,
quiero impedir que se apruebe un monto superior al tope calculado por 🆕 US-14.05,
para que la regla de tramos progresivos y el tope anual compartido se respeten siempre, sin depender de que el aprobador lo revise manualmente.
**Prioridad:** P0 · **Dependencias:** 🆕 US-14.05, US-14.03.
**Criterios de aceptación:** el sistema no permite ingresar ni confirmar un monto aprobado mayor al tope calculado · si el remanente disponible es $0, el sistema no permite aprobar un nuevo reembolso general y muestra el motivo (pool anual agotado) · el bloqueo queda auditado.

### 🆕 US-14.07 ✅ — Validar periodo de vigencia del reembolso general (febrero-noviembre)
Como sistema,
quiero validar que una solicitud de reembolso médico general se realice dentro del período vigente,
para cumplir con la ventana de operación definida en el proyecto (febrero a noviembre).
**Prioridad:** P0 · **Dependencias:** US-07.03, US-14.01.
**Criterios de aceptación:**
- El sistema valida que la **fecha de la solicitud** esté entre el 1 de febrero y el 30 de noviembre del año en curso.
- Fuera de ese rango, el sistema bloquea el envío de la solicitud con un mensaje explicativo (no la deja pasar a evaluación).
- ✅ **Confirmado con el equipo del proyecto:** la validación es contra la fecha de la solicitud, independiente de la fecha del gasto médico en la boleta. Una boleta con fecha fuera del período febrero-noviembre no invalida la solicitud, siempre que esta se presente dentro de la ventana vigente.

> **Estado (US-14.01 a US-14.07):** verificado end-to-end en local (REST directo para RLS/triggers + navegador real con cuatro roles: evaluador social, aprobador, finanzas y administrador). US-14.01 ya estaba cubierta funcionalmente por el flujo genérico de EPIC 07 (el tipo de ayuda "Reembolso médico general" ya exige persona beneficiaria y monto solicitado); solo se removió una nota obsoleta en el formulario que decía que la adjuntación de documentos esperaba a EPIC 10 (ya implementado). US-14.02 agrega columnas de validación (`estado_validacion`, `comentario_validacion`, `validado_por`/`validado_en` autocompletados por trigger) a la tabla `documentos` de EPIC 10, en vez de una tabla nueva — la UI expone el control de validar solo en solicitudes de tipo reembolso. US-14.04 agrega `pagos_reembolso` (un pago por solicitud, monto acotado al aprobado por un trigger — mismo criterio de robustez que `movimientos_stock` de EPIC 11) y reutiliza el patrón `marcar_solicitud_*_pagada`/`entregada_pagada` ya usado en EPIC 12. US-14.05 formaliza `lib/reembolsos/dal.ts` como fuente única del cálculo de remanente anual (excluye diálisis explícitamente, que tiene su propio tope mensual independiente de EPIC 15) — diseñada para que 🆕 EPIC 25 (reembolsos excepcionales, todavía no construido) sume automáticamente sus propios montos aprobados al mismo remanente sin ningún cambio de código, en cuanto sus futuros tipos de ayuda usen `tipo = 'reembolso'`. US-14.06 se verificó con una progresión real de 4 reembolsos aprobados para el mismo hogar en el mismo año calendario ($50.000 → $25.000 → $12.500 → $12.500, agotando exactamente el pool de $100.000): en cada tramo la UI mostró el tope correcto, un intento de aprobar por sobre el tope quedó bloqueado tanto en el cliente (atributo `max`) como de forma independiente en el servidor (se confirmó removiendo el atributo `max` vía consola y reenviando), y el bloqueo quedó auditado automáticamente en `solicitudes_historial` (visible en el historial de la propia solicitud). Al intentar crear una 5ª solicitud de reembolso general para ese hogar, quedó bloqueada en la creación con el mensaje exacto del criterio de aceptación. US-14.07 se verificó en ambos sentidos: una solicitud fechada en enero quedó bloqueada al enviarla a evaluación con el mensaje explicativo, y tras corregir la fecha a abril pasó a evaluación con normalidad — el criterio "año en curso" del texto original se interpretó como un patrón que se repite cada año calendario (solo se valida el mes, no el año), documentado en el código como una decisión de interpretación deliberada. Se confirmó además el rol de `finanzas` (primer uso real de este rol en el sistema): puede leer `decisiones_solicitud` (antes no lo tenía) y validar documentos/registrar pagos, pero no ve las secciones sensibles de evaluación social ni el bloque completo de "Decisión" (solo el monto aprobado, expuesto puntualmente para el flujo de pago) — y el aprobador, simétricamente, no ve los controles de validación de documentos ni la sección de pago.
>
> **Hallazgo posterior (inconsistencia nav vs. backlog):** el ítem "Reembolsos" del menú (administrador, finanzas) apuntaba a `/reembolsos` marcado `disponible: false` ("Próximamente") pese a que EPIC 14/25 ya estaban 100% implementados — el trabajo real (crear, aprobar, pagar reembolsos) siempre funcionó vía el flujo genérico de `/solicitudes`, pero nunca existió una vista propia para ubicarlos entre el resto de solicitudes (cajas de mercadería, pañales, etc.), así que el nav quedó apuntando a una página que nunca se construyó. Corregido: se creó `app/(protected)/reembolsos/page.tsx` (listado filtrado por `tipos_ayuda.tipo === 'reembolso'`, reutilizando `listarSolicitudes()` — sin query nueva ni duplicar el cálculo de remanente, que sigue viviendo solo en `lib/reembolsos/dal.ts`) y se activó `disponible: true` en `lib/dashboard/nav.ts`. Verificado en navegador como administrador: la ruta lista correctamente una solicitud de reembolso sembrada de prueba (excluyendo las de tipo "material" del mismo hogar) y su enlace lleva al detalle ya existente en `/solicitudes/[id]` sin cambios.

---

## EPIC 20 — Experiencia móvil para terreno

*(US-20.01 y US-20.02 sin cambios respecto a la v2. La capacidad offline se traslada íntegramente al nuevo EPIC 27, para separar claramente "vista móvil conectada" de "ejecución de ruta sin conexión".)*

### US-20.01 — Vista móvil de entregas — P0
### US-20.02 — Reducir información visible en terreno — P0

---

## 🆕 EPIC 27 — Modo offline para la PWA de terreno (alcance acotado)

**Objetivo:** permitir que el funcionario que reparte a domicilio pueda seguir registrando entregas y evidencia durante **cortes momentáneos de señal** durante su jornada, sincronizando automáticamente los cambios apenas se recupera la conexión. Responde a la sección 39 del Contexto Maestro y cierra la brecha marcada como "⚠️ Pendiente — sin EPIC" en la matriz de trazabilidad v2.

> **Alcance explícitamente acotado (decisión de diseño):** esta versión **no** contempla descarga de rutas para trabajar varios días sin conexión, ni sincronización diferida de días completos. El objetivo es tolerar cortes de señal típicos de sectores rurales dispersos **dentro de una misma jornada de reparto**, no reemplazar la necesidad de conectividad estructural.

### 🆕 US-27.01 ✅ — Instalar la aplicación como PWA
Como funcionario en terreno,
quiero poder instalar la aplicación en la pantalla de inicio de mi teléfono,
para acceder rápido sin depender de abrir el navegador y buscar la URL.
**Prioridad:** P1 · **Dependencias:** US-20.01.
**Criterios de aceptación:** existe manifest de aplicación web con ícono y nombre · el navegador ofrece "agregar a pantalla de inicio" · la app instalada abre en modo standalone (sin barra de navegador).
**Estado:** `app/manifest.ts` (nombre, `start_url`, `display: 'standalone'`, íconos 192/512 vía `app/icon.tsx` y `app/icon-512/route.tsx`) + service worker generado por `next-pwa` en el build de producción (`npm run build` → `public/sw.js`, `public/workbox-*.js`). Verificado que `next build --webpack` genera el manifest y el service worker correctamente y que `tsc`/`lint` pasan limpios. **No verificado:** el prompt real de "agregar a pantalla de inicio" en un navegador/dispositivo real — requiere servir en producción (`next start`) sobre HTTPS o localhost y no se ejecutó en esta sesión.

### 🆕 US-27.02 ✅ — Cachear la ruta asignada del día para uso offline
Como funcionario en terreno,
quiero que la ruta asignada quede disponible en mi teléfono aunque pierda señal después de cargarla,
para poder seguir viendo mis entregas pendientes sin depender de conexión constante.
**Prioridad:** P0 · **Dependencias:** US-12.02, 🆕 US-13.04.
**Criterios de aceptación:**
- Al abrir la ruta del día con conexión activa, sus datos (listado de entregas, direcciones, datos mínimos del beneficiario, orden sugerido) quedan guardados localmente en el dispositivo.
- Si se pierde la conexión después de esa carga inicial, el funcionario sigue viendo la ruta completa sin errores.
- La ruta cacheada se limita a la jornada/día en curso (no rutas futuras ni de días anteriores).
**Estado:** `/mis-entregas` (única vista de terreno con entregas asignadas al usuario, ver alcance más abajo) persiste su listado en IndexedDB (`lib/offline/db.ts`, store `ruta`) apenas se carga con conexión. `guardarRutaDelDia` filtra a entregas de hoy o sin `fecha_programada`. Verificado en navegador: cargada la ruta con conexión, se recargó la página simulando falta de señal y el listado completo (incluyendo datos de contacto/dirección) se siguió mostrando sin errores, leído directo desde IndexedDB. **Nota de alcance:** `/rutas` (vista de mapa/ruteo geográfico de US-13.04) queda explícitamente fuera de este cacheo — es una vista de planificación de escritorio, no la pantalla de ejecución en terreno; solo `/mis-entregas` (y su fallback `/offline`) están cubiertas.

### 🆕 US-27.03 ✅ — Registrar entrega (realizada o fallida) sin conexión
Como funcionario en terreno,
quiero poder marcar una entrega como realizada o fallida aunque no tenga señal en ese momento,
para no detener mi trabajo esperando conectividad.
**Prioridad:** P0 · **Dependencias:** US-12.04, US-12.05, 🆕 US-27.02.
**Criterios de aceptación:**
- El registro de entrega (US-12.04) y de entrega fallida (US-12.05) funciona igual con o sin conexión.
- Si no hay conexión al momento de guardar, el registro queda almacenado localmente y marcado como "pendiente de sincronizar".
- El funcionario puede seguir avanzando a la siguiente entrega de la ruta sin que el estado offline lo bloquee.
**Estado:** los formularios existentes `EntregaRealizadaForm`/`EntregaFallidaForm` (EPIC 12) se reutilizaron sin modificar su UI, pasándoles una función cliente (`lib/offline/sync.ts` → `enviarOEncolar`) en vez de la Server Action original — intenta `fetch` directo y, si falla por red, encola en IndexedDB (`cola_sync`) y aplica de inmediato la actualización optimista local con badge "Pendiente de sincronizar". Se agregaron rutas API paralelas (`app/api/mis-entregas/[id]/realizada` y `/fallida`) porque las Server Actions originales no son reproducibles desde una cola offline. Verificado en navegador: con `fetch` bloqueado, se registró una entrega fallida — quedó marcada "pendiente de sincronizar" en la lista y el funcionario pudo navegar a la siguiente entrega sin bloqueo.

### 🆕 US-27.04 ✅ — Capturar evidencia sin conexión
Como funcionario en terreno,
quiero poder tomar la fotografía y registrar los datos del receptor aunque no tenga señal,
para respaldar la entrega igual que si estuviera conectado.
**Prioridad:** P0 · **Dependencias:** US-12.06, 🆕 US-27.03.
**Criterios de aceptación:** la fotografía y los demás datos de evidencia (US-12.06) se guardan localmente si no hay conexión · quedan vinculados al registro de entrega pendiente de sincronizar (US-27.03) · no se pierde evidencia capturada aunque la app se cierre o el teléfono se apague antes de sincronizar.
**Estado:** la fotografía se guarda como `Blob` dentro del propio item de `cola_sync` en IndexedDB (no en memoria), junto a los datos del receptor. Verificado con una prueba realista: se registró una entrega realizada con foto sin conexión, y en vez de solo mockear `fetch` en memoria, se recargó la página completa (navegación real, más cercano a "cerrar la app") — el ítem con la foto sobrevivió el reload en IndexedDB y, al recuperar `fetch`, se sincronizó automáticamente y la foto quedó subida a Supabase Storage y enlazada en `documentos`.

### 🆕 US-27.05 ✅ — Sincronizar automáticamente al recuperar conexión
Como sistema,
quiero enviar automáticamente los cambios guardados localmente apenas el dispositivo detecte conexión,
para que el funcionario no tenga que hacer una acción manual de sincronización.
**Prioridad:** P0 · **Dependencias:** 🆕 US-27.03, US-27.04.
**Criterios de aceptación:**
- Al recuperar señal, el dispositivo envía automáticamente todos los registros y evidencias pendientes, sin que el funcionario deba presionar un botón.
- Si la sincronización de un elemento falla, se reintenta automáticamente sin perder los datos locales.
- El sistema central recibe los registros con su fecha y hora original de captura (no la fecha de sincronización), para no distorsionar el historial.
**Estado:** `lib/offline/sync.ts` — listener de evento `online` + intervalo de respaldo de 20s (no se usa la Background Sync API del navegador por soporte parcial en Safari/iOS, ver comentario en el código; el alcance acotado del EPIC — cortes momentáneos con la app abierta, no sincronización con la app cerrada — no la necesita). Se agregó columna `capturado_en` (migración `20260816000001_offline_entregas_sync.sql`) que graba el momento real de captura, distinto de `updated_at` (momento de escritura en servidor). Verificado contra la base de datos: en dos pruebas (fallida y realizada+evidencia) `capturado_en` quedó entre ~35 segundos y ~2 minutos antes que `updated_at`, confirmando que el servidor preserva la marca de tiempo original y no la de sincronización. Fallos de red incrementan un contador de intentos sin vaciar la cola (reintento automático); errores definitivos del servidor (4xx/5xx que no sean reintentables) sí se marcan como error en vez de reintentar indefinidamente.
**Bug encontrado y corregido durante la verificación:** `procesarItem` (motor de sincronización en segundo plano) solo actualizaba `estado_local: 'sincronizada'` al confirmar éxito, pero no los campos reales (`estado`, `receptor_nombre`, `motivo_fallo`, etc.) del registro cacheado. Esto no se notaba cuando el envío ocurría en el camino rápido (`enviarOEncolar`, con el formulario todavía montado, que sí actualiza esos campos), pero si el envío quedaba pendiente y lo terminaba el motor en segundo plano (p. ej. tras recargar la página antes de que hubiera señal), la entrega seguía viéndose como "pendiente" en el caché local aunque el servidor ya tuviera el resultado final — reabriendo el formulario de una entrega ya resuelta. Corregido agregando `derivarActualizacionLocal()`, que reconstruye los campos finales desde el propio ítem de la cola antes de marcarlo sincronizado. Verificado tras el fix: se sembró un ítem de cola directamente en IndexedDB, se recargó la página y, en menos de 3 segundos, el motor real (ya con el fix) procesó el ítem — el caché local quedó en `estado: 'fallida'`, `motivo_fallo_nombre` resuelto correctamente y la cola vacía.

### 🆕 US-27.06 ✅ — Mostrar estado de sincronización
Como funcionario en terreno,
quiero ver claramente si mis registros ya se sincronizaron o siguen pendientes,
para confiar en que mi trabajo quedó respaldado.
**Prioridad:** P1 · **Dependencias:** 🆕 US-27.05.
**Criterios de aceptación:** indicador visual simple (ícono o color) con al menos tres estados: sincronizado, pendiente, error de sincronización · el indicador se actualiza en tiempo real conforme se sincronizan los elementos.
**Estado:** `app/(protected)/mis-entregas/sync-indicator.tsx`, suscrito al pub/sub de `lib/offline/sync.ts`. Tres estados con los colores ya usados en el resto del proyecto (verde/ámbar/rojo): sincronizado, "Pendiente de sincronizar (N)", "Error de sincronización (N)". Verificado en navegador que el indicador cambia de estado sin recargar la página al encolar y al sincronizar un registro.

### 🆕 US-27.07 ✅ — Resolver conflictos de sincronización de forma simple
Como sistema,
quiero aplicar una regla simple cuando dos registros del mismo elemento entren en conflicto,
para no bloquear la operación ni perder información silenciosamente.
**Prioridad:** P1 · **Dependencias:** 🆕 US-27.05.
**Criterios de aceptación:**
- Política de resolución: la escritura con fecha/hora de captura más reciente prevalece ("última escritura gana").
- Todo conflicto detectado queda registrado en auditoría, indicando qué versión se descartó, para revisión manual posterior si es necesario.
- La resolución de conflictos no requiere intervención del funcionario en terreno en el momento.
**Estado:** `lib/entregas/registro.ts` → `aplicarResultadoEntregaSync`: si la entrega sigue `pendiente` en el servidor, aplica directo; si ya fue resuelta (p. ej. por otro dispositivo o por un envío duplicado), compara `capturado_en` contra `coalesce(entrega.capturado_en, entrega.updated_at)` — la captura más nueva gana. La función `security definer` `registrar_conflicto_sync_entrega` (misma migración que US-27.05) inserta en `entregas_historial` en ambos casos: `sync_conflicto_resuelto` (se sobrescribió, documentando el valor anterior) o `sync_conflicto_descartado` (se descartó el envío entrante, documentando qué se descartó). Ningún conflicto pasa en silencio. Verificado con 3 llamadas API secuenciales sobre la misma entrega con distintos `capturado_en`: (1) aplicación normal en `pendiente`, (2) un envío con `capturado_en` más antiguo devolvió 409 y quedó descartado con su fila de auditoría `sync_conflicto_descartado`, (3) un envío con `capturado_en` más nuevo sobrescribió y quedó su fila `sync_conflicto_resuelto`. Ninguno de los tres requirió intervención del funcionario.

**Nota general de EPIC 27:** decisión de arquitectura clave — App Router necesita red para navegar entre Server Components, así que el maestro-detalle de `/mis-entregas` se resolvió con estado de React dentro de una sola página (no `<Link>`/routing de Next.js) para que funcione sin conexión; `/mis-entregas/[id]` (ruta antigua, online-only) se dejó intacta como acceso directo de conveniencia desde el dashboard. `app/offline/page.tsx`, fuera de `(protected)`, reutiliza el mismo componente como fallback del service worker (`fallbacks.document`) cuando una navegación falla por falta de red. **No verificado en esta sesión:** el prompt de instalación real de PWA en un navegador/dispositivo (US-27.01) y el fallback `/offline` servido específicamente por el service worker en modo producción (`next start`, dado que `next-pwa` está deshabilitado en `next dev`) — ambos quedan pendientes de una verificación productiva posterior.

---

## 🆕 EPIC 25 — Reembolsos excepcionales por cirugía y por fallecimiento o servicio funerario

**Objetivo:** cubrir las secciones 17 y 18 del Contexto Maestro, que definen estos dos casos excepcionales con la misma relevancia narrativa que el caso de diálisis (EPIC 15), pero que no tenían historias propias en el backlog v1/v2.

### 🆕 US-25.01 ✅ — Crear solicitud de reembolso excepcional por cirugía
Como evaluador social,
quiero crear una solicitud específica de reembolso excepcional por cirugía,
para apoyar económicamente al hogar cuando un integrante enfrenta una intervención quirúrgica.
**Prioridad:** P0 · **Dependencias:** EPIC 07, EPIC 10, EPIC 23.
**Campos mínimos:** hogar, integrante afectado, motivo de la cirugía, documento o certificado de respaldo, informe social asociado, monto solicitado.
**Criterios de aceptación:** la solicitud exige integrante afectado · exige documento de respaldo · exige informe social asociado (EPIC 23) · el monto solicitado debe ser mayor a cero.

### 🆕 US-25.02 ✅ — Calcular remanente anual disponible para reembolso excepcional
Como sistema,
quiero calcular cuánto queda disponible del tope anual de $100.000 por grupo familiar, considerando lo ya utilizado en reembolsos generales y excepcionales del año,
para no exceder el límite anual establecido en la sección 22 del Contexto Maestro.
**Prioridad:** P0 · **Dependencias:** EPIC 14, US-25.01.
**Criterios de aceptación:**
- El cálculo suma los montos ya aprobados del reembolso médico general (EPIC 14) más cualquier reembolso excepcional previo del mismo año calendario para el mismo hogar.
- Muestra el remanente disponible hasta el tope anual de $100.000.
- Si el hogar no ha usado reembolsos ese año, el remanente disponible es el total ($100.000).
- El cálculo se actualiza en tiempo real ante cualquier aprobación nueva.

### 🆕 US-25.03 ✅ — Aprobar monto de reembolso excepcional por cirugía
**Prioridad:** P0 · **Dependencias:** US-25.01, US-25.02.
**Criterios de aceptación:** el monto aprobado no puede superar el remanente calculado (US-25.02) · la solicitud queda marcada explícitamente como "excepcional — cirugía" en el historial del hogar y en reportes, sin ocultar su carácter excepcional · la aprobación queda auditada.

### 🆕 US-25.04 ✅ — Crear solicitud de reembolso excepcional por fallecimiento o servicio funerario
Como evaluador social,
quiero crear una solicitud específica para apoyar gastos de servicio funerario,
para asistir al hogar ante el fallecimiento de un integrante.
**Prioridad:** P0 · **Dependencias:** EPIC 07, EPIC 10, EPIC 23.
**Campos mínimos:** hogar, integrante fallecido, persona solicitante, documento de respaldo, informe social asociado, monto solicitado.
**Criterios de aceptación:** análogos a US-25.01, adaptados al caso de fallecimiento.

### 🆕 US-25.05 ✅ — Aprobar monto de reembolso excepcional por fallecimiento
**Prioridad:** P0 · **Dependencias:** US-25.04, US-25.02.
**Criterios de aceptación:** misma lógica de remanente compartido que US-25.03 · marcado explícitamente como "excepcional — fallecimiento".

### 🆕 US-25.06 ✅ — Registrar pago de reembolso excepcional
Como finanzas,
quiero registrar el pago de un reembolso excepcional aprobado (cirugía o fallecimiento),
para cerrar administrativamente la ayuda.
**Prioridad:** P0 · **Dependencias:** US-25.03, US-25.05.
**Criterios de aceptación:** análogos a US-14.04 (fecha de pago, monto pagado, medio de pago, no puede superar el monto aprobado).

### 🆕 US-25.07 ✅ — Reporte de reembolsos excepcionales por cirugía y fallecimiento
**Prioridad:** P1 · **Dependencias:** EPIC 17, US-25.03, US-25.05.
**Criterios de aceptación:** se muestran por separado de los reembolsos generales y de diálisis · filtrable por tipo (cirugía / fallecimiento) y por período.

---

## 🆕 EPIC 26 — Gestión de incidentes de seguridad

**Objetivo:** cubrir la sección 47 del Contexto Maestro. Cobra relevancia adicional de cara a la Ley 21.719, vigente desde el 1 de diciembre de 2026, que exige poder demostrar procedimientos y evidencia operativa ante incidentes que afecten datos personales.

> **Nota de priorización:** se clasifica como P1 (no bloquea el primer release funcional del MVP), pero se recomienda tenerlo resuelto **antes de diciembre de 2026**, dado que los municipios pequeños cuentan con un año de gracia (amonestaciones en vez de multas) que no exime de la obligación, solo reduce la sanción inmediata.

### 🆕 US-26.01 ✅ — Registrar incidente de seguridad
Como administrador o encargado de seguridad de la información,
quiero registrar un incidente de seguridad cuando ocurra,
para dejar constancia formal y poder responder ante la autoridad si corresponde.
**Prioridad:** P1 · **Dependencias:** US-01.03.
**Campos mínimos:** fecha, usuario involucrado, tipo de incidente, datos afectados, cantidad estimada de personas afectadas, medidas correctivas, responsable de seguimiento, estado.
**Criterios de aceptación:** se puede registrar un incidente con estos campos mínimos · el tipo de incidente se elige desde un catálogo simple (acceso no autorizado, pérdida de documento, filtración, uso indebido de credenciales, otro) · el registro queda auditado.

### 🆕 US-26.02 ✅ — Ver listado y detalle de incidentes
**Prioridad:** P1 · **Dependencias:** US-26.01.
**Criterios de aceptación:** listado filtrable por fecha, tipo y estado · acceso restringido a administrador/auditor · se puede abrir el detalle completo de un incidente.

### 🆕 US-26.03 ✅ — Cerrar incidente con medidas correctivas registradas
**Prioridad:** P2 · **Dependencias:** US-26.01.
**Criterios de aceptación:** se puede cambiar el estado a "cerrado" solo si existen medidas correctivas registradas · el cierre queda auditado.

### 🆕 US-26.04 ✅ — Registrar notificación a la Agencia de Protección de Datos o a los afectados
Como administrador,
quiero dejar constancia de si un incidente fue notificado a la autoridad o a las personas afectadas,
para respaldar el cumplimiento del deber de notificación que exige la Ley 21.719.
**Prioridad:** P2 · **Dependencias:** US-26.01.
**Criterios de aceptación:** campo de fecha de notificación · campo de destinatario (Agencia / titulares / ambos) · campo de responsable · no automatiza el envío de la notificación, solo deja registro manual del hecho.

---

## EPIC 21 — Pruebas y validación del MVP 🆕 (cuatro pruebas agregadas)

### US-21.01 a US-21.06 — sin cambios respecto a la v2.
Resultado de la ejecución: US-21.01 ✅ · US-21.02 ✅ · US-21.03 ✅ · US-21.04 ✅ · US-21.05 ✅ · US-21.06 ✅

**Decisión (2026-10-26) — estado terminal de la solicitud:** el criterio "la solicitud queda cerrada" / "se cierra solicitud" de US-21.01, US-21.02 y US-21.04 (heredado de la v2) se redefine como "la solicitud queda en el estado terminal `entregada_pagada`". El sistema asigna ese estado automáticamente al completar la entrega (`marcar_solicitud_entregada`) o el pago (`marcar_solicitud_reembolso_pagada`), y queda auditado en `solicitudes_historial`. No se agrega una acción manual de cierre, por tres razones: el Contexto Maestro no define un estado "cerrada" (su lista termina en entregada / no entregada / anulada), un paso manual dejaría solicitudes sin cerrar y metería ruido en los KPIs, y no hay ninguna regla de negocio que lo exija. Los valores `cerrada` y `asignada_entrega_pago` siguen en el enum `estado_solicitud` sin uso, porque eliminar valores de un enum en Postgres obliga a recrear el tipo y no aporta nada. Ninguna pantalla los muestra. Si en el futuro se define un seguimiento posterior a la entrega (visita de verificación, rendición), esa decisión debe revisarse.

### 🆕 US-21.07 ✅ — Probar flujo completo de reembolso excepcional por cirugía
**Prioridad:** P0 · **Dependencias:** EPIC 25.
**Criterios de aceptación:** se crea solicitud con informe social asociado · se calcula remanente anual correctamente · se aprueba dentro del remanente · se registra pago · queda marcado como excepcional en historial y reportes.

### 🆕 US-21.08 ✅ — Probar flujo completo de reembolso excepcional por fallecimiento
**Prioridad:** P0 · **Dependencias:** EPIC 25.
**Criterios de aceptación:** análogos a US-21.07, adaptados al caso de fallecimiento.

### 🆕 US-21.09 ✅ — Probar flujo de entrega con corte de conexión
**Prioridad:** P0 · **Dependencias:** EPIC 27.
**Criterios de aceptación:**
- Se simula pérdida de señal durante el registro de una entrega y su evidencia.
- Los datos quedan guardados localmente y marcados como pendientes de sincronizar.
- Al restablecer la conexión, los datos se sincronizan automáticamente sin intervención manual.
- El registro sincronizado conserva la fecha/hora original de captura, no la de sincronización.

### 🆕 US-21.10 ✅ — Probar cálculo automático de ruta por cercanía
**Prioridad:** P1 · **Dependencias:** 🆕 US-13.04.
**Criterios de aceptación:** se crean hogares con coordenadas dentro de un mismo sector · el sistema calcula un orden razonable por cercanía · un hogar sin coordenadas queda correctamente marcado y al final de la lista, sin bloquear el cálculo del resto.

### 🆕 US-21.11 ✅ — Probar cálculo automático de tramos y remanente compartido entre reembolso general y excepcional
**Prioridad:** P0 · **Dependencias:** 🆕 US-14.05, 🆕 US-25.02.
**Criterios de aceptación:**
- Un hogar usa 2 reembolsos generales en el año ($50.000 + $25.000 = $75.000 usados).
- Se calcula correctamente el remanente disponible ($25.000).
- El hogar solicita un reembolso excepcional por cirugía; el sistema limita la aprobación a los $25.000 de remanente, no al tope teórico del caso excepcional.
- Una 3ª solicitud general posterior queda con tope $0 y el sistema bloquea su aprobación, mostrando el motivo (pool anual agotado).
- Una solicitud general enviada en enero o diciembre queda bloqueada por estar fuera del período vigente (febrero-noviembre).

> **Estado (EPIC 21):** las 11 historias se **ejecutaron en vivo** el 2026-10-26 contra Supabase local y la app en `next dev`, con Playwright y verificación SQL directa. El detalle por criterio está en `docs/pruebas-epic-21.md`. Las dependencias que antes las bloqueaban (EPIC 23, 25 y 27) ya están construidas. Una primera corrida se cortó por un apagón y se repitió completa: no quedó nada truncado en el repositorio ni en las migraciones, y los fallos de esa corrida eran de los scripts de QA, no de la app. Las 11 historias pasan (✅). US-21.01, US-21.02 y US-21.04 se completan con el criterio de cierre redefinido: `entregada_pagada` es el estado terminal, ver la decisión arriba. En US-21.02 la talla se registra como texto libre y por el producto descontado ("Pañales talla M"), no en un campo propio.

---

## 2. Orden recomendado de construcción (actualizado v3)

### Sprint 0 — Base técnica
*(sin cambios respecto a la v2)*

### Sprint 1 — Hogares, personas, ficha social y elegibilidad
US-03.01 · US-03.02 · US-03.03 · US-03.04 · **🆕 US-03.06** · US-04.01 · US-04.02 · US-04.04 · US-05.01 · US-05.04 · US-05.05 · US-22.01 · US-22.03

### Sprint 2 — Catálogo de ayudas y solicitudes
*(sin cambios respecto a la v2)*

### Sprint 3 — Evaluación, aprobación, documentos e informes sociales
*(sin cambios respecto a la v2)*

### Sprint 4 — Inventario, entregas, rutas y offline de terreno 🆕
US-11.01 · US-11.02 · US-11.03 · US-11.04 · US-12.01 · US-12.02 · US-12.03 · US-12.04 · US-12.05 · US-12.06 · US-13.01 · **🆕 US-13.04** · **⬆️ US-13.02** · US-20.01 · US-20.02 · **🆕 US-27.02** · **🆕 US-27.03** · **🆕 US-27.04** · **🆕 US-27.05**

### Sprint 5 — Reembolsos médicos, diálisis y casos excepcionales 🆕
US-14.01 · US-14.03 · US-14.04 · **🆕 US-14.05** · **🆕 US-14.06** · **🆕 US-14.07** · US-15.01 · US-15.02 · US-15.03 · US-15.04 · **🆕 US-25.01** · **🆕 US-25.02** · **🆕 US-25.03** · **🆕 US-25.04** · **🆕 US-25.05** · **🆕 US-25.06**

### Sprint 6 — Auditoría, reportes, incidentes de seguridad y pruebas de aceptación 🆕
US-16.01 · US-16.02 · US-16.03 · US-17.01 · US-17.03 · US-17.04 · US-17.05 · **🆕 US-25.07** · **🆕 US-26.01** · **🆕 US-26.02** · US-21.01 a US-21.06 · **🆕 US-21.07** · **🆕 US-21.08** · **🆕 US-21.09** · **🆕 US-21.10** · **🆕 US-21.11**

### Sprint 7 — Post-MVP inmediato
US-13.03 · US-16.04 · US-17.06 · US-19.01 · US-19.02 · US-24.01 · US-24.02 · US-24.03 · **🆕 US-13.05** · **🆕 US-27.01** · **🆕 US-27.06** · **🆕 US-27.07** · **🆕 US-26.03** · **🆕 US-26.04**

---

## 3. Backlog mínimo imprescindible para liberar MVP (actualizado v3)

**Seguridad y acceso:** US-01.01 · US-01.02 · US-01.03 · US-01.04 · US-01.05 · US-18.02

**Hogares y personas:** US-03.01 · US-03.02 · US-03.03 · US-03.04 · **🆕 US-03.06** · US-04.01 · US-04.04 · US-05.01

**Elegibilidad RSH:** US-05.04 · US-05.05

**Hitos:** US-22.01 · US-22.03

**Informes sociales:** US-23.01 · US-23.02 · US-23.03

**Solicitudes y evaluación:** US-06.01 · US-06.02 · US-07.01 · US-07.03 · US-07.04 · US-07.05 · US-07.06 · US-08.01 · US-08.02

**Aprobación:** US-09.01 · US-09.02 · US-09.03

**Documentos:** US-10.01 · US-10.03

**Inventario:** US-11.01 · US-11.02 · US-11.03 · US-11.04

**Entregas y rutas:** US-12.01 · US-12.02 · US-12.03 · US-12.04 · US-12.06 · US-13.01 · **🆕 US-13.04** · US-20.01 · US-20.02

**🆕 Offline de terreno (acotado):** US-27.02 · US-27.03 · US-27.04 · US-27.05

**Reembolsos:** US-14.01 · US-14.03 · US-14.04 · **🆕 US-14.05** · **🆕 US-14.06** · **🆕 US-14.07**

**Diálisis:** US-15.01 · US-15.02 · US-15.03 · US-15.04

**🆕 Reembolsos excepcionales (cirugía y fallecimiento):** US-25.01 · US-25.02 · US-25.03 · US-25.04 · US-25.05 · US-25.06

**Auditoría:** US-16.01 · US-16.02 · US-16.03

**Pruebas obligatorias:** US-21.01 · US-21.02 · US-21.03 · US-21.04 · US-21.05 · US-21.06 · **🆕 US-21.07** · **🆕 US-21.08** · **🆕 US-21.09** · **🆕 US-21.11**

> **Nota:** la gestión de incidentes de seguridad (EPIC 26) queda deliberadamente **fuera** del backlog mínimo imprescindible — no bloquea el primer release funcional — pero se recomienda completarla antes de diciembre de 2026 por la entrada en vigencia de la Ley 21.719.

---

## 4. Historias que pueden quedar para después del MVP (actualizado v3)

US-02.02 · US-03.05 · US-04.03 · US-05.02 · US-05.03 · US-06.03 · US-07.02 · US-08.03 · US-10.02 · US-10.04 · US-12.07 · **⬆️ US-13.02** (ahora P1, no bloquea release pero se recomienda no dejarla para muy después) · US-13.03 · **🆕 US-13.05** · US-15.05 · US-16.04 · US-17.06 · US-18.03 · US-18.04 · US-19.01 · US-19.02 · US-19.03 · US-24.01 · US-24.02 · US-24.03 · **🆕 US-25.07** · **🆕 US-26.01** a **US-26.04** (recomendado completar antes de dic. 2026) · **🆕 US-27.01** · **🆕 US-27.06** · **🆕 US-27.07**

---

## 5. Definition of Done del MVP

Sin cambios respecto a la v2, con una precisión agregada para EPIC 27:
> Para historias de EPIC 27, "probado con datos de ejemplo" incluye explícitamente una prueba de corte de conexión real o simulado (ver US-21.09), no solo el camino feliz con conexión activa.

---

## 6. Riesgos principales del backlog (actualizado v3)

**Riesgos 1 a 8 — sin cambios respecto a la v2** (exceso de datos sensibles, permisos mal definidos, duplicidad de beneficios, regla de diálisis mal aplicada, evidencias poco confiables, elegibilidad RSH eludida, hitos/informes expuestos a roles indebidos, compras sin trazabilidad formal).

**🆕 Riesgo 9 — Alcance offline mal delimitado.** Si el alcance "acotado" (cortes momentáneos) se confunde en la implementación con soporte multi-día, se puede sobre-invertir en infraestructura de sincronización compleja, o -al revés- construirse algo insuficiente para la realidad rural.
Mitigación: alcance explícitamente documentado en EPIC 27 · prueba dedicada (US-21.09) que valida específicamente el escenario de corte momentáneo, no de días sin conexión.

**🆕 Riesgo 10 — Reembolso excepcional sin control de tope compartido.** *(Actualizado: riesgo cerrado)* Originalmente, si el remanente anual (US-25.02) no se calculaba correctamente considerando reembolsos generales + excepcionales del mismo hogar, un hogar podría recibir más de $100.000 anuales combinando ambos esquemas. Esto queda resuelto con 🆕 US-14.05 / 🆕 US-14.06, que hacen que el reembolso general también consuma y respete el mismo pool compartido calculado por US-25.02 — ya no son dos cálculos independientes. Prueba dedicada: 🆕 US-21.11.

**🆕 Riesgo 11 — Incumplimiento de plazos de notificación de incidentes ante la Ley 21.719.** Sin un registro formal de incidentes, la municipalidad podría no poder demostrar procedimientos ante la Agencia de Protección de Datos a partir de diciembre de 2026.
Mitigación: EPIC 26 priorizado explícitamente para completarse antes de esa fecha, aunque no bloquee el primer release funcional del MVP.

---

## 7. Resultado esperado del MVP (actualizado v3)

Al terminar este backlog MVP, el sistema permitirá, además de todo lo ya cubierto en la v2:
- **🆕 Calcular automáticamente el orden de visitas de una ruta por cercanía geográfica**, con ajuste manual disponible y hogares sin coordenadas correctamente señalizados.
- **🆕 Registrar entregas y evidencia en terreno aunque se corte momentáneamente la señal**, sincronizando automáticamente al recuperar conexión, sin intervención manual del funcionario.
- **🆕 Gestionar reembolsos excepcionales por cirugía y por fallecimiento/servicio funerario**, con el mismo control de remanente anual que ya existía para el esquema general, y sin ocultar su carácter excepcional en historial ni reportes.
- **🆕 Registrar incidentes de seguridad** con datos afectados, medidas correctivas y notificación a la autoridad cuando corresponda, preparando el cumplimiento de la Ley 21.719 antes de su entrada en vigencia (diciembre de 2026).

---

## 8. Adopción del sistema de diseño (identidad Coinco)

> Trabajo de presentación sobre EPICs ya implementados — no agrega historias nuevas a este backlog. Seguimiento detallado en `docs/plan-adopcion-diseno.md`; no cambia lógica de negocio, consultas ni permisos de los EPICs listados.

- ✅ Prompt 1 — Sistema de diseño base (tokens, `EstadoBadge`, `BadgeExcepcion`/`CardExcepcion`, `Button`, `Card`) y layout shell.
- ✅ Prompt 2 — Pilotos: Dashboard del evaluador y Ficha de hogar.
- ✅ **Tanda A** — Núcleo del flujo diario: Solicitudes (listado + detalle, EPIC 07), Evaluación social (EPIC 08), Aprobación/rechazo (EPIC 09), Personas integrantes (EPIC 04), Catálogo de ayudas (EPIC 06). Agregado al sistema: variante `danger` en `Button`, componente `FiltrosBar`/`CampoFiltro`. El listado de solicitudes filtra en memoria sobre `listarSolicitudes()` (sin tocar la consulta); columnas de sector y tramo RSH se omitieron por no venir en esa consulta hoy — la excepción RSH ya decidida queda igualmente visible vía `EstadoBadge` (tono `exception`, `aprobada_excepcion`).
- ✅ **Tanda B** — Entregas y terreno: Entregas en domicilio (EPIC 12), Rutas de entrega (EPIC 13), Experiencia móvil de terreno (EPIC 20), Modo offline de la PWA — solo UI (EPIC 27). Agregado al sistema: componente `ParadaRuta` (parada numerada de ruta, reutilizado en `/entregas` y `/rutas`); se reutilizó `GeorreferenciacionBadge` (de la ficha de hogar) en vez de duplicar el aviso "sin georreferenciar". No hay mapa Leaflet real en la app — "Abrir en mapas"/"Mapa" son enlaces externos, así que EPIC 13 no requirió trabajo de mapa. Estrategia móvil: responsive (shell único desde Prompt 1); `mis-entregas` ya era mobile-first (`max-w-lg`, botones grandes) y se mantuvo así. Offline (EPIC 27): solo se tocó presentación (`sync-indicator.tsx` pasó de colores literales `red-600`/`amber-600`/`green-600` a tokens `danger`/`warning`/`success`; banner de `/offline`) — `lib/offline/*` (IndexedDB, cola de sincronización, resolución de conflictos) y el service worker quedaron intactos.
- ✅ **Tanda C** — Reembolsos e informes: Reembolso médico general (EPIC 14), Diálisis (EPIC 15), Reembolsos excepcionales (EPIC 25), Informes sociales (EPIC 23), hitos sensibles (transversal). Agregado al sistema: componente `MedidorTope` (barra tope total/consumido/disponible, tonos `brand`→`warning`→`danger` según remanente), reutilizado por los 3 EPICs de reembolso dentro de `AprobarForm` — reemplazó los párrafos de texto plano de tope que ya existían desde la Tanda A. **No se tocó** el cálculo del tope (`calcularRemanenteReembolsoAnual`/`calcularTopeReembolsoGeneral`/`calcularAcumuladoDialisisMensual`, US-25.02, `lib/reembolsos/dal.ts`) ni la validación de período por fecha de solicitud — el medidor solo consume los valores que la página de detalle ya calculaba y pasaba a `AprobarForm`; los reembolsos excepcionales (EPIC 25) reflejan el consumo combinado porque `remanenteAnual` ya lo suma en la fuente única, sin cálculo adicional. Listado `/reembolsos` vestido con `FiltrosBar` (estado, tipo) filtrando en memoria, igual patrón que Tanda A. Formularios de informe social y hito llevaban sin vestir desde antes de Prompt 2; se les agregó `BannerSensible` y, al de informe social, encabezado `brand-800` (Paso 4) — sin cambiar campos, roles ni control de acceso.
- ✅ **Tanda D** — Administración y transversales (cierre): Login/autenticación (EPIC 01, logo horizontal a color vía `app/logo-horizontal` — placeholder `next/og` en tokens institucionales, reemplazable por el asset oficial sin tocar la pantalla), Documentos (EPIC 10), Reportes (EPIC 16), Auditoría (EPIC 17, nuevo componente `BadgeAccionAuditoria` para los 4 baldes de acción), Administración — sectores/motivos de entrega/usuarios (EPIC 19), Compras municipales (EPIC 24, sí implementada pese a figurar post-MVP en el maestro), Incidentes de seguridad (EPIC 26). EPIC 18 (protección de datos) no tiene pantalla propia en el backlog — está cubierta transversalmente por el vestido de EPIC 10 (documentos), EPIC 22/23 (hitos e informes sociales) y sus controles de acceso existentes, que ya quedaron vestidos en Tandas C y D. `tsc --noEmit` limpio; sin hex sueltos ni clases de color literales en el alcance de la tanda. No se tocó lógica de auth, roles, permisos ni qué se audita/registra.
- ✅ **Cierre de la adopción** — con Tanda D completa, toda la app (EPICs 00–27 existentes) queda con identidad Coinco.
- ✅ **Deuda saldada** — sector y tramo RSH en el listado de solicitudes (ver `docs/prompt-deuda-listado-solicitudes.md`). `listarSolicitudes()` ahora hace join a `grupos_familiares(direccion, sector, tramo_rsh)`; el listado (que es una lista apilada, no una tabla) muestra el sector junto a la dirección/persona y el tramo RSH destacado en `brand-600`, con `BadgeExcepcion` (reutilizado de la ficha de hogar) cuando supera el umbral de `lib/hogares/rsh.ts` (`UMBRAL_ELEGIBILIDAD_RSH`, 40%). Sin filtros, orden ni paginación tocados; `tsc --noEmit` limpio; sin hex sueltos ni `any`.
- ✅ **Refinamiento institucional (estilo Regalos de Navidad)** — ver `docs/prompt-refinamiento-institucional.md`. **Cambio de raíz, no de pantallas:** se tocaron `app/globals.css`, `app/layout.tsx` y los componentes base de `components/ui/` (`Button`, `Card`, `EstadoBadge`, `BadgeAccionAuditoria`, `ExcepcionRSH`, `BannerSensible`), además de la clase de fondo del shell (`app/(protected)/layout.tsx`) y del login. El resto de las pantallas hereda los cambios. Tipografía Montserrat vía `next/font` (reemplaza Geist; `lang="es-CL"`). Fondo azulado con el token nuevo `--surface-app` (#F2F6FB); `--surface-alt` queda para hover y la pista del medidor (slate-100). Texto azul-gris (#1B2B40). Neutros cálidos (beige) pasados a slate, con los mismos nombres de token: `--border` slate-300 (los inputs siguen legibles), `--border-subtle` slate-200 (nuevo, para el ring de las tarjetas), `--text-muted` slate-600 (sube de 3,6:1 a 7,6:1 de contraste) y `neutral-bg/fg`. Foco visible de 3px en `brand-600` (7,3:1), con celeste solo sobre fondos `bg-brand-800`, porque el celeste de Regalos da 1,8:1 sobre blanco. Botón primario y secundario en `brand-800`, con hover en el token nuevo `brand-900` (#00224A), `min-h-11` y semibold. Esto reescribe la regla anterior "brand-800 NO botones". `Card` con `rounded-2xl`, `shadow-sm` y `ring-1`. Insignias con `rounded-full px-3 py-1 font-bold` y ring inset. Títulos `h1` en extrabold, tracking ajustado y azul de marca, mediante una regla global fuera de `@layer` para ganarles a las clases ya escritas en cada pantalla sin re-vestirlas; los `h1 .text-white` de las cabeceras de marca siguen en blanco. Los hex de marca y semánticos (brand-*, gold, success/warning/danger, exception-*) no cambiaron. Se verificaron login, dashboard del evaluador, ficha de hogar con excepción RSH y listado de solicitudes. `tsc`, `lint` y `next build` pasan limpios.
- ✅ **Revisión de Sprints 1 y 2 (v3)** — se re-verificaron end-to-end en navegador y base de datos local las historias de Sprint 1 (US-03.01–03.04, 03.06, 04.01, 04.02, 04.04, 05.01, 05.04, 05.05, 22.01, 22.03) y Sprint 2 (US-06.01, 06.02, 07.01, 07.03–07.06). Arreglos de la revisión: (1) la ficha del hogar usaba su propia constante de umbral RSH; ahora usa `superaUmbralElegibilidad` de `lib/hogares/rsh.ts`, la misma que `aprobarSolicitud`. (2) Las fechas sin hora (columnas `date`) se mostraban en ISO; ahora pasan por `formatearFecha` (`lib/fechas.ts`, dd-mm-aaaa, sin conversión de zona horaria) en todas las pantallas. (3) El cambio de `fecha_actualizacion_rsh` no se auditaba; se agregó al trigger de cambios críticos (migración `20260817000001_auditar_fecha_actualizacion_rsh.sql`), porque esa fecha decide si el RSH está vigente. (4) La regla `requiere_documentos` del catálogo no se aplicaba en ningún flujo; ahora `enviarAEvaluacion` exige al menos un documento para esos tipos (ver US-07.03). US-07.06 pasa a ✅. (5) Anular una solicitud ahora es en dos pasos y exige motivo, que queda en `solicitudes_historial` como `motivo_anulacion` (migración `20260817000002_motivo_anulacion_solicitud.sql`, mismo patrón que la observación de US-08.03); antes era un clic irreversible sin constancia. Una solicitud anulada ya no muestra el formulario para subir documentos, y el aviso de "faltan documentos" se limpia al subir uno. Verificado en navegador. `tsc` y `lint` limpios.
- ✅ **Revisión de Sprint 3 (v3)** — re-verificadas en navegador y base local US-08.01, 08.02, 09.01–09.03, 10.01, 10.03, 23.01–23.03, 22.02, 18.01 y 18.02, con la matriz de RLS por rol (evaluaciones, decisiones, informes, documentos sensibles). Quedó confirmado que un aprobador puro (sin rol administrador) aprueba y el estado cambia, el bug de RLS que estaba pendiente de verificación. Dos bugs corregidos: (1) `aprobarExcepcionRsh` no validaba los topes de reembolso; ahora comparte `validarTopesReembolso` con la aprobación regular (la excepción RSH salta la regla del 40%, no los topes). (2) Los informes `alta` no contaban para el requisito "informe social asociado" cuando decidía un aprobador; ahora se cuenta el total vía `contar_informes_sociales_de_solicitud` (migración `20260817000003`). Además, la tarjeta de decisión marca "Aprobada por excepción". `tsc` y `lint` limpios.
- ✅ **Roles múltiples por usuario** — el equipo del Departamento Social es chico y la misma persona cumple varias funciones (evaluadora y aprobadora, o aprobadora y bodega), así que el modelo de un rol por usuario no se podía aplicar en la práctica. Ahora `profiles.roles` es una lista y el administrador asigna varios roles con casillas en `/admin/usuarios/[id]` (cada rol con una descripción de lo que habilita; cambios auditados en `profiles_historial`). Un permiso se concede si el usuario tiene alguno de los roles que lo habilitan: `tiene_rol()` reemplaza a `current_role()` en 50 políticas RLS y en todas las funciones SQL que preguntaban por el rol (migración `20260818000001_roles_multiples.sql`, generada de forma mecánica y revisada a mano en las funciones de visibilidad, que devuelven la unión de permisos). Menú y dashboard muestran la unión de los roles. Reglas: el administrador puede ajustar sus propios roles pero no quitarse "administrador"; un usuario sin roles o inactivo no opera. Decisiones de esta revisión: (1) quien tiene evaluador y aprobador puede evaluar y decidir la misma solicitud, pero queda marcado ("Evaluada y decidida por la misma persona" en la decisión y en el historial, migración `20260818000002`); (2) el aprobador ahora lee informes sociales de confidencialidad alta. Verificado: matriz de lectura por rol en todas las tablas con RLS, seis combinaciones de roles (evaluador+aprobador, aprobador+bodega, terreno+bodega, finanzas+bodega, sin roles, inactivo) y en navegador (asignación de roles, menú combinado, evaluar y aprobar con el mismo usuario). Resuelve la nota de trazabilidad del maestro (sección 44) sobre Administrativo Social / Encargado de Compras / Jefatura: se cubren combinando roles, sin roles nuevos. `tsc`, `lint` y `next build` limpios.
- ✅ **Revisión de Sprint 4 (v3)** — re-verificadas en navegador y base local US-11.01–11.04, 12.01–12.06, 13.01, 13.02, 13.04, 20.01, 20.02 y 27.02–27.05. Inventario: una salida sin stock deja la solicitud en "pendiente de stock" sin dejar stock negativo, y una salida con stock la devuelve a "aprobada". Entregas: ciclo completo bodega crea y asigna → terreno marca fallida con motivo → bodega reprograma → terreno completa con receptor y foto → la solicitud pasa a "entregada/pagada", con historial en cada paso. Rutas: el cálculo por cercanía pone primero los hogares con coordenadas y al final los sin georreferenciar; el algoritmo de vecino más cercano se probó aparte con varios puntos. Offline: con el servidor apagado, una entrega fallida quedó en cola local ("pendiente de sincronizar") y se sincronizó sola al volver el servidor, conservando la hora real de captura. Arreglos: (1) con roles múltiples, un usuario de terreno que además es de bodega veía en "Mis entregas", "Rutas" y la caché offline las entregas de todos; ahora se filtran explícitamente por responsable, salvo para el administrador. (2) La fecha de "hoy" se calculaba en UTC (después de las 21:00 en Chile ya era "mañana"): afectaba la ruta del día y la fecha por defecto de solicitudes, pagos e incidentes (una solicitud creada el 30 de noviembre de noche quedaba fuera del período de reembolso); ahora se usa `fechaHoyChile()` con zona `America/Santiago`. (3) US-20.01: en un viewport de 390 px, "Ver detalle", "Abrir en mapas" y "Mapa" eran enlaces de texto de 20 px de alto; ahora son botones de 44 px (`ButtonExterno` para enlaces a mapas). Se verificó además en 390 px que el menú lateral se oculta, aparece el menú móvil y no hay scroll horizontal, lo que cierra la verificación visual que US-20.01 tenía pendiente. (4) Decisión 2026-10-27 sobre US-27.02: "Mis entregas" (y su caché offline) muestra también las entregas atrasadas, es decir, pendientes de días anteriores, marcadas como "Atrasada" y primeras en la lista. Antes desaparecían de la vista del repartidor aunque "Rutas" sí las mostraba. Lo ya realizado o fallido de días anteriores sigue fuera de la ruta del día. `tsc` y `lint` limpios.
- ✅ **Revisión de Sprint 5 (v3)** — re-verificadas en navegador y base local US-14.01, 14.03–14.07, 15.01–15.04 y 25.01–25.06. Fuente única del remanente (US-25.02): se calcula desde `decisiones_solicitud` con decisión aprobada, así que sigue contando después del pago (cuando la solicitud pasa a "entregada/pagada") y también cuenta las aprobaciones por excepción RSH; excluye diálisis. Los reembolsos migrados del sistema anterior se importaron con su decisión aprobada y monto, así que cuentan en el tope anual de producción. Probado con un aprobador: diálisis por $200.000 bloqueada por el tope mensual de $150.000 aun quitando el límite del formulario en el navegador, y aprobada por $150.000; cirugía por $120.000 bloqueada por el remanente anual de $100.000 (la diálisis no lo consumió), bloqueo auditado, y aprobada por $90.000; finanzas no pudo pagar $95.000 sobre $90.000 aprobados y el pago de $90.000 dejó la solicitud en "entregada/pagada". El reporte de reembolsos excepcionales (US-25.07) los muestra aparte, con tipo, montos solicitado/aprobado/pagado. Arreglo: US-25.03/25.05 piden que el reembolso excepcional quede "marcado explícitamente como 'excepcional — cirugía' [o fallecimiento] en el historial del hogar"; una vez aprobado solo lo indicaba el nombre del tipo. Ahora lleva la insignia de excepción "Excepcional — cirugía" / "Excepcional — fallecimiento" en la ficha del hogar, el historial de ayudas, el listado de solicitudes y la cabecera de la solicitud (`etiquetaReembolsoExcepcional` en `lib/reembolsos/tramos.ts`). Pendiente de datos, no de código: el sistema anterior no distinguía diálisis, así que esos reembolsos migrados entraron como "Reembolso médico general" y consumen el tope anual de $100.000 del hogar, que no les corresponde (ya anotado en `antiguos/migracion_oficial/migracion_coinco/README_migracion.md`); conviene reclasificarlos si el origen permite identificarlos. `tsc` y `lint` limpios.
- ✅ **Revisión de Sprint 6 (v3)** — re-verificadas en base local y por HTTP US-16.01–16.04, 17.01, 17.03–17.06, 25.07, 26.01–26.03. Matriz de acceso por rol a la auditoría y a los seis reportes: coincide con lo que ofrece la pantalla de reportes, la combinación bodega + finanzas ve la unión de ambos y el resto recibe "No autorizado". La auditoría registra las acciones de las revisiones de hoy (aprobaciones con monto, bloqueos por tope, la marca de "misma persona", acceso denegado a hitos, pagos, salidas de stock) y se filtra por fecha, usuario, entidad y acción. Las tablas de historial, decisiones y pagos no tienen políticas ni permisos de UPDATE/DELETE para usuarios (US-16.03: la auditoría no la modifican usuarios comunes). La exportación CSV respeta permisos (bodega no descarga reembolsos) y filtros, e incluye la columna "Excepción". Arreglos: (1) la vista unificada de auditoría no incluía la creación de informes sociales (pendiente desde EPIC 16), los cambios de roles y estado de usuarios ni los incidentes de seguridad; se agregaron, solo con metadatos, nunca contenido sensible (migración `20260819000001`). Los cambios de roles se ven como "QA Aprobador · roles: aprobador → evaluador_social, aprobador". (2) US-26.03 ("cerrar solo si existen medidas correctivas") vivía solo en la acción de servidor; se reforzó con un CHECK en la base (migración `20260819000002`), verificado cerrando sin y con medidas. Observación de diseño, sin cambio: el auditor ve el reporte de diálisis (datos de salud) pero no el de reembolsos médicos generales; conviene decidir si es intencional. Las pruebas de aceptación US-21.01–21.11 no se re-ejecutaron con sus scripts originales (no se versionaron), pero sus flujos se re-ejercitaron a mano durante las revisiones de los Sprints 1 a 5: caja y pañales con entrega completa, reembolso general con tope, diálisis, excepción RSH, cirugía, corte de conexión y ruteo. Materiales de construcción (21.03) y fallecimiento (21.08) no se re-ejercitaron; comparten código con caja y cirugía. `tsc` y `lint` limpios.
- ✅ **Revisión de Sprint 7 (v3)** — US-16.04, 17.06, 19.01 y 26.03 ya quedaron verificadas en las revisiones de Sprint 6 y de roles múltiples, y US-27.06 (indicador de sincronización) en la de Sprint 4. Re-verificadas aquí: US-13.03 (abrir en mapas), US-13.05 (hogares sin georreferenciar, para bodega), US-19.02 (sectores: escritura solo administrador; lectura para cualquier rol, es catálogo), US-24.01–24.03 (proveedores y compras: escritura administrador o bodega), US-26.04 (campos de notificación del incidente) y US-27.07: se simularon dos sincronizaciones tardías contra la API de terreno; la capturada antes de la versión vigente se descartó con aviso y la capturada después ganó, y ambas quedaron en el historial de la entrega con la versión descartada. Arreglo: (1) el proxy de sesión redirigía a `/login` todo lo que no fuera `/login`, incluidos el manifest, los íconos, el service worker y la página `/offline`. El navegador descarga el manifest sin cookies, así que la app no se podía instalar como PWA (US-27.01), y el logo de la propia pantalla de login aparecía roto para quien no había iniciado sesión. Se agregó una lista explícita de recursos públicos sin datos en `lib/supabase/proxy.ts`; las páginas protegidas siguen redirigiendo. `tsc` y `lint` limpios.

---

## 9. MEJORAS DE REVISION

> Ajustes pedidos en la revisión con el cliente. Cada mejora se apoya en una historia ya implementada; no cambia reglas de negocio, permisos ni el modelo de datos salvo que se indique.

### MR-01 ✅ — Mapa más grande al crear/editar un grupo familiar
**Relacionada con:** US-03.01, US-03.06.
**Pedido:** al crear un nuevo grupo familiar el mapa es muy pequeño; el formulario debe redistribuirse para que el mapa abarque más espacio en la pantalla.
**Criterios de aceptación:**
- En pantallas anchas (≥ 1024 px) el formulario se muestra en dos columnas: datos del hogar a la izquierda, mapa y coordenadas a la derecha, con el mapa ocupando la mayor parte del alto visible.
- En móvil los campos se apilan en una columna y el mapa mantiene una altura cómoda para marcar el punto.
- El botón de guardar queda al final del formulario en ambos tamaños.
- Los campos, validaciones y la sincronización mapa ↔ latitud/longitud no cambian. Aplica igual en "Nuevo grupo familiar" y "Editar grupo familiar" (mismo formulario).

### MR-02 ✅ — El administrador crea usuarios desde la plataforma
**Relacionada con:** US-01.02, US-19.01.
**Pedido:** el rol administrador debe poder crear usuarios desde la plataforma (hoy solo se crean desde Supabase Studio o la Admin API).
**Criterios de aceptación:**
- Solo el administrador ve y usa "Nuevo usuario" en `/admin/usuarios`; la acción de servidor también lo exige.
- El formulario pide nombre, email, contraseña inicial (mínimo 8 caracteres, con confirmación) y los roles, con las mismas casillas y descripciones que la ficha del usuario.
- La cuenta queda activa y con el email confirmado, lista para iniciar sesión. Un email ya registrado muestra un error claro y no crea nada.
- La asignación de roles queda en el historial del usuario (`profiles_historial`) a nombre del administrador que lo creó, igual que un cambio de roles.
- La clave de servicio de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) se usa solo en el servidor y solo para crear la cuenta; nunca llega al navegador.

### MR-03 ✅ — Cada usuario cambia su propia contraseña
**Relacionada con:** US-01.01.
**Pedido:** cada usuario debe poder cambiar su clave personal.
**Criterios de aceptación:**
- Cualquier usuario con sesión, sea cual sea su rol, llega a "Mi cuenta" desde la barra superior.
- Para cambiarla pide la contraseña actual, la nueva (mínimo 8 caracteres, distinta de la actual) y su confirmación. Si la actual es incorrecta no cambia nada.
- Solo cambia la contraseña de quien tiene la sesión; no hay forma de cambiar la de otro usuario desde esta pantalla.

### MR-04 ✅ — Ficha del grupo familiar ordenada en pestañas
**Relacionada con:** US-03.02, US-03.04, US-04.01, US-10.01, US-22.02, US-23.02.
**Pedido:** la ficha social debe estar más ordenada; con todo el expediente en una sola pantalla no se entiende qué es cada cosa. Debe tener pestañas o ventanas para ordenar la información.
**Criterios de aceptación:**
- Siempre visibles, sobre las pestañas: cabecera del hogar (dirección, sector, estado, acciones), aviso de excepción RSH, aviso de hogar inactivo y los indicadores (integrantes, tramo RSH, ayudas del año). Las excepciones no quedan escondidas en una pestaña.
- Pestañas: **Datos del hogar** (datos y, para quien corresponde, historial de cambios críticos) · **Integrantes** · **Solicitudes y ayudas** (solicitudes asociadas y ayudas entregadas) · **Seguimiento social** (hitos e informes sociales) · **Documentos**. Cada una muestra su cantidad.
- **Seguimiento social** solo aparece para los roles que hoy ven hitos o informes (evaluador social, aprobador, administrador), marcada como información sensible; si otro rol escribe la URL a mano ve "Datos del hogar".
- La pestaña activa queda en la URL (`?tab=`), así se puede enlazar, recargar y volver atrás. Los filtros de hitos y de documentos se mantienen en su pestaña, y al registrar un integrante, hito o informe se vuelve a la pestaña correspondiente.
- En móvil la barra de pestañas se desplaza horizontalmente sin generar scroll horizontal en la página.
- No cambian consultas, permisos ni acciones existentes.

### MR-05 ✅ — El rol "Evaluador social" pasa a llamarse "Gestor social"
**Relacionada con:** US-01.03, US-19.01.
**Pedido:** el rol evaluador social debe renombrarse a "Gestor social".
**Criterios de aceptación:**
- En toda la interfaz el rol se muestra como "Gestor social": barra superior, listado y ficha de usuarios, casillas de roles al crear o editar un usuario, página "sin permiso" y los avisos de información sensible de hitos e informes sociales.
- Los permisos del rol no cambian: lo que podía hacer un evaluador social lo puede hacer un gestor social, y los usuarios que ya tenían el rol lo conservan sin reasignarlo.
- **Decisión técnica:** solo cambia el nombre visible (`ROL_LABELS` en `lib/auth/types.ts`). El valor interno `evaluador_social` se mantiene en la base (enum `rol_usuario`, políticas RLS, funciones SQL, historiales y auditoría), porque renombrarlo exigiría reescribir todas esas políticas sin ningún cambio para el usuario. En la auditoría los cambios de roles se siguen registrando con el valor interno, igual que los demás roles.
- La actividad "evaluación social" de una solicitud conserva su nombre: es lo que hace el rol, no el nombre del rol.

### MR-06 ✅ — Dos modalidades de entrega: en local y a domicilio
**Relacionada con:** US-12.01–12.05, US-03.04, US-06.02, US-11.03, US-13.01. Maestro §11 y §32–34 ("modalidad local/domicilio").
**Pedido:** registrar una entrega es confuso: hoy toda entrega se trata como entrega a domicilio. Para cajas de mercadería y pañales existen dos modalidades: **entrega en local**, en que el mismo gestor social (o el encargado de logística) entrega la ayuda en el Departamento Social, y **entrega a domicilio** para los hogares que lo requieren. No todas las entregas son a domicilio.
**Criterios de aceptación:**
- Cada entrega tiene una modalidad visible: "En local" o "A domicilio". Las entregas existentes quedan como "A domicilio", porque pasaron por ese flujo.
- El catálogo define por tipo de ayuda si **permite entrega en local** (nueva regla, editable por el administrador y auditada como las demás). Quedan habilitadas Caja de mercadería y Pañales de adulto; Materiales de construcción no, porque el maestro (§13) la define como exclusivamente a domicilio.
- En el detalle de una solicitud aprobada, la sección "Entrega" ofrece las dos opciones por separado y con su explicación:
  - **Entrega en local** (gestor social, bodega/logística o administrador): se registra en un solo paso, en el momento, con quién recibe, su relación con el beneficiario, la fecha y hora (por defecto ahora), una observación y la evidencia fotográfica si el tipo de ayuda la exige. Queda como entrega realizada, con quien la registró como responsable, y la solicitud pasa a "entregada".
  - **Entrega a domicilio** (bodega/logística o administrador): el flujo de siempre (programar fecha, asignar a terreno, registrar resultado, reprogramar si falla).
- Si una entrega a domicilio sigue pendiente o falló y la persona viene a retirar la ayuda, se puede registrar como entrega en local: la misma entrega cambia de modalidad y queda realizada, con el cambio en su historial.
- Las entregas en local no aparecen en "Mis entregas", "Rutas" ni en la caché offline de terreno. Sí aparecen en el listado de entregas, el historial del hogar ("Ayudas entregadas") y el detalle de la solicitud, con su modalidad.
- La salida de stock sigue siendo un paso aparte de bodega (US-11.03), igual que en la entrega a domicilio.
- La regla se valida en la base (función `registrar_entrega_local`), no solo en la pantalla: rol, solicitud aprobada, tipo de ayuda que permite entrega en local y entrega no realizada todavía.

### MR-07 ✅ — La entrega exige salida de stock y el sistema guía cómo marcar "entregada"
**Relacionada con:** US-11.03, US-12.01, US-12.04, US-27.03, MR-06.
**Pedido:** (1) la entrega debe exigir que la salida de stock esté registrada; (2) el sistema no indica cómo marcar una ayuda como "entregada".
**Criterios de aceptación:**
- **Salida de stock obligatoria.** Una ayuda con entrega física no se puede entregar sin que bodega haya registrado su salida de stock:
  - no se puede registrar una entrega en local ni programar una entrega a domicilio sin salida registrada;
  - terreno no puede marcar como realizada una entrega a domicilio sin salida (cubre las entregas ya programadas antes de esta regla); marcarla como fallida sí se puede;
  - la regla vive en la base (trigger sobre `entregas`), así que aplica igual a la pantalla, la sincronización offline y cualquier acceso directo, con un mensaje claro: "falta registrar la salida de stock".
- **Guía de pasos en la solicitud.** La sección "Entrega" muestra los pasos para completar la ayuda, con su estado y quién los hace: aprobada → salida de stock (bodega) → entrega (en local o a domicilio) → entregada. Debajo, el **próximo paso** concreto para el estado actual: qué falta, quién lo hace y dónde.
  - Con una entrega a domicilio pendiente se indica que la marca como entregada el funcionario de terreno asignado, desde "Mis entregas"; el administrador tiene además un botón para registrar el resultado.
  - El botón de la entrega en local dice "Marcar como entregada".
- **Terreno.** Si a una entrega asignada le falta la salida de stock, "Mis entregas" lo avisa y no ofrece "Marcar como realizada" hasta que bodega la registre.
- **Excepción: datos migrados.** La regla no aplica a solicitudes con `origen = 'migracion'`: el sistema anterior no llevaba inventario y la carga histórica inserta unas 12.100 entregas realizadas sin salida de stock (migración `20261028000003`).

### MR-08 ✅ — La aprobación otorga un beneficio periódico vigente hasta diciembre
**Relacionada con:** US-06.02, US-08.01, US-09.01, US-11.03, US-12.01, US-03.04, MR-06, MR-07. Maestro §11 ("periodicidad mensual, mes por medio, semestral", "consultas de última/próxima entrega"), que cierra el pendiente de "próxima entrega estimada".
**Pedido:** la evaluación social decide si el hogar accede a un beneficio. Una vez otorgado, el beneficio se entrega con cierta periodicidad hasta diciembre del año en curso. Hoy cada solicitud aprobada genera una sola entrega y la periodicidad del catálogo es un texto que no se usa.
**Decisiones del cliente (2026-10-28):**
- La periodicidad se define **por caso al aprobar**: el gestor social la propone en la evaluación y el aprobador la confirma o la cambia. El catálogo solo sugiere un valor por defecto.
- Son periódicos **Caja de mercadería** y **Pañales de adulto**. Materiales de construcción y los reembolsos siguen como ayuda única.
- Cada período **sale directo**: no se vuelve a evaluar. Sí exige su propia salida de stock (MR-07).
- El beneficio **parte el mismo mes de aprobación**.
- La **modalidad de entrega** (en local o a domicilio) se decide al aprobar, **por defecto a domicilio**. Aunque el beneficio sea a domicilio, la persona puede venir a retirar al local la entrega de cualquier período.
**Criterios de aceptación:**
- **Periodicidad:** mensual, mes por medio o semestral. Se guarda con la decisión de aprobación, también cuando es aprobación por excepción RSH, y su cambio queda auditado. El catálogo marca por tipo de ayuda si es periódico y cuál es su periodicidad por defecto (nueva regla, editable por el administrador y auditada como las demás).
- **Vigencia:** desde el mes de aprobación hasta el 31 de diciembre del mismo año. Ejemplos: si se aprueba en septiembre, la mensual da 4 entregas (septiembre a diciembre), la de mes por medio da 2 (septiembre y noviembre) y la semestral da 1. En enero el beneficio vence y el hogar necesita una nueva solicitud y evaluación. No se renueva solo.
- **Modalidad del beneficio:** se elige al aprobar, junto a la periodicidad, con "A domicilio" preseleccionado. Solo se ofrece "En local" si el tipo de ayuda lo permite (MR-06). La modalidad queda en la decisión, auditada, y la heredan todas las entregas del beneficio. El gestor social, el aprobador o el administrador pueden cambiarla mientras el beneficio esté vigente (por ejemplo, si el hogar empieza a retirar en el local), con motivo y sin afectar lo ya entregado.
- **Plazo y desplazamiento (decisión del cliente 2026-10-28):** un mes atrasado no se entrega.
  - **Mensual:** cada entrega se retira en su mes; el mes que no se retira se pierde.
  - **Entrega intermitente (mes por medio, semestral):** la entrega se puede retirar con atraso hasta antes de que toque la siguiente. Si se retira con atraso, el calendario se reestructura desde el mes del retiro. Ejemplo: mes por medio entregada en el mes 1; en el mes 3 no asiste y la retira en el mes 4; la siguiente es el mes 6. Si no la retira dentro de su plazo, se pierde y el calendario sigue como estaba.
  - **Fin de año:** después del 31 de diciembre no hay entregas, tampoco completar una ya programada.
- **Caso fortuito:** un beneficio en local no se programa a domicilio, salvo como caso fortuito de un mes. Bodega lo hace desde la solicitud, sin motivo escrito, y el beneficio sigue en local para los demás meses.
- **Cancelación automática:** las entregas programadas o fallidas cuyo plazo venció, o de un beneficio vencido después del 31 de diciembre, se cancelan solas (`cancelar_entregas_vencidas()`, migración `20261028000007`). Corre a diario con pg_cron y también al abrir las listas de entregas y el calendario de la solicitud. Queda en el historial de la entrega y sale de "Mis entregas" y de la ruta.
- **Retiro en local de un beneficio a domicilio:** si la persona viene a retirar al local la entrega de un período, se registra como entrega en local (mismo flujo de MR-06). Ese período queda "En local" en su historial y los demás períodos siguen a domicilio. Si esa entrega ya estaba asignada a terreno, sale de "Mis entregas", "Rutas" y la caché offline.
- **Entregas por período:** una solicitud periódica tiene una entrega por período (deja de existir la regla "una entrega por solicitud"), identificada por su mes y sin duplicados. Cada entrega exige su propia salida de stock (MR-07) y su propia foto de evidencia. No se puede entregar un período futuro antes de su mes.
- **Estado de la solicitud:** sigue "aprobada" mientras el beneficio esté vigente. Pasa a "entregada" al completarse el último período del año.
- **Suspensión:** el gestor social, el aprobador o el administrador pueden suspender un beneficio vigente con motivo obligatorio. Los períodos pendientes quedan cancelados, lo ya entregado se conserva y la suspensión queda en el historial de la solicitud y del hogar.
- **Visibilidad:** en el detalle de la solicitud y en la ficha del hogar ("Solicitudes y ayudas") se muestran el beneficio vigente, la periodicidad, la vigencia, la última entrega, la próxima entrega y el avance (por ejemplo, "2 de 4 entregados"). Bodega ve qué períodos del mes en curso necesitan salida de stock.
- **Excepciones visibles:** un beneficio aprobado por excepción RSH muestra la marca de excepción en cada una de sus entregas.
- **Datos migrados:** las solicitudes con `origen = 'migracion'` quedan como ayudas únicas, con su entrega histórica intacta.
- La regla vive en la base (períodos, vigencia, salida de stock por período), no solo en la pantalla.
**Implementación (2026-10-28):**
- Migraciones `20261028000004` (estado de entrega `cancelada`) y `20261028000005_beneficios_periodicos.sql`.
- **Catálogo:** `tipos_ayuda.periodicidad_beneficio` (null = ayuda única). Caja y Pañales quedan en mensual por defecto. El texto libre `periodicidad` se mantiene como descripción.
- **Propuesta y decisión:** el gestor propone la periodicidad (`evaluaciones_sociales.periodicidad_propuesta`). El aprobador la confirma junto con la modalidad (`decisiones_solicitud.periodicidad` / `modalidad_entrega`), en la aprobación regular y en la excepción RSH.
- **Beneficio:** tabla `beneficios`, que cuelga de `grupos_familiares` y se crea sola al pasar la solicitud de "en evaluación" a aprobada. Guarda la vigencia, la modalidad vigente, la marca de excepción RSH (`es_excepcion`, que no se pierde al entregar) y la suspensión. Los cambios pasan solo por `cambiar_modalidad_beneficio()` y `suspender_beneficio()`, con motivo y registro en `beneficios_historial`.
- **Calendario:** fuente única en `calendario_beneficio()` (migración `20261028000006`, que reemplazó a `periodos_beneficio()`). Cada período se identifica por el mes en que le corresponde, tiene un plazo de retiro y un estado: entregado (con el mes real), no entregado, abierto, por venir (estimado) o cancelado. Las entregas y salidas de stock llevan `periodo` (primer día del mes). Un período por solicitud con beneficio, y una sola entrega para la ayuda única (`periodo` null).
- **Triggers:** validan que el período pertenezca al beneficio, que ya haya comenzado, que el beneficio no esté vencido ni suspendido y que exista la salida de stock de ese período (MR-07).
- **Detalle de la solicitud:** sección "Beneficio" con el resumen y el calendario. Cada mes enlaza a `?periodo=AAAA-MM`, que es el período que trabajan "Stock" y "Entrega".
- **Ficha del hogar:** "Beneficios periódicos" y período y excepción en "Ayudas entregadas".
- **Bodega:** "Beneficios periódicos por entregar" en `/entregas`, con los períodos de plazo abierto y hasta cuándo se pueden retirar.
- **Evidencia:** en un beneficio cada período exige su propia foto; la de un mes anterior no cuenta.
- **Reportes:** "Ayudas entregadas" y "Hogares beneficiados" cuentan cada período entregado. Para las ayudas únicas los resultados no cambian (verificado: 25 = 25 en la base local).
- **Suspensión:** cierra la solicitud ("cerrada") y no se puede deshacer. Para retomar la ayuda, el hogar necesita una nueva solicitud.
- **Verificado en la base local:** 39 casos de reglas y permisos por rol, más el vencimiento. `tsc`, `lint` y `next build` limpios.
- **Verificado en navegador (2026-10-28):** con un usuario administrador temporal en la base local se hizo el flujo completo:
  - El gestor propone la periodicidad, el aprobador la cambia y la modalidad viene en "A domicilio".
  - Al aprobar se creó el beneficio de octubre a diciembre.
  - Se registró la salida de stock de octubre, se programó a domicilio y se registró el retiro en local de ese mes. El beneficio siguió a domicilio, el avance quedó en 1 de 3, la próxima entrega en noviembre y la solicitud siguió aprobada.
  - Noviembre quedó bloqueado hasta su mes.
  - Se cambió la modalidad con motivo y quedó en el historial.
  - La ficha del hogar y `/entregas` mostraron los beneficios, la lista "por entregar" (con la marca de excepción RSH y el aviso de salida de stock) y el período en cada entrega.
  - Se suspendió un beneficio: la solicitud quedó cerrada, sin próxima entrega y con el motivo en el historial.
  - El catálogo mostró el selector y el resumen del beneficio.
  - Los datos de prueba y el usuario se borraron después.
- **Carga del sistema anterior (decisión del cliente, 2026-10-28):** del sistema anterior se migrarán solo los beneficiarios (hogares e integrantes), no las entregas pasadas. Las reglas de `origen = 'migracion'` (MR-07 y esta historia) se mantienen y no estorban.
- **Ajuste del calendario verificado:**
  - En la base: 16 casos simulando meses dentro de una transacción revertida. Incluye el ejemplo del cliente; el mensual con mes perdido; una entrega programada que no se completa fuera de plazo ni en enero; el semestral retirado con atraso; y la solicitud que se cierra con un mes perdido.
  - En el navegador: el plazo de retiro en el calendario y en la lista de bodega, y el caso fortuito. Este programó a domicilio un mes sin cambiar el beneficio, que siguió en local.
- **No verificado:** la vista en móvil de la sección "Beneficio". Las capturas de pantalla del navegador no respondían en esta sesión.
