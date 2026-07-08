from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            'id', 'tipo', 'evento', 'titulo', 'mensaje', 'data',
            'content_type_app', 'object_id', 'leida',
            'fecha_creacion', 'fecha_leida',
        ]
        read_only_fields = fields