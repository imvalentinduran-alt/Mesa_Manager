import psycopg2
import psycopg2.errors

from features.profesores import repository
from features.profesores.models import Profesor


def existe_cedula(cedula: str) -> bool:
    try:
        return repository.existe_cedula(cedula)
    except psycopg2.Error:
        return False


def registrar(
    cedula: str, nombre: str, apellido: str, especialidad: str,
    correo_electronico: str,
) -> tuple[bool, str]:
    try:
        repository.insertar(
            cedula, nombre.strip(), apellido.strip(),
            especialidad.strip(), correo_electronico.strip(),
        )
        return True, "Profesor registrado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, "Ya existe un profesor con esa cédula o correo electrónico."
    except psycopg2.Error as e:
        return False, f"Error al registrar profesor: {e}"


def obtener_todos(solo_activos: bool = False) -> list[Profesor]:
    try:
        return repository.obtener_todos(solo_activos=solo_activos)
    except psycopg2.Error:
        return []


def actualizar(
    id_prof: int, cedula: str, nombre: str, apellido: str,
    especialidad: str, correo_electronico: str, is_active: bool = True,
) -> tuple[bool, str]:
    try:
        repository.actualizar(
            id_prof, cedula, nombre.strip(), apellido.strip(),
            especialidad.strip(), correo_electronico.strip(), is_active,
        )
        return True, "Profesor actualizado correctamente."
    except psycopg2.errors.UniqueViolation:
        return False, "Ya existe otro profesor con esa cédula o correo electrónico."
    except psycopg2.Error as e:
        return False, f"Error al actualizar profesor: {e}"


def eliminar(id_prof: int) -> tuple[bool, str]:
    try:
        repository.eliminar(id_prof)
        return True, "Profesor eliminado correctamente."
    except psycopg2.errors.ForeignKeyViolation:
        return False, "No se puede eliminar: el profesor tiene mesas de defensa asignadas."
    except psycopg2.Error as e:
        return False, f"Error al eliminar profesor: {e}"
