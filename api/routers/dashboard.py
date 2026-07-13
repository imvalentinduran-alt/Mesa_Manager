from datetime import date

from fastapi import APIRouter, HTTPException, Response, status

from api.deps import SessionDep
from api.schemas.dashboard import (
    DefensaRecienteOut, DiaActividadOut, KPIsOut, MesaPendienteCierreOut, ProximaMesaOut,
)
from features.dashboard import service as svc
from features.maestrias import repository as maestrias_repo

router = APIRouter()

_ERR_CONSULTOR = HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")


@router.get("/kpis", response_model=KPIsOut)
def kpis(sesion: SessionDep) -> object:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_kpis(maestria_id)


@router.get("/actividad", response_model=list[DiaActividadOut])
def actividad(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_actividad(maestria_id)


@router.get("/proximas", response_model=list[ProximaMesaOut])
def proximas(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_proximas(maestria_id)


@router.get("/recientes", response_model=list[DefensaRecienteOut])
def recientes(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_recientes(maestria_id)


@router.get("/pendientes-cierre", response_model=list[MesaPendienteCierreOut])
def pendientes_cierre(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_pendientes_cierre(maestria_id)


@router.get("/reporte-pdf")
def reporte_pdf(sesion: SessionDep) -> Response:
    if sesion.rol == "Consultor":
        raise _ERR_CONSULTOR
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None

    nombre_maestria: str | None = None
    if maestria_id is not None:
        maestria = maestrias_repo.obtener_por_id(maestria_id)
        if maestria:
            nombre_maestria = maestria.nombre

    try:
        pdf_bytes = svc.generar_pdf_mes(
            maestria_id=maestria_id,
            nombre_usuario=sesion.nombre,
            nombre_maestria=nombre_maestria,
        )
    except RuntimeError as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))

    hoy = date.today()
    filename = f"reporte_defensas_concluidas_{hoy.month:02d}_{hoy.year}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
