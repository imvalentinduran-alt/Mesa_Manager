from datetime import date, datetime

import psycopg2

from features.mesas import correos, repository
from features.mesas.models import MesaDefensa


def obtener_por_id(id_mesa: int) -> MesaDefensa | None:
    try:
        return repository.obtener_por_id(id_mesa)
    except psycopg2.Error:
        return None


def obtener_todas(
    maestria_id: int | None = None,
    estado:      str | None = None,
    aula:        str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
) -> list[MesaDefensa]:
    try:
        return repository.obtener_detalladas(maestria_id, estado, aula, fecha_desde, fecha_hasta)
    except psycopg2.Error:
        return []


def obtener_por_cedula(cedula: str) -> list[MesaDefensa]:
    try:
        return repository.obtener_mesas_por_cedula(cedula)
    except psycopg2.Error:
        return []


def verificar_acceso_mesa(id_mesa: int, maestria_id: int | None) -> tuple[bool, str]:
    if maestria_id is None:
        return True, ""
    try:
        if not repository.mesa_pertenece_a_maestria(id_mesa, maestria_id):
            return False, "No tiene acceso a esta mesa."
        return True, ""
    except psycopg2.Error as e:
        return False, f"Error al verificar acceso: {e}"


def obtener_ids_estudiantes_activos(maestria_id: int | None = None) -> list[int]:
    try:
        return repository.obtener_ids_estudiantes_activos(maestria_id)
    except psycopg2.Error:
        return []


def registrar(
    id_estudiante: int,
    id_aula: int,
    fecha_str: str,
    hora_inicio_str: str,
) -> tuple[bool, str, int | None]:
    try:
        id_mesa = repository.crear_mesa(id_estudiante, id_aula, fecha_str, hora_inicio_str)
        correos.enviar_notificacion_async(id_mesa)
        return True, "Mesa de defensa programada exitosamente.", id_mesa
    except ValueError as e:
        return False, str(e), None
    except psycopg2.Error as e:
        return False, f"Error al programar la mesa: {e}", None


def editar(
    id_mesa: int,
    id_aula: int,
    fecha_str: str,
    hora_inicio_str: str,
) -> tuple[bool, str]:
    try:
        found = repository.actualizar_mesa(id_mesa, id_aula, fecha_str, hora_inicio_str)
        if not found:
            return False, "Mesa no encontrada o no está en estado 'Programada'."
        return True, "Mesa actualizada exitosamente."
    except ValueError as e:
        return False, str(e)
    except psycopg2.Error as e:
        return False, f"Error al actualizar la mesa: {e}"


def registrar_quorum(
    id_mesa: int,
    tutor_efectivo_id: int | None,
    jurado1_efectivo_id: int | None,
    jurado2_efectivo_id: int | None,
    asistencia_estudiante: bool,
    iniciada_por_profesor_id: int,
) -> tuple[bool, str]:
    presentes = [
        id_ for id_ in [tutor_efectivo_id, jurado1_efectivo_id, jurado2_efectivo_id]
        if id_ is not None
    ]
    if len(presentes) < 2:
        return False, "Se requiere quórum mínimo de 2 profesores para iniciar la defensa."
    if iniciada_por_profesor_id not in presentes:
        return False, "El profesor que inicia la mesa debe ser uno de los profesores presentes."
    try:
        found = repository.registrar_quorum(
            id_mesa, tutor_efectivo_id, jurado1_efectivo_id, jurado2_efectivo_id,
            asistencia_estudiante, iniciada_por_profesor_id,
        )
        if not found:
            return False, f"No se encontró la mesa {id_mesa} en estado 'Programada'."
        return True, "Quórum registrado. Mesa en curso."
    except psycopg2.Error as e:
        return False, f"Error al registrar quórum: {e}"


def registrar_veredicto(
    id_mesa: int,
    veredicto: str,
    dias_correccion: int = 15,
) -> tuple[bool, str]:
    try:
        found = repository.registrar_veredicto(id_mesa, veredicto, dias_correccion)
        if not found:
            return False, f"No se encontró la mesa {id_mesa} en estado 'En_Curso'."
        estado = {"Aprobado": "Aprobada", "Con_Correcciones": "Con_Correcciones", "Reprobado": "Reprobada"}[veredicto]
        return True, f"Veredicto '{veredicto}' registrado. Estado: {estado}."
    except psycopg2.Error as e:
        return False, f"Error al registrar veredicto: {e}"


def validar_correcciones(id_mesa: int) -> tuple[bool, str]:
    try:
        found = repository.validar_correcciones(id_mesa)
        if not found:
            return False, f"No se encontró la mesa {id_mesa} en estado 'Con_Correcciones'."
        return True, "Correcciones validadas. Mesa aprobada."
    except psycopg2.Error as e:
        return False, f"Error al validar correcciones: {e}"


def suspender(id_mesa: int) -> tuple[bool, str]:
    try:
        found = repository.suspender_mesa(id_mesa)
        if not found:
            return False, "Mesa no encontrada o ya está en estado terminal."
        return True, "Mesa suspendida."
    except psycopg2.Error as e:
        return False, f"Error al suspender: {e}"


def obtener_portal_profesor(cedula: str) -> dict | None:
    try:
        resultado = repository.obtener_portal_profesor(cedula)
        if resultado is None:
            return None
        nombre_prof, mesas_data = resultado
        return {
            "nombre": nombre_prof,
            "cedula": cedula,
            "mesas": [
                {
                    "id": r[0], "rol": r[1], "tipo_mesa": r[2], "estado": r[3],
                    "fecha": r[4], "hora_inicio": r[5], "hora_fin": r[6],
                    "aula": r[7], "estudiante": r[8], "titulo": r[9], "veredicto": r[10],
                }
                for r in mesas_data
            ],
        }
    except psycopg2.Error:
        return None


def obtener_portal_estudiante(cedula: str) -> dict | None:
    try:
        resultado = repository.obtener_portal_estudiante(cedula)
        if resultado is None:
            return None
        est_info, mesas_data = resultado
        nombre, maestria, titulo, ver_m1, monto_m1, ver_m2, monto_m2, ver_m3, monto_m3 = est_info
        return {
            "nombre": nombre, "cedula": cedula,
            "maestria": maestria, "titulo_proyecto": titulo,
            "verificado_m1": ver_m1, "monto_m1": float(monto_m1) if monto_m1 else None,
            "verificado_m2": ver_m2, "monto_m2": float(monto_m2) if monto_m2 else None,
            "verificado_m3": ver_m3, "monto_m3": float(monto_m3) if monto_m3 else None,
            "mesas": [
                {
                    "tipo_mesa": r[0], "estado": r[1], "veredicto": r[2],
                    "fecha": r[3], "hora_inicio": r[4], "aula": r[5],
                    "fecha_limite_correccion": r[6],
                    "fecha_validacion_correcciones": r[7],
                    "tutor_principal":   r[8],
                    "tutor_suplente":    r[9],
                    "jurado1_principal": r[10],
                    "jurado1_suplente":  r[11],
                    "jurado2_principal": r[12],
                    "jurado2_suplente":  r[13],
                }
                for r in mesas_data
            ],
        }
    except psycopg2.Error:
        return None


def obtener_monitoreo(maestria_id: int | None = None) -> dict:
    try:
        mesas = repository.obtener_monitoreo_hoy(maestria_id)
    except psycopg2.Error:
        mesas = []

    ahora = datetime.now()
    hoy   = date.today()

    def _enriquecer(m: MesaDefensa) -> dict:
        hora_fin_dt = datetime.combine(hoy, datetime.strptime(m.hora_fin, "%H:%M").time())
        if m.estado == "En_Curso":
            diff_seg          = (hora_fin_dt - ahora).total_seconds()
            minutos_restantes = max(0, int(diff_seg / 60))
            en_sobretiempo    = diff_seg < 0
        else:
            minutos_restantes = None
            en_sobretiempo    = False

        return {
            "id":         m.id,
            "codigo":     f"M-{m.id:02d}",
            "estudiante": m.nombre_estudiante,
            "titulo":     m.titulo_proyecto,
            "tutor":      m.tutor_efectivo   or m.tutor_principal,
            "jurado1":    m.jurado1_efectivo  or m.jurado1_principal,
            "jurado2":    m.jurado2_efectivo  or m.jurado2_principal,
            "aula":       m.aula,
            "ubicacion":  m.ubicacion,
            "hora_inicio": m.hora_inicio,
            "hora_fin":    m.hora_fin,
            "estado":     m.estado,
            "tipo_mesa":  m.tipo_mesa,
            "asistencia": {
                "estudiante": m.asistencia_estudiante,
                "tutor":      m.tutor_efectivo_id   is not None,
                "jurado1":    m.jurado1_efectivo_id is not None,
                "jurado2":    m.jurado2_efectivo_id is not None,
            },
            "minutos_restantes": minutos_restantes,
            "en_sobretiempo":    en_sobretiempo,
            "cedula_estudiante": m.cedula_estudiante,
            "cedula_tutor":      m.cedula_tutor_efectivo   or m.cedula_tutor_principal,
            "cedula_jurado1":    m.cedula_jurado1_efectivo or m.cedula_jurado1_principal,
            "cedula_jurado2":    m.cedula_jurado2_efectivo or m.cedula_jurado2_principal,
        }

    columnas: dict[str, list] = {"en_curso": [], "programada": [], "concluida": []}
    for m in mesas:
        item = _enriquecer(m)
        if m.estado == "En_Curso":
            columnas["en_curso"].append(item)
        elif m.estado == "Programada":
            columnas["programada"].append(item)
        else:
            columnas["concluida"].append(item)

    return {
        "fecha":    hoy.strftime("%Y-%m-%d"),
        "columnas": columnas,
        "totales":  {k: len(v) for k, v in columnas.items()},
    }
