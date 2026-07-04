import secrets
from django.core.cache import cache

TICKET_PREFIX = "ws_ticket:"
TICKET_TTL_SECONDS = 15  # el ticket debe usarse casi de inmediato


def generar_ticket(user_id: int) -> str:
    """
    Genera un ticket aleatorio de un solo uso, ligado al user_id,
    con expiración corta.
    """
    ticket = secrets.token_urlsafe(32)
    cache.set(f"{TICKET_PREFIX}{ticket}", user_id, timeout=TICKET_TTL_SECONDS)
    return ticket


def consumir_ticket(ticket: str):
    """
    Valida el ticket y lo elimina inmediatamente (uso único).
    Devuelve el user_id si es válido, o None si no lo es / ya expiró / ya se usó.
    """
    key = f"{TICKET_PREFIX}{ticket}"
    user_id = cache.get(key)
    if user_id is not None:
        cache.delete(key)  # invalida de inmediato, aunque sea válido
    return user_id