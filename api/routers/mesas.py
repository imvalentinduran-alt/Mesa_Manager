from fastapi import APIRouter, HTTPException, status

from api.deps import SessionDep, JefaDep, WriteRoleDep, ok_or_400
from api.schemas.mesas import (
    MesaCreate, MesaEdit, MesaOut, MonitoreoOut,
    QuorumIn, VeredictoIn,
    PortalProfesorOut, PortalEstudianteOut,
)
from features.auditoria import service as auditoria_svc
from features.mesas import service as svc

router = APIRouter()


def _ok_or_raise(mesa: "MesaDefensa | None", id_mesa: int) -> "MesaDefensa":
    if not mesa:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Mesa {id_mesa} no encontrada.")
    return mesa


def ok_or_400_with_id(result: tuple[bool, str, int | None]) -> tuple[bool, int]:
    ok, msg, id_mesa = result
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg)
    return ok, id_mesa


# ─── Listado y filtros ────────────────────────────────────────────────────────

@router.get("", response_model=list[MesaOut])
@router.get("/", response_model=list[MesaOut])
def listar(
    estado:      str | None = None,
    aula:        str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    sesion:      SessionDep = None,
) -> list:
    if sesion.rol == "Consultor":
        return svc.obtener_por_cedula(sesion.cedula)

    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_todas(
        maestria_id = maestria_id,
        estado      = estado,
        aula        = aula,
        fecha_desde = fecha_desde,
        fecha_hasta = fecha_hasta,
    )


@router.get("/monitoreo", response_model=MonitoreoOut)
def monitoreo(sesion: SessionDep) -> dict:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_monitoreo(maestria_id)


@router.get("/estudiantes-asignados", response_model=list[int])
def estudiantes_asignados(sesion: SessionDep) -> list:
    if sesion.rol == "Consultor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso no permitido para el rol Consultor.")
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    return svc.obtener_ids_estudiantes_activos(maestria_id)


# ─── CRUD principal ───────────────────────────────────────────────────────────

@router.post("/", response_model=MesaOut, status_code=status.HTTP_201_CREATED)
def crear(body: MesaCreate, sesion: WriteRoleDep) -> object:
    _, id_mesa = ok_or_400_with_id(svc.registrar(
        id_estudiante   = body.id_estudiante,
        id_aula         = body.id_aula,
        fecha_str       = body.fecha,
        hora_inicio_str = body.hora_inicio,
    ))
    creada = svc.obtener_por_id(id_mesa)
    if not creada:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al recuperar la mesa creada.")
    auditoria_svc.registrar(sesion, "CREAR", "Mesas", creada.id,
                             f"Mesa programada: {creada.nombre_estudiante} — {creada.fecha} {creada.hora_inicio}")
    return creada


@router.put("/{id_mesa}", response_model=MesaOut)
def editar(id_mesa: int, body: MesaEdit, sesion: WriteRoleDep) -> object:
    ok_or_400(svc.verificar_acceso_mesa(id_mesa, sesion.maestria_id))
    ok_or_400(svc.editar(
        id_mesa         = id_mesa,
        id_aula         = body.id_aula,
        fecha_str       = body.fecha,
        hora_inicio_str = body.hora_inicio,
    ))
    actualizada = svc.obtener_por_id(id_mesa)
    if not actualizada:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mesa no encontrada.")
    return actualizada


# ─── Transiciones de estado ───────────────────────────────────────────────────

@router.patch("/{id_mesa}/quorum", response_model=MesaOut)
def registrar_quorum(id_mesa: int, body: QuorumIn, sesion: WriteRoleDep) -> object:
    ok_or_400(svc.verificar_acceso_mesa(id_mesa, sesion.maestria_id))
    ok_or_400(svc.registrar_quorum(
        id_mesa                  = id_mesa,
        tutor_efectivo_id        = body.tutor_efectivo_id,
        jurado1_efectivo_id      = body.jurado1_efectivo_id,
        jurado2_efectivo_id      = body.jurado2_efectivo_id,
        asistencia_estudiante    = body.asistencia_estudiante,
        iniciada_por_profesor_id = body.iniciada_por_profesor_id,
    ))
    return _ok_or_raise(svc.obtener_por_id(id_mesa), id_mesa)


@router.patch("/{id_mesa}/veredicto", response_model=MesaOut)
def registrar_veredicto(id_mesa: int, body: VeredictoIn, sesion: WriteRoleDep) -> object:
    ok_or_400(svc.verificar_acceso_mesa(id_mesa, sesion.maestria_id))
    ok_or_400(svc.registrar_veredicto(
        id_mesa         = id_mesa,
        veredicto       = body.veredicto,
        dias_correccion = body.dias_correccion,
    ))
    return _ok_or_raise(svc.obtener_por_id(id_mesa), id_mesa)


@router.patch("/{id_mesa}/suspender", response_model=MesaOut)
def suspender(id_mesa: int, sesion: JefaDep) -> object:
    ok_or_400(svc.suspender(id_mesa))
    return _ok_or_raise(svc.obtener_por_id(id_mesa), id_mesa)


@router.patch("/{id_mesa}/validar-correcciones", response_model=MesaOut)
def validar_correcciones(id_mesa: int, sesion: WriteRoleDep) -> object:
    ok_or_400(svc.verificar_acceso_mesa(id_mesa, sesion.maestria_id))
    ok_or_400(svc.validar_correcciones(id_mesa))
    return _ok_or_raise(svc.obtener_por_id(id_mesa), id_mesa)


# ─── Portales públicos (sin autenticación) ───────────────────────────────────

@router.get("/portal/profesor/{cedula}", response_model=PortalProfesorOut)
def portal_profesor(cedula: str) -> dict:
    data = svc.obtener_portal_profesor(cedula)
    if data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "No se encontró ningún profesor con esa cédula.")
    return data


@router.get("/portal/estudiante/{cedula}", response_model=PortalEstudianteOut)
def portal_estudiante(cedula: str) -> dict:
    data = svc.obtener_portal_estudiante(cedula)
    if data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "No se encontró ningún estudiante con esa cédula.")
    return data
