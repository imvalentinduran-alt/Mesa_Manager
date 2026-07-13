import psycopg2

from core.database import get_connection
from features.auth.models import Usuario


def insertar(
    cedula: str, nombre: str, apellido: str, hash_pass: str, rol: str, maestria_id: int | None
) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            INSERT INTO usuarios (cedula, nombre, apellido, contrasena, rol, maestria_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (cedula, nombre, apellido, hash_pass, rol, maestria_id),
        )


def buscar_fila_por_cedula(
    cedula: str,
) -> tuple[int, str, str, str, str, int | None] | None:
    """Retorna (id, nombre, apellido, rol, contrasena, maestria_id) o None."""
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, nombre, apellido, rol, contrasena, maestria_id "
            "FROM usuarios WHERE cedula = %s",
            (cedula,),
        )
        return cur.fetchone()


def obtener_todos() -> list[Usuario]:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, cedula, nombre, apellido, rol, maestria_id "
            "FROM usuarios ORDER BY apellido, nombre"
        )
        return [Usuario(*fila) for fila in cur.fetchall()]


def actualizar(id_usr: int, cedula: str, nombre: str, apellido: str, rol: str) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            "UPDATE usuarios SET cedula=%s, nombre=%s, apellido=%s, rol=%s WHERE id=%s",
            (cedula, nombre, apellido, rol, id_usr),
        )


def eliminar(id_usr: int) -> None:
    with get_connection() as (_, cur):
        cur.execute("DELETE FROM usuarios WHERE id = %s", (id_usr,))


def actualizar_contrasena(id_usr: int, nuevo_hash: str) -> None:
    """Reemplaza el hash almacenado. Llamado durante migración SHA-256 → bcrypt."""
    with get_connection() as (_, cur):
        cur.execute(
            "UPDATE usuarios SET contrasena = %s WHERE id = %s",
            (nuevo_hash, id_usr),
        )


def buscar_cedula_en_tablas(cedula: str) -> tuple[str, str, str] | None:
    """Busca la cédula en estudiantes y profesores.
    Retorna (nombre, apellido, tipo) donde tipo es 'Estudiante' o 'Profesor', o None."""
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT nombre, apellido FROM estudiantes WHERE cedula = %s",
            (cedula,),
        )
        fila = cur.fetchone()
        if fila:
            return fila[0], fila[1], "Estudiante"
        cur.execute(
            "SELECT nombre, apellido FROM profesores WHERE cedula = %s",
            (cedula,),
        )
        fila = cur.fetchone()
        if fila:
            return fila[0], fila[1], "Profesor"
        return None
