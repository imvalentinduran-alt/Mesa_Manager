"""
Dependencias de seguridad inyectadas en los routers vía FastAPI Depends.

Arquitectura de sesiones (JWT stateless):
  - El token se genera en el login y se firma con JWT_SECRET (env var).
  - El servidor no guarda estado — un reinicio de Railway no invalida sesiones activas.
  - TTL: 8 horas. El frontend ya tiene logout por inactividad a los 32 min.
  - Logout: el cliente descarta el token. No requiere acción server-side.

Flujo de autenticación:
  POST /api/auth/login  →  create_session()  →  token JWT devuelto al cliente
  Header: Authorization: Bearer <token>      →  get_session() / require_jefa() / require_coordinador()
  POST /api/auth/logout →  destroy_session() (no-op stateless)
"""

import os
import time
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from core.session import SessionContext

# ─── Configuración JWT ────────────────────────────────────────────────────────

SESSION_TTL = 8 * 60 * 60  # 8 horas

try:
    _JWT_SECRET = os.environ["JWT_SECRET"]
except KeyError:
    raise RuntimeError(
        "Falta la variable de entorno JWT_SECRET. "
        "Genera una clave aleatoria (ej: python -c \"import secrets; print(secrets.token_hex(32))\") "
        "y agrégala en Railway → Variables."
    )

_JWT_ALG = "HS256"


# ─── Gestión de sesiones ─────────────────────────────────────────────────────

def create_session(context: SessionContext) -> str:
    """Genera un token JWT firmado con los datos de la sesión."""
    now = int(time.time())
    payload = {
        "sub":         context.cedula,
        "rol":         context.rol,
        "nombre":      context.nombre,
        "maestria_id": context.maestria_id,
        "iat":         now,
        "exp":         now + SESSION_TTL,
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALG)


def destroy_session(token: str) -> None:
    """JWT es stateless — el cliente descarta el token. No se requiere acción server-side."""
    pass


# ─── Extracción del token ─────────────────────────────────────────────────────

def _extract_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato requerido: Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


# ─── Dependencias de autenticación y autorización ────────────────────────────

def get_session(token: str = Depends(_extract_token)) -> SessionContext:
    """Dependencia base — cualquier usuario autenticado."""
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada. Inicia sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida. Inicia sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return SessionContext(
        rol=payload["rol"],
        nombre=payload["nombre"],
        cedula=payload["sub"],
        maestria_id=payload.get("maestria_id"),
    )


def require_jefa(session: SessionContext = Depends(get_session)) -> SessionContext:
    """Solo el rol 'Jefa'. Para endpoints de administración global."""
    if session.rol != "Jefa":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acción requiere el rol Jefa.",
        )
    return session


def require_coordinador(session: SessionContext = Depends(get_session)) -> SessionContext:
    """Solo el rol 'Coordinador'. Para endpoints con filtrado implícito por maestria_id."""
    if session.rol != "Coordinador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acción requiere el rol Coordinador.",
        )
    return session


def require_write_role(session: SessionContext = Depends(get_session)) -> SessionContext:
    """Bloquea el rol Consultor. Permite Jefa y Coordinador."""
    if session.rol == "Consultor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El rol Consultor no puede realizar modificaciones.",
        )
    return session


# ─── Helper compartido para el patrón (bool, str) del service layer ──────────

def ok_or_400(result: tuple[bool, str]) -> None:
    """Convierte un resultado (False, msg) del service en HTTPException 400."""
    ok, msg = result
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


# ─── Type aliases para inyección declarativa en routers ──────────────────────

SessionDep     = Annotated[SessionContext, Depends(get_session)]
JefaDep        = Annotated[SessionContext, Depends(require_jefa)]
CoordinadorDep = Annotated[SessionContext, Depends(require_coordinador)]
WriteRoleDep   = Annotated[SessionContext, Depends(require_write_role)]
