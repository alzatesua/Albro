from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from notificaciones.services import crear_notificacion


TITULOS = {
    "creada": "Nueva cita agendada",
    "actualizada": "Cita actualizada",
    "cancelada": "Cita cancelada",
    "confirmada": "Cita confirmada",
    "completada": "Cita completada",
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