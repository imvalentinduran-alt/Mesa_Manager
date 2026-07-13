from dataclasses import dataclass


@dataclass
class Profesor:
    id:           int
    cedula:       str
    nombre:       str
    apellido:     str
    especialidad:       str
    correo_electronico: str
    is_active:          bool = True

    @property
    def nombre_completo(self) -> str:
        return f"{self.apellido}, {self.nombre}"
