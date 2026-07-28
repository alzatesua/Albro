# panel_admin/middleware.py
from django.http import HttpResponseForbidden
from django.conf import settings


class RestringirIPPanelMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/gestion-x9k2/'):
            ip = request.META.get('REMOTE_ADDR')
            if ip not in settings.IPS_PERMITIDAS_PANEL:
                return HttpResponseForbidden('Acceso denegado')
        return self.get_response(request)