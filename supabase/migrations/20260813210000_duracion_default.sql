-- Duración mínima del contrato fija en 12 meses para arriendos. El formulario
-- ya no muestra el selector salvo para inmuebles cedidos sin costo. Este
-- default protege el caso en que alguien inserte sin especificar (por ejemplo
-- desde un edge function o el Table Editor).

set search_path = public;

alter table public.inmuebles
  alter column duracion_minima set default '12 meses';
