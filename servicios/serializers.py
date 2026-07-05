from rest_framework import serializers

from .models import CategoriaServicio, Servicio
from profesionales.models import PerfilProfesional
from profesionales.serializers import EstadoAtencionSerializer
from .models import ServicioProfesional


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








class ServicioProfesionalSerializer(serializers.ModelSerializer):
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)

    class Meta:
        model = ServicioProfesional
        fields = [
            'id',
            'profesional',
            'servicio',
            'servicio_nombre',
            'precio',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = ['id', 'fecha_creacion']

class ServicioOfrecidoSerializer(serializers.ModelSerializer):
    servicio_id = serializers.IntegerField(source='servicio.id', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    categoria_id = serializers.IntegerField(source='servicio.categoria_id', read_only=True)

    class Meta:
        model = ServicioProfesional
        fields = [
            'id',
            'servicio_id',
            'servicio_nombre',
            'categoria_id',
            'precio',
            'duracion_minutos',  
            'activo',
        ]





class ProfesionalListaSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    apellido = serializers.CharField(source='usuario.apellido', read_only=True)
    estado = EstadoAtencionSerializer(read_only=True)
    precio_servicio = serializers.SerializerMethodField()
    servicios = serializers.SerializerMethodField()

    class Meta:
        model = PerfilProfesional
        fields = [
            'id',
            'nombre',
            'apellido',
            'nombre_local',
            'direccion',      
            'ubicacion',  
            'latitud',
            'longitud',
            'estado',
            'precio_servicio',
            'servicios',
            'imagen_perfil',
        ]

    def get_precio_servicio(self, obj):
        servicio_id = self.context.get('servicio_id')
        if not servicio_id:
            return None
        relacion = obj.servicios_ofrecidos.filter(
            servicio_id=servicio_id, activo=True
        ).first()
        return str(relacion.precio) if relacion else None

    def get_servicios(self, obj):
        relaciones = obj.servicios_ofrecidos.filter(activo=True).select_related('servicio')
        return ServicioOfrecidoSerializer(relaciones, many=True).data


class AsignarServicioSerializer(serializers.Serializer):
    servicio_id = serializers.IntegerField()
    precio = serializers.DecimalField(max_digits=10, decimal_places=2)
    duracion_minutos = serializers.IntegerField(min_value=5, max_value=480)  # ← nuevo, obligatorio
    activo = serializers.BooleanField(required=False, default=True)

    def validate_servicio_id(self, value):
        if not Servicio.objects.filter(pk=value, activo=True).exists():
            raise serializers.ValidationError('El servicio no existe o no esta activo.')
        return value