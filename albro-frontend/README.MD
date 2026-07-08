# Albro Frontend

Frontend de la aplicación **Albro** — plataforma de profesionales de belleza, desarrollado con React + Vite + Shadcn/ui + Tailwind CSS v4.

---

## Tecnologías

### Core
- [React 19](https://react.dev/) — Biblioteca de interfaces de usuario
- [Vite 8](https://vitejs.dev/) — Bundler y servidor de desarrollo ultrarrápido
- [Tailwind CSS v4](https://tailwindcss.com/) — Estilos utilitarios con plugin nativo de Vite
- [React Router DOM v7](https://reactrouter.com/) — Navegación y rutas protegidas

### UI Components
- [Shadcn/ui](https://ui.shadcn.com/) — Componentes accesibles y personalizables
- [Ant Design](https://ant.design/) — Biblioteca de componentes enterprise
- [Chakra UI](https://chakra-ui.com/) — Sistema de diseño accesible
- [Material UI](https://mui.com/) — Componentes Material Design
- [Lucide React](https://lucide.dev/) — Iconografía moderna y consistente

### Integraciones
- [@react-oauth/google](https://react-oauth.google/) — Autenticación con Google OAuth 2.0
- [Leaflet](https://leafletjs.com/) — Mapas interactivos
- [Animate.css](https://animate.style.com/) — Animaciones CSS listas para usar
- [tw-animate-css](https://www.tailwindcss-animate.com/) — Animaciones optimizadas para Tailwind

### Tipografía
- [Geist Variable](https://vercel.com/font) — Tipografía principal vía `@fontsource-variable/geist`

### Development
- [oxlint](https://oxlint.com/) — Linter JavaScript/TypeScript ultrarrápido

---

## Requisitos previos

- Node.js >= 18
- npm >= 9

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/albro-frontend.git
cd albro-frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (ver sección abajo)
cp .env.example .env  # o crear .env manualmente

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Estructura del proyecto

```
albro-frontend/
├── public/                   # Archivos estáticos
├── src/
│   ├── assets/               # Imágenes y recursos
│   ├── components/
│   │   ├── ui/               # Componentes de Shadcn/ui
│   │   │   ├── alert.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   └── Portal.jsx    # Portal para modales y toasts
│   │   ├── GoogleLoginButton.jsx   # Botón de autenticación Google
│   │   ├── ModalRegistroProfesional.jsx
│   │   ├── CitaAlertaModal.jsx
│   │   └── RutaProtegida.jsx # HOC de rutas privadas
│   ├── context/
│   │   └── AuthContext.jsx   # Estado global de autenticación + localStorage
│   ├── hooks/
│   │   ├── useCitasSocket.js     # Hook para WebSocket de citas en tiempo real
│   │   ├── useHoraServidor.js    # Hook para obtener hora del servidor
│   │   └── usePerfilProfesional.js # Hook para gestión de perfil profesional
│   ├── pages/
│   │   ├── LoginPage.jsx     # Pantalla de login (email/password + Google)
│   │   ├── Registropage.jsx  # Pantalla de registro
│   │   ├── DashboardPage.jsx # Layout principal con dock estilo macOS
│   │   └── dashboard/        # Secciones independientes del dashboard
│   │       ├── MapaSection.jsx
│   │       ├── ServiciosSection.jsx
│   │       ├── SerProfesionalSection.jsx
│   │       ├── PerfilSection.jsx
│   │       ├── AgendaSection.jsx
│   │       ├── ClientesSection.jsx
│   │       ├── ModalBuscarServicio.jsx
│   │       └── Toast.jsx     # Componente de notificaciones
│   ├── services/
│   │   ├── api.js            # Capa de llamadas HTTP al backend Django
│   │   └── authService.js    # Servicios de autenticación
│   ├── lib/                  # Utilidades y helpers
│   │   └── utils.js
│   ├── App.jsx               # Rutas y providers globales
│   ├── main.jsx              # Punto de entrada
│   └── index.css             # Tokens de diseño Tailwind v4 + Shadcn
├── .env                      # Variables de entorno
├── index.html
├── vite.config.js            # Alias @/ + plugin Tailwind v4
└── package.json
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL del backend Django
VITE_API_URL=http://localhost:8006/api

# Google OAuth 2.0 - Autenticación
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com

# Google Geocoding API - Para búsqueda de direcciones
VITE_GOOGLE_GEOCODING_API_KEY=tu-google-api-key
```

### Obtener las credenciales de Google

1. **Google Client ID**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto o selecciona uno existente
   - Habilita la API de Google+ 
   - Configura la pantalla de consentimiento OAuth
   - Crea credenciales OAuth 2.0 para aplicación web
   - Agrega `http://localhost:5173` a orígenes JavaScript autorizados
   - Agrega `http://localhost:5173` a URI de redirección autorizados

2. **Google Geocoding API Key**:
   - En Google Cloud Console, habilita la Geocoding API
   - Crea una clave de API
   - Restringe la clave a la Geocoding API
   - (Opcional) Agregar restricciones de aplicación para HTTP referrer: `http://localhost:5173/*`

---

## Conexión con el Backend

El backend está desarrollado con **Django REST Framework** corriendo en `http://localhost:8006`.

### Autenticación

La autenticación usa **JWT** (SimpleJWT) y **Google OAuth 2.0**. Al hacer login se guardan en `localStorage`:

| Clave | Contenido |
|---|---|
| `access_token` | Token de acceso — se envía en cada petición como `Bearer` |
| `refresh_token` | Token de refresco — para renovar el acceso |
| `usuario` | Objeto JSON con los datos del usuario autenticado |

El archivo `src/services/api.js` adjunta automáticamente el token en todas las peticiones. Para agregar un nuevo endpoint basta con:

```js
export const getEndpoint = () => request("/ruta-del-endpoint/");
```

### WebSockets - Citas en tiempo real

El proyecto implementa comunicación en tiempo real para citas mediante **WebSockets**:

- **Hook personalizado**: `useCitasSocket.js` maneja la conexión WebSocket
- **Ticket system**: El cliente solicita un ticket temporal al backend (`/ws-ticket/`)
- **Reconexión automática**: Si la conexión se cae, se reconecta automáticamente
- **URL WebSocket**: `ws://localhost:8006/ws/citas/?ticket=<ticket>`

**Uso del hook**:

```jsx
import { useCitasSocket } from "@/hooks/useCitasSocket";

function MiComponente() {
  useCitasSocket((tipo, cita) => {
    // tipo: 'creada', 'confirmada', 'cancelada', 'completada'
    // cita: objeto con los datos de la cita
    console.log("Evento:", tipo, cita);
  });

  return <div>Escuchando eventos de citas...</div>;
}
```

### Endpoints disponibles

**Autenticación**:
- `loginUsuario(email, password)` — Login con email/contraseña
- `registrarUsuario(datosUsuario)` — Registro de nuevos usuarios

**Profesionales**:
- `getPerfilProfesional()` — Obtener perfil del profesional autenticado
- `getDepartamentos()` — Lista de departamentos
- `getMunicipios(departamentoId)` — Municipios de un departamento
- `registrarProfesional(datos)` — Registro como profesional
- `actualizarImagenPerfil(archivo)` — Subir foto de perfil
- `actualizarDatosPersonales(datos)` — Actualizar información personal
- `actualizarMisHorarios(horarios)` — Configurar horarios de atención

**Servicios**:
- `getCategorias()` — Lista de categorías de servicios
- `getServiciosPorCategoria(categoriaId)` — Servicios de una categoría
- `getMisServicios()` — Servicios del profesional autenticado
- `eliminarServicio(servicioId)` — Eliminar un servicio
- `getProfesionalesPorServicio(servicioId)` — Profesionales que ofrecen un servicio

**Agendas**:
- `getAgendaProfesional(profesionalId, servicioId, fecha)` — Horarios disponibles de un profesional

**Citas**:
- `crearCita(payload)` — Crear nueva cita
- `getCitas({ estado, page, page_size })` — Listar citas con filtros
- `confirmarCita(citaId)` — Confirmar una cita pendiente
- `completarCita(citaId)` — Marcar cita como completada
- `cancelarCita(citaId)` — Cancelar una cita

**WebSockets**:
- `getWsTicket()` — Obtener ticket para conexión WebSocket

---

## Autenticación y sesión

### Opciones de autenticación

La aplicación soporta dos métodos de autenticación:

1. **Email/Contraseña**:
   - Login tradicional con credenciales
   - Registro de nuevos usuarios
   - Recuperación de contraseña

2. **Google OAuth 2.0**:
   - Botón "Iniciar sesión con Google"
   - Configurado con `@react-oauth/google`
   - Redirección automática después del login

### Gestión de sesión

- Al ingresar, el `AuthContext` guarda la sesión y la recupera al recargar la página
- Las rutas privadas están protegidas con `<RutaProtegida>` — redirigen a `/login` si no hay sesión activa
- El menú del dashboard cambia automáticamente según el **rol** del usuario (`cliente` o `profesional`)

### Rutas públicas y privadas

**Rutas públicas**:
- `/login` — Pantalla de login
- `/registrarme` — Registro de nuevos usuarios

**Rutas privadas** (requieren autenticación):
- `/dashboard` — Dashboard principal
- `/dashboard/*` — Todas las secciones del dashboard

---

## Diseño y UI

El proyecto sigue un sistema de diseño minimalista oscuro/claro con las siguientes decisiones:

- **Paleta**: zinc como color base (fondos, bordes, textos) con blanco/negro como acento principal
- **Tipografía**: Geist Variable — moderna, legible y de alto contraste
- **Modo oscuro**: implementado con la clase `.dark` en el `<html>`, persistido en `localStorage`
- **Dock estilo macOS**: barra de navegación flotante con efecto magnético al pasar el cursor

### Bibliotecas de componentes instaladas

**Shadcn/ui** (componentes base):
- `button`, `input`, `label`, `card`, `alert`, `portal`

**Ant Design** (componentes enterprise):
- Tablas, formularios, modales avanzados
- Sistema de grid y layouts

**Chakra UI** (componentes accesibles):
- Componentes con accesibilidad incorporada
- Sistema de temas consistentes

**Material UI** (componentes Material Design):
- Componentes siguiendo las guías de Material Design
- Iconos y elementos de navegación

### Animaciones

**Librerías instaladas**:
- [Animate.css](https://animate.style/) — Animaciones CSS predefinidas (fade, slide, bounce, etc.)
- [tw-animate-css](https://www.tailwindcss-animate.com/) — Animaciones optimizadas para Tailwind

**Uso**:
```jsx
// Con Animate.css
<div className="animate__animated animate__fadeInUp">
  Contenido animado
</div>

// Con Tailwind v4 + tw-animate-css
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  Contenido animado
</div>
```

### Mapas

**Leaflet** — Integración para mapas interactivos:
- Mapa de profesionales en `MapaSection.jsx`
- Marcadores personalizados
- Geolocalización de usuarios

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build de producción |
| `npm run lint` | Ejecuta el linter (oxlint) |

---

## Hooks personalizados

El proyecto incluye hooks personalizados para funcionalidades específicas:

### `useCitasSocket`

Hook personalizado para gestionar la conexión WebSocket de citas en tiempo real.

**Características**:
- Conexión automática con ticket system
- Reconexión automática si se pierde la conexión
- Limpieza de recursos al desmontar el componente
- Callback para eventos de citas

**Uso**:
```jsx
import { useCitasSocket } from "@/hooks/useCitasSocket";

function CitasListener() {
  useCitasSocket((tipo, cita) => {
    switch (tipo) {
      case "creada":
        toast.info(`Nueva cita: ${cita.id}`);
        break;
      case "confirmada":
        toast.success(`Cita ${cita.id} confirmada`);
        break;
      case "cancelada":
        toast.error(`Cita ${cita.id} cancelada`);
        break;
      case "completada":
        toast.success(`Cita ${cita.id} completada`);
        break;
    }
  });

  return null; // Solo escucha eventos
}
```

### `useHoraServidor`

Hook para obtener y mantener sincronizada la hora del servidor.

**Uso**:
```jsx
import { useHoraServidor } from "@/hooks/useHoraServidor";

function Reloj() {
  const horaServidor = useHoraServidor();
  
  return <div>Hora del servidor: {horaServidor?.toLocaleString()}</div>;
}
```

### `usePerfilProfesional`

Hook para gestionar el perfil del profesional autenticado.

**Características**:
- Carga automática del perfil
- Cache de datos
- Funciones para actualizar perfil
- Manejo de estados de carga/error

**Uso**:
```jsx
import { usePerfilProfesional } from "@/hooks/usePerfilProfesional";

function Perfil() {
  const { perfil, loading, actualizarPerfil } = usePerfilProfesional();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>{perfil.nombre}</h1>
      <button onClick={() => actualizarPerfil({ nombre: "Nuevo nombre" })}>
        Actualizar
      </button>
    </div>
  );
}
```

---

## Agregar componentes Shadcn

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add badge
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
```

Ver todos los componentes disponibles en [ui.shadcn.com/docs](https://ui.shadcn.com/docs)

---

## Flujo de trabajo con WebSockets

El sistema de WebSockets permite actualizaciones en tiempo real de las citas:

### Backend → Frontend

1. **Cliente inicia conexión**:
   ```js
   const { ticket } = await getWsTicket();
   const socket = new WebSocket(`ws://localhost:8006/ws/citas/?ticket=${ticket}`);
   ```

2. **Backend envía eventos** cuando una cita cambia:
   ```json
   {
     "tipo": "creada",
     "cita": {
       "id": 123,
       "estado": "pendiente",
       "cliente": {...},
       "profesional": {...},
       "servicio": {...},
       "fecha_hora": "2026-07-08T10:00:00"
     }
   }
   ```

3. **Frontend recibe y actualiza**:
   ```jsx
   socket.onmessage = (event) => {
     const { tipo, cita } = JSON.parse(event.data);
     onMensaje(tipo, cita);
   };
   ```

### Tipos de eventos WebSocket

- `creada` — Nueva cita agendada
- `confirmada` — Cita confirmada por el profesional
- `cancelada` — Cita cancelada por cliente o profesional
- `completada` — Cita marcada como completada

### Ejemplo de integración en un componente

```jsx
import { useCitasSocket } from "@/hooks/useCitasSocket";
import { useState } from "react";

function ListaCitas() {
  const [citas, setCitas] = useState([]);

  // Escuchar eventos de citas en tiempo real
  useCitasSocket((tipo, cita) => {
    switch (tipo) {
      case "creada":
        setCitas(prev => [...prev, cita]);
        break;
      case "confirmada":
        setCitas(prev => prev.map(c => c.id === cita.id ? cita : c));
        break;
      case "cancelada":
        setCitas(prev => prev.filter(c => c.id !== cita.id));
        break;
    }
  });

  return (
    <div>
      {citas.map(cita => (
        <CitaCard key={cita.id} cita={cita} />
      ))}
    </div>
  );
}
```

---

## Configuración de Vite

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

---

---

## Troubleshooting

### Error de conexión WebSocket

Si ves errores de conexión WebSocket:

1. **Verificar que el backend está corriendo**:
   ```bash
   # En otra terminal, navega al backend
   cd /ruta/al-backend
   python manage.py runserver 8006
   ```

2. **Verificar variables de entorno**:
   ```bash
   # Debe apuntar al backend correcto
   cat .env | grep VITE_API_URL
   # Debe mostrar: VITE_API_URL=http://localhost:8006/api
   ```

3. **Reiniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

### Error de Google OAuth

Si el botón de Google no funciona:

1. **Verificar el Google Client ID**:
   ```bash
   cat .env | grep VITE_GOOGLE_CLIENT_ID
   ```

2. **Verificar orígenes autorizados en Google Cloud Console**:
   - Debe incluir `http://localhost:5173`
   - Debe incluir el URI de redirección

3. **Limpiar localStorage y recargar**:
   ```javascript
   // En la consola del navegador
   localStorage.clear();
   location.reload();
   ```

### Error de geocoding

Si la búsqueda de direcciones no funciona:

1. **Verificar la API Key**:
   ```bash
   cat .env | grep VITE_GOOGLE_GEOCODING_API_KEY
   ```

2. **Verificar que la Geocoding API esté habilitada** en Google Cloud Console

3. **Verificar restricciones de la API Key**:
   - No debe tener restricciones de IP
   - Puede tener restricciones de HTTP referrer: `http://localhost:5173/*`

---

## Desarrollo

### Estructura de componentes

**Componentes reutilizables** (`src/components/`):
- `GoogleLoginButton.jsx` — Botón de autenticación con Google
- `ModalRegistroProfesional.jsx` — Modal para registro de profesionales
- `CitaAlertaModal.jsx` — Modal de alertas de citas
- `RutaProtegida.jsx` — HOC para proteger rutas

**Componentes UI** (`src/components/ui/`):
- Basados en Shadcn/ui
- Personalizados con Tailwind v4
- Accesibles y responsive

### Patrón de servicios

Los servicios están divididos en:

1. **`api.js`** — Endpoints HTTP del backend:
   - Todas las llamadas al backend Django
   - Manejo automático de tokens JWT
   - Manejo de errores 401 (redirección a login)

2. **`authService.js`** — Servicios específicos de autenticación:
   - Login con Google
   - Manejo de tokens OAuth
   - Refresh tokens

### Convenciones de código

**Nombres de archivos**:
- Componentes: `PascalCase.jsx` (ej: `LoginPage.jsx`)
- Hooks: `camelCase.js` con prefijo `use` (ej: `useCitasSocket.js`)
- Servicios: `camelCase.js` (ej: `api.js`, `authService.js`)

**Nombres de carpetas**:
- Páginas: `camelCase` (ej: `pages/`, `dashboard/`)
- Componentes: `camelCase` (ej: `components/`, `services/`, `hooks/`)

**Orden de imports**:
```jsx
// 1. React y dependencias externas
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 2. Componentes internos (alias @/)
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// 3. Servicios y hooks
import { useCitasSocket } from "@/hooks/useCitasSocket";
import { getCitas } from "@/services/api";

// 4. Estilos y assets
import "./MiComponente.css";
```

### Debugging

**Verificar conexión WebSocket**:
```javascript
// En la consola del navegador
// Deberías ver mensajes de conexión
console.log("WebSocket estado:", ws.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

**Verificar localStorage**:
```javascript
// En la consola del navegador
console.log("Token:", localStorage.getItem("access_token"));
console.log("Usuario:", localStorage.getItem("usuario"));
```

**Verificar peticiones HTTP**:
```javascript
// En la pestaña Network de DevTools
// Filtrar por "ws-ticket" para ver tickets WebSocket
// Filtrar por "api" para ver llamadas al backend
```

---

## Licencia

MIT