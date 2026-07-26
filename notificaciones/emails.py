from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def _enviar_html(destinatario_email, asunto, template_name, contexto):
    if not destinatario_email:
        print("⚠️ No hay email de destinatario, se omite el envío")
        return
    html_content = render_to_string(template_name, contexto)
    texto_plano = strip_tags(html_content)
    send_mail(
        subject=asunto,
        message=texto_plano,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinatario_email],
        html_message=html_content,
        fail_silently=False,   # 🔍 temporalmente, para ver el error real
    )


def enviar_correo_cita_pendiente(cita):
    profesional = cita.profesional
    if not profesional.notificar_citas_por_correo:
        return

    contexto = {
        "profesional_nombre": profesional.usuario.nombre,
        "cliente_nombre": f"{cita.cliente.nombre} {cita.cliente.apellido}",
        "fecha": cita.fecha,
        "hora_inicio": cita.hora_inicio,
        "url_cita": f"{settings.FRONTEND_URL}/citas/{cita.id}",
    }
    _enviar_html(
        profesional.usuario.email,
        asunto="Tienes una cita pendiente por confirmar",
        template_name="notificaciones/email_cita_pendiente.html",
        contexto=contexto,
    )


def enviar_correo_mensaje_no_respondido(mensaje):
    conversacion = mensaje.conversacion
    profesional = conversacion.profesional
    if not profesional.notificar_mensajes_por_correo:
        return

    remitente = mensaje.remitente
    contexto = {
        "profesional_nombre": profesional.usuario.nombre,
        "cliente_nombre": f"{remitente.nombre} {remitente.apellido}",
        "contenido": mensaje.contenido,
        "url_chat": f"{settings.FRONTEND_URL}/chat/{conversacion.id}",
    }
    _enviar_html(
        profesional.usuario.email,
        asunto=f"Mensaje sin responder de {remitente.nombre}",
        template_name="notificaciones/email_mensaje_no_respondido.html",
        contexto=contexto,
    )