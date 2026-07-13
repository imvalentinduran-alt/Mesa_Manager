"""
Router de autenticación — /api/auth

Estrategia de contraseñas:
  Los usuarios existentes en la BD tienen hashes SHA-256 (sistema anterior).
  En el primer login exitoso con SHA-256, el hash se reemplaza silenciosamente
  por bcrypt. A partir de ese momento, ese usuario usa solo bcrypt.
  Detección automática: los hashes bcrypt comienzan con $2b$, $2a$ o $2y$.
"""

import hashlib
from typing import Annotated

import bcrypt
import psycopg2
from fastapi import APIRouter, Header, HTTPException, status
from starlette.requests import Request

from api.deps import SessionDep, create_session, destroy_session
from api.limiter import limiter
from api.schemas.auth import ConsultorRequest, LoginRequest, LoginResponse, SessionInfo
from core.session import SessionContext
from features.auth import repository as auth_repo

router = APIRouter()

# Hash ficticio para igualar el tiempo de respuesta cuando el usuario no existe,
# previniendo ataques de enumeración por diferencia de timing (bcrypt es lento).
# Se inicializa en el primer uso para evitar KeyboardInterrupt del bootloader de PyInstaller.
_DUMMY_HASH: bytes | None = None


def _get_dummy_hash() -> bytes:
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = bcrypt.hashpw(b"__upel_timing_anchor__", bcrypt.gensalt(12))
    return _DUMMY_HASH

_ERR_CREDENCIALES = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Cédula o contraseña incorrectos.",
    headers={"WWW-Authenticate": "Bearer"},
)


# ── Helpers privados ───────────────────────────────────────────────────────────

def _sha256(texto: str) -> str:
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def _bcrypt_hash(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def _bcrypt_verify(contrasena: str, hash_almacenado: str) -> bool:
    return bcrypt.checkpw(contrasena.encode("utf-8"), hash_almacenado.encode("utf-8"))


def _verificar_y_migrar(id_usr: int, contrasena: str, hash_almacenado: str) -> bool:
    """
    Verifica la contraseña contra el hash en BD.
    Si el hash es SHA-256 legacy y coincide, lo migra a bcrypt en ese mismo request.
    """
    es_bcrypt = hash_almacenado.startswith(("$2b$", "$2a$", "$2y$"))

    if es_bcrypt:
        return _bcrypt_verify(contrasena, hash_almacenado)

    if _sha256(contrasena) != hash_almacenado:
        return False

    # Migración transparente: próximos logins usarán bcrypt
    try:
        auth_repo.actualizar_contrasena(id_usr, _bcrypt_hash(contrasena))
    except psycopg2.Error:
        pass  # Login sigue siendo válido aunque falle la escritura de migración

    return True


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse, summary="Iniciar sesión")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest) -> LoginResponse:
    try:
        fila = auth_repo.buscar_fila_por_cedula(body.cedula)
    except psycopg2.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar a la base de datos.",
        )

    if fila is None:
        bcrypt.checkpw(b"dummy", _get_dummy_hash())
        raise _ERR_CREDENCIALES

    id_usr, nombre, apellido, rol, hash_almacenado, maestria_id = fila

    if not _verificar_y_migrar(id_usr, body.contrasena, hash_almacenado):
        raise _ERR_CREDENCIALES

    nombre_completo = f"{nombre} {apellido}"
    ctx   = SessionContext(rol=rol, nombre=nombre_completo, cedula=body.cedula, maestria_id=maestria_id)
    token = create_session(ctx)

    return LoginResponse(
        token=token,
        rol=rol,
        nombre=nombre_completo,
        cedula=body.cedula,
        maestria_id=maestria_id,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Cerrar sesión")
def logout(authorization: Annotated[str | None, Header()] = None) -> None:
    """Invalida el token en memoria. Idempotente: no falla si ya expiró."""
    if authorization:
        _, _, token = authorization.partition(" ")
        if token:
            destroy_session(token)


@router.post("/login-consultor", response_model=LoginResponse, summary="Consulta pública por cédula")
@limiter.limit("10/minute")
def login_consultor(request: Request, body: ConsultorRequest) -> LoginResponse:
    """Autenticación sin contraseña para estudiantes y profesores.
    Solo requiere cédula; crea sesión con rol 'Consultor' (solo lectura)."""
    try:
        resultado = auth_repo.buscar_cedula_en_tablas(body.cedula)
    except psycopg2.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar a la base de datos.",
        )
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ningún registro para esta cédula en el sistema.",
        )
    nombre, apellido, tipo = resultado
    nombre_completo = f"{nombre} {apellido}"
    ctx   = SessionContext(rol="Consultor", nombre=nombre_completo, cedula=body.cedula, maestria_id=None)
    token = create_session(ctx)
    return LoginResponse(
        token=token,
        rol="Consultor",
        nombre=nombre_completo,
        cedula=body.cedula,
        maestria_id=None,
        tipo_consultor=tipo,
    )


@router.get("/me", response_model=SessionInfo, summary="Sesión activa")
def me(sesion: SessionDep) -> SessionInfo:
    """Devuelve los datos de la sesión actual."""
    return SessionInfo(
        rol=sesion.rol,
        nombre=sesion.nombre,
        cedula=sesion.cedula,
        maestria_id=sesion.maestria_id,
    )
