# SocialClub — Frontend (SPA)

Contexto para agentes de IA (Claude Code, Cursor, etc.). Leé esto antes de tocar el repo.
Objetivo: que cualquier sesión de IA, de cualquier integrante, produzca lo mismo y respete el estándar del equipo.

## Qué es
SPA de **SocialClub** (panel de gestión del club). Equipo **Nullpointer**.
Consume la API del repo hermano `socialclub-backend` (`/api/v1`).

## Stack
- **React 19** + **Vite** + **TypeScript** + **Tailwind**. Estado del servidor con **@tanstack/react-query**.
- Formularios con **react-hook-form + zod**. Router con **react-router-dom**. Toasts con **sonner**. Íconos **lucide-react**.
- Tests: **Vitest** + @testing-library/react.

## Arquitectura y convenciones de código
- **Organización por feature**: `src/features/<dominio>/{api,components,hooks,pages,schemas,context,types}` (auth, socios, usuarios, cuotas, eventos, entradas, inscripcion, dashboard…).
- Cliente HTTP único en `src/lib/api/client.ts` (**axios con `withCredentials: true`** para la cookie httpOnly; interceptor normaliza errores a `Error` con mensaje legible).
- Las features **no** llaman a `apiClient` directo: pasan por `features/<x>/api/*.api.ts`.
- Rutas centralizadas en `src/routes/paths.ts` (`ROUTES.xxx`), árbol en `AppRouter.tsx`.
- Rutas protegidas con `ProtectedRoute` (sesión + rol). Navegación en `components/layout/AppLayout.tsx` con visibilidad por rol.
- `VITE_API_URL` es **build-time** (Vite reemplaza `import.meta.env` al compilar → cada entorno se compila con su URL de API).
- Roles: `ADMIN`, `COLABORADOR`, `DELEGADO`, `SOCIO`.

## Idioma (IMPORTANTE)
- **Texto de UI en español** (es el idioma del producto). No traducir labels, botones ni mensajes.
- Identificadores de código en español (estándar actual); estandarización a inglés **en stand-by**.

## Git — flujo y nomenclatura
- Ramas: `feature|fix|bug|issue/<descripcion>` desde **`dev`**. Flujo: `feature/* → dev → test → main`.
- Commits: `feat[US-XX]: <descripción>` (también `fix[...]`, `test[US-XX]`). **Nunca** trailer `Co-Authored-By: Claude` ni atribución de IA.
- Merge a `dev` vía **Pull Request**, enlazado a la tarjeta de la US en GitHub Projects.
- Deploy en **Vercel** (proyectos separados para `test` y `main`, cada uno con su `VITE_API_URL`).

## Definition of Done (del equipo)
Fuente: `socialclub-backend/docs/documentacion/gestion-del-proyecto/03 ... Ciclo de vida ...` §3.9. Terminada cuando:
objetivo cumplido · código commiteado/pusheado · **tests unitarios pasando (cobertura ≥70%)** · **testeada por un integrante externo** (pruebas cruzadas) · testeada junto a otras funcionalidades · **documentación actualizada** · **desplegada en el entorno de pruebas** · validada por el PO en la Sprint Review.

## Testing
- Vitest + @testing-library/react. Cubrir hooks (react-query), componentes de formulario (validación zod) y flujos clave.
- Al implementar una US: sumar tests y cargar los casos en la matriz con el skill **`/casos-prueba`** (tipos: Unitaria, Integral, Funcional, Regresión, Aceptación, No funcional).

## Comandos
```bash
npm run dev            # Vite dev server (http://localhost:5173)
npm test               # Vitest (usar antes de commitear)
npm run typecheck      # tsc -b --noEmit
npm run build          # tsc -b && vite build
npm run lint
```
> Requiere el backend corriendo en `VITE_API_URL` (default `http://localhost:3000/api/v1`).

## Reglas para agentes de IA
- Seguí el flujo y la nomenclatura de arriba. No mergees ni pushees sin que el usuario lo pida.
- Mantené los textos de UI en español; alineá los campos al contrato del backend (revisá `socialclub-backend`).
- Verificá con `npm run typecheck` + `npm test` + `npm run build` antes de dar algo por terminado.
- Skills del equipo en `.claude/skills/`. Documentación del proyecto en `docs/` del repo backend.
