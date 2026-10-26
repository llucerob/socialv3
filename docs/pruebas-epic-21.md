# EPIC 21 — Pruebas y validación del MVP

**Estado:** las 11 historias de este EPIC (US-21.01 a US-21.11) se **ejecutaron en vivo** el 2026-10-26 contra Supabase local (`127.0.0.1:54321`, 63 migraciones aplicadas) y la app en `next dev`, conducidas con Playwright (Chromium headless) y verificadas en la base de datos con consultas SQL directas. Todas las dependencias (EPIC 23 informes sociales, EPIC 25 reembolsos excepcionales, EPIC 27 offline) ya están construidas, así que ninguna historia queda bloqueada.

El proyecto sigue sin framework de pruebas automatizadas (`CLAUDE.md`: "Tests: pendiente de definir"). Los scripts usados son de QA local, no forman parte del repositorio (`scripts-qa-tmp-*.mjs` en la raíz, sin versionar) y escriben datos de prueba en la BD local (hogares con dirección `QA21-…`, usuarios `qa.*@coinco.test`). **No deben ejecutarse contra una base con datos reales migrados** (`origen = 'migracion'`).

> **Re-ejecución tras corte de energía (2026-10-26):** una primera corrida se interrumpió por un apagón antes de actualizar este documento. Se verificó que ningún archivo versionado quedó truncado (`git status` limpio, `git fsck` sin errores, migraciones locales = aplicadas), se re-ejecutaron las 11 pruebas desde cero, y se corrigieron los scripts para que sean re-ejecutables (ver "Ajustes a los scripts de QA" al final). Los problemas encontrados fueron todos de los scripts, ninguno de la aplicación.

## Resumen de resultados

| Historia | Resultado | Observaciones |
|---|---|---|
| US-21.01 — Caja de mercadería | ✅ | Todos los criterios (cierre = `entregada_pagada`, ver decisión). |
| US-21.02 — Pañales | ✅ | Talla va como texto libre + producto por talla; cierre = `entregada_pagada`. |
| US-21.03 — Materiales de construcción | ✅ | Todos los criterios. |
| US-21.04 — Reembolso médico general | ✅ | Todos los criterios (cierre = `entregada_pagada`). |
| US-21.05 — Reembolso por diálisis | ✅ | Todos los criterios. |
| US-21.06 — Excepción RSH | ✅ | Todos los criterios, incluido el aislamiento de bodega. |
| US-21.07 — Excepcional por cirugía | ✅ | Todos los criterios. |
| US-21.08 — Excepcional por fallecimiento | ✅ | Todos los criterios. |
| US-21.09 — Entrega con corte de conexión | ✅ | Todos los criterios; hora de captura preservada con 20 s de corte. |
| US-21.10 — Ruta por cercanía | ✅ | Todos los criterios (con inserción en orden revuelto). |
| US-21.11 — Tramos y remanente compartido | ✅ | Todos los criterios. |

## Precondiciones generales

- Un usuario activo por rol: `administrador`, `evaluador_social`, `aprobador`, `bodega_logistica`, `terreno_repartidor`, `finanzas` (en QA: `qa.<rol>@coinco.test`, creados vía Auth Admin API y con rol asignado en `profiles`).
- Al menos un sector activo (`Centro`).
- Tipos de ayuda y productos base sembrados por migraciones.
- Hogares de prueba con `tramo_rsh` 25 (≤ 40), salvo US-21.06 que usa 55.
- Toda prueba que descuenta stock registra antes una entrada (`/inventario/{id}/entrada`).

## Decisión: `entregada_pagada` es el estado terminal (antes "hallazgo transversal: el estado `cerrada`")

US-21.01, US-21.02 y US-21.04 piden que "la solicitud queda cerrada". El enum `estado_solicitud` define `cerrada`, pero **ninguna acción la usa** (re-verificado: el literal solo aparece en `lib/solicitudes/types.ts`). El flujo real termina en `entregada_pagada`, vía `marcar_solicitud_entregada` (ayudas físicas) o `marcar_solicitud_reembolso_pagada` (reembolsos), que en la práctica es el estado terminal. Lo mismo ocurre con `asignada_entrega_pago`: existe en el enum pero ninguna acción lo asigna (crear la entrega deja la solicitud en `aprobada`).

**Decidido (2026-10-26):** se acepta `entregada_pagada` como estado terminal y el criterio "la solicitud queda cerrada" se redefine en ese sentido (ver `docs/backlog.md`, EPIC 21). No se agrega una acción manual de cierre: el Contexto Maestro no define un estado "cerrada", un paso manual dejaría solicitudes sin cerrar y metería ruido en los KPIs, y el estado actual ya lo asigna el sistema y queda auditado. Los valores `cerrada` y `asignada_entrega_pago` quedan en el enum sin uso.

---

## US-21.01 — Flujo completo de caja de mercadería ✅

**Ejecución:** admin crea hogar y solicitud (sin persona beneficiaria) → envío a evaluación → evaluador registra evaluación → aprobador aprueba "1 caja de mercadería" → bodega registra entrada (+5) y salida (−1) de stock, crea entrega asignada a terreno → terreno la marca realizada con receptor y foto.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se crea hogar | ✅ | hogar creado, redirección a `/hogares/{id}` |
| Se crea solicitud | ✅ | fila en `solicitudes` |
| Se evalúa | ✅ | evaluación visible en la solicitud |
| Se aprueba | ✅ | estado `aprobada`; `decisiones_solicitud` = `aprobada`, "1 caja de mercadería" |
| Se genera entrega | ✅ | entrega `pendiente` → `realizada`, receptor "Juan Receptor QA"; stock 13 → 17 (+5 −1) |
| Se registra evidencia | ✅ | 1 documento `fotografia` en la solicitud |
| La solicitud queda en estado terminal | ✅ | `entregada_pagada` |

## US-21.02 — Flujo completo de pañales ✅

**Ejecución:** hogar con integrante → solicitud "Pañales de adulto" con persona beneficiaria (obligatoria) → evaluación → aprobación "Talla M, 2 paquetes" → bodega: salida de 2 "Pañales talla M" → entrega realizada con evidencia.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se selecciona persona beneficiaria | ✅ | campo exigido; `persona_id` guardado |
| Se registra talla y cantidad | ⚠️ parcial | no hay campo "talla": va en el texto libre de la decisión ("Talla M, 2 paquetes") y en el producto descontado ("Pañales talla M") |
| Se aprueba solicitud | ✅ | decisión registrada |
| Se descuenta stock | ✅ | delta neto de la salida = −2 |
| Se registra entrega | ✅ | entrega `realizada` |
| Se cierra solicitud (estado terminal) | ✅ | `entregada_pagada` |

**Nota:** `requiere_documentos = true` para pañales no bloquea el envío a evaluación (pasó a `en_evaluacion` sin documentos). No es criterio de esta historia; para diálisis el bloqueo sí existe (US-21.05).

## US-21.03 — Flujo completo de materiales de construcción ✅

**Ejecución:** solicitud "Materiales de construcción" → documento de antecedente subido antes de evaluar → evaluación y aprobación "10 planchas OSB, 2 rollos de nylon" → salidas de stock por producto → entrega con foto → revisión del historial.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se crea solicitud | ✅ | — |
| Se adjuntan antecedentes | ✅ | 1 documento antes de la evaluación |
| Se aprueba detalle de materiales | ✅ | texto libre en la decisión |
| Se registra entrega | ✅ | 2 movimientos de stock (10 y 2), entrega realizada |
| Se adjunta evidencia | ✅ | 1 documento `fotografia` |
| El historial queda visible | ✅ | sección visible; `solicitudes_historial`: validación RSH, `ingresada→en_evaluacion→aprobada→entregada_pagada` |

## US-21.04 — Flujo completo de reembolso médico general ✅

**Ejecución** (en el script combinado de reembolsos): solicitud con persona y monto solicitado $60.000, fecha 2026-10-20 → boleta → evaluación → aprobación $50.000 (tope 1º tramo) → caso negativo: pago de $999.999 → pago de $50.000.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se crea solicitud | ✅ | — |
| Se adjuntan documentos | ✅ | boleta subida |
| Se registra monto solicitado | ✅ | $60.000 |
| Se aprueba monto | ✅ | aprobado $50.000 sin error, medidor de tope visible |
| Se registra pago | ✅ | pago $50.000; el pago de $999.999 se rechaza: "El monto pagado no puede superar el monto aprobado ($50.000)." |
| La solicitud queda en estado terminal | ✅ | `entregada_pagada` tras el pago |

## US-21.05 — Flujo completo de reembolso por diálisis ✅

| Criterio | Resultado | Evidencia |
|---|---|---|
| Exige certificado de diálisis | ✅ | sin documentos queda en `ingresada` con el mensaje "requiere adjuntar: certificado de diálisis y boleta o comprobante del gasto"; con ambos pasa a `en_evaluacion` |
| Calcula acumulado mensual | ✅ | medidor antes de la 1ª: $150.000 disponible; antes de la 2ª: $70.000 disponible |
| Muestra saldo disponible | ✅ | ídem; `max` del input = 70000 |
| Bloquea aprobación sobre $150.000 | ✅ | aprobar $100.000 se rechaza en el servidor: "supera el saldo mensual disponible ($70.000 de $150.000, acumulado $80.000). Requiere una excepción (US-15.05)." |
| Permite pago dentro del tope | ✅ | pagos $80.000 + $70.000 registrados |
| El reporte refleja el movimiento | ✅ | `/reportes/dialisis` muestra a la persona con $150.000 |

## US-21.06 — Aprobación por excepción RSH ✅

**Ejecución:** hogar con tramo RSH 55% → solicitud → evaluación → intento de aprobación regular → informe social → aprobación por excepción con autoridad solicitante → acceso como bodega.

| Criterio | Resultado | Evidencia |
|---|---|---|
| La aprobación regular se bloquea (RSH > 40%) | ✅ | `validacion_rsh`: "requiere excepción: tramo 55% > 40%" |
| Sin informe social no se puede aprobar por excepción | ✅ | bloqueo antes de crear el informe |
| La excepción se habilita tras el informe social | ✅ | botón de excepción presente después de crear el informe |
| Estado final marcado como excepción, nunca oculto | ✅ | `aprobada_excepcion`, badge "Aprobada por excepción" |
| Se registran motivo y autoridad solicitante | ✅ | `decisiones_solicitud`: comentario + "Alcaldía de Coinco" |
| La aprobación queda auditada | ✅ | `solicitudes_historial`: `en_evaluacion → aprobada_excepcion` |
| Bodega no ve la sección de informe social | ✅ | sin encabezado "Informe social" en el detalle (ver nota) |
| Bodega no accede a `/informes-sociales/nuevo` | ✅ | redirige a `/sin-permiso` |

**Nota:** la primera versión del script daba un falso positivo para bodega: buscaba el texto "Informe social", que también es una `<option>` oculta del filtro de tipo de documento. Se cambió a buscar el encabezado de la sección. Se verificó además que la RLS de `documentos` excluye `informe_social` para roles no sociales (`supabase/migrations/20260815000001_rls_documentos_rsh.sql`), así que el filtro no expone nada.

## US-21.07 — Reembolso excepcional por cirugía ✅

**Ejecución:** el hogar ya tiene 2 reembolsos generales aprobados ($50.000 + $25.000) → solicitud de cirugía por $40.000.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se crea solicitud con informe social asociado | ✅ | sin informe se bloquea: "No se puede aprobar sin un informe social asociado a esta solicitud."; con él, 1 informe asociado |
| Se calcula correctamente el remanente anual | ✅ | SQL: $75.000 usados, $25.000 de remanente; el medidor muestra lo mismo |
| Se aprueba dentro del remanente | ✅ | $40.000 no se envía (`max` = remanente, sin decisión en BD); $25.000 se aprueba (`monto_aprobado` = 25000) |
| Se registra pago | ✅ | pago $25.000 → `entregada_pagada` |
| Queda marcado como excepcional en historial y reportes | ✅ | tipo "Reembolso excepcional por cirugía" en la ficha del hogar; aparece en `/reportes/reembolsos-excepcionales` |

## US-21.08 — Reembolso excepcional por fallecimiento ✅

**Ejecución:** un segundo hogar sin reembolsos previos → integrante marcado fallecido → solicitud de fallecimiento por $60.000.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Solicitud con informe social asociado | ✅ | bloqueo sin informe (mismo mensaje); con informe, 1 asociado |
| Remanente correcto | ✅ | hogar sin consumo: $100.000 |
| Se aprueba dentro del remanente | ✅ | $60.000 aprobado sin error |
| Se registra pago | ✅ | pago $60.000; pago de $999.999 rechazado |
| Marcado como excepcional | ✅ | tipo "Reembolso excepcional por fallecimiento o servicio funerario"; aparece en el reporte de excepcionales |

**Nota:** `/reportes/reembolsos-excepcionales` solo es accesible para `ROLES_REPORTE` (el evaluador social es redirigido a `/sin-permiso`, por diseño). Se verificó como administrador: el reporte lista cirugía ($25.000) y fallecimiento ($60.000).

## US-21.09 — Entrega con corte de conexión ✅

**Ejecución:** terreno abre la entrega en `/mis-entregas`, el navegador pasa a offline (`context.setOffline(true)`), completa receptor, observación y foto, y marca realizada. Espera **20 s offline** y luego recupera la conexión sin intervención manual. Se repite el caso "fallida" (motivo "Dirección incorrecta") en una segunda entrega.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Se simula pérdida de señal durante el registro y la evidencia | ✅ | registro y foto completados offline |
| Los datos quedan locales y marcados como pendientes | ✅ | badge "Pendiente de sincronizar" en ambos casos |
| Al reconectar se sincroniza automáticamente | ✅ | sin intervención: realizada → `realizada` + foto en `documentos` + solicitud `entregada_pagada`; fallida → `fallida` con `motivo_fallo` (la solicitud sigue `aprobada`, reprogramable) |
| Se conserva la fecha/hora de captura | ✅ | `capturado_en` = `fecha_hora_entrega` = momento offline; `updated_at − capturado_en` = 20,3 s (hora de sync) |

## US-21.10 — Ruta por cercanía ✅

**Ejecución:** 4 hogares en un sector de prueba **insertados en orden revuelto (C, D, B, A)** para que el cálculo tenga que reordenar. A está junto al origen, B a pocos metros de A, C lejos y D sin coordenadas. Bodega filtra el sector y usa "Calcular orden por cercanía".

| Criterio | Resultado | Evidencia |
|---|---|---|
| Hogares con coordenadas en un mismo sector | ✅ | — |
| Orden razonable por cercanía | ✅ | `orden_ruta`: A=1, B=2, C=3 |
| Hogar sin coordenadas marcado y al final, sin bloquear | ✅ | D=4, con etiqueta "Pendiente de georreferenciar" |

## US-21.11 — Tramos y remanente compartido ✅

| Criterio | Resultado | Evidencia |
|---|---|---|
| Hogar usa 2 reembolsos generales ($50.000 + $25.000) | ✅ | SQL: total aprobado 2026 = 75000 |
| Remanente correcto ($25.000) | ✅ | medidor y SQL coinciden |
| Excepcional por cirugía limitado al remanente, no al tope teórico | ✅ | ver US-21.07: $40.000 bloqueado, $25.000 aprobado |
| 3ª solicitud general con tope $0, bloqueada con motivo | ✅ | medidor "$0 disponible — $100.000 usado de $100.000" y texto "No se puede aprobar: el hogar ya agotó los reembolsos generales disponibles este año"; la solicitud queda `en_evaluacion` |
| Solicitud general en enero/diciembre bloqueada | ✅ | fecha de enero: "solo puede solicitarse entre febrero y noviembre…"; estado sigue `ingresada` |

**Nota:** cuando el monto supera el remanente, el bloqueo ocurre en el cliente (atributo `max` del input), por eso el script no ve un mensaje de error del servidor. Se confirmó en BD que no se registró ninguna decisión.

---

## Ajustes a los scripts de QA (re-ejecución)

Ninguno de estos cambios toca código de la aplicación. Todos corrigen supuestos de los scripts que fallaban al re-ejecutarlos:

- **US-21.02 / US-21.05:** usaban RUT fijos (`11111111-1`, `22222222-2`) que ya existían desde la corrida anterior → ahora usan un RUT aleatorio con DV válido (`rutAleatorio()` en el helper).
- **US-21.01:** comparaba el stock con un valor absoluto (4) → ahora compara contra el stock previo + 5 − 1.
- **US-21.06:** falso positivo por la `<option>` "Informe social" → ahora busca el encabezado de la sección.
- **US-21.09:** seed y runners parametrizados con una etiqueta por corrida (`TAG`), porque la corrida interrumpida dejó una entrega QA21-09 `pendiente` duplicada que se confundía por texto (se dejó intacta). El ID de entrega fijo se reemplazó por la dirección etiquetada. La solicitud se siembra en `aprobada` (el estado real) en vez de `asignada_entrega_pago`, que la app nunca asigna. El corte offline se alargó a 20 s para que la hora de captura se distinga de la de sincronización.
- **US-21.10:** sector único por corrida e inserción en orden revuelto. Antes los hogares se insertaban ya en el orden esperado, así que la prueba no distinguía entre "ordenó bien" y "no hizo nada".
