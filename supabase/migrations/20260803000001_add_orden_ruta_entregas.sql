-- US-13.04: "el orden calculado queda editable manualmente" (US-13.02) —
-- una sola columna numérica en entregas guarda el orden sugerido/ajustado
-- dentro de su sector. No se modela una tabla "rutas" separada: el sector ya
-- vive en grupos_familiares (vía solicitudes → grupos_familiares), y el
-- orden es simplemente un atributo más de cada entrega, igual de criterio
-- que fecha_programada/responsable_id.
alter table public.entregas
  add column orden_ruta integer;

-- "El ajuste manual queda registrado (quién y cuándo lo modificó)" (US-13.02)
-- — y de paso también audita el resultado del cálculo automático (US-13.04),
-- que es simplemente otro UPDATE sobre la misma columna. Se agrega
-- orden_ruta a la misma lista de columnas que ya audita entregas_historial
-- (ver create_entregas.sql); no se necesita ningún trigger nuevo.
create or replace function public.log_entrega_cambio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campo text;
begin
  foreach campo in array array[
    'estado', 'responsable_id', 'fecha_programada', 'motivo_fallo', 'orden_ruta'
  ]
  loop
    if to_jsonb(new) ->> campo is distinct from to_jsonb(old) ->> campo then
      insert into public.entregas_historial (entrega_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, campo, to_jsonb(old) ->> campo, to_jsonb(new) ->> campo, auth.uid());
    end if;
  end loop;

  return new;
end;
$$;
