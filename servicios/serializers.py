from rest_framework import serializers

from .models import CategoriaServicio, Servicio


class ServicioSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model = Servicio
        fields = [
            'id',
            'nombre',
            'descripcion',
            'categoria',
            'categoria_nombre',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class CategoriaServicioSerializer(serializers.ModelSerializer):
    total_servicios = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaServicio
        fields = [
            'id',
            'nombre',
            'descripcion',
            'activo',
            'total_servicios',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_total_servicios(self, obj):
        total = getattr(obj, 'total_servicios', None)
        if total is not None:
            return total
        return obj.servicios.count()


class CategoriaServicioDetalleSerializer(CategoriaServicioSerializer):
    servicios = ServicioSerializer(many=True, read_only=True)

    class Meta(CategoriaServicioSerializer.Meta):
        fields = CategoriaServicioSerializer.Meta.fields + ['servicios']


class AsociarServicioCategoriaSerializer(serializers.Serializer):
    servicio_id = serializers.IntegerField(required=False)
    nombre = serializers.CharField(max_length=120, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)

    def validate(self, data):
        if not data.get('servicio_id') and not data.get('nombre'):
            raise serializers.ValidationError(
                'Envia servicio_id para asociar uno existente o nombre para crear uno nuevo.'
            )
        return data
