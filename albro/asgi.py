"""
ASGI config for albro project.
Expone el ASGI callable como `application`, incluyendo soporte
para HTTP (Django normal) y WebSocket (Channels).
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'albro.settings')

# Debe inicializarse ANTES de importar cualquier cosa que toque modelos
# (routing, consumers, middleware), para evitar AppRegistryNotReady.
django_asgi_app = get_asgi_application()

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