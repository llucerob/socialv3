-- US-14.02: "como finanzas o evaluador autorizado, quiero validar
-- documentos de reembolso". A diferencia del resto de documentos.sql (sin
-- update, "un documento subido no se reemplaza ni se borra"), esta es la
-- primera excepción: se permite UPDATE, pero acotado a las dos columnas de
-- validación (grant de columna) y a los tres roles autorizados — nunca se
-- puede reemplazar el archivo, el tipo ni el resto de metadatos originales.
create policy "documentos_update_validacion_gestion"
on public.documentos
for update
to authenticated
using (public.current_role() in ('administrador', 'evaluador_social', 'finanzas'))
with check (public.current_role() in ('administrador', 'evaluador_social', 'finanzas'));

grant update (estado_validacion, comentario_validacion) on public.documentos to authenticated;
