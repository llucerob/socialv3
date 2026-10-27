# Backlog MVP v2 — Sistema de Ayudas Sociales
### Municipalidad de Coinco — Departamento Social

> **Nota de versión:** este backlog actualiza la versión anterior incorporando las brechas detectadas en la revisión cruzada con el Contexto Maestro del Proyecto. Los cambios respecto a la v1 están marcados con **🆕 (nuevo)** o **⬆️ (re-priorizado)**. Todo lo demás se mantiene igual que en la versión original.

**Resumen de cambios de esta versión:**
- 🆕 EPIC 22 — Hitos del grupo familiar y del beneficiario (no existía).
- 🆕 EPIC 23 — Informes sociales estructurados (antes solo existían como documento adjunto).
- 🆕 US-05.04 y US-05.05 — Regla de elegibilidad RSH ≤ 40% y flujo de excepción (antes solo se registraba el tramo, sin validar la regla).
- 🆕 EPIC 24 — Compras municipales (ausente en la v1; se deja acotado y explícitamente fuera del MVP estricto, pero trazado).
- ⬆️ EPIC 11 — Inventario y stock: se sube de P1 a **P0**, porque las pruebas obligatorias del MVP (US-21.02, US-21.03) dependen de él.
- ⬆️ US-13.01 — Agrupar entregas por sector: se sube de P1 a **P0**, dado el contexto rural disperso de Coinco.
- Actualización de la sección "Backlog mínimo imprescindible", del orden de sprints, de "historias para después del MVP" y de riesgos.

---

## 1. Criterio de priorización

- **P0 — Crítico MVP:** imprescindible para que el sistema funcione.
- **P1 — Importante MVP:** necesario para operación real, pero puede construirse después del flujo base.
- **P2 — Mejora controlada:** deseable para una versión posterior del MVP o primera iteración post-MVP.

---

## EPIC 00 — Preparación técnica del proyecto

**Objetivo:** dejar lista la base técnica para construir el sistema en Next.js + Supabase, con ambientes, autenticación, estructura inicial y seguridad base.

### US-00.01 ✅ — Crear proyecto base en Next.js
Como equipo de desarrollo, quiero tener una aplicación base en Next.js, para comenzar el desarrollo del sistema web.
**Prioridad:** P0 · **Dependencias:** ninguna.
**Criterios de aceptación:** proyecto Next.js creado · estructura inicial de carpetas · levanta correctamente en local · configuración base de variables de entorno · conexión preparada para Supabase.

### US-00.02 ✅⚠️ — Configurar proyecto Supabase
Como equipo de desarrollo, quiero tener un proyecto Supabase configurado, para usar base de datos, autenticación y almacenamiento privado.
**Prioridad:** P0 · **Dependencias:** US-00.01.
**Criterios de aceptación:** proyecto Supabase creado · PostgreSQL disponible · Supabase Auth activo · Supabase Storage disponible · variables de entorno configuradas · conexión frontend-Supabase validada.
**Estado (cierre Sprint 0):** el proyecto Supabase hosteado fue creado y usado como referencia desde el inicio, pero **el archivo `.env` con sus credenciales ya no existe en el repositorio** (solo quedan `.env.example` y `.env.local`, este último apuntando al Docker local). "Conexión frontend-Supabase validada" se probó exhaustivamente contra el stack **local** en cada EPIC — nunca se validó contra el proyecto hosteado real, y no hay evidencia de que las 18 migraciones actuales se hayan aplicado ahí. "Supabase Storage disponible" está habilitado en la config pero sin uso real todavía (el primer consumidor es EPIC 10, Sprint 3). Esto no depende de un sprint futuro — es una brecha operativa de este mismo sprint que requiere decisión: recrear `.env` y/o correr `supabase link` + `db push` contra el proyecto real.

### US-00.03 ✅⚠️ — Definir ambientes
Como administrador técnico, quiero separar ambientes de desarrollo y producción, para evitar afectar datos reales durante pruebas.
**Prioridad:** P1 · **Dependencias:** US-00.01, US-00.02.
**Criterios de aceptación:** ambiente de desarrollo · ambiente de producción o preparación · variables separadas · sin mezcla de datos de prueba y reales.
**Estado (cierre Sprint 0):** ambiente de desarrollo real y probado (Docker local vía `.env.local`, usado en todos los EPICs). El ambiente de "producción o preparación" existe solo como concepto — ver la brecha de `.env` anotada en US-00.02 — así que hoy no hay forma de confirmar que ese ambiente esté realmente operativo. "Sin mezcla de datos de prueba y reales" se cumple porque son proyectos Supabase distintos, pero eso no compensa que el ambiente de prod no se haya verificado ni una vez en este sprint.

---

## EPIC 01 — Autenticación, usuarios y roles

**Objetivo:** permitir que solo usuarios autorizados accedan al sistema y que cada perfil vea o modifique únicamente lo que corresponde.

### US-01.01 ✅ — Inicio de sesión
**Prioridad:** P0 · **Dependencias:** US-00.02.
**Criterios de aceptación:** login con credenciales · validación email/contraseña · usuario no autenticado no accede · error visible ante credenciales inválidas · cierre de sesión disponible.

### US-01.02 ✅ — Crear tabla de perfiles de usuario
**Prioridad:** P0 · **Dependencias:** US-01.01.
**Criterios de aceptación:** tabla `profiles` o equivalente · perfil asociado a usuario autenticado · contiene nombre, email, rol, estado · usuarios inactivos no operan.

### US-01.03 ✅ — Definir roles del sistema
**Prioridad:** P0 · **Dependencias:** US-01.02.
**Roles mínimos:** Administrador · Evaluador social · Aprobador · Bodega/logística · Terreno/repartidor · Finanzas · Auditor/consulta.
**Criterios de aceptación:** rol asignable por usuario · permisos definidos por rol · vistas adaptadas al rol · usuario sin rol válido no opera.
**Estado (cierre Sprint 0):** "permisos definidos por rol", "vistas adaptadas al rol" y "usuario sin rol válido no opera" están verificados extensamente (RLS + dashboard/nav por rol en EPIC 02–09). "Rol asignable por usuario" solo existe hoy a nivel de datos (un admin puede hacer `UPDATE profiles.rol` porque la RLS lo permite) — **no hay ninguna pantalla en la app para asignar roles**; hay que usar el SQL Editor/Table Editor de Supabase Studio directamente. La UI real de esto es **US-19.01 "Administrar usuarios", agendada para Sprint 7 (Post-MVP inmediato)** — depende explícitamente de un sprint futuro, no es un olvido de este sprint.
**Estado (revisión posterior):** los 4 criterios quedan completos — **US-19.01 ya está implementada** (`/admin/usuarios`, `lib/usuarios/actions.ts::cambiarRolUsuario`), cerrando la única brecha pendiente. Re-verificado end-to-end en navegador con un usuario nuevo genuino (creado vía Admin API, sin rol): al iniciar sesión sin rol asignado queda redirigido a `/sin-acceso` con mensaje explícito ("usuario sin rol válido no opera") · un administrador le asignó el rol `bodega_logistica` desde `/admin/usuarios/{id}`, quedando auditado en el historial de cambios del usuario (`profiles_historial`) · al volver a iniciar sesión, el usuario accedió con el dashboard y el nav lateral correctos para ese rol (solo "Entregas pendientes" y "Alertas", esta última mostrando únicamente la alerta de georreferenciación — no la de RSH, que no le corresponde). No se encontró nada pendiente de implementar.

**Revisión 2026-10-27 (roles múltiples):** un usuario puede tener varios roles y el administrador los asigna con casillas. Criterios actualizados y decisiones en `docs/backlog.md`, sección "EPIC 01 y EPIC 19 — Roles múltiples por usuario".

### US-01.04 ✅ — Proteger rutas por autenticación
**Prioridad:** P0 · **Dependencias:** US-01.01, US-01.03.
**Criterios de aceptación:** rutas privadas requieren sesión · redirección a login si no autenticado · acceso al panel si autenticado · rutas sensibles validan rol.

### US-01.05 ✅ — Políticas RLS en Supabase
**Prioridad:** P0 · **Dependencias:** US-01.03.
**Criterios de aceptación:** RLS activo en tablas críticas · acceso restringido según rol · documentos privados no accesibles públicamente · escritura restringida por rol.
**Estado (cierre Sprint 0):** "RLS activo en tablas críticas", "acceso restringido según rol" y "escritura restringida por rol" están verificados exhaustivamente — cada tabla creada desde EPIC 01 hasta EPIC 09 tiene RLS habilitada y probada (incluyendo intentos de bypass por REST directo con roles no autorizados). "Documentos privados no accesibles públicamente" **depende por completo de EPIC 10 (Documentos y archivos privados, Sprint 3)** — hoy no existe ni un bucket de Storage ni una tabla de documentos, así que este criterio no tiene nada que verificar todavía. No se da por cumplido.
**Estado (revisión posterior):** los 4 criterios quedan completos. EPIC 10 (bucket privado `documentos`, `public=false`) + EPIC 18/US-18.02 (`puede_ver_documento()`, RLS de `storage.objects` por sensibilidad de `tipo_documento`) ya cierran el criterio pendiente. Verificación exhaustiva en esta revisión: **(a)** de las 31 tablas creadas por todas las migraciones, las 31 tienen `enable row level security` (`diff` programático entre `create table` y `alter table ... enable row level security`, sin excepciones) · **(b)** ninguna política de escritura usa `using (true)`/`with check (true)` ni apunta a `public` en vez de `authenticated` (revisado por grep sobre todas las migraciones) · **(c)** contra el Supabase local, se intentó descargar un documento real por su `storage_path` de tres formas — URL "pública" del bucket, URL de objeto autenticado sin firma, y con la `anon key` como bearer token sin sesión de usuario — las tres devolvieron `400` (rechazado); el único camino que funciona es la signed URL de 60 segundos que genera el propio servidor (`lib/documentos/dal.ts`), usando el cliente de Supabase atado a la sesión del usuario (no la service role key), así que la propia firma ya respeta la RLS de `storage.objects`. No se encontró nada pendiente de implementar.

---

## EPIC 02 — Panel principal

### US-02.01 ✅ — Ver dashboard inicial
**Prioridad:** P1 · **Dependencias:** US-01.04.
**Criterios de aceptación:** solicitudes pendientes, en evaluación, entregas pendientes, reembolsos pendientes, alertas básicas por rol.
**Estado:** completa. Las 5 tarjetas ya tienen datos reales. "Entregas pendientes" se cableó primero, junto con EPIC 12. En esta pasada se cablearon las 3 restantes: "Solicitudes en evaluación" (en_evaluacion sin evaluación registrada, consulta directa — evaluador_social/administrador ya tienen SELECT sobre `evaluaciones_sociales`) y "Solicitudes pendientes de aprobación" (en_evaluacion con evaluación ya registrada) y "Reembolsos pendientes" (aprobados sin pago) vía dos funciones `security definer` nuevas (`listar_solicitudes_pendientes_aprobacion_dashboard`, `listar_reembolsos_pendientes_pago_dashboard`, migración `20260814000001_dashboard_solicitudes_reembolsos.sql`) — necesarias porque `auditor_consulta` también necesita verlas y no tiene SELECT directo sobre `evaluaciones_sociales`/`decisiones_solicitud`/`pagos_reembolso` (mismo criterio que EPIC 12/reportes/auditoría). "Alertas" reutiliza los dos tipos de alerta ya existentes en el código (RSH desactualizado/sin registrar, US-05.03; hogares sin georreferenciar, US-13.05), mostrados solo a los roles para los que aplican — sin inventar una tercera categoría no pedida por el backlog. Verificado end-to-end en navegador con `administrador` (las 5 tarjetas con datos reales, incluida la transición de una solicitud entre "en evaluación" → "pendiente de aprobación" al registrar su evaluación, y la desaparición de un reembolso de "pendientes" al registrar su pago) y con `auditor_consulta` (confirmando que ve "Solicitudes pendientes de aprobación" y "Reembolsos pendientes" sin error de permisos, pese a no tener acceso directo a las tablas subyacentes).

### US-02.02 ✅ — Adaptar dashboard por rol
**Prioridad:** P1 · **Dependencias:** US-02.01.
**Criterios de aceptación:** vista diferenciada por rol (evaluador, aprobador, bodega, terreno, finanzas, auditor).
**Estado:** completa — ya satisfecha estructuralmente desde que se armó `DASHBOARD_SECTIONS_BY_ROL` (cada uno de los 6 roles ve un subconjunto propio de tarjetas) más el nav lateral por rol (`lib/dashboard/nav.ts`); solo quedaba pendiente de marcar hasta que US-02.01 tuviera datos reales que mostrar en esa vista diferenciada.

---

## EPIC 03 — Gestión de grupos familiares

### US-03.01 ✅ — Crear grupo familiar
**Prioridad:** P0 · **Dependencias:** US-01.03.
**Campos mínimos:** dirección, sector, teléfono, tramo RSH, fecha de actualización RSH, observaciones, estado.
**Criterios de aceptación:** creación de hogar · validación de obligatorios · estado activo por defecto · usuario/fecha de creación registrados.

### US-03.02 ✅ — Buscar grupo familiar
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** búsqueda por dirección, sector, nombre/RUT de integrante · resultados coincidentes · apertura de ficha.
**Estado:** completa ahora que EPIC 04 existe. Verificado en local: búsqueda por dirección, por sector, por nombre de integrante, por RUT completo con puntos/guion ("15.234.567-4") y por fragmento numérico sin dígito verificador (búsqueda parcial) — todas devuelven el hogar correcto. El RUT se compara contra el formato canónico `cuerpo-dv` vía `normalizarRut()` (mismo helper de US-04.01) cuando la búsqueda normaliza a un RUT válido.

### US-03.03 ✅ — Editar grupo familiar
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** edición de datos básicos · fecha y usuario de modificación · cambios críticos auditados.

### US-03.04 ✅ — Ver ficha del grupo familiar
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** datos generales, integrantes, tramo RSH, solicitudes asociadas, ayudas entregadas, documentos según permisos.
**Estado:** completa. Datos generales, tramo RSH, coordenadas (US-03.06), integrantes (EPIC 04), solicitudes asociadas (EPIC 07) y documentos (EPIC 10) ya mostraban datos reales. "Ayudas entregadas" seguía con el placeholder "disponible cuando se implemente EPIC 12" pese a que EPIC 12 (entregas) ya estaba construido — nunca se había cableado esta sección específica. Se agregó `listar_entregas_realizadas_de_hogar` (función `security definer`, mismo criterio que reportes/auditoría, ya que la RLS de `entregas` no da SELECT a evaluador_social/aprobador/finanzas/auditor_consulta) y la sección ahora lista las entregas con `estado = 'realizada'` del hogar (tipo de ayuda, receptor, fecha). De paso se cerraron otras dos brechas de integración de EPIC 12 encontradas en la misma revisión: el detalle de solicitud no mostraba nada de la entrega a nadie fuera de administrador/bodega_logistica (se agregó una vista de solo lectura equivalente, vía `obtener_entrega_lectura_de_solicitud`), y la tarjeta "Entregas pendientes" del dashboard (EPIC 02) seguía siendo un placeholder sin datos (se cableó con `listar_entregas_pendientes_para_dashboard`). Verificado end-to-end en navegador: hogar con una "Caja de mercadería" entregada aparece en su ficha; un usuario `evaluador_social` (sin acceso de gestión a entregas) ve el resultado de la entrega en el detalle de la solicitud; el dashboard de administrador refleja el conteo real de pendientes y lo actualiza al completarse la entrega.

### US-03.05 ✅ — Marcar hogar como inactivo
**Prioridad:** P1 · **Dependencias:** US-03.01.
**Criterios de aceptación:** estado inactivo · bloqueo de nuevas solicitudes sin reactivación · historial visible · acción auditada.
**Estado:** completa. El bloqueo de nuevas solicitudes (pendiente cuando se escribió esta historia, por falta de EPIC 07) ya está implementado en `crearSolicitud` — un hogar inactivo no puede recibir solicitudes nuevas, verificado tanto en UI como a nivel de servidor.

---

## EPIC 04 — Gestión de personas integrantes del hogar

### US-04.01 ✅ — Agregar integrante al hogar
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Campos mínimos:** RUT, nombres, apellidos, fecha de nacimiento, parentesco, estado.
**Criterios de aceptación:** RUT válido · persona asociada al hogar · advertencia ante RUT duplicado.

### US-04.02 ✅ — Editar integrante
**Prioridad:** P0 · **Dependencias:** US-04.01.
**Criterios de aceptación:** edición de datos personales · usuario/fecha registrados · cambios sensibles auditados.

### US-04.03 ✅ — Cambiar estado de integrante
**Prioridad:** P1 · **Dependencias:** US-04.01.
**Estados sugeridos:** activo, ya no pertenece al hogar, fallecido, pendiente de validación.
**Criterios de aceptación:** cambio de estado · integrante inactivo no cuenta como beneficiario activo · historial no se elimina.
**Estado:** completa. "No cuenta como beneficiario activo" ya tiene consumidor real: `listarIntegrantesActivos()` (usado por el selector de persona beneficiaria de EPIC 07) filtra por `estado = 'activo'`.

### US-04.04 ✅ — Asociar ayuda a integrante específico
**Prioridad:** P0 · **Dependencias:** US-04.01.
**Criterios de aceptación:** ayudas familiares sin persona obligatoria · ayudas personales con selección de integrante · pañales y reembolsos exigen persona · validación de pertenencia al hogar.
**Estado:** completa, implementada como parte de EPIC 07 (`validarCampos` en `lib/solicitudes/actions.ts`), una vez que existieron tanto el catálogo de ayudas (EPIC 06, `requiere_persona_beneficiaria`) como las solicitudes (EPIC 07) para anclarla. Verificado end-to-end: el formulario exige persona para "Reembolso médico general" y no la exige para "Caja de mercadería"; se valida pertenencia al hogar y que la persona esté activa.

---

## EPIC 05 — Registro Social de Hogares, antecedentes y regla de elegibilidad

> **🆕 Este EPIC se amplía respecto a la v1.** El maestro define la regla de elegibilidad del 40% como *la* regla general del sistema (sección 8) y su excepción trazable (sección 9). En la v1 solo se registraba el tramo RSH, sin validar ni exceptuar la regla. Se agregan US-05.04 y US-05.05.

### US-05.01 ✅ — Registrar tramo RSH del hogar
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** registro de tramo · fecha de actualización · marca de "pendiente de actualización" · visible en ficha del hogar.
**Estado:** registro/fecha ya existían desde US-03.01. Se agregó la marca "pendiente de actualización" (badge cuando no hay tramo RSH registrado), visible en ficha y listado.

### US-05.02 ✅ — Adjuntar respaldo RSH
**Prioridad:** P1 · **Dependencias:** EPIC 10.
**Criterios de aceptación:** subida de documento RSH · asociado al hogar · almacenamiento privado · visible solo para roles autorizados.
**Estado:** no implementada — depende de EPIC 10 (documentos/Storage), que no existe todavía. La ficha del hogar ya tiene una sección "Documentos" placeholder que cubrirá esto cuando se implemente EPIC 10.
**Estado (revisión posterior):** completa. Con EPIC 10 ya construido, "subida de documento RSH" y "asociado al hogar" quedaban satisfechos gratis por la infraestructura genérica de documentos (`tipo_documento` ya incluía `'rsh'` desde su creación) y "almacenamiento privado" por el bucket privado de EPIC 10 (ver revisión de US-01.05). El único criterio realmente pendiente era "visible solo para roles autorizados": la clasificación de sensibilidad de EPIC 18 (`puede_ver_documento()`) dejaba `'rsh'` en la categoría genérica visible a *cualquier* rol válido, incluyendo bodega_logistica y terreno_repartidor — esa migración no había cruzado contra esta historia. Se corrigió (`20260815000001_rls_documentos_rsh.sql`) clasificando `'rsh'` igual que `informe_social` (administrador/evaluador_social/aprobador únicamente — mismo criterio de sensibilidad socioeconómica, sin incluir a finanzas ni auditor_consulta). Verificado end-to-end en navegador: se subió un documento RSH real a un hogar de prueba; `administrador` y `evaluador_social` lo ven correctamente; `bodega_logistica` ve "Sin documentos subidos todavía" para el mismo hogar (el documento queda oculto, no solo sin botón de gestión).

### US-05.03 ✅ — Alertar RSH desactualizado
**Prioridad:** P2 · **Dependencias:** US-05.01.
**Criterios de aceptación:** identificación de hogares con RSH antiguo · alerta en ficha · umbral de meses configurable.
**Estado:** implementado con umbral de 12 meses. "Configurable" se resolvió como una constante en código (`lib/hogares/rsh.ts`) — no hay módulo de administración (EPIC 20) todavía para exponerlo en la UI.

### 🆕 US-05.04 ✅ — Validar regla general de elegibilidad (RSH ≤ 40%)
Como sistema,
quiero validar automáticamente que el tramo RSH del hogar sea menor o igual a 40% al crear o enviar a evaluación una solicitud,
para aplicar la regla general de elegibilidad definida en el proyecto.
**Prioridad:** P0 · **Dependencias:** US-05.01, US-07.01.
**Criterios de aceptación:**
- El sistema valida el tramo RSH vigente del hogar al enviar una solicitud a evaluación.
- Si el tramo es ≤ 40%, la solicitud sigue el flujo normal.
- Si el tramo es > 40%, el sistema bloquea la aprobación regular y exige que la solicitud se marque como **excepción** (ver US-05.05).
- El sistema nunca oculta ni disimula que una ayuda fue aprobada por excepción: debe quedar visualmente identificada en la solicitud, en la ficha del hogar y en los reportes.
- La validación queda registrada en auditoría.
**Estado:** implementada en `enviarAEvaluacion` (`lib/solicitudes/actions.ts`). Verificado end-to-end: hogar con RSH 25% pasa a "en evaluación" normalmente; hogar con RSH 55% queda bloqueado con mensaje explícito, y ambos casos quedan auditados (`solicitudes_historial`, campo `validacion_rsh`) incluso cuando se bloquea. El único punto pendiente es el resultado positivo del bloqueo — marcar la solicitud como "excepción" (US-05.05) — que depende de EPIC 23 y no existe; mientras tanto la solicitud queda simplemente detenida en su estado, sin poder avanzar por el flujo regular, lo cual ya cumple "bloquea la aprobación regular".

### 🆕 US-05.05 ✅ — Registrar excepción a la regla del 40% RSH
Como aprobador o administrador,
quiero registrar una excepción cuando el hogar supere el 40% RSH,
para permitir la entrega de la ayuda cuando exista justificación social o autorización municipal, sin ocultar que se trata de un caso excepcional.
**Prioridad:** P0 · **Dependencias:** US-05.04, EPIC 23 (informe social estructurado).
**Campos mínimos:** tipo de ayuda solicitada, grupo familiar, tramo RSH al momento de la excepción, motivo de la excepción, autoridad o unidad que la solicita (ej. alcaldía), informe social asociado, asistente social responsable, fecha de autorización, usuario que registra, observaciones, estado.
**Criterios de aceptación:**
- La excepción no puede aprobarse sin un informe social asociado (EPIC 23).
- El motivo de la excepción es obligatorio y de texto libre.
- Toda excepción queda trazada y visible en auditoría y en el historial del hogar.
- Los reportes distinguen explícitamente ayudas aprobadas por excepción de las aprobadas por regla general.
- Solo roles autorizados (aprobador/administrador) pueden registrar la excepción.
**Estado:** completada como parte de la implementación de 🆕 EPIC 23 (ver esa sección para el detalle de `informes_sociales`) — el criterio bloqueante ("la excepción no puede aprobarse sin informe social asociado") ya tenía dónde apoyarse. Se agregó `aprobarExcepcionRsh` (`lib/decisiones/actions.ts`), mismo patrón que `aprobarExcepcionDialisis` (US-15.05) pero con dos diferencias: (1) los roles autorizados son aprobador **o** administrador (el backlog los nombra explícitamente a ambos, a diferencia de la excepción de diálisis, solo administrador), y (2) aplica a cualquier tipo de ayuda, no solo reembolso, así que reutiliza la misma rama monto/cantidad de `aprobarSolicitud`. Se agregó la columna `decisiones_solicitud.autoridad_solicitante` (campo mínimo "autoridad o unidad que la solicita", sin dónde vivir hasta ahora). "Toda excepción queda trazada en auditoría e historial" se cumple gratis: `aprobarExcepcionRsh` inserta en `decisiones_solicitud` y deja `solicitudes.estado = 'aprobada_excepcion'`, exactamente las dos tablas que `listar_eventos_auditoria` (EPIC 16) y `solicitudes_historial` ya recorren para cualquier decisión — no hizo falta tocar ninguna de las dos. "Los reportes distinguen excepción de regla general" ya lo hace `es_excepcion`/`tiene_excepcion` en los reportes de EPIC 17 (comparando contra `'aprobada_excepcion'`, sin importar si la excepción es por RSH o por diálisis).
>
> **Hallazgo importante, corregido en la misma migración:** al implementar esto se encontró que `enviarAEvaluacion` (US-05.04) bloqueaba el *envío a evaluación* completo de una solicitud con RSH > 40%, dejándola varada para siempre en `borrador`/`ingresada` — nunca llegaba a `en_evaluacion`, el único estado desde el que se puede decidir (`validarContexto` en `lib/decisiones/actions.ts` lo exige). Como CLAUDE.md y los propios criterios de US-05.04/US-05.05 dicen explícitamente que la regla bloquea la **aprobación**, no la evaluación, el bloqueo se movió: `enviarAEvaluacion` ahora solo audita el resultado RSH (vía `registrar_validacion_rsh_solicitud`) y deja pasar la transición igual; `aprobarSolicitud` es quien ahora rechaza la aprobación regular cuando el hogar supera el 40%, dirigiendo a `aprobarExcepcionRsh`.
>
> **Segundo hallazgo, un bug real y no relacionado a esta historia:** la política RLS de `UPDATE` de `solicitudes` (EPIC 07) nunca incluyó al rol `aprobador`, solo administrador/evaluador_social — así que cuando un usuario con rol `aprobador` (no administrador) aprobaba o rechazaba cualquier solicitud, la fila de `decisiones_solicitud` se creaba bien pero el `UPDATE` de `solicitudes.estado` quedaba bloqueado por RLS silenciosamente (0 filas afectadas, sin error) desde que existe EPIC 09. Se corrigió agregando `aprobador` a esa política — necesario para que `aprobarExcepcionRsh` (mismos roles) funcionara, pero corrige de paso `aprobarSolicitud`/`rechazarSolicitud`/`aprobarExcepcionDialisis` para cualquier usuario aprobador que no sea también administrador.
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio). **No se pudo verificar end-to-end contra Supabase local ni en navegador** — Docker no disponible en esta sesión. Queda pendiente para quien continúe: confirmar en navegador con un usuario `aprobador` puro (no administrador) que aprobar/rechazar una solicitud normal ahora sí actualiza el estado (el bug encontrado), y probar el flujo completo de excepción RSH descrito en el Estado de EPIC 23.

---

## EPIC 06 — Catálogo de tipos de ayuda

### US-06.01 ✅ — Crear catálogo inicial de ayudas
**Prioridad:** P0 · **Dependencias:** US-01.03.
**Tipos iniciales:** caja de mercadería, pañales de adulto, materiales de construcción, reembolso médico general, reembolso médico por diálisis.
**Criterios de aceptación:** ayudas en tabla configurable · nombre/descripción/tipo/estado · solo ayudas activas seleccionables.
**Estado:** los 5 tipos iniciales quedaron sembrados vía migración. "Tipo" es texto libre (no hay lista cerrada en el backlog); se sembró con 'material'/'reembolso'. "Solo activas seleccionables" se resuelve como `listarTiposAyudaActivos()` en `lib/ayudas/dal.ts` — sin un selector real hasta que exista EPIC 07 (solicitudes), que es quien debe usarlo.

### US-06.02 ✅ — Configurar reglas por tipo de ayuda
**Prioridad:** P0 · **Dependencias:** US-06.01.
**Reglas mínimas:** requiere aprobación, requiere entrega, requiere evidencia, requiere persona beneficiaria, requiere documentos, tiene tope monetario, periodicidad, estado.
**Criterios de aceptación:** reglas propias por ayuda · uso de reglas al crear solicitudes · modificación solo por administrador · cambios auditados.
**Estado:** reglas implementadas como columnas de `tipos_ayuda` (relación 1:1), editables solo por administrador y auditadas (verificado end-to-end). `requiere_persona_beneficiaria` es la pieza que EPIC 07 necesitará para resolver US-04.04 (antes deferida). "Uso de reglas al crear solicitudes" queda pendiente de EPIC 07 — no existe formulario de solicitud todavía. El tope monetario de reembolsos ($100.000 compartido, $150.000 diálisis) NO se cargó aquí a propósito: esa es una regla acumulada por grupo familiar que vive en US-25.02 (fuente única, ver CLAUDE.md), no un tope simple de catálogo.

### US-06.03 ✅ — Activar o desactivar ayuda
**Prioridad:** P1 · **Dependencias:** US-06.01.
**Criterios de aceptación:** ayuda activa seleccionable · ayuda inactiva no aparece en nuevas solicitudes · solicitudes históricas mantienen referencia · cambio auditado.
**Estado:** toggle activo/inactivo y auditoría verificados end-to-end. "No aparece en nuevas solicitudes" y "solicitudes históricas mantienen referencia" dependen de EPIC 07 (no existe la entidad solicitud todavía) — la exclusión ya funciona a nivel de datos vía `listarTiposAyudaActivos()`.

---

## EPIC 07 — Solicitudes de ayuda

### US-07.01 ✅ — Crear solicitud de ayuda
**Prioridad:** P0 · **Dependencias:** EPIC 03, EPIC 04, EPIC 06.
**Campos mínimos:** hogar, tipo de ayuda, persona beneficiaria si aplica, fecha, motivo, observaciones, documentos si aplica.
**Criterios de aceptación:** solicitud asociada a hogar · tipo de ayuda activo · persona obligatoria si la ayuda lo exige · estado ingresada/borrador · usuario creador registrado.
**Estado:** completa salvo "documentos si aplica", que depende de EPIC 10 (no existe almacenamiento de documentos todavía) — la ficha ya tiene una sección "Documentos" placeholder para cuando se implemente.

### US-07.02 ✅ — Guardar solicitud como borrador
**Prioridad:** P1 · **Dependencias:** US-07.01.

### US-07.03 ✅ — Enviar solicitud a evaluación
**Prioridad:** P0 · **Dependencias:** US-07.01, US-05.04.
**Criterios de aceptación:** validación de campos y documentos obligatorios · validación de regla RSH 40% (US-05.04) · paso a "en evaluación" · fecha y usuario registrados.
**Estado:** completa salvo validación de documentos obligatorios (pendiente de EPIC 10, igual que US-07.01).

**Estado (revisión Sprint 2, 2026-10-27):** la validación de documentos obligatorios ya no está pendiente. Además de los chequeos específicos de diálisis, cirugía y fallecimiento, `enviarAEvaluacion` aplica ahora la regla genérica del catálogo `requiere_documentos` (US-06.02): exige al menos un documento asociado a la solicitud. Hasta esta revisión, pañales de adulto y reembolso médico general tenían la regla activa pero podían enviarse a evaluación sin ningún respaldo. Verificado en navegador: sin documento queda bloqueada con mensaje explícito; con un documento pasa a "en evaluación" y la validación RSH queda en el historial.

### US-07.04 ✅ — Ver listado de solicitudes
**Prioridad:** P0 · **Dependencias:** US-07.01.

### US-07.05 ✅ — Ver detalle de solicitud
**Prioridad:** P0 · **Dependencias:** US-07.01.

### US-07.06 ✅ — Cambiar estado de solicitud
**Prioridad:** P0 · **Dependencias:** US-07.05.
**Estados mínimos:** borrador, ingresada, en evaluación, observada, aprobada, aprobada por excepción, rechazada, asignada para entrega/pago, entregada/pagada, cerrada, anulada.
**Estado:** el enum completo de 11 estados y el mecanismo de auditoría (`solicitudes_historial`) ya existen en el esquema. Las transiciones con lógica de negocio propia implementadas son borrador/ingresada → en_evaluación (US-07.03) y → anulada (cancelación, disponible en cualquier momento antes de un estado terminal). El resto (observada, aprobada, aprobada_excepcion, rechazada, asignada_entrega_pago, entregada_pagada, cerrada) pertenece a EPIC 08/09/12/14, que aún no existen — se implementarán ahí, reutilizando este mismo mecanismo de auditoría.

**Estado (revisión Sprint 2, 2026-10-27):** completa. Las transiciones que antes faltaban ya existen en los EPICs que las dueñan: observada (EPIC 08), aprobada/aprobada_excepcion/rechazada (EPIC 09 y 23), entregada_pagada (EPIC 12 y 14, vía `marcar_solicitud_entregada` / `marcar_solicitud_reembolso_pagada`). `cerrada` y `asignada_entrega_pago` quedan sin uso por la decisión del 2026-10-26 (estado terminal = `entregada_pagada`, ver `docs/backlog.md`, EPIC 21). Verificado en navegador: borrador → anulada y ingresada → en_evaluacion, ambas auditadas en `solicitudes_historial`.

---

## EPIC 08 — Evaluación social

### US-08.01 ✅ — Registrar evaluación social
**Prioridad:** P0 · **Dependencias:** US-07.03.
**Criterios de aceptación (de la v1, que sí los detalla):** el evaluador puede escribir fundamento · el evaluador puede recomendar aprobar o rechazar · la evaluación queda asociada a la solicitud · se registra fecha y usuario evaluador · la evaluación no puede quedar vacía.
**Estado:** completa. Tabla `evaluaciones_sociales` (1 solicitud → N evaluaciones, no editable). RLS restringida a evaluador_social/aprobador/administrador (dato sensible, ver CLAUDE.md). Verificado end-to-end incluyendo resolución del nombre del evaluador vía función `nombre_usuario`.

### US-08.02 ✅ — Revisar historial de ayudas del hogar durante evaluación
**Prioridad:** P0 · **Dependencias:** US-03.04, US-07.05.
**Criterios de aceptación (de la v1):** el detalle de solicitud muestra ayudas previas · se visualiza tipo de ayuda, fecha y estado · se muestra si existen ayudas similares recientes · el sistema advierte posibles duplicidades.
**Estado:** completa. "Posible duplicado" = misma solicitud de hogar + mismo tipo de ayuda + estado no rechazada/anulada. Verificado con dos solicitudes de "Caja de mercadería" para el mismo hogar — la advertencia y el marcador aparecen correctamente.

### US-08.03 ✅ — Observar solicitud
**Prioridad:** P1 · **Dependencias:** US-07.06.
**Criterios de aceptación (de la v1):** se puede cambiar la solicitud a estado observada · es obligatorio ingresar motivo de observación · la solicitud puede volver a evaluación cuando se complete · la observación queda en historial.
**Estado:** completa. Único punto de EPIC 08 donde el aprobador también actúa ("como evaluador o aprobador") — se amplió la RLS de `solicitudes`/`solicitudes_historial` para incluirlo. Verificado con los tres roles: evaluador_social/administrador/aprobador pueden observar y volver a evaluación; el motivo queda auditado en cada transición.

---

## EPIC 09 — Aprobación y rechazo

### US-09.01 ✅ — Aprobar solicitud
**Prioridad:** P0 · **Dependencias:** US-08.01.
**Criterios de aceptación (de la v1):** solo rol aprobador puede aprobar · la solicitud debe estar en evaluación o lista para aprobación · el aprobador puede ingresar comentario · la solicitud pasa a estado aprobada · la decisión queda auditada.
**Estado:** completa. Tabla `decisiones_solicitud` (única por solicitud, no editable). RLS: solo aprobador/administrador insertan (ni siquiera evaluador_social). "En evaluación o lista para aprobación" se interpreta como `estado = 'en_evaluacion'` (el enum no tiene un valor separado). Se agregó además una validación propia: no se puede decidir sin al menos una evaluación social registrada (dependencia US-08.01).

### US-09.02 ✅ — Rechazar solicitud
**Prioridad:** P0 · **Dependencias:** US-08.01.
**Criterios de aceptación (de la v1):** solo rol aprobador puede rechazar · el rechazo exige motivo · la solicitud pasa a estado rechazada · la decisión queda auditada · el historial mantiene la evaluación previa.
**Estado:** completa. "El rechazo exige motivo" reforzado con un CHECK a nivel de base de datos, no solo validación de la Server Action. Las evaluaciones sociales nunca se eliminan, así que "el historial mantiene la evaluación previa" se cumple automáticamente.

### US-09.03 ✅ — Registrar monto o cantidad aprobada
**Prioridad:** P0 · **Dependencias:** US-09.01.
**Criterios de aceptación (de la v1):** para ayudas físicas se registra cantidad o detalle · para reembolsos se registra monto aprobado · el monto aprobado no puede superar el monto solicitado · las reglas de tope se validan antes de aprobar.
**Estado:** completa salvo el último punto. Se agregó `monto_solicitado` a `solicitudes` (campo que faltaba desde US-07.01, necesario para poder validar este límite) — verificado end-to-end que un monto aprobado mayor al solicitado se bloquea. "Las reglas de tope se validan antes de aprobar" (los topes reales de $100.000 anual compartido / $150.000 mensual diálisis) queda pendiente de US-25.02 (EPIC 25 no existe todavía) — no se duplica esa lógica de negocio aquí, solo la comparación monto-aprobado-vs-monto-solicitado que sí es dato propio de esta historia.

---

## EPIC 10 — Documentos y archivos privados

**Estado (revisión Sprint 3, 2026-10-27):** el último criterio ya está cubierto: los topes reales (US-14.05/14.06, US-15.04, US-25.02) se validan antes de aprobar. Se movieron a `validarTopesReembolso` (`lib/decisiones/actions.ts`), que ahora se aplica también en `aprobarExcepcionRsh`. Antes, la excepción RSH no revisaba ningún tope: un reembolso de un hogar sobre el 40% podía aprobarse por cualquier monto, saltándose el tope anual de $100.000 por hogar. Verificado en navegador con un aprobador puro: una excepción RSH por $500.000 sobre un primer reembolso general quedó bloqueada por el tope de $50.000 (y el bloqueo quedó en el historial); por $40.000 pasó a "aprobada por excepción".

### US-10.01 ✅ — Subir documento a una solicitud
**Prioridad:** P0 · **Dependencias:** US-07.01.
**Tipos de documentos iniciales:** RSH, certificado médico, certificado de diálisis, boleta, comprobante, fotografía, informe social, otro.

### US-10.02 ✅ — Subir documento a un hogar
**Prioridad:** P1 · **Dependencias:** US-03.01.

### US-10.03 ✅ — Ver documentos asociados
**Prioridad:** P0 · **Dependencias:** US-10.01.

### US-10.04 ✅ — Clasificar documentos por finalidad
**Prioridad:** P1 · **Dependencias:** US-10.01.

> **Estado:** verificado end-to-end en local (REST directo contra PostgREST + storage). Una sola tabla `documentos` discriminada por `solicitud_id`/`grupo_familiar_id` (exactamente uno de los dos, constraint check) cubre US-10.01/US-10.02 a la vez; `tipo_documento` es también la finalidad de US-10.04 (no se agregó un campo "finalidad" redundante — ver comentario en la migración). Bucket de Storage privado (`public = false`), descarga vía signed URL de 60s generada en cada carga de página (`lib/documentos/dal.ts`), nunca URL pública persistida. RLS: a diferencia de hitos/evaluaciones sociales, EPIC 10 no exige restricción por rol específico — el maestro solo pide que no sean "accesibles públicamente" (sección 43) — así que cualquier rol activo válido puede leer y subir, tanto en la tabla `documentos` como en `storage.objects` del bucket; la restricción fina por sensibilidad de documento queda diferida a EPIC 18/US-18.02 (Sprint 7, no construido). Verificado con REST directo: usuario con `rol = null` (sin asignar) recibe lista vacía en SELECT y 403 RLS en INSERT tanto en `documentos` como al subir al bucket; usuario con rol `evaluador_social` puede leer y escribir con normalidad. La página de detalle de solicitud/hogar ya exige un perfil con rol activo para renderizar (`getProfile()`), así que un usuario sin rol no llega a ver la sección de documentos aunque intentara acceder directamente a la URL. "Se registra acceso o descarga si se define como acción auditable" (US-10.03) no se implementó: es un criterio condicional ("si se define") y, a diferencia de hitos (US-22.03, que sí lo exige explícitamente), EPIC 10 no define esa acción como auditable en ningún punto del maestro.

---

## EPIC 11 — Ayudas físicas e inventario ⬆️

> **⬆️ Re-priorizado de P1 a P0.** Las pruebas obligatorias de aceptación del MVP (US-21.02 pañales, US-21.03 materiales) exigen descuento de stock y bloqueo por stock insuficiente. Mantener este EPIC en P1 dejaba esas pruebas sin soporte real, y el maestro es explícito en que "el sistema no deberá permitir programar una entrega de materiales si no existe stock suficiente" (sección 13). Por lo tanto pasa a formar parte del backlog mínimo imprescindible.

### US-11.01 ✅ — Crear productos de inventario
**Prioridad:** ⬆️ P0 · **Dependencias:** US-06.01.
**Productos iniciales:** caja de mercadería, pañales talla M/L/XL, materiales de construcción (nylon, ripio, planchas OSB, tapas).

### US-11.02 ✅ — Registrar entrada de stock
**Prioridad:** ⬆️ P0 · **Dependencias:** US-11.01.

### US-11.03 ✅ — Registrar salida de stock por entrega
**Prioridad:** ⬆️ P0 · **Dependencias:** US-11.01, US-09.01.
**Criterios de aceptación adicionales:** no se permite registrar la entrega si el stock resultante sería negativo; la solicitud queda en estado "pendiente de stock" si no hay disponibilidad.

### US-11.04 ✅ — Ver stock disponible
**Prioridad:** ⬆️ P0 · **Dependencias:** US-11.01.

> **Estado:** verificado end-to-end en local (REST directo + navegador). Los materiales de construcción se modelan como 4 productos inventariables independientes (nylon, ripio, planchas OSB, tapas), no como una única línea — esa línea sí existe, pero como `tipo_ayuda`, una entidad distinta del producto de inventario (ver comentario en `create_productos.sql`). `stock_actual` nunca se edita directamente: solo cambia como efecto de un trigger `security definer` disparado al insertar en `movimientos_stock` (US-11.02/11.03), reforzado con un grant de columna que excluye `stock_actual` del UPDATE que la RLS permite sobre `productos` — verificado con REST directo que un intento de `PATCH stock_actual` es rechazado (403, "permission denied for column"). La salida usa `where stock_actual >= cantidad` dentro del mismo UPDATE que descuenta, por lo que la verificación de disponibilidad y el descuento son atómicos (sin condición de carrera entre salidas concurrentes). Cuando no hay stock, la inserción del movimiento se aborta completo (no queda un movimiento "fantasma") y la solicitud pasa a `pendiente_stock` mediante una función `security definer` acotada (`actualizar_estado_stock_solicitud`, con chequeo explícito de rol) — necesaria porque la RLS de `solicitudes` (EPIC 07) no permite UPDATE a bodega. Verificado en navegador el flujo completo: salida insuficiente → estado "Pendiente de stock" con mensaje de error → reintento con cantidad válida → vuelve a "Aprobada" automáticamente y el movimiento queda listado en el detalle de la solicitud. Lectura y escritura de `productos`/`movimientos_stock` restringidas a administrador/bodega (US-11.04 solo menciona esos dos roles como audiencia); confirmado que evaluador social ni aprobador pueden ver el catálogo ni la sección "Stock" de una solicitud. Simplificación registrada en `lib/inventario/actions.ts`: al recuperar una solicitud desde `pendiente_stock`, siempre vuelve a `aprobada` (no se distingue si la aprobación original fue por excepción, ya que `decisiones_solicitud` tampoco distingue ambos casos hoy) — no es un criterio de aceptación de esta historia, solo evita dejarla bloqueada.

---

## EPIC 12 — Entregas en domicilio y evidencia

*(sin cambios respecto a la v1 — US-12.01 a US-12.07 se mantienen igual)*

### US-12.01 ✅ — Crear entrega desde solicitud aprobada — P0
### US-12.02 ✅ — Asignar entrega a funcionario en terreno — P0
### US-12.03 ✅ — Ver entregas asignadas desde teléfono — P0
### US-12.04 ✅ — Registrar entrega realizada — P0
### US-12.05 ✅ — Registrar entrega fallida — P1
### US-12.06 ✅ — Subir evidencia de entrega — P0
### US-12.07 ✅ — Capturar ubicación de entrega — P2

> **Estado:** verificado end-to-end en local (REST directo + navegador con tres roles: bodega, dos funcionarios de terreno, evaluador social). Una sola fila de `entregas` por solicitud (unique en `solicitud_id`) cubre todo el ciclo pendiente → fallida → pendiente (reprogramada) → realizada — "reprogramar" (US-12.05) es la misma entrega volviendo a `pendiente` con nueva fecha, no una fila nueva; `entregas_historial` (mismo patrón que `solicitudes_historial`/`grupos_familiares_historial`) audita automáticamente cada cambio de estado, responsable y fecha, cubriendo "la asignación queda registrada" (US-12.02) y "la acción queda en historial/auditada" (US-12.04/US-12.05) sin código adicional. Solo se ofrece crear entrega para tipos de ayuda con `requiere_entrega = true` (US-06.02) — un reembolso nunca genera una; la evidencia obligatoria (US-12.04) se resuelve igual, vía `requiere_evidencia` del tipo de ayuda. US-12.06 reutiliza íntegramente la infraestructura de EPIC 10 (`documentos`, bucket privado, `tipo_documento = 'fotografia'`) en vez de una tabla nueva — la UI de terreno solo expone el campo de foto, no el catálogo completo de tipos de documento. RLS: bodega/administrador gestionan todas las entregas; terreno_repartidor solo ve y modifica la suya propia (`responsable_id = auth.uid()`) — verificado con REST directo que un segundo funcionario no asignado no ve la fila (0 resultados, no error) ni puede modificarla (0 filas afectadas), y que evaluador social no ve ninguna entrega. La transición de la solicitud a `entregada_pagada` al completar la entrega (US-12.04: "cambia a entregada o cerrada según flujo") usa una función `security definer` acotada (`marcar_solicitud_entregada`, con chequeo explícito de rol) — mismo patrón que `actualizar_estado_stock_solicitud` de EPIC 11 — porque terreno no tiene UPDATE general sobre `solicitudes`. US-12.07 (ubicación): el navegador nunca pide el permiso de geolocalización automáticamente, solo al presionar "Usar mi ubicación actual"; la entrega se completa igual sin ella. Verificado en navegador el flujo completo: bodega crea y asigna → terreno marca fallida (motivo + observación) → bodega reprograma → terreno completa con receptor + evidencia fotográfica → la solicitud pasa a "Entregada/pagada" automáticamente. **Nota de alcance (no bloquea esta historia):** al navegar directamente a `/solicitudes/{id}` (sin link de navegación para terreno_repartidor, así que no es un camino que se ofrezca hoy), la sección "Documentos" sigue siendo visible para cualquier rol válido — es la misma restricción amplia ya documentada y diferida a EPIC 18/US-18.02 en la migración de EPIC 10, no algo nuevo de EPIC 12. Las páginas dedicadas de terreno (`/mis-entregas`) construidas aquí sí cumplen US-12.03/US-20.02 ("no se muestra información sensible innecesaria"): solo exponen dirección, beneficiario, ayuda y estado — nunca motivo, observaciones internas, evaluación social ni el resto de los documentos. EPIC 20 (US-20.01/US-20.02) no se marca como completo porque no fue parte de esta implementación, aunque el diseño de `/mis-entregas` ya satisface sus criterios en la práctica.

---

## EPIC 13 — Rutas de entrega

> **⬆️ US-13.01 re-priorizada de P1 a P0.** Coinco es una comuna rural con sectores dispersos y caminos rurales (sección 1 del maestro). Enviar al funcionario de terreno un listado plano de entregas sin agrupación geográfica desde el primer día generaría fricción operativa real. Agrupar por sector es la funcionalidad mínima de "ruta" y no debería quedar fuera del MVP estricto.

### US-13.01 — Agrupar entregas por sector ⬆️
**Prioridad:** ⬆️ P0 · **Dependencias:** US-12.01.

### US-13.02 — Ordenar entregas manualmente
**Prioridad:** P2 · **Dependencias:** US-13.01.

### US-13.03 — Abrir dirección en aplicación de mapas
**Prioridad:** P1 · **Dependencias:** US-12.03.

---

## EPIC 14 — Reembolsos médicos

*(sin cambios respecto a la v1)*

### US-14.01 — Crear solicitud de reembolso médico general — P0
### US-14.02 — Validar documentos de reembolso — P1
### US-14.03 — Aprobar monto de reembolso — P0
### US-14.04 — Registrar pago de reembolso — P0

---

## EPIC 15 — Reembolso especial por diálisis

*(sin cambios respecto a la v1)*

### US-15.01 ✅ — Crear solicitud de reembolso por diálisis — P0
### US-15.02 ✅ — Adjuntar certificado de diálisis — P0
### US-15.03 ✅ — Calcular acumulado mensual de diálisis — P0
### US-15.04 ✅ — Bloquear aprobación si supera tope mensual — P0
### US-15.05 ✅ — Autorizar excepción al tope de diálisis — P2

> **Estado (US-15.01 a US-15.05):** implementado sin ninguna migración nueva — reutiliza íntegramente el esquema ya construido en EPIC 10 (`documentos.tipo_documento` ya incluía `certificado_dialisis`), EPIC 12/14 (`estado_solicitud` ya incluía `aprobada_excepcion`, sin uso real hasta ahora) y EPIC 14 (`decisiones_solicitud`, `lib/reembolsos/`). US-15.01 ya funcionaba mediante el flujo genérico de EPIC 07 (persona beneficiaria y monto solicitado obligatorios para cualquier tipo de ayuda `reembolso`); solo se agregó lógica nueva a partir de US-15.02. US-15.02/15.01 (documentos exigidos) se validan al **enviar a evaluación**, no al crear, mismo criterio que "exige documento de respaldo" del reembolso general (EPIC 14) — verificado que el bloqueo lista exactamente qué falta (certificado, boleta/comprobante, o ambos) y se actualiza dinámicamente a medida que se suben. US-15.03 formaliza `calcularAcumuladoDialisisMensual` en `lib/reembolsos/dal.ts` — deliberadamente **por persona beneficiaria y mes calendario**, un cálculo distinto e independiente del pool anual por hogar de EPIC 14 (mismo archivo, funciones separadas). US-15.04 se verificó con dos solicitudes reales de diálisis para la misma persona en el mismo mes ($80.000 luego $100.000, sobre un saldo restante de $70.000): el acumulado/saldo se mostró correctamente antes de cada decisión, y el bloqueo del segundo monto se confirmó tanto en el cliente (atributo `max`) como de forma independiente en el servidor (removiendo el atributo vía consola), quedando auditado en `solicitudes_historial` reutilizando la misma función genérica `registrar_bloqueo_tope_reembolso` de EPIC 14 (sin necesidad de una función nueva). US-15.05 se restringió a administrador (el sistema no tiene un rol "aprobador especial" distinto); la aprobación por excepción exige motivo escrito (validado también con `required` HTML) y dejó la solicitud en estado `aprobada_excepcion` — visible sin ocultarse en el estado, el historial y el bloque de "Decisión", exactamente igual que cualquier otro estado de la solicitud, sin necesitar código adicional en ninguna otra sección de la página (Pago y Stock ya reconocían ese estado desde EPIC 11/12). Verificado que `aprobador` no ve el formulario de excepción y que su intento de aprobar por la vía normal por sobre el tope es rechazado con un mensaje que remite explícitamente a "requiere una excepción (US-15.05)".

---

## EPIC 16 — Auditoría y trazabilidad

*(sin cambios; agregar que EPIC 05 y EPIC 22/23 también generan eventos de auditoría)*

### US-16.01 — Registrar creación de entidades críticas — P0 · **Dependencias:** EPIC 03, EPIC 04, EPIC 07, EPIC 10, 🆕 EPIC 22, 🆕 EPIC 23. ✅
### US-16.02 — Auditar cambios de estado de solicitudes — P0 ✅
### US-16.03 — Auditar aprobación, rechazo y cambios de monto — P0 · **Dependencias:** EPIC 09, EPIC 14, EPIC 15, 🆕 US-05.05 (excepciones RSH). ✅
### US-16.04 — Consultar auditoría — P1 ✅

> **Estado (US-16.01 a US-16.04):** US-16.01/16.02/16.03 no requirieron ninguna tabla ni trigger nuevo — ya estaban satisfechas por la infraestructura de auditoría construida incrementalmente en cada EPIC anterior: `creado_por`/`created_at` en cada tabla crítica (`grupos_familiares`, `personas`, `solicitudes`, `documentos`, `tipos_ayuda`, `entregas`), las tablas `*_historial` + sus triggers `log_*_cambio()` (EPIC 03, 04, 06, 07, 12), las funciones RPC de auditoría explícita (`registrar_validacion_rsh_solicitud`, `registrar_observacion_solicitud`, `registrar_bloqueo_tope_reembolso`, EPIC 05/09/14), y las tablas insert-only `decisiones_solicitud`/`pagos_reembolso` (EPIC 09/14) que ya son su propio registro inmutable de aprobación/rechazo/monto/pago. La única brecha real era **US-16.04**: no existía una vista unificada y filtrable, y el rol `auditor_consulta` (creado en US-01.03) no tenía ningún permiso de lectura real en todo el sistema todavía. Se agregó la migración `20260805000001_auditoria_fn.sql` con dos funciones `security definer` (mismo patrón que `nombre_usuario()`/`listar_funcionarios_terreno()`, con su propio chequeo de rol interno en vez de ensanchar la RLS de cada tabla): `listar_eventos_auditoria(...)` — une con `UNION ALL` los eventos de creación/cambio/decisión/pago/movimiento de las ~10 tablas relevantes en una forma común (fecha, usuario, entidad, acción, detalle, ruta), con filtrado por fecha/usuario/entidad/acción resuelto en SQL — y `listar_usuarios_para_auditoria()` para poblar el filtro "por usuario". Acceso restringido a `administrador`/`auditor_consulta`; verificado que `finanzas`, `bodega_logistica` y `evaluador_social` reciben `No autorizado` al invocar la función por REST directo, y que `bodega_logistica` navegando a `/auditoria` es redirigido a `/sin-permiso` (la página ni siquiera aparece en su nav). Deliberadamente **excluido** de la vista unificada, consistente con la restricción de CLAUDE.md ("hitos e informes sociales son datos sensibles") y con el comentario ya existente en `rls_hitos.sql` que excluye explícitamente a `auditor_consulta`: el contenido de `hitos` y de `evaluaciones_sociales` (comentario/fundamento). Sí se incluyó `hitos_accesos_denegados` (intentos de acceso denegado, un evento de seguridad — no contenido sensible — cuyo propio comentario en EPIC 22 anticipaba unirse "al resto de auditoría" una vez existiera EPIC 16). Pendiente para cuando se construya 🆕 EPIC 23 (informes sociales estructurados, todavía no implementado — bloquea también US-05.05): agregar su evento de creación a `listar_eventos_auditoria()`, sin tocar el resto de la función. Verificado end-to-end con navegador: `auditor_consulta` ve la lista completa con filtros funcionando (por entidad, con conteo correcto), el enlace "Ver" de cada evento navega a la página de detalle correspondiente (`/hogares/{id}`, `/solicitudes/{id}`, etc.), y `administrador` ve el mismo módulo con el link de nav habilitado.

---

## EPIC 17 — Reportes operativos

*(sin cambios respecto a la v1, salvo aclaración)*

### US-17.01 — Reporte de ayudas entregadas — P1 ✅
### US-17.02 — Reporte de hogares beneficiados — P1 ✅
### US-17.03 — Reporte de reembolsos médicos — P1 ✅
### US-17.04 — Reporte de diálisis — P1 ✅
### US-17.05 — Reporte de entregas pendientes y fallidas — P1 ✅
### US-17.06 — Exportar reportes a CSV o Excel — P2 ✅

> **Nota:** el reporte de ayudas por excepción RSH (US-05.05) y el listado de hitos/informes sociales por hogar deberían incorporarse a este EPIC en una iteración posterior; no se agregan como historias nuevas aquí para no inflar el MVP, pero quedan anotados como pendiente de reportería (ver sección "Historias para después del MVP").

> **Estado (US-17.01 a US-17.06):** mismo criterio que EPIC 16 (auditoría) — los cinco reportes cruzan tablas (solicitudes, decisiones_solicitud, pagos_reembolso, entregas, grupos_familiares, tipos_ayuda, personas) que hoy no tienen SELECT directo para todos los roles que necesitan verlas (finanzas, auditor_consulta, bodega_logistica), así que en vez de ensanchar la RLS de cada tabla se agregó la migración `20260806000001_reportes_fn.sql` con cinco funciones `security definer` (mismo patrón que `listar_eventos_auditoria`), cada una con su propio chequeo de rol interno correspondiente al "como \<rol\>, quiero..." de su historia: `reporte_ayudas_entregadas` (administrador/auditor_consulta), `reporte_hogares_beneficiados` (administrador/auditor_consulta), `reporte_reembolsos_medicos` (administrador/finanzas), `reporte_dialisis_mensual` (administrador/finanzas/auditor_consulta) y `reporte_entregas_pendientes_fallidas` (administrador/bodega_logistica). "Ayuda entregada" (US-17.01/17.02) se define como una solicitud en estado `entregada_pagada` — el mismo estado terminal que usan tanto la entrega física (EPIC 12) como el pago de un reembolso (EPIC 14) — con la fecha efectiva resuelta por `coalesce(entregas.fecha_hora_entrega, pagos_reembolso.fecha_pago)`. La distinción "reembolso general" vs "diálisis" (US-17.03/17.04) reutiliza los mismos dos nombres literales de catálogo que `lib/reembolsos/tramos.ts` (no hay columna propia, ver el comentario de `reglas_tipos_ayuda.sql`), y el tope de diálisis ($150.000, US-17.04) replica el mismo criterio de cómputo que `calcularAcumuladoDialisisMensual` (US-15.03) pero agregado por mes/persona para todo el universo de beneficiarios en una sola consulta SQL, en vez de N llamadas JS. Toda excepción (`estado = 'aprobada_excepcion'`) queda expuesta como `es_excepcion`/`tiene_excepcion` en el resultado y visualmente marcada en la UI (CLAUDE.md: "las excepciones nunca se ocultan"). US-17.06 (exportar CSV) se resolvió con una sola ruta dinámica `app/api/reportes/[reporte]/export/route.ts` que reutiliza exactamente la misma función de cada reporte con los mismos filtros de la URL (garantiza que la exportación nunca diverja de lo que el usuario ve en pantalla), gatilla el mismo `requireRole` que la página correspondiente, y no toca la tabla `documentos` en ningún reporte (ningún archivo/evidencia se exporta). Nav actualizado en `lib/dashboard/nav.ts`: se activó el enlace "Reportes" ya placeholder de administrador/auditor_consulta y se agregó uno nuevo para finanzas y bodega_logistica. Verificado con `tsc --noEmit`, `next lint` y `next build` (los cinco reportes y la ruta de exportación compilan y quedan listados como rutas dinámicas) — **no se pudo verificar end-to-end contra Supabase local ni en navegador**, porque Docker no estaba disponible en el entorno de esta sesión (`supabase start` falla por no encontrar el daemon). Queda pendiente para quien continúe: levantar Supabase local (`npm run supabase:start`), aplicar la migración (`npm run supabase:reset` o `supabase db push`) y probar en navegador con al menos cuatro roles (administrador, finanzas, auditor_consulta, bodega_logistica) que cada reporte filtra, muestra excepciones y exporta CSV correctamente, y que un rol sin acceso a un reporte recibe "No autorizado" al invocar la función por REST directo.

---

## EPIC 18 — Protección de datos y seguridad funcional

*(sin cambios respecto a la v1)*

### US-18.01 — Minimizar datos solicitados — P0 ✅
### US-18.02 — Restringir acceso a documentos sensibles — P0 ✅
### US-18.03 — Registrar finalidad del tratamiento documental — P1 ✅
### US-18.04 — Política de retención básica — P2 ✅

> **Estado (US-18.01 a US-18.04):** US-18.01 y US-18.03 no requirieron ninguna migración ni cambio de código — ya estaban satisfechas por infraestructura construida en EPICs anteriores, verificado releyendo el código existente contra cada criterio de aceptación uno por uno: US-18.01 ("las ayudas familiares no exigen datos médicos", "la persona beneficiaria solo es obligatoria cuando aplica", "el formulario se adapta según tipo de ayuda") ya la cumple `SolicitudForm` (`app/(protected)/solicitudes/solicitud-form.tsx`) condicionando `persona_id`/`monto_solicitado` según `tipos_ayuda.requiere_persona_beneficiaria`/`tipo`, y "las ayudas médicas solo solicitan documentos requeridos" ya la cumple la validación de documentos obligatorios al enviar a evaluación (US-15.01/15.02, `lib/solicitudes/actions.ts`). US-18.03 ("cada documento tiene finalidad, elegida desde catálogo, obligatoria, visible") ya la cumple íntegramente `documentos.tipo_documento` (`not null`, enum cerrado, validado también en el servidor en `subirDocumento`, mostrado en `DocumentosSection`) — es exactamente lo que la migración de EPIC 10 (20260729000009) ya documentaba como "tipo_documento ES la clasificación por finalidad, no se agrega un campo redundante".
>
> US-18.02 y US-18.04 sí requirieron migración nueva. **US-18.02:** hasta ahora `documentos`/`storage.objects` tenían una política de lectura abierta a cualquier rol válido, con una nota explícita en su propia migración de que la restricción fina quedaba diferida a esta historia. Se agregó `20260807000001_rls_documentos_sensibilidad.sql` con una función `puede_ver_documento(tipo_documento)` reutilizada por ambas políticas de SELECT (tabla y bucket): administrador/evaluador_social/aprobador ven todo tipo de documento ("documentos de evaluación"); finanzas ve `boleta`/`comprobante`/`certificado_medico`/`certificado_dialisis` ("documentos necesarios para reembolsos") pero no `informe_social`; bodega_logistica/terreno_repartidor/auditor_consulta ven todo excepto `certificado_medico`/`certificado_dialisis`/`informe_social` (mismo criterio de CLAUDE.md ya aplicado a hitos/informes sociales — "Terreno, bodega y compras nunca acceden a ellos"). La política de `storage.objects` resuelve la sensibilidad por `join` contra `documentos.storage_path`, así que ni la fila ni el archivo firmado quedan accesibles para un rol sin permiso, incluso navegando directamente a `/solicitudes/{id}` sin pasar por el nav (brecha ya anotada en el Estado de EPIC 12). **US-18.04:** se agregó `20260807000002_retencion_documentos.sql` con la columna `documentos.estado_retencion` (vigente/vencido/reemplazado/bloqueado/eliminable, default vigente), la primera tabla `documentos_historial` del sistema (documentos era insert-only hasta ahora) con triggers que auditan automáticamente tanto el cambio de estado de conservación como la eliminación física, una función `security definer` `actualizar_estado_retencion_documento` (evita el problema de que un `grant update` de columna amplio a `authenticated` sería aprovechable por finanzas/evaluador_social a través de su propia política de UPDATE de validación, ya existente) y una política RLS de `DELETE` acotada a `administrador` (tabla y bucket). `lib/documentos/actions.ts` agrega `actualizarRetencionDocumento`/`eliminarDocumento`; `DocumentosSection` muestra el estado de conservación a cualquiera que vea el documento y solo ofrece los controles de cambiarlo/eliminarlo a administrador (`puedeGestionarRetencion`, pasado desde `solicitudes/[id]` y `hogares/[id]`). De regalo, se sumaron los eventos de retención/eliminación de documentos a `listar_eventos_auditoria` (EPIC 16) con una rama `UNION ALL` más, sin tocar ninguna de las ramas existentes (verificado programáticamente que las 14 ramas originales quedaron byte-idénticas tras el `create or replace`).
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio, las cinco páginas/rutas nuevas o tocadas quedan listadas). **No se pudo verificar end-to-end contra Supabase local ni en navegador** — Docker no estaba disponible en el entorno de esta sesión (`docker info`/`supabase start` fallan por no encontrar el daemon). Queda pendiente para quien continúe: levantar Supabase local, aplicar ambas migraciones y probar en navegador con al menos cinco roles (administrador, evaluador_social, finanzas, bodega_logistica o terreno_repartidor, auditor_consulta) que: cada uno ve exactamente los tipos de documento de la matriz de arriba (incluyendo que la URL firmada de un documento restringido no se genera, no solo que la fila no aparezca en la lista); que un intento de `UPDATE estado_retencion` o `DELETE` por REST directo con un rol distinto de administrador falla (0 filas afectadas o error "No autorizado"); y que el evento de eliminación aparece correctamente en `/auditoria` filtrando por entidad "Documento".

---

## EPIC 19 — Administración del sistema

*(sin cambios)*

### US-19.01 — Administrar usuarios — P1 ✅
**Revisión 2026-10-27 (roles múltiples):** un usuario puede tener varios roles y el administrador los asigna con casillas. Criterios actualizados y decisiones en `docs/backlog.md`, sección "EPIC 01 y EPIC 19 — Roles múltiples por usuario".

### US-19.02 — Administrar sectores — P1 ✅
### US-19.03 — Administrar motivos de entrega fallida — P2 ✅

> **Estado (US-19.01 a US-19.03):** las tres viven bajo `/admin` (enlace ya placeholder de administrador en `lib/dashboard/nav.ts`, activado en esta historia), cada una con su propio módulo `lib/<recurso>/{types,dal,actions}.ts` clonando el patrón ya usado por `tipos_ayuda` (EPIC 06): catálogo con `nombre`/`estado`, tabla `*_historial` + trigger genérico de auditoría, RLS de lectura amplia (cualquier rol válido) y escritura restringida a administrador.
>
> **US-19.01:** no necesitó ninguna política RLS nueva sobre `profiles` — `profiles_select_own_or_admin`/`profiles_update_admin_only` (EPIC 01) ya dejaban a administrador leer y escribir cualquier fila, porque `is_admin()` no depende de la fila evaluada. Lo único que faltaba era auditoría: se agregó `profiles_historial` (migración `20260808000001_profiles_historial.sql`) con un trigger que audita `rol`/`estado`. Se agregó además una salvaguarda que no es un criterio de aceptación explícito pero evita una clase de incidente real: un administrador no puede cambiarse el rol ni desactivar su propia cuenta (`lib/usuarios/actions.ts`) — `bootstrap_admin()` solo actúa al crear la cuenta, no restaura un admin existente que se auto-bloquea.
>
> **US-19.02:** `grupos_familiares.sector` sigue siendo `text` (no se convirtió a FK) — es un valor comparado por igualdad de texto en unos 10 lugares del sistema (agrupación de entregas, rutas, los tres reportes de sector de EPIC 17) y ninguno necesitaba cambiar. Se agregó el catálogo `sectores` (migración `20260808000002_sectores.sql`), sembrado por backfill con los sectores ya en uso (`select distinct sector from grupos_familiares`), y el `<input>` libre de `hogar-form.tsx` pasó a ser un `<select>` de sectores activos (con opción extra si el hogar ya tenía un sector que hoy está desactivado, para no perderlo silenciosamente al guardar) — validado también en el servidor (`lib/hogares/actions.ts`).
>
> **US-19.03:** a diferencia de sectores, esta sí exigió una migración de esquema real — "se pueden crear motivos" es incompatible con el enum fijo `motivo_fallo_entrega` (EPIC 12), que solo se extiende con una migración. `20260808000003_motivos_entrega_fallida.sql` agrega el catálogo `motivos_entrega_fallida`, lo siembra con los 5 motivos ya existentes (mismo nombre legible que tenía `MOTIVO_FALLO_LABELS`), y convierte `entregas.motivo_fallo` de enum a `uuid references motivos_entrega_fallida(id)` (primera conversión enum→catálogo del proyecto) con backfill desde el valor de enum anterior — "los motivos históricos se conservan" porque las entregas ya marcadas como fallidas quedan apuntando al mismo registro del catálogo, no a texto libre. Se actualizó `log_entrega_cambio()` para resolver el nombre del motivo en el historial (en vez de auditar el uuid crudo) y `reporte_entregas_pendientes_fallidas` (EPIC 17) para unir contra el catálogo. En la aplicación, `lib/entregas/dal.ts` ahora resuelve `motivo_fallo_nombre` vía un join de un nivel (`motivos_entrega_fallida(nombre)`, confiable en PostgREST a diferencia de los de dos niveles ya documentados en este archivo), `entrega-fallida-form.tsx` recibe el catálogo de motivos activos como prop en vez de un array de TypeScript codificado, y `registrarEntregaFallida` valida contra el catálogo (existe y está activo) en vez de contra un array fijo.
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio; las 12 rutas nuevas bajo `/admin` y las páginas tocadas quedan listadas). **No se pudo verificar end-to-end contra Supabase local ni en navegador** — Docker no estaba disponible en el entorno de esta sesión. Queda pendiente para quien continúe, en especial para US-19.03 por ser la migración de mayor riesgo (conversión de columna con backfill): confirmar que las entregas fallidas creadas *antes* de esta migración siguen mostrando su motivo original correctamente tanto en `/mis-entregas/[id]` como en `/solicitudes/[id]` y en el reporte de EPIC 17, que un administrador no puede autoeditarse en `/admin/usuarios`, y que evaluador_social/finanzas/etc. reciben 0 filas afectadas (no error) si intentan escribir en `sectores`/`motivos_entrega_fallida` por REST directo.

---

## EPIC 20 — Experiencia móvil para terreno

*(sin cambios)*

### US-20.01 — Vista móvil de entregas — P0 ✅
### US-20.02 — Reducir información visible en terreno — P0 ✅

> **Estado (US-20.01 a US-20.02):** ambas resultaron mayormente ya satisfechas por el diseño de `/mis-entregas` construido en EPIC 12 (ya anotado explícitamente en el Estado de esa historia) — el trabajo real de este EPIC fue cerrar dos brechas concretas, no reconstruir la experiencia de terreno.
>
> **US-20.01:** de los 5 criterios, 4 ya estaban cubiertos (botones grandes de ancho completo con `text-base` para evitar el zoom automático de iOS, formularios cortos y enfocados en `EntregaRealizadaForm`/`EntregaFallidaForm`, `<input type="file" accept="image/*" capture="environment">` que en navegadores móviles reales ofrece tanto cámara como galería, y el nav de terreno sin ningún módulo administrativo). El que faltaba de verdad — "la interfaz funciona correctamente en teléfono" — tenía un problema concreto: `NavSidebar` era un sidebar fijo de 224px (`w-56`) sin ningún manejo responsive, que en una pantalla de ~375px se habría comido más de la mitad del ancho disponible. Se hizo responsive: `NavSidebar` queda oculto bajo el breakpoint `md` (`hidden md:block`) y se agregó `MobileNav` (`app/(protected)/mobile-nav.tsx`), un menú colapsable con `<details>/<summary>` nativo — sin JavaScript de cliente, mismo criterio que el resto del proyecto (formularios y navegación planos) — visible solo bajo `md`. El listado de items se extrajo a `nav-items.tsx` para no duplicar el marcado entre ambos. De paso, el padding de header/main pasó a ser responsive (`p-4 md:p-6`) para aprovechar mejor el ancho en pantallas angostas.
>
> **US-20.02:** los tres criterios de "terreno no ve X" ya estaban cubiertos por RLS independientemente de la página (evaluación social/hitos restringidos desde antes de este EPIC per CLAUDE.md; documentos médicos restringidos por `puede_ver_documento`, US-18.02, esta sesión) — pero "terreno no ve historial completo del hogar" tenía una brecha real: `/hogares`, `/hogares/[id]`, `/solicitudes` y `/solicitudes/[id]` no tenían ningún `requireRole`, solo `getProfile()` (o, en el caso de `/solicitudes`, ningún control de rol en absoluto) — terreno no tiene enlace de nav a ninguna de las cuatro, pero una navegación directa por URL sí llegaba, exponiendo el listado completo de hogares (con tramo RSH) y de solicitudes (incluidos motivo y tipo de reembolso médico) de todo el sistema. Se agregó `requireRole` a las cuatro páginas, excluyendo únicamente a `terreno_repartidor` — el resto de roles válidos (incluido `auditor_consulta`, que sí tiene enlace de nav a ambos módulos) mantiene exactamente el mismo acceso que ya tenía; no se tocó ninguna otra página ni rol para no ampliar el alcance más allá de lo que pide esta historia.
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio). Se levantó `next dev` como smoke test (`/` redirige con 307, `/login` responde 200 sin errores de servidor). **No se pudo verificar visualmente en navegador con una sesión autenticada** — Docker no estaba disponible en el entorno de esta sesión, así que no hay forma de iniciar sesión y confirmar en pantalla que `MobileNav` se ve y funciona bien en un viewport de teléfono real, ni que un usuario `terreno_repartidor` recibe `/sin-permiso` al navegar directamente a `/hogares` o `/solicitudes/{id}`. Queda pendiente para quien continúe: levantar Supabase local, iniciar sesión como `terreno_repartidor` en un viewport angosto (o con las devtools en modo dispositivo) y confirmar el menú colapsable, y probar la navegación directa a las cuatro páginas bloqueadas con ese mismo rol.
>
> **Estado (revisión posterior):** verificado en vivo contra Supabase local con un usuario `terreno_repartidor` de prueba (`terreno@coinco.cl`). **US-20.02 confirmado por completo**: navegación directa a las cuatro páginas (`/hogares`, `/hogares/{id}`, `/solicitudes`, `/solicitudes/{id}`) redirige a `/sin-permiso` para `terreno_repartidor`; se verificó además que `auditor_consulta` (rol que sí debe conservar acceso) sigue viendo las cuatro páginas con datos normales, confirmando que el `requireRole` agregado no restringió de más. El nav de `terreno_repartidor` (sidebar y `MobileNav`) tampoco ofrece enlaces a esas cuatro páginas, coherente con el bloqueo. **US-20.01 verificado solo parcialmente**: se confirmó por inspección de DOM/CSS (vía `javascript_tool`, leyendo las clases `hidden md:block` de `NavSidebar` y `md:hidden` de `MobileNav`) que la estructura responsive está bien construida, pero la herramienta de automatización de navegador de este entorno no permite forzar un viewport angosto real (`resize_window` reporta éxito pero `window.innerWidth` permanece en ~1920px pase lo que pase) — así que la confirmación visual pixel-a-pixel de "se ve y funciona bien en un teléfono real" sigue sin poder hacerse dentro de esta sesión; queda como una verificación manual pendiente (probar en un teléfono real o con las devtools de un navegador de escritorio en modo dispositivo, fuera de esta herramienta) antes de dar el criterio visual por cerrado al 100%.

---

## EPIC 21 — Pruebas y validación del MVP

*(sin cambios en las historias existentes; se agrega una prueba nueva relacionada con la excepción RSH)*

### US-21.01 — Probar flujo completo de caja de mercadería — P0 ✅⚠️
### US-21.02 — Probar flujo completo de pañales — P0 ✅⚠️
### US-21.03 — Probar flujo completo de materiales de construcción — P1 ✅⚠️
### US-21.04 — Probar flujo completo de reembolso médico general — P0 ✅⚠️
### US-21.05 — Probar flujo completo de reembolso por diálisis — P0 ✅⚠️

> **Estado (US-21.01 a US-21.05):** ver `docs/pruebas-epic-21.md` para el plan de prueba manual completo de cada una (no hay framework de pruebas automatizadas en el proyecto). El ⚠️ indica que el plan está escrito y verificado contra el código real, pero no se ejecutó contra una instancia viva (Docker/Supabase no disponible en esta sesión). US-21.01/02/04 documentan un hallazgo: el criterio "la solicitud queda cerrada" no se cumple — ninguna acción del sistema lleva una solicitud al estado `cerrada`, el flujo real termina en `entregada_pagada`.

### 🆕 US-21.06 — Probar flujo completo de excepción RSH
Como equipo del proyecto,
quiero probar el flujo de un hogar con RSH > 40%,
para validar que el sistema bloquea la aprobación regular y exige informe social y excepción registrada.
**Prioridad:** P0 · **Dependencias:** US-05.04, US-05.05, EPIC 23.
**Criterios de aceptación:**
- Se crea un hogar con tramo RSH > 40%.
- Se crea una solicitud y el sistema bloquea la aprobación regular.
- Se adjunta informe social estructurado.
- Se registra la excepción con motivo y autoridad solicitante.
- La solicitud queda aprobada por excepción, visualmente identificada como tal.
- El caso aparece correctamente marcado en auditoría.

---

## 🆕 EPIC 22 — Hitos del grupo familiar y del beneficiario

**Objetivo:** permitir que las asistentes sociales dejen constancia de hitos familiares, sociales o de salud relevantes, tal como lo define la sección 26 del Contexto Maestro, con acceso restringido dado su carácter sensible.

### 🆕 US-22.01 ✅ — Registrar hito
Como asistente social,
quiero registrar un hito de tipo familiar, social o de salud,
para dejar constancia de información relevante sobre un hogar o beneficiario.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Campos mínimos:** tipo de hito (familiar/social/salud), categoría, comentario, fecha del hito, asistente social que registra, fecha de registro en el sistema, grupo familiar asociado, beneficiario asociado (si corresponde).
**Criterios de aceptación:**
- Se puede crear un hito asociado a un hogar y, opcionalmente, a un integrante específico.
- El comentario y la fecha del hito son obligatorios.
- Se registra automáticamente el usuario y la fecha de registro en el sistema.
- El hito queda visible en la ficha del hogar/beneficiario solo para roles autorizados.

> **Estado:** verificado end-to-end en local. `categoria` se implementó como texto libre (el maestro, sección 51, señala que no existe todavía un mantenedor de tipos/categorías de hito y no es un criterio de aceptación explícito crear uno ahora). El listado en la ficha del hogar ya existe como efecto colateral de mostrar el hito recién creado, pero **no** cubre US-22.02 completo (falta filtro por tipo) — esa historia sigue sin marcar, correctamente diferida a Sprint 3.

### 🆕 US-22.02 ✅ — Ver historial de hitos de un hogar o beneficiario
Como usuario autorizado,
quiero ver el listado de hitos de un hogar o beneficiario,
para tener contexto social antes de evaluar una solicitud.
**Prioridad:** P0 · **Dependencias:** US-22.01.
**Criterios de aceptación:**
- El listado se muestra ordenado por fecha.
- Se puede filtrar por tipo de hito.
- Solo roles autorizados ven el listado completo (evaluador social, aprobador con justificación, jefatura).
- Terreno, bodega, compras y finanzas no acceden a este listado (ver EPIC 20 y US-18.02).

> **Estado:** de los 4 criterios, 3 ya estaban cubiertos desde US-22.01 (orden por `fecha_hito` descendente en `listarHitosDeHogar`; el gate de rol `ROLES_VER_HITOS` = administrador/evaluador_social/aprobador ya cubre "evaluador social, aprobador, jefatura"; terreno/bodega/compras/finanzas ya estaban excluidos tanto por RLS como por la condición de render). Solo faltaba "se puede filtrar por tipo de hito" — se agregó un filtro GET sin JS (`?tipo_hito=...`) en `hogares/[id]/page.tsx`, mismo patrón que el filtro de documentos ya existente en la misma página (`TIPOS_HITO`/`TIPO_HITO_LABELS` agregados a `lib/hitos/types.ts`). El filtro se resuelve en JS sobre el listado ya traído (no un parámetro nuevo en la consulta) — la cantidad de hitos por hogar no justifica un viaje de ida y vuelta adicional por cada cambio de filtro, mismo criterio ya usado para documentos. Como la página ahora tiene dos filtros GET independientes (`tipo_documento` y `tipo_hito`), se agregó un prop genérico `preservarParams` a `DocumentosSection` para que enviar un filtro no borre el otro de la URL — sin este ajuste, filtrar hitos habría reseteado silenciosamente el filtro de documentos activo (y viceversa). Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio) — **no se pudo verificar visualmente en navegador** (Docker/Supabase no disponible en esta sesión, igual que en las sesiones anteriores de este backlog).

### 🆕 US-22.03 ✅ — Restringir acceso a hitos sensibles
Como sistema,
quiero restringir el acceso a hitos según el rol del usuario,
para proteger información sensible de salud o situaciones familiares delicadas.
**Prioridad:** P0 · **Dependencias:** US-22.01, US-01.05.
**Criterios de aceptación:**
- RLS aplicado a la tabla de hitos.
- Roles no autorizados no pueden leer hitos vía API ni interfaz.
- El intento de acceso no autorizado queda registrado en auditoría.

> **Estado:** RLS restringe select/insert de `hitos` a administrador/evaluador_social/aprobador (mismo criterio que evaluaciones_sociales/decisiones_solicitud) — verificado con REST directo: `terreno_repartidor` no puede leer ni escribir (403/lista vacía), `aprobador` puede leer pero no escribir. El criterio "el intento de acceso no autorizado queda registrado en auditoría" se resolvió a nivel de aplicación, no de RLS: Postgres no distingue "denegado" de "sin filas" dentro de una política de select, así que no hay un evento que auditar desde ahí. `requireRoleHitos()` (`lib/hitos/dal.ts`) registra el intento en la tabla `hitos_accesos_denegados` (rol, hogar, ruta) antes de redirigir a `/sin-permiso`, cubriendo el acceso vía interfaz — que es como se llega a cualquier ruta de hitos en este sistema (no hay API pública propia más allá de PostgREST, ya cubierto por RLS). Un acceso directo por REST bypaseando la app queda bloqueado por RLS pero no auditado individualmente; es el mismo límite que ya aplica al resto de RLS del sistema, no específico de hitos. Verificado en local: intento de `terreno_repartidor` contra `/hogares/{id}/hitos/nuevo` quedó registrado correctamente en `hitos_accesos_denegados`, y esa tabla de auditoría a su vez solo es legible por administrador (bug encontrado y corregido durante la verificación: la migración inicial no habilitaba RLS en `hitos_accesos_denegados`, dejándola legible por cualquier autenticado).

---

## 🆕 EPIC 23 — Informes sociales estructurados

**Objetivo:** registrar los informes sociales como una entidad estructurada (no solo como archivo adjunto), ya que respaldan evaluaciones, excepciones RSH y casos especiales de reembolso (sección 27 del maestro).

### 🆕 US-23.01 ✅ — Crear informe social
Como asistente social,
quiero registrar un informe social estructurado,
para respaldar formalmente una evaluación, excepción o caso especial.
**Prioridad:** P0 · **Dependencias:** US-03.01, US-08.01.
**Campos mínimos:** grupo familiar, beneficiario (si aplica), fecha del informe, asistente social responsable, motivo del informe, evaluación social, antecedentes familiares, situación habitacional, situación económica, situación de salud (si aplica), recomendación profesional, ayuda sugerida, documentos adjuntos, nivel de confidencialidad, observaciones.
**Criterios de aceptación:**
- El informe se puede asociar a una solicitud, a una excepción RSH (US-05.05) o a un caso especial de reembolso (cirugía, fallecimiento, diálisis).
- El nivel de confidencialidad es obligatorio y determina qué roles pueden verlo.
- No se puede aprobar una excepción RSH (US-05.05) sin un informe social asociado.
- El informe queda vinculado al historial del hogar.

### 🆕 US-23.02 ✅ — Ver informes sociales de un hogar
Como usuario autorizado,
quiero ver los informes sociales asociados a un hogar,
para revisar antecedentes antes de tomar decisiones.
**Prioridad:** P0 · **Dependencias:** US-23.01.
**Criterios de aceptación:**
- Listado de informes por hogar, ordenado por fecha.
- Acceso restringido según nivel de confidencialidad y rol.
- Terreno, bodega y compras no acceden a informes sociales.

### 🆕 US-23.03 ✅ — Vincular informe social a excepción RSH o caso especial
**Prioridad:** P0 · **Dependencias:** US-23.01, US-05.05, EPIC 15.
**Criterios de aceptación:**
- Un informe social puede quedar referenciado desde una excepción RSH o desde un caso especial de reembolso (cirugía/fallecimiento/diálisis).
- La referencia es visible desde ambos lados (informe → caso, caso → informe).

> **Estado (US-23.01 a US-23.03):** nueva tabla `informes_sociales` (migración `20260809000001_informes_sociales.sql`), mismo patrón de historial-inmutable que `hitos`/`evaluaciones_sociales` (sin update/delete). "Documentos adjuntos" (campo mínimo de US-23.01) no se modeló como una FK nueva — reutiliza `documentos.tipo_documento = 'informe_social'` del mismo hogar (EPIC 10/18), evitando romper el check `documentos_una_entidad_check` con una tercera entidad posible. "Nivel de confidencialidad... determina qué roles pueden verlo" (US-23.01) se implementó con dos niveles (`estandar`/`alta`) vía una función `puede_ver_informe_social()`: administrador ve todo; evaluador_social ve `estandar` + lo propio aunque sea `alta`; aprobador solo ve `estandar` (nunca `alta`, ni siquiera si lo necesitara para decidir — la recomendación práctica documentada en la migración es que el asistente social marque como `estandar` cualquier informe que respalde una decisión de aprobador). "Terreno, bodega y compras no acceden" (US-23.02) se cumple tanto por RLS (ninguno de esos roles pasa `puede_ver_informe_social`) como por el gate de UI (`ROLES_VER_INFORMES`); "compras" no existe como rol real todavía (EPIC 24 no construido), así que ese tercio del criterio es trivial.
>
> **US-23.03** — "el informe se puede asociar a una solicitud, a una excepción RSH o a un caso especial de reembolso" se modeló con una sola FK nullable `informes_sociales.solicitud_id`, porque las tres son en la práctica la misma solicitud (una excepción RSH y un caso especial de reembolso terminan siendo una solicitud con `decisiones_solicitud`/estado `aprobada_excepcion`) — no hace falta una entidad "caso" separada. La referencia es visible desde ambos lados: informe → caso, como enlace a `/solicitudes/{id}` en la ficha del hogar; caso → informe, como una nueva sección "Informe social" en el detalle de la solicitud (`listarInformesSocialesDeSolicitud`). **Cirugía y fallecimiento no se pudieron probar** porque son EPIC 25 (reembolsos excepcionales), que no está implementado — el mecanismo es genérico (cualquier `solicitud_id`), así que funcionará para esos casos automáticamente en cuanto EPIC 25 exista, sin cambios adicionales; diálisis y excepción RSH sí son completamente funcionales hoy.
>
> **De regalo, esta implementación completó 🆕 US-05.05** (registrar excepción RSH), que estaba bloqueada exclusivamente por la falta de esta entidad — ver el Estado de esa historia (EPIC 05) para el detalle completo, incluyendo dos hallazgos importantes corregidos en el camino: `enviarAEvaluacion` bloqueaba el envío a evaluación completo en vez de solo la aprobación (mismatch con CLAUDE.md), y un bug preexistente donde el rol `aprobador` no podía actualizar `solicitudes.estado` por una política RLS incompleta (afectaba a todo EPIC 09, no solo a esta historia).
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio; la nueva ruta `/hogares/[id]/informes-sociales/nuevo` queda listada). **No se pudo verificar end-to-end contra Supabase local ni en navegador** — Docker no disponible en esta sesión, igual que en el resto de este backlog. Queda pendiente para quien continúe: verificar en navegador que `aprobador`/`evaluador_social` ven exactamente lo que corresponde a cada nivel de confidencialidad (incluida la variante "autor ve su propio informe `alta`"), que terreno/bodega/finanzas reciben lista vacía (no error) al intentar leer `informes_sociales` por REST directo, y correr el flujo completo descrito en US-21.06 (ahora desbloqueado: hogar con RSH > 40%, informe social, excepción aprobada, verificar marca visual en la solicitud y en auditoría).

---

## 🆕 EPIC 24 — Compras municipales *(fuera del MVP estricto, trazado explícitamente)*

> El Contexto Maestro dedica la sección 29 a compras municipales vinculadas a inventario. En la v1 del backlog este módulo no existía ni se mencionaba. Se agrega aquí, explícitamente marcado como **post-MVP**, para que la ausencia sea una decisión consciente y no un olvido. Para el MVP, el ingreso de stock se resuelve de forma manual con US-11.02 (registrar entrada de stock), sin trazabilidad formal de proveedor u orden de compra.

> **Estado (revisión Sprint 3, 2026-10-27):** verificado lo que había quedado pendiente. Visibilidad por rol confirmada en la base (informe `alta` creado por el evaluador): administrador y autor lo leen; aprobador, finanzas, bodega y terreno no. Se encontró y corrigió un bug: el requisito "informe social asociado" se medía leyendo la tabla con RLS, así que al aprobador no le llegaban los informes `alta` y la excepción RSH (y los reembolsos excepcionales) quedaban bloqueados aunque el informe existiera; tampoco veía el formulario de excepción. Ahora se mide con `contar_informes_sociales_de_solicitud` (migración `20260817000003`, solo cuenta, no expone contenido) y la solicitud le avisa al aprobador que hay un informe de confidencialidad alta que su rol no puede ver. La tarjeta "Decisión" ahora marca explícitamente "Aprobada por excepción".

### 🆕 US-24.01 ✅ — Registrar proveedor
**Prioridad:** P2 · **Dependencias:** ninguna.
**Criterios de aceptación:** registro de nombre, RUT, contacto; listado de proveedores activos.

### 🆕 US-24.02 ✅ — Registrar compra municipal
**Prioridad:** P2 · **Dependencias:** US-24.01, US-11.01.
**Campos mínimos:** tipo de producto, proveedor, número de orden de compra, fecha de compra, fecha de recepción, cantidad, valor unitario, valor total, documento tributario asociado, funcionario responsable.

### 🆕 US-24.03 ✅ — Vincular compra con ingreso de stock
**Prioridad:** P2 · **Dependencias:** US-24.02, US-11.02.
**Criterios de aceptación:** el ingreso de stock (US-11.02) puede referenciar una compra registrada; se puede consultar el historial de ingresos por compra.

> **Estado (US-24.01 a US-24.03):** módulo nuevo bajo `/inventario/proveedores` y `/inventario/compras` (no bajo `/admin` — a diferencia de los catálogos de EPIC 19, este lo gestiona bodega_logistica además de administrador, mismo público que `productos`/`movimientos_stock`, y `/admin/*` está restringido solo a administrador). **US-24.01:** `proveedores` sigue el mismo patrón de catálogo que sectores/motivos_entrega_fallida (EPIC 19) — nombre, estado activo/inactivo, historial de cambios — con `rut` (único) y `contacto` (texto libre) agregados. **US-24.02:** es la única historia de esta sesión sin lista de "criterios de aceptación" propia (solo "campos mínimos") — se interpretó como el estándar mínimo ya usado para cualquier "registrar X" del proyecto: los campos existen, se validan lo razonable (obligatorios, números no negativos) y quedan en un listado. "Documento tributario asociado" se guarda como texto libre (folio/N° de factura), no como archivo adjunto — la historia no pide "subir" nada, y forzarlo a la tabla `documentos` (EPIC 10) habría requerido romper su check de "exactamente una solicitud o un hogar" para un tercer caso no solicitado (mismo criterio ya aplicado a los documentos de un informe social en EPIC 23). **US-24.03:** `movimientos_stock` gana una columna `compra_id` nullable (acotada a `tipo = 'entrada'` por check, igual criterio que `solicitud_id` ya acotada a `salida`) — el formulario de "Registrar entrada" (US-11.02) ahora ofrece, si existen, las compras ya registradas para ese producto; "historial de ingresos por compra" es la nueva ficha `/inventario/compras/[id]`, que lista los movimientos de stock vinculados.
>
> Verificado con `tsc --noEmit`, `next lint` y `next build` (compila limpio; las 7 rutas nuevas bajo `/inventario/proveedores` y `/inventario/compras` quedan listadas). **No se pudo verificar end-to-end contra Supabase local ni en navegador** — Docker no disponible en esta sesión, igual que en el resto de este backlog. Queda pendiente para quien continúe: registrar un proveedor, una compra, y una entrada de stock referenciándola, y confirmar que aparece en el historial de ingresos de esa compra.

---

## 2. Orden recomendado de construcción (actualizado)

### Sprint 0 — Base técnica
US-00.01 · US-00.02 · US-00.03 · US-01.01 · US-01.02 · US-01.03 · US-01.04 · US-01.05

### Sprint 1 — Hogares, personas, ficha social y elegibilidad 🆕
US-03.01 · US-03.02 · US-03.03 · US-03.04 · US-04.01 · US-04.02 · US-04.04 · US-05.01 · **🆕 US-05.04** · **🆕 US-05.05** · **🆕 US-22.01** · **🆕 US-22.03**

### Sprint 2 — Catálogo de ayudas y solicitudes
US-06.01 · US-06.02 · US-07.01 · US-07.03 · US-07.04 · US-07.05 · US-07.06

### Sprint 3 — Evaluación, aprobación, documentos e informes sociales 🆕
US-08.01 · US-08.02 · US-09.01 · US-09.02 · US-09.03 · US-10.01 · US-10.03 · **🆕 US-23.01** · **🆕 US-23.02** · **🆕 US-23.03** · **🆕 US-22.02** · US-18.01 · US-18.02

### Sprint 4 — Inventario, entregas y rutas ⬆️
US-11.01 · US-11.02 · US-11.03 · US-11.04 · US-12.01 · US-12.02 · US-12.03 · US-12.04 · US-12.05 · US-12.06 · **⬆️ US-13.01** · US-20.01 · US-20.02

### Sprint 5 — Reembolsos médicos y diálisis
US-14.01 · US-14.03 · US-14.04 · US-15.01 · US-15.02 · US-15.03 · US-15.04

### Sprint 6 — Auditoría, reportes y pruebas de aceptación
US-16.01 · US-16.02 · US-16.03 · US-17.01 · US-17.03 · US-17.04 · US-17.05 · US-21.01 a US-21.05 · **🆕 US-21.06**

### Sprint 7 — Post-MVP inmediato 🆕
US-13.02 · US-13.03 · US-16.04 · US-17.06 · US-19.01 · US-19.02 · **🆕 US-24.01** · **🆕 US-24.02** · **🆕 US-24.03**

---

## 3. Backlog mínimo imprescindible para liberar MVP (actualizado)

**Seguridad y acceso:** US-01.01 · US-01.02 · US-01.03 · US-01.04 · US-01.05 · US-18.02

**Hogares y personas:** US-03.01 · US-03.02 · US-03.03 · US-03.04 · US-04.01 · US-04.04 · US-05.01

**🆕 Elegibilidad RSH:** US-05.04 · US-05.05

**🆕 Hitos:** US-22.01 · US-22.03

**🆕 Informes sociales:** US-23.01 · US-23.02 · US-23.03

**Solicitudes y evaluación:** US-06.01 · US-06.02 · US-07.01 · US-07.03 · US-07.04 · US-07.05 · US-07.06 · US-08.01 · US-08.02

**Aprobación:** US-09.01 · US-09.02 · US-09.03

**Documentos:** US-10.01 · US-10.03

**⬆️ Inventario:** US-11.01 · US-11.02 · US-11.03 · US-11.04

**Entregas y ruta mínima:** US-12.01 · US-12.02 · US-12.03 · US-12.04 · US-12.06 · **⬆️ US-13.01** · US-20.01 · US-20.02

**Reembolsos:** US-14.01 · US-14.03 · US-14.04

**Diálisis:** US-15.01 · US-15.02 · US-15.03 · US-15.04

**Auditoría:** US-16.01 · US-16.02 · US-16.03

**Pruebas obligatorias:** US-21.01 · US-21.02 · US-21.03 · US-21.04 · US-21.05 · **🆕 US-21.06**

---

## 4. Historias que pueden quedar para después del MVP (actualizado)

US-02.02 · US-03.05 · US-04.03 · US-05.02 · US-05.03 · US-06.03 · US-07.02 · US-08.03 · US-10.02 · US-10.04 · US-12.07 · US-13.02 · US-13.03 · US-15.05 · US-16.04 · US-17.06 · US-18.03 · US-18.04 · US-19.01 · US-19.02 · US-19.03 · **🆕 US-24.01** · **🆕 US-24.02** · **🆕 US-24.03**

> Nota: US-11.01–US-11.04 y US-13.01 salieron de esta lista porque se re-priorizaron a P0 (ver secciones 2 y 3).

---

## 5. Definition of Done del MVP

Sin cambios respecto a la v1: implementado en frontend, conectado a Supabase, datos guardados correctamente, campos obligatorios validados, permisos por rol respetados, RLS aplicado cuando corresponde, errores mostrados claramente, acción crítica auditada si corresponde, funciona en escritorio y en móvil cuando aplica, probado con datos de ejemplo, sin exposición pública de documentos o datos sensibles.

---

## 6. Riesgos principales del backlog (actualizado)

**Riesgo 1 — Exceso de datos sensibles.** Mitigación: formularios dinámicos por tipo de ayuda, documentos clasificados, acceso por rol, minimización de campos.

**Riesgo 2 — Permisos mal definidos.** Mitigación: roles desde el inicio, RLS en Supabase, revisión de permisos por módulo, pruebas con usuarios de cada rol.

**Riesgo 3 — Duplicidad de beneficios.** Mitigación: historial visible por hogar, alertas por ayuda similar reciente, reglas de periodicidad, reportes de ayudas por hogar.

**Riesgo 4 — Regla de diálisis mal aplicada.** Mitigación: cálculo automático por persona y mes, bloqueo de aprobación normal sobre $150.000, auditoría de montos aprobados, reporte mensual de diálisis.

**Riesgo 5 — Evidencias de entrega poco confiables.** Mitigación: evidencia obligatoria según tipo de ayuda, registro de receptor, fecha y hora automática, geolocalización opcional, auditoría de entrega.

**🆕 Riesgo 6 — Regla de elegibilidad RSH 40% eludida o mal aplicada.** Un hogar sobre el tramo podría ser aprobado sin excepción formal, perdiendo la trazabilidad que exige el maestro.
Mitigación: validación automática y bloqueante (US-05.04), excepción obligatoriamente vinculada a informe social (US-05.05, US-23.03), auditoría específica de excepciones, reporte de ayudas aprobadas por excepción (pendiente para iteración de reportería).

**🆕 Riesgo 7 — Información sensible de hitos e informes sociales expuesta a roles indebidos.** Dado que son datos especialmente sensibles (sección 43 del maestro).
Mitigación: RLS específico para hitos e informes (US-22.03), exclusión explícita de terreno/bodega/compras/finanzas de estas vistas, nivel de confidencialidad obligatorio en informes sociales (US-23.01).

**🆕 Riesgo 8 — Compras sin trazabilidad formal en el MVP.** Al no incluir el módulo de compras en el MVP, el ingreso de stock (US-11.02) no queda vinculado a un proveedor u orden de compra, lo que podría complicar auditorías de gasto.
Mitigación: dejar explícito en el DoD del MVP que esta trazabilidad es una limitación conocida, y priorizar EPIC 24 apenas se cierre el Sprint 6.

---

## 7. Resultado esperado del MVP (actualizado)

Al terminar este backlog MVP, el sistema permitirá:
- Registrar hogares y sus integrantes.
- Registrar RSH y antecedentes básicos.
- **🆕 Validar la regla de elegibilidad del 40% RSH y registrar excepciones trazables con informe social asociado.**
- **🆕 Registrar y consultar hitos familiares, sociales y de salud, con acceso restringido.**
- **🆕 Registrar informes sociales estructurados, vinculados a evaluaciones, excepciones y casos especiales de reembolso.**
- Crear solicitudes de ayudas sociales.
- Evaluar y aprobar solicitudes.
- Gestionar cajas de mercadería, pañales, materiales, reembolsos y diálisis **con control real de inventario**.
- Registrar entregas en domicilio con evidencia, **agrupadas por sector**.
- Operar desde teléfono para funcionarios en terreno.
- Validar el tope mensual de $150.000 para diálisis.
- Consultar historial de ayudas, hitos e informes por hogar.
- Controlar documentos privados.
- Restringir acceso según roles.
- Mantener auditoría de acciones críticas, incluyendo excepciones RSH.
- Generar reportes operativos básicos.
- **🆕 Dejar explícitamente fuera del MVP, pero trazado en el backlog, el módulo de compras municipales (EPIC 24).**
