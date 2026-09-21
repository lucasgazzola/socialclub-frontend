# Guía de Estándares UI/UX y Convenciones de Frontend
**Equipo NullPointer — Proyecto SocialClub (UTN FRVM - 2026)**

Este documento establece las directrices obligatorias de diseño, maquetación, componentes y experiencia de usuario (UI/UX) para todo el equipo de desarrollo. 

El objetivo es **mantener una interfaz consistente, profesional, sobria y accesible**, evitando decisiones dispares, desorden visual o soluciones improvisadas.

---

## 1. Uso Obligatorio de la Skill `ui-ux-pro-max` (Para asistentes de IA)

> ⚠️ **REGLA PARA ASISTENTES DE IA (Antigravity, Claude, Cursor, etc.):**  
> Antes de generar, editar o refactorizar cualquier pantalla o componente de frontend, el asistente **DEBE aplicar sin excepción los criterios y heurísticas de la skill `ui-ux-pro-max` y `ui-styling`**, aun cuando el desarrollador no lo aclare explícitamente en el prompt.

### 📦 Repositorio Oficial e Instalación:
La skill proviene del repositorio oficial de código abierto:
👉 **[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)**

Para que todos los integrantes del equipo la tengan instalada y funcionando en su entorno local (Antigravity, Cursor, Claude Code), ejecutar en la raíz del proyecto:

```bash
# Clonar la skill en la carpeta de skills de agentes:
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git .agents/skills/ui-ux-pro-max
```

> **Requisito:** Tener instalado **Python 3** en el sistema (`python --version`) para que los scripts locales de búsqueda de paletas, estilos y componentes funcionen correctamente.

### Criterios clave de la skill a respetar:
* **Jerarquía visual estricta:** Títulos, subtítulos, campos y acciones deben tener tamaños y contrastes proporcionales.
* **Accesibilidad WCAG AA:** Todo texto debe cumplir un ratio de contraste mínimo de **4.5:1** contra su fondo.
* **Escala de espaciado uniforme:** Múltiplos de 4px / 8px (`space-y-3`, `space-y-6`, `gap-2.5`, `gap-3`, `p-4`).
* **Sencillez y foco:** Sin animaciones distractoras ni elementos decorativos innecesarios.

---

## 2. Anatomía y Estructura de Páginas

### A. Títulos de Pantalla (`<h1>`)
Todas las páginas del sistema deben compartir exactamente el mismo encabezado:
* **Clase obligatoria:** `text-2xl font-bold tracking-tight text-slate-900`.
* **Subtítulo / descripción:** `mt-1 text-sm text-slate-500`.
* **Regla estricta:** **PROHIBIDO poner iconos gigantes o emojis decorativos al lado del `<h1>`** (por ejemplo, escudos, carnets o candados gigantes antes del texto). El título debe ser tipográfico, limpio y directo.

```tsx
// ✅ Correcto:
<header>
  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuarios administrativos</h1>
  <p className="mt-1 text-sm text-slate-500">Creá y editá usuarios de gestión.</p>
</header>

// ❌ Incorrecto:
<h1 className="text-3xl font-extrabold flex items-center gap-3">
  <ShieldCheck size={32} /> Usuarios
</h1>
```

### B. Alineación de Formularios
* **Regla estricta:** **NUNCA usar `mx-auto`** para centrar formularios en el medio de una pantalla vacía.
* Los formularios de alta y edición de página completa deben comenzar alineados a la **izquierda** de la grilla principal, delimitados con un ancho máximo cómodo para lectura y carga de datos:
  ```tsx
  // ✅ Correcto:
  <div className="max-w-2xl space-y-6">
    ...
  </div>
  ```

---

## 3. Barras de Búsqueda y Filtros

### A. Filtros con Selectores (`<Select>`)
Todos los selectores desplegables que actúen como filtro de listado (*"Todas las categorías"*, *"Todas las disciplinas"*, *"Todas las acciones"*, etc.) **deben incluir el icono `<Filter />`** a la izquierda.
* El componente oficial [`Select`](src/components/ui/Select.tsx) tiene soporte nativo mediante la prop `leftIcon`:

```tsx
import { Filter } from 'lucide-react';
import { Select } from '@/components/ui';

// ✅ Uso estándar de filtro:
<Select
  id="filtroCategoria"
  value={categoriaId ?? ''}
  onChange={(e) => setCategoriaId(e.target.value)}
  leftIcon={<Filter />}
  className="w-full sm:w-52"
>
  <option value="">Todas las categorías</option>
  {categorias.map((c) => (
    <option key={c.id} value={c.id}>{c.nombre}</option>
  ))}
</Select>
```

### B. Buscadores de Texto (`<Input>`)
* Deben usar el componente oficial [`Input`](src/components/ui/Input.tsx) con la prop `leftIcon={<Search />}`.
* Placeholder descriptivo en minúsculas: `"Buscar por nombre, apellido o DNI..."`.

### C. Espaciado con Tabs de Estado
* Si la página cuenta con pestañas de estado ([`StatusTabs`](src/components/ui/StatusTabs.tsx): *Todos / Activos / Inactivos*), la separación vertical con la barra de búsqueda debe ser compacta:
  ```tsx
  <div className="space-y-3">
    <StatusTabs ... />
    <div className="flex flex-col sm:flex-row gap-3">...</div>
  </div>
  ```

---

## 4. Botones de Acción en Tablas y Grillas

### A. La Regla Anti-Fatiga Visual (*"No pintar la tabla de rojo"*)
* **PROHIBIDO colocar botones rojos sólidos (`bg-red-600 text-white`) en cada fila de una tabla.**
* Si hay 20 filas con botones rojos sólidos, la interfaz produce alarma constante y desvía la atención.
* **Directriz:** Todas las acciones en filas de tablas o grillas deben usar **`variant="ghost" size="sm"`** con texto sutil e icono compacto (`size={14}`, `gap-1.5`).

### B. Colores Semánticos en Filas:
* **Editar / Ver (Neutro):** `variant="ghost"` (texto gris `text-slate-600 hover:bg-slate-100 hover:text-slate-900`).
* **Dar de baja / Desactivar (Peligro):** `variant="ghost"` con clase `text-rose-600 hover:bg-rose-50 hover:text-rose-700`.
* **Reactivar / Habilitar (Constructivo):** `variant="ghost"` con clase `text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700`.

### C. Dónde sí va el color sólido: En el Modal de Confirmación
El botón sólido con relleno rojo (`variant="danger"`) queda **reservado exclusivamente para el botón dentro del Modal o Diálogo de confirmación**:

```tsx
// 1. En la fila de la tabla (Sutil):
<Button
  variant="ghost"
  size="sm"
  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
  onClick={() => solicitarBaja(socio.id)}
>
  <UserMinus size={14} />
  Dar de baja
</Button>

// 2. En el Modal emergente (Alta intención / Sólido):
<ConfirmDialog
  open={confirmando}
  variant="danger"
  title="Dar de baja socio"
  confirmLabel="Confirmar baja" // Este botón SÍ es sólido rojo
  ...
/>
```

---

## 5. Vocabulario y Semántica de Estados (Microcopy)

Para evitar que el usuario se confunda entre **cuentas de software** y **vínculos institucionales**, se deben respetar estrictamente estos términos:

| Sección | Entidad del Dominio | Acción Destructiva | Acción Positiva | Justificación de UX |
| :--- | :--- | :--- | :--- | :--- |
| **Usuarios** | `Usuario` (Login / Roles) | **Desactivar** | **Reactivar** | No es una baja del club; es una suspensión informática de acceso. |
| **Socios** | `Membresia` (Cuota social) | **Dar de baja** | *(Re-asociar)* | Es la rescisión de la membresía del club y sus beneficios. |
| **Participantes**| `Inscripcion` (Deporte) | **Dar de baja** | **Reactivar** | Desvincula al atleta de la disciplina deportiva correspondiente. |

---

## 6. Badges de Estado (Status Badges)

* Usar el componente [`Badge`](src/components/ui/Badge.tsx).
* **Sin iconos de adorno:** No incluir iconos de check o alerta dentro del badge si la tabla ya tiene muchas columnas; el color y el texto deben bastar.
* **Paleta:**
  * **Activo / Vigente:** `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20`.
  * **Inactivo / Baja:** `bg-slate-100 text-slate-600 ring-1 ring-slate-500/20`.
  * **Moroso / Vencido:** `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`.

---

## 7. Identidad Visual: Escudo, Sidebar y Favicon

### A. Escudo del Club en el Sidebar ([`ClubLogo`](src/components/ui/ClubLogo.tsx))
* El asset oficial es **`src/assets/Logo SocialClub 2.png`** (el escudo puro en alta resolución sin texto inferior).
* **Tamaños oficiales:**
  * Menú lateral expandido: **`size={38}`**
  * Menú lateral colapsado: **`size={34}`**
* Esto garantiza que no choque contra los bordes de la cabecera `h-16` y conviva en equilibrio con los textos *"SocialClub / Panel de gestión"*.

### B. Favicon Oficial de la Pestaña
* El archivo favicon oficial es **`src/assets/favicon.png`** (cuadrado 1:1, `512 x 512 px`, fondo transparente, centrado).
* También está disponible en versión SVG en `src/assets/favicosocialclub.svg`.
* Vinculado en `index.html` con soporte multirresolución:
  ```html
  <link rel="icon" type="image/png" href="/src/assets/favicon.png" />
  <link rel="icon" type="image/svg+xml" href="/src/assets/favicosocialclub.svg" />
  <link rel="apple-touch-icon" href="/favicon.png" />
  ```

---

## 8. Checklist Obligatorio antes de enviar un Pull Request

Antes de commitear y solicitar revisión de PR hacia `dev`, verificar:
1. [ ] **Compilación limpia:** Ejecutar `npm run build` en `socialclub-frontend` y comprobar que termine con código 0 y sin errores de TypeScript.
2. [ ] **Pruebas en verde:** Ejecutar `npm test` y verificar el 100% de tests unitarios y de integración pasando.
3. [ ] **Consistencia de títulos:** Todos los títulos de página son `text-2xl font-bold tracking-tight text-slate-900` sin iconos decorativos.
4. [ ] **Formularios no centrados:** Los formularios no tienen `mx-auto` y están alineados a la izquierda (`max-w-2xl`).
5. [ ] **Filtros con icono:** Los desplegables de filtro usan `<Select leftIcon={<Filter />} ...>`.
6. [ ] **Botones de tabla:** Las acciones destructivas en tablas usan `variant="ghost"` con `text-rose-600 hover:bg-rose-50` (sin fondos rojos sólidos en filas).
7. [ ] **Formato de Commit Atómico:** Cumplir sin excepción el formato `<prefijo>[US-XX]: descripción en español` acordado en `AGENTS.md`.
