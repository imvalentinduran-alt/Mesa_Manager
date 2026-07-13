from datetime import date

import psycopg2

from features.dashboard import repository
from features.dashboard.models import DefensaReciente, DiaActividad, KPIs, MesaPendienteCierre, ProximaMesa

_MESES_ES = (
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
)


def obtener_kpis(maestria_id: int | None = None) -> KPIs:
    try:
        historico   = repository.contar_historico(maestria_id)
        mes         = repository.contar_mes_actual(maestria_id)
        mes_ant     = repository.contar_mes_anterior(maestria_id)
        tasa        = repository.calcular_tasa_aprobacion(maestria_id)
        tasa_ant    = repository.calcular_tasa_anterior(maestria_id)
        estudiantes = repository.contar_estudiantes(maestria_id)
        est_mes     = repository.contar_estudiantes_mes(maestria_id)
    except psycopg2.Error:
        historico = mes = mes_ant = estudiantes = est_mes = 0
        tasa = tasa_ant = 0.0

    return KPIs(
        total_historico=historico,
        defensas_mes=mes,
        defensas_mes_anterior=mes_ant,
        tasa_aprobacion=tasa,
        tasa_anterior=tasa_ant,
        estudiantes_registrados=estudiantes,
        estudiantes_mes=est_mes,
        nombre_mes=_MESES_ES[date.today().month],
    )


def obtener_actividad(maestria_id: int | None = None) -> list[DiaActividad]:
    try:
        return repository.obtener_actividad(126, maestria_id)
    except psycopg2.Error:
        return []


def obtener_proximas(maestria_id: int | None = None) -> list[ProximaMesa]:
    try:
        return repository.obtener_proximas(4, maestria_id)
    except psycopg2.Error:
        return []


def obtener_recientes(maestria_id: int | None = None) -> list[DefensaReciente]:
    try:
        return repository.obtener_recientes(5, maestria_id)
    except psycopg2.Error:
        return []


def obtener_pendientes_cierre(maestria_id: int | None = None) -> list[MesaPendienteCierre]:
    try:
        return repository.obtener_pendientes_cierre(maestria_id)
    except psycopg2.Error:
        return []


def generar_pdf_mes(
    maestria_id:     int | None = None,
    nombre_usuario:  str = "Sistema UPEL",
    nombre_maestria: str | None = None,
) -> bytes:
    """Genera el reporte institucional PDF del mes actual y retorna los bytes."""
    from features.dashboard import reportes

    try:
        defensas = repository.obtener_mes_para_reporte(maestria_id)
        kpis     = obtener_kpis(maestria_id)
    except psycopg2.Error as e:
        raise RuntimeError(f"Error al leer datos para el reporte: {e}") from e

    hoy = date.today()
    return reportes.generar_pdf(
        defensas=defensas,
        kpis=kpis,
        mes=_MESES_ES[hoy.month],
        anio=hoy.year,
        maestria=nombre_maestria,
        usuario=nombre_usuario,
    )
