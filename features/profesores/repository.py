from core.database import get_connection
from features.profesores.models import Profesor


def existe_cedula(cedula: str) -> bool:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT 1 FROM profesores WHERE cedula = %s LIMIT 1", (cedula,)
        )
        return cur.fetchone() is not None


def insertar(
    cedula: str, nombre: str, apellido: str,
    especialidad: str, correo_electronico: str,
) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            INSERT INTO profesores (cedula, nombre, apellido, especialidad, correo_electronico)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (cedula, nombre, apellido, especialidad, correo_electronico),
        )


def obtener_todos(solo_activos: bool = False) -> list[Profesor]:
    filtro = "WHERE is_active = TRUE" if solo_activos else ""
    with get_connection() as (_, cur):
        cur.execute(
            f"SELECT id, cedula, nombre, apellido, especialidad, correo_electronico, is_active "
            f"FROM profesores {filtro} ORDER BY apellido, nombre"
        )
        return [Profesor(*fila) for fila in cur.fetchall()]


def actualizar(
    id_prof: int, cedula: str, nombre: str, apellido: str,
    especialidad: str, correo_electronico: str, is_active: bool,
) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE profesores
            SET cedula=%s, nombre=%s, apellido=%s, especialidad=%s,
                correo_electronico=%s, is_active=%s
            WHERE id=%s
            """,
            (cedula, nombre, apellido, especialidad, correo_electronico, is_active, id_prof),
        )


def eliminar(id_prof: int) -> None:
    with get_connection() as (_, cur):
        cur.execute("DELETE FROM profesores WHERE id = %s", (id_prof,))
