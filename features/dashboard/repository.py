import psycopg2

from core.database import get_connection
from features.dashboard.models import DefensaReciente, DefensaReporte, DiaActividad, KPIs, MesaPendienteCierre, ProximaMesa

_ESTADOS_CONCLUIDOS = ("Aprobada", "Con_Correcciones", "Reprobada")

_SQL_RECIENTES = """
    SELECT
        m.id,
        e.apellido  || ', ' || e.nombre   AS estudiante,
        e.cedula,
        COALESCE(e.titulo_proyecto, '')    AS titulo,
        TO_CHAR(m.fecha,       'DD/MM/YYYY') AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')    AS hora_inicio,
        a.nombre_aula                      AS aula,
        pt.apellido  || ', ' || pt.nombre  AS tutor,
        pj1.apellido || ', ' || pj1.nombre AS jurado1,
        pj2.apellido || ', ' || pj2.nombre AS jurado2,
        m.estado
    FROM  mesas_defensa  m
    JOIN  estudiantes    e    ON e.id   = m.id_estudiante
    JOIN  profesores     pt   ON pt.id  = m.id_tutor_principal
    JOIN  profesores     pj1  ON pj1.id = m.id_jurado1_principal
    JOIN  profesores     pj2  ON pj2.id = m.id_jurado2_principal
    JOIN  aulas          a    ON a.id   = m.id_aula
    WHERE m.estado IN %s
"""


def contar_historico(maestria_id: int | None = None) -> int:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT COUNT(*) FROM mesas_defensa m
                JOIN estudiantes e ON e.id = m.id_estudiante
                WHERE m.estado IN %s AND e.maestria_id = %s
                """,
                (_ESTADOS_CONCLUIDOS, maestria_id),
            )
        else:
            cur.execute(
                "SELECT COUNT(*) FROM mesas_defensa WHERE estado IN %s",
                (_ESTADOS_CONCLUIDOS,),
            )
        return cur.fetchone()[0]


def contar_mes_actual(maestria_id: int | None = None) -> int:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT COUNT(*) FROM mesas_defensa m
                JOIN estudiantes e ON e.id = m.id_estudiante
                WHERE DATE_TRUNC('month', m.fecha) = DATE_TRUNC('month', CURRENT_DATE)
                  AND m.estado != 'Suspendida'
                  AND e.maestria_id = %s
                """,
                (maestria_id,),
            )
        else:
            cur.execute(
                """
                SELECT COUNT(*) FROM mesas_defensa
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
                  AND estado != 'Suspendida'
                """
            )
        return cur.fetchone()[0]


def calcular_tasa_aprobacion(maestria_id: int | None = None) -> float:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE m.estado = 'Aprobada') AS aprobadas,
                    COUNT(*)                                       AS total
                FROM mesas_defensa m
                JOIN estudiantes e ON e.id = m.id_estudiante
                WHERE m.estado IN %s AND e.maestria_id = %s
                """,
                (_ESTADOS_CONCLUIDOS, maestria_id),
            )
        else:
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE estado = 'Aprobada') AS aprobadas,
                    COUNT(*)                                     AS total
                FROM mesas_defensa
                WHERE estado IN %s
                """,
                (_ESTADOS_CONCLUIDOS,),
            )
        aprobadas, total = cur.fetchone()
        if not total:
            return 0.0
        return round((aprobadas / total) * 100, 1)


def contar_estudiantes(maestria_id: int | None = None) -> int:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                "SELECT COUNT(*) FROM estudiantes WHERE maestria_id = %s",
                (maestria_id,),
            )
        else:
            cur.execute("SELECT COUNT(*) FROM estudiantes")
        return cur.fetchone()[0]


def contar_mes_anterior(maestria_id: int | None = None) -> int:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT COUNT(*) FROM mesas_defensa m
                JOIN estudiantes e ON e.id = m.id_estudiante
                WHERE DATE_TRUNC('month', m.fecha) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND m.estado != 'Suspendida'
                  AND e.maestria_id = %s
                """,
                (maestria_id,),
            )
        else:
            cur.execute(
                """
                SELECT COUNT(*) FROM mesas_defensa
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND estado != 'Suspendida'
                """
            )
        return cur.fetchone()[0]


def calcular_tasa_anterior(maestria_id: int | None = None) -> float:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE m.estado = 'Aprobada') AS aprobadas,
                    COUNT(*)                                       AS total
                FROM mesas_defensa m
                JOIN estudiantes e ON e.id = m.id_estudiante
                WHERE DATE_TRUNC('month', m.fecha) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND m.estado IN %s AND e.maestria_id = %s
                """,
                (_ESTADOS_CONCLUIDOS, maestria_id),
            )
        else:
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE estado = 'Aprobada') AS aprobadas,
                    COUNT(*)                                     AS total
                FROM mesas_defensa
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND estado IN %s
                """,
                (_ESTADOS_CONCLUIDOS,),
            )
        aprobadas, total = cur.fetchone()
        if not total:
            return 0.0
        return round((aprobadas / total) * 100, 1)


def contar_estudiantes_mes(maestria_id: int | None = None) -> int:
    """Estudiantes creados este mes, según la tabla de auditoría."""
    with get_connection() as (_, cur):
        cur.execute(
            """
            SELECT COUNT(*) FROM auditoria
            WHERE accion = 'CREAR'
              AND modulo = 'Estudiantes'
              AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
            """
        )
        return cur.fetchone()[0]


def obtener_actividad(dias: int = 126, maestria_id: int | None = None) -> list[DiaActividad]:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                """
                SELECT m.fecha::text, COUNT(*) AS count
                FROM   mesas_defensa m
                JOIN   estudiantes e ON e.id = m.id_estudiante
                WHERE  m.fecha >= CURRENT_DATE - INTERVAL '1 day' * %s
                  AND  m.estado != 'Suspendida'
                  AND  e.maestria_id = %s
                GROUP  BY m.fecha
                ORDER  BY m.fecha
                """,
                (dias, maestria_id),
            )
        else:
            cur.execute(
                """
                SELECT fecha::text, COUNT(*) AS count
                FROM   mesas_defensa
                WHERE  fecha >= CURRENT_DATE - INTERVAL '1 day' * %s
                  AND  estado != 'Suspendida'
                GROUP  BY fecha
                ORDER  BY fecha
                """,
                (dias,),
            )
        return [DiaActividad(fecha=row[0], count=row[1]) for row in cur.fetchall()]


_SQL_PROXIMAS = """
    SELECT
        m.id,
        e.apellido || ', ' || e.nombre        AS estudiante,
        COALESCE(e.titulo_proyecto, '')        AS titulo,
        m.fecha::text                          AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')     AS hora_inicio,
        TO_CHAR(m.hora_fin,    'HH24:MI')     AS hora_fin,
        a.nombre_aula                          AS aula,
        m.tipo_mesa,
        m.estado,
        pt.apellido  || ', ' || pt.nombre      AS tutor,
        pj1.apellido || ', ' || pj1.nombre     AS jurado1,
        pj2.apellido || ', ' || pj2.nombre     AS jurado2
    FROM  mesas_defensa m
    JOIN  estudiantes   e    ON e.id   = m.id_estudiante
    JOIN  aulas         a    ON a.id   = m.id_aula
    JOIN  profesores    pt   ON pt.id  = m.id_tutor_principal
    JOIN  profesores    pj1  ON pj1.id = m.id_jurado1_principal
    JOIN  profesores    pj2  ON pj2.id = m.id_jurado2_principal
    WHERE m.estado = 'Programada' AND m.fecha >= CURRENT_DATE
"""


def obtener_proximas(limite: int = 4, maestria_id: int | None = None) -> list[ProximaMesa]:
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                _SQL_PROXIMAS + " AND e.maestria_id = %s ORDER BY m.fecha, m.hora_inicio LIMIT %s",
                (maestria_id, limite),
            )
        else:
            cur.execute(
                _SQL_PROXIMAS + " ORDER BY m.fecha, m.hora_inicio LIMIT %s",
                (limite,),
            )
        return [ProximaMesa(*row) for row in cur.fetchall()]


_SQL_PENDIENTES_BASE = """
    SELECT
        m.id,
        e.apellido || ', ' || e.nombre        AS estudiante,
        COALESCE(e.titulo_proyecto, '')        AS titulo,
        TO_CHAR(m.fecha, 'DD/MM/YYYY')        AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')     AS hora_inicio,
        TO_CHAR(m.hora_fin,    'HH24:MI')     AS hora_fin,
        a.nombre_aula                          AS aula,
        m.tipo_mesa,
        m.estado,
        ms.nombre                              AS maestria
    FROM  mesas_defensa m
    JOIN  estudiantes   e   ON e.id   = m.id_estudiante
    JOIN  aulas         a   ON a.id   = m.id_aula
    JOIN  maestrias     ms  ON ms.id  = e.maestria_id
    WHERE m.estado IN ('Programada', 'En_Curso')
      AND (m.fecha + m.hora_fin) < LOCALTIMESTAMP
"""


def obtener_pendientes_cierre(maestria_id: int | None = None) -> list[MesaPendienteCierre]:
    orden = " ORDER BY m.fecha DESC, m.hora_inicio DESC"
    with get_connection() as (_, cur):
        if maestria_id is not None:
            cur.execute(
                _SQL_PENDIENTES_BASE + " AND e.maestria_id = %s" + orden,
                (maestria_id,),
            )
        else:
            cur.execute(_SQL_PENDIENTES_BASE + orden)
        return [MesaPendienteCierre(*row) for row in cur.fetchall()]


def obtener_recientes(limite: int = 5, maestria_id: int | None = None) -> list[DefensaReciente]:
    filtro = " AND e.maestria_id = %s" if maestria_id is not None else ""
    params: tuple = (_ESTADOS_CONCLUIDOS,)
    if maestria_id is not None:
        params += (maestria_id,)
    with get_connection() as (_, cur):
        cur.execute(
            _SQL_RECIENTES + filtro + " ORDER BY m.fecha DESC, m.hora_inicio DESC LIMIT %s",
            params + (limite,),
        )
        return [DefensaReciente(*row) for row in cur.fetchall()]


_SQL_REPORTE = """
    SELECT
        m.id,
        e.apellido  || ', ' || e.nombre   AS estudiante,
        e.cedula,
        COALESCE(e.titulo_proyecto, '')    AS titulo,
        TO_CHAR(m.fecha,       'DD/MM/YYYY') AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')    AS hora_inicio,
        a.nombre_aula                      AS aula,
        pt.apellido  || ', ' || pt.nombre  AS tutor,
        pj1.apellido || ', ' || pj1.nombre AS jurado1,
        pj2.apellido || ', ' || pj2.nombre AS jurado2,
        m.estado,
        ms.nombre                          AS maestria
    FROM  mesas_defensa  m
    JOIN  estudiantes    e    ON e.id   = m.id_estudiante
    JOIN  profesores     pt   ON pt.id  = m.id_tutor_principal
    JOIN  profesores     pj1  ON pj1.id = m.id_jurado1_principal
    JOIN  profesores     pj2  ON pj2.id = m.id_jurado2_principal
    JOIN  aulas          a    ON a.id   = m.id_aula
    JOIN  maestrias      ms   ON ms.id  = e.maestria_id
    WHERE m.estado IN %s
"""


def obtener_mes_para_reporte(maestria_id: int | None = None) -> list[DefensaReporte]:
    """Defensas concluidas del mes actual con maestría, para el PDF mensual."""
    filtro = " AND e.maestria_id = %s" if maestria_id is not None else ""
    params: tuple = (_ESTADOS_CONCLUIDOS,)
    if maestria_id is not None:
        params += (maestria_id,)
    with get_connection() as (_, cur):
        cur.execute(
            _SQL_REPORTE
            + filtro
            + """
              AND DATE_TRUNC('month', m.fecha) = DATE_TRUNC('month', CURRENT_DATE)
            ORDER BY m.fecha, m.hora_inicio
            """,
            params,
        )
        return [DefensaReporte(*row) for row in cur.fetchall()]
