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

class CalificacionProfesional(models.Model):
    """
    Calificación (1-5 estrellas) que un cliente deja a un profesional
    después de que la cita fue marcada como 'completada'.
    Una calificación por cita (OneToOne).
    """
    cita = models.OneToOneField(
        'citas.Cita',
        on_delete=models.CASCADE,
        related_name='calificacion',
    )
    profesional = models.ForeignKey(
        PerfilProfesional,
        on_delete=models.CASCADE,
        related_name='calificaciones',
    )
    cliente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='calificaciones_realizadas',
    )
    estrellas = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
    )
    comentario = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'calificación de profesional'
        verbose_name_plural = 'calificaciones de profesionales'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'{self.cliente} → {self.profesional} ({self.estrellas}★)'

class ImagenPortafolio(models.Model):
    """
    Foto del trabajo realizado por el profesional (antes/después, resultado
    final, etc). Se vincula a la cita para saber automáticamente
    a qué cliente y servicio pertenece.
    """
    profesional = models.ForeignKey(
        PerfilProfesional,
        on_delete=models.CASCADE,
        related_name='portafolio',
    )
    cliente = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        related_name='fotos_de_mis_servicios',
        null=True,
        blank=True,
    )
    cita = models.ForeignKey(
        'citas.Cita',
        on_delete=models.SET_NULL,
        related_name='fotos_portafolio',
        null=True,
        blank=True,
    )
    imagen = models.ImageField(
        upload_to='profesionales/portafolio/%Y/%m/',
    )
    descripcion = models.CharField(max_length=255, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'imagen de portafolio'
        verbose_name_plural = 'imágenes de portafolio'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'Foto de {self.profesional} - {self.fecha_creacion.strftime("%Y-%m-%d")}'