# Albro Frontend

Frontend de la aplicación **Albro** — plataforma de profesionales de belleza, desarrollado con React + Vite + Shadcn/ui + Tailwind CSS v4.

---

## Tecnologías

- [React 19](https://react.dev/) — Biblioteca de interfaces de usuario
- [Vite](https://vitejs.dev/) — Bundler y servidor de desarrollo ultrarrápido
- [Tailwind CSS v4](https://tailwindcss.com/) — Estilos utilitarios con plugin nativo de Vite
- [Shadcn/ui](https://ui.shadcn.com/) — Componentes accesibles y personalizables
- [Lucide React](https://lucide.dev/) — Iconografía moderna y consistente
- [React Router DOM v6](https://reactrouter.com/) — Navegación y rutas protegidas
- [Geist Variable](https://vercel.com/font) — Tipografía principal vía `@fontsource-variable/geist`

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
│   │   │   └── label.jsx
│   │   └── RutaProtegida.jsx # HOC de rutas privadas
│   ├── context/
│   │   └── AuthContext.jsx   # Estado global de autenticación + localStorage
│   ├── pages/
│   │   ├── LoginPage.jsx     # Pantalla de login
│   │   ├── DashboardPage.jsx # Layout principal con dock estilo macOS
│   │   └── dashboard/        # Secciones independientes del dashboard
│   │       ├── MapaSection.jsx
│   │       ├── ServiciosSection.jsx
│   │       ├── SerProfesionalSection.jsx
│   │       ├── PerfilSection.jsx
│   │       ├── AgendaSection.jsx
│   │       └── ClientesSection.jsx
│   ├── services/
│   │   └── api.js            # Capa de llamadas HTTP al backend Django
│   ├── lib/                  # Utilidades y helpers
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
VITE_API_URL=http://localhost:8006/api
```

---

## Conexión con el Backend

El backend está desarrollado con **Django REST Framework** corriendo en `http://localhost:8006`.

La autenticación usa **JWT** (SimpleJWT). Al hacer login se guardan en `localStorage`:

| Clave | Contenido |
|---|---|
| `access_token` | Token de acceso — se envía en cada petición como `Bearer` |
| `refresh_token` | Token de refresco — para renovar el acceso |
| `usuario` | Objeto JSON con los datos del usuario autenticado |

El archivo `src/services/api.js` adjunta automáticamente el token en todas las peticiones. Para agregar un nuevo endpoint basta con:

```js
export const getProfesionales = () => request("/profesionales/");
```

---

## Autenticación y sesión

- Al ingresar, el `AuthContext` guarda la sesión y la recupera al recargar la página.
- Las rutas privadas están protegidas con `<RutaProtegida>` — redirigen a `/login` si no hay sesión activa.
- El menú del dashboard cambia automáticamente según el **rol** del usuario (`cliente` o `profesional`).

---

## Diseño y UI

El proyecto sigue un sistema de diseño minimalista oscuro/claro con las siguientes decisiones:

- **Paleta**: zinc como color base (fondos, bordes, textos) con blanco/negro como acento principal
- **Tipografía**: Geist Variable — moderna, legible y de alto contraste
- **Modo oscuro**: implementado con la clase `.dark` en el `<html>`, persistido en `localStorage`
- **Dock estilo macOS**: barra de navegación flotante con efecto magnético al pasar el cursor
- **Componentes Shadcn instalados**: `button`, `input`, `label`, `card`, `alert`

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build de producción |
| `npm run lint` | Ejecuta el linter |

---

## Agregar componentes Shadcn

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add badge
```

Ver todos los componentes en [ui.shadcn.com/docs](https://ui.shadcn.com/docs)

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

## Licencia

MIT