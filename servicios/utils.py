# servicios/utils.py
import uuid
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from dateutil.relativedelta import relativedelta
from .models import Membresia, Pago, Factura
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
import io
from django.core.files.base import ContentFile
from weasyprint import HTML


def registrar_pago_manual(usuario, monto, plan='mensual', referencia=None):
    """
    Registra un pago confirmado manualmente (ej. transferencia bancaria),
    genera la factura y actualiza el acceso del usuario.
    """
    membresia, _ = Membresia.objects.get_or_create(usuario=usuario)

    if not referencia:
        referencia = f'TRANSF-{uuid.uuid4().hex[:8].upper()}'

    pago = Pago.objects.create(
        membresia=membresia,
        monto=monto,
        estado='exitoso',
        pasarela='manual',
        referencia_interna=referencia,
        referencia_pasarela=referencia,
        fecha_confirmacion=timezone.now(),
    )

    factura = Factura.objects.create(
        pago=pago,
        razon_social=f'{usuario.nombre} {usuario.apellido}',
        subtotal=monto,
        impuestos=0,
        total=monto,
    )

    dias = 365 if plan == 'anual' else 30
    membresia.plan = plan
    membresia.pagado = True
    membresia.estado = 'activa'
    membresia.fecha_pago = timezone.now()
    membresia.fecha_vencimiento = timezone.now() + relativedelta(days=dias)
    membresia.save()

    usuario.en_produccion = True
    usuario.save()

    generar_pdf_factura(factura)
    enviar_factura_por_correo(factura)

    return pago, factura


def enviar_factura_por_correo(factura):
    usuario = factura.pago.membresia.usuario
    membresia = factura.pago.membresia
    pago = factura.pago

    contexto = {
        'usuario': usuario,
        'factura': factura,
        'membresia': membresia,
        'pago': pago,
        'nombre_empresa': 'Albro', 
    }

    asunto = f'Confirmación de pago - Factura {factura.numero_factura}'
    cuerpo_texto = render_to_string('servicios/emails/factura.txt', contexto)
    cuerpo_html = render_to_string('servicios/emails/factura.html', contexto)

    email = EmailMultiAlternatives(
        subject=asunto,
        body=cuerpo_texto,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[usuario.email],
    )
    email.attach_alternative(cuerpo_html, "text/html")

    if factura.archivo_pdf:
        email.attach_file(factura.archivo_pdf.path)

    email.send(fail_silently=False)
    return True



def generar_pdf_factura(factura):
    membresia = factura.pago.membresia
    usuario = membresia.usuario
    pago = factura.pago

    contexto = {
        'usuario': usuario,
        'factura': factura,
        'membresia': membresia,
        'pago': pago,
        'nombre_empresa': 'Albro',
    }

    html_string = render_to_string('servicios/emails/factura.html', contexto)

    pdf_bytes = HTML(string=html_string).write_pdf()

    nombre_archivo = f'{factura.numero_factura}.pdf'
    factura.archivo_pdf.save(
        nombre_archivo,
        ContentFile(pdf_bytes),
        save=True
    )

    return factura