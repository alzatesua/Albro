from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny


from django.db.models import Count, Avg, Max, Min
from .models import EstadoAtencion, PerfilProfesional, Departamento, Municipio, ImagenPortafolio
from citas.models import Cita 
from .serializers import (
    CambiarEstadoProfesionalSerializer,
    EstadoAtencionSerializer,
    PerfilProfesionalSerializer,
    DepartamentoSerializer,
    MunicipioSerializer,
    HorariosAtencionSerializer,
    ProfesionalUbicacionSerializer,
    CrearCalificacionSerializer,
    ClienteDeProfesionalSerializer,
    ImagenPortafolioSerializer,
    SubirImagenPortafolioSerializer,
)
from datetime import datetime, date, timedelta
from rest_framework.generics import get_object_or_404
from servicios.models import Servicio, ServicioProfesional
from .utils import generar_cupos_disponibles
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q, Value
from django.db.models.functions import Greatest
from rest_framework.parsers import MultiPartParser, FormParser
from .paginacion import PaginacionEstandar

import qrcode
import io
import base64
from django.conf import settings

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
 

class BuscarProfesionalesView(APIView):
    """
    GET /api/profesionales/buscar/?q=<texto>&servicio=<id>&categoria=<texto_o_id>

    Busqueda tolerante a errores de escritura, tildes y mayusculas.
    'q' busca en el profesional Y en los servicios que ofrece (nombre/descripcion).
    'categoria' busca por nombre O descripcion de la categoria.
    """
    permission_classes = [IsAuthenticated]

    UMBRAL_SIMILITUD = 0.2

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        servicio_id = request.query_params.get('servicio')
        categoria = request.query_params.get('categoria', '').strip()

        profesionales = PerfilProfesional.objects.filter(
            activo=True
        ).select_related('usuario')

        if q:
            profesionales = profesionales.annotate(
                similitud=Greatest(
                    TrigramSimilarity('nombre_local', q),
                    TrigramSimilarity('descripcion', q),
                    TrigramSimilarity('usuario__nombre', q),
                    TrigramSimilarity('usuario__apellido', q),
                    TrigramSimilarity('servicios_ofrecidos__servicio__nombre', q),
                    TrigramSimilarity('servicios_ofrecidos__servicio__descripcion', q),
                )
            ).filter(
                Q(similitud__gte=self.UMBRAL_SIMILITUD) |
                Q(nombre_local__icontains=q) |
                Q(descripcion__icontains=q) |
                Q(usuario__nombre__icontains=q) |
                Q(usuario__apellido__icontains=q) |
                Q(servicios_ofrecidos__servicio__nombre__icontains=q) |
                Q(servicios_ofrecidos__servicio__descripcion__icontains=q) |
                Q(servicios_ofrecidos__servicio__categoria__nombre__icontains=q) |
                Q(servicios_ofrecidos__servicio__categoria__descripcion__icontains=q),
                servicios_ofrecidos__activo=True,
            ).order_by('-similitud')

        if servicio_id:
            profesionales = profesionales.filter(
                servicios_ofrecidos__servicio_id=servicio_id,
                servicios_ofrecidos__activo=True,
            )

        if categoria:
            if categoria.isdigit():
                profesionales = profesionales.filter(
                    servicios_ofrecidos__servicio__categoria_id=categoria,
                    servicios_ofrecidos__activo=True,
                )
            else:
                profesionales = profesionales.annotate(
                    similitud_categoria=Greatest(
                        TrigramSimilarity('servicios_ofrecidos__servicio__categoria__nombre', categoria),
                        TrigramSimilarity('servicios_ofrecidos__servicio__categoria__descripcion', categoria),
                        TrigramSimilarity('servicios_ofrecidos__servicio__nombre', categoria),
                        TrigramSimilarity('servicios_ofrecidos__servicio__descripcion', categoria),
                    )
                ).filter(
                    Q(similitud_categoria__gte=self.UMBRAL_SIMILITUD) |
                    Q(servicios_ofrecidos__servicio__categoria__nombre__icontains=categoria) |
                    Q(servicios_ofrecidos__servicio__categoria__descripcion__icontains=categoria) |
                    Q(servicios_ofrecidos__servicio__nombre__icontains=categoria) |
                    Q(servicios_ofrecidos__servicio__descripcion__icontains=categoria),
                    servicios_ofrecidos__activo=True,
                )

        profesionales = profesionales.select_related('usuario')

        # Deduplicar preservando el orden de relevancia (el join con servicios_ofrecidos
        # puede repetir al mismo profesional una vez por cada servicio que coincide)
        vistos = set()
        profesionales_unicos = []
        for p in profesionales:
            if p.id not in vistos:
                vistos.add(p.id)
                profesionales_unicos.append(p)

        serializer = ProfesionalUbicacionSerializer(profesionales_unicos, many=True)
        return Response({
            'profesionales': serializer.data,
            'total': len(profesionales_unicos),
        })


class ServiciosDeProfesionalView(APIView):
    """
    GET /api/profesionales/<profesional_id>/servicios/

    Devuelve solo los servicios que ESE profesional ofrece activamente,
    agrupables por categoria en el frontend si se necesita.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, profesional_id):
        perfil = get_object_or_404(PerfilProfesional, pk=profesional_id, activo=True)

        relaciones = ServicioProfesional.objects.filter(
            profesional=perfil,
            activo=True,
        ).select_related('servicio', 'servicio__categoria')

        servicios = [
            {
                'id': rel.servicio.id,
                'nombre': rel.servicio.nombre,
                'descripcion': rel.servicio.descripcion,
                'categoria': rel.servicio.categoria_id,
                'categoria_nombre': rel.servicio.categoria.nombre if rel.servicio.categoria else None,
                'precio': str(rel.precio),
                'duracion_minutos': rel.duracion_minutos,
            }
            for rel in relaciones
        ]

        return Response({'servicios': servicios})


class CalificarCitaView(APIView):
    """
    POST /api/profesionales/calificar/
    body: { "cita_id": 5, "estrellas": 4, "comentario": "..." }

    El cliente autenticado califica una cita ya completada.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearCalificacionSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        calificacion = serializer.save()
        return Response(
            {
                'mensaje': 'Calificación registrada exitosamente',
                'calificacion': CrearCalificacionSerializer(
                    calificacion, context={'request': request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ListarClientesProfesionalView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PaginacionEstandar

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        citas = Cita.objects.filter(
            profesional=perfil
        ).select_related(
            'cliente', 'servicio', 'categoria', 'calificacion'
        ).order_by('-fecha', '-hora_inicio')

        estado = request.query_params.get('estado')
        if estado:
            citas = citas.filter(estado=estado)

        paginator = self.pagination_class()
        pagina = paginator.paginate_queryset(citas, request)

        serializer = ClienteDeProfesionalSerializer(pagina, many=True)
        return paginator.get_paginated_response(serializer.data)

class ListarClientesUnicosProfesionalView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PaginacionEstandar

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        citas = Cita.objects.filter(profesional=perfil)

        estado = request.query_params.get('estado')
        if estado:
            citas = citas.filter(estado=estado)

        clientes = citas.values(
            'cliente_id',
            'cliente__nombre',
            'cliente__apellido',
            'cliente__email',
            'cliente__telefono',
        ).annotate(
            total_citas=Count('id'),
            primera_cita=Min('fecha'),
            ultima_cita=Max('fecha'),
            promedio_estrellas=Avg('calificacion__estrellas'),
        ).order_by('-ultima_cita')

        paginator = self.pagination_class()
        pagina = paginator.paginate_queryset(clientes, request)

        resultado = [
            {
                'cliente_id': c['cliente_id'],
                'nombre': c['cliente__nombre'],
                'apellido': c['cliente__apellido'],
                'email': c['cliente__email'],
                'telefono': c['cliente__telefono'],
                'total_citas': c['total_citas'],
                'primera_cita': c['primera_cita'],
                'ultima_cita': c['ultima_cita'],
                'promedio_estrellas': round(c['promedio_estrellas'], 1) if c['promedio_estrellas'] else None,
            }
            for c in pagina
        ]

        return paginator.get_paginated_response(resultado)

class SubirImagenPortafolioView(APIView):
    """
    POST /api/profesionales/portafolio/
    multipart/form-data:
      - imagenes: (uno o varios archivos, misma key repetida)
      - cita_id: 5 (opcional, aplica a todas las imágenes del lote)
      - descripcion: "Corte fade + barba" (opcional, aplica a todas)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Acepta 'imagenes' (nuevo, para múltiples) o 'imagen' (compatibilidad con el nombre anterior)
        archivos = request.FILES.getlist('imagenes') or request.FILES.getlist('imagen')

        if not archivos:
            return Response(
                {'detalle': 'Debes enviar al menos un archivo en el campo "imagenes".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cita_id = request.data.get('cita_id')
        descripcion = request.data.get('descripcion', '')

        imagenes_creadas = []
        errores = []

        for archivo in archivos:
            data = {'imagen': archivo, 'descripcion': descripcion}
            if cita_id:
                data['cita_id'] = cita_id

            serializer = SubirImagenPortafolioSerializer(
                data=data,
                context={'request': request},
            )
            if serializer.is_valid():
                imagen = serializer.save()
                imagenes_creadas.append(
                    ImagenPortafolioSerializer(imagen, context={'request': request}).data
                )
            else:
                errores.append({'archivo': archivo.name, 'errores': serializer.errors})

        status_code = (
            status.HTTP_201_CREATED if imagenes_creadas else status.HTTP_400_BAD_REQUEST
        )
        return Response(
            {
                'mensaje': f'{len(imagenes_creadas)} imagen(es) subida(s) exitosamente.',
                'imagenes': imagenes_creadas,
                'errores': errores,
            },
            status=status_code,
        )

class MiPortafolioView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PaginacionEstandar

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        imagenes = ImagenPortafolio.objects.filter(
            profesional=perfil
        ).select_related('cliente', 'cita', 'cita__servicio')

        cliente_id = request.query_params.get('cliente')
        if cliente_id:
            imagenes = imagenes.filter(cliente_id=cliente_id)

        paginator = self.pagination_class()
        pagina = paginator.paginate_queryset(imagenes, request)

        serializer = ImagenPortafolioSerializer(
            pagina, many=True, context={'request': request}
        )
        return paginator.get_paginated_response(serializer.data)

def _construir_catalogo(perfil, request):
    """
    Arma el catálogo completo de un profesional:
    - info de perfil
    - servicios agrupados por categoría
    - preview del portafolio
    - promedio de calificación
    Se usa tanto para la vista pública (por id) como para 'mi catálogo'.
    """
    # ── Info del profesional ────────────────────────────────────────────
    foto_perfil = None
    if perfil.imagen_perfil:
        foto_perfil = request.build_absolute_uri(perfil.imagen_perfil.url)

    calificaciones = Cita.objects.filter(
        profesional=perfil,
        calificacion__isnull=False,
    ).aggregate(
        promedio=Avg('calificacion__estrellas'),
        total=Count('calificacion'),
    )

    info_profesional = {
        'id': perfil.id,
        'nombre_local': perfil.nombre_local,
        'nombre_completo': f"{perfil.usuario.nombre} {perfil.usuario.apellido}".strip(),
        'descripcion': perfil.descripcion,
        'foto_perfil': foto_perfil,
        'direccion': getattr(perfil, 'direccion', None),
        'latitud': getattr(perfil, 'latitud', None),
        'longitud': getattr(perfil, 'longitud', None),
        'estado': EstadoAtencionSerializer(perfil.estado).data if perfil.estado else None,
        'promedio_calificacion': round(calificaciones['promedio'], 1) if calificaciones['promedio'] else None,
        'total_valoraciones': calificaciones['total'],
    }

    # ── Servicios agrupados por categoría ───────────────────────────────
    relaciones = ServicioProfesional.objects.filter(
        profesional=perfil,
        activo=True,
    ).select_related('servicio', 'servicio__categoria').order_by(
        'servicio__categoria__nombre', 'servicio__nombre'
    )

    categorias_map = {}
    for rel in relaciones:
        categoria = rel.servicio.categoria
        categoria_id = categoria.id if categoria else None

        if categoria_id not in categorias_map:
            categorias_map[categoria_id] = {
                'id': categoria_id,
                'nombre': categoria.nombre if categoria else 'Sin categoría',
                'servicios': [],
            }

        categorias_map[categoria_id]['servicios'].append({
            'id': rel.servicio.id,
            'nombre': rel.servicio.nombre,
            'descripcion': rel.servicio.descripcion,
            'precio': str(rel.precio),
            'duracion_minutos': rel.duracion_minutos,
        })

    categorias = list(categorias_map.values())

    # ── Portafolio (preview, no paginado — para eso ya existe /portafolio/) ──
    imagenes_preview = ImagenPortafolio.objects.filter(
        profesional=perfil,
    ).select_related('cliente', 'cita', 'cita__servicio')[:12]

    portafolio = ImagenPortafolioSerializer(
        imagenes_preview, many=True, context={'request': request}
    ).data

    return {
        'profesional': info_profesional,
        'categorias': categorias,
        'portafolio': portafolio,
    }


class CatalogoProfesionalView(APIView):
    """
    GET /api/profesionales/<profesional_id>/catalogo/

    Catálogo público de un profesional: perfil + servicios agrupados
    por categoría + preview de portafolio + promedio de calificación.
    Endpoint público — no requiere autenticación.
    """
    permission_classes = [AllowAny]

    def get(self, request, profesional_id):
        perfil = get_object_or_404(
            PerfilProfesional.objects.select_related('usuario', 'estado'),
            pk=profesional_id,
            activo=True,
        )
        return Response(_construir_catalogo(perfil, request))

class MiCatalogoView(APIView):
    """
    GET /api/profesionales/mi-catalogo/

    Mismo formato que CatalogoProfesionalView, pero para el
    profesional autenticado (para gestionar/previsualizar el suyo).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(_construir_catalogo(perfil, request))

class EliminarImagenPortafolioView(APIView):
    """
    DELETE /api/profesionales/portafolio/<int:imagen_id>/

    Elimina una imagen del portafolio. Solo el profesional dueño
    de la imagen puede borrarla.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, imagen_id):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        imagen = get_object_or_404(ImagenPortafolio, pk=imagen_id, profesional=perfil)

        # Borra también el archivo físico/en storage, no solo el registro
        if imagen.imagen:
            imagen.imagen.delete(save=False)

        imagen.delete()

        return Response(
            {'mensaje': 'Imagen eliminada exitosamente.'},
            status=status.HTTP_200_OK,
        )

class MiCodigoQRView(APIView):
    """
    GET /api/profesionales/mi-qr/

    Genera un código QR que apunta al deep link público del profesional
    (ej. https://tuapp.com/agendar/5). Al escanearlo, el cliente:
      - si no tiene sesión: va a login/registro
      - si ya tiene sesión: cae directo en el modal de agendar con
        este profesional preseleccionado
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            perfil = request.user.perfil_profesional
        except PerfilProfesional.DoesNotExist:
            return Response(
                {'detalle': 'El usuario aun no tiene perfil profesional.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
        link = f"{frontend_url}/agendar/{perfil.id}"

        qr = qrcode.QRCode(box_size=8, border=2)
        qr.add_data(link)
        qr.make(fit=True)
        imagen = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        imagen.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            'url': link,
            'qr_base64': f"data:image/png;base64,{qr_base64}",
        })