from channels.routing import ProtocolTypeRouter, URLRouter
import citas.routing
import mensajeria.routing
from citas.jwt_auth_middleware import TicketAuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TicketAuthMiddlewareStack(
        URLRouter(
            citas.routing.websocket_urlpatterns +
            mensajeria.routing.websocket_urlpatterns
        )
    ),
})