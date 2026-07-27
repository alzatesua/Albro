from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import Cita


def _validar_horas(data, instance=None):
    """
    Valida que la hora de fin sea posterior a la hora de inicio.
    Compartida entre create y update.
    """
    hora_inicio = data.get('hora_inicio') or getattr(instance, 'hora_inicio', None)
    hora_fin = data.get('hora_fin') or getattr(instance, 'hora_fin', None)
    if hora_inicio and hora_fin and hora_fin <= hora_inicio:
        raise serializers.ValidationError(
            "La hora de fin debe ser posterior a la hora de inicio."
        )


class CitaCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear una cita.
    Se aceptan los campos tal como llegan desde el frontend.
    El campo `usuario` del payload se mapea al campo `cliente` del modelo.
    Además, se permite enviar `cliente` directamente (write_only) para mayor flexibilidad.
    """
    usuario = serializers.PrimaryKeyRelatedField(
        source='cliente',
        read_only=True
    )
    cliente = serializers.PrimaryKeyRelatedField(
        queryset=Cita._meta.get_field('cliente').related_model.objects.all(),
        write_only=True
    )
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Cita._meta.get_field('categoria').related_model.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Cita
        fields = [
            'id',
            'categoria',
            'fecha',
            'etiqueta',
            'modo',
            'profesional',
            'servicio',
            'usuario',
            'cliente',
            'hora_inicio',
            'hora_fin',
            'estado',
        ]
        read_only_fields = ('id', 'estado', 'usuario')
        validators = [
            UniqueTogetherValidator(
                queryset=Cita.objects.exclude(estado='cancelada'),
                fields=['profesional', 'fecha', 'hora_inicio'],
                message="Ya existe una cita activa para este horario."
            )
        ]

    def validate(self, data):
        _validar_horas(data, self.instance)
        return data

class CitaSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(
        source='cliente',
        read_only=True
    )
    cliente = serializers.PrimaryKeyRelatedField(
        queryset=Cita._meta.get_field('cliente').related_model.objects.all(),
        write_only=True,
        required=False,
    )
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Cita._meta.get_field('categoria').related_model.objects.all(),
        required=False,
        allow_null=True,
    )

    # --- Campos legibles de solo lectura ---
    usuario_nombre = serializers.SerializerMethodField()
    profesional_nombre = serializers.SerializerMethodField()
    servicio_nombre = serializers.SerializerMethodField()
    categoria_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = [
            'id',
            'categoria',
            'categoria_nombre',
            'fecha',
            'etiqueta',
            'modo',
            'profesional',
            'profesional_nombre',
            'servicio',
            'servicio_nombre',
            'usuario',
            'usuario_nombre',
            'cliente',
            'hora_inicio',
            'hora_fin',
            'estado',
            'iniciado_en',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = (
            'id',
            'estado',
            'usuario',
            'iniciado_en', 
            'fecha_creacion',
            'fecha_actualizacion',
        )
        validators = [
            UniqueTogetherValidator(
                queryset=Cita.objects.exclude(estado='cancelada'),
                fields=['profesional', 'fecha', 'hora_inicio'],
                message="Ya existe una cita activa para este horario."
            )
        ]

    def get_usuario_nombre(self, obj):
        if obj.cliente:
            return f"{obj.cliente.nombre} {obj.cliente.apellido}".strip()
        return None

    def get_profesional_nombre(self, obj):
        # obj.profesional es un PerfilProfesional, no un Usuario
        if obj.profesional:
            return obj.profesional.nombre_local
        return None

    def get_servicio_nombre(self, obj):
        return obj.servicio.nombre if obj.servicio else None

    def get_categoria_nombre(self, obj):
        return obj.categoria.nombre if obj.categoria else None

    def validate(self, data):
        _validar_horas(data, self.instance)
        return data

class ReagendarCitaSerializer(serializers.Serializer):
    """
    Serializer para validar los nuevos datos de fecha/hora al reagendar.
    """
    fecha = serializers.DateField(required=True)
    hora_inicio = serializers.TimeField(required=True)
    hora_fin = serializers.TimeField(required=True)

    def validate(self, data):
        if data['hora_fin'] <= data['hora_inicio']:
            raise serializers.ValidationError(
                "La hora de fin debe ser posterior a la hora de inicio."
            )

        from django.utils import timezone
        import datetime

        nueva_dt_inicio = datetime.datetime.combine(data['fecha'], data['hora_inicio'])
        if timezone.is_aware(timezone.now()):
            nueva_dt_inicio = timezone.make_aware(nueva_dt_inicio)

        if nueva_dt_inicio <= timezone.now():
            raise serializers.ValidationError(
                "La nueva fecha y hora deben ser posteriores al momento actual."
            )

        return data