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
    path('<int:profesional_id>/agenda/', AgendaProfesionalView.as_view(), name='agenda-profesional'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)