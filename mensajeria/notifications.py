from notificaciones.services import crear_notificacion


def notificar_mensaje(mensaje):
    """
    Crea y despacha la notificación persistente para el destinatario
    de un mensaje de chat recién guardado. Se llama desde el mismo
    contexto sync que guarda el mensaje (ver ChatConsumer.guardar_mensaje).
    """
    conversacion = mensaje.conversacion
    remitente = mensaje.remitente

    if conversacion.cliente_id == remitente.id:
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
        data={
            "conversacion": conversacion.id,
            "remitente": remitente.id,
        },
        content_type_app="mensajeria.Conversacion",
        object_id=conversacion.id,
    )