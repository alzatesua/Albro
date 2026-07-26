from django.conf import settings
from notificaciones.services import crear_notificacion

def notificar_mensaje(mensaje):
    conversacion = mensaje.conversacion
    remitente = mensaje.remitente
    escribe_el_cliente = conversacion.cliente_id == remitente.id

    if escribe_el_cliente:
        destinatario_id = conversacion.profesional.usuario_id
    else:
        destinatario_id = conversacion.cliente_id

    if not destinatario_id or destinatario_id == remitente.id:
        return

    remitente_nombre = f"{remitente.nombre} {remitente.apellido}".strip()

    crear_notificacion(
        usuario_id=destinatario_id,
        tipo="mensaje",
        evento="nuevo_mensaje",
        titulo=f"Nuevo mensaje de {remitente_nombre}",
        mensaje=mensaje.contenido[:255],
        data={"conversacion": conversacion.id, "remitente": remitente.id},
        content_type_app="mensajeria.Conversacion",
        object_id=conversacion.id,
    )

    # El correo de "no respondido" solo aplica cuando escribe el CLIENTE
    # y el destinatario (que debe responder) es el profesional.
    if escribe_el_cliente:
        from notificaciones.tasks import tarea_enviar_correo_mensaje_no_respondido
        tarea_enviar_correo_mensaje_no_respondido.apply_async(
            args=[mensaje.id],
            countdown=settings.MENSAJE_NO_RESPONDIDO_DELAY,
        )