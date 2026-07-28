# panel_admin/urls.py
from django.urls import path
from .views import SolicitarCodigoView, VerificarCodigoView, ConfirmarPagoPanelView

urlpatterns = [
    path('solicitar-codigo/', SolicitarCodigoView.as_view(), name='panel-solicitar-codigo'),
    path('verificar-codigo/', VerificarCodigoView.as_view(), name='panel-verificar-codigo'),
    path('confirmar-pago/', ConfirmarPagoPanelView.as_view(), name='panel-confirmar-pago'),
]