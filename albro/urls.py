"""URL configuration for the *albro* project.

Este archivo centraliza todas las rutas de la API y la zona de administración.
Incluye los routers de cada aplicación (usuarios, profesionales, servicios,
citas, autenticación, etc.) y sirve los archivos estáticos de media cuando
se ejecuta en modo DEBUG.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Área de administración de Django
    path('admin/', admin.site.urls),

    # APIs de cada aplicación
    path('api/usuarios/', include('usuarios.urls')),
    path('api/profesionales/', include('profesionales.urls')),
    path('api/servicios/', include('servicios.urls')),
    # Cambiamos el prefijo para citas a 'api/' (sin 'citas/') porque el router
    # interno ya incluye el segmento 'citas/'. De esta forma la ruta final será:
    #   /api/citas/   (list y create)
    #   /api/citas/<id>/ (retrieve, update, delete)
    path('api/', include('citas.urls')),
    path('api/auth/', include('google_auth.urls')),
    # Si en el futuro añades más apps, simplemente agrega otra línea aquí,
    # por ejemplo: path('api/subastas/', include('subastas.urls')),
    path('api/', include('notificaciones.urls')),
    path('api/configuraciones/', include('configuraciones.urls')),
]

# Servir archivos de media en modo desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
