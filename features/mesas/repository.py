from datetime import date, timedelta

import psycopg2

from core.database import get_connection
from features.mesas.horario import calcular_hora_fin, validar_horario_permitido
from features.mesas.models import MesaDefensa

_ESTADOS_BLOQUEANTES = ("Programada", "En_Curso", "Con_Correcciones")
_ESTADOS_ACTIVOS     = ("Programada", "En_Curso", "Con_Correcciones")

# ─── Query base compartida por listado y monitoreo ────────────────────────────

_SQL_MESAS_BASE = """
    SELECT
        m.id,
        m.id_estudiante,
        e.cedula                                 AS cedula_estudiante,
        e.apellido  || ', ' || e.nombre          AS nombre_estudiante,
        e.titulo_proyecto,
        ma.nombre                                AS maestria,
        m.id_aula,
        a.nombre_aula                            AS aula,
        a.ubicacion,
        TO_CHAR(m.fecha,       'DD/MM/YYYY')     AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')        AS hora_inicio,
        TO_CHAR(m.hora_fin,    'HH24:MI')        AS hora_fin,
        m.tipo_mesa,
        m.estado,
        m.id_tutor_principal,
        pt.apellido  || ', ' || pt.nombre        AS tutor_principal,
        pt.cedula                                AS cedula_tutor_principal,
        m.id_tutor_suplente,
        pts.apellido || ', ' || pts.nombre       AS tutor_suplente,
        pts.cedula                               AS cedula_tutor_suplente,
        m.id_jurado1_principal,
        pj1.apellido  || ', ' || pj1.nombre      AS jurado1_principal,
        pj1.cedula                               AS cedula_jurado1_principal,
        m.id_jurado1_suplente,
        pj1s.apellido || ', ' || pj1s.nombre     AS jurado1_suplente,
        pj1s.cedula                              AS cedula_jurado1_suplente,
        m.id_jurado2_principal,
        pj2.apellido  || ', ' || pj2.nombre      AS jurado2_principal,
        pj2.cedula                               AS cedula_jurado2_principal,
        m.id_jurado2_suplente,
        pj2s.apellido || ', ' || pj2s.nombre     AS jurado2_suplente,
        pj2s.cedula                              AS cedula_jurado2_suplente,
        m.tutor_efectivo_id,
        pte.apellido  || ', ' || pte.nombre      AS tutor_efectivo,
        pte.cedula                               AS cedula_tutor_efectivo,
        m.jurado1_efectivo_id,
        pj1e.apellido || ', ' || pj1e.nombre     AS jurado1_efectivo,
        pj1e.cedula                              AS cedula_jurado1_efectivo,
        m.jurado2_efectivo_id,
        pj2e.apellido || ', ' || pj2e.nombre     AS jurado2_efectivo,
        pj2e.cedula                              AS cedula_jurado2_efectivo,
        m.asistencia_estudiante,
        m.iniciada_por_profesor_id,
        m.veredicto,
        m.dias_correccion,
        m.fecha_limite_correccion::text,
        m.fecha_validacion_correcciones::text
    FROM  mesas_defensa  m
    JOIN  estudiantes    e    ON e.id    = m.id_estudiante
    LEFT JOIN maestrias  ma   ON ma.id   = e.maestria_id
    JOIN  aulas          a    ON a.id    = m.id_aula
    JOIN  profesores     pt   ON pt.id   = m.id_tutor_principal
    JOIN  profesores     pts  ON pts.id  = m.id_tutor_suplente
    JOIN  profesores     pj1  ON pj1.id  = m.id_jurado1_principal
    JOIN  profesores     pj1s ON pj1s.id = m.id_jurado1_suplente
    JOIN  profesores     pj2  ON pj2.id  = m.id_jurado2_principal
    JOIN  profesores     pj2s ON pj2s.id = m.id_jurado2_suplente
    LEFT JOIN profesores pte  ON pte.id  = m.tutor_efectivo_id
    LEFT JOIN profesores pj1e ON pj1e.id = m.jurado1_efectivo_id
    LEFT JOIN profesores pj2e ON pj2e.id = m.jurado2_efectivo_id
"""

_SQL_DETALLADAS   = _SQL_MESAS_BASE + " ORDER BY m.fecha, m.hora_inicio"
_SQL_MONITOREO    = _SQL_MESAS_BASE + """
    WHERE m.fecha = CURRENT_DATE AND m.estado != 'Suspendida'
    ORDER BY m.hora_inicio
"""


# ─── Helpers privados (usan cursor existente — dentro de la misma transacción) ─

def _deducir_tipo_mesa(cur, id_estudiante: int) -> int:
    """
    Determina el número de mesa del próximo intento del alumno.
    Raises ValueError si el alumno no es elegible.
    """
    cur.execute(
        "SELECT 1 FROM mesas_defensa WHERE id_estudiante = %s AND estado = ANY(%s) LIMIT 1",
        (id_estudiante, list(_ESTADOS_ACTIVOS)),
    )
    if cur.fetchone():
        raise ValueError("El estudiante ya tiene una mesa activa (Programada, En Curso o Con Correcciones).")

    cur.execute(
        "SELECT COUNT(*) FROM mesas_defensa WHERE id_estudiante = %s AND estado = 'Aprobada'",
        (id_estudiante,),
    )
    aprobadas = cur.fetchone()[0]
    if aprobadas >= 3:
        raise ValueError("El estudiante ya completó sus tres mesas de defensa.")
    return aprobadas + 1


def _verificar_choques_7vias(
    cur,
    id_aula: int,
    fecha: str,
    hora_inicio: str,
    hora_fin: str,
    id_tutor_principal: int,
    id_tutor_suplente: int,
    id_jurado1_principal: int,
    id_jurado1_suplente: int,
    id_jurado2_principal: int,
    id_jurado2_suplente: int,
    id_mesa_excluir: int | None = None,
) -> None:
    """
    Verifica aula + 3 principales del comité contra estados bloqueantes.
    Raises ValueError con nombre del recurso en conflicto y el horario exacto.
    2 queries: uno para el aula, uno para todos los profesores principales a la vez.
    """
    excluir_sql   = "AND m.id != %s" if id_mesa_excluir is not None else ""
    excluir_param = (id_mesa_excluir,) if id_mesa_excluir is not None else ()
    estados       = list(_ESTADOS_BLOQUEANTES)
    overlap       = "(%s::time < m.hora_fin AND %s::time > m.hora_inicio)"

    # ── Query 1: aula ─────────────────────────────────────────────────────────
    cur.execute(
        f"SELECT TO_CHAR(m.hora_inicio,'HH24:MI'), TO_CHAR(m.hora_fin,'HH24:MI') "
        f"FROM mesas_defensa m "
        f"WHERE m.id_aula = %s AND m.fecha = %s::date AND m.estado = ANY(%s) "
        f"AND (m.fecha + m.hora_fin) > LOCALTIMESTAMP "
        f"AND {overlap} {excluir_sql} LIMIT 1",
        (id_aula, fecha, estados, hora_inicio, hora_fin) + excluir_param,
    )
    row = cur.fetchone()
    if row:
        raise ValueError(f"El aula ya está ocupada de {row[0]} a {row[1]}.")

    # ── Query 2: los 3 principales en un solo JOIN ────────────────────────────
    # Busca si alguno de los 3 principales aparece en cualquier posición del comité
    # de otra mesa con horario superpuesto. JOIN con profesores para obtener el nombre
    # y el rol que conflictúa, todo en una sola ida a la DB.
    ids_principales = [id_tutor_principal, id_jurado1_principal, id_jurado2_principal]
    cur.execute(
        f"""
        SELECT
            p.apellido || ', ' || p.nombre AS nombre,
            CASE p.id
                WHEN %s THEN 'Tutor Principal'
                WHEN %s THEN 'Jurado 1 Principal'
                WHEN %s THEN 'Jurado 2 Principal'
            END AS rol,
            TO_CHAR(m.hora_inicio, 'HH24:MI') AS h_ini,
            TO_CHAR(m.hora_fin,    'HH24:MI') AS h_fin
        FROM mesas_defensa m
        JOIN profesores p ON p.id = ANY(%s)
        WHERE m.fecha = %s::date AND m.estado = ANY(%s)
          AND {overlap}
          AND (m.fecha + m.hora_fin) > LOCALTIMESTAMP
          AND (m.id_tutor_principal   = p.id OR m.id_tutor_suplente    = p.id
               OR m.id_jurado1_principal = p.id OR m.id_jurado1_suplente  = p.id
               OR m.id_jurado2_principal = p.id OR m.id_jurado2_suplente  = p.id)
          {excluir_sql}
        LIMIT 1
        """,
        (id_tutor_principal, id_jurado1_principal, id_jurado2_principal,
         ids_principales, fecha, estados, hora_inicio, hora_fin) + excluir_param,
    )
    row = cur.fetchone()
    if row:
        nombre, rol, h_ini, h_fin = row
        raise ValueError(f"Conflicto: {nombre} ({rol}) tiene mesa de {h_ini} a {h_fin}.")


# ─── Funciones públicas ───────────────────────────────────────────────────────

def obtener_por_id(id_mesa: int) -> MesaDefensa | None:
    with get_connection() as (_, cur):
        cur.execute(_SQL_MESAS_BASE + " WHERE m.id = %s", (id_mesa,))
        fila = cur.fetchone()
        return MesaDefensa(*fila) if fila else None


def obtener_detalladas(
    maestria_id: int | None = None,
    estado:      str | None = None,
    aula:        str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
) -> list[MesaDefensa]:
    condiciones: list[str] = []
    params: list = []

    if maestria_id is not None:
        condiciones.append("e.maestria_id = %s")
        params.append(maestria_id)
    if estado:
        condiciones.append("m.estado = %s")
        params.append(estado)
    if aula:
        condiciones.append("LOWER(a.nombre_aula) LIKE %s")
        params.append(f"%{aula.lower()}%")
    if fecha_desde:
        condiciones.append("m.fecha >= %s::date")
        params.append(fecha_desde)
    if fecha_hasta:
        condiciones.append("m.fecha <= %s::date")
        params.append(fecha_hasta)

    where = ("WHERE " + " AND ".join(condiciones)) if condiciones else ""
    sql = f"{_SQL_MESAS_BASE} {where} ORDER BY m.fecha, m.hora_inicio"

    with get_connection() as (_, cur):
        cur.execute(sql, params)
        return [MesaDefensa(*fila) for fila in cur.fetchall()]


def obtener_monitoreo_hoy(maestria_id: int | None = None) -> list[MesaDefensa]:
    if maestria_id is not None:
        sql = _SQL_MESAS_BASE + """
            WHERE m.fecha = CURRENT_DATE AND m.estado != 'Suspendida'
              AND e.maestria_id = %s
            ORDER BY m.hora_inicio
        """
        params: tuple = (maestria_id,)
    else:
        sql    = _SQL_MONITOREO
        params = ()
    with get_connection() as (_, cur):
        cur.execute(sql, params)
        return [MesaDefensa(*fila) for fila in cur.fetchall()]


def obtener_ids_estudiantes_activos(maestria_id: int | None = None) -> list[int]:
    if maestria_id is not None:
        sql = """
            SELECT DISTINCT m.id_estudiante
            FROM mesas_defensa m
            JOIN estudiantes e ON e.id = m.id_estudiante
            WHERE m.estado = ANY(%s) AND e.maestria_id = %s
        """
        params: tuple = (list(_ESTADOS_ACTIVOS), maestria_id)
    else:
        sql    = "SELECT DISTINCT id_estudiante FROM mesas_defensa WHERE estado = ANY(%s)"
        params = (list(_ESTADOS_ACTIVOS),)
    with get_connection() as (_, cur):
        cur.execute(sql, params)
        return [fila[0] for fila in cur.fetchall()]


def obtener_mesas_por_cedula(cedula: str) -> list[MesaDefensa]:
    """Devuelve las mesas asociadas a la cédula en un único query — como estudiante o como miembro del comité."""
    # CTE resuelve el id del profesor una sola vez; el WHERE cubre ambos casos.
    sql = f"""
        WITH id_prof AS (SELECT id FROM profesores WHERE cedula = %s LIMIT 1)
        {_SQL_MESAS_BASE}
        WHERE e.cedula = %s
           OR EXISTS (
               SELECT 1 FROM id_prof p
               WHERE m.id_tutor_principal   = p.id
                  OR m.id_tutor_suplente    = p.id
                  OR m.id_jurado1_principal = p.id
                  OR m.id_jurado1_suplente  = p.id
                  OR m.id_jurado2_principal = p.id
                  OR m.id_jurado2_suplente  = p.id
           )
        ORDER BY m.fecha, m.hora_inicio
    """
    with get_connection() as (_, cur):
        cur.execute(sql, (cedula, cedula))
        return [MesaDefensa(*fila) for fila in cur.fetchall()]


def mesa_pertenece_a_maestria(id_mesa: int, maestria_id: int) -> bool:
    with get_connection() as (_, cur):
        cur.execute(
            """
            SELECT 1 FROM mesas_defensa m
            JOIN estudiantes e ON e.id = m.id_estudiante
            WHERE m.id = %s AND e.maestria_id = %s
            """,
            (id_mesa, maestria_id),
        )
        return cur.fetchone() is not None


def crear_mesa(
    id_estudiante: int, id_aula: int, fecha: str, hora_inicio: str,
) -> int:
    with get_connection() as (_, cur):
        cur.execute("SELECT id FROM estudiantes WHERE id = %s FOR UPDATE", (id_estudiante,))
        if cur.fetchone() is None:
            raise ValueError("El estudiante no existe.")
        tipo_mesa = _deducir_tipo_mesa(cur, id_estudiante)

        cur.execute(
            f"SELECT verificado_m{tipo_mesa} FROM estudiantes WHERE id = %s",
            (id_estudiante,),
        )
        if not cur.fetchone()[0]:
            raise ValueError(
                f"El estudiante no tiene solvencia verificada para la Mesa {tipo_mesa}."
            )

        hora_fin  = calcular_hora_fin(hora_inicio, tipo_mesa)

        valido, msg = validar_horario_permitido(hora_inicio, hora_fin)
        if not valido:
            raise ValueError(msg)

        cur.execute(
            "SELECT id_tutor_principal, id_tutor_suplente, "
            "       id_jurado1_principal, id_jurado1_suplente, "
            "       id_jurado2_principal, id_jurado2_suplente "
            "FROM estudiantes WHERE id = %s",
            (id_estudiante,),
        )
        comite = cur.fetchone()
        if comite is None:
            raise ValueError("El estudiante no existe.")
        id_tp, id_ts, id_j1p, id_j1s, id_j2p, id_j2s = comite

        _verificar_choques_7vias(
            cur, id_aula, fecha, hora_inicio, hora_fin,
            id_tp, id_ts, id_j1p, id_j1s, id_j2p, id_j2s,
        )

        cur.execute(
            """
            INSERT INTO mesas_defensa (
                id_estudiante, id_aula, fecha, hora_inicio, hora_fin, tipo_mesa,
                id_tutor_principal, id_tutor_suplente,
                id_jurado1_principal, id_jurado1_suplente,
                id_jurado2_principal, id_jurado2_suplente
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (id_estudiante, id_aula, fecha, hora_inicio, hora_fin, tipo_mesa,
             id_tp, id_ts, id_j1p, id_j1s, id_j2p, id_j2s),
        )
        return cur.fetchone()[0]


def actualizar_mesa(
    id_mesa: int, id_aula: int, fecha: str, hora_inicio: str,
) -> bool:
    """Edita aula/fecha/hora de una mesa en estado 'Programada'. Recalcula hora_fin."""
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT tipo_mesa, id_tutor_principal, id_tutor_suplente, "
            "       id_jurado1_principal, id_jurado1_suplente, "
            "       id_jurado2_principal, id_jurado2_suplente "
            "FROM mesas_defensa WHERE id = %s AND estado = 'Programada'",
            (id_mesa,),
        )
        fila = cur.fetchone()
        if fila is None:
            raise ValueError("La mesa no existe o no está en estado 'Programada'.")

        tipo_mesa, id_tp, id_ts, id_j1p, id_j1s, id_j2p, id_j2s = fila
        hora_fin = calcular_hora_fin(hora_inicio, tipo_mesa)

        valido, msg = validar_horario_permitido(hora_inicio, hora_fin)
        if not valido:
            raise ValueError(msg)

        _verificar_choques_7vias(
            cur, id_aula, fecha, hora_inicio, hora_fin,
            id_tp, id_ts, id_j1p, id_j1s, id_j2p, id_j2s,
            id_mesa_excluir=id_mesa,
        )

        cur.execute(
            """
            UPDATE mesas_defensa SET
                id_aula = %s, fecha = %s, hora_inicio = %s, hora_fin = %s
            WHERE id = %s AND estado = 'Programada'
            """,
            (id_aula, fecha, hora_inicio, hora_fin, id_mesa),
        )
        return cur.rowcount > 0


def registrar_quorum(
    id_mesa: int,
    tutor_efectivo_id: int | None,
    jurado1_efectivo_id: int | None,
    jurado2_efectivo_id: int | None,
    asistencia_estudiante: bool,
    iniciada_por_profesor_id: int,
) -> bool:
    """Registra presencia y transiciona a 'En_Curso'. Retorna False si la mesa no estaba en Programada."""
    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE mesas_defensa SET
                tutor_efectivo_id        = %s,
                jurado1_efectivo_id      = %s,
                jurado2_efectivo_id      = %s,
                asistencia_estudiante    = %s,
                iniciada_por_profesor_id = %s,
                estado                   = 'En_Curso'
            WHERE id = %s AND estado = 'Programada'
            """,
            (tutor_efectivo_id, jurado1_efectivo_id, jurado2_efectivo_id,
             asistencia_estudiante, iniciada_por_profesor_id, id_mesa),
        )
        return cur.rowcount > 0


def registrar_veredicto(
    id_mesa: int, veredicto: str, dias_correccion: int,
) -> bool:
    """Registra veredicto y transiciona el estado. Solo actúa sobre mesas 'En_Curso'."""
    estado_map = {
        "Aprobado":         "Aprobada",
        "Con_Correcciones": "Con_Correcciones",
        "Reprobado":        "Reprobada",
    }
    nuevo_estado = estado_map[veredicto]
    fecha_limite = None
    if veredicto == "Con_Correcciones":
        fecha_limite = (date.today() + timedelta(days=dias_correccion)).isoformat()

    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE mesas_defensa SET
                veredicto               = %s,
                estado                  = %s,
                dias_correccion         = %s,
                fecha_limite_correccion = %s
            WHERE id = %s AND estado = 'En_Curso'
            """,
            (veredicto, nuevo_estado, dias_correccion, fecha_limite, id_mesa),
        )
        return cur.rowcount > 0


def validar_correcciones(id_mesa: int) -> bool:
    """Transiciona Con_Correcciones → Aprobada y registra la fecha de validación."""
    with get_connection() as (_, cur):
        cur.execute(
            """
            UPDATE mesas_defensa SET
                estado                        = 'Aprobada',
                fecha_validacion_correcciones = %s
            WHERE id = %s AND estado = 'Con_Correcciones'
            """,
            (date.today().isoformat(), id_mesa),
        )
        return cur.rowcount > 0


def obtener_portal_profesor(cedula: str) -> tuple[str, list[tuple]] | None:
    with get_connection() as (_, cur):
        cur.execute(
            "SELECT id, apellido || ', ' || nombre FROM profesores WHERE cedula = %s",
            (cedula,),
        )
        fila = cur.fetchone()
        if fila is None:
            return None
        id_prof, nombre_prof = fila

        cur.execute(
            """
            SELECT
                m.id,
                CASE
                    WHEN m.id_tutor_principal   = %(pid)s THEN 'Tutor Principal'
                    WHEN m.id_tutor_suplente    = %(pid)s THEN 'Tutor Suplente'
                    WHEN m.id_jurado1_principal = %(pid)s THEN 'Jurado 1 Principal'
                    WHEN m.id_jurado1_suplente  = %(pid)s THEN 'Jurado 1 Suplente'
                    WHEN m.id_jurado2_principal = %(pid)s THEN 'Jurado 2 Principal'
                    WHEN m.id_jurado2_suplente  = %(pid)s THEN 'Jurado 2 Suplente'
                END AS rol,
                m.tipo_mesa,
                m.estado,
                TO_CHAR(m.fecha,       'DD/MM/YYYY') AS fecha,
                TO_CHAR(m.hora_inicio, 'HH24:MI')    AS hora_inicio,
                TO_CHAR(m.hora_fin,    'HH24:MI')    AS hora_fin,
                a.nombre_aula                        AS aula,
                e.apellido || ', ' || e.nombre       AS estudiante,
                e.titulo_proyecto                    AS titulo,
                m.veredicto
            FROM mesas_defensa m
            JOIN estudiantes e ON e.id = m.id_estudiante
            JOIN aulas       a ON a.id = m.id_aula
            WHERE (
                m.id_tutor_principal   = %(pid)s OR m.id_tutor_suplente    = %(pid)s
                OR m.id_jurado1_principal = %(pid)s OR m.id_jurado1_suplente = %(pid)s
                OR m.id_jurado2_principal = %(pid)s OR m.id_jurado2_suplente = %(pid)s
            )
            ORDER BY m.fecha DESC, m.hora_inicio DESC
            """,
            {"pid": id_prof},
        )
        return nombre_prof, cur.fetchall()


def obtener_portal_estudiante(cedula: str) -> tuple[tuple, list[tuple]] | None:
    with get_connection() as (_, cur):
        cur.execute(
            """
            SELECT
                e.apellido || ', ' || e.nombre AS nombre,
                ma.nombre                      AS maestria,
                e.titulo_proyecto,
                e.verificado_m1, e.monto_m1,
                e.verificado_m2, e.monto_m2,
                e.verificado_m3, e.monto_m3,
                e.id
            FROM estudiantes e
            JOIN maestrias ma ON ma.id = e.maestria_id
            WHERE e.cedula = %s
            """,
            (cedula,),
        )
        fila = cur.fetchone()
        if fila is None:
            return None
        *est_info, id_est = fila

        cur.execute(
            """
            SELECT
                m.tipo_mesa,
                m.estado,
                m.veredicto,
                TO_CHAR(m.fecha,       'DD/MM/YYYY') AS fecha,
                TO_CHAR(m.hora_inicio, 'HH24:MI')    AS hora_inicio,
                a.nombre_aula                        AS aula,
                m.fecha_limite_correccion::text,
                m.fecha_validacion_correcciones::text,
                p_tp.apellido  || ', ' || p_tp.nombre   AS tutor_principal,
                p_ts.apellido  || ', ' || p_ts.nombre   AS tutor_suplente,
                p_j1p.apellido || ', ' || p_j1p.nombre  AS jurado1_principal,
                p_j1s.apellido || ', ' || p_j1s.nombre  AS jurado1_suplente,
                p_j2p.apellido || ', ' || p_j2p.nombre  AS jurado2_principal,
                p_j2s.apellido || ', ' || p_j2s.nombre  AS jurado2_suplente
            FROM mesas_defensa m
            JOIN aulas      a     ON a.id     = m.id_aula
            JOIN profesores p_tp  ON p_tp.id  = m.id_tutor_principal
            JOIN profesores p_ts  ON p_ts.id  = m.id_tutor_suplente
            JOIN profesores p_j1p ON p_j1p.id = m.id_jurado1_principal
            JOIN profesores p_j1s ON p_j1s.id = m.id_jurado1_suplente
            JOIN profesores p_j2p ON p_j2p.id = m.id_jurado2_principal
            JOIN profesores p_j2s ON p_j2s.id = m.id_jurado2_suplente
            WHERE m.id_estudiante = %s
            ORDER BY m.tipo_mesa, m.fecha
            """,
            (id_est,),
        )
        return tuple(est_info), cur.fetchall()


_SQL_EMAIL = """
    SELECT
        TO_CHAR(m.fecha,       'DD/MM/YYYY')    AS fecha,
        TO_CHAR(m.hora_inicio, 'HH24:MI')       AS hora_inicio,
        TO_CHAR(m.hora_fin,    'HH24:MI')       AS hora_fin,
        m.tipo_mesa,
        a.nombre_aula,
        e.apellido  || ', ' || e.nombre         AS estudiante_nombre,
        e.correo_electronico                    AS estudiante_correo,
        e.titulo_proyecto,
        p_tp.apellido  || ', ' || p_tp.nombre   AS tutor_p_nombre,
        p_tp.correo_electronico                 AS tutor_p_correo,
        p_ts.apellido  || ', ' || p_ts.nombre   AS tutor_s_nombre,
        p_ts.correo_electronico                 AS tutor_s_correo,
        p_j1p.apellido || ', ' || p_j1p.nombre  AS jurado1_p_nombre,
        p_j1p.correo_electronico                AS jurado1_p_correo,
        p_j1s.apellido || ', ' || p_j1s.nombre  AS jurado1_s_nombre,
        p_j1s.correo_electronico                AS jurado1_s_correo,
        p_j2p.apellido || ', ' || p_j2p.nombre  AS jurado2_p_nombre,
        p_j2p.correo_electronico                AS jurado2_p_correo,
        p_j2s.apellido || ', ' || p_j2s.nombre  AS jurado2_s_nombre,
        p_j2s.correo_electronico                AS jurado2_s_correo
    FROM  mesas_defensa m
    JOIN  estudiantes   e      ON e.id      = m.id_estudiante
    JOIN  aulas         a      ON a.id      = m.id_aula
    JOIN  profesores    p_tp   ON p_tp.id   = m.id_tutor_principal
    JOIN  profesores    p_ts   ON p_ts.id   = m.id_tutor_suplente
    JOIN  profesores    p_j1p  ON p_j1p.id  = m.id_jurado1_principal
    JOIN  profesores    p_j1s  ON p_j1s.id  = m.id_jurado1_suplente
    JOIN  profesores    p_j2p  ON p_j2p.id  = m.id_jurado2_principal
    JOIN  profesores    p_j2s  ON p_j2s.id  = m.id_jurado2_suplente
    WHERE m.id = %s
"""


def suspender_mesa(id_mesa: int) -> bool:
    """Suspende una mesa que no esté en estado terminal."""
    ESTADOS_TERMINALES = ('Aprobada', 'Reprobada')
    with get_connection() as (_, cur):
        cur.execute(
            """UPDATE mesas_defensa
               SET estado = 'Suspendida'
               WHERE id = %s AND estado NOT IN %s""",
            (id_mesa, ESTADOS_TERMINALES),
        )
        return cur.rowcount > 0


def obtener_datos_para_email(id_mesa: int) -> dict | None:
    with get_connection() as (_, cur):
        cur.execute(_SQL_EMAIL, (id_mesa,))
        row = cur.fetchone()
        if row is None:
            return None
        cols = [desc[0] for desc in cur.description]
        return dict(zip(cols, row))
