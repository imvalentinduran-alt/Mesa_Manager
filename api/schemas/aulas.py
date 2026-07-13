from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Ubicacion = Literal["Docencia", "Extensión", "Postgrado", "Doctorado"]


class AulaIn(BaseModel):
    nombre_aula:   str       = Field(..., min_length=1, max_length=100)
    ubicacion:     Ubicacion
    tiene_equipos: bool      = False


class AulaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    nombre_aula:   str
    ubicacion:     str
    tiene_equipos: bool
