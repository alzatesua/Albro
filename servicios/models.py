from django.db import models


class CategoriaServicio(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'categoria de servicio'
        verbose_name_plural = 'categorias de servicios'

    def __str__(self):
        return self.nombre


class Servicio(models.Model):
    categoria = models.ForeignKey(
        CategoriaServicio,
        on_delete=models.SET_NULL,
        related_name='servicios',
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['categoria', 'nombre'],
                name='servicio_unico_por_categoria',
            ),
        ]
        verbose_name = 'servicio'
        verbose_name_plural = 'servicios'

    def __str__(self):
        return self.nombre


class ServicioProfesional(models.Model):
    """
    Relación entre un profesional y los servicios que ofrece, con su precio.
    """
    profesional = models.ForeignKey(
        'profesionales.PerfilProfesional',
        on_delete=models.CASCADE,
        related_name='servicios_ofrecidos',
    )
    servicio = models.ForeignKey(
        Servicio,
        on_delete=models.CASCADE,
        related_name='profesionales_que_ofrecen',
    )
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_minutos = models.PositiveIntegerField(default=30)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['precio']
        constraints = [
            models.UniqueConstraint(
                fields=['profesional', 'servicio'],
                name='servicio_unico_por_profesional',
            ),
        ]
        verbose_name = 'servicio ofrecido por profesional'
        verbose_name_plural = 'servicios ofrecidos por profesionales'

    def __str__(self):
        return f'{self.profesional} → {self.servicio} (${self.precio})'