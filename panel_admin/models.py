# panel_admin/models.py
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import random


class AdminOperador(models.Model):
    """
    Modelo de acceso completamente independiente del sistema de Usuario/roles.
    Solo tú (y quien decidas manualmente) puede existir aquí.
    """
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    # Código OTP temporal enviado por correo
    codigo_otp = models.CharField(max_length=6, blank=True, null=True)
    codigo_otp_expira = models.DateTimeField(blank=True, null=True)

    ultimo_login = models.DateTimeField(null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def generar_codigo_otp(self):
        """Genera un código de 6 dígitos válido por 5 minutos."""
        codigo = f'{random.randint(0, 999999):06d}'
        self.codigo_otp = codigo
        self.codigo_otp_expira = timezone.now() + timezone.timedelta(minutes=5)
        self.save(update_fields=['codigo_otp', 'codigo_otp_expira'])
        return codigo

    def verificar_codigo_otp(self, codigo):
        if not self.codigo_otp or not self.codigo_otp_expira:
            return False
        if timezone.now() > self.codigo_otp_expira:
            return False
        return self.codigo_otp == codigo

    def invalidar_codigo_otp(self):
        self.codigo_otp = None
        self.codigo_otp_expira = None
        self.save(update_fields=['codigo_otp', 'codigo_otp_expira'])

    def __str__(self):
        return self.username


class RegistroAuditoria(models.Model):
    """Guarda cada acción sensible realizada desde el panel."""
    operador = models.ForeignKey(AdminOperador, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=100)
    detalle = models.JSONField(default=dict, blank=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.fecha} - {self.operador} - {self.accion}'