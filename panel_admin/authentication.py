# panel_admin/authentication.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import AdminOperador

ALGORITHM = 'HS256'


def generar_token(operador):
    payload = {
        'operador_id': operador.id,
        'tipo': 'panel_admin',  
        'exp': datetime.utcnow() + timedelta(minutes=30),  # sesión corta
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, settings.PANEL_ADMIN_SECRET_KEY, algorithm=ALGORITHM)


class PanelAdminAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.PANEL_ADMIN_SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Sesión expirada')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        if payload.get('tipo') != 'panel_admin':
            raise AuthenticationFailed('Token no autorizado para este panel')

        try:
            operador = AdminOperador.objects.get(id=payload['operador_id'], activo=True)
        except AdminOperador.DoesNotExist:
            raise AuthenticationFailed('Operador no encontrado o inactivo')

        return (operador, token)