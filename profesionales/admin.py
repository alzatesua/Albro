from django.contrib import admin

from .models import EstadoAtencion, PerfilProfesional


@admin.register(EstadoAtencion)
class EstadoAtencionAdmin(admin.ModelAdmin):
    list_display = ['id', 'codigo', 'nombre', 'activo']
    search_fields = ['codigo', 'nombre']
    list_filter = ['activo']


@admin.register(PerfilProfesional)
class PerfilProfesionalAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'nombre_local', 'ubicacion', 'estado', 'activo']
    search_fields = [
        'usuario__nombre',
        'usuario__apellido',
        'usuario__email',
        'nombre_local',
        'direccion',
        'ubicacion',
    ]
    list_filter = ['activo', 'estado']
