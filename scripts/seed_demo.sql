-- Aulas de ejemplo
INSERT INTO aulas (nombre_aula, ubicacion, tiene_equipos) VALUES
  ('Aula A-101',       'Doctorado',  true),
  ('Aula B-202',       'Docencia',   false),
  ('Sala Postgrado 1', 'Postgrado',  true),
  ('Sala Extension 1', 'Extensión',  true),
  ('Aula C-303',       'Docencia',   false)
ON CONFLICT DO NOTHING;

-- Estudiantes de ejemplo (10)
INSERT INTO estudiantes (cedula, tipo_documento, nombre, apellido, maestria_id, cohorte, titulo_proyecto, correo_electronico,
  id_tutor_principal, id_tutor_suplente, id_jurado1_principal, id_jurado1_suplente, id_jurado2_principal, id_jurado2_suplente)
VALUES
  ('20123456','Venezolano','Laura',   'Sanchez', 1,'2022-I', 'Innovacion en la ensenanza digital',            'l.sanchez@est.upel.edu.ve', 1,2,3,4,5,6),
  ('20234567','Venezolano','Carlos',  'Romero',  2,'2022-I', 'Gestion del talento humano en educacion',       'c.romero@est.upel.edu.ve',  2,3,4,5,6,7),
  ('20345678','Venezolano','Maria',   'Blanco',  3,'2022-II','Planificacion estrategica en organismos',        'm.blanco@est.upel.edu.ve',  3,4,5,6,7,8),
  ('20456789','Venezolano','Jose',    'Martinez',4,'2023-I', 'Educacion ambiental y desarrollo sostenible',   'j.martinez@est.upel.edu.ve',4,5,6,7,8,9),
  ('20567890','Venezolano','Ana',     'Flores',  5,'2023-I', 'Metodologia en la ensenanza de Ed. Fisica',     'a.flores@est.upel.edu.ve',  5,6,7,8,9,10),
  ('20678901','Venezolano','Pedro',   'Guzman',  6,'2022-II','Recreacion terapeutica en adultos mayores',     'p.guzman@est.upel.edu.ve',  6,7,8,9,10,11),
  ('20789012','Venezolano','Luisa',   'Moreno',  7,'2023-I', 'Tecnologias de informacion en el aula virtual', 'l.moreno@est.upel.edu.ve',  7,8,9,10,11,12),
  ('20890123','Venezolano','Roberto', 'Vargas',  8,'2022-I', 'Orientacion vocacional en educacion media',     'r.vargas@est.upel.edu.ve',  8,9,10,11,12,1),
  ('21012345','Venezolano','Gabriela','Pinto',   1,'2023-II','Gamificacion como estrategia pedagogica',        'g.pinto@est.upel.edu.ve',   9,10,11,12,1,2),
  ('21123456','Venezolano','Miguel',  'Serrano', 2,'2023-I', 'Liderazgo transformacional en instituciones',   'm.serrano@est.upel.edu.ve', 10,11,12,1,2,3)
ON CONFLICT (cedula) DO NOTHING;

-- Mesas de defensa de ejemplo (5)
-- Usamos subqueries para obtener los IDs reales
INSERT INTO mesas_defensa (id_estudiante, id_aula, fecha, hora_inicio, hora_fin, tipo_mesa, estado,
  id_tutor_principal, id_tutor_suplente, id_jurado1_principal, id_jurado1_suplente, id_jurado2_principal, id_jurado2_suplente)
SELECT e.id, a.id, '2026-03-15'::date, '09:00'::time, '11:00'::time, 1, 'Aprobada',        1,2,3,4,5,6  FROM estudiantes e, aulas a WHERE e.cedula='20123456' AND a.nombre_aula='Aula A-101'
UNION ALL
SELECT e.id, a.id, '2026-04-10'::date, '10:00'::time, '12:00'::time, 2, 'Con_Correcciones', 2,3,4,5,6,7 FROM estudiantes e, aulas a WHERE e.cedula='20234567' AND a.nombre_aula='Aula B-202'
UNION ALL
SELECT e.id, a.id, '2026-05-20'::date, '14:00'::time, '16:00'::time, 1, 'Aprobada',         3,4,5,6,7,8 FROM estudiantes e, aulas a WHERE e.cedula='20345678' AND a.nombre_aula='Sala Postgrado 1'
UNION ALL
SELECT e.id, a.id, '2026-06-25'::date, '09:00'::time, '11:00'::time, 3, 'Programada',        4,5,6,7,8,9 FROM estudiantes e, aulas a WHERE e.cedula='20456789' AND a.nombre_aula='Aula A-101'
UNION ALL
SELECT e.id, a.id, '2026-07-10'::date, '15:00'::time, '17:00'::time, 2, 'Programada',        5,6,7,8,9,10 FROM estudiantes e, aulas a WHERE e.cedula='20567890' AND a.nombre_aula='Aula C-303';
