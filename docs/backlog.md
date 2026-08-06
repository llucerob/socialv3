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

---

## 1. Criterio de priorización

- **P0 — Crítico MVP:** imprescindible para que el sistema funcione.
- **P1 — Importante MVP:** necesario para operación real, pero puede construirse después del flujo base.
- **P2 — Mejora controlada:** deseable para una versión posterior del MVP o primera iteración post-MVP.

---

## EPICs 00–02, 04, 06–12, 14–24 — sin cambios respecto a la v2

*(Se omiten aquí por brevedad; el contenido completo de estos EPICs — preparación técnica, autenticación y roles, panel principal, personas integrantes, catálogo de ayudas, solicitudes, evaluación social, aprobación y rechazo, documentos, entregas en domicilio, reembolsos médicos general y diálisis, auditoría, reportes, protección de datos, administración, hitos, informes sociales y compras municipales — se mantiene exactamente igual que en `Backlog_MVP_v2_Sistema_de_Ayudas_Sociales.md`. Este documento v3 solo detalla los EPICs modificados o nuevos: EPIC 03, EPIC 13, EPIC 20, EPIC 21, EPIC 25, EPIC 26 y EPIC 27.)*

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

> **📎 Nota:** esta historia resuelve el gap señalado en la sección 5 del Contexto Maestro v2 ("el grupo familiar no tenía captura de coordenadas en el backlog"). Pasa de ser un ajuste menor a un prerrequisito directo de EPIC 13, dada la decisión de usar ruteo automático por cercanía.

> **Estado:** implementado solo el ingreso manual numérico (el criterio ofrece "ingreso numérico *o* mapa", por lo que basta un método). Verificado end-to-end en local: creación sin coordenadas → badge "Pendiente de georreferenciar" visible en listado y ficha; edición con coordenadas válidas → badge desaparece y queda registrado en `grupos_familiares_historial`; rango inválido rechazado tanto por el input (`min`/`max` HTML5) como por `validarCampos` (server) y por el `check` de la migración (verificado con `update` directo por SQL). El mapa interactivo para marcar el punto no se construyó — si se requiere en el futuro, es una extensión de UI sobre los mismos campos `latitud`/`longitud`, no un cambio de datos.

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

### 🆕 US-21.07 — Probar flujo completo de reembolso excepcional por cirugía
**Prioridad:** P0 · **Dependencias:** EPIC 25.
**Criterios de aceptación:** se crea solicitud con informe social asociado · se calcula remanente anual correctamente · se aprueba dentro del remanente · se registra pago · queda marcado como excepcional en historial y reportes.

### 🆕 US-21.08 — Probar flujo completo de reembolso excepcional por fallecimiento
**Prioridad:** P0 · **Dependencias:** EPIC 25.
**Criterios de aceptación:** análogos a US-21.07, adaptados al caso de fallecimiento.

### 🆕 US-21.09 — Probar flujo de entrega con corte de conexión
**Prioridad:** P0 · **Dependencias:** EPIC 27.
**Criterios de aceptación:**
- Se simula pérdida de señal durante el registro de una entrega y su evidencia.
- Los datos quedan guardados localmente y marcados como pendientes de sincronizar.
- Al restablecer la conexión, los datos se sincronizan automáticamente sin intervención manual.
- El registro sincronizado conserva la fecha/hora original de captura, no la de sincronización.

### 🆕 US-21.10 — Probar cálculo automático de ruta por cercanía ✅⚠️
**Prioridad:** P1 · **Dependencias:** 🆕 US-13.04.
**Criterios de aceptación:** se crean hogares con coordenadas dentro de un mismo sector · el sistema calcula un orden razonable por cercanía · un hogar sin coordenadas queda correctamente marcado y al final de la lista, sin bloquear el cálculo del resto.

### 🆕 US-21.11 — Probar cálculo automático de tramos y remanente compartido entre reembolso general y excepcional
**Prioridad:** P0 · **Dependencias:** 🆕 US-14.05, 🆕 US-25.02.
**Criterios de aceptación:**
- Un hogar usa 2 reembolsos generales en el año ($50.000 + $25.000 = $75.000 usados).
- Se calcula correctamente el remanente disponible ($25.000).
- El hogar solicita un reembolso excepcional por cirugía; el sistema limita la aprobación a los $25.000 de remanente, no al tope teórico del caso excepcional.
- Una 3ª solicitud general posterior queda con tope $0 y el sistema bloquea su aprobación, mostrando el motivo (pool anual agotado).
- Una solicitud general enviada en enero o diciembre queda bloqueada por estar fuera del período vigente (febrero-noviembre).

> **Estado (EPIC 21):** el proyecto no tiene framework de pruebas automatizadas (`Tests: pendiente de definir`), así que "implementar" estas historias significó escribir planes de prueba manuales ejecutables, no código — ver `docs/pruebas-epic-21.md` para el detalle completo, paso a paso, con el resultado esperado mapeado a cada criterio de aceptación. Se escribieron planes para las 6 historias cuyas dependencias ya existen (US-21.01 a US-21.05 — headers en la v2 — y US-21.10, marcada ✅⚠️ arriba). Las 5 restantes (US-21.06, US-21.07, US-21.08, US-21.09, US-21.11) dependen de EPICs que todavía no están implementados (23, 25, 27) y quedan sin marcar — no es un "no aplica", es un bloqueo real documentado en `docs/pruebas-epic-21.md`, pendiente de revisarse cuando esos EPICs se construyan. Ningún plan se ejecutó contra una instancia real en esta sesión (Docker/Supabase no estaba disponible, igual que en las sesiones anteriores) — de ahí el ⚠️ en vez de un ✅ simple, mismo criterio que US-01.05 ✅⚠️. El plan de US-21.01/02/04 documenta además un hallazgo transversal: ninguna acción de la aplicación lleva una solicitud al estado `cerrada` (el enum lo define pero nada lo usa) — el flujo real termina en `entregada_pagada`, así que el criterio "la solicitud queda cerrada" no se cumple literalmente tal como está construido hoy.

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
