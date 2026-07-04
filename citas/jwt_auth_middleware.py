from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from .ws_tickets import consumir_ticket


@database_sync_to_async
def get_user_from_ticket(ticket):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if not ticket:
        return AnonymousUser()

    user_id = consumir_ticket(ticket)
    if user_id is None:
        return AnonymousUser()

    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class TicketAuthMiddleware:
    """
    Middleware ASGI que autentica conexiones WebSocket mediante
    un ticket de un solo uso (no el JWT completo).
    ws://host/ws/citas/?ticket=<ticket>
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        ticket = params.get("ticket", [None])[0]

        scope["user"] = await get_user_from_ticket(ticket)
        return await self.app(scope, receive, send)


def TicketAuthMiddlewareStack(inner):
    return TicketAuthMiddleware(inner)