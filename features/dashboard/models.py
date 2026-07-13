from dataclasses import dataclass


@dataclass
class KPIs:
    total_historico:          int
    defensas_mes:             int
    defensas_mes_anterior:    int
    tasa_aprobacion:          float   # 0.0 – 100.0
    tasa_anterior:            float
    estudiantes_registrados:  int
    estudiantes_mes:          int
    nombre_mes:               str     # "Junio"


@dataclass
class DiaActividad:
    fecha: str   # ISO YYYY-MM-DD
    count: int


@dataclass
class ProximaMesa:
    id:          int
    estudiante:  str
    titulo:      str
    fecha:       str   # ISO YYYY-MM-DD
    hora_inicio: str
    hora_fin:    str
    aula:        str
    tipo_mesa:   int
    estado:      str
    tutor:       str
    jurado1:     str
    jurado2:     str


@dataclass
class MesaPendienteCierre:
    id:          int
    estudiante:  str
    titulo:      str
    fecha:       str   # DD/MM/YYYY
    hora_inicio: str
    hora_fin:    str
    aula:        str
    tipo_mesa:   int
    estado:      str   # 'Programada' | 'En_Curso'
    maestria:    str


@dataclass
class DefensaReciente:
    id:          int
    estudiante:  str
    cedula:      str
    titulo:      str
    fecha:       str   # DD/MM/YYYY
    hora_inicio: str
    aula:        str
    tutor:       str
    jurado1:     str
    jurado2:     str
    estado:      str


@dataclass
class DefensaReporte:
    """Igual que DefensaReciente pero incluye maestría — solo para el PDF."""
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
    maestria:    str
