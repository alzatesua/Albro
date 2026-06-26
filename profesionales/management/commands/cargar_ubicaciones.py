import httpx
from django.core.management.base import BaseCommand
from profesionales.models import Departamento, Municipio


class Command(BaseCommand):
    help = 'Carga departamentos y municipios de Colombia desde api-colombia.com'

    def handle(self, *args, **kwargs):
        self.stdout.write('Cargando departamentos...')

        response = httpx.get('https://api-colombia.com/api/v1/Department', timeout=10)
        departamentos = response.json()

        for dep in departamentos:
            obj, _ = Departamento.objects.update_or_create(
                codigo=str(dep['id']),
                defaults={'nombre': dep['name']},
            )

            # Cargar municipios de ese departamento
            res_mun = httpx.get(
                f"https://api-colombia.com/api/v1/Department/{dep['id']}/cities",
                timeout=10,
            )
            municipios = res_mun.json()

            for mun in municipios:
                Municipio.objects.update_or_create(
                    nombre=mun['name'],
                    departamento=obj,
                )

            self.stdout.write(f"  ✓ {obj.nombre} ({len(municipios)} municipios)")

        self.stdout.write(self.style.SUCCESS('¡Listo! Ubicaciones cargadas.'))