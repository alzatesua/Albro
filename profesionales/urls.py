from django.urls import path
from django.conf import settings
from django.conf.urls.static import static


from .views import (
    EstadoProfesionalDetalleView,
    EstadoProfesionalView,
    EstadosAtencionView,
    PerfilProfesionalView,
    RegistroProfesionalView,
    DepartamentosView,
    MunicipiosView,
    MisHorariosView,
    AgendaProfesionalView,
    ListarProfesionalesUbicacionView,
    BuscarProfesionalesView,
    ServiciosDeProfesionalView,
    CalificarCitaView,
    ListarClientesProfesionalView,
    ListarClientesUnicosProfesionalView,
    SubirImagenPortafolioView,
    MiPortafolioView,
    CatalogoProfesionalView,
    MiCatalogoView,
    EliminarImagenPortafolioView,
    MiCodigoQRView,
)

urlpatterns = [
    path('registro/', RegistroProfesionalView.as_view(), name='registro-profesional'),
    path('perfil/', PerfilProfesionalView.as_view(), name='perfil-profesional'),
    path('estados/', EstadosAtencionView.as_view(), name='estados-atencion'),
    path('estado/', EstadoProfesionalView.as_view(), name='estado-profesional'),
    path('departamentos/', DepartamentosView.as_view(), name='departamentos'),
    path('departamentos/<int:departamento_id>/municipios/', MunicipiosView.as_view(), name='municipios'),
    path(
        'estado/<int:profesional_id>/',
        EstadoProfesionalDetalleView.as_view(),
        name='estado-profesional-detalle',
    ),
    path('mis-horarios/', MisHorariosView.as_view(), name='mis-horarios'),
    path('buscar/', BuscarProfesionalesView.as_view(), name='buscar-profesionales'),
    path('<int:profesional_id>/agenda/', AgendaProfesionalView.as_view(), name='agenda-profesional'),
    path('ubicaciones/', ListarProfesionalesUbicacionView.as_view(), name='profesionales-ubicaciones'),
    path('<int:profesional_id>/servicios/', ServiciosDeProfesionalView.as_view(), name='servicios-profesional'),
    path('<int:profesional_id>/agenda/', AgendaProfesionalView.as_view(), name='agenda-profesional'),

    path('calificar/', CalificarCitaView.as_view(), name='calificar-cita'),
    path('mis-clientes/', ListarClientesProfesionalView.as_view(), name='mis-clientes-profesional'),
    path('mis-clientes/unicos/', ListarClientesUnicosProfesionalView.as_view(), name='mis-clientes-unicos'),
    path('portafolio/', SubirImagenPortafolioView.as_view(), name='subir-portafolio'),
    path('portafolio/listar/', MiPortafolioView.as_view(), name='mi-portafolio'),
    path('<int:profesional_id>/catalogo/', CatalogoProfesionalView.as_view(), name='catalogo-profesional'),
    path('mi-catalogo/', MiCatalogoView.as_view(), name='mi-catalogo'),
    path('portafolio/<int:imagen_id>/', EliminarImagenPortafolioView.as_view(), name='eliminar-imagen-portafolio'),
    path('mi-qr/', MiCodigoQRView.as_view(), name='mi-qr'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)