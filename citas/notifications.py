from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def notificar_cita(cita, tipo):
    """
    Envía la actualización de una cita a los grupos del cliente
    y del profesional asignado (si existe).

    tipo: "creada" | "actualizada" | "cancelada"
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        # CHANNEL_LAYERS no configurado; no rompemos el flujo HTTP normal.
        return

    from .serializers import CitaSerializer
    data = CitaSerializer(cita).data

    destinatarios_ids = set()
    if cita.cliente_id:
        destinatarios_ids.add(cita.cliente_id)
    if getattr(cita, "profesional_id", None) and getattr(cita.profesional, "usuario_id", None):
        destinatarios_ids.add(cita.profesional.usuario_id)

    for user_id in destinatarios_ids:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                "type": "cita_actualizada",  # debe matchear el método del consumer
                "tipo": tipo,
                "cita": data,
            },
        )