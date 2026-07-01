from django.db import models


class Cita(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('completada', 'Completada'),
    ]

    profesional = models.ForeignKey(
        'profesionales.PerfilProfesional',
        on_delete=models.CASCADE,
        related_name='citas',
    )
    servicio = models.ForeignKey(
        'servicios.Servicio',
        on_delete=models.PROTECT,
        related_name='citas',
    )
    cliente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='citas_agendadas',
    )
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha', 'hora_inicio']
        verbose_name = 'cita'
        verbose_name_plural = 'citas'

    def __str__(self):
        return f'{self.cliente} con {self.profesional} - {self.fecha} {self.hora_inicio}'