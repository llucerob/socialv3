# Backlog MVP v1 — Sistema de Ayudas Sociales

---

## 1. Criterio de priorización

Para ordenar el desarrollo se usará la siguiente prioridad:

- **P0 — Crítico MVP:** imprescindible para que el sistema funcione.
- **P1 — Importante MVP:** necesario para operación real, pero puede construirse después del flujo base.
- **P2 — Mejora controlada:** deseable para una versión posterior del MVP o primera iteración post-MVP.

---

## EPIC 00 — Preparación técnica del proyecto

**Objetivo:** dejar lista la base técnica para construir el sistema en Next.js + Supabase, con ambientes, autenticación, estructura inicial y seguridad base.

### US-00.01 — Crear proyecto base en Next.js
Como equipo de desarrollo, quiero tener una aplicación base en Next.js, para comenzar el desarrollo del sistema web.
**Prioridad:** P0 · **Dependencias:** ninguna.
**Criterios de aceptación:** proyecto Next.js creado · estructura inicial de carpetas · levanta correctamente en ambiente local · configuración base de variables de entorno · conexión preparada para Supabase.

### US-00.02 — Configurar proyecto Supabase
Como equipo de desarrollo, quiero tener un proyecto Supabase configurado, para usar base de datos, autenticación y almacenamiento privado.
**Prioridad:** P0 · **Dependencias:** US-00.01.
**Criterios de aceptación:** proyecto Supabase creado · base de datos PostgreSQL disponible · Supabase Auth activo · Supabase Storage disponible · variables de entorno configuradas en Next.js · conexión entre frontend y Supabase validada.

### US-00.03 — Definir ambientes
Como administrador técnico, quiero separar ambientes de desarrollo y producción, para evitar afectar datos reales durante pruebas.
**Prioridad:** P1 · **Dependencias:** US-00.01, US-00.02.
**Criterios de aceptación:** existe ambiente de desarrollo · existe ambiente de producción o preparación para producción · variables de entorno separadas · no se mezclan datos de prueba con datos reales.

---

## EPIC 01 — Autenticación, usuarios y roles

**Objetivo:** permitir que solo usuarios autorizados accedan al sistema y que cada perfil vea o modifique únicamente lo que corresponde.

### US-01.01 — Inicio de sesión
Como usuario autorizado, quiero iniciar sesión con mis credenciales, para acceder al sistema.
**Prioridad:** P0 · **Dependencias:** US-00.02.
**Criterios de aceptación:** el usuario puede iniciar sesión · el sistema valida email y contraseña · el usuario no autenticado no puede acceder al sistema · si las credenciales son inválidas, se muestra mensaje de error · el usuario puede cerrar sesión.

### US-01.02 — Crear tabla de perfiles de usuario
Como administrador, quiero que cada usuario tenga un perfil interno, para asignarle rol y permisos.
**Prioridad:** P0 · **Dependencias:** US-01.01.
**Criterios de aceptación:** existe tabla `profiles` o equivalente · cada usuario autenticado se asocia a un perfil · el perfil contiene nombre, email, rol y estado · los usuarios inactivos no pueden operar el sistema.

### US-01.03 — Definir roles del sistema
Como administrador, quiero asignar roles a los usuarios, para controlar sus permisos.
**Prioridad:** P0 · **Dependencias:** US-01.02.

Roles mínimos: administrador · evaluador social · aprobador · bodega/logística · terreno/repartidor · finanzas · auditor/consulta.

**Criterios de aceptación:** el sistema permite asignar un rol a cada usuario · cada rol tiene permisos definidos · las vistas se adaptan según el rol · un usuario sin rol válido no puede operar.

### US-01.04 — Proteger rutas por autenticación
Como sistema, quiero proteger las páginas privadas, para impedir accesos no autorizados.
**Prioridad:** P0 · **Dependencias:** US-01.01, US-01.03.
**Criterios de aceptación:** las rutas privadas requieren sesión activa · el usuario no autenticado es redirigido al login · el usuario autenticado accede al panel principal · las rutas sensibles validan rol.

### US-01.05 — Políticas RLS en Supabase
Como administrador del sistema, quiero aplicar Row Level Security, para proteger los datos desde la base de datos.
**Prioridad:** P0 · **Dependencias:** US-01.03.
**Criterios de aceptación:** RLS está activado en tablas críticas · los usuarios solo acceden a datos permitidos por su rol · los documentos privados no son accesibles públicamente · las operaciones de escritura están restringidas según rol.

---

## EPIC 02 — Panel principal

**Objetivo:** entregar una vista inicial con el estado operativo del sistema.

### US-02.01 — Ver dashboard inicial
Como usuario autenticado, quiero ver un panel principal, para conocer rápidamente el estado de las ayudas sociales.
**Prioridad:** P1 · **Dependencias:** US-01.04.
**Criterios de aceptación:** el usuario ve solicitudes pendientes · el usuario ve solicitudes en evaluación · el usuario ve entregas pendientes · el usuario ve reembolsos pendientes · el usuario ve alertas básicas según su rol.

### US-02.02 — Adaptar dashboard por rol
Como usuario del sistema, quiero ver información relevante a mi función, para trabajar sin ruido operativo.
**Prioridad:** P1 · **Dependencias:** US-02.01.
**Criterios de aceptación:** evaluador ve solicitudes y hogares · aprobador ve solicitudes listas para decisión · bodega ve entregas e inventario · terreno ve entregas asignadas · finanzas ve reembolsos pendientes · auditor ve métricas y consultas.

---

## EPIC 03 — Gestión de grupos familiares

**Objetivo:** registrar y mantener la información base de los hogares beneficiarios.

### US-03.01 — Crear grupo familiar
Como evaluador social, quiero crear un grupo familiar, para registrar a un hogar que solicita ayuda.
**Prioridad:** P0 · **Dependencias:** US-01.03.

Campos mínimos: dirección · sector · teléfono de contacto · tramo RSH · fecha de actualización RSH · observaciones · estado.

**Criterios de aceptación:** se puede crear un hogar · los campos obligatorios son validados · el hogar queda con estado activo · se registra usuario creador y fecha de creación.

### US-03.02 — Buscar grupo familiar
Como usuario autorizado, quiero buscar un grupo familiar, para revisar su información antes de crear una solicitud.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** se puede buscar por dirección · se puede buscar por sector · se puede buscar por nombre o RUT de integrante · el sistema muestra resultados coincidentes · el usuario puede abrir la ficha del hogar.

### US-03.03 — Editar grupo familiar
Como evaluador social, quiero editar los datos de un grupo familiar, para mantener actualizada su información.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** se pueden modificar datos básicos · se registra fecha de actualización · se registra usuario que modifica · los cambios críticos quedan auditados.

### US-03.04 — Ver ficha del grupo familiar
Como usuario autorizado, quiero ver la ficha completa del hogar, para revisar antecedentes antes de evaluar o aprobar ayudas.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** la ficha muestra datos generales del hogar · la ficha muestra integrantes · la ficha muestra tramo RSH · la ficha muestra solicitudes asociadas · la ficha muestra ayudas entregadas · la ficha muestra documentos asociados según permisos.

### US-03.05 — Marcar hogar como inactivo
Como evaluador social, quiero marcar un hogar como inactivo, para evitar nuevas solicitudes sobre registros que ya no correspondan.
**Prioridad:** P1 · **Dependencias:** US-03.01.
**Criterios de aceptación:** el hogar puede pasar a estado inactivo · un hogar inactivo no puede generar nuevas solicitudes sin reactivación · el historial se mantiene visible · la acción queda auditada.

---

## EPIC 04 — Gestión de personas integrantes del hogar

**Objetivo:** registrar integrantes del grupo familiar y asociar ayudas específicas a personas cuando corresponda.

### US-04.01 — Agregar integrante al hogar
Como evaluador social, quiero agregar personas a un grupo familiar, para representar correctamente la composición del hogar.
**Prioridad:** P0 · **Dependencias:** US-03.01.

Campos mínimos: RUT · nombres · apellidos · fecha de nacimiento · parentesco · estado.

**Criterios de aceptación:** se puede agregar una persona al hogar · el RUT debe tener formato válido · la persona queda asociada al hogar · no se permite duplicar el mismo RUT dentro del sistema sin advertencia.

### US-04.02 — Editar integrante
Como evaluador social, quiero editar datos de un integrante, para mantener actualizada la composición familiar.
**Prioridad:** P0 · **Dependencias:** US-04.01.
**Criterios de aceptación:** se pueden modificar datos personales · se registra usuario y fecha de modificación · cambios sensibles quedan auditados.

### US-04.03 — Cambiar estado de integrante
Como evaluador social, quiero cambiar el estado de un integrante, para indicar si sigue perteneciendo al hogar.
**Prioridad:** P1 · **Dependencias:** US-04.01.

Estados sugeridos: activo · ya no pertenece al hogar · fallecido · pendiente de validación.

**Criterios de aceptación:** se puede cambiar el estado · el integrante inactivo no aparece como beneficiario activo por defecto · el historial no se elimina.

### US-04.04 — Asociar ayuda a integrante específico
Como evaluador social, quiero asociar una solicitud a una persona específica cuando corresponda, para gestionar ayudas como pañales o reembolsos médicos.
**Prioridad:** P0 · **Dependencias:** US-04.01.
**Criterios de aceptación:** las ayudas familiares pueden no tener persona beneficiaria específica · las ayudas personales permiten seleccionar integrante · pañales y reembolsos médicos requieren persona beneficiaria · el sistema valida que la persona pertenezca al hogar.

---

## EPIC 05 — Registro Social de Hogares y antecedentes sociales

**Objetivo:** registrar información mínima del RSH y antecedentes necesarios para la evaluación social.

### US-05.01 — Registrar tramo RSH del hogar
Como evaluador social, quiero registrar el tramo del Registro Social de Hogares, para usarlo en la evaluación de ayudas.
**Prioridad:** P0 · **Dependencias:** US-03.01.
**Criterios de aceptación:** se puede registrar tramo RSH · se puede registrar fecha de actualización · se puede marcar RSH como pendiente de actualización · el tramo se muestra en la ficha del hogar.

### US-05.02 — Adjuntar respaldo RSH
Como evaluador social, quiero adjuntar respaldo del RSH, para documentar la información usada en la evaluación.
**Prioridad:** P1 · **Dependencias:** EPIC 10.
**Criterios de aceptación:** se puede subir documento RSH · el documento queda asociado al hogar · el archivo queda privado · solo roles autorizados pueden visualizarlo.

### US-05.03 — Alertar RSH desactualizado
Como evaluador social, quiero que el sistema advierta si el RSH está desactualizado, para solicitar actualización de antecedentes.
**Prioridad:** P2 · **Dependencias:** US-05.01.
**Criterios de aceptación:** el sistema identifica hogares con RSH antiguo · se muestra alerta en la ficha del hogar · la cantidad de meses para considerar desactualizado es configurable.

---

## EPIC 06 — Catálogo de tipos de ayuda

**Objetivo:** permitir configurar las ayudas disponibles sin depender de código duro.

### US-06.01 — Crear catálogo inicial de ayudas
Como administrador, quiero registrar los tipos de ayuda actuales, para que puedan ser usados en solicitudes.
**Prioridad:** P0 · **Dependencias:** US-01.03.

Tipos iniciales: caja de mercadería · pañales de adulto · materiales de construcción · reembolso médico general · reembolso médico por diálisis.

**Criterios de aceptación:** las ayudas quedan registradas en tabla configurable · cada ayuda tiene nombre, descripción, tipo y estado · solo ayudas activas pueden seleccionarse en solicitudes.

### US-06.02 — Configurar reglas por tipo de ayuda
Como administrador, quiero configurar reglas por ayuda, para controlar requisitos, documentos y topes.
**Prioridad:** P0 · **Dependencias:** US-06.01.

Reglas mínimas: requiere aprobación · requiere entrega · requiere evidencia · requiere persona beneficiaria · requiere documentos · tiene tope monetario · periodicidad · estado.

**Criterios de aceptación:** cada ayuda puede tener reglas propias · el sistema usa esas reglas al crear solicitudes · las reglas pueden modificarse solo por administrador · cambios en reglas quedan auditados.

### US-06.03 — Activar o desactivar ayuda
Como administrador, quiero activar o desactivar tipos de ayuda, para controlar qué beneficios están disponibles.
**Prioridad:** P1 · **Dependencias:** US-06.01.
**Criterios de aceptación:** una ayuda activa puede ser seleccionada · una ayuda inactiva no aparece para nuevas solicitudes · las solicitudes históricas mantienen la referencia a la ayuda · el cambio queda auditado.

---

## EPIC 07 — Solicitudes de ayuda

**Objetivo:** crear, revisar y gestionar solicitudes de ayuda social asociadas a hogares y, cuando corresponda, a personas específicas.

### US-07.01 — Crear solicitud de ayuda
Como evaluador social, quiero crear una solicitud de ayuda, para iniciar el proceso de evaluación.
**Prioridad:** P0 · **Dependencias:** EPIC 03, EPIC 04, EPIC 06.

Campos mínimos: hogar · tipo de ayuda · persona beneficiaria, si aplica · fecha de solicitud · motivo · observaciones · documentos requeridos, si aplica.

**Criterios de aceptación:** se puede crear una solicitud asociada a un hogar · el tipo de ayuda debe estar activo · si la ayuda requiere persona, el sistema obliga a seleccionarla · la solicitud queda en estado ingresada o borrador · se registra usuario creador.

### US-07.02 — Guardar solicitud como borrador
Como evaluador social, quiero guardar una solicitud incompleta como borrador, para completarla después.
**Prioridad:** P1 · **Dependencias:** US-07.01.
**Criterios de aceptación:** se puede guardar una solicitud sin todos los documentos · el estado queda como borrador · una solicitud borrador no puede ser aprobada · el evaluador puede continuarla posteriormente.

### US-07.03 — Enviar solicitud a evaluación
Como evaluador social, quiero enviar una solicitud a evaluación, para iniciar el proceso formal.
**Prioridad:** P0 · **Dependencias:** US-07.01.
**Criterios de aceptación:** el sistema valida campos obligatorios · el sistema valida documentos requeridos · la solicitud pasa a estado en evaluación · se registra fecha de envío · se registra usuario responsable.

### US-07.04 — Ver listado de solicitudes
Como usuario autorizado, quiero ver solicitudes filtradas, para gestionar el trabajo pendiente.
**Prioridad:** P0 · **Dependencias:** US-07.01.

Filtros mínimos: estado · tipo de ayuda · fecha · sector · hogar · evaluador.

**Criterios de aceptación:** se muestra listado de solicitudes · se puede filtrar por estado · se puede abrir el detalle de una solicitud · cada rol ve las solicitudes que le corresponden.

### US-07.05 — Ver detalle de solicitud
Como usuario autorizado, quiero ver el detalle de una solicitud, para revisar sus antecedentes y estado.
**Prioridad:** P0 · **Dependencias:** US-07.01.
**Criterios de aceptación:** se muestra hogar asociado · se muestra persona beneficiaria si aplica · se muestra tipo de ayuda · se muestra motivo · se muestran documentos · se muestra historial de estados · se muestran evaluaciones y decisiones.

### US-07.06 — Cambiar estado de solicitud
Como usuario autorizado, quiero cambiar el estado de una solicitud según el flujo, para avanzar el proceso correctamente.
**Prioridad:** P0 · **Dependencias:** US-07.05.

Estados mínimos: borrador · ingresada · en evaluación · observada · aprobada · rechazada · asignada para entrega o pago · entregada o pagada · cerrada · anulada.

**Criterios de aceptación:** solo se permiten transiciones válidas · cada cambio registra usuario, fecha y comentario · los roles no autorizados no pueden cambiar estados críticos · el historial de estados queda visible.

---

## EPIC 08 — Evaluación social

**Objetivo:** permitir que el evaluador revise antecedentes y deje una recomendación fundada.

### US-08.01 — Registrar evaluación social
Como evaluador social, quiero registrar una evaluación de la solicitud, para fundamentar la recomendación de ayuda.
**Prioridad:** P0 · **Dependencias:** US-07.03.
**Criterios de aceptación:** el evaluador puede escribir fundamento · el evaluador puede recomendar aprobar o rechazar · la evaluación queda asociada a la solicitud · se registra fecha y usuario evaluador · la evaluación no puede quedar vacía.

### US-08.02 — Revisar historial de ayudas del hogar durante evaluación
Como evaluador social, quiero revisar ayudas anteriores del hogar, para evitar duplicidades o decisiones desinformadas.
**Prioridad:** P0 · **Dependencias:** US-03.04, US-07.05.
**Criterios de aceptación:** el detalle de solicitud muestra ayudas previas · se visualiza tipo de ayuda, fecha y estado · se muestra si existen ayudas similares recientes · el sistema advierte posibles duplicidades.

### US-08.03 — Observar solicitud
Como evaluador o aprobador, quiero observar una solicitud, para pedir antecedentes adicionales antes de decidir.
**Prioridad:** P1 · **Dependencias:** US-07.06.
**Criterios de aceptación:** se puede cambiar la solicitud a estado observada · es obligatorio ingresar motivo de observación · la solicitud puede volver a evaluación cuando se complete · la observación queda en historial.

---

## EPIC 09 — Aprobación y rechazo

**Objetivo:** permitir decisiones formales sobre solicitudes evaluadas.

### US-09.01 — Aprobar solicitud
Como aprobador, quiero aprobar una solicitud evaluada, para autorizar la entrega o pago de una ayuda.
**Prioridad:** P0 · **Dependencias:** US-08.01.
**Criterios de aceptación:** solo rol aprobador puede aprobar · la solicitud debe estar en evaluación o lista para aprobación · el aprobador puede ingresar comentario · la solicitud pasa a estado aprobada · la decisión queda auditada.

### US-09.02 — Rechazar solicitud
Como aprobador, quiero rechazar una solicitud, para dejar constancia de que no corresponde entregar la ayuda.
**Prioridad:** P0 · **Dependencias:** US-08.01.
**Criterios de aceptación:** solo rol aprobador puede rechazar · el rechazo exige motivo · la solicitud pasa a estado rechazada · la decisión queda auditada · el historial mantiene la evaluación previa.

### US-09.03 — Registrar monto o cantidad aprobada
Como aprobador, quiero registrar monto o cantidad aprobada, para definir exactamente qué ayuda se entregará o pagará.
**Prioridad:** P0 · **Dependencias:** US-09.01.
**Criterios de aceptación:** para ayudas físicas se registra cantidad o detalle · para reembolsos se registra monto aprobado · el monto aprobado no puede superar el monto solicitado · las reglas de tope se validan antes de aprobar.

---

## EPIC 10 — Documentos y archivos privados

**Objetivo:** permitir adjuntar respaldos y evidencias de forma segura.

### US-10.01 — Subir documento a una solicitud
Como evaluador social, quiero subir documentos asociados a una solicitud, para respaldar la evaluación.
**Prioridad:** P0 · **Dependencias:** US-07.01.

Tipos de documentos iniciales: RSH · certificado médico · certificado de diálisis · boleta · comprobante · fotografía · informe social · otro.

**Criterios de aceptación:** se puede subir archivo · el archivo queda asociado a una solicitud · el archivo queda en almacenamiento privado · el sistema registra usuario y fecha de carga · solo roles autorizados pueden visualizarlo.

### US-10.02 — Subir documento a un hogar
Como evaluador social, quiero subir documentos asociados al hogar, para mantener respaldo de antecedentes generales.
**Prioridad:** P1 · **Dependencias:** US-03.01.
**Criterios de aceptación:** el documento queda asociado al hogar · el documento no es público · se puede ver desde la ficha del hogar · el acceso depende del rol.

### US-10.03 — Ver documentos asociados
Como usuario autorizado, quiero ver documentos asociados a hogares o solicitudes, para revisar respaldos.
**Prioridad:** P0 · **Dependencias:** US-10.01.
**Criterios de aceptación:** los documentos se muestran en el detalle correspondiente · el sistema genera acceso seguro al archivo · usuarios sin permiso no pueden abrir documentos · se registra acceso o descarga si se define como acción auditable.

### US-10.04 — Clasificar documentos por finalidad
Como sistema, quiero que cada documento tenga un tipo y finalidad, para cumplir principios de orden y minimización de datos.
**Prioridad:** P1 · **Dependencias:** US-10.01.
**Criterios de aceptación:** todo documento tiene tipo · todo documento tiene entidad asociada · todo documento registra finalidad o uso · no se permiten documentos huérfanos.

---

## EPIC 11 — Ayudas físicas e inventario

**Objetivo:** gestionar ayudas materiales y controlar stock básico.

### US-11.01 — Crear productos de inventario
Como bodega, quiero registrar productos o insumos, para controlar existencias.
**Prioridad:** P1 · **Dependencias:** US-06.01.

Productos iniciales: caja de mercadería · pañales talla M · pañales talla L · pañales talla XL · materiales de construcción.

**Criterios de aceptación:** se puede crear producto · cada producto tiene categoría y unidad de medida · cada producto tiene stock actual · cada producto tiene stock mínimo · solo usuarios autorizados pueden modificar inventario.

### US-11.02 — Registrar entrada de stock
Como bodega, quiero registrar entradas de stock, para actualizar existencias disponibles.
**Prioridad:** P1 · **Dependencias:** US-11.01.
**Criterios de aceptación:** se puede registrar cantidad ingresada · el stock aumenta automáticamente · se registra usuario, fecha y observación · el movimiento queda auditado.

### US-11.03 — Registrar salida de stock por entrega
Como bodega, quiero registrar salidas asociadas a solicitudes aprobadas, para descontar ayudas entregadas.
**Prioridad:** P1 · **Dependencias:** US-11.01, US-09.01.
**Criterios de aceptación:** la salida se asocia a una solicitud aprobada · el stock disminuye automáticamente · no se permite stock negativo · el movimiento queda registrado.

### US-11.04 — Ver stock disponible
Como bodega o administrador, quiero ver stock disponible, para planificar entregas.
**Prioridad:** P1 · **Dependencias:** US-11.01.
**Criterios de aceptación:** se muestra listado de productos · se muestra stock actual · se muestra stock mínimo · se identifican productos con bajo stock.

---

## EPIC 12 — Entregas en domicilio y evidencia

**Objetivo:** gestionar entregas físicas aprobadas, incluyendo responsable, estado y evidencia.

### US-12.01 — Crear entrega desde solicitud aprobada
Como bodega o logística, quiero generar una entrega desde una solicitud aprobada, para coordinar la entrega física de la ayuda.
**Prioridad:** P0 · **Dependencias:** US-09.01.
**Criterios de aceptación:** solo solicitudes aprobadas pueden generar entrega · la entrega queda asociada a la solicitud · la entrega contiene dirección del hogar · la entrega queda en estado pendiente · se puede asignar responsable.

### US-12.02 — Asignar entrega a funcionario en terreno
Como logística, quiero asignar entregas a un repartidor o funcionario, para ordenar el trabajo en terreno.
**Prioridad:** P0 · **Dependencias:** US-12.01.
**Criterios de aceptación:** se puede seleccionar responsable · el responsable ve la entrega en su listado · la entrega mantiene fecha programada · la asignación queda registrada.

### US-12.03 — Ver entregas asignadas desde teléfono
Como funcionario en terreno, quiero ver mis entregas asignadas desde el teléfono, para realizar el trabajo en domicilio.
**Prioridad:** P0 · **Dependencias:** US-12.02.
**Criterios de aceptación:** la vista es responsive · el funcionario ve solo sus entregas · se muestra dirección, beneficiario y ayuda · se muestra estado de cada entrega · no se muestra información sensible innecesaria.

### US-12.04 — Registrar entrega realizada
Como funcionario en terreno, quiero marcar una ayuda como entregada, para cerrar la entrega con respaldo.
**Prioridad:** P0 · **Dependencias:** US-12.03.

Datos mínimos: fecha y hora · nombre de quien recibe · relación con beneficiario · observación · evidencia.

**Criterios de aceptación:** se puede marcar entrega como realizada · es obligatorio registrar receptor · es obligatorio adjuntar evidencia si la ayuda lo requiere · la solicitud asociada cambia a entregada o cerrada según flujo · la acción queda auditada.

### US-12.05 — Registrar entrega fallida
Como funcionario en terreno, quiero registrar una entrega fallida, para dejar constancia de que no fue posible entregar.
**Prioridad:** P1 · **Dependencias:** US-12.03.

Motivos sugeridos: no hay moradores · dirección incorrecta · beneficiario rechaza ayuda · ayuda no disponible · otro.

**Criterios de aceptación:** se puede marcar entrega como fallida · es obligatorio seleccionar motivo · se puede agregar observación · la entrega puede ser reprogramada · la acción queda en historial.

### US-12.06 — Subir evidencia de entrega
Como funcionario en terreno, quiero subir evidencia de entrega, para respaldar que la ayuda fue entregada.
**Prioridad:** P0 · **Dependencias:** US-12.04, EPIC 10.

Evidencias permitidas: fotografía · firma simple · nombre receptor · geolocalización opcional · observación.

**Criterios de aceptación:** se puede subir fotografía · la evidencia queda asociada a la entrega · la evidencia queda privada · solo roles autorizados pueden visualizarla · se registra usuario, fecha y hora.

### US-12.07 — Capturar ubicación de entrega
Como funcionario en terreno, quiero registrar ubicación opcional de entrega, para respaldar que se realizó en domicilio.
**Prioridad:** P2 · **Dependencias:** US-12.04.
**Criterios de aceptación:** el sistema puede solicitar ubicación · la ubicación se guarda solo si el usuario la autoriza · se registra latitud y longitud · el acceso a ubicación queda restringido · la entrega puede completarse sin ubicación si la política institucional lo permite.

---

## EPIC 13 — Rutas de entrega

**Objetivo:** agrupar y ordenar entregas para facilitar el trabajo en terreno.

### US-13.01 — Agrupar entregas por sector
Como logística, quiero agrupar entregas por sector, para organizar rutas básicas.
**Prioridad:** P1 · **Dependencias:** US-12.01.
**Criterios de aceptación:** se pueden filtrar entregas por sector · se pueden seleccionar múltiples entregas · se puede asignar un responsable al grupo · las entregas quedan agrupadas para terreno.

### US-13.02 — Ordenar entregas manualmente
Como logística, quiero ordenar manualmente entregas de una ruta, para definir el recorrido sugerido.
**Prioridad:** P2 · **Dependencias:** US-13.01.
**Criterios de aceptación:** se puede definir orden de entregas · el funcionario en terreno ve el orden sugerido · el orden puede modificarse antes de iniciar la ruta.

### US-13.03 — Abrir dirección en aplicación de mapas
Como funcionario en terreno, quiero abrir la dirección en una aplicación de mapas, para llegar al domicilio.
**Prioridad:** P1 · **Dependencias:** US-12.03.
**Criterios de aceptación:** cada entrega tiene opción de abrir dirección · la acción abre Google Maps u otra app compatible · no se requiere optimización automática de ruta.

---

## EPIC 14 — Reembolsos médicos

**Objetivo:** gestionar solicitudes de reembolso médico, validación documental, aprobación y registro de pago.

### US-14.01 — Crear solicitud de reembolso médico general
Como evaluador social, quiero crear una solicitud de reembolso médico, para gestionar apoyo económico por gastos de salud.
**Prioridad:** P0 · **Dependencias:** EPIC 07, EPIC 10.

Campos mínimos: hogar · persona beneficiaria · monto solicitado · fecha del gasto · motivo · documentos adjuntos.

**Criterios de aceptación:** la solicitud exige persona beneficiaria · la solicitud exige monto solicitado · la solicitud exige documento de respaldo · el monto solicitado debe ser mayor a cero · la solicitud queda lista para evaluación.

### US-14.02 — Validar documentos de reembolso
Como finanzas o evaluador autorizado, quiero validar documentos de reembolso, para confirmar que respaldan el gasto.
**Prioridad:** P1 · **Dependencias:** US-14.01.
**Criterios de aceptación:** se puede marcar documento como válido · se puede marcar documento como observado · se puede ingresar comentario · la validación queda registrada.

### US-14.03 — Aprobar monto de reembolso
Como aprobador, quiero aprobar un monto de reembolso, para definir cuánto se pagará al beneficiario.
**Prioridad:** P0 · **Dependencias:** US-14.01, US-09.03.
**Criterios de aceptación:** se puede registrar monto aprobado · el monto aprobado no puede superar el monto solicitado · el monto aprobado debe ser mayor o igual a cero · la aprobación queda auditada.

### US-14.04 — Registrar pago de reembolso
Como finanzas, quiero registrar el pago de un reembolso aprobado, para cerrar administrativamente la ayuda económica.
**Prioridad:** P0 · **Dependencias:** US-14.03.

Campos mínimos: fecha de pago · monto pagado · medio de pago · observación.

**Criterios de aceptación:** solo finanzas o administrador puede registrar pago · el monto pagado no puede superar el monto aprobado · la solicitud pasa a pagada o cerrada · la acción queda auditada.

---

## EPIC 15 — Reembolso especial por diálisis

**Objetivo:** implementar la regla excepcional de reembolso médico para personas en diálisis con tope mensual de $150.000.

### US-15.01 — Crear solicitud de reembolso por diálisis
Como evaluador social, quiero crear una solicitud específica de reembolso por diálisis, para aplicar las reglas especiales de este caso.
**Prioridad:** P0 · **Dependencias:** US-14.01.
**Criterios de aceptación:** se puede seleccionar tipo de ayuda "Reembolso médico por diálisis" · la solicitud exige persona beneficiaria · la solicitud exige monto solicitado · la solicitud exige certificado de diálisis · la solicitud exige documentos del gasto.

### US-15.02 — Adjuntar certificado de diálisis
Como evaluador social, quiero adjuntar certificado que acredite diálisis, para validar que corresponde el beneficio especial.
**Prioridad:** P0 · **Dependencias:** US-15.01, EPIC 10.
**Criterios de aceptación:** la solicitud no puede enviarse a evaluación sin certificado · el certificado queda clasificado como certificado de diálisis · el archivo queda privado · solo usuarios autorizados pueden visualizarlo.

### US-15.03 — Calcular acumulado mensual de diálisis
Como sistema, quiero calcular el monto acumulado mensual de reembolsos por diálisis de una persona, para validar el tope de $150.000.
**Prioridad:** P0 · **Dependencias:** US-15.01, US-14.04.
**Criterios de aceptación:** el cálculo se realiza por persona beneficiaria · el cálculo considera mes calendario · el cálculo considera reembolsos aprobados o pagados, según regla definida · el sistema muestra acumulado actual · el sistema muestra saldo disponible del mes.

### US-15.04 — Bloquear aprobación si supera tope mensual
Como sistema, quiero impedir aprobación normal cuando el reembolso por diálisis supera $150.000 mensual, para cumplir la regla del beneficio.
**Prioridad:** P0 · **Dependencias:** US-15.03.
**Criterios de aceptación:** el sistema valida acumulado antes de aprobar · si el monto supera $150.000 mensual, se muestra alerta · no se permite aprobación normal por sobre el tope · el sistema informa monto disponible restante · la validación queda registrada.

### US-15.05 — Autorizar excepción al tope de diálisis
Como administrador o aprobador especial, quiero autorizar excepcionalmente un monto superior al tope, para manejar casos institucionalmente justificados.
**Prioridad:** P2 · **Dependencias:** US-15.04.
**Criterios de aceptación:** solo rol autorizado puede aprobar excepción · se exige motivo escrito · se registra usuario, fecha y fundamento · la excepción aparece en auditoría y reportes.

---

## EPIC 16 — Auditoría y trazabilidad

**Objetivo:** registrar acciones críticas para control interno, transparencia y protección de datos.

### US-16.01 — Registrar creación de entidades críticas
Como sistema, quiero registrar quién crea hogares, personas, solicitudes y documentos, para mantener trazabilidad.
**Prioridad:** P0 · **Dependencias:** EPIC 03, EPIC 04, EPIC 07, EPIC 10.
**Criterios de aceptación:** se registra usuario creador · se registra fecha de creación · se registra entidad creada · la información queda disponible para auditoría.

### US-16.02 — Auditar cambios de estado de solicitudes
Como sistema, quiero registrar cada cambio de estado de una solicitud, para reconstruir el flujo completo del caso.
**Prioridad:** P0 · **Dependencias:** US-07.06.
**Criterios de aceptación:** cada cambio de estado queda registrado · se guarda estado anterior y nuevo · se guarda usuario responsable · se guarda fecha y hora · se guarda comentario si corresponde.

### US-16.03 — Auditar aprobación, rechazo y cambios de monto
Como sistema, quiero auditar decisiones críticas, para controlar aprobaciones y pagos.
**Prioridad:** P0 · **Dependencias:** EPIC 09, EPIC 14, EPIC 15.
**Criterios de aceptación:** aprobaciones quedan auditadas · rechazos quedan auditados · cambios de monto quedan auditados · excepciones quedan auditadas · la auditoría no puede ser modificada por usuarios comunes.

### US-16.04 — Consultar auditoría
Como auditor o administrador, quiero consultar registros de auditoría, para revisar acciones críticas del sistema.
**Prioridad:** P1 · **Dependencias:** US-16.01, US-16.02, US-16.03.
**Criterios de aceptación:** se puede filtrar auditoría por fecha · se puede filtrar por usuario · se puede filtrar por entidad · se puede filtrar por acción · solo roles autorizados pueden ver auditoría.

---

## EPIC 17 — Reportes operativos

**Objetivo:** entregar información básica para gestión, seguimiento y control institucional.

### US-17.01 — Reporte de ayudas entregadas
Como administrador o auditor, quiero ver ayudas entregadas por período, para medir la operación del programa.
**Prioridad:** P1 · **Dependencias:** EPIC 07, EPIC 12, EPIC 14.
**Criterios de aceptación:** se puede filtrar por fecha · se puede filtrar por tipo de ayuda · se puede filtrar por sector · se muestra cantidad de ayudas · se muestra listado exportable.

### US-17.02 — Reporte de hogares beneficiados
Como administrador o auditor, quiero ver hogares beneficiados, para conocer cobertura del sistema.
**Prioridad:** P1 · **Dependencias:** EPIC 03, EPIC 07.
**Criterios de aceptación:** se muestra cantidad de hogares beneficiados · se puede filtrar por período · se puede filtrar por sector · se puede ver detalle de ayudas por hogar.

### US-17.03 — Reporte de reembolsos médicos
Como finanzas o administrador, quiero ver reembolsos médicos aprobados y pagados, para controlar gastos.
**Prioridad:** P1 · **Dependencias:** EPIC 14.
**Criterios de aceptación:** se muestra monto solicitado · se muestra monto aprobado · se muestra monto pagado · se puede filtrar por período · se puede filtrar por tipo de reembolso.

### US-17.04 — Reporte de diálisis
Como finanzas o auditor, quiero ver reembolsos por diálisis y acumulados mensuales, para controlar el tope de $150.000.
**Prioridad:** P1 · **Dependencias:** EPIC 15.
**Criterios de aceptación:** se muestra beneficiario · se muestra mes · se muestra monto acumulado · se muestra saldo disponible · se muestran excepciones si existen.

### US-17.05 — Reporte de entregas pendientes y fallidas
Como logística, quiero ver entregas pendientes y fallidas, para gestionar reprogramaciones.
**Prioridad:** P1 · **Dependencias:** EPIC 12.
**Criterios de aceptación:** se listan entregas pendientes · se listan entregas fallidas · se puede filtrar por responsable · se puede filtrar por sector · se puede ver motivo de falla.

### US-17.06 — Exportar reportes a CSV o Excel
Como usuario autorizado, quiero exportar reportes, para trabajar información fuera del sistema cuando sea necesario.
**Prioridad:** P2 · **Dependencias:** US-17.01.
**Criterios de aceptación:** se puede exportar CSV · la exportación respeta filtros aplicados · la exportación respeta permisos del usuario · no se exportan documentos privados.

---

## EPIC 18 — Protección de datos y seguridad funcional

**Objetivo:** incorporar medidas mínimas de protección de datos desde el MVP.

### US-18.01 — Minimizar datos solicitados
Como sistema, quiero pedir solo datos necesarios para cada ayuda, para reducir exposición de información personal.
**Prioridad:** P0 · **Dependencias:** EPIC 06, EPIC 07.
**Criterios de aceptación:** las ayudas familiares no exigen datos médicos · las ayudas médicas solo solicitan documentos requeridos · la persona beneficiaria solo es obligatoria cuando aplica · el formulario se adapta según tipo de ayuda.

### US-18.02 — Restringir acceso a documentos sensibles
Como administrador, quiero limitar quién puede ver documentos médicos y sociales, para proteger información sensible.
**Prioridad:** P0 · **Dependencias:** EPIC 10, US-01.05.
**Criterios de aceptación:** repartidores no ven documentos médicos · bodega no ve certificados médicos salvo autorización · finanzas ve documentos necesarios para reembolsos · evaluadores y aprobadores ven documentos de evaluación · auditor ve documentos solo si su rol lo permite.

### US-18.03 — Registrar finalidad del tratamiento documental
Como sistema, quiero asociar cada documento a una finalidad, para justificar su almacenamiento.
**Prioridad:** P1 · **Dependencias:** US-10.04.
**Criterios de aceptación:** cada documento tiene finalidad · la finalidad se selecciona desde catálogo · no se permite subir documentos sin clasificación · la finalidad queda visible para usuarios autorizados.

### US-18.04 — Política de retención básica
Como administrador, quiero definir estado de conservación de documentos, para preparar gestión futura de eliminación o bloqueo.
**Prioridad:** P2 · **Dependencias:** EPIC 10.

Estados sugeridos: vigente · vencido · reemplazado · bloqueado · eliminable.

**Criterios de aceptación:** cada documento puede tener estado · se puede marcar documento como reemplazado · no se elimina físicamente sin rol autorizado · la acción queda auditada.

---

## EPIC 19 — Administración del sistema

**Objetivo:** permitir configuración básica del sistema sin intervención técnica permanente.

### US-19.01 — Administrar usuarios
Como administrador, quiero ver y editar usuarios del sistema, para mantener control de accesos.
**Prioridad:** P1 · **Dependencias:** EPIC 01.
**Criterios de aceptación:** se listan usuarios · se puede cambiar rol · se puede activar o desactivar usuario · los cambios quedan auditados.

### US-19.02 — Administrar sectores
Como administrador, quiero configurar sectores territoriales, para clasificar hogares y organizar entregas.
**Prioridad:** P1 · **Dependencias:** EPIC 03.
**Criterios de aceptación:** se pueden crear sectores · se pueden editar sectores · se pueden desactivar sectores · los hogares pueden asociarse a un sector.

### US-19.03 — Administrar motivos de entrega fallida
Como administrador, quiero configurar motivos de entrega fallida, para estandarizar el registro en terreno.
**Prioridad:** P2 · **Dependencias:** US-12.05.
**Criterios de aceptación:** se pueden crear motivos · se pueden activar o desactivar motivos · la vista de terreno usa estos motivos · los motivos históricos se conservan.

---

## EPIC 20 — Experiencia móvil para terreno

**Objetivo:** asegurar que el personal en terreno pueda operar desde teléfono sin una app nativa inicial.

### US-20.01 — Vista móvil de entregas
Como funcionario en terreno, quiero una vista optimizada para teléfono, para registrar entregas fácilmente.
**Prioridad:** P0 · **Dependencias:** EPIC 12.
**Criterios de aceptación:** la interfaz funciona correctamente en teléfono · los botones son fáciles de usar · el formulario de entrega es simple · se puede subir foto desde cámara o galería · se puede operar sin acceder a módulos administrativos.

### US-20.02 — Reducir información visible en terreno
Como administrador, quiero que terreno vea solo lo necesario, para proteger datos personales del hogar.
**Prioridad:** P0 · **Dependencias:** US-20.01, US-18.02.
**Criterios de aceptación:** terreno ve dirección y ayuda a entregar · terreno ve nombre de contacto si corresponde · terreno no ve evaluación social · terreno no ve documentos médicos · terreno no ve historial completo del hogar.

---

## EPIC 21 — Pruebas y validación del MVP

**Objetivo:** validar que el MVP funcione correctamente antes de usar datos reales.

### US-21.01 — Probar flujo completo de caja de mercadería
Como equipo del proyecto, quiero probar el flujo completo de caja de mercadería, para validar solicitud, aprobación y entrega.
**Prioridad:** P0 · **Dependencias:** EPIC 03, EPIC 07, EPIC 09, EPIC 12.
**Criterios de aceptación:** se crea hogar · se crea solicitud · se evalúa · se aprueba · se genera entrega · se registra evidencia · la solicitud queda cerrada.

### US-21.02 — Probar flujo completo de pañales
Como equipo del proyecto, quiero probar el flujo completo de pañales, para validar ayuda asociada a persona beneficiaria.
**Prioridad:** P0 · **Dependencias:** EPIC 04, EPIC 07, EPIC 11, EPIC 12.
**Criterios de aceptación:** se selecciona persona beneficiaria · se registra talla y cantidad · se aprueba solicitud · se descuenta stock · se registra entrega · se cierra solicitud.

### US-21.03 — Probar flujo completo de materiales de construcción
Como equipo del proyecto, quiero probar el flujo de materiales, para validar evaluación, aprobación y entrega parcial o total.
**Prioridad:** P1 · **Dependencias:** EPIC 07, EPIC 09, EPIC 11, EPIC 12.
**Criterios de aceptación:** se crea solicitud · se adjuntan antecedentes · se aprueba detalle de materiales · se registra entrega · se adjunta evidencia · el historial queda visible.

### US-21.04 — Probar flujo completo de reembolso médico general
Como equipo del proyecto, quiero probar el flujo de reembolso médico, para validar documentos, aprobación y pago.
**Prioridad:** P0 · **Dependencias:** EPIC 14.
**Criterios de aceptación:** se crea solicitud · se adjuntan documentos · se registra monto solicitado · se aprueba monto · se registra pago · la solicitud queda cerrada.

### US-21.05 — Probar flujo completo de reembolso por diálisis
Como equipo del proyecto, quiero probar el flujo de diálisis, para validar certificado obligatorio y tope mensual de $150.000.
**Prioridad:** P0 · **Dependencias:** EPIC 15.
**Criterios de aceptación:** la solicitud exige certificado de diálisis · el sistema calcula acumulado mensual · el sistema muestra saldo disponible · el sistema bloquea aprobación sobre $150.000 · el sistema permite pago dentro del tope · el reporte de diálisis refleja el movimiento.

---

## 2. Orden recomendado de construcción

**Sprint 0 — Base técnica**
US-00.01 Crear proyecto base en Next.js · US-00.02 Configurar Supabase · US-00.03 Definir ambientes · US-01.01 Inicio de sesión · US-01.02 Crear tabla de perfiles · US-01.03 Definir roles · US-01.04 Proteger rutas · US-01.05 Políticas RLS.

**Sprint 1 — Hogares, personas y ficha social**
US-03.01 Crear grupo familiar · US-03.02 Buscar grupo familiar · US-03.03 Editar grupo familiar · US-03.04 Ver ficha del grupo familiar · US-04.01 Agregar integrante · US-04.02 Editar integrante · US-04.04 Asociar ayuda a integrante específico · US-05.01 Registrar tramo RSH.

**Sprint 2 — Catálogo de ayudas y solicitudes**
US-06.01 Crear catálogo inicial de ayudas · US-06.02 Configurar reglas por tipo de ayuda · US-07.01 Crear solicitud de ayuda · US-07.03 Enviar solicitud a evaluación · US-07.04 Ver listado de solicitudes · US-07.05 Ver detalle de solicitud · US-07.06 Cambiar estado de solicitud.

**Sprint 3 — Evaluación, aprobación y documentos**
US-08.01 Registrar evaluación social · US-08.02 Revisar historial de ayudas · US-09.01 Aprobar solicitud · US-09.02 Rechazar solicitud · US-09.03 Registrar monto o cantidad aprobada · US-10.01 Subir documento a una solicitud · US-10.03 Ver documentos asociados · US-18.01 Minimizar datos solicitados · US-18.02 Restringir acceso a documentos sensibles.

**Sprint 4 — Entregas y vista móvil**
US-12.01 Crear entrega desde solicitud aprobada · US-12.02 Asignar entrega a funcionario en terreno · US-12.03 Ver entregas asignadas desde teléfono · US-12.04 Registrar entrega realizada · US-12.05 Registrar entrega fallida · US-12.06 Subir evidencia de entrega · US-20.01 Vista móvil de entregas · US-20.02 Reducir información visible en terreno.

**Sprint 5 — Reembolsos médicos y diálisis**
US-14.01 Crear solicitud de reembolso médico general · US-14.03 Aprobar monto de reembolso · US-14.04 Registrar pago de reembolso · US-15.01 Crear solicitud de reembolso por diálisis · US-15.02 Adjuntar certificado de diálisis · US-15.03 Calcular acumulado mensual de diálisis · US-15.04 Bloquear aprobación si supera tope mensual.

**Sprint 6 — Inventario, reportes y auditoría**
US-11.01 Crear productos de inventario · US-11.02 Registrar entrada de stock · US-11.03 Registrar salida de stock por entrega · US-11.04 Ver stock disponible · US-16.01 Registrar creación de entidades críticas · US-16.02 Auditar cambios de estado · US-16.03 Auditar aprobación, rechazo y cambios de monto · US-17.01 Reporte de ayudas entregadas · US-17.03 Reporte de reembolsos médicos · US-17.04 Reporte de diálisis · US-17.05 Reporte de entregas pendientes y fallidas.

---

## 3. Backlog mínimo imprescindible para liberar MVP

El MVP no debería liberarse sin estas historias:

**Seguridad y acceso:** US-01.01, US-01.02, US-01.03, US-01.04, US-01.05, US-18.02.

**Hogares y personas:** US-03.01, US-03.02, US-03.03, US-03.04, US-04.01, US-04.04, US-05.01.

**Solicitudes y evaluación:** US-06.01, US-06.02, US-07.01, US-07.03, US-07.04, US-07.05, US-07.06, US-08.01, US-08.02.

**Aprobación:** US-09.01, US-09.02, US-09.03.

**Documentos:** US-10.01, US-10.03.

**Entregas:** US-12.01, US-12.02, US-12.03, US-12.04, US-12.06, US-20.01, US-20.02.

**Reembolsos:** US-14.01, US-14.03, US-14.04.

**Diálisis:** US-15.01, US-15.02, US-15.03, US-15.04.

**Auditoría:** US-16.01, US-16.02, US-16.03.

---

## 4. Historias que pueden quedar para después del MVP

Estas historias son útiles, pero no bloquean la primera operación:

US-02.02 Adaptar dashboard por rol · US-03.05 Marcar hogar como inactivo · US-04.03 Cambiar estado de integrante · US-05.02 Adjuntar respaldo RSH · US-05.03 Alertar RSH desactualizado · US-06.03 Activar o desactivar ayuda · US-07.02 Guardar solicitud como borrador · US-08.03 Observar solicitud · US-10.02 Subir documento a un hogar · US-10.04 Clasificar documentos por finalidad · US-11.01 Crear productos de inventario · US-11.02 Registrar entrada de stock · US-11.03 Registrar salida de stock por entrega · US-11.04 Ver stock disponible · US-12.07 Capturar ubicación de entrega · US-13.01 Agrupar entregas por sector · US-13.02 Ordenar entregas manualmente · US-13.03 Abrir dirección en aplicación de mapas · US-15.05 Autorizar excepción al tope de diálisis · US-16.04 Consultar auditoría · US-17.06 Exportar reportes · US-18.04 Política de retención básica · US-19.01 Administrar usuarios · US-19.02 Administrar sectores · US-19.03 Administrar motivos de entrega fallida.

---

## 5. Definition of Done del MVP

Una historia se considera terminada cuando cumple lo siguiente:

1. La funcionalidad está implementada en frontend.
2. La funcionalidad está conectada a Supabase.
3. Los datos se guardan correctamente.
4. Se validan campos obligatorios.
5. Se respetan permisos por rol.
6. Se aplica RLS cuando corresponde.
7. Los errores se muestran de forma clara.
8. La acción crítica queda auditada si corresponde.
9. La interfaz funciona en escritorio.
10. La interfaz funciona en móvil cuando aplica.
11. La funcionalidad fue probada con datos de ejemplo.
12. No expone documentos ni datos sensibles públicamente.

---

## 6. Riesgos principales del backlog

### Riesgo 1 — Exceso de datos sensibles
El sistema puede terminar almacenando más información de la necesaria.
**Mitigación:** formularios dinámicos por tipo de ayuda · documentos clasificados · acceso por rol · minimización de campos.

### Riesgo 2 — Permisos mal definidos
Usuarios podrían acceder a información que no necesitan.
**Mitigación:** roles desde el inicio · RLS en Supabase · revisión de permisos por módulo · pruebas con usuarios de cada rol.

### Riesgo 3 — Duplicidad de beneficios
Un hogar podría recibir ayudas repetidas sin control.
**Mitigación:** historial visible por hogar · alertas por ayuda similar reciente · reglas de periodicidad · reportes de ayudas por hogar.

### Riesgo 4 — Regla de diálisis mal aplicada
El sistema podría aprobar montos superiores al tope mensual.
**Mitigación:** cálculo automático por persona y mes · bloqueo de aprobación normal sobre $150.000 · auditoría de montos aprobados · reporte mensual de diálisis.

### Riesgo 5 — Evidencias de entrega poco confiables
Las entregas podrían cerrarse sin respaldo suficiente.
**Mitigación:** evidencia obligatoria según tipo de ayuda · registro de receptor · fecha y hora automática · geolocalización opcional · auditoría de entrega.

---

## 7. Resultado esperado del MVP

Al terminar este backlog MVP, el sistema permitirá:

- Registrar hogares y sus integrantes.
- Registrar RSH y antecedentes básicos.
- Crear solicitudes de ayudas sociales.
- Evaluar y aprobar solicitudes.
- Gestionar cajas de mercadería, pañales, materiales, reembolsos y diálisis.
- Registrar entregas en domicilio con evidencia.
- Operar desde teléfono para funcionarios en terreno.
- Validar el tope mensual de $150.000 para diálisis.
- Consultar historial de ayudas por hogar.
- Controlar documentos privados.
- Restringir acceso según roles.
- Mantener auditoría de acciones críticas.
- Generar reportes operativos básicos.
