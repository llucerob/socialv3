# Guía de migración — `fondosco_social` → Supabase (sistema nuevo)

Municipalidad de Coinco · Departamento Social

Esta migración **transforma** los datos del sistema antiguo al esquema nuevo (no es una copia 1:1). Una fila de `beneficiarios` del sistema viejo se reparte en `grupos_familiares` + `personas`; los reembolsos y entregas se reconstruyen como la cadena `solicitudes → decisiones_solicitud → entregas` que exige el modelo nuevo.

## Orden de ejecución

### Paso 0 — Migración de esquema (una sola vez)
Agrega la columna `origen` a `solicitudes`, necesaria para distinguir datos migrados de los operativos.

Colócalo como una migración más de tu proyecto:
```
supabase/migrations/20260810000001_add_origen_solicitudes.sql
```
Contenido: `00_migracion_esquema_origen.sql`. Aplícalo con `supabase db push` (o pégalo en el SQL Editor).

### Paso 1 — Requisitos previos
- Todas las migraciones de esquema aplicadas.
- Al menos **un usuario `administrador` activo** en `public.profiles` (la migración lo usa como `creado_por` de todos los registros históricos). El script falla con un mensaje claro si no existe.
- Catálogo `tipos_ayuda` sembrado (ya viene en tus migraciones de EPIC 06).

### Paso 2 — Cargar los datos

**Opción A (recomendada) — CLI, todo de una vez:**
```bash
psql "$DATABASE_URL" -f 01_migracion_datos.sql
```
Corre dentro de una transacción única. Al final imprime un `NOTICE` con los conteos. Si algo no cuadra, cambia el `commit;` final por `rollback;` y no queda nada a medias. El `$DATABASE_URL` es la cadena de conexión de tu proyecto (Supabase → Project Settings → Database → Connection string, modo *session*).

**Opción B — SQL Editor de Supabase, por lotes:**
El archivo completo (~18 MB) puede exceder el límite del editor web. Usa la carpeta `lotes/` **en este orden estricto** (respeta las FK):

1. `lote_1_grupos_familiares.sql`
2. `lote_2_personas.sql`
3. `lote_3_reembolsos.sql`
4. `lote_4_entregas_1.sql` → `lote_4_entregas_2.sql` → `lote_4_entregas_3.sql` → `lote_4_entregas_4.sql`
5. `lote_5_hitos.sql`
6. `lote_6_limpieza.sql` — **solo al final**, cuando ya verificaste todo. Borra las tablas de mapeo `_map_*`.

Los lotes usan tablas de mapeo persistentes (`_map_hogar`, `_map_persona`) en vez de temporales, para que los IDs se compartan entre ejecuciones separadas. Por eso la limpieza va al final.

### Paso 3 — Verificar
```sql
select count(*) from grupos_familiares;                          -- 1667
select count(*) from personas;                                   -- 1883
select count(*) from personas where estado='fallecido';          -- 78
select count(*) from solicitudes where origen='migracion';       -- 13399 (1299 reemb + 12100 entregas)
select count(*) from entregas;                                   -- 12100
select count(*) from hitos;                                      -- 4649

-- que ninguna solicitud migrada aparezca como pendiente en el dashboard:
select estado, count(*) from solicitudes where origen='migracion' group by estado;
```

## Qué se decidió y por qué

| Tema | Decisión |
|---|---|
| **Agrupación de hogares** | Por RSH compartido (`registrosociales_id`). 1667 hogares, 203 con >1 integrante. El de mayor actividad queda como `jefe_hogar`, el resto como `integrante` (revisar parentesco después). |
| **Entregas** | Solo ≥2025 (12.100 de 31.147). Cada una = solicitud `cerrada` + decisión `aprobada` + entrega `realizada`, marcadas `origen='migracion'` para no ensuciar KPIs. |
| **Reembolsos** | Los 1.299, como solicitudes de "Reembolso médico general". Estado `3`=entregado → `cerrada`+decisión con `monto_aprobado`. |
| **Situaciones** | 4.649 → `hitos`. Tipo `profesional` del sistema viejo se mapea a `social` (el enum nuevo solo tiene familiar/social/salud). |
| **RUT** | DV recalculado (módulo 11); 6 duplicados fusionados conservando el de más actividad. |
| **Fechas de nacimiento** | 11 normalizadas de formato `/`; id 1346 corregida a 1984-04-15 (confirmada). |

## Pendientes que NO cubre esta migración (requieren decisión tuya)

- **Parentesco real** de los 216 integrantes no-titulares (quedaron como `integrante` genérico).
- **Entregas < 2025** (19.047 registros) no migradas. Si las necesitas, se genera un lote adicional.
- **Sectores `SIN ASIGNAR`** (los 52 "FALTA ASIGNAR" del origen): quedan con ese texto, pendientes de asignar al sector real.
- **Reembolsos de diálisis**: el sistema viejo no distingue diálisis; todos entraron como "Reembolso médico general". Si en el origen hay forma de identificarlos, se puede reclasificar.
- **Cuentas bancarias** (486): no hay tabla destino en el esquema actual. Quedan en el CSV limpio para cuando exista.
