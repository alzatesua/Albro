from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Conversacion, Mensaje
from .serializers import ConversacionSerializer, MensajeSerializer
from .pagination import MensajesPagination


class ConversacionViewSet(viewsets.ModelViewSet):
    """
    GET    /api/conversaciones/               -> mis conversaciones
    POST   /api/conversaciones/                -> obtiene o crea una conversación
    GET    /api/conversaciones/{id}/mensajes/  -> historial paginado
    POST   /api/conversaciones/{id}/marcar_leido/
    """
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        user = self.request.user
        qs = Conversacion.objects.filter(Q(cliente=user))
        if hasattr(user, 'perfil_profesional'):
            qs = Conversacion.objects.filter(
                Q(cliente=user) | Q(profesional=user.perfil_profesional)
            )
        return qs.distinct()

    def create(self, request, *args, **kwargs):
        """
        Obtiene o crea la conversación entre el usuario autenticado
        y la otra parte indicada en el body.
        - Si el usuario es cliente: body = {"profesional_id": <id>}
        - Si el usuario es profesional: body = {"cliente_id": <id>}
        """
        user = request.user
        data = request.data

        if hasattr(user, 'perfil_profesional') and 'cliente_id' in data:
            conversacion, _ = Conversacion.objects.get_or_create(
                cliente_id=data['cliente_id'],
                profesional=user.perfil_profesional,
            )
        elif 'profesional_id' in data:
            conversacion, _ = Conversacion.objects.get_or_create(
                cliente=user,
                profesional_id=data['profesional_id'],
            )
        else:
            return Response(
                {"detail": "Debes enviar 'profesional_id' (como cliente) o 'cliente_id' (como profesional)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(conversacion)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='mensajes', pagination_class=MensajesPagination)
    def mensajes(self, request, pk=None):
        conversacion = self.get_object()
        if not conversacion.es_participante(request.user):
            return Response({"detail": "No tienes acceso a esta conversación."}, status=status.HTTP_403_FORBIDDEN)

        queryset = conversacion.mensajes.order_by('-fecha_envio')
        page = self.paginate_queryset(queryset)
        serializer = MensajeSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'], url_path='marcar_leido')
    def marcar_leido(self, request, pk=None):
        conversacion = self.get_object()
        if not conversacion.es_participante(request.user):
            return Response({"detail": "No tienes acceso a esta conversación."}, status=status.HTTP_403_FORBIDDEN)

        actualizados = conversacion.mensajes.filter(leido=False).exclude(
            remitente=request.user
        ).update(leido=True, leido_en=timezone.now())

        return Response({"marcados": actualizados}, status=status.HTTP_200_OK)