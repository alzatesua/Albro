from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import AdminOperador, RegistroAuditoria
from .serializers import SolicitarCodigoSerializer, VerificarCodigoSerializer
from .authentication import generar_token, PanelAdminAuthentication
from .permissions import EsOperadorPanel
from .throttling import LoginPanelThrottle
from .utils import enviar_codigo_otp_correo


def get_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


class SolicitarCodigoView(APIView):
    """Paso 1: valida usuario/contraseña y envía el código OTP al correo."""
    permission_classes = [AllowAny]
    throttle_classes = [LoginPanelThrottle]

    def post(self, request):
        serializer = SolicitarCodigoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        try:
            operador = AdminOperador.objects.get(username=username, activo=True)
        except AdminOperador.DoesNotExist:
            # Mensaje genérico, no revela si el usuario existe o no
            return Response({'error': 'Credenciales inválidas'}, status=401)

        if not operador.check_password(password):
            return Response({'error': 'Credenciales inválidas'}, status=401)

        codigo = operador.generar_codigo_otp()
        enviar_codigo_otp_correo(operador, codigo)

        RegistroAuditoria.objects.create(
            operador=operador,
            accion='solicitar_codigo_otp',
            ip_origen=get_ip(request),
        )

        # Respuesta genérica: no confirmamos a qué correo se envió por seguridad
        return Response({'mensaje': 'Código enviado. Revisa tu correo.'})


class VerificarCodigoView(APIView):
    """Paso 2: valida el código OTP recibido por correo y entrega el token."""
    permission_classes = [AllowAny]
    throttle_classes = [LoginPanelThrottle]

    def post(self, request):
        serializer = VerificarCodigoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        codigo_otp = serializer.validated_data['codigo_otp']

        try:
            operador = AdminOperador.objects.get(username=username, activo=True)
        except AdminOperador.DoesNotExist:
            return Response({'error': 'Código inválido o expirado'}, status=401)

        if not operador.verificar_codigo_otp(codigo_otp):
            return Response({'error': 'Código inválido o expirado'}, status=401)

        operador.invalidar_codigo_otp()  # el código solo sirve una vez

        token = generar_token(operador)
        operador.ultimo_login = timezone.now()
        operador.save(update_fields=['ultimo_login'])

        RegistroAuditoria.objects.create(
            operador=operador,
            accion='login_exitoso',
            ip_origen=get_ip(request),
        )

        return Response({'access': token, 'expira_en_minutos': 30})


class ConfirmarPagoPanelView(APIView):
    authentication_classes = [PanelAdminAuthentication]
    permission_classes = [EsOperadorPanel]

    def post(self, request):
        from usuarios.models import Usuario
        from servicios.models import Pago
        from servicios.utils import registrar_pago_manual, confirmar_pago_pendiente

        email = request.data.get('email')
        monto = request.data.get('monto')
        plan = request.data.get('plan', 'mensual')
        referencia = request.data.get('referencia')
        pago_id = request.data.get('pago_id')

        if not email or not monto:
            return Response({'error': 'email y monto son obligatorios'}, status=400)

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        try:
            pago_pendiente = None

            if pago_id:
                pago_pendiente = Pago.objects.filter(id=pago_id, estado='pendiente').first()

            if not pago_pendiente:
                pago_pendiente = Pago.objects.filter(
                    membresia__usuario=usuario, estado='pendiente'
                ).order_by('-fecha_creacion').first()

            if pago_pendiente:
                pago, factura = confirmar_pago_pendiente(pago_pendiente)
            else:
                pago, factura = registrar_pago_manual(
                    usuario=usuario, monto=monto, plan=plan, referencia=referencia
                )
        except ValueError as e:
            return Response({'error': str(e)}, status=409)

        RegistroAuditoria.objects.create(
            operador=request.user,
            accion='confirmar_pago',
            detalle={'usuario': email, 'monto': str(monto), 'factura': factura.numero_factura},
            ip_origen=get_ip(request),
        )

        return Response({
            'mensaje': 'Pago confirmado y factura enviada',
            'factura': factura.numero_factura,
        })

class PagosPendientesPanelView(APIView):
    """
    GET /gestion-x9k2/pagos-pendientes/
    Lista los pagos con estado 'pendiente' por verificar.
    Requiere token de operador del panel admin (login con OTP).
    """
    authentication_classes = [PanelAdminAuthentication]
    permission_classes = [EsOperadorPanel]

    def get(self, request):
        from servicios.models import Pago
        from servicios.serializers import PagoSerializer

        pagos = (
            Pago.objects
            .filter(estado='pendiente')
            .select_related('membresia', 'membresia__usuario')
        )

        serializer = PagoSerializer(pagos, many=True)
        return Response({
            'total': pagos.count(),
            'pagos': serializer.data,
        })


class PagosPorEstadoPanelView(APIView):
    """
    GET /gestion-x9k2/pagos/<estado>/
    Lista los pagos filtrados por un estado específico.
    Ej: /gestion-x9k2/pagos/exitoso/
        /gestion-x9k2/pagos/rechazado/
    Requiere token de operador del panel admin (login con OTP).
    """
    authentication_classes = [PanelAdminAuthentication]
    permission_classes = [EsOperadorPanel]

    ESTADOS_VALIDOS = ['pendiente', 'exitoso', 'rechazado', 'fallido', 'reembolsado']  # ajusta a tus choices reales


    def get(self, request, estado):
        from servicios.models import Pago
        from servicios.serializers import PagoSerializer

        if estado not in self.ESTADOS_VALIDOS:
            return Response(
                {'error': f'Estado inválido. Usa uno de: {", ".join(self.ESTADOS_VALIDOS)}'},
                status=400,
            )

        pagos = (
            Pago.objects
            .filter(estado=estado)
            .select_related('membresia', 'membresia__usuario')
            .order_by('-fecha_creacion')
        )

        serializer = PagoSerializer(pagos, many=True)
        return Response({
            'total': pagos.count(),
            'estado': estado,
            'pagos': serializer.data,
        })