from rest_framework import serializers
import httpx

from .models import EstadoAtencion, PerfilProfesional, Departamento, Municipio

DIAS_VALIDOS = [
    'lunes', 'martes', 'miercoles', 'jueves',
    'viernes', 'sabado', 'domingo',
]


class EstadoAtencionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoAtencion
        fields = [
            'id',
            'codigo',
            'nombre',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = ['id', 'fecha_creacion']


class CambiarEstadoProfesionalSerializer(serializers.ModelSerializer):
    estado_id = serializers.PrimaryKeyRelatedField(
        queryset=EstadoAtencion.objects.filter(activo=True),
        source='estado',
        write_only=True,
    )

    class Meta:
        model = PerfilProfesional
        fields = ['estado_id']


def geocodificar_direccion(direccion: str) -> tuple[float, float]:
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": direccion,
            "format": "json",
            "limit": 1,
            "countrycodes": "co",
            "addressdetails": 1,
        }
        headers = {"User-Agent": "MiAppProfesionales/1.0 (contacto@miapp.com)"}

        response = httpx.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        resultados = response.json()

        if resultados:
            return float(resultados[0]["lat"]), float(resultados[0]["lon"])

        raise serializers.ValidationError(
            "No se encontró la dirección con Nominatim."
        )

    except serializers.ValidationError:
        raise

    except Exception as exc:
        raise serializers.ValidationError(
            f"Error al contactar Nominatim: {exc}"
        )



class PerfilProfesionalSerializer(serializers.ModelSerializer):
    nombre    = serializers.CharField(source='usuario.nombre',   read_only=True)
    apellido  = serializers.CharField(source='usuario.apellido', read_only=True)
    email     = serializers.EmailField(source='usuario.email',   read_only=True)
    telefono  = serializers.CharField(source='usuario.telefono', read_only=True)
    rol       = serializers.CharField(source='usuario.rol',      read_only=True)
    estado    = EstadoAtencionSerializer(read_only=True)
    estado_id = serializers.PrimaryKeyRelatedField(
        queryset=EstadoAtencion.objects.filter(activo=True),
        source='estado',
        write_only=True,
        required=False,
    )

    # Campos nuevos solo de escritura
    departamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(),
        write_only=True,
        required=True,
    )
    municipio_id = serializers.PrimaryKeyRelatedField(
        queryset=Municipio.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = PerfilProfesional
        fields = [
            'id', 'nombre', 'apellido', 'email', 'telefono', 'rol',
            'direccion', 'ubicacion',
            'latitud', 'longitud',
            'nombre_local', 'descripcion',
            'imagen_perfil',
            'activo', 'horarios_atencion',
            'estado', 'estado_id',
            'departamento_id', 'municipio_id',   # ← nuevos
            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
        extra_kwargs = {
            'latitud':   {'required': False, 'allow_null': True},
            'longitud':  {'required': False, 'allow_null': True},
            'ubicacion': {'required': False},
            'imagen_perfil': {'required': False},
        }

    def validate(self, attrs):
        departamento = attrs.pop('departamento_id', None)
        municipio    = attrs.pop('municipio_id', None)

        instance = getattr(self, 'instance', None)

        # Validar que el municipio pertenece al departamento solo si ambos vienen
        nueva_ubicacion = None
        if municipio and departamento:
            if municipio.departamento_id != departamento.id:
                raise serializers.ValidationError(
                    f"El municipio '{municipio.nombre}' no pertenece al departamento '{departamento.nombre}'."
                )
            # Construir ubicacion automáticamente solo si ambos están presentes
            nueva_ubicacion = f"{municipio.nombre}, {departamento.nombre}"
            attrs['ubicacion'] = nueva_ubicacion

        # ¿Cambió la dirección o la ubicación en este request?
        direccion_anterior = instance.direccion if instance else None
        ubicacion_anterior = instance.ubicacion if instance else None

        direccion_nueva = attrs.get('direccion', direccion_anterior)
        ubicacion_nueva = attrs.get('ubicacion', ubicacion_anterior)

        cambio_direccion = instance is None or direccion_nueva != direccion_anterior
        cambio_ubicacion = instance is None or ubicacion_nueva != ubicacion_anterior

        # Geocodificar si: no hay coordenadas guardadas, O si dirección/ubicación cambiaron
        ya_tiene_coords = instance and instance.latitud and instance.longitud
        debe_geocodificar = (
            not attrs.get('latitud') and not attrs.get('longitud')
            and (not ya_tiene_coords or cambio_direccion or cambio_ubicacion)
        )

      

        if debe_geocodificar:
            direccion = direccion_nueva or ''

            if not direccion:
                raise serializers.ValidationError(
                    "Debes proporcionar 'direccion' para geocodificar."
                )

            if municipio and departamento:
                query = f"{direccion}, {municipio.nombre}, {departamento.nombre}, Colombia"
            else:
                ubicacion = ubicacion_nueva or ''
                query = f"{direccion}, {ubicacion}, Colombia".strip(', ')

            lat, lon = geocodificar_direccion(query)
            attrs['latitud']  = lat
            attrs['longitud'] = lon

        return attrs


    # create() y update() sin cambios
    def create(self, validated_data):
        usuario = self.context['request'].user
        usuario.rol = 'profesional'
        usuario.primer_ingreso = False
        usuario.save(update_fields=['rol', 'primer_ingreso'])

        if 'estado' not in validated_data:
            validated_data['estado'] = EstadoAtencion.objects.filter(
                codigo='disponible', activo=True,
            ).first()

        perfil, _ = PerfilProfesional.objects.update_or_create(
            usuario=usuario,
            defaults=validated_data,
        )
        return perfil

    def update(self, instance, validated_data):
        instance.usuario.rol = 'profesional'
        instance.usuario.save(update_fields=['rol'])

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'codigo', 'nombre']


class MunicipioSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)

    class Meta:
        model = Municipio
        fields = ['id', 'nombre', 'departamento']


class HorarioDiaSerializer(serializers.Serializer):
    dia = serializers.ChoiceField(choices=DIAS_VALIDOS)
    inicio = serializers.TimeField()
    fin = serializers.TimeField()

    def validate(self, data):
        if data['inicio'] >= data['fin']:
            raise serializers.ValidationError(
                'La hora de inicio debe ser menor a la hora de fin.'
            )
        return data


class HorariosAtencionSerializer(serializers.Serializer):
    horarios = HorarioDiaSerializer(many=True)

    def validate_horarios(self, value):
        if not value:
            raise serializers.ValidationError('Debes enviar al menos un horario.')

        # Agrupar por día para detectar traslapes
        por_dia = {}
        for item in value:
            por_dia.setdefault(item['dia'], []).append(item)

        for dia, franjas in por_dia.items():
            franjas_ordenadas = sorted(franjas, key=lambda f: f['inicio'])
            for i in range(len(franjas_ordenadas) - 1):
                actual = franjas_ordenadas[i]
                siguiente = franjas_ordenadas[i + 1]
                if actual['fin'] > siguiente['inicio']:
                    raise serializers.ValidationError(
                        f"Los horarios de '{dia}' se traslapan entre "
                        f"{actual['inicio']}-{actual['fin']} y "
                        f"{siguiente['inicio']}-{siguiente['fin']}."
                    )
        return value

    def to_internal_value(self, data):
        # Permite recibir directamente una lista, o {"horarios": [...]}
        if isinstance(data, list):
            data = {'horarios': data}
        return super().to_internal_value(data)


class ProfesionalUbicacionSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar ubicaciones y fotos de perfil
    de todos los profesionales activos.
    """
    nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    apellido = serializers.CharField(source='usuario.apellido', read_only=True)
    estado = EstadoAtencionSerializer(read_only=True)
    
    class Meta:
        model = PerfilProfesional
        fields = [
            'id',
            'nombre',
            'apellido',
            'direccion',
            'latitud',
            'longitud',
            'imagen_perfil',
            'estado',

        ]