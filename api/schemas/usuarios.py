from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RolUsuario = Literal["Coordinador", "Jefa"]


class UsuarioIn(BaseModel):
    cedula:      str        = Field(..., min_length=7,  max_length=8)
    nombre:      str        = Field(..., min_length=1,  max_length=100)
    apellido:    str        = Field(..., min_length=1,  max_length=100)
    rol:         RolUsuario
    contrasena:  str        = Field(..., min_length=6,  max_length=100)
    maestria_id: int | None = None


class UsuarioUpdate(BaseModel):
    cedula:      str             = Field(..., min_length=7,  max_length=8)
    nombre:      str             = Field(..., min_length=1,  max_length=100)
    apellido:    str             = Field(..., min_length=1,  max_length=100)
    rol:         RolUsuario
    maestria_id: int | None      = None
    contrasena:  str | None      = Field(None, min_length=6, max_length=100)


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    cedula:      str
    nombre:      str
    apellido:    str
    rol:         str
    maestria_id: int | None = None
