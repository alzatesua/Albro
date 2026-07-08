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
    HorariosAtencionSerializer,
    ProfesionalUbicacionSerializer,
)
from datetime import datetime, date, timedelta
from rest_framework.generics import get_object_or_404
from servicios.models import Servicio, ServicioProfesional
from .utils import generar_cupos_disponibles

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



class MisHorariosView(APIView):
    """
    Gestiona los horarios de atencion del profesional autenticado.

    GET /api/profesionales/mis-horarios/  -> ver horarios actuales
    PUT /api/profesionales/mis-horarios/  -> reemplazar todos los horarios
    """
    permission_classes = [IsAuthenticated]

    def _obtener_perfil(self, request):
        try:
            return request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return None

    def get(self, request):
        perfil = self._obtener_perfil(request)
        if not perfil:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({'horarios': perfil.horarios_atencion})

    def put(self, request):
        perfil = self._obtener_perfil(request)
        if not perfil:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = HorariosAtencionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        horarios = [
            {
                'dia': item['dia'],
                'inicio': item['inicio'].strftime('%H:%M'),
                'fin': item['fin'].strftime('%H:%M'),
            }
            for item in serializer.validated_data['horarios']
        ]

        perfil.horarios_atencion = horarios
        perfil.save(update_fields=['horarios_atencion', 'fecha_actualizacion'])

        return Response(
            {
                'mensaje': 'Horarios actualizados exitosamente',
                'horarios': perfil.horarios_atencion,
            }
        )


class AgendaProfesionalView(APIView):
    """
    GET /api/profesionales/<profesional_id>/agenda/?servicio=1&fecha=2026-07-05
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, profesional_id):
        servicio_id = request.query_params.get('servicio')
        fecha_str = request.query_params.get('fecha')

        if not servicio_id or not fecha_str:
            return Response(
                {'detalle': 'Debes enviar los parametros servicio y fecha.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        perfil = get_object_or_404(PerfilProfesional, pk=profesional_id, activo=True)
        servicio = get_object_or_404(Servicio, pk=servicio_id, activo=True)

        relacion = ServicioProfesional.objects.filter(
            profesional=perfil, servicio=servicio, activo=True
        ).first()

        if not relacion:
            return Response(
                {'detalle': 'Este profesional no ofrece ese servicio.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'detalle': 'Formato de fecha invalido. Usa YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if fecha < date.today():
            return Response(
                {'detalle': 'No se puede consultar una fecha pasada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cupos = generar_cupos_disponibles(perfil, servicio, fecha)
        duracion = relacion.duracion_minutos

        cupos_formateados = []
        for hora_str in cupos:
            inicio = datetime.strptime(hora_str, '%H:%M')
            fin = inicio + timedelta(minutes=duracion)
            cupos_formateados.append({
                'hora_inicio': inicio.strftime('%H:%M'),
                'hora_fin': fin.strftime('%H:%M'),
                'etiqueta': f"{inicio.strftime('%H:%M')} - {fin.strftime('%H:%M')}",
            })

        return Response(
            {
                'profesional_id': perfil.id,
                'servicio_id': servicio.id,
                'duracion_minutos': duracion,
                'precio': str(relacion.precio),
                'fecha': fecha_str,
                'cupos_disponibles': cupos_formateados,
            }
        )


class ListarProfesionalesUbicacionView(APIView):
    """
    GET /api/profesionales/ubicaciones/

    Lista todos los profesionales activos con su información de ubicación:
    - ID
    - Nombre y apellido
    - Dirección
    - Latitud y longitud
    - Foto de perfil
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profesionales = PerfilProfesional.objects.filter(
            activo=True
        ).select_related('usuario')

        serializer = ProfesionalUbicacionSerializer(
            profesionales,
            many=True
        )

        return Response({
            'profesionales': serializer.data,
            'total': len(serializer.data)
        })