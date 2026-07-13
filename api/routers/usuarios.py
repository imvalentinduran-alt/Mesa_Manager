from fastapi import APIRouter, HTTPException, status

from api.deps import JefaDep, ok_or_400
from api.schemas.usuarios import UsuarioIn, UsuarioOut, UsuarioUpdate
from features.auditoria import service as auditoria_svc
from features.usuarios import service as svc

router = APIRouter()


@router.get("/", response_model=list[UsuarioOut])
def listar(sesion: JefaDep) -> list:
    return svc.obtener_todos()


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear(body: UsuarioIn, sesion: JefaDep) -> object:
    ok_or_400(svc.registrar(
        cedula=body.cedula,
        nombre=body.nombre,
        apellido=body.apellido,
        contrasena=body.contrasena,
        rol=body.rol,
        maestria_id=body.maestria_id,
    ))
    todos = svc.obtener_todos()
    nuevo = next((u for u in reversed(todos) if u.cedula == body.cedula), None)
    if not nuevo:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el usuario creado.",
        )
    auditoria_svc.registrar(sesion, "CREAR", "Usuarios", nuevo.id,
                             f"Registrado: {nuevo.nombre} {nuevo.apellido} ({nuevo.rol})")
    return nuevo


@router.put("/{id_usr}", response_model=UsuarioOut)
def actualizar(id_usr: int, body: UsuarioUpdate, sesion: JefaDep) -> object:
    ok_or_400(svc.actualizar(
        id_usr=id_usr,
        cedula=body.cedula,
        nombre=body.nombre,
        apellido=body.apellido,
        rol=body.rol,
        maestria_id=body.maestria_id,
        contrasena=body.contrasena,
    ))
    todos = svc.obtener_todos()
    actualizado = next((u for u in todos if u.id == id_usr), None)
    if not actualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    auditoria_svc.registrar(sesion, "EDITAR", "Usuarios", id_usr,
                             f"Editado: {actualizado.nombre} {actualizado.apellido} ({actualizado.rol})")
    return actualizado


@router.delete("/{id_usr}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_usr: int, sesion: JefaDep) -> None:
    todos = svc.obtener_todos()
    usr = next((u for u in todos if u.id == id_usr), None)
    ok_or_400(svc.eliminar(id_usr))
    if usr:
        auditoria_svc.registrar(sesion, "ELIMINAR", "Usuarios", id_usr,
                                 f"Eliminado: {usr.nombre} {usr.apellido} ({usr.rol})")
