import psycopg2

from core.database import get_connection
from features.estudiantes.models import Estudiante

# Orden idéntico al de las columnas en la tabla (necesario para Estudiante(*fila)).
_COLS_SELECT = (
    "id", "cedula", "tipo_documento", "nombre", "apellido",
    "maestria_id", "cohorte", "titulo_proyecto", "correo_electronico",
    "id_tutor_principal", "id_tutor_suplente",
    "id_jurado1_principal", "id_jurado1_suplente",
    "id_jurado2_principal", "id_jurado2_suplente",
    "recibo_m1", "monto_m1", "verificado_m1",
    "recibo_m2", "monto_m2", "verificado_m2",
    "recibo_m3", "monto_m3", "verificado_m3",
    "dia_transferencia_m1", "recibo_caja_m1",
    "dia_transferencia_m2", "recibo_caja_m2",
    "dia_transferencia_m3", "recibo_caja_m3",
    "pasaporte",
)

_SELECT_BASE = f"SELECT {', '.join(_COLS_SELECT)} FROM estudiantes"


def existe_documento(numero: str) -> bool:
    with get_connection() as (_, cur):
        cur.execute("SELECT 1 FROM estudiantes WHERE cedula = %s LIMIT 1", (numero,))
        return cur.fetchone() is not None


def existe_en_maestria(id_est: int, maestria_id: int) -> bool:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT 1 FROM estudiantes WHERE id = %s AND maestria_id = %s",
            (id_est, maestria_id),
        )
        return cur.fetchone() is not None


def insertar(
    cedula: str, tipo_documento: str, nombre: str, apellido: str,
    maestria_id: int, cohorte: str, titulo_proyecto: str, correo_electronico: str,
    id_tutor_principal: int, id_tutor_suplente: int,
    id_jurado1_principal: int, id_jurado1_suplente: int,
    id_jurado2_principal: int, id_jurado2_suplente: int,
    pasaporte: str | None = None,
) -> None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            INSERT INTO estudiantes (
                cedula, tipo_documento, nombre, apellido,
                maestria_id, cohorte, titulo_proyecto, correo_electronico,
                id_tutor_principal, id_tutor_suplente,
                id_jurado1_principal, id_jurado1_suplente,
                id_jurado2_principal, id_jurado2_suplente,
                pasaporte
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """,
            (
                cedula, tipo_documento, nombre, apellido,
                maestria_id, cohorte, titulo_proyecto, correo_electronico,
                id_tutor_principal, id_tutor_suplente,
                id_jurado1_principal, id_jurado1_suplente,
                id_jurado2_principal, id_jurado2_suplente,
                pasaporte,
            ),
        )


def obtener_todos(maestria_id: int | None = None) -> list[Estudiante]:
    if maestria_id is not None:
        sql = _SELECT_BASE + " WHERE maestria_id = %s ORDER BY apellido, nombre"
        with get_connection() as (_, cur):
            cur.execute(sql, (maestria_id,))
            return [Estudiante(*fila) for fila in cur.fetchall()]
    with get_connection() as (_, cur):
        cur.execute(_SELECT_BASE + " ORDER BY apellido, nombre")
        return [Estudiante(*fila) for fila in cur.fetchall()]


def obtener_para_mesa(maestria_id: int, numero_mesa: int) -> list[Estudiante]:
    """Estudiantes de la maestría con solvencia verificada para la mesa N."""
    col_verificado = f"verificado_m{numero_mesa}"
    sql = (
        f"{_SELECT_BASE} WHERE maestria_id = %s AND {col_verificado} = TRUE"
        " ORDER BY apellido, nombre"
    )
    with get_connection() as (_, cur):
        cur.execute(sql, (maestria_id,))
        return [Estudiante(*fila) for fila in cur.fetchall()]


def actualizar(
    id_est: int, cedula: str, tipo_documento: str, nombre: str, apellido: str,
    cohorte: str, titulo_proyecto: str, correo_electronico: str,
    pasaporte: str | None = None,
) -> None:
    # Los 6 FK del comité no se incluyen — son inmutables por resolución.
    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE estudiantes SET
                cedula=%s, tipo_documento=%s, nombre=%s, apellido=%s,
                cohorte=%s, titulo_proyecto=%s, correo_electronico=%s,
                pasaporte=%s
            WHERE id=%s
            """,
            (
                cedula, tipo_documento, nombre, apellido,
                cohorte, titulo_proyecto, correo_electronico,
                pasaporte, id_est,
            ),
        )


def actualizar_solvencia(
    id_est: int, numero_mesa: int, recibo: str, monto: float,
    dia_transferencia: object, recibo_caja: str,
) -> None:
    # numero_mesa validado en el service (1, 2 o 3), seguro usar en f-string.
    col_r  = f"recibo_m{numero_mesa}"
    col_m  = f"monto_m{numero_mesa}"
    col_v  = f"verificado_m{numero_mesa}"
    col_dt = f"dia_transferencia_m{numero_mesa}"
    col_rc = f"recibo_caja_m{numero_mesa}"
    with get_connection() as (_, cur):
        cur.execute(
            f"UPDATE estudiantes SET {col_r}=%s, {col_m}=%s, {col_v}=TRUE, "
            f"{col_dt}=%s, {col_rc}=%s WHERE id=%s",
            (recibo, monto, dia_transferencia, recibo_caja, id_est),
        )


def eliminar(id_est: int) -> None:
    with get_connection() as (_, cur):
        cur.execute("DELETE FROM estudiantes WHERE id = %s", (id_est,))
