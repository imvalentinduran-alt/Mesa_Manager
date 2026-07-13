from dataclasses import dataclass


@dataclass
class Usuario:
    id:          int
    cedula:      str
    nombre:      str
    apellido:    str
    rol:         str
    maestria_id: int | None
