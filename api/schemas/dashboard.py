from pydantic import BaseModel


class KPIsOut(BaseModel):
    total_historico:          int
    defensas_mes:             int
    defensas_mes_anterior:    int
    tasa_aprobacion:          float
    tasa_anterior:            float
    estudiantes_registrados:  int
    estudiantes_mes:          int
    nombre_mes:               str


class DiaActividadOut(BaseModel):
    fecha: str
    count: int


class ProximaMesaOut(BaseModel):
    id:          int
    estudiante:  str
    titulo:      str
    fecha:       str
    hora_inicio: str
    hora_fin:    str
    aula:        str
    tipo_mesa:   int
    estado:      str
    tutor:       str
    jurado1:     str
    jurado2:     str


class MesaPendienteCierreOut(BaseModel):
    id:          int
    estudiante:  str
    titulo:      str
    fecha:       str
    hora_inicio: str
    hora_fin:    str
    aula:        str
    tipo_mesa:   int
    estado:      str
    maestria:    str


class DefensaRecienteOut(BaseModel):
    id:          int
    estudiante:  str
    cedula:      str
    titulo:      str
    fecha:       str
    hora_inicio: str
    aula:        str
    tutor:       str
    jurado1:     str
    jurado2:     str
    estado:      str
