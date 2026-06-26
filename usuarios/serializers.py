from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = [
            'email',
            'password',
            'nombre',
            'apellido',
            'telefono',
            'rol',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id',
            'email',
            'nombre',
            'apellido',
            'telefono',
            'foto',
            'rol',
            'primer_ingreso',
            'fecha_registro',
        ]
        read_only_fields = ['id', 'fecha_registro']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({'non_field_errors': ['El usuario no existe. Por favor, regístrate.']})

        from django.contrib.auth import authenticate
        usuario_auth = authenticate(username=email, password=password)

        if not usuario_auth:
            raise serializers.ValidationError({'non_field_errors': ['Contraseña incorrecta']})

        if not usuario_auth.is_active:
            raise serializers.ValidationError({'non_field_errors': ['Usuario inactivo']})

        refresh = RefreshToken.for_user(usuario_auth)

        return {
            'usuario': UsuarioSerializer(usuario_auth).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }