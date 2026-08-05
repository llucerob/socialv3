# Contexto Maestro del Proyecto v3 — con Trazabilidad al Backlog
### Sistema de Administración de Ayudas Sociales — Departamento Social, Municipalidad de Coinco

> **Nota de versión:** este documento agrega, respecto a la versión original, un bloque **📎 Trazabilidad backlog** al final de cada sección temática, que referencia los EPIC / historias de usuario correspondientes en el **Backlog MVP v3** (`Backlog_MVP_v3_Sistema_de_Ayudas_Sociales.md`). Donde el backlog aún no cubre algo que este documento exige, se marca explícitamente con **⚠️ Pendiente de backlog**, en vez de dejarlo sin mención. Al final se incluye una **Matriz de Trazabilidad General** (sección 61) con la vista completa sección-por-sección.
>
> **Respecto a la v2 de este documento:** las tres brechas marcadas entonces como "⚠️ Pendiente — sin EPIC" ya se cerraron en el Backlog v3 — reembolsos excepcionales por cirugía/fallecimiento (🆕 EPIC 25), gestión de incidentes de seguridad (🆕 EPIC 26) y modo offline para la PWA de terreno (🆕 EPIC 27, con alcance acotado a cortes momentáneos de señal). También se agregó captura de coordenadas del hogar (🆕 US-03.06) y ruteo automático por cercanía geográfica (🆕 US-13.04). Las secciones afectadas quedaron actualizadas más abajo, y la Matriz de Trazabilidad General (sección 61) refleja el estado final.
>
> El contenido original no se modificó; solo se actualizaron las anotaciones de trazabilidad.

---

## 1. Antecedentes Generales

La Municipalidad de Coinco requiere implementar un sistema de administración de ayudas sociales para apoyar la gestión del Departamento Social. Coinco es una comuna con características rurales, por lo que el sistema debe considerar sectores dispersos, domicilios con referencias no siempre estandarizadas, entregas a domicilio, caminos rurales, posibles problemas de conectividad y necesidad de optimizar recursos municipales.

El sistema deberá permitir administrar de manera centralizada el ciclo completo de las ayudas sociales entregadas por la municipalidad, desde el registro del grupo familiar y la solicitud de ayuda hasta la evaluación social, aprobación, compra, stock, entrega, evidencia, historial y reportes consolidados.

Actualmente, las ayudas sociales entregadas por el municipio son: cajas de mercadería, pañales de adulto, materiales de construcción, reembolsos médicos. El sistema debe quedar preparado para incorporar nuevos tipos de ayuda social en el futuro.

Una característica central del sistema es que las ayudas sociales se entregan al grupo familiar, no solo a una persona individual.

**📎 Trazabilidad backlog:** contexto general del proyecto — no corresponde a un EPIC específico, pero enmarca el criterio de priorización (sección 1 del backlog) y las decisiones de descope rural (EPIC 13 rutas, EPIC 20 experiencia móvil).

---

## 2. Objetivo General

Desarrollar un sistema web que permita registrar beneficiarios, grupos familiares, Registro Social de Hogares, solicitudes, evaluaciones sociales, informes, hitos, compras, stock, entregas, rutas domiciliarias, evidencia, documentos y reportes consolidados.

**📎 Trazabilidad backlog:** cubre transversalmente EPIC 03 (grupos familiares), EPIC 05 (RSH), EPIC 07 (solicitudes), EPIC 08 (evaluación), 🆕 EPIC 22 (hitos), 🆕 EPIC 23 (informes sociales), 🆕 EPIC 24 (compras), EPIC 11 (stock), EPIC 12/13 (entregas y rutas), EPIC 10 (documentos), EPIC 17 (reportes).

---

## 3. Objetivos Específicos

**📎 Trazabilidad backlog por objetivo:**

| Objetivo específico | EPIC / Historia |
|---|---|
| Base de datos comunal de beneficiarios y grupos familiares | EPIC 03, EPIC 04 |
| Asociar grupo familiar a RSH único | US-05.01 |
| Registrar solicitudes | EPIC 07 |
| Evaluar según % RSH, antecedentes y stock | 🆕 US-05.04, US-08.01, US-11.04 |
| Aprobaciones regulares y excepcionales | US-09.01, 🆕 US-05.05 |
| Informes sociales e hitos | 🆕 EPIC 22, 🆕 EPIC 23 |
| Compras municipales | 🆕 EPIC 24 (post-MVP) |
| Inventario y stock | EPIC 11 |
| Entregas local/domicilio | EPIC 12 |
| Rutas optimizadas | EPIC 13 |
| Entrega efectiva y evidencia | US-12.04, US-12.06 |
| Límites anuales/mensuales de reembolsos | EPIC 14, EPIC 15 |
| Digitalizar boletas y documentos | EPIC 10 |
| Reportes consolidados y nominativos | EPIC 17 |
| Privacidad, seguridad, auditoría | EPIC 16, EPIC 18 |

---

## 4. Principio Central del Sistema

Las ayudas sociales se administran principalmente a nivel de grupo familiar, asociado a un RSH único, aunque exista una persona solicitante, receptora o beneficiaria directa.

**📎 Trazabilidad backlog:** EPIC 03 (US-03.01 a US-03.05) modela el grupo familiar como entidad central; US-04.04 asegura que las ayudas personales (pañales, reembolsos) igual queden ancladas al historial del hogar.

---

## 5. Unidad Principal de Gestión: Grupo Familiar

Cada grupo familiar deberá contar con identificador, RSH asociado, porcentaje RSH, fecha de actualización, dirección, sector, referencia domiciliaria, coordenadas, teléfono, estado, integrantes, historial de ayudas (solicitadas/aprobadas/rechazadas/entregadas), hitos, informes sociales, documentos y observaciones.

**📎 Trazabilidad backlog:**
- Campos base del hogar → US-03.01 (campos mínimos: dirección, sector, teléfono, tramo RSH, fecha actualización RSH, observaciones, estado).
- Historial de ayudas → US-03.04 (ficha del hogar muestra solicitudes y ayudas entregadas), US-08.02 (revisión de historial durante evaluación).
- Hitos del hogar → 🆕 US-22.01, 🆕 US-22.02.
- Informes sociales del hogar → 🆕 US-23.01, 🆕 US-23.02.
- ✅ **Resuelto en Backlog v3:** se agregó 🆕 **US-03.06 — Registrar coordenadas del domicilio**, como prerrequisito directo del cálculo automático de rutas por cercanía (ver sección 35 y 🆕 US-13.04). Un hogar sin coordenadas puede seguir operando con normalidad; solo queda excluido del cálculo fino de orden de ruta.

---

## 6. Ficha Personal del Beneficiario

Nombre, RUT, fecha de nacimiento, sexo, dirección, coordenadas, sector, teléfono, correo, RSH, grupo familiar, situación laboral, situación habitacional, observaciones, estado (activo/inactivo/fallecido/no reside en la comuna). Búsqueda por nombre, RUT, grupo familiar, RSH, sector, estado.

**📎 Trazabilidad backlog:** US-04.01 (agregar integrante, campos mínimos: RUT, nombres, apellidos, fecha de nacimiento, parentesco, estado), US-04.02 (editar), US-04.03 (cambiar estado), US-03.02 (búsqueda, incluye por nombre/RUT de integrante).
⚠️ **Pendiente de backlog:** el maestro define más campos de la ficha (sexo, situación laboral, situación habitacional, correo electrónico) y más estados (fallecido, no reside en la comuna) que los "campos mínimos" listados en US-04.01/US-04.03. No es necesariamente un error — el backlog define un MVP reducido — pero conviene confirmar si estos campos se agregan como criterios adicionales de US-04.01 o quedan para una iteración posterior.

---

## 7. Registro Social de Hogares

Identificador RSH, porcentaje, fecha de actualización, documento de respaldo, integrantes asociados, observaciones, estado de vigencia.

**📎 Trazabilidad backlog:** US-05.01 (registrar tramo), US-05.02 (adjuntar respaldo, P1), US-05.03 (alertar desactualizado, P2).

---

## 8. Regla General de Elegibilidad

Para acceder a cualquier ayuda social, el grupo familiar deberá tener un porcentaje RSH ≤ 40%. Si supera el 40%, el sistema advierte incumplimiento pero puede permitir aprobación excepcional con autorización de alcaldía respaldada por informe social.

**📎 Trazabilidad backlog:** 🆕 **US-05.04 — Validar regla general de elegibilidad (RSH ≤ 40%)**. Esta es la regla más importante del maestro y en la v1 del backlog no tenía historia propia; quedó corregido en la v2.

---

## 9. Excepciones a la Regla del 40%

Excepción aplicable cuando el hogar supera el 40%, existe situación social justificada, petición/autorización de alcaldía e informe social de respaldo. La excepción debe registrar tipo de ayuda, hogar, porcentaje RSH, motivo, autoridad solicitante, informe social, asistente responsable, fecha, usuario, observaciones, estado. **No debe ocultarse que es una excepción.**

**📎 Trazabilidad backlog:** 🆕 **US-05.05 — Registrar excepción a la regla del 40% RSH**, con todos los campos mínimos exigidos aquí replicados en la historia. Depende de 🆕 EPIC 23 (informe social estructurado) y se prueba end-to-end en 🆕 US-21.06.

---

## 10. Ayudas Sociales Vigentes

Cajas de mercadería, pañales de adulto, materiales de construcción, reembolsos médicos — configurables mediante mantenedores.

**📎 Trazabilidad backlog:** EPIC 06 — US-06.01 (catálogo inicial con estos 4 tipos + reembolso por diálisis desagregado), US-06.02 (reglas por tipo), US-06.03 (activar/desactivar).

---

## 11. Cajas de Mercadería

Periodicidad (mensual, mes por medio, semestral), modalidad (local/domicilio), registro de cada entrega, consultas de última/próxima entrega e historial.

**📎 Trazabilidad backlog:** US-06.02 (regla de periodicidad configurable por ayuda), EPIC 07 (solicitud), EPIC 12 (entrega), US-11.01 a US-11.04 (stock, ⬆️ re-priorizado a P0), 🆕 US-21.01 (prueba de flujo completo).
⚠️ **Pendiente de backlog:** el maestro pide poder **consultar "próxima entrega estimada" según periodicidad** — no hay una historia explícita que calcule esto automáticamente; hoy el backlog solo permite ver historial de entregas (US-03.04), no proyectar la próxima fecha. Se recomienda evaluarlo para el EPIC 17 (reportes) en una iteración posterior.

---

## 12. Pañales de Adulto

Asociados a integrante específico, dependen de stock, requieren documentos de respaldo.

**📎 Trazabilidad backlog:** US-04.04 (asociación a integrante obligatoria), EPIC 11 (stock), EPIC 12 (entrega), 🆕 US-21.02 (prueba de flujo completo).

---

## 13. Materiales de Construcción

Entrega exclusivamente a domicilio, tratados como producto inventariable (nylon, ripio, planchas OSB, tapas). No se debe permitir programar entrega sin stock suficiente.

**📎 Trazabilidad backlog:** US-11.01 (productos iniciales incluyen explícitamente estos materiales), US-11.03 (criterio de aceptación: "no se permite registrar la entrega si el stock resultante sería negativo... la solicitud queda en pendiente de stock" — cubre exactamente esta regla), 🆕 US-21.03 (prueba de flujo completo). La re-priorización de EPIC 11 a P0 (⬆️) en la v2 del backlog responde directamente a esta regla.

---

## 14. Reembolsos Médicos (tipos)

General, excepcional por cirugía, excepcional por fallecimiento/servicio funerario, excepcional por diálisis.

**📎 Trazabilidad backlog:** EPIC 14 (general), EPIC 15 (diálisis), 🆕 EPIC 25 (cirugía y fallecimiento).
✅ **Resuelto en Backlog v3:** el reembolso excepcional por cirugía y por fallecimiento/servicio funerario (secciones 17 y 18) ahora tiene su propio EPIC — 🆕 **EPIC 25**, con cálculo de remanente anual compartido con el esquema general (🆕 US-25.02) y pruebas de flujo completo dedicadas (🆕 US-21.07, US-21.08).

---

## 15. Reembolso Médico General

Vigente febrero-noviembre, máximo 4 reembolsos anuales, montos $50.000/$25.000/$12.500/$12.500, tope anual $100.000.

**📎 Trazabilidad backlog:** US-14.01 (crear solicitud), US-14.03 (aprobar monto), US-14.04 (registrar pago).
✅ **Resuelto:** se agregaron 🆕 US-14.05 (calcular número de reembolso y tope correspondiente), 🆕 US-14.06 (bloquear fuera de tope) y 🆕 US-14.07 (validar período febrero-noviembre). Decisión de diseño confirmada con el equipo del proyecto: el tope anual de $100.000 es **por grupo familiar** (no por persona), compartido entre reembolsos generales y excepcionales — 🆕 US-25.02 es la fuente única de ese cálculo, reutilizada por ambos esquemas. Prueba dedicada: 🆕 US-21.11.
La validación del período (febrero-noviembre) también quedó confirmada: se hace contra la **fecha de la solicitud**, independiente de la fecha del gasto médico en la boleta.

---

## 16. Proceso de Solicitud de Reembolso Médico General

Flujo: solicitud → boletas digitalizadas → validación de periodo y cantidad de reembolsos usados → monto solicitado → aprobación → pago → actualización de historial.

**📎 Trazabilidad backlog:** EPIC 07 (solicitud genérica) + EPIC 14 + EPIC 10 (US-10.01, digitalización de boletas).

---

## 17. Reembolso Médico Excepcional por Cirugía

Uso del monto total anual disponible o remanente pendiente.

**📎 Trazabilidad backlog:** ✅ 🆕 US-25.01 (crear solicitud), 🆕 US-25.02 (cálculo de remanente anual, compartido con el esquema general), 🆕 US-25.03 (aprobar monto), 🆕 US-25.06 (registrar pago). Prueba de flujo completo: 🆕 US-21.07.

---

## 18. Reembolso Médico Excepcional por Fallecimiento o Servicio Funerario

Misma lógica de remanente/total anual disponible que cirugía.

**📎 Trazabilidad backlog:** ✅ 🆕 US-25.04 (crear solicitud), 🆕 US-25.02 (remanente anual compartido), 🆕 US-25.05 (aprobar monto), 🆕 US-25.06 (registrar pago). Prueba de flujo completo: 🆕 US-21.08.

---

## 19–25. Reembolso Médico Excepcional por Diálisis (regla, validación, estados, historial, reportes)

Tope mensual $150.000, certificado médico obligatorio, tratado como caso separado del esquema general de 4 reembolsos anuales.

**📎 Trazabilidad backlog:** EPIC 15 completo — US-15.01 (crear solicitud), US-15.02 (certificado obligatorio), US-15.03 (cálculo de acumulado mensual), US-15.04 (bloqueo sobre tope), US-15.05 (excepción al tope, P2), US-17.04 (reporte de diálisis), 🆕 US-21.05 (prueba de flujo completo). Este es el módulo mejor cubierto de todo el backlog — trazabilidad 1:1 casi perfecta entre maestro y backlog.

---

## 26. Hitos del Beneficiario o Grupo Familiar

Registros de asistentes sociales (tipo familiar/social/salud), con categoría, comentario, fecha, asistente responsable, hogar/beneficiario asociado. Acceso restringido por su carácter sensible.

**📎 Trazabilidad backlog:** 🆕 **EPIC 22 completo** — US-22.01 (registrar hito, con los mismos campos mínimos descritos aquí), US-22.02 (ver historial de hitos), US-22.03 (RLS y restricción de acceso). Este EPIC no existía en la v1 del backlog; fue agregado en la v2 exactamente para cerrar esta brecha.

---

## 27. Informes Sociales

Respaldan evaluaciones, excepciones RSH, casos de cirugía/fallecimiento/diálisis, situaciones de vulnerabilidad, etc. Campos: hogar, beneficiario, fecha, asistente responsable, motivo, evaluación social, antecedentes, situación habitacional/económica/de salud, recomendación, ayuda sugerida, documentos, nivel de confidencialidad, observaciones.

**📎 Trazabilidad backlog:** 🆕 **EPIC 23 completo** — US-23.01 (crear informe social estructurado, con los mismos campos), US-23.02 (ver informes por hogar), US-23.03 (vincular informe a excepción RSH o caso especial). En la v1 del backlog esto solo existía como tipo de documento adjunto (US-10.01); en la v2 se modela como entidad propia.

---

## 28. Mantenedor de Ubicación

Dirección, sector, localidad, referencia domiciliaria, latitud, longitud, observaciones para entrega, estado de validación.

**📎 Trazabilidad backlog:** US-19.02 (administrar sectores) + 🆕 US-03.06 (coordenadas del hogar, agregada en v3) cubren la mayor parte de esta sección.
⚠️ **Parcialmente pendiente:** sigue sin existir un mantenedor de **localidades** independiente de sectores, ni un campo de **estado de validación de la ubicación** (quién confirma que una coordenada es correcta). La captura de latitud/longitud ya quedó resuelta (🆕 US-03.06); su validación formal, no. Es un ajuste menor, no bloquea el MVP.

---

## 29. Compras Municipales

Tipo de producto, proveedor, número de orden de compra, fechas, cantidad, valores, documento tributario, funcionario responsable. Vinculable a inventario y entregas.

**📎 Trazabilidad backlog:** 🆕 **EPIC 24** — US-24.01 (registrar proveedor), US-24.02 (registrar compra), US-24.03 (vincular compra con ingreso de stock). Marcado explícitamente como **post-MVP (P2)** en la v2 del backlog; en la v1 este módulo no existía ni se mencionaba como decisión consciente.

---

## 30. Inventario y Stock

Ingresos, salidas, ajustes, stock actual/reservado/mínimo, alertas de stock bajo, historial de movimientos, asociación a compras y entregas.

**📎 Trazabilidad backlog:** EPIC 11 — US-11.01 (productos), US-11.02 (entradas), US-11.03 (salidas por entrega, con bloqueo de stock negativo), US-11.04 (ver stock disponible). ⬆️ Re-priorizado de P1 a P0 en la v2, y ahora forma parte del "backlog mínimo imprescindible".
⚠️ **Pendiente de backlog:** el maestro pide **alertas de stock bajo** y **registro de ajustes** de inventario; el backlog cubre entradas/salidas pero no tiene un criterio explícito de aceptación para ajustes manuales ni para alertas automáticas de stock mínimo (aunque el campo "stock mínimo" sí existe en US-11.01). Recomendado como refinamiento menor de US-11.04.

---

## 31. Solicitudes de Ayuda Social

Campos y estados de la solicitud (ingresada, pendiente de antecedentes, en evaluación, aprobada, rechazada, aprobada por excepción, pendiente de stock, programada, entregada, no entregada, reagendada, anulada).

**📎 Trazabilidad backlog:** EPIC 07 completo — US-07.01 (crear), US-07.02 (borrador), US-07.03 (enviar a evaluación, incluye validación RSH), US-07.04/05 (listado/detalle), US-07.06 (cambio de estado, con los mismos estados mínimos listados aquí, incluyendo "aprobada por excepción").

---

## 32–34. Entregas (general, local, domicilio)

Registro de entrega, modalidad, funcionario responsable, estados de entrega, agrupación por sector para domicilio.

**📎 Trazabilidad backlog:** EPIC 12 — US-12.01 a US-12.07 (crear, asignar, ver desde teléfono, registrar realizada/fallida, evidencia, ubicación opcional).
⚠️ **Pendiente de backlog:** el maestro define estados de entrega más granulares (dirección no encontrada, beneficiario ausente, rechazada por beneficiario, entrega parcial) que los cubiertos explícitamente por US-12.04/US-12.05 (que mencionan solo "realizada" y "fallida" con motivo genérico). No bloquea el MVP, pero conviene decidir si estos matices se agregan como opciones del campo "motivo" de US-12.05.

---

## 35. Módulo de Rutas

Selección de ayudas pendientes, filtros, mapa, ruta sugerida, agrupación por cercanía, asignación a funcionario/vehículo, avance de ruta.

**📎 Trazabilidad backlog:** EPIC 13 — US-13.01 (agrupar por sector, P0), 🆕 **US-13.04** (calcular orden sugerido por cercanía geográfica mediante heurística de vecino más cercano sobre distancia en línea recta — agregada en v3, con recomendación técnica de librería `@turf/turf` incluida directamente en la historia), US-13.02 (ajuste manual sobre el orden calculado, ahora P1), US-13.03 (abrir en app de mapas, P1), 🆕 US-13.05 (marcar hogares sin georreferenciar).
✅ **Brecha de "ruta sugerida" cerrada, con alcance explícito:** el maestro plantea además integración con mapa, ruteo por calles reales y vehículo asignado — eso queda deliberadamente diferido a una iteración posterior (camino de evolución con OSRM/Google Directions/Mapbox ya anotado directamente en 🆕 US-13.04, tal como el propio maestro sugiere en esta misma sección como "versión posterior").

---

## 36–39. Aplicación Móvil o PWA, Datos Visibles, Evidencia, Funcionamiento sin Conexión

PWA con inicio de sesión seguro, rutas, evidencia con foto/firma/GPS, **trabajo sin conexión y sincronización posterior**.

**📎 Trazabilidad backlog:** EPIC 20 (US-20.01 vista móvil responsive, US-20.02 minimización de datos visibles), US-12.06 (evidencia), US-12.07 (GPS opcional, P2), y 🆕 **EPIC 27 — Modo offline para la PWA de terreno** (agregado en v3): 🆕 US-27.01 (instalación como PWA), 🆕 US-27.02 (cachear la ruta del día), 🆕 US-27.03/US-27.04 (registrar entrega y evidencia sin conexión), 🆕 US-27.05 (sincronización automática al reconectar), 🆕 US-27.06 (indicador de estado de sincronización), 🆕 US-27.07 (resolución simple de conflictos). Prueba dedicada: 🆕 US-21.09.

✅ **Brecha cerrada, con alcance acotado explícito:** a diferencia de como lo describe el maestro (que no distingue niveles de profundidad del modo offline), el equipo del proyecto definió deliberadamente un alcance **acotado** para esta iteración: EPIC 27 tolera **cortes momentáneos de señal durante la jornada de reparto**, no trabajo de varios días sin conexión ni descarga masiva de rutas futuras. Esta es ahora una decisión consciente de diseño, documentada en el propio EPIC 27 — a diferencia de la v2 de este documento, donde esto aparecía como una brecha sin identificar.

---

## 40–43. Seguridad y Protección de Datos Personales, Finalidad, Responsable del Tratamiento, Datos Sensibles

Ley 21.719 (vigencia 1 de diciembre de 2026), finalidad clara, municipalidad como responsable del tratamiento, listado de datos especialmente sensibles.

**📎 Trazabilidad backlog:** EPIC 18 — US-18.01 (minimización), US-18.02 (restricción de acceso a documentos sensibles), US-18.03 (finalidad del tratamiento documental), US-18.04 (retención, P2). Los datos sensibles listados en la sección 43 (informes sociales, hitos, RSH, boletas, certificados) están cubiertos por EPIC 22, EPIC 23, EPIC 10 y EPIC 18 en conjunto.

---

## 44. Roles y Permisos

Administrador, Asistente Social, Administrativo Social, Encargado de Bodega, Encargado de Compras, Funcionario de Terreno, Jefatura/Dirección.

**📎 Trazabilidad backlog:** US-01.03 define roles mínimos algo más agregados (Administrador, Evaluador social, Aprobador, Bodega/logística, Terreno/repartidor, Finanzas, Auditor/consulta).
⚠️ **Nota de trazabilidad (no necesariamente un gap):** el maestro separa "Asistente Social" de "Administrativo Social" y agrega un rol específico de "Encargado de Compras" y "Jefatura/Dirección" que no aparecen 1:1 en US-01.03. Conviene confirmar si estos se resuelven como sub-permisos dentro de los roles del backlog o si se requieren roles adicionales antes de implementar RLS (US-01.05).

---

## 45. Auditoría y Trazabilidad

Registro automático de acciones relevantes (login, CRUD, cambios de estado, aprobaciones, excepciones, entregas, stock, rutas, evidencia). No editable por usuarios comunes.

**📎 Trazabilidad backlog:** EPIC 16 — US-16.01 (creación de entidades, incluyendo 🆕 EPIC 22/23), US-16.02 (cambios de estado), US-16.03 (aprobación/rechazo/montos, incluyendo 🆕 excepciones RSH), US-16.04 (consulta de auditoría, P1).

---

## 46. Política de Conservación de Datos

**📎 Trazabilidad backlog:** US-18.04 (P2, post-MVP).

---

## 47. Gestión de Incidentes de Seguridad

Registro de incidentes (acceso no autorizado, pérdida de documentos, filtración, uso indebido de credenciales, etc.) con fecha, usuario, tipo, datos afectados, medidas correctivas, responsable, estado.

**📎 Trazabilidad backlog:** ✅ 🆕 **EPIC 26 — Gestión de incidentes de seguridad** (agregado en v3): 🆕 US-26.01 (registrar incidente), 🆕 US-26.02 (listado/detalle), 🆕 US-26.03 (cerrar con medidas correctivas, P2), 🆕 US-26.04 (registrar notificación a la Agencia/afectados, P2 — relevante para el plazo de notificación que exige la Ley 21.719). Prioridad general: P1 — no bloquea el primer release funcional del MVP, pero se recomienda tenerlo resuelto antes del 1 de diciembre de 2026, fecha de entrada en vigencia de la ley.

---

## 48–49. Reportes y Consolidados, Reportes de Reembolsos Médicos

**📎 Trazabilidad backlog:** EPIC 17 — US-17.01 (ayudas entregadas), US-17.02 (hogares beneficiados), US-17.03 (reembolsos médicos), US-17.04 (diálisis), US-17.05 (entregas pendientes/fallidas), US-17.06 (exportar, P2).
⚠️ **Pendiente de backlog (ya señalado en la v2):** falta un reporte específico de **ayudas aprobadas por excepción RSH** y de **hitos/informes por hogar** — anotado como pendiente de reportería en el propio backlog v2.

---

## 50. Módulos del Sistema

**📎 Trazabilidad backlog:** correspondencia directa con los EPICs 00–27 del backlog v3 — incluyendo ahora 🆕 EPIC 25 (reembolsos excepcionales cirugía/fallecimiento), 🆕 EPIC 26 (incidentes de seguridad) y 🆕 EPIC 27 (offline de terreno), que en la v2 de este documento aparecían como brechas sin EPIC.

---

## 51. Mantenedores del Sistema

Tipos de ayuda, tipos de reembolso, productos, materiales, sectores, localidades, estados varios, periodicidades, situaciones laborales/habitacionales, tipos/categorías de hito, proveedores, funcionarios, vehículos, motivos de excepción, motivos de no entrega, tipos de documentos/certificados.

**📎 Trazabilidad backlog:** cubierto parcialmente por US-06.01/06.02 (ayudas), US-11.01 (productos), US-19.02 (sectores), US-19.03 (motivos de no entrega, P2), US-24.01 (proveedores, post-MVP).
⚠️ **Pendiente de backlog:** no hay mantenedores explícitos para **tipos/categorías de hito**, **motivos de excepción RSH** (más allá del campo de texto libre en US-05.05), ni **tipos de certificado**. Son mantenedores menores que pueden resolverse como catálogos simples; se recomienda agregarlos como criterios de aceptación de US-22.01 y US-05.05 en vez de historias nuevas.

---

## 52–53. Modelo Conceptual de Datos y Reglas de Negocio Principales

**📎 Trazabilidad backlog:** el modelo conceptual (grupo familiar, beneficiario, RSH, solicitud, ayuda, evaluación, informe social, hito, documento, compra, proveedor, producto, stock, entrega, ruta, reembolso, excepción, auditoría, incidente) se corresponde ahora con las entidades implícitas en EPIC 03 a EPIC 27, incluyendo **incidente de seguridad** (🆕 EPIC 26, antes sin entidad definida) y **coordenadas del hogar** (🆕 US-03.06).

---

## 54–55. Requerimientos No Funcionales y Arquitectura Recomendada

**📎 Trazabilidad backlog:** EPIC 00 (base técnica Next.js + Supabase), EPIC 01 (RLS, sesiones), EPIC 18 (privacidad por diseño), EPIC 20 + 🆕 EPIC 27 (compatibilidad móvil y offline acotado).
✅ El requerimiento no funcional "preparado para baja conectividad en terreno" ahora está resuelto para el caso de **cortes momentáneos de señal** (🆕 EPIC 27). Sigue sin resolver el caso de conectividad estructuralmente ausente por varios días — eso quedó fuera de alcance de forma consciente (ver sección 39).

---

## 56–57. Flujo General del Sistema y Flujo Específico de Diálisis

**📎 Trazabilidad backlog:** el flujo general corresponde al recorrido EPIC 03 → 07 → 08 → 09 → 11/12 → 16 → 17. El flujo de diálisis corresponde 1:1 a EPIC 15 y se prueba explícitamente en US-21.05.

---

## 58. Beneficios Esperados

**📎 Trazabilidad backlog:** no requiere mapeo directo — es la justificación de negocio del proyecto completo.

---

## 59. Recomendación de Implementación por Etapas

El maestro propone 5 etapas (núcleo, stock/compras/entregas, reembolsos médicos, rutas/app móvil, seguridad avanzada/cumplimiento).

**📎 Trazabilidad backlog:** corresponde aproximadamente a los Sprints 0–7 del backlog v3, con estas diferencias a tener en cuenta:
- La Etapa 2 del maestro agrupa **compras + inventario + entregas**; el backlog separa esto (inventario en Sprint 4, compras diferida a Sprint 7/post-MVP).
- La Etapa 3 del maestro ("casos especiales por cirugía... por fallecimiento... por diálisis") ahora está completamente cubierta: diálisis en EPIC 15 y cirugía/fallecimiento en 🆕 EPIC 25 (ambos en Sprint 5).
- La Etapa 4 del maestro ("rutas y aplicación móvil... sincronización offline") ahora está cubierta por EPIC 13 + 🆕 EPIC 27 (Sprint 4), con el alcance offline explícitamente acotado a cortes momentáneos de señal.
- La Etapa 5 del maestro ("seguridad avanzada y cumplimiento") incluye gestión de incidentes, ahora cubierta por 🆕 EPIC 26 (Sprint 6/7).

---

## 60. Resumen Ejecutivo

**📎 Trazabilidad backlog:** actualización sugerida para este resumen: la primera versión operativa (MVP) prioriza hogares/RSH/elegibilidad, solicitudes, evaluación/aprobación, inventario, entregas con **ruteo automático por cercanía geográfica**, reembolsos (general, diálisis y **ahora también cirugía/fallecimiento**), y **ejecución offline acotada en terreno** — dejando solo compras municipales y algunos ajustes menores (mantenedor de ubicación completo, cálculo automático de tramos del reembolso general) para iteraciones posteriores ya identificadas.

---

## 61. Matriz de Trazabilidad General (nueva)

| Sección Maestro | Tema | EPIC / Historias Backlog v3 | Estado |
|---|---|---|---|
| 4–5 | Grupo familiar como unidad central | EPIC 03 + 🆕 US-03.06 | ✅ Cubierto (coordenadas resueltas en v3) |
| 6 | Ficha del beneficiario | EPIC 04 | ✅ Cubierto (⚠️ campos adicionales por confirmar) |
| 7 | RSH | US-05.01–05.03 | ✅ Cubierto |
| 8–9 | Regla del 40% y excepción | US-05.04, US-05.05 | ✅ Cubierto |
| 10 | Catálogo de ayudas | EPIC 06 | ✅ Cubierto |
| 11 | Cajas de mercadería | EPIC 07, 11, 12 | ✅ Cubierto (⚠️ "próxima entrega estimada" pendiente) |
| 12 | Pañales | US-04.04, EPIC 11/12 | ✅ Cubierto |
| 13 | Materiales de construcción | US-11.01, US-11.03 | ✅ Cubierto |
| 14–16 | Reembolso general | EPIC 14 (incl. 🆕 US-14.05, 14.06, 14.07) | ✅ Cubierto — cálculo automático de tramos resuelto |
| 17–18 | Reembolso excepcional cirugía/fallecimiento | 🆕 EPIC 25 | ✅ Cubierto (agregado en v3) |
| 19–25 | Reembolso diálisis | EPIC 15 | ✅ Cubierto casi 1:1 |
| 26 | Hitos | EPIC 22 | ✅ Cubierto |
| 27 | Informes sociales | EPIC 23 | ✅ Cubierto |
| 28 | Mantenedor de ubicación | US-19.02 + 🆕 US-03.06 | ⚠️ Parcial (localidades y validación de coordenadas pendientes — ver ítem 2) |
| 29 | Compras municipales | EPIC 24 | ⏸️ Diferido a post-MVP (documentado) |
| 30 | Inventario y stock | EPIC 11 | ✅ Cubierto |
| 31 | Solicitudes | EPIC 07 | ✅ Cubierto |
| 32–34 | Entregas | EPIC 12 | ✅ Cubierto (⚠️ estados granulares pendientes — ver ítem 3) |
| 35 | Rutas | EPIC 13 (US-13.01, 🆕 US-13.04, US-13.02, US-13.03, 🆕 US-13.05) | ✅ Cubierto (ruteo automático por cercanía agregado en v3); mapa por calles reales queda diferido, con camino de evolución ya documentado en US-13.04 |
| 36–38 | App móvil, datos visibles, evidencia | EPIC 20, US-12.06 | ✅ Cubierto |
| 39 | Modo offline y sincronización | 🆕 EPIC 27 | ✅ Cubierto, alcance acotado (agregado en v3) |
| 40–43 | Seguridad y datos personales | EPIC 18 | ✅ Cubierto |
| 44 | Roles y permisos | US-01.03 | ⚠️ Revisar granularidad de roles (ver ítem 4) |
| 45 | Auditoría | EPIC 16 | ✅ Cubierto |
| 46 | Conservación de datos | US-18.04 | ⏸️ Diferido a post-MVP |
| 47 | Incidentes de seguridad | 🆕 EPIC 26 | ✅ Cubierto (agregado en v3; completar antes de dic. 2026) |
| 48–49 | Reportes | EPIC 17 | ✅ Cubierto (⚠️ reporte de excepciones RSH pendiente) |
| 50–53 | Módulos y modelo de datos | EPIC 00–27 | ✅ Cubierto |
| 54–55 | No funcionales y arquitectura | EPIC 00, 01, 18, 20, 🆕 27 | ✅ Cubierto para cortes momentáneos; conectividad estructuralmente ausente queda fuera de alcance por decisión consciente |
| 56–57 | Flujos generales | EPIC 03→17, 25 | ✅ Cubierto |
| 59 | Etapas de implementación | Sprints 0–7 | ✅ Cubierto con diferencias de agrupación |

**Leyenda:** ✅ Cubierto en el MVP (con o sin observaciones menores) · ⏸️ Diferido a post-MVP de forma consciente y documentada · ⚠️ Brecha real, sin historia en el backlog actual — requiere decisión.

### Brechas pendientes priorizadas (actualizado)

> Las tres brechas mayores de la v2 (reembolso excepcional cirugía/fallecimiento, incidentes de seguridad, modo offline) y el cálculo automático de tramos del reembolso general ya se cerraron, incluida la validación del período de vigencia. Lo que queda son ajustes menores, ninguno bloqueante para el MVP:

1. **Mantenedor de ubicación completo** (sección 28) — falta mantenedor de localidades y campo de estado de validación de coordenadas (la captura de lat/long ya quedó resuelta con 🆕 US-03.06).
2. **Estados granulares de entrega** (secciones 32–34) — el maestro define estados más finos (dirección no encontrada, beneficiario ausente, entrega parcial) que los que hoy cubre US-12.05 de forma genérica.
3. **Granularidad de roles** (sección 44) — confirmar si "Asistente Social" vs. "Administrativo Social" y "Encargado de Compras" necesitan roles propios en US-01.03, o si se resuelven como sub-permisos.
4. **Reporte de ayudas aprobadas por excepción RSH** (secciones 48–49) — ya anotado en el backlog como pendiente de reportería.

---

*Documento generado a partir del Contexto Maestro original, con anotaciones de trazabilidad agregadas para mantener sincronía con el Backlog MVP v2. Cualquier cambio futuro a uno de los dos documentos debería reflejarse en el otro a través de esta matriz.*
