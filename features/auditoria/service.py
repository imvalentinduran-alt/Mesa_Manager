import logging
from datetime import date

from core.session import SessionContext
from features.auditoria import repository
from features.auditoria.models import EntradaAuditoria

logger = logging.getLogger(__name__)


def registrar(
    sesion:      SessionContext,
    accion:      str,
    modulo:      str,
    registro_id: int | None,
    detalle:     str,
) -> None:
    try:
        repository.insertar(
            usuario=f"{sesion.nombre}",
            rol=sesion.rol,
            accion=accion,
            modulo=modulo,
            registro_id=registro_id,
            detalle=detalle,
        )
    except Exception as e:
        # La auditoría nunca debe interrumpir el flujo principal
        logger.warning("Error al registrar auditoría: %s", e)


def obtener_historial(
    accion: str | None = None,
    modulo: str | None = None,
    desde:  date | None = None,
    hasta:  date | None = None,
) -> list[EntradaAuditoria]:
    try:
        return repository.obtener_todos(accion=accion, modulo=modulo, desde=desde, hasta=hasta)
    except Exception as e:
        logger.warning("Error al obtener historial: %s", e)
        return []
