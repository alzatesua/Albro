# Albro

Plataforma de servicios profesionales con sistema de reservas, subastas y gestión de citas. Desarrollado con Django 6 y Django REST Framework.

##  Características

- **Sistema de Autenticación**: Registro de usuarios, login con JWT (JSON Web Tokens)
- **Gestión de Usuarios**: Roles diferenciados (Admin, Profesional, Cliente)
- **Perfiles de Usuario**: Actualización de perfil y gestión de fotos
- **API REST**: Arquitectura RESTful con Django REST Framework
- **WebSockets**: Soporte para conexiones en tiempo real con Django Channels

##  Tecnologías Utilizadas

- **Python**: 3.12.3
- **Django**: 6.0.6
- **Django REST Framework**: 3.17.1
- **PostgreSQL**: Base de datos (via psycopg2-binary 2.9.12)
- **JWT**: djangorestframework_simplejwt 5.5.1
- **CORS**: django-cors-headers 4.9.0
- **WebSockets**: Django Channels 4.3.2
- **Environment Variables**: python-dotenv 1.2.2

##  Estructura del Proyecto

```
albro/
├── albro/                 # Configuración principal del proyecto
│   ├── settings.py       # Configuración de Django
│   ├── urls.py           # URLs principales
│   ├── asgi.py           # Configuración ASGI (WebSockets)
│   └── wsgi.py           # Configuración WSGI
├── usuarios/             # App de gestión de usuarios 
│   ├── models.py         # Modelo Usuario personalizado
│   ├── views.py          # Vistas de la API
│   ├── serializers.py    # Serializadores REST
│   └── urls.py           # URLs de usuarios
├── profesionales/        # App de perfiles profesionales y estados de atención
├── servicios/            # App de servicios (pendiente)
├── citas/                # App de citas (pendiente)
├── subastas/             # App de subastas (pendiente)
└── cola/                 # App de gestión de colas (pendiente)
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DB_NAME=albro
DB_USER=albro_user
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=tu-secret-key-de-django
DEBUG=True
```

### Base de Datos

El proyecto utiliza PostgreSQL. Asegúrate de tener PostgreSQL instalado y crear la base de datos:

```bash
# Crear base de datos y usuario
sudo -u postgres psql
CREATE DATABASE albro;
CREATE USER albro_user WITH PASSWORD 'Albrojuan01.';
GRANT ALL PRIVILEGES ON DATABASE albro TO albro_user;
\q
```

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd albro
   ```

2. **Crear entorno virtual**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers channels psycopg2-binary python-dotenv
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Ejecutar migraciones**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

7. **Iniciar servidor de desarrollo**
   ```bash
   python manage.py runserver 8006
   ```

El servidor estará disponible en `http://localhost:8006`

## Endpoints de la API

### Autenticación

- `POST /api/usuarios/registro/` - Registro de nuevos usuarios
  ```json
  {
    "email": "usuario@example.com",
    "password": "password123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+57 300 123 4567",
    "rol": "cliente"
  }
  ```

- `POST /api/usuarios/login/` - Inicio de sesión
  ```json
  {
    "email": "usuario@example.com",
    "password": "password123"
  }
  ```

  **Respuesta**:
  ```json
  {
    "usuario": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "cliente"
    },
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```

### Perfil de Usuario

- `GET /api/usuarios/perfil/` - Obtener perfil del usuario autenticado
- `PUT /api/usuarios/perfil/` - Actualizar perfil (requiere autenticación)

  **Respuesta**:
  ```json
  {
    "mensaje": "Perfil actualizado",
    "usuario": {
      "id": 1,
      "email": "usuario@example.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "telefono": "+57 300 123 4567",
      "foto": "/media/usuarios/fotos/avatar.jpg",
      "rol": "cliente",
      "primer_ingreso": false,
      "fecha_registro": "2026-06-26T09:00:00Z"
    }
  }
  ```

- `POST /api/usuarios/primer-ingreso/` - Marcar primer ingreso como completado

### Profesionales

Todos los endpoints de profesionales requieren autenticación JWT:

```
Authorization: Bearer <access_token>
```

- `POST /api/profesionales/registro/` - Crear o actualizar el perfil profesional del usuario autenticado.

  Al registrar el perfil, el usuario pasa a rol `profesional`. El campo `estado_id` es opcional; si no se envía, se asigna automáticamente el estado con código `disponible`.

  ```json
  {
    "direccion": "Calle 10 # 20-30",
    "ubicacion": "Bogotá",
    "latitud": 4.7100,
    "longitud": -700,
    "nombre_local": "Barbería Central",
    "descripcion": "Cortes, barba y cuidado personal",
    "activo": true,
    "horarios_atencion": [
      {
        "dia": "lunes",
        "inicio": "08:00",
        "fin": "17:00"
      }
    ],
    "estado_id": 1
  }
  ```

- `GET /api/profesionales/perfil/` - Obtener el perfil profesional del usuario autenticado.
- `PUT /api/profesionales/perfil/` - Actualizar todo el perfil profesional.
- `PATCH /api/profesionales/perfil/` - Actualizar parcialmente el perfil profesional.

  **Respuesta del perfil**:
  ```json
  {
    "id": 3,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "usuario@example.com",
    "telefono": "+57 300 123 4567",
    "rol": "profesional",
    "direccion": "Calle 10 # 20-30",
    "ubicacion": "Bogotá",
    "latitud": "40",
    "longitud": "-700",
    "nombre_local": "Barbería Central",
    "descripcion": "Cortes, barba y cuidado personal",
    "activo": true,
    "horarios_atencion": [
      {
        "dia": "lunes",
        "inicio": "08:00",
        "fin": "17:00"
      }
    ],
    "estado": {
      "id": 1,
      "codigo": "disponible",
      "nombre": "Disponible",
      "activo": true,
      "fecha_creacion": "2026-06-26T09:00:00Z"
    },
    "fecha_creacion": "2026-06-26T09:00:00Z",
    "fecha_actualizacion": "2026-06-26T09:00:00Z"
  }
  ```

### Estados de Atención

Los estados de atención son un catálogo seleccionable por ID. La migración inicial crea estos estados:

- Disponible
- No disponible
- En almuerzo
- En break

- `GET /api/profesionales/estados/` - Listar estados activos disponibles para seleccionar.

  **Respuesta**:
  ```json
  [
    {
      "id": 1,
      "codigo": "disponible",
      "nombre": "Disponible",
      "activo": true,
      "fecha_creacion": "2026-06-26T09:00:00Z"
    }
  ]
  ```

- `POST /api/profesionales/estados/` - Crear un estado de atención. Solo usuarios `admin` o `is_staff`.

  ```json
  {
    "codigo": "en_reunion",
    "nombre": "En reunión",
    "activo": true
  }
  ```

- `GET /api/profesionales/estado/` - Obtener el estado actual del profesional autenticado.

  **Respuesta**:
  ```json
  {
    "profesional_id": 3,
    "estado": {
      "id": 1,
      "codigo": "disponible",
      "nombre": "Disponible",
      "activo": true,
      "fecha_creacion": "2026-06-26T09:00:00Z"
    }
  }
  ```

- `PATCH /api/profesionales/estado/` - Cambiar el estado del profesional autenticado. Solo usuarios con rol `profesional`.

  ```json
  {
    "estado_id": 2
  }
  ```

  **Respuesta**:
  ```json
  {
    "mensaje": "Estado cambiado a No disponible"
  }
  ```

- `GET /api/profesionales/estado/<profesional_id>/` - Obtener el estado actual de un profesional específico.

  **Respuesta**:
  ```json
  {
    "profesional_id": 3,
    "nombre_local": "Barbería Central",
    "estado": {
      "id": 1,
      "codigo": "disponible",
      "nombre": "Disponible",
      "activo": true,
      "fecha_creacion": "2026-06-26T09:00:00Z"
    }
  }
  ```

##  Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens tienen las siguientes configuraciones:

- **Access Token**: 8 horas de validez
- **Refresh Token**: 30 días de validez
- **Rotación de Refresh Tokens**: Habilitado

Para usar los endpoints protegidos, incluye el token en el header:

```
Authorization: Bearer <access_token>
```

## Roles de Usuario

El sistema soporta tres tipos de usuarios:

1. **Admin**: Acceso total al sistema
2. **Profesional**: Perfil para ofrecer servicios
3. **Cliente**: Perfil para solicitar servicios

##  Estados del Proyecto

###  Completado
- Sistema de autenticación con JWT
- Registro y login de usuarios
- Gestión de perfiles de usuario
- Módulo de profesionales
- Catálogo de estados de atención
- Cambio y consulta de estado actual del profesional
- Modelo de usuario personalizado
- Configuración de Django Channels

###  En Desarrollo
- Módulo de servicios
- Sistema de citas
- Sistema de subastas
- Sistema de gestión de colas

##  Comandos Útiles

```bash
# Ejecutar servidor de desarrollo
python manage.py runserver 8006

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Abrir shell de Django
python manage.py shell

# Ejecutar tests
python manage.py test
```

## Configuración de CORS

El proyecto tiene CORS habilitado para todos los orígenes en desarrollo. Para producción, actualiza la configuración en `albro/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://tudominio.com",
]
```

##  WebSockets (Django Channels)

El proyecto está configurado para usar Django Channels con WebSockets. Actualmente usa una capa en memoria (`InMemoryChannelLayer`). Para producción con Redis:

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('localhost', 6379)],
        },
    }
}
```

## Base de Datos en Producción

Para configurar la base de datos en producción:

1. Actualiza las variables de entorno con tus credenciales de producción
2. Asegúrate de que `DEBUG=False` en producción
3. Configura `ALLOWED_HOSTS` con tu dominio
4. Usa una `SECRET_KEY` segura y única

##  Licencia

Este proyecto es privado y confidencial.

##  Desarrollo

Desarrollado por el equipo de Albro © 2026
# Albro
