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
    """
    Serializador usado para listar, obtener detalle, actualizar y eliminar citas.
    Incluye todos los campos del modelo, pero mantiene `id`, `estado`, `usuario`,
    `fecha_creacion` y `fecha_actualizacion` como solo lectura.
    """
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
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = (
            'id',
            'estado',
            'usuario',
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

    def validate(self, data):
        _validar_horas(data, self.instance)
        return data