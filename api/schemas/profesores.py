from pydantic import BaseModel, ConfigDict, Field, computed_field


class ProfesorIn(BaseModel):
    cedula:             str  = Field(..., pattern=r"^\d{7,10}$")
    nombre:             str  = Field(..., min_length=1, max_length=100)
    apellido:           str  = Field(..., min_length=1, max_length=100)
    especialidad:       str  = Field(..., min_length=1, max_length=200)
    correo_electronico: str  = Field(..., pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", max_length=100)
    is_active:          bool = Field(True)


class ProfesorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                 int
    cedula:             str
    nombre:             str
    apellido:           str
    especialidad:       str
    correo_electronico: str
    is_active:          bool

    @computed_field
    @property
    def nombre_completo(self) -> str:
        return f"{self.apellido}, {self.nombre}"
