from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class Estudiante:
    id:                   int
    cedula:               str
    tipo_documento:       str
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
    dia_transferencia_m1: date | None
    recibo_caja_m1:       str | None
    dia_transferencia_m2: date | None
    recibo_caja_m2:       str | None
    dia_transferencia_m3: date | None
    recibo_caja_m3:       str | None
    pasaporte:            str | None

    @property
    def nombre_completo(self) -> str:
        return f"{self.apellido}, {self.nombre}"
