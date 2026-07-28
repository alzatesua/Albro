# panel_admin/utils.py
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def enviar_codigo_otp_correo(operador, codigo):
    contexto = {
        'operador': operador,
        'codigo': codigo,
        'nombre_empresa': 'Albro',
    }

    asunto = 'Tu código de acceso al Panel Admin'
    cuerpo_texto = render_to_string('panel_admin/emails/codigo_otp.txt', contexto)
    cuerpo_html = render_to_string('panel_admin/emails/codigo_otp.html', contexto)

    email = EmailMultiAlternatives(
        subject=asunto,
        body=cuerpo_texto,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[operador.email],
    )
    email.attach_alternative(cuerpo_html, "text/html")
    email.send(fail_silently=False)