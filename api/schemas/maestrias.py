from pydantic import BaseModel, ConfigDict


class MaestriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             int
    nombre:         str
    codigo_interno: str
