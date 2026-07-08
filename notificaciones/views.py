from django.utils import timezone
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Notificacion
from .serializers import NotificacionSerializer
from .pagination import NotificacionesPagination


class NotificacionViewSet(mixins.ListModelMixin,
                           mixins.RetrieveModelMixin,
                           viewsets.GenericViewSet):
    """
    GET /api/notificaciones/            -> lista las del usuario autenticado
    GET /api/notificaciones/?leida=false -> solo no leídas
    GET /api/notificaciones/{id}/       -> detalle
    POST /api/notificaciones/{id}/marcar-leida/
    POST /api/notificaciones/marcar-todas-leidas/
    GET /api/notificaciones/no-leidas-count/
    """
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificacionesPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['leida', 'tipo']

    def get_queryset(self):
        # CRÍTICO: cada usuario solo ve las suyas, sin excepción de staff,
        # porque son notificaciones personales, no un recurso administrable.
        return Notificacion.objects.filter(usuario=self.request.user)

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()  # ya viene filtrado por usuario
        if not notif.leida:
            notif.leida = True
            notif.fecha_leida = timezone.now()
            notif.save(update_fields=['leida', 'fecha_leida'])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        actualizadas = self.get_queryset().filter(leida=False).update(
            leida=True, fecha_leida=timezone.now()
        )
        return Response({"actualizadas": actualizadas})

    @action(detail=False, methods=['get'], url_path='no-leidas-count')
    def no_leidas_count(self, request):
        count = self.get_queryset().filter(leida=False).count()
        return Response({"count": count})

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()  # ya viene filtrado por usuario=request.user
        if not notif.leida:
            notif.leida = True
            notif.fecha_leida = timezone.now()
            notif.save(update_fields=['leida', 'fecha_leida'])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        actualizadas = self.get_queryset().filter(leida=False).update(
            leida=True, fecha_leida=timezone.now()
        )
        return Response({"actualizadas": actualizadas})