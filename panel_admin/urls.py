from django.urls import path
from .views import (
    SolicitarCodigoView,
    VerificarCodigoView,
    ConfirmarPagoPanelView,
    PagosPendientesPanelView,
    PagosPorEstadoPanelView,
)

urlpatterns = [
    path('solicitar-codigo/', SolicitarCodigoView.as_view(), name='panel-solicitar-codigo'),
    path('verificar-codigo/', VerificarCodigoView.as_view(), name='panel-verificar-codigo'),
    path('confirmar-pago/', ConfirmarPagoPanelView.as_view(), name='panel-confirmar-pago'),
    path('pagos-pendientes/', PagosPendientesPanelView.as_view(), name='pagos-pendientes-panel'),
    path('pagos/<str:estado>/', PagosPorEstadoPanelView.as_view(), name='pagos-por-estado-panel'),
]