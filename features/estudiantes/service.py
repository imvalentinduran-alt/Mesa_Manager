import psycopg2
import psycopg2.errors

from features.estudiantes import repository
from features.estudiantes.models import Estudiante


def _validar_comite_unico(
    id_tutor_principal: int, id_tutor_suplente: int,
    id_jurado1_principal: int, id_jurado1_suplente: int,
    id_jurado2_principal: int, id_jurado2_suplente: int,
) -> None:
    ids = [
        id_tutor_principal, id_tutor_suplente,
        id_jurado1_principal, id_jurado1_suplente,
        id_jurado2_principal, id_jurado2_suplente,
    ]
    if len(set(ids)) < 6:
        raise ValueError("Todos los miembros del comité deben ser profesores distintos.")


def existe_documento(numero: str) -> bool:
    try:
        return repository.existe_documento(numero)
    except psycopg2.Error:
        return False


def pertenece_a_maestria(id_est: int, maestria_id: int) -> bool:
    try:
        return repository.existe_en_maestria(id_est, maestria_id)
    except psycopg2.Error:
        return False


def registrar(
    cedula: str, tipo_documento: str, nombre: str, apellido: str,
    maestria_id: int, cohorte: str, titulo_proyecto: str, correo_electronico: str,
    id_tutor_principal: int, id_tutor_suplente: int,
    id_jurado1_principal: int, id_jurado1_suplente: int,
    id_jurado2_principal: int, id_jurado2_suplente: int,
    pasaporte: str | None = None,
) -> tuple[bool, str]:
    try:
        _validar_comite_unico(
            id_tutor_principal, id_tutor_suplente,
            id_jurado1_principal, id_jurado1_suplente,
            id_jurado2_principal, id_jurado2_suplente,
        )
        repository.insertar(
            cedula, tipo_documento, nombre, apellido,
            maestria_id, cohorte, titulo_proyecto, correo_electronico,
            id_tutor_principal, id_tutor_suplente,
            id_jurado1_principal, id_jurado1_suplente,
            id_jurado2_principal, id_jurado2_suplente,
            pasaporte,
        )
        return True, "Estudiante registrado correctamente."
    except ValueError as e:
        return False, str(e)
    except psycopg2.errors.UniqueViolation:
        return False, f"Ya existe un estudiante con la identificación {cedula}."
    except psycopg2.errors.ForeignKeyViolation:
        return False, "Uno o más IDs del comité o la maestría no existen."
    except psycopg2.Error as e:
        return False, f"Error al registrar estudiante: {e}"


def obtener_todos(maestria_id: int | None = None) -> list[Estudiante]:
    try:
        return repository.obtener_todos(maestria_id)
    except psycopg2.Error:
        return []


def obtener_para_mesa(maestria_id: int, numero_mesa: int) -> list[Estudiante]:
    try:
        return repository.obtener_para_mesa(maestria_id, numero_mesa)
    except psycopg2.Error:
        return []


def actualizar(
    id_est: int, cedula: str, tipo_documento: str, nombre: str, apellido: str,
    cohorte: str, titulo_proyecto: str, correo_electronico: str,
    pasaporte: str | None = None,
) -> tuple[bool, str]:
    try:
        repository.actualizar(
            id_est, cedula, tipo_documento, nombre, apellido,
            cohorte, titulo_proyecto, correo_electronico,
            pasaporte,
        )
        return True, "Estudiante actualizado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, f"Ya existe otro estudiante con la identificación {cedula}."
    except psycopg2.Error as e:
        return False, f"Error al actualizar estudiante: {e}"


def actualizar_solvencia(
    id_est: int, numero_mesa: int, recibo: str, monto: float,
    dia_transferencia: object, recibo_caja: str,
) -> tuple[bool, str]:
    if numero_mesa not in (1, 2, 3):
        return False, "El número de mesa debe ser 1, 2 o 3."
    try:
        repository.actualizar_solvencia(id_est, numero_mesa, recibo, monto, dia_transferencia, recibo_caja)
        return True, f"Solvencia de mesa {numero_mesa} registrada correctamente."
    except psycopg2.Error as e:
        return False, f"Error al actualizar solvencia: {e}"


def eliminar(id_est: int) -> tuple[bool, str]:
    try:
        repository.eliminar(id_est)
        return True, "Estudiante eliminado correctamente."
    except psycopg2.errors.ForeignKeyViolation:
        return False, "No se puede eliminar: el estudiante tiene mesas de defensa asignadas."
    except psycopg2.Error as e:
        return False, f"Error al eliminar estudiante: {e}"
