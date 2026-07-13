from core.database import get_connection
from features.maestrias.models import Maestria


def obtener_todas() -> list[Maestria]:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, nombre, codigo_interno FROM maestrias ORDER BY nombre"
        )
        return [Maestria(*fila) for fila in cur.fetchall()]


def obtener_por_id(id_maestria: int) -> Maestria | None:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, nombre, codigo_interno FROM maestrias WHERE id = %s",
            (id_maestria,),
        )
        fila = cur.fetchone()
        return Maestria(*fila) if fila else None
