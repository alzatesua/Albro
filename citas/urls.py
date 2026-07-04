from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, WSTicketView

# Utilizamos el router por defecto, que incluye la barra final en las URLs.
# De esta forma los endpoints serán:
#   GET /api/citas/          → lista de citas
#   POST /api/citas/         → crear cita
#   GET /api/citas/<id>/     → detalle
#   PUT /api/citas/<id>/     → actualización completa
#   PATCH /api/citas/<id>/   → actualización parcial
#   DELETE /api/citas/<id>/  → eliminar
#   POST /api/citas/<id>/cancel/ → cancelar cita
router = DefaultRouter()  # trailing_slash=True por defecto
router.register(r'citas', CitaViewSet, basename='cita')

urlpatterns = [
    path('', include(router.urls)),
    path('ws-ticket/', WSTicketView.as_view(), name='ws-ticket'),
]