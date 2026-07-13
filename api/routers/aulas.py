from fastapi import APIRouter, HTTPException, status

from api.deps import JefaDep, SessionDep, ok_or_400
from api.schemas.aulas import AulaIn, AulaOut
from features.auditoria import service as auditoria_svc
from features.aulas import service as svc

router = APIRouter()


@router.get("/", response_model=list[AulaOut])
def listar(sesion: SessionDep) -> list:
    return svc.obtener_todas()


@router.post("/", response_model=AulaOut, status_code=status.HTTP_201_CREATED)
def crear(body: AulaIn, sesion: JefaDep) -> object:
    ok_or_400(svc.registrar(**body.model_dump()))
    todas = svc.obtener_todas()
    if not todas:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            "Error al recuperar el registro creado.")
    creada = max(todas, key=lambda a: a.id)
    auditoria_svc.registrar(sesion, "CREAR", "Aulas", creada.id,
                             f"Registrada: {creada.nombre_aula} ({creada.ubicacion})")
    return creada


@router.put("/{id_aula}", response_model=AulaOut)
def actualizar(id_aula: int, body: AulaIn, sesion: JefaDep) -> object:
    ok_or_400(svc.actualizar(id_aula, **body.model_dump()))
    todas = svc.obtener_todas()
    actualizada = next((a for a in todas if a.id == id_aula), None)
    if not actualizada:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aula no encontrada.")
    auditoria_svc.registrar(sesion, "EDITAR", "Aulas", id_aula,
                             f"Editada: {actualizada.nombre_aula}")
    return actualizada


@router.delete("/{id_aula}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_aula: int, sesion: JefaDep) -> None:
    todas = svc.obtener_todas()
    aula = next((a for a in todas if a.id == id_aula), None)
    ok_or_400(svc.eliminar(id_aula))
    if aula:
        auditoria_svc.registrar(sesion, "ELIMINAR", "Aulas", id_aula,
                                 f"Eliminada: {aula.nombre_aula}")
