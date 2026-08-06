# EPIC 21 — Pruebas y validación del MVP

**Estado de esta entrega:** el proyecto no tiene ningún framework de pruebas automatizadas configurado (`CLAUDE.md`: "Tests: pendiente de definir"; no hay `jest`/`vitest`/`playwright` en `package.json`). Introducir uno sería una decisión técnica nueva no solicitada, así que este documento entrega **planes de prueba manuales**: procedimientos paso a paso, ejecutables por una persona contra una instancia real (local o de staging), con el resultado esperado de cada paso mapeado explícitamente a los criterios de aceptación de su historia.

No se ejecutaron estas pruebas en esta sesión — Docker/Supabase no estaba disponible, así que no había ninguna instancia contra la cual correrlas. Cada plan está escrito a partir de una lectura directa del código ya implementado (rutas, componentes, Server Actions, RLS), no de suposiciones, y anota explícitamente cuando algo en el código no cumple literalmente un criterio de aceptación.

## Alcance: 6 de 11 historias

Cuatro historias de este EPIC dependen de EPICs que todavía no existen en el proyecto y no pueden probarse:

| Historia | Depende de | Motivo del bloqueo |
|---|---|---|
| US-21.06 — Excepción RSH | EPIC 23 (informes sociales estructurados) | EPIC 23 no está implementado — no existe forma de "adjuntar informe social estructurado" en la aplicación. |
| US-21.07 — Reembolso excepcional por cirugía | EPIC 25 | EPIC 25 (reembolsos excepcionales) no está implementado — el flujo no existe. |
| US-21.08 — Reembolso excepcional por fallecimiento | EPIC 25 | Idem US-21.07. |
| US-21.11 — Tramos y remanente compartido general/excepcional | US-25.02 (parte de EPIC 25) | El remanente compartido con reembolsos excepcionales no puede probarse porque el lado "excepcional" no existe todavía; solo la mitad del criterio (reembolso general) es ejecutable hoy. |

Quedan documentadas aquí como bloqueadas, no como "no aplican" — deben volver a evaluarse cuando se implementen esos EPICs.

**Actualización (EPIC 27 implementado):** US-21.09 — Entrega con corte de conexión ya no está bloqueada. EPIC 27 (PWA offline) se implementó en una sesión posterior a la redacción original de este documento (`next-pwa`, IndexedDB, cola de sincronización — ver `docs/backlog.md`) y **sí se ejecutó en vivo** contra Supabase local y navegador real, a diferencia del resto de este documento (que quedó como plan sin ejecutar por falta de Docker en su momento). Ver detalle en la sección dedicada más abajo.

Las 7 restantes (US-21.01 a US-21.05, US-21.09, US-21.10) tienen todas sus dependencias construidas y se detallan a continuación.

## Precondiciones generales

- Al menos un usuario activo por rol necesario: `administrador`, `evaluador_social`, `aprobador`, `bodega_logistica`, `terreno_repartidor`, `finanzas`. Se asignan editando el usuario en `/admin/usuarios` (EPIC 19).
- Al menos un sector activo en `/admin/sectores` (EPIC 19) — necesario porque el formulario de hogar ya no acepta texto libre.
- Los tipos de ayuda y productos de inventario base ya vienen sembrados por las migraciones (`Caja de mercadería`, `Pañales de adulto`, `Materiales de construcción`, `Reembolso médico general`, `Reembolso médico por diálisis`; productos `Caja de mercadería`, `Pañales talla M/L/XL`, `Nylon`, `Ripio`, `Planchas OSB`, `Tapas`) — no hace falta crearlos.
- El stock de todos los productos parte en 0: cualquier prueba que llegue a "registrar salida de stock" necesita una entrada de stock previa (`/inventario/{id}/entrada`) como parte de la preparación.
- Un hogar de prueba con `tramo_rsh` ≤ 40 (p. ej. 25) para que ninguna de estas solicitudes quede bloqueada por el umbral de elegibilidad RSH (US-05.04, `UMBRAL_ELEGIBILIDAD_RSH = 40`) — ese bloqueo es un flujo distinto (US-21.06, bloqueada).

## Hallazgo transversal: el estado `cerrada`

Tres historias (US-21.01, US-21.02, US-21.04) piden explícitamente que "la solicitud queda cerrada" / "se cierra solicitud". El enum `estado_solicitud` incluye el valor `cerrada`, pero **ninguna acción de la aplicación transiciona una solicitud a `cerrada`** (verificado con `grep -r "'cerrada'"` sobre todo `lib/`/`app/`: el único lugar donde aparece el literal es la definición del tipo y del enum). El flujo real siempre termina en `entregada_pagada`, que en la práctica funciona como el estado terminal. Cada plan de prueba abajo lo marca explícitamente como criterio **no cumplible tal como está construido hoy** — no es un error de la prueba, es una discrepancia real entre el criterio de aceptación y el código. Se recomienda una historia de seguimiento pequeña (agregar una acción "Cerrar solicitud", o bien redefinir el criterio para aceptar `entregada_pagada` como cierre) antes de dar el EPIC por completamente validado.

---

## US-21.01 — Probar flujo completo de caja de mercadería

**Objetivo:** validar el ciclo solicitud → evaluación → aprobación → entrega para una ayuda material simple, sin persona beneficiaria.

**Roles necesarios:** administrador (o evaluador_social) para crear hogar/solicitud, evaluador_social para evaluar, aprobador para aprobar, bodega_logistica para stock y entrega, terreno_repartidor para completar la entrega.

**Precondiciones:** stock de "Caja de mercadería" ≥ 1 (registrar una entrada de al menos 5 unidades en `/inventario/{id}/entrada`).

**Pasos:**
1. Crear un hogar en `/hogares/nuevo` (dirección, sector del catálogo, tramo RSH 25).
2. Desde `/hogares/{id}`, crear una solicitud: tipo de ayuda "Caja de mercadería", fecha de hoy, motivo cualquiera. Persona beneficiaria: dejar vacía (no es obligatoria para este tipo).
3. En `/solicitudes/{id}`, usar "Enviar a evaluación".
4. Como evaluador_social, registrar una evaluación social: fundamento + recomendación "Aprobar".
5. Como aprobador, en la sección de decisión, aprobar con "Cantidad o detalle aprobado" = "1 caja de mercadería".
6. Como bodega_logistica, en la sección "Stock" de la misma solicitud, registrar salida: producto "Caja de mercadería", cantidad 1.
7. Como bodega_logistica (o administrador), crear la entrega desde la solicitud y asignar un responsable de terreno con fecha programada.
8. Como terreno_repartidor, en `/mis-entregas/{id}`, marcar la entrega como realizada: nombre de quien recibe (obligatorio) y evidencia fotográfica (obligatoria — `requiere_evidencia = true` para este tipo).

**Resultado esperado por criterio:**
- ✅ *Se crea hogar* — paso 1.
- ✅ *Se crea solicitud* — paso 2.
- ✅ *Se evalúa* — paso 4, visible en la sección de evaluaciones de la solicitud.
- ✅ *Se aprueba* — paso 5; `decisiones_solicitud` recibe la fila, estado pasa a `aprobada`.
- ✅ *Se genera entrega* — paso 7; estado pasa a `asignada_entrega_pago` o equivalente según el flujo de EPIC 12.
- ✅ *Se registra evidencia* — paso 8: el archivo subido debe aparecer en la sección "Documentos" de la solicitud con `tipo_documento = fotografia`.
- ⚠️ *La solicitud queda cerrada* — **no se cumple**: tras el paso 8 el estado queda en `entregada_pagada` (vía `marcar_solicitud_entregada`), no en `cerrada` (ver "Hallazgo transversal" arriba).

---

## US-21.02 — Probar flujo completo de pañales

**Objetivo:** validar el ciclo completo para una ayuda asociada a una persona beneficiaria específica, con descuento de stock.

**Roles necesarios:** igual que US-21.01.

**Precondiciones:** el hogar de prueba debe tener al menos un integrante activo (crear en `/hogares/{id}/integrantes/nuevo`). Stock de "Pañales talla M" ≥ 1.

**Pasos:**
1. Reutilizar el hogar de US-21.01 (o crear uno nuevo) con un integrante activo agregado.
2. Crear solicitud: tipo "Pañales de adulto". El campo "Persona beneficiaria" es **obligatorio** para este tipo (`requiere_persona_beneficiaria = true`) — seleccionar el integrante creado.
3. Enviar a evaluación, evaluar y aprobar igual que US-21.01, con "Cantidad o detalle aprobado" = "Talla M, 2 paquetes" (no existe un campo dedicado de "talla"; se registra como texto libre dentro de este mismo campo — anotarlo así en el resultado).
4. Bodega registra salida de stock: "Pañales talla M", cantidad 2.
5. Crear entrega, asignar a terreno, y terreno la marca como realizada con evidencia.

**Resultado esperado por criterio:**
- ✅ *Se selecciona persona beneficiaria* — paso 2, y el formulario la exige (atributo `required`, reforzado en el servidor).
- ⚠️ *Se registra talla y cantidad* — se cumple solo parcialmente: no hay campo "talla" propio, ambos datos van en el mismo texto libre de "cantidad o detalle aprobado" (paso 3). Suficiente para pasar la prueba, pero anotar como posible mejora de UX futura.
- ✅ *Se aprueba solicitud* — paso 3.
- ✅ *Se descuenta stock* — paso 4; confirmar que `productos.stock_actual` de "Pañales talla M" bajó en 2 tras la salida.
- ✅ *Se registra entrega* — paso 5.
- ⚠️ *Se cierra solicitud* — **no se cumple**, mismo hallazgo transversal que US-21.01 (queda en `entregada_pagada`).
- **Nota adicional:** `tipos_ayuda.requiere_documentos = true` para "Pañales de adulto", pero a diferencia del reembolso por diálisis, **no existe ningún bloqueo real** que impida enviar a evaluación sin documentos adjuntos — es metadata sin efecto para este tipo. No es parte de los criterios de aceptación de esta historia, pero vale la pena confirmarlo durante la ejecución (se puede completar el flujo sin subir nada a "Documentos").

---

## US-21.03 — Probar flujo completo de materiales de construcción

**Objetivo:** validar evaluación, aprobación y entrega con antecedentes adjuntos y verificar visibilidad del historial.

**Roles necesarios:** igual que US-21.01.

**Precondiciones:** stock de al menos un producto de materiales (p. ej. "Planchas OSB") ≥ 1.

**Pasos:**
1. Crear solicitud sobre el hogar de prueba: tipo "Materiales de construcción". Persona beneficiaria no es obligatoria para este tipo.
2. Antes o después de enviar a evaluación, subir al menos un documento a la solicitud (sección "Documentos", cualquier tipo — p. ej. "Otro") como antecedente.
3. Enviar a evaluación, evaluar y aprobar con "Cantidad o detalle aprobado" = "10 planchas OSB, 2 rollos de nylon".
4. Bodega registra salida de stock por cada producto aprobado.
5. Crear entrega, asignar a terreno, completar con evidencia fotográfica (`requiere_evidencia = true`).
6. Revisar la sección "Historial de cambios" de la solicitud (visible para administrador/evaluador_social).

**Resultado esperado por criterio:**
- ✅ *Se crea solicitud* — paso 1.
- ✅ *Se adjuntan antecedentes* — paso 2, visible en "Documentos".
- ✅ *Se aprueba detalle de materiales* — paso 3 (mismo mecanismo de texto libre que US-21.02).
- ✅ *Se registra entrega* — paso 5.
- ✅ *Se adjunta evidencia* — paso 5, archivo con `tipo_documento = fotografia`.
- ✅ *El historial queda visible* — paso 6: cada cambio de `estado` (vía `solicitudes_historial`, disparado automáticamente) debe listarse con fecha y usuario.

---

## US-21.04 — Probar flujo completo de reembolso médico general

**Objetivo:** validar documentos, monto solicitado/aprobado y pago para un reembolso médico general.

**Roles necesarios:** evaluador_social, aprobador, finanzas.

**Precondiciones:** ninguna de stock (este tipo tiene `requiere_entrega = false`). **La fecha de la solicitud debe caer entre febrero y noviembre** (US-14.07) — usar una fecha dentro de ese rango o el envío a evaluación quedará bloqueado con un mensaje explícito (ese bloqueo es correcto, pero no es lo que esta prueba busca validar). El hogar de prueba no debe tener ya 4 reembolsos generales aprobados este año calendario (tope de tramos, US-14.05/14.06) — usar un hogar sin reembolsos previos.

**Pasos:**
1. Crear solicitud: tipo "Reembolso médico general", persona beneficiaria (obligatoria), monto solicitado (p. ej. $40.000), fecha dentro de febrero-noviembre.
2. Subir al menos un documento de respaldo (p. ej. tipo "Boleta") — no hay bloqueo automático para este tipo específico (a diferencia de diálisis), pero es parte del criterio de aceptación probarlo igual.
3. Enviar a evaluación, evaluar (recomendación "Aprobar").
4. Aprobador aprueba con "Monto aprobado" = $40.000 (dentro del tope del 1º tramo, $50.000).
5. Como finanzas, en la sección "Pago" de la solicitud, registrar el pago: fecha, monto pagado (≤ monto aprobado), medio de pago.

**Resultado esperado por criterio:**
- ✅ *Se crea solicitud* — paso 1.
- ✅ *Se adjuntan documentos* — paso 2.
- ✅ *Se registra monto solicitado* — paso 1, campo obligatorio para tipos `reembolso`.
- ✅ *Se aprueba monto* — paso 4; verificar que el tope mostrado en el formulario coincide con el 1º tramo ($50.000) y el remanente anual del hogar.
- ✅ *Se registra pago* — paso 5; verificar que `pagos_reembolso` rechaza un monto mayor al aprobado si se prueba el caso negativo.
- ⚠️ *La solicitud queda cerrada* — **no se cumple**, mismo hallazgo transversal (queda en `entregada_pagada` vía `marcar_solicitud_reembolso_pagada`).

---

## US-21.05 — Probar flujo completo de reembolso por diálisis

**Objetivo:** validar certificado obligatorio, cálculo de acumulado mensual, bloqueo sobre el tope de $150.000 y reflejo en el reporte de diálisis.

**Roles necesarios:** evaluador_social, aprobador, finanzas, auditor_consulta o administrador (para revisar el reporte).

**Precondiciones:** una persona beneficiaria sin reembolsos de diálisis aprobados en el mes de prueba.

**Pasos — certificado obligatorio:**
1. Crear solicitud tipo "Reembolso médico por diálisis" para la persona de prueba, monto solicitado $80.000.
2. Sin subir ningún documento, intentar "Enviar a evaluación" → debe bloquearse con un mensaje que liste exactamente lo que falta (certificado de diálisis y boleta/comprobante).
3. Subir un documento tipo "Certificado de diálisis" y otro tipo "Boleta". Reintentar "Enviar a evaluación" → ahora debe pasar a `en_evaluacion`.

**Pasos — tope mensual y bloqueo:**
4. Evaluar y aprobar esta primera solicitud con monto aprobado $80.000 (el formulario debe mostrar "Acumulado mensual: $0 · saldo disponible: $150.000" antes de aprobar).
5. Crear una segunda solicitud de diálisis para la **misma persona, mismo mes**, monto solicitado $100.000, repitiendo certificado + boleta, y enviarla a evaluación y evaluación social.
6. Al aprobar la segunda, el formulario debe mostrar "Acumulado mensual: $80.000 · saldo disponible: $70.000" y bloquear cualquier intento de aprobar por sobre $70.000 (probar con $100.000 → debe rechazarse; con $70.000 → debe aceptarse).

**Pasos — pago y reporte:**
7. Como finanzas, registrar el pago de ambas solicitudes aprobadas.
8. Ir a `/reportes/dialisis` (administrador, finanzas o auditor_consulta) y verificar que la persona de prueba aparece con "Monto acumulado: $150.000" y "Saldo disponible: $0" para el mes de prueba.

**Resultado esperado por criterio:**
- ✅ *La solicitud exige certificado de diálisis* — paso 2/3.
- ✅ *El sistema calcula acumulado mensual* — pasos 4 y 6 (mensaje mostrado antes de aprobar).
- ✅ *El sistema muestra saldo disponible* — idem.
- ✅ *El sistema bloquea aprobación sobre $150.000* — paso 6 (intento de aprobar $100.000 sobre un saldo de $70.000 debe fallar tanto en el cliente como en el servidor).
- ✅ *El sistema permite pago dentro del tope* — paso 7.
- ✅ *El reporte de diálisis refleja el movimiento* — paso 8 (EPIC 17, `/reportes/dialisis`).

---

## US-21.10 — Probar cálculo automático de ruta por cercanía

**Objetivo:** validar que el cálculo de orden por cercanía (US-13.04) produce un orden razonable y maneja correctamente los hogares sin coordenadas.

**Roles necesarios:** administrador (para configurar el punto de origen y crear hogares con coordenadas), bodega_logistica (para calcular el orden).

**Precondiciones:** un punto de origen configurado en `/rutas/configuracion`. Un sector de prueba (p. ej. "Sector Prueba Rutas") creado en `/admin/sectores`.

**Pasos:**
1. Crear 4 hogares en el mismo sector de prueba, con solicitudes aprobadas y entregas pendientes asignadas a ese sector:
   - Hogar A: coordenadas cercanas al punto de origen.
   - Hogar B: coordenadas muy cercanas al Hogar A (a pocos metros).
   - Hogar C: coordenadas lejanas del origen (en el otro extremo de la comuna).
   - Hogar D: **sin coordenadas** (latitud/longitud vacías).
2. En `/entregas`, filtrar por el sector de prueba.
3. Presionar "Calcular orden por cercanía".
4. Revisar el orden resultante en la sección "Ruta del sector".

**Resultado esperado por criterio:**
- ✅ *Se crean hogares con coordenadas dentro de un mismo sector* — paso 1.
- ✅ *El sistema calcula un orden razonable por cercanía* — paso 4: el orden esperado es A → B → C (vecino más cercano desde el origen, heurística greedy) — confirmar que B queda inmediatamente después de A (son los más próximos entre sí) y no intercalado antes que A solo por estar más cerca del origen en línea recta.
- ✅ *Un hogar sin coordenadas queda correctamente marcado y al final de la lista, sin bloquear el cálculo del resto* — el Hogar D debe aparecer al final, con la etiqueta "Sin georreferenciar", y A/B/C deben quedar ordenados con normalidad (el cálculo no debe fallar ni excluir a D de la lista, solo de la heurística de distancia).

---

## Resumen de cobertura

| Historia | Ejecutable hoy | Resultado esperado |
|---|---|---|
| US-21.01 | Sí | Todos los criterios excepto "queda cerrada" (ver hallazgo transversal). |
| US-21.02 | Sí | Todos los criterios; "talla" se registra como texto libre, no campo dedicado; "se cierra" no se cumple. |
| US-21.03 | Sí | Todos los criterios se cumplen tal como están escritos. |
| US-21.04 | Sí | Todos los criterios excepto "queda cerrada". |
| US-21.05 | Sí | Todos los criterios se cumplen tal como están escritos. |
| US-21.06 | No — bloqueada por EPIC 23 | — |
| US-21.07 | No — bloqueada por EPIC 25 | — |
| US-21.08 | No — bloqueada por EPIC 25 | — |
| US-21.09 | Sí (ejecutada en vivo, ver EPIC 27 en `docs/backlog.md`) | Todos los criterios se cumplen: registro offline (realizada/fallida), evidencia con foto sobreviviendo recarga de página, sincronización automática preservando `capturado_en` original, indicador de estado, resolución de conflictos con auditoría. |
| US-21.10 | Sí | Todos los criterios se cumplen tal como están escritos. |
| US-21.11 | No — bloqueada por US-25.02 (EPIC 25) | — |
