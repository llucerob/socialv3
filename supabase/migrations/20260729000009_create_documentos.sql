-- EPIC 10 — Documentos y archivos privados (US-10.01, US-10.02).
-- Una solicitud de ayuda y un hogar pueden ambos recibir documentos
-- adjuntos (boletas, certificados, fotos, etc.); en vez de dos tablas casi
-- idénticas se modela una sola tabla discriminada por cuál FK está presente
-- (exactamente una de las dos, nunca ambas ni ninguna).
--
-- US-10.04 "clasificar documentos por finalidad": el catálogo de
-- tipo_documento (RSH, certificado médico, certificado de diálisis, boleta,
-- comprobante, fotografía, informe social, otro) ES la clasificación por
-- finalidad — cada tipo representa el propósito del documento (ej. "boleta"
-- respalda un reembolso, "rsh" respalda el tramo del hogar). No se agrega un
-- campo "finalidad" separado y redundante; el filtro por finalidad en la UI
-- (US-10.04) filtra por esta misma columna.
create type public.tipo_documento as enum (
  'rsh',
  'certificado_medico',
  'certificado_dialisis',
  'boleta',
  'comprobante',
  'fotografia',
  'informe_social',
  'otro'
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid references public.solicitudes (id) on delete cascade,
  grupo_familiar_id uuid references public.grupos_familiares (id) on delete cascade,
  tipo_documento public.tipo_documento not null,
  storage_path text not null unique,
  nombre_archivo text not null check (length(trim(nombre_archivo)) > 0),
  tamano_bytes bigint not null check (tamano_bytes > 0),
  mime_type text not null,
  subido_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  constraint documentos_una_entidad_check check (
    (solicitud_id is not null and grupo_familiar_id is null)
    or (solicitud_id is null and grupo_familiar_id is not null)
  )
);

create index documentos_solicitud_id_idx on public.documentos (solicitud_id);
create index documentos_grupo_familiar_id_idx on public.documentos (grupo_familiar_id);

-- Bucket privado (CLAUDE.md / US-01.05: "documentos privados no accesibles
-- públicamente"). `public = false` es lo que hace que un acceso directo por
-- URL sin firmar sea rechazado; la app genera signed URLs de corta duración
-- para descargar (ver lib/documentos/dal.ts), nunca expone el bucket como
-- público.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800)
on conflict (id) do nothing;
