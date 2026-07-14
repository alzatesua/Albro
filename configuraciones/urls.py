from django.urls import path
from .views import ConfiguracionSwitchesView

urlpatterns = [
    path('switches/', ConfiguracionSwitchesView.as_view(), name='configuracion-switches'),
]