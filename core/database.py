from contextlib import contextmanager
from typing import Generator

import psycopg2
import psycopg2.extensions
import psycopg2.pool

from core.config import DB_CONFIG

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def init_pool(minconn: int = 2, maxconn: int = 10) -> None:
    global _pool
    _pool = psycopg2.pool.ThreadedConnectionPool(minconn, maxconn, **DB_CONFIG)


def close_pool() -> None:
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None


@contextmanager
def get_connection() -> Generator[
    tuple[psycopg2.extensions.connection, psycopg2.extensions.cursor],
    None,
    None,
]:
    if _pool is None:
        raise RuntimeError("El pool de conexiones no está inicializado.")
    conn = _pool.getconn()
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()
    except psycopg2.Error:
        conn.rollback()
        raise
    finally:
        cur.close()
        _pool.putconn(conn)
