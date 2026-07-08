from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notificacion
from .serializers import NotificacionSerializer


def crear_notificacion(
    usuario_id: int,
    tipo: str,
    evento: str,
    titulo: str,
    mensaje: str = "",
    data: dict = None,
    content_type_app: str = "",
    object_id: int = None,
):
    """
    Crea el registro persistente y lo empuja por WS al usuario dueño.
    Si el usuario no está conectado, el mensaje simplemente no se
    entrega en vivo, pero queda en la tabla para listarla después.
    """
    notif = Notificacion.objects.create(
        usuario_id=usuario_id,
        tipo=tipo,
        evento=evento,
        titulo=titulo,
        mensaje=mensaje,
        data=data or {},
        content_type_app=content_type_app,
        object_id=object_id,
    )

    channel_layer = get_channel_layer()
    if channel_layer is not None:
        payload = NotificacionSerializer(notif).data
        async_to_sync(channel_layer.group_send)(
            f"user_{usuario_id}",
            {
                "type": "notificacion_push",  # método en el consumer
                "notificacion": payload,
            },
        )

    return notif