-- ATENCIÓN: datos de demostración. NUNCA correr en producción.
--
-- Este archivo se ejecuta automáticamente después de `supabase db reset`
-- en el entorno local, pero Supabase NO lo aplica en `supabase db push`.
--
-- Para cargarlo manualmente en un entorno remoto (staging):
--   psql "$(supabase status --output env | grep DB_URL | cut -d= -f2)" < supabase/seed.sql
--
-- Para borrar todo lo que haya insertado esto (identificado por demo_seed = true):
--   select * from public.borrar_demos();

set search_path = public;

insert into inmuebles (
  publicado_por, quien_nombre, telefono,
  tipo, departamento, municipio, zona, barrio,
  canon, habitaciones, banos, area_m2,
  disponible_desde, duracion_minima, notas,
  flags, estado_estructural, demo_seed
) values
  ('inmobiliaria','Arrendamientos La Cordillera','3104556677','Apartamento','Caldas','Manizales','Centro','Palermo',
    850000,3,2,74,'Inmediata','3 meses','Tercer piso, agua y luz activas. Fuera del área con restricción.',
    '{"inmediata":true,"amoblado":true}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Inmobiliaria Otún','3129988776','Casa','Risaralda','Pereira','Occidente','Cuba',
    1150000,4,2,118,'3 días','6 meses','Patio y garaje, a dos cuadras del colegio.',
    '{"sinDeposito":true,"mascotas":true}'::jsonb,'revisado_ingenieria',true),

  ('propietario','Gloria Restrepo','3157744221','Aparta-estudio','Quindío','Armenia','Norte','La Castilla',
    560000,1,1,34,'Inmediata','1 mes','Para pareja o persona sola, administración incluida.',
    '{"inmediata":true}'::jsonb,'sin_danos_aparentes',true),

  ('propietario','Familia Ocampo Ruiz','3018899001','Casa-finca','Risaralda','Santa Rosa de Cabal','Zona rural','Vereda El Español',
    0,5,2,160,'Inmediata','3 meses','Cedida sin costo mientras dure la emergencia. Cabe más de una familia.',
    '{"gratuito":true,"sinDeposito":true,"inmediata":true,"amoblado":true}'::jsonb,'sin_danos_aparentes',true),

  ('inmobiliaria','Inmobiliaria Cañaveral','3143322110','Apartamento','Valle del Cauca','Cartago','Centro','Santa Ana',
    640000,2,1,55,'1 semana','12 meses','Conjunto cerrado con portería, primer piso sin escaleras.',
    '{"accesible":true}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Arriendos Norte del Valle','3167788990','Casa','Valle del Cauca','Roldanillo','Centro','El Jardín',
    520000,3,1,88,'Inmediata','3 meses','Casa amplia con solar, zona sin afectación.',
    '{"sinDeposito":true,"inmediata":true}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Arrendamientos del Pacífico','3104556677','Apartamento','Valle del Cauca','Cali','Sur','El Ingenio',
    950000,3,2,78,'Inmediata','3 meses','Quinto piso con ascensor, cocina integral.',
    '{"inmediata":true}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Inmobiliaria Otún','3129988776','Casa','Risaralda','Dosquebradas','Centro','Los Naranjos',
    700000,3,2,90,'3 días','6 meses','Unidad con zona verde y parqueadero.',
    '{"mascotas":true}'::jsonb,'revisado_ingenieria',true),

  ('propietario','Atrato Hospedajes','3112255338','Habitación','Chocó','Quibdó','Centro','El Silencio',
    300000,1,1,18,'Inmediata','1 mes','Baño compartido, servicios incluidos.',
    '{"sinDeposito":true,"inmediata":true,"amoblado":true}'::jsonb,'sin_revisar',true),

  ('inmobiliaria','Arrendamientos La Cordillera','3104556677','Apartamento','Caldas','Villamaría','Centro','La Floresta',
    600000,2,1,52,'Inmediata','3 meses','Segundo piso, a diez minutos de Manizales.',
    '{"sinDeposito":true,"inmediata":true}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Quindío Propiedad Raíz','3145566778','Casa','Quindío','Calarcá','Centro','La Virginia',
    680000,3,2,86,'1 semana','6 meses','Con patio de ropas y antejardín.',
    '{}'::jsonb,'revisado_ingenieria',true),

  ('inmobiliaria','Inmobiliaria Valle Verde','3129911774','Apartamento','Valle del Cauca','Palmira','Centro','Zamorano',
    780000,2,2,62,'Inmediata','12 meses','Edificio de cuatro pisos, sin daños tras revisión.',
    '{"inmediata":true}'::jsonb,'revisado_ingenieria',true);

insert into solicitudes (
  nombre, telefono, adultos, ninos, adultos_mayores,
  situacion, en_censo, departamento, municipio, zona, tipo,
  habitaciones_min, tope_canon, nota, necesidades, demo_seed
) values
  ('Marisol Aguirre','3125566778',2,3,1,'Estamos en un albergue','si','Caldas','Manizales','Centro','Casa',
    3,900000,'Los niños estudian cerca al barrio, necesitamos quedarnos en la zona.',
    '{"inmediata":true}'::jsonb,true),

  ('Jhon Fredy Caicedo','3186677889',2,1,0,'Estamos donde familiares','tramite','Risaralda','Pereira','Occidente','Apartamento',
    2,700000,'Trabajo en el centro, cualquier barrio sirve si hay ruta de bus.',
    '{}'::jsonb,true),

  ('Luz Dary Mosquera','3143399002',1,2,1,'Vivienda con daños, aún adentro','si','Chocó','Quibdó','Centro','Apartamento',
    2,600000,'Mi mamá usa caminador, no podemos subir escaleras.',
    '{"accesible":true,"amoblado":true}'::jsonb,true),

  ('Andrés Villegas','3009911223',2,0,0,'Arriendo terminado por el sismo','no','Quindío','Armenia','Norte','Aparta-estudio',
    1,550000,'Somos dos y tenemos un perro pequeño.',
    '{"mascotas":true}'::jsonb,true),

  ('Nubia Cardona','3172233445',3,2,0,'Estamos en un albergue','si','Valle del Cauca','Cartago','Centro','Casa',
    3,750000,'Salimos de Cartago centro, aceptamos cualquier barrio del municipio.',
    '{"inmediata":true}'::jsonb,true),

  ('Wilmar Peña','3005544332',2,2,1,'Estamos donde familiares','tramite','Valle del Cauca','Cali','Sur','Apartamento',
    3,950000,'Nos tocó salir de Dosquebradas, tenemos familia en Cali.',
    '{"amoblado":true}'::jsonb,true);
