from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Conversacion, Mensaje
from .serializers import ConversacionSerializer, MensajeSerializer
from .pagination import MensajesPagination


class ConversacionViewSet(viewsets.ModelViewSet):
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

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
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
        serializer = MensajeSerializer(page, many=True, context={'request': request})
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'], url_path='marcar_leido')
    def marcar_leido(self, request, pk=None):
        conversacion = self.get_object()
        if not conversacion.es_participante(request.user):
            return Response({"detail": "No tienes acceso a esta conversación."}, status=status.HTTP_403_FORBIDDEN)

        actualizados = conversacion.mensajes.filter(leido=False).exclude(
            remitente=request.user
        ).update(leido=True, leido_en=timezone.now())

        if actualizados > 0:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversacion.id}",
                {"type": "chat_leido", "usuario": request.user.id},
            )

        return Response({"marcados": actualizados}, status=status.HTTP_200_OK)

    @action(
        detail=True, methods=['post'], url_path='enviar-archivo',
        parser_classes=[MultiPartParser, FormParser],
    )
    def enviar_archivo(self, request, pk=None):
        conversacion = self.get_object()
        if not conversacion.es_participante(request.user):
            return Response({"detail": "No tienes acceso a esta conversación."}, status=status.HTTP_403_FORBIDDEN)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {"detail": "Debes enviar un archivo en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo = request.data.get('tipo')
        if tipo not in ('imagen', 'audio'):
            content_type = getattr(archivo, 'content_type', '') or ''
            if content_type.startswith('image/'):
                tipo = 'imagen'
            elif content_type.startswith('audio/'):
                tipo = 'audio'
            else:
                tipo = 'imagen'

        contenido_fallback = '📷 Imagen' if tipo == 'imagen' else '🎤 Audio'

        mensaje = Mensaje.objects.create(
            conversacion=conversacion,
            remitente=request.user,
            contenido=request.data.get('contenido', '') or contenido_fallback,
            tipo=tipo,
            archivo=archivo,
        )
        conversacion.ultima_actividad = timezone.now()
        conversacion.save(update_fields=['ultima_actividad'])

        data = MensajeSerializer(mensaje, context={'request': request}).data

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversacion.id}",
            {"type": "chat_mensaje", "mensaje": data},
        )

        try:
            from .notifications import notificar_mensaje
            notificar_mensaje(mensaje)
        except Exception:
            pass

        return Response(data, status=status.HTTP_201_CREATED)