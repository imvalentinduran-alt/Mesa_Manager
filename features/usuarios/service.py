import bcrypt
import psycopg2
import psycopg2.errors

from features.usuarios import repository
from features.usuarios.models import Usuario

_ROLES_VALIDOS = frozenset({"Jefa", "Coordinador"})


def _bcrypt_hash(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def registrar(
    cedula: str,
    nombre: str,
    apellido: str,
    contrasena: str,
    rol: str,
    maestria_id: int | None,
) -> tuple[bool, str]:
    if rol not in _ROLES_VALIDOS:
        return False, "Rol inválido. Use 'Jefa' o 'Coordinador'."
    if rol == "Coordinador" and maestria_id is None:
        return False, "El coordinador debe tener una maestría asignada."
    if rol == "Jefa" and maestria_id is not None:
        return False, "El rol Jefa no puede tener una maestría asignada."
    try:
        repository.insertar(
            cedula, nombre.strip(), apellido.strip(), _bcrypt_hash(contrasena), rol, maestria_id
        )
        return True, f"Usuario '{rol}' registrado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, f"Ya existe un usuario con la cédula {cedula}."
    except psycopg2.Error as e:
        return False, f"Error al registrar usuario: {e}"


def actualizar(
    id_usr: int,
    cedula: str,
    nombre: str,
    apellido: str,
    rol: str,
    maestria_id: int | None,
    contrasena: str | None,
) -> tuple[bool, str]:
    if rol not in _ROLES_VALIDOS:
        return False, "Rol inválido. Use 'Jefa' o 'Coordinador'."
    if rol == "Coordinador" and maestria_id is None:
        return False, "El coordinador debe tener una maestría asignada."
    if rol == "Jefa" and maestria_id is not None:
        return False, "El rol Jefa no puede tener una maestría asignada."
    try:
        hash_pass = _bcrypt_hash(contrasena) if contrasena else None
        repository.actualizar(id_usr, cedula, nombre.strip(), apellido.strip(), rol, maestria_id, hash_pass)
        return True, "Usuario actualizado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, f"Ya existe un usuario con la cédula {cedula}."
    except psycopg2.Error as e:
        return False, f"Error al actualizar usuario: {e}"


def obtener_todos() -> list[Usuario]:
    try:
        return repository.obtener_todos()
    except psycopg2.Error:
        return []


def eliminar(id_usr: int) -> tuple[bool, str]:
    try:
        repository.eliminar(id_usr)
        return True, "Usuario eliminado correctamente."
    except psycopg2.Error as e:
        return False, f"Error al eliminar usuario: {e}"
