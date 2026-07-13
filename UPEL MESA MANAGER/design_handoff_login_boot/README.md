# Handoff: Login + Pantalla de Carga (UPEL Mesa Manager)

## Resumen
Rediseño visual del **login** y de la **pantalla de carga** (boot/splash) de UPEL Mesa Manager.
El sistema visual se llama informalmente "Clustr": tipografía **Sora**, paleta **navy `#1E466B` + azul claro `#67BAF4`**, modo oscuro protagonista (con modo claro), y micro-animaciones con vida.

La pantalla de carga estrena una **animación de ensamblaje**: el logo UPEL se arma con sus 9 barras volando desde abajo, rotando y convergiendo al centro, seguido de un destello azul y la aparición del texto.

> **La funcionalidad NO cambia.** Esto es solo un reskin visual. Toda la lógica de auth, validación de cédula, RBAC, sesión interrumpida, y el sondeo de `check_api_health` se mantienen exactamente igual.

---

## Sobre los archivos de este paquete
Los archivos en `prototipo/` son **referencias de diseño hechas en HTML/React-Babel** (componentes en scope global vía `window.X`, CSS plano). **No son código de producción para copiar tal cual.**

Tu trabajo (Claude Code) es **recrear estos diseños dentro del entorno real del proyecto**: **React + Vite + Tauri + Tailwind CSS v4 + lucide-react**, respetando sus patrones existentes (módulos ES, `import` con alias `@/`, clases Tailwind, assets en `/public` o `@recursos`).

### Fidelidad: ALTA (hi-fi)
Son mockups pixel-perfect con colores, tipografía, espaciado e interacciones finales. Recréalos con fidelidad usando Tailwind. Los valores exactos están en la sección **Design Tokens**.

---

## Archivos del proyecto a modificar

| Archivo real | Acción |
|---|---|
| `src/features/auth/components/LoginPage.jsx` | **Reemplazar el JSX/markup** (conservar TODA la lógica: ver abajo) |
| `src/App.jsx` → función `PantallaCarga` | **Reemplazar por el nuevo componente de boot animado** |
| `src/index.css` | **Añadir** la fuente Sora, los `@keyframes` y utilidades nuevas |
| `tailwind.config` / theme | **Añadir** tokens de color (`accent`, etc.) si se desean como clases |
| `public/` | Asegurar que el logo SVG/PNG esté disponible (ver **Assets**) |

---

## ⚠️ Lógica que DEBES conservar intacta

### `LoginPage.jsx` — NO tocar:
- Imports: `import { login, loginConsultor } from '@/features/auth'` y `import { clearSession } from '@/shared/lib/session'`.
- El prop `onSuccess(session)`.
- `formatCedula(value, max)` — el formateador de cédula venezolana/colombiana.
- **Flujo de 3 vistas**: `role` → `admin` | `student`, con `switchView`, `direction` (forward/backward) y `transitioning`.
- **`handleAdminSubmit`**: valida 7–8 dígitos; tras `login(digits, contrasena)` verifica `session.rol === 'Jefa' || 'Coordinador'`, si no → `clearSession()` + error de acceso denegado (RBAC). Maneja `err.status` vs error de conexión.
- **`handleConsultorSubmit`**: valida 7–10 dígitos; `loginConsultor(digits)`; maneja `err.status === 404` (no encontrado), otros status, y error de conexión.
- **Banner de "sesión interrumpida"**: el `useEffect` que lee `sessionStorage.getItem('upel_session_interrupted')` y lo muestra/limpia. (Re-estilízalo con la paleta nueva, pero mantén la lógica.)
- Atributos de inputs: `inputMode="numeric"`, `autoComplete`, `disabled={loading}`, `required`.

### `App.jsx` / `PantallaCarga` — NO tocar:
- Recibe el prop **`intento`** (número 0–90, `MAX_INTENTOS = 90`).
- La barra de progreso se calcula con `Math.min((intento / MAX_INTENTOS) * 100, 95)`.
- Sigue siendo un componente puramente presentacional; `App` controla el estado con `esperarAPI`.
- `PantallaError` y el resto de `App` se mantienen igual (puedes re-estilizar `PantallaError` con la paleta nueva opcionalmente).

---

## Pantalla 1 — LOGIN

### Estructura general
- **Pantalla completa**, fondo `--bg`, centrada, padding 26px.
- **Tarjeta** central: `max-width: 1100px`, `height: min(700px, 100%)`, `border-radius: 26px`, fondo `--panel`, borde `--card-line`, sombra `0 50px 140px -50px rgba(0,0,0,.65)`. `display:flex`, `overflow:hidden`.
- **Dos paneles**:
  - **Izquierdo (panel de marca)** — 45% de ancho, oculto en móvil (`lg:` y arriba). Margen interno 14px, `border-radius:18px`. Fondo navy oscuro `#04070D` con un **aura radial animada** (azul claro → navy) + textura de ruido (`feTurbulence`) en `mix-blend-mode: overlay` + 3 orbes desenfocados que flotan (`mm-orb a/b/c`).
  - **Derecho (formulario)** — `flex:1`, centra el formulario (`max-width: 368px`).

### Panel de marca (izquierda) — contenido
- **Arriba**: logo UPEL (34×34) + kicker `UPEL — SIP` (10px, uppercase, tracking .22em, opacidad 72%) + nombre `Mesa Manager` (14px, bold).
- **Abajo**: titular grande (33px, bold, `letter-spacing:-.02em`, line-height 1.18): **"Gestiona, programa y consulta defensas de maestría en un solo lugar."** + subtítulo (13.5px, weight 300, opacidad 66%) + línea de certificación con icono escudo: **"Conexión cifrada · Ambiente oficial UPEL"**.

### Panel de formulario (derecha) — 3 vistas

**Vista `role` (selección de acceso):**
- Título centrado (23px bold): **"Bienvenido de nuevo"** + subtítulo: **"Selecciona tu tipo de acceso para continuar."**
- 2 tarjetas `.mm-role` (16px padding, radius 14px, fondo `--field`, borde `--field-line`):
  - **Acceso Administrativo** · "Coordinador / Jefe de Programa" · icono `landmark`
  - **Consulta Estudiantil / Profesor** · "Acceso a tu agenda y notificaciones" · icono `grad` (birrete)
  - Cada una: icono en cuadro 40×40 (radius 11, color `--accent`, fondo `--accent-soft`), título 13.5px bold, subtítulo 11.5px, flecha → a la derecha.
  - **Hover**: `border-color:--accent`, `translateY(-2px)`, sombra `0 18px 40px -22px var(--cta-glow)`, la flecha se desplaza 4px y se vuelve accent.

**Vista `admin`:**
- Botón "volver" (`← Cambiar tipo de acceso`, 12px) arriba.
- Título "Acceso Administrativo" + subtítulo "Ingresa tus credenciales institucionales para continuar."
- Campo **Cédula** (icono `idCard` a la izquierda, placeholder `V-12.345.678`, máx 8 dígitos).
- Campo **Contraseña** (icono `lock`, toggle ojo `eye`/`eyeOff` a la derecha, placeholder `••••••••`).
- Bloque de error `.mm-err` cuando aplica.
- Botón CTA "Ingresar →" (50px alto, fondo `--cta-bg`, texto `--cta-ink`).

**Vista `student`:**
- Botón "volver" arriba.
- Título "Consulta Estudiantil / Profesor" + subtítulo "Ingresa tu cédula para acceder a tu agenda de defensas asignadas."
- Solo campo **Cédula** (placeholder `V-1.234.567 ó C.C. 1094567890`, máx 10 dígitos). Sin contraseña.
- Botón CTA "Ingresar →".

### Inputs (`.mm-input`)
- Alto 48px, radius 12px, borde `--field-line`, fondo `--field`, padding `0 42px` (espacio para iconos).
- **Focus**: `border-color:--accent` + `box-shadow: 0 0 0 4px var(--accent-soft)`.
- **Error**: `border-color:--err`.

### Botón CTA (`.mm-btn`)
- Alto 50px, radius 12px, fondo `--cta-bg`, texto `--cta-ink`, weight 700, 13.5px.
- **Hover**: `translateY(-1px)` + sombra glow + `brightness(1.06)`.
- **Estado loading**: spinner circular (`.mm-spin`). **Estado success** (opcional): icono check + "Acceso verificado".
- **Disabled**: opacidad .4.

---

## Pantalla 2 — PANTALLA DE CARGA (Boot)

### Concepto
El logo UPEL se compone de **9 barras verticales** (extraídas como subtrazos del SVG, en `logo-paths.js` → `window.UPEL_BARS`). En el arranque:
1. **0–1.5s**: cada barra aparece dispersa en la parte inferior, desde un punto horizontal aleatorio (`--sx`), una altura aleatoria (`--sy` ≈ 150–300px abajo) y una rotación (`--rot` ±42°), y vuela hacia su posición final rotando hasta enderezarse. Easing con rebote: `cubic-bezier(.18,.86,.26,1.13)`.
2. **~2.1s**: **destello azul** radial (`.mm-boot-flash`) cuando las barras se unen en el centro.
3. **~2.5s**: aparece el texto **"MESA MANAGER"** letra por letra (cada una `translateY` + blur→nítido, escalonadas 0.05s).
4. Luego el kicker "Universidad Pedagógica Experimental Libertador" (3s) y el estado "Iniciando servicio" con punto pulsante (3.3s).

> El origen de rotación de cada barra debe ser el **centro real de su path** (`getBBox()`), calculado en `useLayoutEffect` — ver `boot.jsx`. Esto hace que la rotación se vea natural.

### Conexión con la lógica real
- En el prototipo el boot se va solo por temporizadores (`t1`/`t2`). **En la app real**, el componente debe recibir el prop `intento` (o un `done`) y desmontarse cuando `App` pase de `apiEstado === 'cargando'` a `'ok'`. Mantén el ensamblaje como animación de entrada; el progreso `intento/90` puede mostrarse de forma sutil (texto pequeño) o sustituir el "Iniciando servicio".
- **Importante**: el ensamblaje dura ~2.5s; el servicio puede tardar más o menos. Si tarda más, la animación queda en su estado final (logo armado) mostrando "Iniciando servicio…". Si responde antes, deja terminar el ensamblaje antes de hacer fade-out (o haz fade-out inmediato — a tu criterio, pero lo elegante es no cortar el ensamblaje).

### Las 9 barras (`logo-paths.js`)
- Es un array `window.UPEL_BARS` de 9 strings de path SVG en coordenadas absolutas, dibujados dentro de un viewBox `8 67 195 146`.
- Cada `<svg class="mm-bar">` usa ese mismo viewBox y dibuja **un** path; el efecto de "barras separadas" viene de animar cada SVG por separado con sus variables `--sx/--sy/--rot`.
- En tu entorno (módulos ES), conviértelo a `export const UPEL_BARS = [...]` y haz `import { UPEL_BARS } from '...'` en lugar de leer de `window`.

---

## Interacciones & Comportamiento
- **Transición entre vistas del login**: al cambiar role↔admin↔student, la vista saliente hace `opacity:0` + `translateX(∓16px)` (190ms) y la entrante anima desde `translateX(14px)` (`mmViewIn`, 400ms). Dirección depende de `viewOrder`.
- **Entrada inicial**: elementos con `.mm-rise` (sube 18px + fade, 650ms) y `.mm-fade` (fade 800ms), escalonados con `animation-delay`.
- **Hover de role cards y CTA**: descritos arriba.
- **Modo oscuro/claro**: el contenedor raíz lleva `data-mode="dark"|"light"`. En la app real, conéctalo a tu `ThemeToggle`/clase `.dark` existente (el proyecto ya usa `@custom-variant dark`). El panel de marca del login se mantiene navy oscuro en ambos modos.
- **Red de seguridad anti-"pantalla en blanco"**: el prototipo limpia animaciones por timer para entornos con reloj congelado. En producción **no es necesario** — usa animaciones CSS normales; React monta y las anima al entrar.

---

## Design Tokens

### Colores — modo OSCURO (protagonista)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#080809` | Fondo de pantalla |
| `--panel` | `#0E0F11` | Fondo de tarjeta |
| `--card-line` | `rgba(255,255,255,.08)` | Borde de tarjeta |
| `--ink` | `#FAFAFA` | Texto principal |
| `--ink2` | `rgba(250,250,250,.55)` | Texto secundario |
| `--ink3` | `rgba(250,250,250,.35)` | Texto terciario / iconos tenues |
| `--field` | `rgba(255,255,255,.045)` | Fondo de inputs |
| `--field-line` | `rgba(255,255,255,.11)` | Borde de inputs |
| `--accent` | `#67BAF4` | Acento (azul claro) |
| `--accent-soft` | `rgba(103,186,244,.16)` | Fondo de acento |
| `--cta-bg` | `#67BAF4` | Fondo del botón |
| `--cta-ink` | `#06121D` | Texto del botón |
| `--cta-glow` | `rgba(103,186,244,.45)` | Glow en hover |
| `--err` | `#FF8177` | Error |
| `--err-soft` | `rgba(255,129,119,.12)` | Fondo de error |

### Colores — modo CLARO
| Token | Valor |
|---|---|
| `--bg` | `#E9EDF3` |
| `--panel` | `#FFFFFF` |
| `--card-line` | `rgba(13,13,13,.08)` |
| `--ink` | `#0D0D0D` |
| `--ink2` | `rgba(13,13,13,.55)` |
| `--ink3` | `rgba(13,13,13,.35)` |
| `--field` | `#F3F5F9` |
| `--field-line` | `rgba(13,13,13,.10)` |
| `--accent` | `#1E466B` (navy) |
| `--accent-soft` | `rgba(30,70,107,.10)` |
| `--cta-bg` | `#1E466B` |
| `--cta-ink` | `#FAFAFA` |
| `--err` | `#C2483C` |

### Marca (constante en ambos modos)
- Navy profundo del panel: `#04070D`. Aura: `#A8DCFF → #67BAF4 → #3D7FBE → #1E466B → #0B2138 → #04070D`.

### Tipografía
- **Familia única: `Sora`** (Google Fonts), pesos 300 / 400 / 500 / 600 / 700.
- Escala: titular marca 33px/700 · títulos 23–24px/700 · body 13–13.5px (300–400) · labels 12px/600 · kickers 10–11px/600 uppercase tracking .18–.22em.
- Boot: "MESA MANAGER" 19px/700, `letter-spacing:.4em`, uppercase.

### Radios y formas
- Tarjeta login 26px · panel marca 18px · inputs/botón 12px · role cards 14px · iconos-cuadro 11px.

### Sombras
- Tarjeta: `0 50px 140px -50px rgba(0,0,0,.65)`
- Hover role: `0 18px 40px -22px var(--cta-glow)`
- Hover CTA: `0 16px 44px -14px var(--cta-glow)`

### Animaciones (keyframes en `ui.css`)
`mmRise`, `mmFade`, `mmViewIn`, `mmSpin`, `mmAura`, `mmOrbA/B/C` (orbes), `mmBarIn` (barras del boot), `mmFlash` (destello), `mmLetter` (texto boot), `mmPulse` (punto de estado).

---

## Iconos
El prototipo usa SVGs inline (objeto `MM_ICONS` en `flow.jsx`). **En tu proyecto ya usas `lucide-react`** — mapea a estos equivalentes:

| Prototipo | lucide-react |
|---|---|
| `idCard` | `IdCard` |
| `lock` | `Lock` |
| `eye` / `eyeOff` | `Eye` / `EyeOff` |
| `arrowR` / `arrowL` | `ArrowRight` / `ArrowLeft` |
| `shield` | `ShieldCheck` |
| `grad` | `GraduationCap` |
| `landmark` | `UserCog` (admin) — o `Landmark` |
| `alert` | (svg de círculo con `!`, ya presente) |
| `check` | `Check` |
| spinner | `Loader2` con `animate-spin` |

---

## Assets
- **`assets/upel.svg`** — el logo UPEL vectorial original (fondo transparente, barras blancas). Fuente de las 9 barras.
- **`assets/upel-white.png`** / **`upel-blue.png`** — logo rasterizado blanco/azul (para el header del panel de marca; tu app ya usa `/logo_upel.png` y `@recursos/icons/logo_upel.png`).
- **`logo-paths.js`** — las 9 barras ya extraídas (úsalo directo; evita re-parsear el SVG).
- Coloca el logo donde tu app ya lo sirve. El login actual usa `src="/logo_upel.png"`.

### Cómo regenerar las barras (si hiciera falta)
El SVG es un único `<path>` con 9 subtrazos. Se separan tokenizando el atributo `d`, convirtiendo todo a coordenadas absolutas, y cortando en cada comando `M`/`m`. El resultado ya está en `logo-paths.js`; normalmente **no necesitas rehacerlo**.

---

## Capturas de referencia (`capturas/`)
Renders del prototipo para referencia visual directa:
- **`login-role-oscuro.png`** — Login, selección de acceso, modo oscuro (vista principal).
- **`login-admin-oscuro.png`** — Login, formulario administrativo (cédula + contraseña), modo oscuro.
- **`login-modo-claro.png`** — Login en modo claro (muestra el formulario; el panel de marca se mantiene navy).
- **`boot-ensamblado.png`** — Pantalla de carga con el logo UPEL ya ensamblado + texto.

## Archivos de referencia en este paquete (`prototipo/`)
- **`Rediseño Login.html`** — documento que monta todo; ábrelo en un navegador para ver el diseño y las animaciones en vivo.
- **`ui.css`** — TODOS los estilos y keyframes (login + boot). Es la fuente de verdad visual.
- **`login.jsx`** — markup/estructura del login (vistas role/admin/student). Lógica de demo, NO la real.
- **`flow.jsx`** — máquina de estados del flujo + iconos + `formatCedula`. Refleja la lógica real a conservar.
- **`boot.jsx`** — componente de la pantalla de carga (ensamblaje del logo).
- **`logo-paths.js`** — las 9 barras del logo (`window.UPEL_BARS`).
- **`assets/`** — logos.

---

## Checklist de implementación
- [ ] Añadir **Sora** a `index.css` (`@import` de Google Fonts o self-hosted) y a la config de fuentes.
- [ ] Portar `ui.css` → clases Tailwind y/o un bloque CSS global con las variables `--bg`, `--accent`, etc. por `[data-mode]` (o conectarlo a tu `.dark`).
- [ ] Reescribir el **markup** de `LoginPage.jsx` con la nueva estructura, **conservando toda la lógica** (login/loginConsultor/RBAC/interrupted/formatCedula/flujo de vistas).
- [ ] Sustituir iconos inline por `lucide-react`.
- [ ] Crear el componente de **boot animado** y montarlo en `App.jsx` en lugar del `PantallaCarga` actual, conservando el prop `intento`/`MAX_INTENTOS`.
- [ ] Importar `UPEL_BARS` (convertir `logo-paths.js` a módulo ES con `export`).
- [ ] Verificar modo claro y oscuro.
- [ ] Verificar el banner de sesión interrumpida re-estilizado.
