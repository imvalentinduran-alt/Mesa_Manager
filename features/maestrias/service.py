import psycopg2

from features.maestrias import repository
from features.maestrias.models import Maestria


def obtener_todas() -> list[Maestria]:
    try:
        return repository.obtener_todas()
    except psycopg2.Error:
        return []
