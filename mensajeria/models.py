from django.db import models


class Conversacion(models.Model):
    """
    Conversación única entre un cliente y un profesional.
    Independiente de citas puntuales.
    """
    cliente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='conversaciones_como_cliente',
    )
    profesional = models.ForeignKey(
        'profesionales.PerfilProfesional',
        on_delete=models.CASCADE,
        related_name='conversaciones_como_profesional',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actividad = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-ultima_actividad']
        constraints = [
            models.UniqueConstraint(
                fields=['cliente', 'profesional'],
                name='unica_conversacion_cliente_profesional',
            )
        ]

    def __str__(self):
        return f'Conversación {self.cliente} ↔ {self.profesional}'

    def es_participante(self, user):
        if self.cliente_id == user.id:
            return True
        return hasattr(user, 'perfil_profesional') and self.profesional_id == user.perfil_profesional.id


class Mensaje(models.Model):
    TIPO_CHOICES = [
        ('texto', 'Texto'),
        ('imagen', 'Imagen'),
        ('audio', 'Audio'),
    ]

    conversacion = models.ForeignKey(
        Conversacion,
        on_delete=models.CASCADE,
        related_name='mensajes',
    )
    remitente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='mensajes_enviados',
    )
    contenido = models.TextField(max_length=2000, blank=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='texto')
    archivo = models.FileField(upload_to='mensajeria/adjuntos/%Y/%m/', null=True, blank=True)
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)
    leido_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['fecha_envio']
        indexes = [
            models.Index(fields=['conversacion', 'fecha_envio']),
        ]

    def __str__(self):
        return f'{self.remitente} @ {self.fecha_envio}: {self.contenido[:30]}'