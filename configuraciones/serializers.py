from rest_framework import serializers
from .models import ConfiguracionSwitches
from .defaults import SWITCHES_POR_DEFECTO


class ConfiguracionSwitchesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSwitches
        fields = ['switches', 'fecha_actualizacion']
        read_only_fields = ['fecha_actualizacion']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Rellena con los valores por defecto cualquier switch que el usuario
        # aún no tenga guardado explícitamente
        data['switches'] = {**SWITCHES_POR_DEFECTO, **instance.switches}
        return data

    def validate_switches(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("switches debe ser un objeto (dict).")
        for clave, valor in value.items():
            if not isinstance(valor, bool):
                raise serializers.ValidationError(
                    f"El switch '{clave}' debe ser true o false."
                )
        return value