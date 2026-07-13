from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ─── Entrada ─────────────────────────────────────────────────────────────────

class MesaCreate(BaseModel):
    id_estudiante: int
    id_aula:       int
    fecha:         str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$",
                               description="Formato YYYY-MM-DD")
    hora_inicio:   str = Field(..., pattern=r"^\d{2}:\d{2}$",
                               description="Formato HH:MM (08:00–12:20)")


class MesaEdit(BaseModel):
    """Solo aula, fecha y hora son editables. Sólo válido en estado 'Programada'."""
    id_aula:     int
    fecha:       str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    hora_inicio: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class QuorumIn(BaseModel):
    tutor_efectivo_id:       int | None
    jurado1_efectivo_id:     int | None
    jurado2_efectivo_id:     int | None
    asistencia_estudiante:   bool
    iniciada_por_profesor_id: int


class VeredictoIn(BaseModel):
    veredicto:       Literal["Aprobado", "Con_Correcciones", "Reprobado"]
    dias_correccion: int = Field(15, ge=1)


# ─── Salida principal ─────────────────────────────────────────────────────────

class MesaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                           int
    id_estudiante:                int
    cedula_estudiante:            str
    nombre_estudiante:            str
    titulo_proyecto:              str
    maestria:                     str | None = None
    id_aula:                      int
    aula:                         str
    ubicacion:                    str
    fecha:                        str
    hora_inicio:                  str
    hora_fin:                     str
    tipo_mesa:                    int
    estado:                       str
    id_tutor_principal:           int
    tutor_principal:              str
    cedula_tutor_principal:       str
    id_tutor_suplente:            int
    tutor_suplente:               str
    cedula_tutor_suplente:        str
    id_jurado1_principal:         int
    jurado1_principal:            str
    cedula_jurado1_principal:     str
    id_jurado1_suplente:          int
    jurado1_suplente:             str
    cedula_jurado1_suplente:      str
    id_jurado2_principal:         int
    jurado2_principal:            str
    cedula_jurado2_principal:     str
    id_jurado2_suplente:          int
    jurado2_suplente:             str
    cedula_jurado2_suplente:      str
    tutor_efectivo_id:            int | None
    tutor_efectivo:               str | None
    cedula_tutor_efectivo:        str | None
    jurado1_efectivo_id:          int | None
    jurado1_efectivo:             str | None
    cedula_jurado1_efectivo:      str | None
    jurado2_efectivo_id:          int | None
    jurado2_efectivo:             str | None
    cedula_jurado2_efectivo:      str | None
    asistencia_estudiante:        bool
    iniciada_por_profesor_id:     int | None
    veredicto:                    str | None
    dias_correccion:              int | None
    fecha_limite_correccion:      str | None
    fecha_validacion_correcciones: str | None


# ─── Monitoreo ────────────────────────────────────────────────────────────────

class AsistenciaOut(BaseModel):
    estudiante: bool
    tutor:      bool
    jurado1:    bool
    jurado2:    bool


class MesaMonitoreoOut(BaseModel):
    id:                  int
    codigo:              str
    estudiante:          str
    titulo:              str
    tutor:               str
    jurado1:             str
    jurado2:             str
    aula:                str
    ubicacion:           str
    hora_inicio:         str
    hora_fin:            str
    estado:              str
    tipo_mesa:           int
    asistencia:          AsistenciaOut
    minutos_restantes:   int | None
    en_sobretiempo:      bool
    cedula_estudiante:   str
    cedula_tutor:        str
    cedula_jurado1:      str
    cedula_jurado2:      str


class MonitoreoColumnasOut(BaseModel):
    en_curso:   list[MesaMonitoreoOut]
    programada: list[MesaMonitoreoOut]
    concluida:  list[MesaMonitoreoOut]


class MonitoreoTotalesOut(BaseModel):
    en_curso:   int
    programada: int
    concluida:  int


class MonitoreoOut(BaseModel):
    fecha:    str
    columnas: MonitoreoColumnasOut
    totales:  MonitoreoTotalesOut


# ─── Portales públicos ────────────────────────────────────────────────────────

class MesaPortalProfesorOut(BaseModel):
    id:          int
    rol:         str
    tipo_mesa:   int
    estado:      str
    fecha:       str
    hora_inicio: str
    hora_fin:    str
    aula:        str
    estudiante:  str
    titulo:      str
    veredicto:   str | None


class PortalProfesorOut(BaseModel):
    nombre: str
    cedula: str
    mesas:  list[MesaPortalProfesorOut]


class MesaPortalEstudianteOut(BaseModel):
    tipo_mesa:                     int
    estado:                        str
    veredicto:                     str | None
    fecha:                         str | None
    hora_inicio:                   str | None
    aula:                          str | None
    fecha_limite_correccion:       str | None
    fecha_validacion_correcciones: str | None
    tutor_principal:               str | None = None
    tutor_suplente:                str | None = None
    jurado1_principal:             str | None = None
    jurado1_suplente:              str | None = None
    jurado2_principal:             str | None = None
    jurado2_suplente:              str | None = None


class PortalEstudianteOut(BaseModel):
    nombre:          str
    cedula:          str
    maestria:        str
    titulo_proyecto: str
    verificado_m1:   bool
    monto_m1:        float | None
    verificado_m2:   bool
    monto_m2:        float | None
    verificado_m3:   bool
    monto_m3:        float | None
    mesas:           list[MesaPortalEstudianteOut]
