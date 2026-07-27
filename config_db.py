import hashlib
import logging
import os
import sys

import psycopg2
from dotenv import load_dotenv
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

logger = logging.getLogger(__name__)

BASE_CONFIG = {
    "host":     os.environ["DB_HOST"],
    "port":     int(os.getenv("DB_PORT", "5432")),
    "user":     os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "sslmode":  "require",
}

DB_NAME = os.environ["DB_NAME"]

# Orden estricto: tablas referenciadas antes que las que las referencian.
_TABLAS = [
    """
    CREATE TABLE IF NOT EXISTS maestrias (
        id             SERIAL PRIMARY KEY,
        nombre         VARCHAR(100) NOT NULL,
        codigo_interno VARCHAR(10)  UNIQUE NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS usuarios (
        id          SERIAL PRIMARY KEY,
        cedula      VARCHAR(20)  UNIQUE NOT NULL CHECK (cedula ~ '^\\d{7,8}$'),
        nombre      VARCHAR(100) NOT NULL,
        apellido    VARCHAR(100) NOT NULL,
        rol         VARCHAR(20)  NOT NULL CHECK (rol IN ('Jefa', 'Coordinador')),
        contrasena  VARCHAR(72)  NOT NULL,
        maestria_id INT REFERENCES maestrias(id) ON DELETE RESTRICT,
        CONSTRAINT chk_coordinador_maestria CHECK (
            (rol = 'Jefa'        AND maestria_id IS NULL)
            OR
            (rol = 'Coordinador' AND maestria_id IS NOT NULL)
        )
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS profesores (
        id                 SERIAL PRIMARY KEY,
        cedula             VARCHAR(20)  UNIQUE NOT NULL CHECK (cedula ~ '^\\d{7,10}$'),
        nombre             VARCHAR(100) NOT NULL,
        apellido           VARCHAR(100) NOT NULL,
        especialidad       VARCHAR(100) NOT NULL,
        correo_electronico VARCHAR(100) UNIQUE NOT NULL,
        is_active          BOOLEAN      NOT NULL DEFAULT TRUE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS aulas (
        id            SERIAL PRIMARY KEY,
        nombre_aula   VARCHAR(50) NOT NULL,
        ubicacion     VARCHAR(50) NOT NULL
                      CHECK (ubicacion IN ('Doctorado', 'Docencia', 'Extensión', 'Postgrado')),
        tiene_equipos BOOLEAN NOT NULL DEFAULT FALSE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS estudiantes (
        id                 SERIAL PRIMARY KEY,
        cedula             VARCHAR(20) UNIQUE NOT NULL
                           CHECK (cedula ~ '^\\d{7,10}$'),
        tipo_documento     VARCHAR(20)  NOT NULL DEFAULT 'Venezolano',
        pasaporte          VARCHAR(30),
        nombre             VARCHAR(100) NOT NULL,
        apellido           VARCHAR(100) NOT NULL,
        maestria_id        INT          NOT NULL REFERENCES maestrias(id)  ON DELETE RESTRICT,
        cohorte            VARCHAR(20)  NOT NULL,
        titulo_proyecto    TEXT         NOT NULL DEFAULT '',
        correo_electronico VARCHAR(100) NOT NULL,
        id_tutor_principal   INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_tutor_suplente    INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado1_principal INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado1_suplente  INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado2_principal INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado2_suplente  INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        recibo_m1             TEXT,
        monto_m1              DECIMAL(10, 2),
        verificado_m1         BOOLEAN NOT NULL DEFAULT FALSE,
        dia_transferencia_m1  DATE,
        recibo_caja_m1        TEXT,
        recibo_m2             TEXT,
        monto_m2              DECIMAL(10, 2),
        verificado_m2         BOOLEAN NOT NULL DEFAULT FALSE,
        dia_transferencia_m2  DATE,
        recibo_caja_m2        TEXT,
        recibo_m3             TEXT,
        monto_m3              DECIMAL(10, 2),
        verificado_m3         BOOLEAN NOT NULL DEFAULT FALSE,
        dia_transferencia_m3  DATE,
        recibo_caja_m3        TEXT
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS mesas_defensa (
        id            SERIAL PRIMARY KEY,
        id_estudiante INT NOT NULL REFERENCES estudiantes(id) ON DELETE RESTRICT,
        id_aula       INT NOT NULL REFERENCES aulas(id)       ON DELETE RESTRICT,
        fecha         DATE NOT NULL,
        hora_inicio   TIME NOT NULL,
        hora_fin      TIME NOT NULL,
        tipo_mesa     INT  NOT NULL CHECK (tipo_mesa IN (1, 2, 3)),
        estado        VARCHAR(20) NOT NULL DEFAULT 'Programada'
                      CHECK (estado IN (
                          'Programada', 'En_Curso', 'Aprobada',
                          'Con_Correcciones', 'Reprobada', 'Suspendida'
                      )),
        id_tutor_principal   INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_tutor_suplente    INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado1_principal INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado1_suplente  INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado2_principal INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        id_jurado2_suplente  INT NOT NULL REFERENCES profesores(id) ON DELETE RESTRICT,
        tutor_efectivo_id    INT REFERENCES profesores(id),
        jurado1_efectivo_id  INT REFERENCES profesores(id),
        jurado2_efectivo_id  INT REFERENCES profesores(id),
        asistencia_estudiante BOOLEAN NOT NULL DEFAULT FALSE,
        iniciada_por_profesor_id INT REFERENCES profesores(id),
        veredicto                     VARCHAR(20)
                                      CHECK (veredicto IN ('Aprobado', 'Con_Correcciones', 'Reprobado')),
        dias_correccion               INT  DEFAULT 15,
        fecha_limite_correccion       DATE,
        fecha_validacion_correcciones DATE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS auditoria (
        id          SERIAL PRIMARY KEY,
        fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        usuario     VARCHAR(100) NOT NULL,
        rol         VARCHAR(20)  NOT NULL,
        accion      VARCHAR(30)  NOT NULL,
        modulo      VARCHAR(50)  NOT NULL,
        registro_id INTEGER,
        detalle     TEXT
    );
    """,
]

_INDICES = [
    "CREATE INDEX IF NOT EXISTS idx_estudiantes_maestria ON estudiantes(maestria_id);",
    "CREATE INDEX IF NOT EXISTS idx_mesas_estudiante ON mesas_defensa(id_estudiante);",
    "CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);",
]

# Migraciones para BD existentes (idempotentes con IF NOT EXISTS).
_MIGRACIONES = [
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS dia_transferencia_m1 DATE;",
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS recibo_caja_m1       TEXT;",
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS dia_transferencia_m2 DATE;",
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS recibo_caja_m2       TEXT;",
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS dia_transferencia_m3 DATE;",
    "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS recibo_caja_m3       TEXT;",
]

# DROP en orden inverso al de creación (respeta FKs; CASCADE para FK residuales).
_TABLAS_A_ELIMINAR = [
    "mesas_defensa",
    "estudiantes",
    "usuarios",
    "aulas",
    "profesores",
    "maestrias",
]

_MAESTRIAS_SEED = [
    ("Innovación Educativa",             "IE"),
    ("Gerencia Educacional",             "GE"),
    ("Planificación Global",             "PG"),
    ("Educación, Ambiente y Desarrollo", "EAD"),
    ("Enseñanza de la Educación Física", "EEF"),
    ("Recreación",                       "REC"),
    ("Informática Educativa",            "INF"),
    ("Orientación Educativa",            "OE"),
]

# Coordinadores de prueba: uno por maestría (cédulas 00000001–00000008).
# Contraseña genérica: coordinador123
_COORDINADORES_PRUEBA = [
    ("00000001", "Prueba", "IE"),
    ("00000002", "Prueba", "GE"),
    ("00000003", "Prueba", "PG"),
    ("00000004", "Prueba", "EAD"),
    ("00000005", "Prueba", "EEF"),
    ("00000006", "Prueba", "REC"),
    ("00000007", "Prueba", "INF"),
    ("00000008", "Prueba", "OE"),
]

# 24 profesores de prueba con correos institucionales únicos.
_PROFESORES_SEED = [
    # (cedula, nombre, apellido, especialidad, correo_electronico)
    ("10123456", "Ana",       "Rodríguez",  "Innovación Educativa",             "a.rodriguez@upel.edu.ve"),
    ("10234567", "Carlos",    "Mendoza",    "Gerencia Educacional",             "c.mendoza@upel.edu.ve"),
    ("10345678", "María",     "González",   "Planificación Global",             "m.gonzalez@upel.edu.ve"),
    ("10456789", "Luis",      "Pérez",      "Educación, Ambiente y Desarrollo", "l.perez@upel.edu.ve"),
    ("10567890", "Carmen",    "Jiménez",    "Enseñanza de la Educación Física", "c.jimenez@upel.edu.ve"),
    ("10678901", "José",      "Vargas",     "Recreación",                       "j.vargas@upel.edu.ve"),
    ("10789012", "Rosa",      "Castillo",   "Informática Educativa",            "r.castillo@upel.edu.ve"),
    ("10890123", "Pedro",     "Herrera",    "Orientación Educativa",            "p.herrera@upel.edu.ve"),
    ("11012345", "Yolanda",   "Torres",     "Innovación Educativa",             "y.torres@upel.edu.ve"),
    ("11123456", "Miguel",    "Ramos",      "Gerencia Educacional",             "m.ramos@upel.edu.ve"),
    ("11234567", "Gloria",    "Morales",    "Planificación Global",             "g.morales@upel.edu.ve"),
    ("11345678", "Roberto",   "Díaz",       "Educación, Ambiente y Desarrollo", "r.diaz@upel.edu.ve"),
    ("11456789", "Patricia",  "Suárez",     "Enseñanza de la Educación Física", "p.suarez@upel.edu.ve"),
    ("11567890", "Fernando",  "León",       "Recreación",                       "f.leon@upel.edu.ve"),
    ("11678901", "Adriana",   "Soto",       "Informática Educativa",            "a.soto@upel.edu.ve"),
    ("11789012", "Héctor",    "Núñez",      "Orientación Educativa",            "h.nunez@upel.edu.ve"),
    ("11890123", "Beatriz",   "Fernández",  "Innovación Educativa",             "b.fernandez@upel.edu.ve"),
    ("12012345", "Enrique",   "Salazar",    "Gerencia Educacional",             "e.salazar@upel.edu.ve"),
    ("12123456", "Nelly",     "Gutiérrez",  "Planificación Global",             "n.gutierrez@upel.edu.ve"),
    ("12234567", "Ramón",     "Medina",     "Educación, Ambiente y Desarrollo", "r.medina@upel.edu.ve"),
    ("12345678", "Luisa",     "Contreras",  "Enseñanza de la Educación Física", "l.contreras@upel.edu.ve"),
    ("12456789", "Alejandro", "Reyes",      "Recreación",                       "a.reyes@upel.edu.ve"),
    ("12567890", "Cristina",  "Lara",       "Informática Educativa",            "c.lara@upel.edu.ve"),
    ("12678901", "Víctor",    "Espinoza",   "Orientación Educativa",            "v.espinoza@upel.edu.ve"),
]


def _insertar_seeds(cursor: psycopg2.extensions.cursor) -> None:
    # ── Maestrías ──────────────────────────────────────────────────────────
    for nombre, codigo in _MAESTRIAS_SEED:
        cursor.execute(
            "INSERT INTO maestrias (nombre, codigo_interno) VALUES (%s, %s) "
            "ON CONFLICT (codigo_interno) DO NOTHING",
            (nombre, codigo),
        )

    # ── Jefa administradora ────────────────────────────────────────────────
    pass_jefa = hashlib.sha256(os.environ.get("SEED_PASS_JEFA", "admin123").encode("utf-8")).hexdigest()
    cursor.execute(
        "INSERT INTO usuarios (cedula, nombre, apellido, rol, contrasena, maestria_id) "
        "VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (cedula) DO NOTHING",
        ("00000000", "Jefa", "Administradora", "Jefa", pass_jefa, None),
    )

    # ── Coordinador real (cedula 32785839, maestría IE) ────────────────────
    pass_coord = hashlib.sha256(os.environ.get("SEED_PASS_COORD", "123412").encode("utf-8")).hexdigest()
    cursor.execute("SELECT id FROM maestrias WHERE codigo_interno = %s", ("IE",))
    maestria_ie = cursor.fetchone()
    if maestria_ie:
        cursor.execute(
            "INSERT INTO usuarios (cedula, nombre, apellido, rol, contrasena, maestria_id) "
            "VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (cedula) DO UPDATE "
            "SET contrasena = EXCLUDED.contrasena",
            ("32785839", "Coordinador", "Sistema", "Coordinador", pass_coord, maestria_ie[0]),
        )

    # ── Coordinadores de prueba (uno por maestría) ─────────────────────────
    pass_prueba = hashlib.sha256(os.environ.get("SEED_PASS_PRUEBA", "coordinador123").encode("utf-8")).hexdigest()
    for cedula, apellido, codigo in _COORDINADORES_PRUEBA:
        cursor.execute(
            "SELECT id FROM maestrias WHERE codigo_interno = %s", (codigo,)
        )
        fila = cursor.fetchone()
        if not fila:
            continue
        cursor.execute(
            "INSERT INTO usuarios (cedula, nombre, apellido, rol, contrasena, maestria_id) "
            "VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (cedula) DO NOTHING",
            (cedula, "Coordinador", apellido, "Coordinador", pass_prueba, fila[0]),
        )
    # ── Profesores ─────────────────────────────────────────────────────────────
    for cedula, nombre, apellido, especialidad, correo in _PROFESORES_SEED:
        cursor.execute(
            "INSERT INTO profesores (cedula, nombre, apellido, especialidad, correo_electronico) "
            "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (cedula) DO NOTHING",
            (cedula, nombre, apellido, especialidad, correo),
        )
    logger.info("Seeds insertados: Jefa + Coordinador real + 8 coordinadores de prueba + 24 profesores.")


def crear_base_de_datos() -> None:
    """Crea la base de datos si no existe. Solo se llama desde __main__."""
    try:
        conn = psycopg2.connect(**BASE_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,)
        )
        if not cursor.fetchone():
            cursor.execute(f"CREATE DATABASE {DB_NAME} WITH ENCODING 'UTF8';")
            logger.info("Base de datos '%s' creada.", DB_NAME)
        else:
            logger.info("Base de datos '%s' ya existe.", DB_NAME)
        cursor.close()
        conn.close()
    except psycopg2.OperationalError as e:
        logger.error("No se pudo conectar a PostgreSQL: %s", e)
        sys.exit(1)


def inicializar_tablas() -> None:
    """Crea tablas e inserta seeds. Llamada al arrancar la API."""
    config = {**BASE_CONFIG, "database": DB_NAME}
    try:
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        for ddl in _TABLAS:
            cursor.execute(ddl)
        for ddl in _INDICES:
            cursor.execute(ddl)
        for ddl in _MIGRACIONES:
            cursor.execute(ddl)
        _insertar_seeds(cursor)
        conn.commit()
        logger.info("Tablas inicializadas correctamente.")
        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        logger.error("Error al inicializar tablas: %s", e)
        raise


def limpiar_y_recrear() -> None:
    """Elimina todas las tablas y las recrea desde cero. Solo para desarrollo."""
    config = {**BASE_CONFIG, "database": DB_NAME}
    try:
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        for tabla in _TABLAS_A_ELIMINAR:
            cursor.execute(f"DROP TABLE IF EXISTS {tabla} CASCADE")
            logger.info("Tabla '%s' eliminada.", tabla)
        conn.commit()
        cursor.close()
        conn.close()
        inicializar_tablas()
        logger.info("Esquema recreado limpiamente.")
    except psycopg2.Error as e:
        logger.error("Error al limpiar y recrear: %s", e)
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    crear_base_de_datos()
    if "--recrear" in sys.argv:
        limpiar_y_recrear()
    else:
        inicializar_tablas()
