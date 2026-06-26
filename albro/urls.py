from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/profesionales/', include('profesionales.urls')),
    path('api/servicios/', include('servicios.urls')),
    #path('api/citas/', include('citas.urls')),
    #path('api/subastas/', include('subastas.urls')),
    #path('api/cola/', include('cola.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
