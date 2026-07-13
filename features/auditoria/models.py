from dataclasses import dataclass
from datetime import datetime


@dataclass
class EntradaAuditoria:
    id:          int
    fecha:       datetime
    usuario:     str
    rol:         str
    accion:      str
    modulo:      str
    registro_id: int | None
    detalle:     str
