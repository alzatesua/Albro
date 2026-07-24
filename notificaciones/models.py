from django.db import models
from django.conf import settings


class Notificacion(models.Model):
    """
    Registro persistente de cada notificación enviada por WebSocket.
    Permite que el usuario las liste aunque no haya estado conectado
    en el momento del evento.
    """
    TIPO_CHOICES = [
        ('cita', 'Cita'),
        ('subasta', 'Subasta'),
        ('mensaje', 'Mensaje'),
        ('sistema', 'Sistema'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificaciones',
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='sistema')
    evento = models.CharField(max_length=50)   # "creada", "cancelada", "confirmada", etc.
    titulo = models.CharField(max_length=150)
    mensaje = models.CharField(max_length=255, blank=True)

    # Datos originales del objeto relacionado (cita, subasta, etc.)
    data = models.JSONField(default=dict, blank=True)

    # Referencia genérica opcional al objeto origen, útil para deep-linking
    # en el frontend (ej: "citas.Cita" + object_id)
    content_type_app = models.CharField(max_length=50, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)

    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_leida = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['usuario', '-fecha_creacion']),
        ]
        verbose_name = 'notificación'
        verbose_name_plural = 'notificaciones'

    def __str__(self):
        return f'{self.titulo} -> {self.usuario} ({"leída" if self.leida else "no leída"})'