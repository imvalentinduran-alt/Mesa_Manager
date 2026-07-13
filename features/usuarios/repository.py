import psycopg2

from core.database import get_connection
from features.usuarios.models import Usuario


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


def obtener_todos() -> list[Usuario]:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, cedula, nombre, apellido, rol, maestria_id "
            "FROM usuarios ORDER BY apellido, nombre"
        )
        return [Usuario(*fila) for fila in cur.fetchall()]


def actualizar(
    id_usr: int,
    cedula: str,
    nombre: str,
    apellido: str,
    rol: str,
    maestria_id: int | None,
    hash_pass: str | None,
) -> None:
    with get_connection() as (_, cur):
        if hash_pass is not None:
            cur.execute(
                """
                UPDATE usuarios
                SET cedula=%s, nombre=%s, apellido=%s, rol=%s, maestria_id=%s, contrasena=%s
                WHERE id=%s
                """,
                (cedula, nombre, apellido, rol, maestria_id, hash_pass, id_usr),
            )
        else:
            cur.execute(
                """
                UPDATE usuarios
                SET cedula=%s, nombre=%s, apellido=%s, rol=%s, maestria_id=%s
                WHERE id=%s
                """,
                (cedula, nombre, apellido, rol, maestria_id, id_usr),
            )


def eliminar(id_usr: int) -> None:
    with get_connection() as (_, cur):
        cur.execute("DELETE FROM usuarios WHERE id = %s", (id_usr,))
