from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from notificaciones.services import crear_notificacion
from notificaciones.emails import enviar_correo_cita_pendiente


TITULOS = {
    "creada": "Nueva cita agendada",
    "actualizada": "Cita actualizada",
    "cancelada": "Cita cancelada",
    "confirmada": "Cita confirmada",
    "completada": "Cita completada",
    "reagendada": "Cita reagendada",
}

def notificar_cita(cita, tipo, actor_id=None):
    from .serializers import CitaSerializer
    data = CitaSerializer(cita).data
    titulo = TITULOS.get(tipo, "Actualización de cita")

    destinatarios_ids = set()
    if cita.cliente_id:
        destinatarios_ids.add(cita.cliente_id)
    if getattr(cita, "profesional_id", None) and getattr(cita.profesional, "usuario_id", None):
        destinatarios_ids.add(cita.profesional.usuario_id)

    if actor_id is not None:
        destinatarios_ids.discard(actor_id)

    channel_layer = get_channel_layer()

    for user_id in destinatarios_ids:
        crear_notificacion(
            usuario_id=user_id,
            tipo="cita",
            evento=tipo,
            titulo=titulo,
            mensaje=f"Cita del {cita.fecha} a las {cita.hora_inicio}",
            data=data,
            content_type_app="citas.Cita",
            object_id=cita.id,
        )
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {"type": "cita_actualizada", "tipo": tipo, "cita": data},
        )

    # Correo al profesional: solo si queda pendiente y no fue él quien la dejó así
    profesional_usuario_id = getattr(cita.profesional, "usuario_id", None)
    if (
        tipo in ("creada", "reagendada")
        and cita.estado == "pendiente"
        and profesional_usuario_id != actor_id
    ):
        try:
            enviar_correo_cita_pendiente(cita)
        except Exception:
            import logging
            logging.getLogger(__name__).exception(
                "No se pudo enviar el correo de cita pendiente para cita %s", cita.id
            )