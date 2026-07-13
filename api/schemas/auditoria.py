from datetime import datetime

from pydantic import BaseModel


class EntradaAuditoriaOut(BaseModel):
    id:          int
    fecha:       datetime
    usuario:     str
    rol:         str
    accion:      str
    modulo:      str
    registro_id: int | None
    detalle:     str

    model_config = {"from_attributes": True}
