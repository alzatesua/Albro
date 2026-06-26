from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EstadoAtencion, PerfilProfesional, Departamento, Municipio
from .serializers import (
    CambiarEstadoProfesionalSerializer,
    EstadoAtencionSerializer,
    PerfilProfesionalSerializer,
    DepartamentoSerializer, 
    MunicipioSerializer,
)



class RegistroProfesionalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PerfilProfesionalSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            perfil = serializer.save()
            return Response(
                {
                    'mensaje': 'Perfil profesional registrado exitosamente',
                    'profesional': PerfilProfesionalSerializer(perfil).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PerfilProfesionalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PerfilProfesionalSerializer(perfil)
        return Response(serializer.data)

    def put(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PerfilProfesionalSerializer(
            perfil,
            data=request.data,
            partial=False,
            context={'request': request},
        )
        if serializer.is_valid():
            perfil = serializer.save()
            return Response(
                {
                    'mensaje': 'Perfil profesional actualizado',
                    'profesional': PerfilProfesionalSerializer(perfil).data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PerfilProfesionalSerializer(
            perfil,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            perfil = serializer.save()
            return Response(
                {
                    'mensaje': 'Perfil profesional actualizado',
                    'profesional': PerfilProfesionalSerializer(perfil).data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstadosAtencionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        estados = EstadoAtencion.objects.filter(activo=True)
        serializer = EstadoAtencionSerializer(estados, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.rol != 'admin' and not request.user.is_staff:
            return Response(
                {'detalle': 'Solo un administrador puede crear estados de atencion.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EstadoAtencionSerializer(data=request.data)
        if serializer.is_valid():
            estado = serializer.save()
            return Response(
                {
                    'mensaje': 'Estado de atencion creado exitosamente',
                    'estado': EstadoAtencionSerializer(estado).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstadoProfesionalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                'profesional_id': perfil.id,
                'estado': EstadoAtencionSerializer(perfil.estado).data if perfil.estado else None,
            }
        )

    def patch(self, request):
        if request.user.rol != 'profesional':
            return Response(
                {'detalle': 'Solo un usuario profesional puede cambiar su estado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CambiarEstadoProfesionalSerializer(
            perfil,
            data=request.data,
            partial=False,
        )
        if serializer.is_valid():
            perfil = serializer.save()
            return Response(
                {
                    'mensaje': f'Estado cambiado a {perfil.estado.nombre}',
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstadoProfesionalDetalleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, profesional_id):
        try:
            perfil = PerfilProfesional.objects.select_related('estado').get(
                id=profesional_id,
            )
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'Profesional no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                'profesional_id': perfil.id,
                'nombre_local': perfil.nombre_local,
                'estado': EstadoAtencionSerializer(perfil.estado).data if perfil.estado else None,
            }
        )




class DepartamentosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        departamentos = Departamento.objects.all()
        serializer = DepartamentoSerializer(departamentos, many=True)
        return Response(serializer.data)


class MunicipiosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, departamento_id):
        municipios = Municipio.objects.filter(
            departamento_id=departamento_id,
        ).select_related('departamento')
        serializer = MunicipioSerializer(municipios, many=True)
        return Response(serializer.data)
