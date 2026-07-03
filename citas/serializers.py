from rest_framework import serializers
from .models import Cita


class CitaCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear una cita.
    Se aceptan los campos tal como llegan desde el frontend.
    El campo `usuario` del payload se mapea al campo `cliente` del modelo.
    """
    # El frontend envía `usuario`, pero el modelo usa `cliente`.
    usuario = serializers.PrimaryKeyRelatedField(
        source='cliente',
        queryset=Cita._meta.get_field('cliente').related_model.objects.all()
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
            'usuario',
            'hora_inicio',
            'hora_fin',
            'estado',
        ]
        read_only_fields = ('id', 'estado')
