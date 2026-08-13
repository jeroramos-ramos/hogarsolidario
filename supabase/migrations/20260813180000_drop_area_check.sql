-- Quita el CHECK sobre area_m2. Sin tope ni mínimo: hay inmuebles que se
-- publican sin conocer el área exacta y aceptamos cualquier valor entero.

set search_path = public;

do $$
declare c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.inmuebles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~ 'area_m2'
  loop
    execute format('alter table public.inmuebles drop constraint %I', c);
  end loop;
end $$;
