\encoding UTF8
-- ============================================================
--  UPEL Mesa Manager v2 — Seeder de Demostración
--  Ejecutar DESPUÉS de: python config_db.py --recrear
--  Pobla: 5 aulas, 24 profesores, 25 estudiantes, 15 mesas
--
--  Escenario demo anti-colisión (2026-06-15):
--    Mesa 12 → Aula Postgrado A 09:00-09:40 (Profs 5,8,13,16,21,22)
--    Mesa 15 → Aula 2-B         08:00-08:40 (sin solape de horario)
--    Demo A: intentar Aula 1 el 15-Jun 09:00 → BLOQUEO por aula
--    Demo B: intentar Prof 5 el 15-Jun 09:00 → BLOQUEO por profesor
--    Demo C: Lab Informática 15-Jun 10:00 con otros profs → EXITOSO
-- ============================================================

BEGIN;

-- 1. Limpiar tablas de datos
--    maestrias y usuarios conservan sus seeds de config_db.py
TRUNCATE TABLE mesas_defensa, estudiantes, aulas, profesores RESTART IDENTITY CASCADE;


-- ============================================================
--  AULAS (5)
--  IDs resultantes: 1-5
-- ============================================================
INSERT INTO aulas (nombre_aula, ubicacion, tiene_equipos) VALUES
    ('Aula de Postgrado A',        'Postgrado', TRUE ),   -- id 1
    ('Aula 2-B',                   'Docencia',  FALSE),   -- id 2
    ('Laboratorio de Informática', 'Postgrado', TRUE ),   -- id 3
    ('Sala de Conferencias',       'Extensión', TRUE ),   -- id 4
    ('Auditorio Alterno',          'Docencia',  FALSE);   -- id 5


-- ============================================================
--  PROFESORES (24)
--  IDs resultantes: 1-24
-- ============================================================
INSERT INTO profesores (cedula, nombre, apellido, especialidad, correo_electronico, is_active) VALUES
    ('8234561',    'Ana',       'Rodríguez', 'Investigación Educativa',          'a.rodriguez@upel.edu.ve', TRUE),  --  1
    ('9145872',    'Carlos',    'Mendoza',   'Metodología de la Investigación',  'c.mendoza@upel.edu.ve',   TRUE),  --  2
    ('7856943',    'María',     'González',  'Investigación Cualitativa',        'm.gonzalez@upel.edu.ve',  TRUE),  --  3
    ('10234598',   'José',      'Ramírez',   'Estadística Educativa',            'j.ramirez@upel.edu.ve',   TRUE),  --  4
    ('12347821',   'Luis',      'Pérez',     'Gerencia Educacional',             'l.perez@upel.edu.ve',     TRUE),  --  5
    ('11256734',   'Carmen',    'Torres',    'Planificación Educativa',          'c.torres@upel.edu.ve',    TRUE),  --  6
    ('13456789',   'Roberto',   'Jiménez',   'Administración Escolar',           'r.jimenez@upel.edu.ve',   TRUE),  --  7
    ('14567890',   'Elena',     'Díaz',      'Gerencia de Proyectos',            'e.diaz@upel.edu.ve',      TRUE),  --  8
    ('15678901',   'Miguel',    'Suárez',    'Informática Educativa',            'm.suarez@upel.edu.ve',    TRUE),  --  9
    ('16789012',   'Patricia',  'Morales',   'Tecnología Educativa',             'p.morales@upel.edu.ve',   TRUE),  -- 10
    ('17890123',   'Fernando',  'Herrera',   'Diseño Instruccional',             'f.herrera@upel.edu.ve',   TRUE),  -- 11
    ('18901234',   'Isabel',    'Castillo',  'E-Learning y Entornos Virtuales',  'i.castillo@upel.edu.ve',  TRUE),  -- 12
    ('20123456',   'Antonio',   'Vargas',    'Currículo y Evaluación',           'a.vargas@upel.edu.ve',    TRUE),  -- 13
    ('21234567',   'Rosa',      'Flores',    'Pedagogía General',                'r.flores@upel.edu.ve',    TRUE),  -- 14
    ('22345678',   'Héctor',    'Medina',    'Didáctica de las Ciencias',        'h.medina@upel.edu.ve',    TRUE),  -- 15
    ('23456789',   'Laura',     'Blanco',    'Educación Básica',                 'l.blanco@upel.edu.ve',    TRUE),  -- 16
    ('24567890',   'Alejandro', 'Rojas',     'Orientación Educativa',            'a.rojas@upel.edu.ve',     TRUE),  -- 17
    ('25678901',   'Nilda',     'Guerrero',  'Psicología Educativa',             'n.guerrero@upel.edu.ve',  TRUE),  -- 18
    ('9876543',    'Ramón',     'Acosta',    'Educación Ambiental',              'r.acosta@upel.edu.ve',    TRUE),  -- 19
    ('8765432',    'Gregoria',  'Rivas',     'Recreación y Deportes',            'g.rivas@upel.edu.ve',     TRUE),  -- 20
    ('7654321',    'Esteban',   'Fuentes',   'Educación Física',                 'e.fuentes@upel.edu.ve',   TRUE),  -- 21
    ('6543210',    'Beatriz',   'Salinas',   'Bilingüismo y Lenguas',            'b.salinas@upel.edu.ve',   TRUE),  -- 22
    ('1094567890', 'Andrés',    'Ospina',    'Educación Rural',                  'a.ospina@upel.edu.ve',    TRUE),  -- 23
    ('1023456789', 'Diana',     'Cárdenas',  'Educación Inclusiva',              'd.cardenas@upel.edu.ve',  TRUE);  -- 24


-- ============================================================
--  ESTUDIANTES (25)
--  IDs resultantes: 1-25
--  22 venezolanos (tipo_documento='Venezolano') + 3 colombianos
--
--  Solvencia: solo verificado_mN=TRUE para las mesas que el
--  estudiante ya tuvo que crear (candado de pago previo).
-- ============================================================
INSERT INTO estudiantes (
    cedula, tipo_documento, pasaporte,
    nombre, apellido, correo_electronico,
    maestria_id, cohorte, titulo_proyecto,
    id_tutor_principal,   id_tutor_suplente,
    id_jurado1_principal, id_jurado1_suplente,
    id_jurado2_principal, id_jurado2_suplente,
    recibo_m1, monto_m1, verificado_m1,
    recibo_m2, monto_m2, verificado_m2,
    recibo_m3, monto_m3, verificado_m3
) VALUES

-- ── IE · Innovación Educativa (maestria_id = 1) ──────────────
-- S01 (id=1): M1 Aprobada → M2 Aprobada → M3 Programada. Solvencia m1+m2+m3.
('12345678', 'Venezolano', NULL,
 'Gabriela', 'Moreno', 'g.moreno@postgrado.upel.edu.ve',
 1, '2024-I',
 'Estrategias didácticas mediadas por TIC para el aprendizaje cooperativo en educación secundaria',
 1, 2, 3, 4, 5, 6,
 'REC-2026-M1-001', 50.00, TRUE,
 'REC-2026-M2-001', 75.00, TRUE,
 'REC-2026-M3-001', 100.00, TRUE),

-- S02 (id=2): M1 Aprobada → M2 Con_Correcciones. Solvencia m1+m2.
('13456789', 'Venezolano', NULL,
 'Pedro', 'Castillo', 'p.castillo@postgrado.upel.edu.ve',
 1, '2024-I',
 'Competencias digitales del docente de educación básica en el contexto postpandemia',
 1, 7, 3, 8, 5, 9,
 'REC-2026-M1-002', 50.00, TRUE,
 'REC-2026-M2-002', 75.00, TRUE,
 NULL, NULL, FALSE),

-- S03 (id=3): M1 Aprobada → M2 Aprobada. Solvencia m1+m2.
('14567890', 'Venezolano', NULL,
 'Valeria', 'Rondón', 'v.rondon@postgrado.upel.edu.ve',
 1, '2024-I',
 'Gamificación como estrategia de innovación pedagógica en el aula de matemáticas',
 2, 3, 6, 10, 7, 11,
 'REC-2026-M1-003', 50.00, TRUE,
 'REC-2026-M2-003', 75.00, TRUE,
 NULL, NULL, FALSE),

-- S04 (id=4): M1 Reprobada. Solvencia m1.
('15678901', 'Venezolano', NULL,
 'Andrés', 'Salcedo', 'a.salcedo@postgrado.upel.edu.ve',
 1, '2024-I',
 'Gestión del conocimiento organizacional en instituciones educativas del estado Táchira',
 1, 4, 9, 12, 13, 14,
 'REC-2026-M1-004', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S05 (id=5): M1 Suspendida. Solvencia m1.
('16789012', 'Venezolano', NULL,
 'Luisa', 'Contreras', 'l.contreras@postgrado.upel.edu.ve',
 1, '2024-I',
 'Aprendizaje invertido (Flipped Classroom) en la enseñanza de la Física universitaria',
 2, 5, 10, 13, 15, 16,
 'REC-2026-M1-005', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S06 (id=6): M1 En_Curso. Solvencia m1.
('17890123', 'Venezolano', NULL,
 'Ramiro', 'Useche', 'r.useche@postgrado.upel.edu.ve',
 1, '2024-I',
 'Comunidades de práctica docente como modelo de formación continua en la UPEL',
 3, 6, 11, 14, 17, 18,
 'REC-2026-M1-006', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S07 (id=7): M1 Programada (Jun 18). Solvencia m1.
('18901234', 'Venezolano', NULL,
 'Karina', 'Dávila', 'k.davila@postgrado.upel.edu.ve',
 1, '2024-I',
 'Evaluación formativa digital en entornos virtuales de aprendizaje cooperativo',
 4, 7, 12, 15, 19, 20,
 'REC-2026-M1-007', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S08 (id=8): M1 Programada (Jun 15 09:00 – DEMO colisión). Solvencia m1.
('19012345', 'Venezolano', NULL,
 'Oscar', 'Rangel', 'o.rangel@postgrado.upel.edu.ve',
 1, '2024-I',
 'Pensamiento computacional integrado al currículo de educación primaria venezolana',
 5, 8, 13, 16, 21, 22,
 'REC-2026-M1-008', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- ── GE · Gerencia Educacional (maestria_id = 2) ──────────────
-- S09 (id=9): M1 Aprobada (May). Solvencia m1.
('20123457', 'Venezolano', NULL,
 'Mariela', 'Figueroa', 'm.figueroa@postgrado.upel.edu.ve',
 2, '2023-II',
 'Liderazgo transformacional del director y clima organizacional en liceos públicos',
 6, 9, 14, 17, 23, 24,
 'REC-2026-M1-009', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S10 (id=10): M1 Programada (Jun 22). Solvencia m1.
('21234568', 'Venezolano', NULL,
 'Nelson', 'Angulo', 'n.angulo@postgrado.upel.edu.ve',
 2, '2023-II',
 'Gestión del talento humano en instituciones de educación media del municipio Rubio',
 7, 10, 15, 18, 1, 2,
 'REC-2026-M1-010', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S11 (id=11): M1 Programada (Jun 15 08:00 – misma fecha que Mesa 12, hora anterior). Solvencia m1.
('22345679', 'Venezolano', NULL,
 'Yolanda', 'Pineda', 'y.pineda@postgrado.upel.edu.ve',
 2, '2023-II',
 'Planeación estratégica y calidad educativa en escuelas bolivarianas',
 5, 8, 16, 19, 3, 4,
 'REC-2026-M1-011', 50.00, TRUE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S12 (id=12): Sin mesa aún.
('23456780', 'Venezolano', NULL,
 'Félix', 'Briceño', 'f.briceno@postgrado.upel.edu.ve',
 2, '2023-II',
 'Toma de decisiones gerenciales bajo incertidumbre en el sector educativo venezolano',
 9, 10, 17, 20, 6, 7,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S13 (id=13): Sin mesa aún.
('24567891', 'Venezolano', NULL,
 'Susana', 'Colmenares', 's.colmenares@postgrado.upel.edu.ve',
 2, '2023-II',
 'Mediación educativa como estrategia de resolución de conflictos institucionales',
 11, 12, 18, 21, 8, 9,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- ── INF · Informática Educativa (maestria_id = 7) ────────────
-- S14 (id=14): Sin mesa aún.
('25678902', 'Venezolano', NULL,
 'Dario', 'Villamizar', 'd.villamizar@postgrado.upel.edu.ve',
 7, '2024-II',
 'Plataformas e-learning y rendimiento académico en estudiantes universitarios',
 9, 11, 17, 22, 13, 14,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S15 (id=15): Sin mesa aún.
('26789013', 'Venezolano', NULL,
 'Ingrid', 'Sepúlveda', 'i.sepulveda@postgrado.upel.edu.ve',
 7, '2024-II',
 'Realidad aumentada como recurso didáctico en el aprendizaje de la geometría espacial',
 10, 12, 18, 23, 15, 16,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S16 (id=16): Sin mesa aún.
('27890124', 'Venezolano', NULL,
 'Gustavo', 'Carrero', 'g.carrero@postgrado.upel.edu.ve',
 7, '2024-II',
 'Diseño instruccional para entornos virtuales en la formación docente a distancia',
 11, 13, 19, 24, 17, 18,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S17 (id=17): Sin mesa aún.
('28901235', 'Venezolano', NULL,
 'Marisol', 'Chacón', 'm.chacon@postgrado.upel.edu.ve',
 7, '2024-II',
 'Ciberseguridad y uso responsable de internet en adolescentes venezolanos de secundaria',
 12, 14, 20, 1, 19, 22,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S18 (id=18): Sin mesa aún.
('29012346', 'Venezolano', NULL,
 'Julio', 'Peñaranda', 'j.penaranda@postgrado.upel.edu.ve',
 7, '2024-II',
 'Aplicaciones móviles para el aprendizaje del inglés como lengua extranjera en básica',
 13, 15, 21, 2, 22, 23,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- ── OE · Orientación Educativa (maestria_id = 8) ─────────────
-- S19 (id=19): Sin mesa aún.
('30123457', 'Venezolano', NULL,
 'Adriana', 'Quintero', 'a.quintero@postgrado.upel.edu.ve',
 8, '2023-I',
 'Orientación vocacional y elección de carrera en estudiantes de quinto año de bachillerato',
 17, 18, 3, 4, 6, 7,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S20 (id=20): Sin mesa aún.
('31234568', 'Venezolano', NULL,
 'Héctor', 'Nava', 'h.nava@postgrado.upel.edu.ve',
 8, '2023-I',
 'Ansiedad escolar y rendimiento académico: estrategias de intervención orientadora',
 17, 19, 4, 5, 8, 9,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S21 (id=21): Sin mesa aún.
('32345679', 'Venezolano', NULL,
 'Patricia', 'Duarte', 'p.duarte@postgrado.upel.edu.ve',
 8, '2023-I',
 'Inteligencia emocional y convivencia escolar en instituciones de educación básica',
 18, 20, 5, 6, 10, 11,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S22 (id=22): Sin mesa aún.
('33456780', 'Venezolano', NULL,
 'Wilmer', 'Zambrano', 'w.zambrano@postgrado.upel.edu.ve',
 8, '2023-I',
 'Orientación familiar ante el abandono escolar en zonas rurales del estado Táchira',
 19, 21, 6, 7, 12, 13,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- ── EAD · Educación, Ambiente y Desarrollo (maestria_id = 4) — COLOMBIANOS ──
-- S23 (id=23): Sin mesa aún.
('1094321890', 'Colombiano', NULL,
 'Sandra', 'Ospina', 's.ospina@postgrado.upel.edu.ve',
 4, '2024-I',
 'Educación ambiental y conductas proecológicas en la comunidad escolar fronteriza',
 20, 22, 7, 8, 14, 15,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- S24 (id=24): Sin mesa aún.
('1023654789', 'Colombiano', NULL,
 'Camilo', 'Bermúdez', 'c.bermudez@postgrado.upel.edu.ve',
 4, '2024-I',
 'Huertos escolares como estrategia de educación ambiental en educación primaria',
 21, 23, 8, 9, 15, 16,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE),

-- ── PG · Planificación Global (maestria_id = 3) — COLOMBIANA ──
-- S25 (id=25): Sin mesa aún.
('1071234890', 'Colombiano', NULL,
 'Paola', 'Patiño', 'p.patino@postgrado.upel.edu.ve',
 3, '2024-I',
 'Planificación curricular por competencias en la educación técnica venezolana',
 22, 24, 9, 10, 17, 18,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE,
 NULL, NULL, FALSE);


-- ============================================================
--  MESAS DE DEFENSA (15)
--  IDs resultantes: 1-15
--
--  Columnas efectivos (quórum registrado):
--    tutor_efectivo_id, jurado1_efectivo_id, jurado2_efectivo_id
--  NULL en Programada, Suspendida; asignado en En_Curso y terminadas.
-- ============================================================
INSERT INTO mesas_defensa (
    id_estudiante, id_aula,
    fecha, hora_inicio, hora_fin,
    tipo_mesa, estado,
    id_tutor_principal,   id_tutor_suplente,
    id_jurado1_principal, id_jurado1_suplente,
    id_jurado2_principal, id_jurado2_suplente,
    tutor_efectivo_id, jurado1_efectivo_id, jurado2_efectivo_id,
    asistencia_estudiante, iniciada_por_profesor_id,
    veredicto, dias_correccion, fecha_limite_correccion, fecha_validacion_correcciones
) VALUES

-- Mesa 1: Gabriela Moreno · M1 · Aprobada · Feb 2026
--   Aula Postgrado A · 09:00-09:40 · Comité: P1,P2,P3,P4,P5,P6
(1, 1, '2026-02-10', '09:00', '09:40', 1, 'Aprobada',
 1, 2, 3, 4, 5, 6,
 1, 3, 5,
 TRUE, 1,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 2: Gabriela Moreno · M2 · Aprobada · Mar 2026
--   Aula 2-B · 10:00-10:40 · Mismo comité (heredado del estudiante)
(1, 2, '2026-03-19', '10:00', '10:40', 2, 'Aprobada',
 1, 2, 3, 4, 5, 6,
 1, 3, 5,
 TRUE, 1,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 3: Gabriela Moreno · M3 · Programada · Jun 2026 (futura)
--   Sala de Conferencias · 08:00-09:00 (60 min por ser M3)
(1, 4, '2026-06-25', '08:00', '09:00', 3, 'Programada',
 1, 2, 3, 4, 5, 6,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL),

-- Mesa 4: Pedro Castillo · M1 · Aprobada · Ene 2026
--   Lab Informática · 08:00-08:40 · Comité: P1,P7,P3,P8,P5,P9
(2, 3, '2026-01-20', '08:00', '08:40', 1, 'Aprobada',
 1, 7, 3, 8, 5, 9,
 1, 3, 5,
 TRUE, 1,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 5: Pedro Castillo · M2 · Con_Correcciones · Mar 2026
--   Aula Postgrado A · 11:00-11:40 · Activó suplentes de jurado
(2, 1, '2026-03-05', '11:00', '11:40', 2, 'Con_Correcciones',
 1, 7, 3, 8, 5, 9,
 1, 8, 9,
 TRUE, 1,
 'Con_Correcciones', 15, '2026-03-20', NULL),

-- Mesa 6: Valeria Rondón · M1 · Aprobada · Feb 2026
--   Sala de Conferencias · 10:00-10:40 · Comité: P2,P3,P6,P10,P7,P11
(3, 4, '2026-02-18', '10:00', '10:40', 1, 'Aprobada',
 2, 3, 6, 10, 7, 11,
 2, 6, 7,
 TRUE, 2,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 7: Valeria Rondón · M2 · Aprobada · Abr 2026
--   Aula 2-B · 09:00-09:40
(3, 2, '2026-04-14', '09:00', '09:40', 2, 'Aprobada',
 2, 3, 6, 10, 7, 11,
 2, 6, 7,
 TRUE, 2,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 8: Andrés Salcedo · M1 · Reprobada · Abr 2026
--   Auditorio Alterno · 08:00-08:40 · Comité: P1,P4,P9,P12,P13,P14
(4, 5, '2026-04-02', '08:00', '08:40', 1, 'Reprobada',
 1, 4, 9, 12, 13, 14,
 1, 9, 13,
 TRUE, 1,
 'Reprobado', NULL, NULL, NULL),

-- Mesa 9: Luisa Contreras · M1 · Suspendida · Mar 2026
--   Aula Postgrado A · 09:00-09:40 · Sin quórum registrado
(5, 1, '2026-03-26', '09:00', '09:40', 1, 'Suspendida',
 2, 5, 10, 13, 15, 16,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL),

-- Mesa 10: Ramiro Useche · M1 · En_Curso · Jun 5 2026
--   Lab Informática · 11:00-11:40 · Quórum registrado, veredicto pendiente
(6, 3, '2026-06-05', '11:00', '11:40', 1, 'En_Curso',
 3, 6, 11, 14, 17, 18,
 3, 11, 17,
 TRUE, 3,
 NULL, NULL, NULL, NULL),

-- Mesa 11: Karina Dávila · M1 · Programada · Jun 18 2026
--   Aula 2-B · 08:00-08:40
(7, 2, '2026-06-18', '08:00', '08:40', 1, 'Programada',
 4, 7, 12, 15, 19, 20,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL),

-- Mesa 12: Oscar Rangel · M1 · Programada · Jun 15 2026
--   Aula Postgrado A (id=1) · 09:00-09:40
--   ← DEMO A: intentar crear mesa en Aula 1 el Jun 15 09:00 → BLOQUEO por aula
--   ← DEMO B: intentar crear mesa con Prof 5 el Jun 15 09:00 → BLOQUEO por profesor
(8, 1, '2026-06-15', '09:00', '09:40', 1, 'Programada',
 5, 8, 13, 16, 21, 22,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL),

-- Mesa 13: Mariela Figueroa · M1 · Aprobada · May 2026
--   Auditorio Alterno · 10:00-10:40 · Comité: P6,P9,P14,P17,P23,P24
(9, 5, '2026-05-07', '10:00', '10:40', 1, 'Aprobada',
 6, 9, 14, 17, 23, 24,
 6, 14, 23,
 TRUE, 6,
 'Aprobado', NULL, NULL, NULL),

-- Mesa 14: Nelson Angulo · M1 · Programada · Jun 22 2026
--   Sala de Conferencias · 08:00-08:40
(10, 4, '2026-06-22', '08:00', '08:40', 1, 'Programada',
 7, 10, 15, 18, 1, 2,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL),

-- Mesa 15: Yolanda Pineda · M1 · Programada · Jun 15 2026
--   Aula 2-B (id=2) · 08:00-08:40
--   Misma fecha que Mesa 12 pero sin solape de horario (termina 08:40, Mesa 12 empieza 09:00).
--   Profs 5 y 8 aparecen también en Mesa 12; como los horarios NO solapan, es estado consistente.
(11, 2, '2026-06-15', '08:00', '08:40', 1, 'Programada',
 5, 8, 16, 19, 3, 4,
 NULL, NULL, NULL,
 FALSE, NULL,
 NULL, NULL, NULL, NULL);


COMMIT;


-- ============================================================
--  VERIFICACIÓN POST-EJECUCIÓN
--  Pegar en psql o DBeaver para confirmar la carga.
-- ============================================================

-- Conteos generales (esperado: 5 / 24 / 25 / 15)
SELECT 'aulas'        AS tabla, COUNT(*) AS total FROM aulas
UNION ALL
SELECT 'profesores',            COUNT(*) FROM profesores
UNION ALL
SELECT 'estudiantes',           COUNT(*) FROM estudiantes
UNION ALL
SELECT 'mesas_defensa',         COUNT(*) FROM mesas_defensa;

-- Distribución de estados (esperado: Aprobada:5 · Con_Correcciones:1 · En_Curso:1 · Programada:5 · Reprobada:1 · Suspendida:1)
SELECT estado, COUNT(*) AS cantidad
FROM mesas_defensa
GROUP BY estado
ORDER BY estado;

-- Escenario colisión: dos mesas el 15-Jun (08:00-08:40 y 09:00-09:40, sin solape)
SELECT id, id_estudiante, hora_inicio, hora_fin, id_aula, estado
FROM mesas_defensa
WHERE fecha = '2026-06-15'
ORDER BY hora_inicio;

-- Solvencias de S01-S11 (los que tienen mesa)
SELECT id, verificado_m1, verificado_m2, verificado_m3
FROM estudiantes
WHERE id <= 11
ORDER BY id;

-- Mix binacional: venezolanos vs colombianos
SELECT tipo_documento, COUNT(*) FROM estudiantes GROUP BY tipo_documento;
