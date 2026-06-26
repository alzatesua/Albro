from django.contrib import admin

from .models import CategoriaServicio, Servicio


@admin.register(CategoriaServicio)
class CategoriaServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    list_filter = ['activo']


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'categoria', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
    list_filter = ['activo', 'categoria']
