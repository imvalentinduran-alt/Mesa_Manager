from datetime import datetime, timedelta

_DURACION_TIPO: dict[int, int] = {1: 40, 2: 40, 3: 60}
_HORA_APERTURA = datetime.strptime("08:00", "%H:%M")
_HORA_CIERRE   = datetime.strptime("13:00", "%H:%M")


def calcular_hora_fin(hora_inicio_str: str, tipo_mesa: int) -> str:
    """Retorna 'HH:MM' sumando la duración según el tipo (1/2 → 40 min, 3 → 60 min)."""
    minutos = _DURACION_TIPO.get(tipo_mesa)
    if minutos is None:
        raise ValueError(f"Tipo de mesa inválido: {tipo_mesa}. Debe ser 1, 2 o 3.")
    inicio = datetime.strptime(hora_inicio_str, "%H:%M")
    return (inicio + timedelta(minutes=minutos)).strftime("%H:%M")


def validar_horario_permitido(hora_inicio_str: str, hora_fin_str: str) -> tuple[bool, str]:
    """Verifica que el bloque completo esté dentro de 08:00–13:00."""
    try:
        inicio = datetime.strptime(hora_inicio_str, "%H:%M")
        fin    = datetime.strptime(hora_fin_str,    "%H:%M")
    except ValueError:
        return False, "Formato de hora inválido. Use HH:MM."

    if inicio < _HORA_APERTURA:
        return False, (
            f"La hora de inicio ({hora_inicio_str}) es anterior a las 08:00, "
            "que es la hora mínima de apertura permitida."
        )
    if fin > _HORA_CIERRE:
        return False, (
            f"La mesa finaliza a las {hora_fin_str}, lo cual excede el límite de las 13:00. "
            "Seleccione una hora de inicio que permita terminar antes de la 1:00 PM."
        )
    if inicio >= fin:
        return False, "La hora de inicio debe ser anterior a la hora de fin."

    return True, ""
