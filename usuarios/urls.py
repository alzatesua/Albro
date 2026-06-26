from django.urls import path
from .views import RegistroView, LoginView, PerfilView, MarcarPrimerIngresoView

urlpatterns = [
    path('registro/', RegistroView.as_view(), name='registro'),
    path('login/', LoginView.as_view(), name='login'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('primer-ingreso/', MarcarPrimerIngresoView.as_view(), name='primer-ingreso'),
]