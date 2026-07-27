from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):

    ROL_CHOICES = [
        ('admin', 'Admin'),
        ('profesional', 'Profesional'),
        ('cliente', 'Cliente'),
    ]

    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto = models.ImageField(upload_to='usuarios/fotos/', blank=True, null=True)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='cliente')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    primer_ingreso = models.BooleanField(default=True)

    # --- NUEVO: control de trial ---
    en_produccion = models.BooleanField(
        default=False,
        help_text='Si es False, la cuenta está en periodo de prueba (trial gratuito).'
    )
    dias_prueba = models.PositiveIntegerField(
        default=15,
        help_text='Días de prueba gratuita permitidos para usuarios profesionales.'
    )

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.nombre} {self.apellido} ({self.rol})'

    # --- Propiedades de apoyo para el trial ---
    @property
    def dias_transcurridos(self):
        return (timezone.now() - self.fecha_registro).days

    @property
    def esta_en_trial(self):
        """Solo aplica lógica de trial a profesionales que no están en producción."""
        return self.rol == 'profesional' and not self.en_produccion

    @property
    def trial_expirado(self):
        if not self.esta_en_trial:
            return False
        return self.dias_transcurridos > self.dias_prueba

    @property
    def dias_restantes_trial(self):
        if not self.esta_en_trial:
            return None
        return max(self.dias_prueba - self.dias_transcurridos, 0)

class Membresia(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de pago'),
        ('activa', 'Activa'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]

    usuario = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, related_name='membresia'
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    pagado = models.BooleanField(default=False)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Membresía de {self.usuario.email} - {self.estado}'