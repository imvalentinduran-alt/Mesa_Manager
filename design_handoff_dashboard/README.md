# Handoff — UPEL Mesa Manager · Dashboard completo

> **Para Claude Code.** Paquete de diseño de **toda la aplicación**. Léelo completo
> antes de tocar código.
>
> 📋 **Trabaja siguiendo `CHECKLIST.md`** — es la lista de verificación obligatoria,
> fase por fase. No marques una pantalla como hecha hasta que se vea **idéntica** a su
> captura en `screenshots/`. Si el HTML de `designs/` lo tiene, el React lo tiene.

---

## 0. Qué es esto y qué NO es

Los archivos en `designs/*.html` son **referencias de diseño** hechas en HTML/CSS/JS
plano. Son prototipos funcionales que muestran **el aspecto y el comportamiento
deseados** — **NO** son código para copiar y pegar tal cual.

Tu tarea es **recrear / actualizar estos diseños en el codebase real** respetando su
stack y convenciones ya existentes:

- **Stack:** React 19 · Vite · Tailwind CSS v4 · Tauri v2
- **Modo oscuro:** clase `.dark` en `<html>` (vía `ThemeContext`)
- **Tipografía del proyecto:** `font-display` / `font-body` (Inter)
- **Estructura:** `src/features/<feature>/components/<Vista>.jsx` + `src/shared/…`

> ⚠️ Los prototipos usan variables CSS propias (`--card`, `--brand-l`, `--pill`…),
> **Sora** como fuente y **Lucide vía CDN**. **No traigas nada de eso al codebase.**
> Traduce a los tokens Tailwind y a los componentes compartidos existentes (§3).

**Fidelidad: ALTA (hi-fi).** Colores, espaciado, tipografía e interacciones son
definitivos. Recréalos con fidelidad usando el sistema de tokens del proyecto.

---

## 1. Mapa de pantallas (toda la app)

| Diseño (`designs/`)         | Componente en el codebase                              | Trabajo requerido |
|-----------------------------|--------------------------------------------------------|-------------------|
| `Dashboard.html`            | `features/dashboard/…/DashboardView.jsx`               | **Igualar a captura `00`** + globales (§2) |
| `Estudiantes.html`          | `features/estudiantes/…/EstudiantesView.jsx` (alta)    | **Igualar a captura `09`** + globales (§2) |
| `RegistrosEstudiantes.html` | Registros de estudiantes (tabla + modales)             | **Igualar a captura `07/08`** (§4.4) |
| `Profesores.html`           | `features/profesores/…/ProfesoresView.jsx` (alta)      | **Igualar a captura `10`** + globales (§2) |
| `RegistrosProfesores.html`  | Registros de profesores (tabla + modales)              | **Igualar a captura `13`** + globales (§2) |
| `Aulas.html`                | `features/aulas/…/AulasView.jsx`                        | **Igualar a captura `11`** + globales (§2) |
| `Usuarios.html`             | `features/usuarios/…/GestionUsuarios.jsx`              | **Igualar a captura `12`** + globales (§2) |
| `Historial.html`            | `features/historial/…/HistorialView.jsx`               | **Igualar a captura `14`** + globales (§2) |
| `Programar.html`            | `features/mesas/…/ProgramarView.jsx`                   | **Igualar a captura `01`** (§4.1) |
| `Visualizar.html`           | `features/mesas/…/VisualizarView.jsx`                  | **Igualar a captura `02/03`** (§4.2) |
| `Monitoreo.html`            | `features/monitoreo/…/MonitoreoView.jsx`               | **Igualar a captura `04/05/06`** (§4.3) |

> **Ajusta las rutas** a las reales de tu repo si difieren.

**⚠️ TODAS las pantallas deben quedar IDÉNTICAS a su captura en `screenshots/`.**
El objetivo de esta entrega es que el dashboard adopte por completo la estética de los
prototipos de `designs/` — **no basta con que “funcione”, tiene que VERSE igual.**

1. **Cambios globales (§2)** — logo, campana, badge de maestría. Aplican a todas las
   pantallas (probablemente ya estén hechos; verifícalos).
2. **Estética por pantalla** — para CADA una de las 11 pantallas, abre su HTML en
   `designs/` y su captura en `screenshots/`, y ajusta el componente React hasta que
   coincida: colores, espaciado, tipografía, tamaños, badges, tarjetas, tablas, chips,
   sombras, radios, hover. Si tu implementación actual difiere de la captura (aunque
   “ya exista” y funcione), **cámbiala para que iguale al prototipo.** Las 4 vistas de
   §4 además tienen lógica/estructura nueva; las otras 7 son principalmente estética.

> Las pantallas Dashboard, Estudiantes, Profesores, Registros de Profesores, Aulas,
> Usuarios e Historial **YA existen y funcionan**, pero su aspecto actual NO
> necesariamente coincide con estos prototipos. Tu trabajo en ellas es **estético**:
> alinear el look al de la captura, sin romper su funcionalidad ni su conexión a datos.

---

## 2. Cambios globales (afectan TODAS las pantallas)

### 2.1 Logo UPEL en el Sidebar (reemplaza la "M")
- Antes: cuadro azul con la letra **"M"**. Ahora: **logo institucional UPEL**, sin recuadro.
- Dos archivos en `assets/`: `upel-white.png` (silueta blanca) y `upel-blue.png` (azul, con detalle).
- Comportamiento: **blanco en modo oscuro**, **azul oscuro en modo claro**.
- Implementación recomendada en React:
  ```jsx
  // En el header del Sidebar, donde antes estaba el cuadro con "M":
  <span className="grid h-10 w-10 place-items-center shrink-0">
    <img src={upelWhite} alt="UPEL" className="max-h-full max-w-full object-contain hidden dark:block" />
    <img src={upelBlue}  alt="UPEL" className="max-h-full max-w-full object-contain block dark:hidden" />
  </span>
  ```
  (importa los PNG como assets de Vite, o usa SVG equivalentes si los tienes). El texto al
  lado (“UPEL · SIP / Mesa Manager”) se conserva. Al colapsar el sidebar, el logo queda centrado.

### 2.2 Quitar las notificaciones (campana)
- Eliminar por completo el botón de campana del **Topbar** (el `icon-btn` con el ícono
  `bell` y su `bell-dot`). No queda placeholder. En el Topbar solo quedan el toggle de
  tema y el bloque de perfil.

### 2.3 Badge de maestría condicional al rol
- El subtítulo del breadcrumb (donde se muestra “Maestría: …”) **solo aparece para el rol
  `Coordinador`** (con su maestría asignada). La **Jefa NO ve** ese badge — en su lugar
  muestra `Vista general`.
- Lógica: consultar la maestría solo si `session.rol === 'Coordinador' && session.maestria_id`.
  Ningún otro rol renderiza ese texto.

---

## 3. Sistema de diseño — traducción de tokens (prototipo → Tailwind)

Los prototipos usan variables CSS. Mapéalas así (no inventes colores nuevos):

| Variable prototipo            | Token Tailwind del proyecto              | Uso |
|-------------------------------|------------------------------------------|-----|
| `--bg`                        | `bg-background`                          | fondo de página |
| `--card`                      | `bg-card`                                | tarjetas, modales |
| `--field`, `--card-hov`       | `bg-secondary` (o `/60`)                 | inputs, hover, chips |
| `--border`, `--border-2`      | `border-border`                          | bordes |
| `--text`                      | `text-foreground`                        | texto principal |
| `--dim`, `--mute`             | `text-muted-foreground`                  | texto secundario |
| `--brand`, `--brand-l`        | `text-primary` / `bg-primary`            | azul UPEL |
| `--pill`, `--grad`            | `bg-gradient-pill` / `bg-gradient-brand` | CTA, header navy |
| `--upel-navy`                 | `bg-upel-navy`                           | header del calendario mensual |
| `--gold` / `#caa33a`          | `upel-gold`                              | resaltado “Tu Mesa” |
| `--shadow`                    | `shadow-card` / `shadow-pill`            | sombras |

**Estados de mesa** — usa el mapa que ya existe en el codebase (NO los hex del prototipo):
```js
const ESTADO_CLS = {
  Programada:       'bg-blue-50    text-blue-700    border-blue-200',
  En_Curso:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  Aprobada:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  Con_Correcciones: 'bg-amber-50   text-amber-700   border-amber-200',
  Reprobada:        'bg-red-50     text-red-600     border-red-200',
  Suspendida:       'bg-secondary  text-muted-foreground border-border',
}
```

**Patrones reutilizables** (úsalos en vez de recrear estilos):
```
Input:   h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm
         text-foreground placeholder:text-muted-foreground/50 outline-none
         focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15
CTA:     rounded-full bg-gradient-pill px-6 py-2.5 text-sm font-medium text-white
         shadow-pill transition-transform active:scale-[0.99] disabled:opacity-60
Card:    rounded-2xl border border-border bg-card shadow-card
Label:   text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]
Skeleton:animate-pulse h-N rounded bg-secondary
Modal:   overlay bg-black/55 backdrop-blur-sm; panel rounded-3xl border bg-card shadow,
         entra con opacity 0 + translateY(12px) scale .94 → 1
```

**Componentes compartidos a reutilizar (NO reimplementar):** `SearchableSelect`,
`Modal`, `ThemeToggle`, íconos de `@/shared/components/icons` (o `lucide-react`),
`Sidebar`, `Topbar`, badges/pills de estado.

**Permisos por rol:** los prototipos fijan `const ROL='Jefa'` para mostrar todas las
acciones. En el codebase, **lee el rol real** con `getSession().rol`
(`Jefa` | `Coordinador` | `Consultor`) y aplica las reglas de cada vista (§4).

---

## 4. Detalle de las vistas rediseñadas

### 4.1 `ProgramarView.jsx`  ←  `Programar.html`
Formulario de **1 columna `max-w-3xl`**, 3 secciones:

1. **Estudiante** — `SearchableSelect` que lista **solo estudiantes elegibles** (sin mesa
   activa **y** con ≥1 pago/solvencia verificada). Al elegir aparecen dos paneles
   **read-only**: “Título del proyecto” y “Comité Evaluador” (Tutor + Jurado 1 + Jurado 2
   principales) heredados del expediente, con candado visual. Sin elegibles → banner ámbar.
2. **Sala y horario** — `SearchableSelect` de aulas con badge “Con equipos / Sin equipos”.
   **Fecha** (`min` = hoy; muestra día de semana; **bloquea y alerta si es sábado/domingo**).
   **Hora inicio** (rango **08:00–13:00**). Hint en vivo de hora fin: **Mesa 1/2 = +40 min**,
   **Mesa 3 = +60 min**; error si una mesa tipo 3 superaría la 13:00.
3. **Pie + submit** — resumen inline en vivo; botón deshabilitado hasta validar. Al enviar
   simula POST; **colisión de aula** → caja de error + toast. En éxito, el formulario se
   reemplaza por tarjeta de confirmación (Día / Horario / Aula / Tipo) + “Programar otra”.

Tipo de mesa = `min(mesas_completadas + 1, 3)`; duración 60 min si tipo 3, si no 40.

### 4.2 `VisualizarView.jsx`  ←  `Visualizar.html`
Toggle **Tabla** / **Calendario semanal**.
- **Filtros:** buscador (estudiante/título/tutor) + dropdowns Tutor, Aula, Estudiante,
  Estado + rango Desde/Hasta (solo Tabla; botón Aplicar / Limpiar). **Stats** por estado.
- **Tabla (8 cols):** tipo (badge 1/2/3), Estudiante (+“Tu Mesa” si cédula = sesión),
  Tutor, Aula, Fecha, Horario, Estado, Acciones en hover (según estado y rol:
  Suspender / Veredicto / Validar). Fila dorada si el usuario participa.
- **Calendario semanal:** 5 columnas Lun–Vie, cards con tira de color, navegación de semana.
- **Modales:** Detalle, **Veredicto** (3 radios coloreados + días de corrección con preview
  de fecha límite), confirmación de **Suspender**; acción **Validar correcciones** (directa).

### 4.3 `MonitoreoView.jsx`  ←  `Monitoreo.html`
Tabs: **Calendario** | **Panel Operativo** (la vista **Día** se entra desde el Calendario).
- **Calendario mensual:** header `bg-upel-navy` con ‹ › + “Hoy”, grid Lun–Dom, pill de
  conteo por día (`bg-gradient-pill`), hoy con ring dorado. Click → Vista Día.
- **Vista Día:** botón “‹ Calendario”, fecha larga, **timeline** de cards por hora,
  **poll cada 30 s** con countdown visible + botón Actualizar; skeletons en carga;
  Suspender si Programada + Jefa; estado vacío si no hay mesas.
- **Panel Operativo (Kanban):** columnas **En Curso** / **Programada** / **Concluida**.
  Card: código `DEF-2026-NNN`, badge de estado, **minutos transcurridos** o **alerta de
  sobretiempo** pulsante, borde-izquierdo de color, aula + horario, **dots de asistencia
  n/4**. **Poll 30 s**; recalcula minutos cada 60 s. Click → modal Detalle.
- **Filtros** colapsables (Estudiante, Profesor + rol Tutor/Jurado, Aula, Ubicación).
> **Limpia los intervalos** (`clearInterval`) al desmontar y al cambiar de tab/vista.

### 4.4 Registros de Estudiantes  ←  `RegistrosEstudiantes.html`
Tabla de **8 columnas**: Identificación (badge V / C.C. / Pasaporte + número mono),
Nombre Completo, Correo, Cohorte, Maestría, **Solvencia** (Solvente / Pendiente + nº mesa),
**Estado** (Asignado / Disponible), Acciones.
- **Toolbar:** buscador (nombre/cédula) + filtro de maestría + contador + **Exportar Excel**
  (spinner, banner de éxito, deshabilitado sin resultados).
- **Skeletons** en carga + **estado vacío** diferenciado (`colspan=8`).
- **4 modales:** **Editar** (formato de documento por tipo), **Comité** (Principales +
  Suplentes), **Solvencia** (tabs Mesa 1/2/3 — detalle del pago verificado **o** formulario
  de registro con validación: fecha, recibo, recibo de caja, monto > 0), **Eliminar**
  (confirmación; **solo rol Jefa**).

---

## 5. Estado y datos

- **Sesión:** `getSession()` → `{ rol, nombre, cedula, maestria_id, tipo_consultor }`.
  Deriva `esJefa`, `esConsultor`, `miCedula` de aquí (reemplaza el `const ROL='Jefa'`).
- **Fetching:** usa `apiFetch(path)` de `@/shared/lib/api` (token + `ApiError(status, detail)`).
  Endpoints sugeridos (ajusta a los reales):
  - Programar: `GET /api/estudiantes/?elegibles=1`, `GET /api/aulas/`, `POST /api/mesas/`
  - Visualizar: `GET /api/mesas/` (+filtros), `PATCH /api/mesas/{id}/`
  - Monitoreo: `GET /api/monitoreo/` (o `?fecha=`), polling 30 s
  - Registros est.: `GET/PUT/DELETE /api/estudiantes/…`, `POST /api/pagos/`, `GET …/export/`
  > Los prototipos simulan estas llamadas con `setTimeout`.
- **Animaciones:** patrón `modalIn` para modales/toasts; respeta `prefers-reduced-motion`.

---

## 6. Orden de trabajo sugerido

1. Abre cada `designs/*.html` en el navegador para ver el comportamiento real.
2. Aplica los **cambios globales (§2)** en `Sidebar` y `Topbar`; verifícalos en todas las
   pantallas (usa las capturas de `screenshots/` como referencia del estado final).
3. Migra las 4 vistas rediseñadas (§4): Programar → Visualizar → Monitoreo → Registros Est.
   Reutiliza `SearchableSelect`, `Modal` y los tokens de §3. No traigas variables CSS ni Sora.
4. Sustituye los datos simulados por `apiFetch` real y conecta el **rol de sesión**.
5. Revisa: modo oscuro/claro, `clearInterval` al desmontar, estados vacíos y de error,
   y que las pantallas no rediseñadas sigan consistentes con el sistema.

---

## 7. Contenido del paquete

```
design_handoff_dashboard/
  README.md                      ← este documento
  designs/                       ← 11 referencias HTML (todas las pantallas)
    Dashboard.html  Estudiantes.html  RegistrosEstudiantes.html
    Profesores.html  RegistrosProfesores.html  Aulas.html
    Usuarios.html  Historial.html
    Programar.html  Visualizar.html  Monitoreo.html
  assets/
    upel-white.png               ← logo UPEL blanco (modo oscuro)
    upel-blue.png                ← logo UPEL azul (modo claro)
  screenshots/                   ← captura de cada vista (modo oscuro, rol Jefa)
    00-Dashboard.png
    01-Programar.png
    02-Visualizar-tabla.png  02-Visualizar-tabla-rows.png  03-Visualizar-calendario.png
    04-Monitoreo-calendario.png  05-Monitoreo-panel.png  06-Monitoreo-dia.png
    07-RegistrosEstudiantes.png  08-RegistrosEstudiantes-modal-solvencia.png
    09-Estudiantes.png  10-Profesores.png  11-Aulas.png
    12-Usuarios.png  13-RegistrosProfesores.png  14-Historial.png
```

## 8. Índice de capturas

| Archivo | Vista | ¿Rediseño? |
|---------|-------|------------|
| `00-Dashboard.png` | Dashboard (badge “Vista general”) | Global |
| `01-Programar.png` | ProgramarView — formulario 3 secciones | **Sí** |
| `02-Visualizar-tabla.png` | VisualizarView — filtros + stats | **Sí** |
| `02-Visualizar-tabla-rows.png` | VisualizarView — tabla 8 cols | **Sí** |
| `03-Visualizar-calendario.png` | VisualizarView — calendario semanal | **Sí** |
| `04-Monitoreo-calendario.png` | MonitoreoView — calendario mensual | **Sí** |
| `05-Monitoreo-panel.png` | MonitoreoView — Panel Operativo (kanban) | **Sí** |
| `06-Monitoreo-dia.png` | MonitoreoView — agenda diaria con polling | **Sí** |
| `07-RegistrosEstudiantes.png` | Registros Estudiantes — tabla + toolbar | **Sí** |
| `08-RegistrosEstudiantes-modal-solvencia.png` | Modal Solvencia (tabs) | **Sí** |
| `09-Estudiantes.png` | Alta de estudiante (formulario) | Global |
| `10-Profesores.png` | Alta de profesor | Global |
| `11-Aulas.png` | Gestión de aulas | Global |
| `12-Usuarios.png` | Gestión de usuarios | Global |
| `13-RegistrosProfesores.png` | Registros de profesores | Global |
| `14-Historial.png` | Historial | Global |
