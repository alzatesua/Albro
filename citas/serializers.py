from rest_framework import serializers
from .models import Cita


class CitaCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear una cita.
    Se aceptan los campos tal como llegan desde el frontend.
    El campo `usuario` del payload se mapea al campo `cliente` del modelo.
    Además, se permite enviar `cliente` directamente (write_only) para mayor flexibilidad.
    """
    # Campo de solo lectura para que la respuesta incluya `usuario` (alias de `cliente`)
    usuario = serializers.PrimaryKeyRelatedField(
        source='cliente',
        read_only=True
    )
    # Campo de escritura que acepta el PK del cliente; se usa internamente para crear la cita
    cliente = serializers.PrimaryKeyRelatedField(
        queryset=Cita._meta.get_field('cliente').related_model.objects.all(),
        write_only=True
    )
    # `categoria` es opcional
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
            'usuario',   # solo lectura, para que el frontend reciba el mismo nombre
            'cliente',   # solo escritura, para crear la cita
            'hora_inicio',
            'hora_fin',
            'estado',
        ]
        read_only_fields = ('id', 'estado', 'usuario')

    def validate(self, data):
        profesional = data.get('profesional')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')

        conflicto = Cita.objects.filter(
            profesional=profesional,
            fecha=fecha,
            estado__in=['pendiente', 'confirmada'],  # ignoramos canceladas
            hora_inicio__lt=hora_fin,
            hora_fin__gt=hora_inicio,
        )

        if self.instance:  # en updates, excluir la cita actual
            conflicto = conflicto.exclude(pk=self.instance.pk)

        if conflicto.exists():
            raise serializers.ValidationError(
                "Este horario ya no está disponible. Por favor elige otro horario."
            )

        return data


class CitaSerializer(serializers.ModelSerializer):
    """
    Serializador usado para listar, obtener detalle, actualizar y eliminar citas.
    Incluye todos los campos del modelo, pero mantiene `id` y `estado` como solo lectura.
    También expone `usuario` como alias de `cliente` y permite actualizar `cliente`
    mediante el mismo alias.
    """
    # Alias de solo lectura para que el frontend siga usando `usuario`
    usuario = serializers.PrimaryKeyRelatedField(
        source='cliente',
        read_only=True
    )
    # Permite actualizar el cliente enviando `cliente` (write_only)
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
            'fecha_creacion',
            'fecha_actualizacion',
            'usuario',
        )

    def validate(self, data):
        """
        Validación para asegurar que la hora de fin sea posterior a la hora de inicio,
        tanto en creación como en actualización.
        """
        hora_inicio = data.get('hora_inicio') or getattr(self.instance, 'hora_inicio', None)
        hora_fin = data.get('hora_fin') or getattr(self.instance, 'hora_fin', None)
        if hora_inicio and hora_fin and hora_fin <= hora_inicio:
            raise serializers.ValidationError(
                "La hora de fin debe ser posterior a la hora de inicio."
            )
        return data
