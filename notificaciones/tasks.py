from celery import shared_task


@shared_task
def tarea_enviar_correo_mensaje_no_respondido(mensaje_id):
    from mensajeria.models import Mensaje
    from .emails import enviar_correo_mensaje_no_respondido

    try:
        mensaje = Mensaje.objects.select_related(
            "conversacion", "conversacion__profesional__usuario", "remitente"
        ).get(id=mensaje_id)
    except Mensaje.DoesNotExist:
        return

    conversacion = mensaje.conversacion

    # Si el profesional ya escribió algo después de este mensaje, no hace falta correo
    ya_respondido = conversacion.mensajes.filter(
        remitente_id=conversacion.profesional.usuario_id,
        fecha_envio__gt=mensaje.fecha_envio,
    ).exists()
    if ya_respondido:
        return

    enviar_correo_mensaje_no_respondido(mensaje)