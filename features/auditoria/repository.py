from datetime import date

from core.database import get_connection
from features.auditoria.models import EntradaAuditoria


def insertar(usuario: str, rol: str, accion: str, modulo: str,
             registro_id: int | None, detalle: str) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            INSERT INTO auditoria (usuario, rol, accion, modulo, registro_id, detalle)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (usuario, rol, accion, modulo, registro_id, detalle),
        )


def obtener_todos(
    accion: str | None = None,
    modulo: str | None = None,
    desde:  date | None = None,
    hasta:  date | None = None,
) -> list[EntradaAuditoria]:
    condiciones = []
    params: list = []

    if accion:
        condiciones.append("accion = %s")
        params.append(accion)
    if modulo:
        condiciones.append("modulo = %s")
        params.append(modulo)
    if desde:
        condiciones.append("fecha >= %s")
        params.append(desde)
    if hasta:
        condiciones.append("fecha < (%s::date + INTERVAL '1 day')")
        params.append(hasta)

    where = ("WHERE " + " AND ".join(condiciones)) if condiciones else ""

    with get_connection() as (_, cur):
        cur.execute(
            f"""
            SELECT id, fecha, usuario, rol, accion, modulo, registro_id, detalle
            FROM auditoria
            {where}
            ORDER BY fecha DESC
            LIMIT 1000
            """,
            params,
        )
        return [EntradaAuditoria(*fila) for fila in cur.fetchall()]
