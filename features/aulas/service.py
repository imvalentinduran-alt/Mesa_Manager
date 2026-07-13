import psycopg2
import psycopg2.errors

from features.aulas import repository
from features.aulas.models import Aula

_UBICACIONES_VALIDAS = frozenset({"Doctorado", "Docencia", "Extensión", "Postgrado"})


def registrar(
    nombre_aula: str, ubicacion: str, tiene_equipos: bool
) -> tuple[bool, str]:
    if ubicacion not in _UBICACIONES_VALIDAS:
        return False, f"Ubicación inválida: '{ubicacion}'."
    try:
        repository.insertar(nombre_aula.strip(), ubicacion, tiene_equipos)
        return True, "Aula registrada correctamente."
    except psycopg2.Error as e:
        return False, f"Error al registrar aula: {e}"


def obtener_todas() -> list[Aula]:
    try:
        return repository.obtener_todas()
    except psycopg2.Error:
        return []


def actualizar(
    id_aula: int, nombre_aula: str, ubicacion: str, tiene_equipos: bool
) -> tuple[bool, str]:
    if ubicacion not in _UBICACIONES_VALIDAS:
        return False, f"Ubicación inválida: '{ubicacion}'."
    try:
        repository.actualizar(id_aula, nombre_aula.strip(), ubicacion, tiene_equipos)
        return True, "Aula actualizada correctamente."
    except psycopg2.Error as e:
        return False, f"Error al actualizar aula: {e}"


def eliminar(id_aula: int) -> tuple[bool, str]:
    try:
        repository.eliminar(id_aula)
        return True, "Aula eliminada correctamente."
    except psycopg2.errors.ForeignKeyViolation:
        return False, "No se puede eliminar: el aula tiene mesas de defensa asignadas."
    except psycopg2.Error as e:
        return False, f"Error al eliminar aula: {e}"
