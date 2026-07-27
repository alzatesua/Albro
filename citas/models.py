from django.db import models
from django.db.models import Q


class Cita(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('completada', 'Completada'),
    ]

    # Relación con el profesional que atenderá la cita
    profesional = models.ForeignKey(
        'profesionales.PerfilProfesional',
        on_delete=models.CASCADE,
        related_name='citas',
    )
    # Servicio que se está reservando
    servicio = models.ForeignKey(
        'servicios.Servicio',
        on_delete=models.PROTECT,
        related_name='citas',
    )
    # Categoría del servicio (opcional, para filtrar o agrupar)
    categoria = models.ForeignKey(
        'servicios.CategoriaServicio',
        on_delete=models.PROTECT,
        related_name='citas',
        null=True,
        blank=True,
    )
    # Usuario que agenda la cita (cliente)
    cliente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='citas_agendadas',
    )
    # Información de fecha y horario
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    # Campo opcional para almacenar una etiqueta legible del horario
    etiqueta = models.CharField(max_length=100, blank=True)

    # Modo de creación (por ejemplo, "profesional", "cliente", etc.)
    modo = models.CharField(max_length=20, default='profesional')
    iniciado_en = models.DateTimeField(null=True, blank=True)

    # Estado de la cita
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha', 'hora_inicio']
        verbose_name = 'cita'
        verbose_name_plural = 'citas'
        constraints = [
            models.UniqueConstraint(
                fields=['profesional', 'fecha', 'hora_inicio'],
                condition=~Q(estado='cancelada'),
                name='unico_horario_profesional_activo',
            )
        ]

    def __str__(self):
        return f'{self.cliente} con {self.profesional} - {self.fecha} {self.hora_inicio}'
