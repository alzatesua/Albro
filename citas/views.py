from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import CitaCreateSerializer


class CitaCreateView(APIView):
    """
    Endpoint para crear una nueva cita.
    POST /api/citas/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CitaCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            cita = serializer.save()
            return Response(CitaCreateSerializer(cita).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
