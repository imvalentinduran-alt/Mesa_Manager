#!/usr/bin/env python3
"""
Seed de demostración para producción (Supabase/Railway).
Inserta: 5 aulas, 25 profesores, 60 estudiantes, 30 mesas.
Usa ON CONFLICT DO NOTHING — no borra datos existentes.
"""
import os, sys
from pathlib import Path

# Cargar .env desde la raíz del proyecto
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from dotenv import load_dotenv
load_dotenv(root / ".env")

import psycopg2

DB = dict(
    host     = os.environ["DB_HOST"],
    port     = int(os.environ["DB_PORT"]),
    user     = os.environ["DB_USER"],
    password = os.environ["DB_PASSWORD"],
    dbname   = os.environ["DB_NAME"],
    sslmode  = "require",
)

# ── Aulas ────────────────────────────────────────────────────────────────────
AULAS = [
    ("Aula de Postgrado A",       "Postgrado",  True),
    ("Aula de Postgrado B",       "Postgrado",  False),
    ("Laboratorio de Informática","Postgrado",  True),
    ("Sala de Conferencias",      "Extensión",  True),
    ("Auditorio Alterno",         "Docencia",   False),
]

# ── Profesores ───────────────────────────────────────────────────────────────
PROFESORES = [
    ("8234561",  "Ana",       "Rodríguez", "Investigación Educativa",          "a.rodriguez@upel.edu.ve"),
    ("9145872",  "Carlos",    "Mendoza",   "Metodología de la Investigación",  "c.mendoza@upel.edu.ve"),
    ("7856943",  "María",     "González",  "Investigación Cualitativa",        "m.gonzalez@upel.edu.ve"),
    ("10234598", "José",      "Ramírez",   "Estadística Educativa",            "j.ramirez@upel.edu.ve"),
    ("12347821", "Luis",      "Pérez",     "Gerencia Educacional",             "l.perez@upel.edu.ve"),
    ("11256734", "Carmen",    "Torres",    "Planificación Educativa",          "c.torres@upel.edu.ve"),
    ("13456789", "Roberto",   "Jiménez",   "Administración Escolar",           "r.jimenez@upel.edu.ve"),
    ("14567890", "Elena",     "Díaz",      "Gerencia de Proyectos",            "e.diaz@upel.edu.ve"),
    ("15678901", "Miguel",    "Suárez",    "Informática Educativa",            "m.suarez@upel.edu.ve"),
    ("16789012", "Patricia",  "Morales",   "Tecnología Educativa",             "p.morales@upel.edu.ve"),
    ("17890123", "Fernando",  "Herrera",   "Diseño Instruccional",             "f.herrera@upel.edu.ve"),
    ("18901234", "Isabel",    "Castillo",  "E-Learning y Entornos Virtuales",  "i.castillo@upel.edu.ve"),
    ("13100001", "Diana",     "Fuentes",   "Innovación Educativa",             "d.fuentes@upel.edu.ve"),
    ("13200002", "Andrés",    "Bermúdez",  "Gerencia Educacional",             "a.bermudez@upel.edu.ve"),
    ("13300003", "Silvia",    "Parra",     "Planificación Global",             "s.parra@upel.edu.ve"),
    ("13400004", "Tomás",     "Aguilar",   "Educación, Ambiente y Desarrollo", "t.aguilar@upel.edu.ve"),
    ("13500005", "Verónica",  "Molina",    "Enseñanza de la Educación Física", "v.molina@upel.edu.ve"),
    ("13600006", "Arturo",    "Rojas",     "Recreación",                       "a.rojas2@upel.edu.ve"),
    ("13700007", "Natalia",   "Cruz",      "Informática Educativa",            "n.cruz@upel.edu.ve"),
    ("13800008", "Ramiro",    "Estrada",   "Orientación Educativa",            "r.estrada@upel.edu.ve"),
    ("13900009", "Ingrid",    "Santos",    "Innovación Educativa",             "i.santos@upel.edu.ve"),
    ("14000010", "Pablo",     "Delgado",   "Gerencia Educacional",             "p.delgado@upel.edu.ve"),
    ("14100011", "Claudia",   "Rivero",    "Planificación Global",             "c.rivero@upel.edu.ve"),
    ("14200012", "Óscar",     "Montoya",   "Educación, Ambiente y Desarrollo", "o.montoya@upel.edu.ve"),
    ("14300013", "Rebeca",    "Navas",     "Enseñanza de la Educación Física", "r.navas2@upel.edu.ve"),
]

# ── Estudiantes ──────────────────────────────────────────────────────────────
# (cedula, nombre, apellido, cod_maestria, cohorte, titulo)
ESTUDIANTES = [
    ("22100001","Valentina","García",    "IE", "2022-I",  "Estrategias digitales en la formación docente"),
    ("22100002","Luis",     "López",     "IE", "2022-II", "Aprendizaje colaborativo mediado por tecnología"),
    ("22100003","Carmen",   "Martínez",  "IE", "2023-I",  "TIC en la evaluación formativa universitaria"),
    ("22100004","Diego",    "Hernández", "IE", "2023-II", "Gamificación y motivación en el aula"),
    ("22100005","Adriana",  "Flores",    "IE", "2021-I",  "Innovación pedagógica en educación a distancia"),
    ("22100006","Rafael",   "Castro",    "IE", "2021-II", "Diseño instruccional basado en competencias"),
    ("22100007","Sofía",    "Reyes",     "IE", "2024-I",  "Aulas invertidas en educación superior"),
    ("22100008","Eduardo",  "Vargas",    "IE", "2022-I",  "Recursos digitales en la educación básica"),
    ("22200001","Mariana",  "Chávez",    "GE", "2022-I",  "Gestión del conocimiento en instituciones educativas"),
    ("22200002","Javier",   "Bravo",     "GE", "2022-II", "Liderazgo educativo y clima organizacional"),
    ("22200003","Paola",    "Salcedo",   "GE", "2023-I",  "Planificación estratégica en escuelas técnicas"),
    ("22200004","Alejandro","Colmenares","GE", "2023-II", "Evaluación institucional y mejora continua"),
    ("22200005","Ingrid",   "Briceño",   "GE", "2021-I",  "Gestión del talento humano docente"),
    ("22200006","Nathaly",  "Dugarte",   "GE", "2021-II", "Modelos de supervisión pedagógica"),
    ("22200007","Carlos",   "Espinoza",  "GE", "2024-I",  "Dirección escolar y calidad educativa"),
    ("22200008","Fernanda", "Fuentes",   "GE", "2022-I",  "Toma de decisiones en gestión educacional"),
    ("22300001","Tomás",    "Gamboa",    "PG", "2022-I",  "Planificación educativa y políticas públicas"),
    ("22300002","Verónica", "Heredia",   "PG", "2022-II", "Planificación curricular en educación media"),
    ("22300003","Arturo",   "Iriarte",   "PG", "2023-I",  "Modelos de planificación en organismos estatales"),
    ("22300004","Natalia",  "Jaspe",     "PG", "2023-II", "Planificación prospectiva en educación"),
    ("22400001","Teresa",   "Peñaloza",  "EAD","2022-I",  "Educación ambiental en comunidades rurales"),
    ("22400002","Guillermo","Quintero",  "EAD","2022-II", "Desarrollo sostenible y currículo escolar"),
    ("22400003","Esperanza","Ruiz",      "EAD","2023-I",  "Formación docente para la educación ambiental"),
    ("22400004","Jorge",    "Suárez",    "EAD","2023-II", "Ecoturismo y educación en parques nacionales"),
    ("22500001","Mireya",   "Landaeta",  "EEF","2022-I",  "Didáctica de la educación física en secundaria"),
    ("22500002","Freddy",   "García",    "EEF","2022-II", "Actividad física y rendimiento académico"),
    ("22500003","Xiomara",  "Martínez",  "EEF","2023-I",  "Deporte escolar y valores humanos"),
    ("22500004","Diana",    "Hernández", "EEF","2023-II", "Métodos de enseñanza en deportes colectivos"),
    ("22600001","Valentina","Ramos",     "REC","2022-I",  "Recreación y bienestar en el adulto mayor"),
    ("22600002","Luis",     "Morales",   "REC","2022-II", "Actividades recreativas en comunidades urbanas"),
    ("22700001","Eduardo",  "Medina",    "INF","2022-I",  "Aulas virtuales y aprendizaje significativo"),
    ("22700002","Mariana",  "Vargas",    "INF","2022-II", "Robótica educativa en educación básica"),
    ("22700003","Javier",   "Guzmán",    "INF","2023-I",  "Inteligencia artificial en la educación"),
    ("22700004","Paola",    "Jiménez",   "INF","2023-II", "Programación como herramienta pedagógica"),
    ("22800001","Carlos",   "Chávez",    "OE", "2022-I",  "Orientación vocacional en bachillerato"),
    ("22800002","Nathaly",  "Acevedo",   "OE", "2022-II", "Consejería educativa y rendimiento académico"),
    ("22800003","Diego",    "Salcedo",   "OE", "2023-I",  "Orientación familiar en contextos de riesgo"),
    ("22800004","Adriana",  "Colmenares","OE", "2023-II", "Habilidades socioemocionales y orientación"),
]

# ── Mesas ────────────────────────────────────────────────────────────────────
# (ced_est, nombre_aula, fecha, hora_inicio, hora_fin, tipo_mesa, estado, veredicto)
MESAS = [
    # Pasadas — variedad de estados
    ("22100001","Aula de Postgrado A",  "2026-06-02","08:00","09:40",1,"Aprobada",        "Aprobado"),
    ("22200001","Aula de Postgrado B",  "2026-06-02","10:00","11:40",1,"Aprobada",        "Aprobado"),
    ("22300001","Sala de Conferencias", "2026-06-02","11:00","12:00",2,"Con_Correcciones","Con_Correcciones"),
    ("22400001","Aula de Postgrado A",  "2026-06-04","08:00","09:40",1,"Aprobada",        "Aprobado"),
    ("22500001","Laboratorio de Informática","2026-06-04","10:00","11:40",1,"Con_Correcciones","Con_Correcciones"),
    ("22600001","Aula de Postgrado A",  "2026-06-05","08:00","09:40",1,"Aprobada",        "Aprobado"),
    ("22700001","Aula de Postgrado B",  "2026-06-05","10:00","11:00",2,"Reprobada",       "Reprobado"),
    ("22800001","Sala de Conferencias", "2026-06-05","11:00","12:40",1,"Suspendida",      None),
    ("22100002","Sala de Conferencias", "2026-06-06","09:00","10:40",1,"Aprobada",        "Aprobado"),
    ("22200002","Aula de Postgrado A",  "2026-06-06","11:00","12:00",2,"Con_Correcciones","Con_Correcciones"),
    # Futuras — Programada
    ("22300002","Aula de Postgrado A",  "2026-06-23","08:00","09:40",1,"Programada",None),
    ("22400002","Aula de Postgrado B",  "2026-06-23","10:00","11:40",1,"Programada",None),
    ("22500002","Aula de Postgrado A",  "2026-06-24","08:00","09:40",1,"Programada",None),
    ("22600002","Aula de Postgrado B",  "2026-06-24","10:00","11:40",1,"Programada",None),
    ("22700002","Sala de Conferencias", "2026-06-24","11:00","12:00",2,"Programada",None),
    ("22800002","Laboratorio de Informática","2026-06-24","11:00","12:40",1,"Programada",None),
    ("22100003","Aula de Postgrado A",  "2026-06-30","09:00","10:40",1,"Programada",None),
    ("22200003","Sala de Conferencias", "2026-06-30","11:00","12:00",1,"Programada",None),
    ("22300003","Sala de Conferencias", "2026-07-07","10:00","11:00",2,"Programada",None),
    ("22400003","Aula de Postgrado B",  "2026-07-07","11:00","12:40",1,"Programada",None),
    ("22500003","Aula de Postgrado A",  "2026-07-08","08:00","09:40",1,"Programada",None),
    ("22600003","Aula de Postgrado B",  "2026-07-08","10:00","11:40",1,"Programada",None),
    ("22700003","Sala de Conferencias", "2026-07-08","11:00","12:00",2,"Programada",None),
    ("22800003","Laboratorio de Informática","2026-07-08","11:00","12:40",1,"Programada",None),
    ("22100004","Laboratorio de Informática","2026-07-14","08:00","09:40",1,"Programada",None),
    ("22200004","Aula de Postgrado A",  "2026-07-14","10:00","11:00",2,"Programada",None),
    ("22300004","Aula de Postgrado A",  "2026-07-21","08:00","09:40",1,"Programada",None),
    ("22400004","Aula de Postgrado B",  "2026-07-21","10:00","11:40",1,"Programada",None),
    ("22500004","Sala de Conferencias", "2026-07-21","11:00","12:40",1,"Programada",None),
    ("22700004","Aula de Postgrado A",  "2026-07-28","10:00","11:00",2,"Programada",None),
]


def run():
    print("Conectando a Supabase...")
    conn = psycopg2.connect(**DB)
    cur  = conn.cursor()

    # 1. Aulas
    for nombre, ubicacion, equipos in AULAS:
        cur.execute(
            "INSERT INTO aulas (nombre_aula, ubicacion, tiene_equipos) "
            "VALUES (%s,%s,%s) ON CONFLICT (nombre_aula) DO NOTHING",
            (nombre, ubicacion, equipos),
        )
    cur.execute("SELECT COUNT(*) FROM aulas")
    print(f"  Aulas en DB: {cur.fetchone()[0]}")

    # 2. Profesores
    for ced, nom, ape, esp, correo in PROFESORES:
        cur.execute(
            "INSERT INTO profesores (cedula,nombre,apellido,especialidad,correo_electronico) "
            "VALUES (%s,%s,%s,%s,%s) ON CONFLICT (cedula) DO NOTHING",
            (ced, nom, ape, esp, correo),
        )
    cur.execute("SELECT COUNT(*) FROM profesores")
    print(f"  Profesores en DB: {cur.fetchone()[0]}")

    # Cargar IDs de profesores y maestrías
    cur.execute("SELECT id FROM profesores ORDER BY id")
    prof_ids = [r[0] for r in cur.fetchall()]
    n = len(prof_ids)

    cur.execute("SELECT codigo_interno, id FROM maestrias")
    maestria_map = {r[0]: r[1] for r in cur.fetchall()}
    if not maestria_map:
        print("  ERROR: No hay maestrías en la BD. Ejecuta la app primero para inicializar las tablas.")
        conn.close()
        return

    # 3. Estudiantes
    insertados_est = 0
    for i, (ced, nom, ape, cod_m, cohorte, titulo) in enumerate(ESTUDIANTES):
        if cod_m not in maestria_map:
            print(f"  SKIP estudiante {ced}: maestría '{cod_m}' no encontrada")
            continue
        correo = f"est{ced}@upel.edu.ve"
        p = [prof_ids[(i + j) % n] for j in range(6)]
        cur.execute(
            "INSERT INTO estudiantes "
            "(cedula,tipo_documento,nombre,apellido,maestria_id,cohorte,titulo_proyecto,"
            "correo_electronico,id_tutor_principal,id_tutor_suplente,"
            "id_jurado1_principal,id_jurado1_suplente,id_jurado2_principal,id_jurado2_suplente) "
            "VALUES (%s,'Venezolano',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) "
            "ON CONFLICT (cedula) DO NOTHING",
            (ced, nom, ape, maestria_map[cod_m], cohorte, titulo, correo,
             p[0], p[1], p[2], p[3], p[4], p[5]),
        )
        if cur.rowcount:
            insertados_est += 1

    cur.execute("SELECT COUNT(*) FROM estudiantes")
    print(f"  Estudiantes en DB: {cur.fetchone()[0]} ({insertados_est} nuevos)")

    # Mapas para mesas
    cur.execute("SELECT cedula, id FROM estudiantes")
    est_map  = {r[0]: r[1] for r in cur.fetchall()}
    cur.execute("SELECT nombre_aula, id FROM aulas")
    aula_map = {r[0]: r[1] for r in cur.fetchall()}

    # 4. Mesas
    insertadas = 0
    for ced_e, nom_a, fecha, hi, hf, tipo, estado, veredicto in MESAS:
        est_id  = est_map.get(ced_e)
        aula_id = aula_map.get(nom_a)
        if not est_id:
            print(f"  SKIP mesa: estudiante {ced_e} no encontrado")
            continue
        if not aula_id:
            print(f"  SKIP mesa: aula '{nom_a}' no encontrada")
            continue
        # Verificar que el estudiante no tenga ya una mesa
        cur.execute("SELECT id FROM mesas_defensa WHERE id_estudiante=%s LIMIT 1", (est_id,))
        if cur.fetchone():
            continue
        cur.execute("SELECT id_tutor_principal,id_tutor_suplente,id_jurado1_principal,"
                    "id_jurado1_suplente,id_jurado2_principal,id_jurado2_suplente "
                    "FROM estudiantes WHERE id=%s", (est_id,))
        profs = cur.fetchone()
        cur.execute(
            "INSERT INTO mesas_defensa "
            "(id_estudiante,id_aula,fecha,hora_inicio,hora_fin,tipo_mesa,estado,veredicto,"
            "id_tutor_principal,id_tutor_suplente,id_jurado1_principal,"
            "id_jurado1_suplente,id_jurado2_principal,id_jurado2_suplente) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (est_id, aula_id, fecha, hi, hf, tipo, estado, veredicto) + profs,
        )
        insertadas += 1

    conn.commit()
    cur.execute("SELECT COUNT(*) FROM mesas_defensa")
    print(f"  Mesas en DB: {cur.fetchone()[0]} ({insertadas} nuevas)")
    cur.close()
    conn.close()
    print("\n✓ Seed completado exitosamente.")


if __name__ == "__main__":
    run()
