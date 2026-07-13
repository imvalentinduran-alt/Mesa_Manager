from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    cedula:     str = Field(..., min_length=7, max_length=8, pattern=r"^\d+$")
    contrasena: str = Field(..., min_length=1, max_length=128)


class ConsultorRequest(BaseModel):
    cedula: str = Field(..., min_length=7, max_length=10, pattern=r"^\d+$")


class LoginResponse(BaseModel):
    token:          str
    rol:            str
    nombre:         str
    cedula:         str
    maestria_id:    int | None = None
    tipo_consultor: str | None = None  # 'Estudiante' | 'Profesor' solo para rol='Consultor'


class SessionInfo(BaseModel):
    rol:            str
    nombre:         str
    cedula:         str
    maestria_id:    int | None = None
    tipo_consultor: str | None = None
