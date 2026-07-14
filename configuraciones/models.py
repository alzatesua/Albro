from django.db import models
from django.conf import settings


class ConfiguracionSwitches(models.Model):
    """
    Guarda las preferencias de switches/toggles de un usuario en un solo
    JSONField, para no tener que crear un campo ni una migración nueva
    cada vez que se agrega un switch en el frontend.

    Ejemplo de contenido:
    {
        "mostrar_modal_portafolio": true,
        "sonido_notificaciones": false
    }
    """
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='configuracion_switches',
    )
    switches = models.JSONField(default=dict, blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'configuración de switches'
        verbose_name_plural = 'configuraciones de switches'

    def __str__(self):
        return f'Configuración de {self.usuario}'