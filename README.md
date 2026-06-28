# SocialClub — Frontend

Panel web de gestión del sistema **SocialClub**, desarrollado por el **Equipo
Nullpointer** para Proyecto Final (UTN FRVM, Ingeniería en Sistemas de Información).

> Versión inicial (Sprint 1). El foco de esta entrega **no** es cubrir todos los
> endpoints, sino dejar una **arquitectura escalable y mantenible** (feature-based)
> que el equipo pueda extender de forma incremental sin rediseños.

---

## Stack tecnológico

| Capa             | Tecnología                  | Versión |
| ---------------- | --------------------------- | ------- |
| Librería UI      | React                       | 19.2    |
| Build tool       | Vite                        | 8.1     |
| Lenguaje         | TypeScript                  | 6.0     |
| Estilos          | Tailwind CSS                | 4.3     |
| Routing          | React Router                | 7.18    |
| Estado servidor  | TanStack Query (react-query)| 5.x     |
| Formularios      | React Hook Form + Zod       | —       |
| HTTP             | Axios                       | 1.18    |
| Iconos           | lucide-react                | —       |

---

## Requisitos previos

- **Node.js 22 LTS** y **npm**, o bien **Docker** + **Docker Compose**.
- El **backend** corriendo (ver repositorio `socialclub-backend`).

---

## Puesta en marcha

### Opción A — local (recomendada para desarrollo)

```bash
cp .env.example .env     # ajustá VITE_API_URL si el backend no está en localhost:3000
npm install
npm run dev              # http://localhost:5173
```

### Opción B — con Docker

```bash
cp .env.example .env
docker compose up --build   # http://localhost:5173
```

> El frontend espera que el backend esté accesible en la URL de `VITE_API_URL`.
> Levantá primero el backend (su propio `docker compose up`).

---

## Variables de entorno

| Variable       | Descripción                                       | Default                          |
| -------------- | ------------------------------------------------- | -------------------------------- |
| `VITE_API_URL` | URL base de la API (incluye el prefijo `/api/v1`) | `http://localhost:3000/api/v1`   |

Solo las variables con prefijo `VITE_` se exponen al cliente. Nunca se commitea `.env`.

---

## Scripts disponibles

| Script              | Descripción                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con hot-reload.          |
| `npm run build`     | Type-check + build de producción en `dist/`.    |
| `npm run preview`   | Sirve localmente la build de producción.        |
| `npm run lint`      | ESLint.                                         |
| `npm run lint:fix`  | ESLint con corrección automática.               |
| `npm run format`    | Prettier (incluye orden de clases de Tailwind). |
| `npm run typecheck` | Chequeo de tipos sin emitir.                    |

---

## Arquitectura (feature-based)

La aplicación se organiza por **features** (áreas funcionales) en vez de por tipo de
archivo. Cada feature es autocontenida y agrupa su API, hooks, componentes y páginas.
Esto mantiene el código cohesionado y permite que el proyecto crezca sin volverse
inmanejable (RNF08 — escalabilidad modular).

```
src/
├── main.tsx                 # Punto de entrada
├── App.tsx                  # Monta el router
├── config/
│   └── env.ts               # Acceso tipado a variables de entorno
├── types/
│   └── api.ts               # Tipos compartidos (paginación, errores de API)
├── lib/                     # Infraestructura transversal
│   ├── api/
│   │   ├── client.ts        # Instancia de axios + interceptores
│   │   └── query-client.ts  # Configuración de react-query
│   └── utils/cn.ts          # Helper de clases CSS
├── components/
│   ├── ui/                  # Design system (Button, Input, Card, Spinner)
│   └── layout/AppLayout.tsx # Layout autenticado (sidebar + contenido)
├── providers/
│   └── AppProviders.tsx     # Composición de providers globales
├── routes/
│   ├── AppRouter.tsx        # Árbol de rutas
│   ├── ProtectedRoute.tsx   # Guarda de sesión + roles
│   └── paths.ts             # Rutas centralizadas
└── features/
    ├── auth/                # Login / logout / sesión (US-39, US-40)
    │   ├── api/             #   acceso a la API
    │   ├── components/      #   componentes propios de la feature
    │   ├── context/         #   estado de sesión (Context)
    │   ├── hooks/           #   useAuth
    │   ├── pages/           #   LoginPage
    │   ├── schemas/         #   validación con zod
    │   └── types.ts
    ├── dashboard/           # Página de inicio
    ├── socios/              # EJEMPLO de feature completa (US-15, consulta)
    └── usuarios/            # Placeholder (US-01 a US-03, a implementar)
```

### Patrón de una feature (cómo agregar una nueva)

Tomá `features/socios/` como plantilla. El flujo de datos es:

```
page  →  hook (react-query)  →  api (axios)  →  backend
  ↑            ↓
componentes de presentación
```

1. **`api/<feature>.api.ts`** — funciones que llaman a `apiClient`. Único lugar que
   conoce las rutas del backend.
2. **`hooks/use<Feature>.ts`** — encapsula react-query (`useQuery`/`useMutation`) y las
   _query keys_. Las páginas no tocan el cache directamente.
3. **`components/`** — componentes de presentación, sin lógica de datos.
4. **`pages/`** — orquesta estado de UI + hooks + componentes.
5. **`types.ts`** y, si hay formularios, **`schemas/`** (zod).

### Decisiones de diseño

- **Estado del servidor con react-query**: caché, reintentos y estados de carga/error
  resueltos de forma declarativa, sin reinventar fetching manual.
- **Estado de sesión con Context**: la sesión real vive en una cookie httpOnly del
  backend; el contexto solo guarda los datos del usuario para la UI.
- **Design system mínimo** (`components/ui`): componentes reutilizables y consistentes,
  base para una interfaz simple y accesible (RNF01, RNF02).
- **Rutas protegidas por rol** (`ProtectedRoute`): refleja el control de acceso del
  backend (RNF06).
- **Alias `@/`**: imports absolutos desde `src/` para evitar rutas relativas frágiles.

---

## Credenciales de prueba

Las que crea el seed del backend:

```
email:     admin@socialclub.local
password:  Admin123!
```

---

## Convenciones del equipo

Ramas, formato de commits, Pull Requests, linting y Definition of Done están definidos
en el documento de **Sprint 0**.
