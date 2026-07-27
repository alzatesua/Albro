from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from .models import Cita
from .serializers import CitaSerializer, CitaCreateSerializer, ReagendarCitaSerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .ws_tickets import generar_ticket
from .notifications import notificar_cita
from rest_framework.throttling import UserRateThrottle

from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from .pagination import CitasPagination 
from django.utils import timezone



class CitaViewSet(viewsets.ModelViewSet):
    """
    ViewSet que permite gestionar citas:
    - list   : GET    /api/citas/
    - retrieve: GET  /api/citas/{id}/
    - create : POST   /api/citas/
    - update : PUT    /api/citas/{id}/
    - partial_update: PATCH /api/citas/{id}/
    - destroy: DELETE /api/citas/{id}/
    - cancel : POST   /api/citas/{id}/cancel/   (cambia el estado a "cancelada")
    """
    queryset = Cita.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = CitasPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado']

    def get_serializer_class(self):
        if self.action == 'create':
            return CitaCreateSerializer
        return CitaSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Cita.objects.all()

        if user.is_staff or user.is_superuser:
            return Cita.objects.all()

        return Cita.objects.filter(
            Q(cliente=user) | Q(profesional__usuario=user)
        ).distinct()

    def perform_create(self, serializer):
        """
        Guardamos la cita y notificamos por WebSocket.
        """
        try:
            cita = serializer.save()
        except IntegrityError:
            raise ValidationError(
                {"detail": "Ya existe una cita activa para este profesional en la misma fecha y hora."}
            )
        notificar_cita(cita, tipo="creada", actor_id=self.request.user.id)
        
    def perform_update(self, serializer):
        """
        Actualizamos la cita y notificamos por WebSocket.
        """
        try:
            cita = serializer.save()
        except IntegrityError:
            raise ValidationError(
                {"detail": "Ya existe una cita activa para este profesional en la misma fecha y hora."}
            )
        notificar_cita(cita, tipo="actualizada", actor_id=self.request.user.id)
        
    def destroy(self, request, *args, **kwargs):
        """
        Permite eliminar una cita solo si pertenece al usuario autenticado
        (a menos que sea staff).
        """
        instance = self.get_object()
        if not (request.user.is_staff or request.user.is_superuser):
            if instance.cliente_id != request.user.id:
                return Response(
                    {"detail": "No tienes permiso para eliminar esta cita."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Endpoint para cancelar (inactivar) una cita.
        Cambia el campo `estado` a "cancelada".
        Sólo el cliente propietario, el profesional asignado, o un
        usuario staff/superuser pueden hacerlo.
        """
        cita = self.get_object()

        es_cliente = cita.cliente_id == request.user.id
        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_cliente or es_profesional):
            return Response(
                {
                    "detail": "No tienes permiso para cancelar esta cita.",
                    "debug": {
                        "user_id": request.user.id,
                        "cita_cliente_id": cita.cliente_id,
                        "cita_profesional_id": cita.profesional_id,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if cita.estado == 'cancelada':
            return Response(
                {"detail": "La cita ya está cancelada."},
                status=status.HTTP_200_OK,
            )

        cita.estado = 'cancelada'
        cita.save()
        notificar_cita(cita, tipo="cancelada", actor_id=request.user.id)

        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='confirmar')
    def confirmar(self, request, pk=None):
        """
        Endpoint para confirmar una cita.
        Cambia el campo `estado` a "confirmada".
        Sólo el profesional asignado (o un usuario staff/superuser)
        puede confirmarla. Los clientes solo pueden verla.
        """
        cita = self.get_object()

        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_profesional):
            return Response(
                {"detail": "Solo el profesional asignado puede confirmar esta cita."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cita.estado == 'cancelada':
            return Response(
                {"detail": "No se puede confirmar una cita cancelada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cita.estado == 'confirmada':
            return Response(
                {"detail": "La cita ya está confirmada."},
                status=status.HTTP_200_OK,
            )

        cita.estado = 'confirmada'
        cita.save()
        notificar_cita(cita, tipo="confirmada", actor_id=request.user.id)

        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='completar')
    def completar(self, request, pk=None):
        """
        Endpoint para marcar una cita como completada.
        Cambia el campo `estado` a "completada".
        Sólo el profesional asignado (o un usuario staff/superuser)
        puede marcarla, y solo si está confirmada.
        """
        cita = self.get_object()

        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_profesional):
            return Response(
                {"detail": "Solo el profesional asignado puede completar esta cita."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cita.estado != 'confirmada':
            return Response(
                {"detail": "Solo se puede completar una cita confirmada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cita.estado = 'completada'
        cita.iniciado_en = None
        cita.save()
        notificar_cita(cita, tipo="completada", actor_id=request.user.id)

        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reagendar')
    def reagendar(self, request, pk=None):
        """
        Endpoint para reagendar una cita (cambiar fecha/hora_inicio/hora_fin).
        Vuelve el estado a 'pendiente' para forzar reconfirmación del profesional.
        Puede hacerlo el cliente propietario, el profesional asignado,
        o un usuario staff/superuser.
        """
        cita = self.get_object()

        es_cliente = cita.cliente_id == request.user.id
        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_cliente or es_profesional):
            return Response(
                {"detail": "No tienes permiso para reagendar esta cita."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cita.estado in ('cancelada', 'completada'):
            return Response(
                {"detail": f"No se puede reagendar una cita en estado '{cita.estado}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        input_serializer = ReagendarCitaSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        nueva_fecha = input_serializer.validated_data['fecha']
        nueva_hora_inicio = input_serializer.validated_data['hora_inicio']
        nueva_hora_fin = input_serializer.validated_data['hora_fin']

        # Verifica manualmente que el profesional no tenga otra cita activa
        # en ese mismo horario (excluyendo la cita actual).
        conflicto = Cita.objects.exclude(pk=cita.pk).exclude(estado='cancelada').filter(
            profesional=cita.profesional,
            fecha=nueva_fecha,
            hora_inicio=nueva_hora_inicio,
        ).exists()

        if conflicto:
            return Response(
                {"detail": "Ya existe una cita activa para este profesional en la nueva fecha y hora."},
                status=status.HTTP_409_CONFLICT,
            )

        estado_anterior = cita.estado
        cita.fecha = nueva_fecha
        cita.hora_inicio = nueva_hora_inicio
        cita.hora_fin = nueva_hora_fin
        cita.estado = 'pendiente'

        try:
            cita.save()
        except IntegrityError:
            return Response(
                {"detail": "Ya existe una cita activa para este profesional en la nueva fecha y hora."},
                status=status.HTTP_409_CONFLICT,
            )

        # Esta llamada es la que dispara el evento por WebSocket,
        # igual que en cancel/confirmar/completar.
        notificar_cita(cita, tipo="reagendada", actor_id=request.user.id)

        serializer = self.get_serializer(cita)
        return Response(
            {
                "detail": f"Cita reagendada correctamente (estado anterior: {estado_anterior}).",
                "cita": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        """
        Marca el momento en que el profesional inicia el turno.
        Esto es lo que persiste el cronómetro entre sesiones.
        """
        cita = self.get_object()

        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_profesional):
            return Response(
                {"detail": "Solo el profesional asignado puede iniciar este turno."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if cita.estado != 'confirmada':
            return Response(
                {"detail": "Solo se puede iniciar una cita confirmada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cita.iniciado_en = timezone.now()
        cita.save()
        notificar_cita(cita, tipo="iniciada", actor_id=request.user.id)

        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)

class WSTicketThrottle(UserRateThrottle):
    scope = 'ws_ticket'


class WSTicketView(APIView):
    """
    Endpoint que emite un ticket de un solo uso para autenticar
    la conexión WebSocket, sin exponer el JWT en la URL.
    GET /api/ws-ticket/
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [WSTicketThrottle]

    def get(self, request):
        ticket = generar_ticket(request.user.id)
        return Response({"ticket": ticket, "expires_in": 15})

