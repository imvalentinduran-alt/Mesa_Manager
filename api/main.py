import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

_base = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_base))

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.limiter import limiter
from config_db import inicializar_tablas
from core.database import close_pool, init_pool

load_dotenv(_base / ".env")

_EN_PRODUCCION = os.environ.get("RAILWAY_ENVIRONMENT") == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pool(minconn=2, maxconn=10)
    inicializar_tablas()
    yield
    close_pool()


app = FastAPI(
    title="UPEL Mesa Manager API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if _EN_PRODUCCION else "/docs",
    redoc_url=None if _EN_PRODUCCION else "/redoc",
    openapi_url=None if _EN_PRODUCCION else "/openapi.json",
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse({"detail": "Datos de entrada inválidos."}, status_code=422)


@app.exception_handler(Exception)
async def _global_500_handler(request: Request, exc: Exception) -> JSONResponse:
    from starlette.exceptions import HTTPException as StarletteHTTPException
    if isinstance(exc, StarletteHTTPException):
        raise exc
    return JSONResponse({"detail": "Error interno del servidor."}, status_code=500)


@app.middleware("http")
async def _limit_body(request: Request, call_next):
    if int(request.headers.get("content-length", 0)) > 512_000:
        return JSONResponse({"detail": "Payload demasiado grande."}, status_code=413)
    return await call_next(request)


_TAURI_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "tauri://localhost",
    "https://tauri.localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_TAURI_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
from api.routers import auth, estudiantes, profesores, aulas, mesas, usuarios, dashboard, maestrias, auditoria

app.include_router(auth.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(maestrias.router,   prefix="/api/maestrias",   tags=["maestrias"])
app.include_router(estudiantes.router, prefix="/api/estudiantes", tags=["estudiantes"])
app.include_router(profesores.router,  prefix="/api/profesores",  tags=["profesores"])
app.include_router(aulas.router,       prefix="/api/aulas",       tags=["aulas"])
app.include_router(mesas.router,       prefix="/api/mesas",       tags=["mesas"])
app.include_router(usuarios.router,    prefix="/api/usuarios",    tags=["usuarios"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["dashboard"])
app.include_router(auditoria.router,   prefix="/api/auditoria",   tags=["auditoria"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    port = (
        int(sys.argv[1])
        if len(sys.argv) > 1
        else int(os.environ.get("PORT", 8000))
    )
    _host = "0.0.0.0" if _EN_PRODUCCION else "127.0.0.1"
    uvicorn.run(
        app,
        host=_host,
        port=port,
        log_level="warning",
        log_config=None,
    )
