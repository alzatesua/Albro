from django.urls import path

from .views import (
    AsociarServicioCategoriaView,
    CategoriaServicioDetalleView,
    CategoriaServicioListCreateView,
    ServicioListCreateView,
    ProfesionalesView,
    MisServiciosView,
)

urlpatterns = [
    path('categorias/', CategoriaServicioListCreateView.as_view(), name='categorias-servicios'),
    path('categorias/<int:pk>/', CategoriaServicioDetalleView.as_view(), name='categoria-servicio-detalle'),
    path(
        'categorias/<int:categoria_id>/servicios/',
        AsociarServicioCategoriaView.as_view(),
        name='asociar-servicio-categoria',
    ),
    path('servicios/', ServicioListCreateView.as_view(), name='servicios'),
    path('profesionales/', ProfesionalesView.as_view(), name='profesionales-lista'),
    path('mis-servicios/', MisServiciosView.as_view(), name='mis-servicios'),
]