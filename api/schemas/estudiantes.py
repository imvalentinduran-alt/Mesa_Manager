from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field


class EstudianteCreate(BaseModel):
    cedula:               str      = Field(..., pattern=r"^\d{7,10}$")
    tipo_documento:       str      = "Venezolano"
    pasaporte:            str | None = Field(None, max_length=30)
    nombre:               str      = Field(..., min_length=1, max_length=100)
    apellido:             str      = Field(..., min_length=1, max_length=100)
    maestria_id:          int | None = None  # Coordinador: se sobreescribe con sesion.maestria_id
    cohorte:              str      = Field(..., min_length=1, max_length=20)
    titulo_proyecto:      str      = ""
    correo_electronico:   str      = Field(..., min_length=1, max_length=100)
    id_tutor_principal:   int
    id_tutor_suplente:    int
    id_jurado1_principal: int
    id_jurado1_suplente:  int
    id_jurado2_principal: int
    id_jurado2_suplente:  int


class EstudianteUpdate(BaseModel):
    cedula:             str      = Field(..., pattern=r"^\d{7,10}$")
    tipo_documento:     str      = "Venezolano"
    pasaporte:          str | None = Field(None, max_length=30)
    nombre:             str      = Field(..., min_length=1, max_length=100)
    apellido:           str      = Field(..., min_length=1, max_length=100)
    cohorte:            str      = Field(..., min_length=1, max_length=20)
    titulo_proyecto:    str      = ""
    correo_electronico: str      = Field(..., min_length=1, max_length=100)


class SolvenciaUpdate(BaseModel):
    numero_mesa:       int     = Field(..., ge=1, le=3)
    recibo:            str     = Field(..., min_length=1)
    monto:             Decimal = Field(..., gt=0)
    dia_transferencia: date    = Field(...)
    num_recibo_caja:   str     = Field(..., min_length=1)


class EstudianteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                   int
    cedula:               str
    tipo_documento:       str
    pasaporte:            str | None = None
    nombre:               str
    apellido:             str
    maestria_id:          int
    cohorte:              str
    titulo_proyecto:      str
    correo_electronico:   str
    id_tutor_principal:   int
    id_tutor_suplente:    int
    id_jurado1_principal: int
    id_jurado1_suplente:  int
    id_jurado2_principal: int
    id_jurado2_suplente:  int
    recibo_m1:            str | None
    monto_m1:             Decimal | None
    verificado_m1:        bool
    recibo_m2:            str | None
    monto_m2:             Decimal | None
    verificado_m2:        bool
    recibo_m3:            str | None
    monto_m3:             Decimal | None
    verificado_m3:        bool
    dia_transferencia_m1: date | None = None
    recibo_caja_m1:       str  | None = None
    dia_transferencia_m2: date | None = None
    recibo_caja_m2:       str  | None = None
    dia_transferencia_m3: date | None = None
    recibo_caja_m3:       str  | None = None

    @computed_field
    @property
    def nombre_completo(self) -> str:
        return f"{self.apellido}, {self.nombre}"
