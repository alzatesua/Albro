from rest_framework import serializers
from .models import Conversacion, Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensaje
        fields = ['id', 'conversacion', 'remitente', 'contenido', 'fecha_envio', 'leido', 'leido_en']
        read_only_fields = ['id', 'remitente', 'fecha_envio', 'leido', 'leido_en']


class ConversacionSerializer(serializers.ModelSerializer):
    ultimo_mensaje = serializers.SerializerMethodField()
    no_leidos = serializers.SerializerMethodField()

    class Meta:
        model = Conversacion
        fields = ['id', 'cliente', 'profesional', 'fecha_creacion', 'ultima_actividad', 'ultimo_mensaje', 'no_leidos']
        read_only_fields = ['id', 'fecha_creacion', 'ultima_actividad']

    def get_ultimo_mensaje(self, obj):
        ultimo = obj.mensajes.order_by('-fecha_envio').first()
        return MensajeSerializer(ultimo).data if ultimo else None

    def get_no_leidos(self, obj):
        user = self.context['request'].user
        return obj.mensajes.filter(leido=False).exclude(remitente=user).count()