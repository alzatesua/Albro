from django.db import models


class EstadoAtencion(models.Model):
    codigo = models.SlugField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100, unique=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'estado de atencion'
        verbose_name_plural = 'estados de atencion'
        ordering = ['id']

    def __str__(self):
        return self.nombre


class PerfilProfesional(models.Model):
    usuario = models.OneToOneField(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='perfil_profesional',
    )
    direccion = models.CharField(max_length=255)
    ubicacion = models.CharField(max_length=255)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    nombre_local = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    imagen_perfil = models.ImageField(          # ← NUEVO
        upload_to='profesionales/perfiles/%Y/%m/',
        blank=True,
        null=True,
    )
    activo = models.BooleanField(default=True)
    horarios_atencion = models.JSONField(default=list, blank=True)
    estado = models.ForeignKey(
        EstadoAtencion,
        on_delete=models.PROTECT,
        related_name='profesionales',
        null=True,
        blank=True,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'perfil profesional'
        verbose_name_plural = 'perfiles profesionales'

    def __str__(self):
        return f'{self.usuario.nombre} {self.usuario.apellido} - {self.nombre_local}'




class Departamento(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10, unique=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Municipio(models.Model):
    nombre = models.CharField(max_length=100)
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='municipios',
    )

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre}, {self.departamento.nombre}"