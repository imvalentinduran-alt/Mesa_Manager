from dataclasses import dataclass


@dataclass
class MesaDefensa:
    """
    Modelo de lectura unificado — cubre tanto el listado general como el
    panel de monitoreo. Todos los campos vienen de un JOIN completo con
    profesores (INNER para comité, LEFT para efectivos).
    El orden de campos debe coincidir exactamente con _SQL_MESAS_BASE.
    """
    id:                           int
    id_estudiante:                int
    cedula_estudiante:            str
    nombre_estudiante:            str
    titulo_proyecto:              str
    maestria:                     str | None
    id_aula:                      int
    aula:                         str
    ubicacion:                    str
    fecha:                        str        # DD/MM/YYYY
    hora_inicio:                  str        # HH:MM
    hora_fin:                     str        # HH:MM
    tipo_mesa:                    int
    estado:                       str
    # Comité (6 posiciones, todos NOT NULL en DB)
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
    # Efectivos (NULL hasta registrar quórum)
    tutor_efectivo_id:            int | None
    tutor_efectivo:               str | None
    cedula_tutor_efectivo:        str | None
    jurado1_efectivo_id:          int | None
    jurado1_efectivo:             str | None
    cedula_jurado1_efectivo:      str | None
    jurado2_efectivo_id:          int | None
    jurado2_efectivo:             str | None
    cedula_jurado2_efectivo:      str | None
    # Asistencia y control
    asistencia_estudiante:        bool
    iniciada_por_profesor_id:     int | None
    # Veredicto y correcciones
    veredicto:                    str | None
    dias_correccion:              int | None
    fecha_limite_correccion:      str | None
    fecha_validacion_correcciones: str | None
