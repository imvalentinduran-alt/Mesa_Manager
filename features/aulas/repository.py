from core.database import get_connection
from features.aulas.models import Aula


def insertar(nombre_aula: str, ubicacion: str, tiene_equipos: bool) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            INSERT INTO aulas (nombre_aula, ubicacion, tiene_equipos)
            VALUES (%s, %s, %s)
            """,
            (nombre_aula, ubicacion, tiene_equipos),
        )


def obtener_todas() -> list[Aula]:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, nombre_aula, ubicacion, tiene_equipos "
            "FROM aulas ORDER BY nombre_aula"
        )
        return [Aula(*fila) for fila in cur.fetchall()]


def actualizar(
    id_aula: int, nombre_aula: str, ubicacion: str, tiene_equipos: bool
) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE aulas
            SET nombre_aula=%s, ubicacion=%s, tiene_equipos=%s
            WHERE id=%s
            """,
            (nombre_aula, ubicacion, tiene_equipos, id_aula),
        )


def eliminar(id_aula: int) -> None:
    with get_connection() as (_, cur):
        cur.execute("DELETE FROM aulas WHERE id = %s", (id_aula,))
