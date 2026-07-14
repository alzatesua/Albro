from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ConfiguracionSwitches
from .serializers import ConfiguracionSwitchesSerializer
from .defaults import SWITCHES_POR_DEFECTO


class ConfiguracionSwitchesView(APIView):
    """
    GET   /api/configuraciones/switches/   -> ver switches actuales (con defaults aplicados)
    PATCH /api/configuraciones/switches/    -> actualizar uno o varios switches
          body: { "mostrar_modal_portafolio": false }
          (solo envía las claves que quieres cambiar; el resto no se toca)
    """
    permission_classes = [IsAuthenticated]

    def _obtener_o_crear(self, usuario):
        config, _ = ConfiguracionSwitches.objects.get_or_create(usuario=usuario)
        return config

    def get(self, request):
        config = self._obtener_o_crear(request.user)
        serializer = ConfiguracionSwitchesSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        config = self._obtener_o_crear(request.user)

        nuevos_switches = request.data.get('switches', request.data)
        if not isinstance(nuevos_switches, dict):
            return Response(
                {'detalle': 'Debes enviar un objeto con los switches a actualizar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Merge: solo pisa las claves enviadas, conserva el resto
        switches_actualizados = {**config.switches, **nuevos_switches}

        serializer = ConfiguracionSwitchesSerializer(
            config,
            data={'switches': switches_actualizados},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)