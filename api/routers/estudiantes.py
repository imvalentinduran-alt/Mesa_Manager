from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from api.deps import JefaDep, SessionDep, WriteRoleDep, ok_or_400
from api.schemas.estudiantes import (
    EstudianteCreate, EstudianteOut, EstudianteUpdate, SolvenciaUpdate,
)
from features.auditoria import service as auditoria_svc
from features.estudiantes import service as svc
from features.estudiantes.exportar import generar_excel_estudiantes
from features.maestrias import service as maestrias_svc
from features.mesas import service as mesas_svc
from features.profesores import service as profesores_svc

router = APIRouter()


@router.get("/", response_model=list[EstudianteOut])
def listar(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_todos(maestria_id)


@router.get("/exportar-excel")
def exportar_excel(
    sesion: SessionDep,
    maestria_id: int | None = Query(default=None),
) -> StreamingResponse:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    filtro = maestria_id
    if sesion.rol == "Coordinador":
        filtro = sesion.maestria_id

    estudiantes   = svc.obtener_todos(filtro)
    profesores    = profesores_svc.obtener_todos()
    maestrias     = maestrias_svc.obtener_todas()
    ids_asignados = set(mesas_svc.obtener_ids_estudiantes_activos(filtro))

    nombre_maestria: str | None = None
    if filtro:
        m = next((m for m in maestrias if m.id == filtro), None)
        nombre_maestria = m.nombre if m else None

    buffer = generar_excel_estudiantes(
        estudiantes, profesores, maestrias, ids_asignados, nombre_maestria,
    )

    sufijo   = nombre_maestria.replace(" ", "_") if nombre_maestria else "Todos"
    filename = f"Estudiantes_{sufijo}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/", response_model=EstudianteOut, status_code=status.HTTP_201_CREATED)
def crear(body: EstudianteCreate, sesion: WriteRoleDep) -> object:
    if sesion.rol == "Coordinador":
        body.maestria_id = sesion.maestria_id
    elif not body.maestria_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "La Jefa debe especificar una maestría.")

    ok_or_400(svc.registrar(**body.model_dump()))
    todos = svc.obtener_todos()
    creado = next((e for e in todos if e.cedula == body.cedula), None)
    if not creado:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            "Error al recuperar el registro creado.")
    auditoria_svc.registrar(sesion, "CREAR", "Estudiantes", creado.id,
                             f"Registrado: {creado.nombre} {creado.apellido} — C.I. {creado.cedula}")
    return creado


@router.put("/{id_est}", response_model=EstudianteOut)
def actualizar(id_est: int, body: EstudianteUpdate, sesion: WriteRoleDep) -> object:
    if sesion.rol == "Coordinador" and not svc.pertenece_a_maestria(id_est, sesion.maestria_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "No tiene permiso para editar estudiantes de otra maestría.")
    ok_or_400(svc.actualizar(id_est, **body.model_dump()))
    todos = svc.obtener_todos()
    actualizado = next((e for e in todos if e.id == id_est), None)
    if not actualizado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Estudiante no encontrado.")
    auditoria_svc.registrar(sesion, "EDITAR", "Estudiantes", id_est,
                             f"Editado: {actualizado.nombre} {actualizado.apellido}")
    return actualizado


@router.patch("/{id_est}/solvencia", response_model=EstudianteOut)
def actualizar_solvencia(id_est: int, body: SolvenciaUpdate, sesion: SessionDep) -> object:
    if sesion.rol not in ("Jefa", "Coordinador"):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Solo la Jefa Administradora o el Coordinador pueden registrar solvencias.")
    if sesion.rol == "Coordinador" and not svc.pertenece_a_maestria(id_est, sesion.maestria_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "No tiene permiso para editar estudiantes de otra maestría.")
    ok_or_400(svc.actualizar_solvencia(
        id_est, body.numero_mesa, body.recibo, float(body.monto),
        body.dia_transferencia, body.num_recibo_caja,
    ))
    todos = svc.obtener_todos()
    actualizado = next((e for e in todos if e.id == id_est), None)
    if not actualizado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Estudiante no encontrado.")
    auditoria_svc.registrar(sesion, "EDITAR_SOLVENCIA", "Estudiantes", id_est,
                             f"Solvencia M{body.numero_mesa} actualizada: {actualizado.nombre} {actualizado.apellido}")
    return actualizado


@router.delete("/{id_est}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_est: int, sesion: JefaDep) -> None:
    todos = svc.obtener_todos()
    est = next((e for e in todos if e.id == id_est), None)
    ok_or_400(svc.eliminar(id_est))
    if est:
        auditoria_svc.registrar(sesion, "ELIMINAR", "Estudiantes", id_est,
                                 f"Eliminado: {est.nombre} {est.apellido} — C.I. {est.cedula}")
