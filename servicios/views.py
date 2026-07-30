from django.db.models import Count
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CategoriaServicio, Servicio, ServicioProfesional, Membresia, Pago, Usuario
from profesionales.models import PerfilProfesional
from .serializers import (
    AsociarServicioCategoriaSerializer,
    CategoriaServicioDetalleSerializer,
    CategoriaServicioSerializer,
    ServicioSerializer,
    ProfesionalListaSerializer,
    ServicioOfrecidoSerializer, 
    AsignarServicioSerializer,
    SolicitarPagoSerializer, 
    PagoSerializer
)
import uuid
from django.utils import timezone

class CategoriaServicioListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categorias = CategoriaServicio.objects.annotate(
            total_servicios=Count('servicios')
        )
        serializer = CategoriaServicioSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriaServicioSerializer(data=request.data)
        if serializer.is_valid():
            categoria = serializer.save()
            return Response(
                {
                    'mensaje': 'Categoria creada exitosamente',
                    'categoria': CategoriaServicioSerializer(categoria).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoriaServicioDetalleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        categoria = get_object_or_404(
            CategoriaServicio.objects.prefetch_related('servicios'),
            pk=pk,
        )
        serializer = CategoriaServicioDetalleSerializer(categoria)
        return Response(serializer.data)


class ServicioListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        servicios = Servicio.objects.select_related('categoria')
        categoria_id = request.query_params.get('categoria')
        if categoria_id:
            servicios = servicios.filter(categoria_id=categoria_id)

        serializer = ServicioSerializer(servicios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServicioSerializer(data=request.data)
        if serializer.is_valid():
            servicio = serializer.save()
            return Response(
                {
                    'mensaje': 'Servicio creado exitosamente',
                    'servicio': ServicioSerializer(servicio).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AsociarServicioCategoriaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, categoria_id):
        categoria = get_object_or_404(CategoriaServicio, pk=categoria_id)
        serializer = AsociarServicioCategoriaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        servicio_id = serializer.validated_data.get('servicio_id')
        if servicio_id:
            servicio = get_object_or_404(Servicio, pk=servicio_id)
            existe_servicio = Servicio.objects.filter(
                categoria=categoria,
                nombre__iexact=servicio.nombre,
            ).exclude(pk=servicio.pk).exists()
            if existe_servicio:
                return Response(
                    {'nombre': ['Ya existe un servicio con este nombre en la categoria.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            servicio.categoria = categoria
            servicio.save(update_fields=['categoria', 'fecha_actualizacion'])
            mensaje = 'Servicio asociado a la categoria exitosamente'
        else:
            nombre = serializer.validated_data['nombre']
            if Servicio.objects.filter(categoria=categoria, nombre__iexact=nombre).exists():
                return Response(
                    {'nombre': ['Ya existe un servicio con este nombre en la categoria.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            servicio = Servicio.objects.create(
                categoria=categoria,
                nombre=nombre,
                descripcion=serializer.validated_data.get('descripcion', ''),
                activo=serializer.validated_data.get('activo', True),
            )
            mensaje = 'Servicio creado y asociado a la categoria exitosamente'

        return Response(
            {
                'mensaje': mensaje,
                'servicio': ServicioSerializer(servicio).data,
            },
            status=status.HTTP_200_OK,
        )



class ProfesionalesView(APIView):
    """
    GET /api/servicios/profesionales/            -> todos los profesionales activos
    GET /api/servicios/profesionales/?servicio=5  -> solo los que ofrecen el servicio 5
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        servicio_id = request.query_params.get('servicio')

        queryset = PerfilProfesional.objects.filter(
            activo=True
        ).select_related('usuario', 'estado')

        if servicio_id:
            queryset = queryset.filter(
                servicios_ofrecidos__servicio_id=servicio_id,
                servicios_ofrecidos__activo=True,
            ).distinct()

        serializer = ProfesionalListaSerializer(
            queryset,
            many=True,
            context={'servicio_id': servicio_id},
        )
        return Response(serializer.data)



class MisServiciosView(APIView):
    """
    Gestiona los servicios que ofrece el profesional autenticado.

    GET    /api/servicios/mis-servicios/        -> listar mis servicios
    POST   /api/servicios/mis-servicios/        -> asignar uno o varios servicios (upsert)
    DELETE /api/servicios/mis-servicios/?servicio_id=3 -> quitar un servicio
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
        relaciones = perfil.servicios_ofrecidos.select_related('servicio')
        serializer = ServicioOfrecidoSerializer(relaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        perfil = self._obtener_perfil(request)
        if not perfil:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        es_lista = isinstance(request.data, list)
        serializer = AsignarServicioSerializer(data=request.data, many=es_lista)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data if es_lista else [serializer.validated_data]

        resultados = []
        for item in items:
            relacion, _ = ServicioProfesional.objects.update_or_create(
                profesional=perfil,
                servicio_id=item['servicio_id'],
                defaults={
                    'precio': item['precio'],
                    'duracion_minutos': item['duracion_minutos'], 
                    'activo': item.get('activo', True),
                },
            )
            resultados.append(relacion)

        return Response(
            {
                'mensaje': 'Servicios asignados exitosamente',
                'servicios': ServicioOfrecidoSerializer(resultados, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        perfil = self._obtener_perfil(request)
        if not perfil:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        servicio_id = request.query_params.get('servicio_id')
        if not servicio_id:
            return Response(
                {'detalle': 'Debes indicar servicio_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        eliminado, _ = ServicioProfesional.objects.filter(
            profesional=perfil, servicio_id=servicio_id
        ).delete()

        if not eliminado:
            return Response(
                {'detalle': 'No se encontro ese servicio asignado a tu perfil.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({'mensaje': 'Servicio removido de tu perfil'})



class SolicitarPagoView(APIView):
    permission_classes = [AllowAny]  # ← antes era IsAuthenticated

    def post(self, request):
        serializer = SolicitarPagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        try:
            usuario = Usuario.objects.get(email=datos['email_cuenta'])
        except Usuario.DoesNotExist:
            return Response({'detalle': 'No existe una cuenta con ese correo.'}, status=404)

        membresia, _ = Membresia.objects.update_or_create(
            usuario=usuario,
            defaults={'plan': datos['plan'], 'estado': 'pendiente'},
        )

        pago = Pago.objects.create(
            membresia=membresia,
            monto=datos['monto'],
            medio_pago=datos['medio_pago'],
            correo_pagador=datos['correo_pagador'],
            comprobante=datos.get('comprobante'),
            referencia_interna=f'PAG-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}',
        )

        return Response(
            {'mensaje': 'Solicitud de pago registrada, pendiente de verificación',
             'pago': PagoSerializer(pago).data},
            status=status.HTTP_201_CREATED,
        )