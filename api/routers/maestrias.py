from fastapi import APIRouter

from api.deps import SessionDep
from api.schemas.maestrias import MaestriaOut
from features.maestrias import service as svc

router = APIRouter()


@router.get("/", response_model=list[MaestriaOut])
def listar(sesion: SessionDep) -> list:
    return svc.obtener_todas()
