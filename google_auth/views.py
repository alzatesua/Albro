import os, requests as req
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Code requerido'}, status=400)

    # Intercambiar code por tokens con Google
    token_response = req.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'redirect_uri': 'postmessage',  # especial para flujo auth-code con popup
        'grant_type': 'authorization_code',
    })

    token_data = token_response.json()
    if 'error' in token_data:
        return Response({'error': 'Code inválido'}, status=400)

    # Obtener info del usuario
    userinfo = req.get('https://www.googleapis.com/oauth2/v3/userinfo', 
        headers={'Authorization': f"Bearer {token_data['access_token']}"}
    ).json()

    email = userinfo.get('email')

    try:
        usuario = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no registrado'}, status=404)

    refresh = RefreshToken.for_user(usuario)
    return Response({
        'usuario': UsuarioSerializer(usuario).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })