# Reporte de Migración — Sistema Antiguo `fondosco_social` → Supabase

**Fecha de análisis:** 06-08-2026  
**Origen:** volcado phpMyAdmin (MariaDB 10.6)

## 1. Resumen de tablas migradas

| Tabla origen | Filas | Tabla destino sugerida (Supabase) |
|---|---|---|
| `beneficiarios` | 1889 | `beneficiarios (grupo_familiar como unidad)` |
| `registrosociales` | 1678 | `registro_social_hogares` |
| `entregados` | 31147 | `entregas` |
| `solicitudes` | 54 | `solicitudes_pendientes` |
| `reembolsos` | 1299 | `reembolsos` |
| `cuentasbancarias` | 486 | `cuentas_bancarias` |
| `situaciones` | 4649 | `situaciones / hitos_sensibles` |
| `sectores` | 18 | `sectores` |
| `categorias` | 3 | `categorias` |
| `materiales` | 10 | `materiales` |
| `medidas` | 10 | `medidas` |
| `users` | 16 | `usuarios (auth.users + perfil)` |
| `role_user` | 16 | `usuario_roles` |
| `roles` | 3 | `roles` |

## 2. Inconsistencias detectadas y corregidas

### 2.1 RUT inválidos (dígito verificador o formato) — 11 casos

Se recalculó el DV con módulo 11. Los marcados `DV→X` fueron **corregidos automáticamente**; los de `formato` requieren **revisión manual** (columna `rut_flag` en el CSV).

| id_legacy | RUT origen | Nombre | Corrección |
|---|---|---|---|
| 470 | `11166440-6` | MARCELA DEL TRÁNSITO CORREA MORALES | DV→4 |
| 1105 | `189519575` | FERNANDA DEL CARMEN GONZALEZ PADILLA | formato |
| 1295 | `20433668-1` | FLAVIA OSCARINA PINTO GARAY | DV→7 |
| 1600 | `918775-4` | LUIS FERNANDO PALACIOS AGUILERA | DV→8 |
| 1785 | `119945208` | ADRIANA DEL TRANSITO SÁNCHEZ CARRASCO | formato |
| 1826 | `119947146` | JUAN CARLOS QUEZADA MARTINEZ | formato |
| 1865 | `9554813K` | ELEONOR LASTENIA BAEZA SOLIS | formato |
| 1903 | `86969637` | PEDRO NOLASCO YAÑEZ DIAZ | formato |
| 1907 | `10216932-9` | ROSA ELBA ALIAGA ACEVEDO | DV→8 |
| 1909 | `87822246-K` | BRUNO HUMBERTO MONARDES JERIA | DV→6 |
| 1911 | `4434484-5` | PROSPERINA ORTEGA SALDAÑA | DV→K |

### 2.2 RUT duplicados (mismo RUT, dos registros) — 6 casos

Se conservó el registro **con historial de entregas/reembolsos** y se fusionó el duplicado vacío (sus entregas/cuentas se reapuntan al registro conservado). Duplicados descartados: `1710, 1145, 1711, 1222, 1866, 1861`.

| RUT | id conservado | id descartado |
|---|---|---|
| 15114048-3 | 370 | 1866 |
| 11554467-5 | 755 | 1145 |
| 7179358-3 | 918 | 1222 |
| 17907123-1 | 1119 | 1711 |
| 16563051-3 | 1405 | 1861 |
| 20029733-4 | 1572 | 1710 |

### 2.3 Fecha de nacimiento inválida o vacía — 12 casos

Formatos `DD/MM/AAAA` se normalizaron a `AAAA-MM-DD`. Las no recuperables (ej. `15-0-1984`) quedan `NULL` con flag `inválida/vacía`. IDs afectados: 1067, 1184, 1186, 1346, 1526, 1651, 1708, 1805, 1808, 1821, 1880, 1912


### 2.4 Sector `FALTA ASIGNAR` — 52 casos

Se dejó `sector` vacío y bandera `sector_falta_asignar = true` para resolución manual antes del cierre de migración. IDs: 29, 33, 46, 59, 60, 78, 127, 164, 195, 203, 206, 212, 222, 235, 248, 254, 300, 309, 317, 327, 328, 329, 332, 334, 412, 415, 417, 436, 456, 498, 505, 541, 558, 581, 636, 654, 669, 677, 696, 725, 744, 746, 770, 781, 796, 797, 822, 968, 977, 1019, 1044, 1064


### 2.5 Teléfonos sin dígitos (`-`) — 90 casos

Normalizados a `NULL`.


### 2.6 Entregas a beneficiarios fallecidos

De 31.147 entregas, 1.394 corresponden a beneficiarios hoy marcados como fallecidos (78 personas). Se verificó contra el `historial`: **0 entregas ocurren después de la fecha de fallecimiento** — todas son históricas y válidas. No se eliminan; se conserva `estado_vital` en el nuevo registro.


### 2.7 Integridad referencial — sin huérfanos

Verificado: 0 entregas, reembolsos, cuentas o situaciones apuntan a un `beneficiario_id` o `material_id` inexistente. `registrosociales_id` colgados: 0.


## 3. Decisiones de modelado para el sistema nuevo

- **`registrosociales_id`** pasa a FK hacia `registro_social_hogares`; el `porcentaje` = tramo RSH. Los tramos exigen tratamiento visual de excepción según la regla del proyecto.

- **`grupofamiliar`** (entero) se conserva como tamaño del grupo; la lógica de gestión se centra en el hogar, no el individuo.

- **`entregado`** (enum `0-4`) mapeado a estados legibles: 0=pendiente, 1=aprobado, 2=en_proceso, 3=entregado, 4=rechazado.

- **`domicilio`** (`entregas`) → `a_domicilio` boolean, insumo directo para la PWA offline de reparto.

- **`boleta`** en reembolsos guarda múltiples folios separados por `-//-`; se recomienda normalizar a tabla hija `boletas` en una segunda fase (la tabla `boletas` origen venía vacía).
