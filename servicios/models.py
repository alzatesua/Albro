from django.db import models
from django.utils import timezone
from usuarios.models import Usuario
import uuid



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




class Membresia(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de pago'),
        ('activa', 'Activa'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]
    PLAN_CHOICES = [
        ('mensual', 'Mensual'),
        ('anual', 'Anual'),
    ]

    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='membresia')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='mensual')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    pagado = models.BooleanField(default=False)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)

    @property
    def esta_vigente(self):
        if not self.pagado or self.fecha_vencimiento is None:
            return False
        return timezone.now() <= self.fecha_vencimiento

    def __str__(self):
        return f'Membresía de {self.usuario.email} - {self.estado}'


class Pago(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('exitoso', 'Exitoso'),
        ('fallido', 'Fallido'),
        ('reembolsado', 'Reembolsado'),
    ]

    membresia = models.ForeignKey(Membresia, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    moneda = models.CharField(max_length=10, default='COP')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    pasarela = models.CharField(max_length=20, default='wompi')
    referencia_interna = models.CharField(max_length=100, unique=True)
    referencia_pasarela = models.CharField(max_length=150, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'Pago {self.referencia_interna} - {self.estado}'


class Factura(models.Model):
    pago = models.OneToOneField(Pago, on_delete=models.CASCADE, related_name='factura')
    numero_factura = models.CharField(max_length=50, unique=True, editable=False)
    razon_social = models.CharField(max_length=200, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    archivo_pdf = models.FileField(upload_to='facturas/', blank=True, null=True)
    fecha_emision = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.numero_factura:
            self.numero_factura = f'FAC-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Factura {self.numero_factura}'