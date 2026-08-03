# Albro

Plataforma integral para conectar clientes con profesionales, facilitar reservas de citas, gestionar servicios, mensajes en tiempo real y operar procesos de pago y membresías desde una sola solución.

## Visión general

Albro combina un backend en Django con un frontend en React/Vite para ofrecer una experiencia completa para:

- clientes que buscan y reservan servicios,
- profesionales que gestionan su perfil, agenda, servicios y portafolio,
- administradores que supervisan pagos, membresías y operaciones de la plataforma.

## Funcionalidades principales

### 1. Autenticación y gestión de usuarios

- Registro y login de usuarios con JWT.
- Soporte para autenticación con Google.
- Roles diferenciados: admin, profesional y cliente.
- Perfil de usuario editable con foto, teléfono y estado de primer ingreso.
- Gestión de trial gratuito para cuentas profesionales.

### 2. Perfiles profesionales

- Registro y actualización del perfil profesional.
- Información de negocio: dirección, ubicación, nombre del local y descripción.
- Estados de atención y horarios configurables.
- Ubicación geográfica con coordenadas y búsqueda por ubicación.
- Portafolio de imágenes del trabajo realizado.
- Código QR para el perfil profesional.
- Preferencias de notificación por correo.
- Activación/desactivación del perfil profesional.

### 3. Catálogo de servicios

- Categorías de servicios.
- Servicios configurables por categoría.
- Asociación de servicios con profesionales.
- Precios y duración por servicio ofrecido.
- Vista de profesionales por servicio y catálogo público del profesional.

### 4. Sistema de citas

- Agendamiento de citas entre clientes y profesionales.
- Gestión de estados: pendiente, confirmada, cancelada y completada.
- Cancelación, confirmación, completación y reagendamiento de citas.
- Validación de disponibilidad para evitar conflictos de horario.
- Integración con WebSockets para actualización en tiempo real.
- Calificación posterior a la cita.

### 5. Mensajería y notificaciones

- Conversaciones entre cliente y profesional.
- Envío de mensajes de texto, imágenes y audio.
- Marcado de mensajes como leídos.
- Notificaciones en tiempo real por WebSockets.
- Notificaciones internas y correos automáticos para eventos importantes.

### 6. Pagos, membresías y facturación

- Gestión de membresías con planes mensual y anual.
- Registro de pagos manuales con comprobante.
- Confirmación de pagos desde el panel administrativo.
- Generación de facturas y archivos PDF.
- Control de pagos pendientes, exitosos, fallidos y reembolsados.

### 7. Panel administrativo

- Acceso protegido con token OTP y control por IP.
- Visualización de pagos pendientes y por estado.
- Confirmación de pagos desde un flujo dedicado.
- Operaciones administrativas centralizadas para la plataforma.

### 8. Frontend moderno

- Aplicación frontend en React + Vite.
- UI con Chakra UI, MUI, Ant Design y componentes modernos.
- Integración con Leaflet para mapas y ubicaciones.
- Soporte para Google OAuth y experiencia de usuario adaptada para clientes y profesionales.

## Tecnologías utilizadas

### Backend

- Python 3.12+
- Django 6.0.6
- Django REST Framework 3.17.1
- Django Channels 4.3.2
- Simple JWT
- PostgreSQL
- Redis
- Celery
- Django CORS Headers
- Pillow, psycopg2-binary, python-dotenv

### Frontend

- React 19
- Vite
- Chakra UI
- MUI
- Ant Design
- Leaflet
- Recharts

## Estructura del proyecto

```text
albro/
├── albro/                 # Configuración principal de Django
├── usuarios/              # Usuarios, autenticación y perfiles base
├── profesionales/         # Perfiles profesionales, estados, horarios y portafolio
├── servicios/             # Categorías, servicios y membresías
├── citas/                 # Gestión de citas y WebSockets
├── mensajeria/            # Conversaciones y mensajes en tiempo real
├── notificaciones/        # Notificaciones internas y correos
├── panel_admin/           # Panel administrativo y flujo de pagos
├── configuraciones/       # Switches y configuraciones del sistema
├── google_auth/           # Integración con Google OAuth
├── albro-frontend/        # Frontend React/Vite
└── media/                 # Archivos subidos por usuarios
```

## Requisitos previos

- Python 3.12+
- PostgreSQL
- Redis
- Node.js y npm para el frontend

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con valores como estos:

```env
DB_NAME=albro
DB_USER=albro_user
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=tu-secret-key
DEBUG=True
REDIS_HOST=127.0.0.1
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu_usuario
EMAIL_HOST_PASSWORD=tu_password
DEFAULT_FROM_EMAIL=Albro <no-reply@albro.com>
FRONTEND_URL=http://localhost:5173
GOOGLE_GEOCODING_API_KEY=tu_api_key
PANEL_ADMIN_SECRET_KEY=tu_secret_panel
IPS_PERMITIDAS_PANEL=127.0.0.1,localhost
```

## Instalación local

1. Clonar el repositorio

```bash
git clone <repo-url>
cd albro
```

2. Crear y activar un entorno virtual

```bash
python3 -m venv venv
source venv/bin/activate
```

3. Instalar dependencias del backend

```bash
pip install -r requirements.txt
```

4. Instalar dependencias del frontend

```bash
cd albro-frontend
npm install
cd ..
```

5. Crear la base de datos en PostgreSQL y aplicar migraciones

```bash
python manage.py migrate
```

6. Crear un superusuario

```bash
python manage.py createsuperuser
```

## Ejecución del proyecto

### Backend

```bash
python manage.py runserver 8006
```

### Frontend

```bash
cd albro-frontend
npm run dev
```

### Servicios auxiliares

Para funcionalidades de mensajería, notificaciones y tareas programadas, se recomienda tener Redis y Celery activos:

```bash
redis-server
celery -A albro worker -l info
```

## Endpoints principales de la API

### Autenticación

- POST `/api/usuarios/registro/`
- POST `/api/usuarios/login/`
- GET `/api/usuarios/perfil/`
- PUT `/api/usuarios/perfil/`
- POST `/api/usuarios/primer-ingreso/`

### Profesionales

- POST `/api/profesionales/registro/`
- GET/PUT/PATCH `/api/profesionales/perfil/`
- GET `/api/profesionales/buscar/`
- GET `/api/profesionales/ubicaciones/`
- GET `/api/profesionales/<id>/agenda/`
- POST `/api/profesionales/portafolio/`
- GET `/api/profesionales/mi-qr/`

### Servicios

- GET `/api/servicios/categorias/`
- GET `/api/servicios/servicios/`
- GET `/api/servicios/profesionales/`
- GET `/api/servicios/mis-servicios/`
- POST `/api/servicios/membresia/pagar/`

### Citas

- GET/POST `/api/citas/`
- GET/PUT/PATCH/DELETE `/api/citas/<id>/`
- POST `/api/citas/<id>/cancel/`
- POST `/api/citas/<id>/confirmar/`
- POST `/api/citas/<id>/completar/`
- POST `/api/citas/<id>/reagendar/`

### Mensajería

- GET/POST `/api/conversaciones/`
- GET `/api/conversaciones/<id>/mensajes/`
- POST `/api/conversaciones/<id>/marcar_leido/`

### Panel administrativo

- POST `/gestion-x9k2/solicitar-codigo/`
- POST `/gestion-x9k2/verificar-codigo/`
- POST `/gestion-x9k2/confirmar-pago/`
- GET `/gestion-x9k2/pagos-pendientes/`

## Notas importantes

- El proyecto está preparado para correr con WebSockets y Redis en modo desarrollo.
- Algunas funciones de pago y notificaciones dependen de servicios externos como correo SMTP y Redis.
- El frontend y el backend pueden ejecutarse en paralelo en puertos diferentes para desarrollo local.

## Estado del proyecto

El aplicativo incluye un conjunto robusto de módulos para:

- búsqueda y reserva de servicios,
- gestión de negocios profesionales,
- comunicación directa,
- pagos y membresías,
- administración operativa de la plataforma.

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

# cargar departamentos y municipios
python manage.py cargar_ubicaciones

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
