-- Bucket público 'inmuebles' para las fotos.
-- Cliente comprime (WebP, ≤1600px, ~200KB) y sube directo con anon key;
-- la edge function publicar-inmueble valida las rutas y las asocia al aviso.

set search_path = public;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inmuebles',
  'inmuebles',
  true,
  524288,                                          -- 512 KiB tope duro por archivo
  array['image/webp','image/jpeg','image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- policies sobre storage.objects para el bucket ----------

-- lectura pública: el CDN sirve las fotos sin auth.
drop policy if exists inmuebles_public_read on storage.objects;
create policy inmuebles_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'inmuebles');

-- upload anónimo, restringido: solo bucket inmuebles y sin path travesía.
-- El path debe empezar con un uuid (subdirectorio del lote) + '/' + un archivo.
drop policy if exists inmuebles_anon_upload on storage.objects;
create policy inmuebles_anon_upload on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'inmuebles'
    and length(name) < 100
    and name ~ '^[0-9a-f-]{36}/[0-9]+\.(webp|jpe?g|png)$'
  );

-- nadie puede sobrescribir ni borrar via el rol anon; solo service_role.
