from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import Cita
from .serializers import CitaSerializer, CitaCreateSerializer


class CitaViewSet(viewsets.ModelViewSet):
    """
    ViewSet que permite gestionar citas:
    - list   : GET    /api/citas/
    - retrieve: GET  /api/citas/{id}/
    - create : POST   /api/citas/
    - update : PUT    /api/citas/{id}/
    - partial_update: PATCH /api/citas/{id}/
    - destroy: DELETE /api/citas/{id}/
    """
    queryset = Cita.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Utilizamos CitaCreateSerializer para la creación (POST) y
        CitaSerializer para el resto de operaciones.
        """
        if self.action == 'create':
            return CitaCreateSerializer
        return CitaSerializer

    def get_queryset(self):
        """
        Filtramos las citas que el usuario puede ver:
        - Si el usuario es staff o superuser, puede ver todas.
        - En caso contrario, solo sus propias citas (cliente).
        """
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Cita.objects.all()
        return Cita.objects.filter(cliente=user)

    def perform_create(self, serializer):
        """
        Guardamos la cita. El serializer ya mapea `usuario` → `cliente`,
        por lo que no es necesario hacer nada extra.
        """
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Permite eliminar una cita solo si pertenece al usuario autenticado
        (a menos que sea staff).
        """
        instance = self.get_object()
        if not (request.user.is_staff or request.user.is_superuser):
            if instance.cliente != request.user:
                return Response(
                    {"detail": "No tienes permiso para eliminar esta cita."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().destroy(request, *args, **kwargs)
