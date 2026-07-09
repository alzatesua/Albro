# notificaciones/serializers.py
from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()

    class Meta:
        model = Notificacion
        fields = [
            'id', 'usuario', 'tipo', 'evento', 'titulo', 'mensaje',
            'data', 'leida', 'fecha_leida', 'content_type_app',
            'object_id', 'fecha_creacion',
        ]

    def get_data(self, obj):
        data = dict(obj.data or {})

        # Import local para evitar dependencias circulares entre apps
        from servicios.models import Servicio, CategoriaServicio
        from usuarios.models import Usuario

        usuario_id = data.get('usuario')
        servicio_id = data.get('servicio')
        categoria_id = data.get('categoria')

        if usuario_id:
            usuario = Usuario.objects.filter(pk=usuario_id).first()
            if usuario:
                data['usuario_nombre'] = f'{usuario.nombre} {usuario.apellido}'.strip()

        if servicio_id:
            servicio = Servicio.objects.filter(pk=servicio_id).first()
            if servicio:
                data['servicio_nombre'] = servicio.nombre

        if categoria_id:
            categoria = CategoriaServicio.objects.filter(pk=categoria_id).first()
            if categoria:
                data['categoria_nombre'] = categoria.nombre

        return data