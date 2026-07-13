from dataclasses import dataclass


@dataclass
class SessionContext:
    rol:         str
    nombre:      str
    cedula:      str
    maestria_id: int | None  # None cuando rol == 'Jefa'
