import hashlib

import psycopg2
import psycopg2.errors

from features.auth import repository
from features.auth.models import Usuario

_ROLES_VALIDOS = frozenset({"Jefa", "Coordinador"})


def _hash(contrasena: str) -> str:
    return hashlib.sha256(contrasena.encode("utf-8")).hexdigest()


def verificar_login(cedula: str, contrasena: str) -> str | None:
    """Retorna el rol si las credenciales son válidas, None si no."""
    try:
        return repository.buscar_credenciales(cedula, _hash(contrasena))
    except psycopg2.Error:
        return None


def registrar(
    cedula: str, nombre: str, apellido: str, contrasena: str, rol: str
) -> tuple[bool, str]:
    if rol not in _ROLES_VALIDOS:
        return False, "Rol inválido. Use 'Jefa' o 'Coordinador'."
    try:
        repository.insertar(cedula, nombre.strip(), apellido.strip(), _hash(contrasena), rol)
        return True, f"Usuario '{rol}' registrado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, f"Ya existe un usuario con la cédula {cedula}."
    except psycopg2.Error as e:
        return False, f"Error al registrar usuario: {e}"


def obtener_todos() -> list[Usuario]:
    try:
        return repository.obtener_todos()
    except psycopg2.Error:
        return []


def actualizar(
    id_usr: int, cedula: str, nombre: str, apellido: str, rol: str
) -> tuple[bool, str]:
    if rol not in _ROLES_VALIDOS:
        return False, "Rol inválido. Use 'Jefa' o 'Coordinador'."
    try:
        repository.actualizar(id_usr, cedula, nombre.strip(), apellido.strip(), rol)
        return True, "Usuario actualizado correctamente."
    except psycopg2.Error as e:
        return False, f"Error al actualizar usuario: {e}"


def eliminar(id_usr: int) -> tuple[bool, str]:
    try:
        repository.eliminar(id_usr)
        return True, "Usuario eliminado correctamente."
    except psycopg2.Error as e:
        return False, f"Error al eliminar usuario: {e}"
