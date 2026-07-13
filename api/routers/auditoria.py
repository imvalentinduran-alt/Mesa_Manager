from datetime import date

from fastapi import APIRouter, Query

from api.deps import JefaDep
from api.schemas.auditoria import EntradaAuditoriaOut
from features.auditoria import service as svc

router = APIRouter()


@router.get("/", response_model=list[EntradaAuditoriaOut])
def listar(
    sesion: JefaDep,
    accion: str | None  = Query(default=None),
    modulo: str | None  = Query(default=None),
    desde:  date | None = Query(default=None),
    hasta:  date | None = Query(default=None),
) -> list:
    return svc.obtener_historial(accion=accion, modulo=modulo, desde=desde, hasta=hasta)
