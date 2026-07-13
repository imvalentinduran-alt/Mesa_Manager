-- ============================================================
--  UPEL Mesa Manager — Seed de Demostración (Producción)
--  Ejecutar en: Supabase → SQL Editor
--  NO borra datos existentes (WHERE NOT EXISTS)
--  Inserta: 5 aulas, 25 profesores, 34 estudiantes, 30 mesas
-- ============================================================

-- ── 1. AULAS ─────────────────────────────────────────────────────────────────

INSERT INTO aulas (nombre_aula, ubicacion, tiene_equipos)
SELECT v.n, v.u, v.e FROM (VALUES
    ('Aula de Postgrado A',        'Postgrado', TRUE ),
    ('Aula de Postgrado B',        'Postgrado', FALSE),
    ('Laboratorio de Informática', 'Postgrado', TRUE ),
    ('Sala de Conferencias',       'Extensión', TRUE ),
    ('Auditorio Alterno',          'Docencia',  FALSE)
) AS v(n,u,e)
WHERE NOT EXISTS (SELECT 1 FROM aulas WHERE nombre_aula = v.n);


-- ── 2. PROFESORES ─────────────────────────────────────────────────────────────

INSERT INTO profesores (cedula, nombre, apellido, especialidad, correo_electronico)
SELECT v.c, v.n, v.a, v.e, v.co FROM (VALUES
    ('8234561',  'Ana',       'Rodríguez', 'Investigación Educativa',          'a.rodriguez@upel.edu.ve'),
    ('9145872',  'Carlos',    'Mendoza',   'Metodología de la Investigación',  'c.mendoza@upel.edu.ve'),
    ('7856943',  'María',     'González',  'Investigación Cualitativa',        'm.gonzalez@upel.edu.ve'),
    ('10234598', 'José',      'Ramírez',   'Estadística Educativa',            'j.ramirez@upel.edu.ve'),
    ('12347821', 'Luis',      'Pérez',     'Gerencia Educacional',             'l.perez@upel.edu.ve'),
    ('11256734', 'Carmen',    'Torres',    'Planificación Educativa',          'c.torres@upel.edu.ve'),
    ('13456789', 'Roberto',   'Jiménez',   'Administración Escolar',           'r.jimenez@upel.edu.ve'),
    ('14567890', 'Elena',     'Díaz',      'Gerencia de Proyectos',            'e.diaz@upel.edu.ve'),
    ('15678901', 'Miguel',    'Suárez',    'Informática Educativa',            'm.suarez@upel.edu.ve'),
    ('16789012', 'Patricia',  'Morales',   'Tecnología Educativa',             'p.morales@upel.edu.ve'),
    ('17890123', 'Fernando',  'Herrera',   'Diseño Instruccional',             'f.herrera@upel.edu.ve'),
    ('18901234', 'Isabel',    'Castillo',  'E-Learning y Entornos Virtuales',  'i.castillo@upel.edu.ve'),
    ('13100001', 'Diana',     'Fuentes',   'Innovación Educativa',             'd.fuentes@upel.edu.ve'),
    ('13200002', 'Andrés',    'Bermúdez',  'Gerencia Educacional',             'a.bermudez@upel.edu.ve'),
    ('13300003', 'Silvia',    'Parra',     'Planificación Global',             's.parra@upel.edu.ve'),
    ('13400004', 'Tomás',     'Aguilar',   'Educación, Ambiente y Desarrollo', 't.aguilar@upel.edu.ve'),
    ('13500005', 'Verónica',  'Molina',    'Enseñanza de la Educación Física', 'v.molina@upel.edu.ve'),
    ('13600006', 'Arturo',    'Rojas',     'Recreación',                       'a.rojas2@upel.edu.ve'),
    ('13700007', 'Natalia',   'Cruz',      'Informática Educativa',            'n.cruz@upel.edu.ve'),
    ('13800008', 'Ramiro',    'Estrada',   'Orientación Educativa',            'r.estrada@upel.edu.ve'),
    ('13900009', 'Ingrid',    'Santos',    'Innovación Educativa',             'i.santos@upel.edu.ve'),
    ('14000010', 'Pablo',     'Delgado',   'Gerencia Educacional',             'p.delgado@upel.edu.ve'),
    ('14100011', 'Claudia',   'Rivero',    'Planificación Global',             'c.rivero@upel.edu.ve'),
    ('14200012', 'Óscar',     'Montoya',   'Educación, Ambiente y Desarrollo', 'o.montoya@upel.edu.ve'),
    ('14300013', 'Rebeca',    'Navas',     'Enseñanza de la Educación Física', 'r.navas2@upel.edu.ve')
) AS v(c,n,a,e,co)
WHERE NOT EXISTS (SELECT 1 FROM profesores WHERE cedula = v.c OR correo_electronico = v.co);


-- ── 3. ESTUDIANTES ───────────────────────────────────────────────────────────

INSERT INTO estudiantes (
    cedula, tipo_documento, nombre, apellido, correo_electronico,
    maestria_id, cohorte, titulo_proyecto,
    id_tutor_principal, id_tutor_suplente,
    id_jurado1_principal, id_jurado1_suplente,
    id_jurado2_principal, id_jurado2_suplente
)
SELECT
    est.cedula, 'Venezolano', est.nombre, est.apellido,
    'est' || est.cedula || '@upel.edu.ve',
    m.id, est.cohorte, est.titulo,
    p[1], p[2], p[3], p[4], p[5], p[6]
FROM (VALUES
    ('22100001','Valentina','García',    'IE', '2022-I',  'Estrategias digitales en la formación docente'),
    ('22100002','Luis',     'López',     'IE', '2022-II', 'Aprendizaje colaborativo mediado por tecnología'),
    ('22100003','Carmen',   'Martínez',  'IE', '2023-I',  'TIC en la evaluación formativa universitaria'),
    ('22100004','Diego',    'Hernández', 'IE', '2023-II', 'Gamificación y motivación en el aula'),
    ('22100005','Adriana',  'Flores',    'IE', '2021-I',  'Innovación pedagógica en educación a distancia'),
    ('22100006','Rafael',   'Castro',    'IE', '2021-II', 'Diseño instruccional basado en competencias'),
    ('22200001','Mariana',  'Chávez',    'GE', '2022-I',  'Gestión del conocimiento en instituciones educativas'),
    ('22200002','Javier',   'Bravo',     'GE', '2022-II', 'Liderazgo educativo y clima organizacional'),
    ('22200003','Paola',    'Salcedo',   'GE', '2023-I',  'Planificación estratégica en escuelas técnicas'),
    ('22200004','Alejandro','Colmenares','GE', '2023-II', 'Evaluación institucional y mejora continua'),
    ('22200005','Ingrid',   'Briceño',   'GE', '2021-I',  'Gestión del talento humano docente'),
    ('22200006','Nathaly',  'Dugarte',   'GE', '2021-II', 'Modelos de supervisión pedagógica'),
    ('22300001','Tomás',    'Gamboa',    'PG', '2022-I',  'Planificación educativa y políticas públicas'),
    ('22300002','Verónica', 'Heredia',   'PG', '2022-II', 'Planificación curricular en educación media'),
    ('22300003','Arturo',   'Iriarte',   'PG', '2023-I',  'Modelos de planificación en organismos estatales'),
    ('22300004','Natalia',  'Jaspe',     'PG', '2023-II', 'Planificación prospectiva en educación'),
    ('22400001','Teresa',   'Peñaloza',  'EAD','2022-I',  'Educación ambiental en comunidades rurales'),
    ('22400002','Guillermo','Quintero',  'EAD','2022-II', 'Desarrollo sostenible y currículo escolar'),
    ('22400003','Esperanza','Ruiz',      'EAD','2023-I',  'Formación docente para la educación ambiental'),
    ('22400004','Jorge',    'Suárez',    'EAD','2023-II', 'Ecoturismo y educación en parques nacionales'),
    ('22500001','Mireya',   'Landaeta',  'EEF','2022-I',  'Didáctica de la educación física en secundaria'),
    ('22500002','Freddy',   'García',    'EEF','2022-II', 'Actividad física y rendimiento académico'),
    ('22500003','Xiomara',  'Martínez',  'EEF','2023-I',  'Deporte escolar y valores humanos'),
    ('22500004','Diana',    'Hernández', 'EEF','2023-II', 'Métodos de enseñanza en deportes colectivos'),
    ('22600001','Valentina','Ramos',     'REC','2022-I',  'Recreación y bienestar en el adulto mayor'),
    ('22600002','Luis',     'Morales',   'REC','2022-II', 'Actividades recreativas en comunidades urbanas'),
    ('22700001','Eduardo',  'Medina',    'INF','2022-I',  'Aulas virtuales y aprendizaje significativo'),
    ('22700002','Mariana',  'Vargas',    'INF','2022-II', 'Robótica educativa en educación básica'),
    ('22700003','Javier',   'Guzmán',    'INF','2023-I',  'Inteligencia artificial en la educación'),
    ('22700004','Paola',    'Jiménez',   'INF','2023-II', 'Programación como herramienta pedagógica'),
    ('22800001','Carlos',   'Chávez',    'OE', '2022-I',  'Orientación vocacional en bachillerato'),
    ('22800002','Nathaly',  'Acevedo',   'OE', '2022-II', 'Consejería educativa y rendimiento académico'),
    ('22800003','Diego',    'Salcedo',   'OE', '2023-I',  'Orientación familiar en contextos de riesgo'),
    ('22800004','Adriana',  'Colmenares','OE', '2023-II', 'Habilidades socioemocionales y orientación')
) AS est(cedula, nombre, apellido, cod_m, cohorte, titulo)
JOIN maestrias m ON m.codigo_interno = est.cod_m
CROSS JOIN LATERAL (
    SELECT ARRAY(
        SELECT id FROM profesores ORDER BY id
        OFFSET (ascii(substring(est.cedula, 1, 1)) % 15)
        LIMIT 6
    )
) AS profs(p)
WHERE NOT EXISTS (SELECT 1 FROM estudiantes WHERE cedula = est.cedula OR correo_electronico = ('est' || est.cedula || '@upel.edu.ve'));


-- ── 4. MESAS ─────────────────────────────────────────────────────────────────

INSERT INTO mesas_defensa (
    id_estudiante, id_aula, fecha, hora_inicio, hora_fin, tipo_mesa, estado, veredicto,
    id_tutor_principal, id_tutor_suplente,
    id_jurado1_principal, id_jurado1_suplente,
    id_jurado2_principal, id_jurado2_suplente
)
SELECT
    e.id, a.id, m.fecha::date, m.hora_inicio::time, m.hora_fin::time,
    m.tipo::int, m.estado, m.veredicto,
    e.id_tutor_principal, e.id_tutor_suplente,
    e.id_jurado1_principal, e.id_jurado1_suplente,
    e.id_jurado2_principal, e.id_jurado2_suplente
FROM (VALUES
    ('22100001','Aula de Postgrado A',        '2026-06-02','08:00','09:40','1','Aprobada',        'Aprobado'),
    ('22200001','Aula de Postgrado B',        '2026-06-02','10:00','11:40','1','Aprobada',        'Aprobado'),
    ('22300001','Sala de Conferencias',       '2026-06-02','11:00','12:00','2','Con_Correcciones','Con_Correcciones'),
    ('22400001','Aula de Postgrado A',        '2026-06-04','08:00','09:40','1','Aprobada',        'Aprobado'),
    ('22500001','Laboratorio de Informática', '2026-06-04','10:00','11:40','1','Con_Correcciones','Con_Correcciones'),
    ('22600001','Aula de Postgrado A',        '2026-06-05','08:00','09:40','1','Aprobada',        'Aprobado'),
    ('22700001','Aula de Postgrado B',        '2026-06-05','10:00','11:00','2','Reprobada',       'Reprobado'),
    ('22800001','Sala de Conferencias',       '2026-06-05','11:00','12:40','1','Suspendida',      NULL),
    ('22100002','Sala de Conferencias',       '2026-06-06','09:00','10:40','1','Aprobada',        'Aprobado'),
    ('22200002','Aula de Postgrado A',        '2026-06-06','11:00','12:00','2','Con_Correcciones','Con_Correcciones'),
    ('22300002','Aula de Postgrado A',        '2026-06-23','08:00','09:40','1','Programada',      NULL),
    ('22400002','Aula de Postgrado B',        '2026-06-23','10:00','11:40','1','Programada',      NULL),
    ('22500002','Aula de Postgrado A',        '2026-06-24','08:00','09:40','1','Programada',      NULL),
    ('22600002','Aula de Postgrado B',        '2026-06-24','10:00','11:40','1','Programada',      NULL),
    ('22700002','Sala de Conferencias',       '2026-06-24','11:00','12:00','2','Programada',      NULL),
    ('22800002','Laboratorio de Informática', '2026-06-24','11:00','12:40','1','Programada',      NULL),
    ('22100003','Aula de Postgrado A',        '2026-06-30','09:00','10:40','1','Programada',      NULL),
    ('22200003','Sala de Conferencias',       '2026-06-30','11:00','12:00','1','Programada',      NULL),
    ('22300003','Sala de Conferencias',       '2026-07-07','10:00','11:00','2','Programada',      NULL),
    ('22400003','Aula de Postgrado B',        '2026-07-07','11:00','12:40','1','Programada',      NULL),
    ('22500003','Aula de Postgrado A',        '2026-07-08','08:00','09:40','1','Programada',      NULL),
    ('22600003','Aula de Postgrado B',        '2026-07-08','10:00','11:40','1','Programada',      NULL),
    ('22700003','Sala de Conferencias',       '2026-07-08','11:00','12:00','2','Programada',      NULL),
    ('22800003','Laboratorio de Informática', '2026-07-08','11:00','12:40','1','Programada',      NULL),
    ('22100004','Laboratorio de Informática', '2026-07-14','08:00','09:40','1','Programada',      NULL),
    ('22200004','Aula de Postgrado A',        '2026-07-14','10:00','11:00','2','Programada',      NULL),
    ('22300004','Aula de Postgrado A',        '2026-07-21','08:00','09:40','1','Programada',      NULL),
    ('22400004','Aula de Postgrado B',        '2026-07-21','10:00','11:40','1','Programada',      NULL),
    ('22500004','Sala de Conferencias',       '2026-07-21','11:00','12:40','1','Programada',      NULL),
    ('22700004','Aula de Postgrado A',        '2026-07-28','10:00','11:00','2','Programada',      NULL)
) AS m(ced_est, nom_aula, fecha, hora_inicio, hora_fin, tipo, estado, veredicto)
JOIN estudiantes e ON e.cedula = m.ced_est
JOIN aulas       a ON a.nombre_aula = m.nom_aula
WHERE NOT EXISTS (
    SELECT 1 FROM mesas_defensa WHERE id_estudiante = e.id
);
