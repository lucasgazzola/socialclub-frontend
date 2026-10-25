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

### A. Títulos de Pantalla (`<h1>`) y Breadcrumbs
Todas las páginas del sistema deben compartir exactamente el mismo encabezado:
* **Breadcrumbs (Migas de pan):** Se renderizan automáticamente desde el layout principal (`AppLayout`) justo **arriba del título `<h1>`** del contenido. 
* **Regla estricta:** **PROHIBIDO colocar botones o flechas redundantes de "Volver"** junto al título o breadcrumb cuando la navegación ya está resuelta estructuralmente.
* **Clase obligatoria del `<h1>`:** `text-2xl font-bold tracking-tight text-slate-900`.
* **Subtítulo / descripción:** `mt-1 text-sm text-slate-500`.
* **Regla estricta de iconos en títulos:** **PROHIBIDO poner iconos gigantes o emojis decorativos al lado del `<h1>`** (por ejemplo, escudos, carnets o candados gigantes antes del texto). El título debe ser tipográfico, limpio y directo.

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

### C. Botones de Acción Principal en Encabezados (CTA de Creación / Alta en Listados)
En todas las pantallas con listados de personas o entidades (**Socios**, **Participantes / Inscripciones**, **Usuarios**, **Disciplinas**, **Eventos**), el botón de acción principal de alta (*"Nuevo socio"*, *"Nueva inscripción"*, *"Nuevo usuario"*, etc.) debe ser **rigurosamente consistente y compartir exactamente el mismo tamaño, jerarquía visual y proporciones en toda la aplicación**.

* **Componente obligatorio:** Usar el componente oficial [`Button`](src/components/ui/Button.tsx) con sus valores estándar:
  * `variant="primary"` (fondo azul institucional `bg-brand-600 hover:bg-brand-700 text-white`).
  * `size="md"` (por defecto en `Button`: altura `h-9`, padding horizontal `px-4 py-2`, tipografía `text-sm font-medium`).
  * Alineación y sombra: `className="self-start shadow-xs sm:self-auto"`.
* **Icono estándar:**
  * Debe incluir un icono representativo de adición (`<Plus size={16} />` o `<UserPlus size={16} />`) con tamaño fijo `size={16}`.
  * La separación texto-icono (`gap-2`) ya la provee el componente `Button` de forma nativa.
* **Acciones de navegación (Enlaces a formularios de página completa):**
  * Si el botón redirige a otra ruta (por ejemplo, *"Nueva inscripción"* hacia `/inscripcion`), **PROHIBIDO** maquetar etiquetas `<a>` o `<Link>` con estilos reducidos ad-hoc (como `text-xs py-1.5 px-3` o `gap-1.5`).
  * Se debe usar `Button` con `onClick={() => navigate(ROUTES.inscripcion)}`, o bien aplicar al enlace exactamente las mismas clases oficiales del botón:
    `inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-brand-700 transition-all select-none self-start sm:self-auto`.
* **Microcopy y Capitalización (Sentence case):**
  * Primera letra en mayúscula y el resto en minúscula: `"Nuevo socio"`, `"Nueva inscripción"`, `"Nuevo usuario"`, `"Nueva disciplina"`, `"Nuevo evento"` (no alternar con mayúsculas arbitrarias como `"Nuevo Socio"`).

```tsx
// ✅ Correcto (mismo tamaño h-9, texto text-sm, icono size={16}):
<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Socios</h1>
    <p className="mt-1 text-sm text-slate-500">Consultá, creá y editá los socios del club.</p>
  </div>
  <Button onClick={() => setModalAbierto(true)} className="self-start shadow-xs sm:self-auto">
    <Plus size={16} />
    Nuevo socio
  </Button>
</header>
```

---

## 3. Barras de Búsqueda, Filtros y Botón de Exportación

### A. Filtros con Selectores (`<Select>`)
Todos los selectores desplegables que actúen como filtro de listado (*"Todas las categorías"*, *"Todas las disciplinas"*, *"Todos los roles"*, *"Todas las acciones"*, etc.) **deben incluir el icono `<Filter />`** a la izquierda.
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
* Delimitar ancho máximo para no estirar excesivamente la barra de búsqueda: `className="w-full sm:max-w-xs"`.

### C. Botón de Exportación de Tablas (`<TableExportMenu>`)
Para descargar reportes o respaldos de listados, se utiliza el componente unificado [`TableExportMenu`](src/components/ui/TableExportMenu.tsx):
* **Ubicación obligatoria:** Debe colocarse **a la izquierda inmediata de los selectores de filtro** (`<Select>`), compartiendo fila con ellos.
* **Diseño y tipografía integrados:** Diseñado para igualar visualmente a un `<Select>`:
  * Altura estándar `h-9.5`.
  * Tipografía regular: `text-sm font-normal text-slate-900` (igualada al texto de los `<Select>`, evitando negritas que desbalanceen la barra).
  * Icono estándar a la izquierda: `<Download size={16} className="text-slate-400 shrink-0" />`.
  * Flecha desplegable a la derecha: `<ChevronDown size={14} className="text-slate-400 shrink-0" />`.
* **Microcopy en español y opciones:**
  * Etiqueta del botón: `"Exportar"`.
  * Opciones del menú dropdown:
    1. **Excel (.xlsx):** Generado con formato binario nativo (soporta fórmulas y celdas limpias).
    2. **CSV (.csv):** Archivo delimitado por comas con encoding UTF-8 BOM para compatibilidad con Excel.
    3. **Imprimir / Guardar PDF:** Abre la vista de impresión o genera el documento PDF estructurado.
* **Obtención de filas completas:** Cuando la tabla esté paginada en servidor, el componente debe recibir `fetchRows` para exportar el universo total filtrado y no solo la página actual en pantalla.

### D. Disposición Espacial de Filtros y Búsqueda (Patrón Oficial US-04)
Para lograr una experiencia de usuario predecible y ordenada en todos los listados de gestión de personas y entidades, los controles de filtrado se distribuyen en un bloque contenedor con separación `space-y-3`:

1. **Nivel superior (Arriba):** Las pestañas segmentadas de estado ([`StatusTabs`](src/components/ui/StatusTabs.tsx): *Todos / Activos / Inactivos* con sus respectivos contadores).
2. **Nivel inferior (Barra horizontal en extremos opuestos `justify-between`):**
   * **A la izquierda (debajo de los tabs):** La barra de búsqueda `<Input leftIcon={<Search />} ... className="w-full sm:max-w-xs" />`.
   * **A la derecha (esquina superior derecha, debajo del botón de alta principal):** Grupo con `TableExportMenu` y a su derecha los `<Select leftIcon={<Filter />} ... className="w-full sm:w-52" />`.

```tsx
// ✅ Maquetación estándar oficial (Patrón US-04 con Exportar):
<div className="space-y-3">
  {/* 1. Filtro de estado arriba de la barra de búsqueda */}
  <div>
    <StatusTabs<FiltroEstado>
      value={filtroEstado}
      onChange={cambiarFiltro}
      tabs={[
        { value: 'todos', label: 'Todos', count: counts.todos },
        { value: 'activos', label: 'Activos', count: counts.activos },
        { value: 'inactivos', label: 'Inactivos', count: counts.inactivos },
      ]}
    />
  </div>

  {/* 2. Barra horizontal: búsqueda a la izquierda y exportar + filtros a la derecha */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="w-full sm:max-w-xs">
      <Input
        id="busqueda"
        placeholder="Buscar por nombre, apellido o DNI..."
        value={textoInput}
        onChange={(e) => setTextoInput(e.target.value)}
        leftIcon={<Search />}
      />
    </div>

    <div className="flex items-center gap-2.5">
      <TableExportMenu<Entidad>
        filename="entidades"
        title="Entidades"
        columns={COLUMNAS_EXPORT}
        fetchRows={fetchTodasLasFilas}
      />

      <Select
        id="filtroSecundario"
        value={filtroSecundario ?? ''}
        onChange={(e) => setFiltroSecundario(e.target.value)}
        leftIcon={<Filter />}
        className="w-full sm:w-52"
      >
        <option value="">Todas las opciones</option>
        ...
      </Select>
    </div>
  </div>
</div>
```

---

## 4. Tablas, Formato de Datos y Paginación

### A. Alineación, Padding y Encabezados Ordenables (`<HeaderOrdenable>`)
* **Padding celda/encabezado unificado:** Todas las celdas `<th>` y `<td>` deben compartir `px-5 py-3.5` para garantizar un ritmo vertical armónico y que el texto no quede desfasado.
* **Alineación de texto en tablas:**
  * La etiqueta `<table>` debe declarar `text-left`.
  * Columnas de texto, nombres, DNI, emails y estados van alineadas a la **izquierda** (`text-left`).
  * Los botones o encabezados de ordenamiento en columnas alineadas a la izquierda deben incluir explícitamente `text-left` para evitar centrado imprevisto del botón flex.
  * Solo los importes monetarios o columnas de totales numéricos van alineados a la derecha (`text-right tabular-nums`).
  * La columna de **Acciones** siempre va alineada a la **derecha** (`text-right`).
* **Ciclo de Ordenamiento Tri-Estado:**
  * Al hacer clic en un encabezado ordenable, el orden debe alternar:
    1. Primer clic: **Ascendente (`asc`)** (flecha arriba).
    2. Segundo clic: **Descendente (`desc`)** (flecha abajo).
    3. Tercer clic: **Neutral / Sin ordenar** (vuelve al estado primario con doble flecha gris).

### B. Formato de Documentos de Identidad (DNI)
* **Regla estricta:** **Todos los números de DNI en cualquier tabla, modal, ficha o exportación deben formatearse con separador de miles con puntos** (ejemplo: `25.123.456`).
* **Función obligatoria:** Usar [`formatearDni`](src/lib/utils/dni.ts):
  ```tsx
  import { formatearDni } from '@/lib/utils/dni';

  // En tablas:
  <td className="px-5 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
    {formatearDni(socio.dni)}
  </td>

  // En descripciones o modales:
  <p>DNI {formatearDni(persona.dni)}</p>
  ```
* **Estilo tipográfico en tablas:** Siempre acompañar con `font-mono text-xs text-slate-600 tabular-nums` para que los dígitos mantengan un ancho constante y alineado verticalmente.

### C. Paginación Unificada (`<TablePagination>`)
* Se utiliza el componente estándar [`TablePagination`](src/components/ui/TablePagination.tsx) al pie de todas las tablas:
  * **A la izquierda:** Selector de filas por página (`10`, `25`, `50`) y leyenda `"Mostrando X a Y de Z resultados"`.
  * **A la derecha:** Botones de navegación numerados y flechas *Anterior / Siguiente*, deshabilitadas en extremos.
  * Se oculta automáticamente si no hay resultados o si la cantidad total es 0.

---

## 5. Botones de Acción en Tablas y Grillas

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

## 6. Vocabulario y Semántica de Estados (Microcopy)

Para evitar que el usuario se confunda entre **cuentas de software** y **vínculos institucionales**, se deben respetar estrictamente estos términos:

| Sección | Entidad del Dominio | Acción Destructiva | Acción Positiva | Justificación de UX |
| :--- | :--- | :--- | :--- | :--- |
| **Usuarios** | `Usuario` (Login / Roles) | **Desactivar** | **Reactivar** | No es una baja del club; es una suspensión informática de acceso. |
| **Socios** | `Membresia` (Cuota social) | **Dar de baja** | *(Re-asociar)* | Es la rescisión de la membresía del club y sus beneficios. |
| **Participantes**| `Inscripcion` (Deporte) | **Dar de baja** | **Reactivar** | Desvincula al atleta de la disciplina deportiva correspondiente. |

---

## 7. Badges de Estado (Status Badges)

* Usar el componente [`Badge`](src/components/ui/Badge.tsx).
* **Sin iconos de adorno:** No incluir iconos de check o alerta dentro del badge si la tabla ya tiene muchas columnas; el color y el texto deben bastar.
* **Paleta:**
  * **Activo / Vigente:** `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20`.
  * **Inactivo / Baja:** `bg-slate-100 text-slate-600 ring-1 ring-slate-500/20`.
  * **Moroso / Vencido:** `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`.

---

## 8. Identidad Visual: Escudo, Sidebar y Favicon

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

## 9. Checklist Obligatorio antes de enviar un Pull Request

Antes de commitear y solicitar revisión de PR hacia `dev`, verificar:
1. [ ] **Compilación limpia:** Ejecutar `npm run build` en `socialclub-frontend` y comprobar que termine con código 0 y sin errores de TypeScript.
2. [ ] **Pruebas en verde:** Ejecutar `npm test` y verificar el 100% de tests unitarios y de integración pasando.
3. [ ] **Consistencia de títulos:** Todos los títulos de página son `text-2xl font-bold tracking-tight text-slate-900` sin iconos decorativos. Breadcrumbs situados arriba sin flechas redundantes de volver.
4. [ ] **Formularios no centrados:** Los formularios no tienen `mx-auto` y están alineados a la izquierda (`max-w-2xl`).
5. [ ] **Filtros con icono:** Los desplegables de filtro usan `<Select leftIcon={<Filter />} ...>`.
6. [ ] **Exportación estándar:** Listados cuentan con `<TableExportMenu>` a la izquierda de los filtros, con tipografía estándar de select (`font-normal`) y opciones Excel, CSV y PDF.
7. [ ] **DNI formateado con puntos:** Todo DNI en tablas y vistas utiliza `formatearDni(...)` (`25.123.456`).
8. [ ] **Paginación uniforme:** Tablas utilizan `<TablePagination>` con selector de items por página.
9. [ ] **Botones de tabla:** Las acciones destructivas en tablas usan `variant="ghost"` con `text-rose-600 hover:bg-rose-50` (sin fondos rojos sólidos en filas).
10. [ ] **Formato de Commit Atómico:** Cumplir sin excepción el formato `<prefijo>[US-XX]: descripción en español` acordado en `AGENTS.md`.
11. [ ] **Consistencia de botones principales:** Los botones de alta en listados ("Nuevo socio", "Nueva inscripción", "Nuevo usuario", etc.) son del mismo tamaño estándar (`Button size="md"`, `h-9`, `text-sm`, icono `size={16}`) sin clases reducidas ad-hoc.
12. [ ] **Disposición de filtros (Patrón US-04):** Filtro de estados (`StatusTabs`) ubicado arriba de la barra de búsqueda, y filtro desplegable junto al menú de exportación a la derecha.
