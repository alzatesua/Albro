# servicios/pagos.py
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from django.core.mail import EmailMessage
from django.conf import settings
from .models import Usuario, Membresia, Pago, Factura

def registrar_pago(usuario, monto, pasarela='manual', referencia=None, plan='mensual'):
    membresia, _ = Membresia.objects.get_or_create(usuario=usuario)

    # 1. Registrar el pago en el historial
    pago = Pago.objects.create(
        membresia=membresia,
        monto=monto,
        pasarela=pasarela,
        referencia_pasarela=referencia,
        estado='exitoso'
    )

    # 2. Generar la factura asociada a ESE pago específico
    factura = Factura.objects.create(
        pago=pago,
        razon_social=f'{usuario.nombre} {usuario.apellido}',
        subtotal=monto,
        impuestos=0,  # ajusta según tu IVA/impuestos locales
        total=monto,
    )

    # 3. Actualizar el estado vigente de la membresía
    dias = 365 if plan == 'anual' else 30
    membresia.plan = plan
    membresia.pagado = True
    membresia.estado = 'activa'
    membresia.fecha_pago = timezone.now()
    membresia.fecha_vencimiento = timezone.now() + relativedelta(days=dias)
    membresia.save()

    # 4. Marcar al usuario como fuera de trial / en producción
    usuario.en_produccion = True
    usuario.save()

    return pago, factura




def enviar_factura_por_correo(factura):
    usuario = factura.pago.membresia.usuario

    asunto = f'Tu factura {factura.numero_factura}'
    cuerpo = (
        f'Hola {usuario.nombre},\n\n'
        f'Adjuntamos tu factura por el pago realizado el '
        f'{factura.fecha_emision.strftime("%d/%m/%Y")}.\n\n'
        f'Número de factura: {factura.numero_factura}\n'
        f'Total pagado: {factura.total} \n\n'
        f'Gracias por tu pago.\n'
    )

    email = EmailMessage(
        subject=asunto,
        body=cuerpo,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[usuario.email],
    )

    # Si ya tienes el PDF generado y guardado en el FileField, lo adjuntamos
    if factura.archivo_pdf:
        email.attach_file(factura.archivo_pdf.path)

    email.send(fail_silently=False)
    return True
