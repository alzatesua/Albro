from django.contrib import admin
from .models import Cita

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cliente',
        'profesional',
        'servicio',
        'categoria',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'estado',
        'modo',
    )
    list_filter = ('estado', 'fecha', 'modo')
    search_fields = ('cliente__email', 'profesional__usuario__email')
