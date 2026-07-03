from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

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
    - cancel : POST   /api/citas/{id}/cancel/   (cambia el estado a "cancelada")
    """
    queryset = Cita.objects.all()
    # Permitimos acceso de solo lectura a usuarios no autenticados,
    # pero cualquier operación de escritura sigue requiriendo autenticación.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
        - Si el usuario está autenticado, ve las citas donde es cliente
          O las citas donde es el profesional asignado.
        - Si el usuario es anónimo, devolvemos todas las citas (solo lectura).
        """
        user = self.request.user

        if not user.is_authenticated:
            # Usuario anónimo: solo lectura, devolvemos todas las citas.
            return Cita.objects.all()

        if user.is_staff or user.is_superuser:
            return Cita.objects.all()

        # Cliente dueño de la cita O profesional asignado a la cita
        return Cita.objects.filter(
            Q(cliente=user) | Q(profesional__usuario=user)
        ).distinct()

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
            if instance.cliente_id != request.user.id:
                return Response(
                    {"detail": "No tienes permiso para eliminar esta cita."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Endpoint para cancelar (inactivar) una cita.
        Cambia el campo `estado` a "cancelada".
        Sólo el cliente propietario o un usuario staff/superuser pueden hacerlo.
        """
        cita = self.get_object()

        # Verificar permisos de cancelación (cliente dueño o profesional asignado)
        es_cliente = cita.cliente_id == request.user.id
        es_profesional = (
            hasattr(request.user, 'perfil_profesional')
            and cita.profesional_id == request.user.perfil_profesional.id
        )

        if not (request.user.is_staff or request.user.is_superuser or es_cliente or es_profesional):
            return Response(
                {
                    "detail": "No tienes permiso para cancelar esta cita.",
                    "debug": {
                        "user_id": request.user.id,
                        "cita_cliente_id": cita.cliente_id,
                        "cita_profesional_id": cita.profesional_id,
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Si ya está cancelada, devolver mensaje informativo
        if cita.estado == 'cancelada':
            return Response(
                {"detail": "La cita ya está cancelada."},
                status=status.HTTP_200_OK,
            )

        # Cambiar estado y guardar
        cita.estado = 'cancelada'
        cita.save()

        # Serializar la cita actualizada y devolverla
        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)