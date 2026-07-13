from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from api.deps import JefaDep, SessionDep, ok_or_400
from api.schemas.profesores import ProfesorIn, ProfesorOut
from features.auditoria import service as auditoria_svc
from features.profesores import service as svc
from features.profesores.exportar import generar_excel_profesores

router = APIRouter()


@router.get("/", response_model=list[ProfesorOut])
def listar(sesion: SessionDep, activos: bool = False) -> list:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    return svc.obtener_todos(solo_activos=activos)


@router.get("/exportar-excel")
def exportar_excel(sesion: SessionDep) -> StreamingResponse:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    profesores = svc.obtener_todos()
    buffer     = generar_excel_profesores(profesores)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Profesores.xlsx"'},
    )


@router.post("/", response_model=ProfesorOut, status_code=status.HTTP_201_CREATED)
def crear(body: ProfesorIn, sesion: JefaDep) -> object:
    ok_or_400(svc.registrar(**body.model_dump(exclude={'is_active'})))
    todos = svc.obtener_todos()
    creado = next((p for p in todos if p.cedula == body.cedula), None)
    if not creado:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            "Error al recuperar el registro creado.")
    auditoria_svc.registrar(sesion, "CREAR", "Profesores", creado.id,
                             f"Registrado: {creado.nombre} {creado.apellido} — C.I. {creado.cedula}")
    return creado


@router.put("/{id_prof}", response_model=ProfesorOut)
def actualizar(id_prof: int, body: ProfesorIn, sesion: JefaDep) -> object:
    ok_or_400(svc.actualizar(id_prof, **body.model_dump()))
    todos = svc.obtener_todos()
    actualizado = next((p for p in todos if p.id == id_prof), None)
    if not actualizado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profesor no encontrado.")
    auditoria_svc.registrar(sesion, "EDITAR", "Profesores", id_prof,
                             f"Editado: {actualizado.nombre} {actualizado.apellido}")
    return actualizado


@router.delete("/{id_prof}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_prof: int, sesion: JefaDep) -> None:
    todos = svc.obtener_todos()
    prof = next((p for p in todos if p.id == id_prof), None)
    ok_or_400(svc.eliminar(id_prof))
    if prof:
        auditoria_svc.registrar(sesion, "ELIMINAR", "Profesores", id_prof,
                                 f"Eliminado: {prof.nombre} {prof.apellido} — C.I. {prof.cedula}")
