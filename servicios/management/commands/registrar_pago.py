# servicios/management/commands/registrar_pago.py
from django.core.management.base import BaseCommand, CommandError
from usuarios.models import Usuario
from servicios.utils import registrar_pago_manual


class Command(BaseCommand):
    help = 'Registra manualmente un pago confirmado por transferencia, genera factura y la envía por correo.'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email del usuario que pagó')
        parser.add_argument('monto', type=float, help='Monto pagado')
        parser.add_argument(
            '--plan',
            type=str,
            default='mensual',
            choices=['mensual', 'anual'],
            help='Plan pagado (default: mensual)'
        )
        parser.add_argument(
            '--referencia',
            type=str,
            default=None,
            help='Referencia de la transferencia (opcional)'
        )

    def handle(self, *args, **options):
        email = options['email']
        monto = options['monto']
        plan = options['plan']
        referencia = options['referencia']

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise CommandError(f'No existe un usuario con el email "{email}"')

        pago, factura = registrar_pago_manual(
            usuario=usuario,
            monto=monto,
            plan=plan,
            referencia=referencia,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Pago registrado correctamente.\n'
            f'   Usuario: {usuario.email}\n'
            f'   Factura: {factura.numero_factura}\n'
            f'   Monto: ${pago.monto:,.0f}\n'
            f'   Vence: {pago.membresia.fecha_vencimiento.strftime("%d/%m/%Y")}\n'
            f'   Correo enviado ✔️'
        ))