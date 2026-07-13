from dataclasses import dataclass


@dataclass
class Aula:
    id:           int
    nombre_aula:  str
    ubicacion:    str
    tiene_equipos: bool
