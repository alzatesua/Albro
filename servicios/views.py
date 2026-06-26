from django.db.models import Count
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CategoriaServicio, Servicio
from .serializers import (
    AsociarServicioCategoriaSerializer,
    CategoriaServicioDetalleSerializer,
    CategoriaServicioSerializer,
    ServicioSerializer,
)


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
