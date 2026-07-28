# panel_admin/serializers.py
from rest_framework import serializers


class LoginPanelSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    codigo_otp = serializers.CharField(required=False, allow_blank=True)

class SolicitarCodigoSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class VerificarCodigoSerializer(serializers.Serializer):
    username = serializers.CharField()
    codigo_otp = serializers.CharField(min_length=6, max_length=6)