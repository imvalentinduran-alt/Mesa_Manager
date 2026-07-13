# Handoff: Portal del Estudiante — UPEL Mesa Manager

## Objetivo (léelo primero)

Reemplazar **visualmente** el `PortalEstudiante.jsx` que ya existe en el codebase por el diseño de este
paquete. **La lógica de negocio NO cambia.** Conserva intactos: `useState` (`datos`/`loading`/`error`),
el fetch `portalesService.getEstudiante(session.cedula)`, los helpers (`diasRestantes`, `getEstadoNodo`,
`getNumeroProximaMesa`, `TIPO_LABEL`) y las props `{ session, onLogout }` — solo se reemplaza el
JSX/markup y los estilos.

> **Instrucción explícita del cliente:** copiar el diseño **EXACTAMENTE** — animaciones, colores,
> tipografías, espaciados, el stepper de mesas, todo. Es un mockup **hi-fi**: reprodúcelo pixel-perfect.

Este portal es **hermano visual** del Portal del Profesor: comparten el mismo sistema (Sora, azul
institucional, dark/light, auras, tarjetas redondeadas, microanimaciones). Si ya migraste el Portal del
Profesor, **reutiliza esos tokens y patrones**.

## Sobre los archivos de este paquete

- `Portal del Estudiante.dc.html` — **referencia de diseño** (prototipo en HTML). Es la **fuente de
  verdad visual**. Ábrelo en el navegador (junto a `support.js`) para ver el diseño vivo, inspeccionar
  medidas, animaciones y estados. **No se copia tal cual al codebase**: hay que **recrearlo en el entorno
  real** (React + Tailwind v4 + tokens del proyecto) respetando sus patrones.
- `support.js` — runtime del prototipo (solo para que el HTML de referencia abra). **No portar.**
- `spec-original.md` — la spec funcional original del componente (lógica a preservar, props, estados).
- `screenshots/` — capturas de cada estado (ver más abajo).

> **Switcher "VISTA DEMO"** (Inicio · En curso · Corrección · Suspendida · Graduado · Cargando · Error):
> existe **solo en el prototipo** para previsualizar todos los escenarios. En producción **elimínalo** —
> el escenario real lo determinan los datos del backend (`mesas`, verificaciones de pago, `loading`,
> `error`).

## Fidelidad: **HI-FI (pixel-perfect)**

Colores, tipografía, espaciados, radios, sombras y animaciones son finales. Reprodúcelos exactamente.
Todos los valores están abajo. Los íconos son **SVG inline estilo Lucide** (stroke `currentColor`,
`stroke-width` 2, linecap/linejoin `round`) — usa los mismos paths o `lucide-react` con los nombres
equivalentes indicados.

---

## Stack y tipografía

- **Fuente:** `Sora` (Google Fonts), pesos 300–800.
  `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap')`
- **Sin librería de iconos externa** en el prototipo: SVG inline. Equivalentes Lucide indicados abajo.
- Diseño **dark por defecto** con **modo claro** conmutable (`ThemeToggle`). Toda la tematización va por
  **CSS custom properties** en el contenedor raíz vía atributo `data-mode="dark" | "light"`. Cambiar el
  atributo cambia todo el tema (sin tocar estilos por elemento).

### ⚠️ Detalle crítico de implementación del tema (no repetir un bug ya resuelto)
- El elemento raíz **declara** las variables Y las **consume**. **No** pongas `background`/`color` con
  `var(--bg)`/`var(--text)` en el *inline style* del raíz: en el elemento que declara las vars, esa
  autorreferencia no refleja el override de `[data-mode="light"]`. **Solución aplicada:** declarar
  `background`/`color` **literales** dentro de las reglas de tema (ver tokens) y NO ponerlos inline.
- **No** pongas `transition` de `background-color`/`color` en el raíz: con cada re-render de React la
  transición se reinicia y el color queda "a medias". El cambio de tema del raíz es **instantáneo**.
  (Las micro-transiciones de hover en botones/cards sí están bien.)
- En el keyframe de entrada `rvIn` **no uses `opacity`** (solo `transform`). Si la animación no corre
  (reduced-motion / SSR / captura), un `opacity:0` con `fill: both` deja el contenido **invisible**.

---

## Design Tokens

Definidos en el raíz por `data-mode`. En React/Tailwind v4 mapéalos a tus tokens existentes
(`bg-card`, etc.) o a variables CSS equivalentes.

### Modo OSCURO (`data-mode="dark"`) — por defecto
```
--bg:        #0A0B0E     (fondo de página — LITERAL en la regla, no via var inline)
--text:      #F2F3F5     (texto base — LITERAL)
--card:      #121419     (tarjetas / nodos / banner)
--card-2:    #16181F     (nodos bloqueados / pendientes)
--card-hov:  #191C24
--border:    rgba(255,255,255,.07)
--border-2:  rgba(255,255,255,.12)
--dim:       #8A8F98     (texto secundario)
--mute:      #5C616B     (labels pequeños, iconos decorativos, estado bloqueado)
--brand-l:   #67BAF4     (azul claro: acentos, "Programada", eyebrows)
--ok:        #3DD68C     --ok-s: rgba(61,214,140,.12)   --ok-b: rgba(61,214,140,.22)   (aprobada / completado / solvente)
--gold:      #E3B341     --gold-s: rgba(227,179,65,.12) --gold-b: rgba(227,179,65,.28) (correcciones / pago pendiente)
--err:       #F2685C     --err-s: rgba(242,104,92,.12)  --err-b: rgba(242,104,92,.24)  (reprobada / suspendida / error / urgencia)
--info-s:    rgba(103,186,244,.12)   --info-b: rgba(103,186,244,.22)   (chips/acentos azules)
--field:     rgba(255,255,255,.03)   (fondos sutiles, segmented control, chips neutros)
--divider:   #33373f
--shadow:    0 18px 40px -18px rgba(0,0,0,.7)
--topbar-bg: rgba(18,20,25,.82)   (con backdrop-filter: blur(12px))
--aura-op:   .42                  (opacidad del halo de fondo)
```

### Modo CLARO (`data-mode="light"`)
> ⚠️ Los acentos del modo claro fueron **reforzados** respecto al portal del profesor: alfas más altas y
> colores más saturados, porque con alfas .1 sobre fondo casi-blanco los chips se veían lavados. Usa
> **estos** valores exactos.
```
--bg:        #EEF1F6     (LITERAL en la regla)
--text:      #10151E     (LITERAL)
--card:      #FFFFFF
--card-2:    #FFFFFF
--card-hov:  #F6F8FB
--border:    rgba(13,28,54,.09)
--border-2:  rgba(13,28,54,.16)
--dim:       #515A68
--mute:      #6B7480     (oscurecido a propósito para contraste de labels sobre blanco)
--brand-l:   #1F5F9C
--ok:        #0E8F5C     --ok-s: rgba(14,143,92,.15)    --ok-b: rgba(14,143,92,.4)
--gold:      #8F6500     --gold-s: rgba(143,101,0,.14)  --gold-b: rgba(143,101,0,.42)
--err:       #CE3A30     --err-s: rgba(206,58,48,.13)   --err-b: rgba(206,58,48,.4)
--info-s:    rgba(31,95,156,.14)    --info-b: rgba(31,95,156,.38)
--field:     rgba(13,28,54,.04)
--divider:   #C8CDD6
--shadow:    0 16px 36px -20px rgba(20,40,80,.32)
--topbar-bg: rgba(255,255,255,.8)
--aura-op:   .24
```

### Gradiente de marca (logo, avatar, botones primarios)
```
Logo/avatar (135deg):    linear-gradient(135deg,#0B2138 0%,#1E466B 52%,#2E6CA6 120%)
Botón primario (120deg): linear-gradient(120deg,#1E466B,#2E6CA6)
Sombra botón primario:   0 12px 28px -10px rgba(46,108,166,.75)  (hover: 0 18px 38px -10px rgba(46,108,166,.9) + translateY(-2px))
Conector "superado" / barra progreso: linear-gradient(180deg|90deg,#1E8A5B,#3DD68C)
Avatar miembro de comité (gris): linear-gradient(135deg,#3a3f49,#23262d)
```

### Escala / valores recurrentes
```
Radios:  botones 11–14px · chips 8–12px · pills/badges 999px · tarjetas/nodos 18–20px · banner 18px · avatares 50%
Tipografía:
  - Eyebrow/label:   10–11px, weight 700, letter-spacing .12–.2em, UPPERCASE, color --mute o --brand-l
  - Texto base:      13–14px, weight 400, line-height 1.5, color --dim
  - Nombre/título:   17–25px, weight 700, letter-spacing -.01/-.02em
  - Números (stats): tabular-nums (font-variant-numeric)
Iconos: 14–22px en UI, 28–32px en estados vacíos/error
```

---

## Layout general

Página de columna única, **sin sidebar** (portal standalone), `max-width: 1000px` centrada,
padding `26px 32px 64px`. Sobre un **halo/aura** decorativo idéntico al del profesor.

1. **Topbar** (sticky, alto 72px, `border-bottom`, fondo `--topbar-bg` + `backdrop-filter: blur(12px)`,
   `z-index:20`, padding 0 32px):
   - Izquierda: logo 40×40 (radius 11, gradiente 135deg, ícono `graduation-cap` 21px blanco) +
     eyebrow "MESA MANAGER" (`--brand-l`) sobre "UPEL · Portal del Estudiante" (15px/700).
   - Derecha (gap 11px): botón tema (`moon`/`sun` según modo, **`ThemeToggle`** existente), botón
     **Salir** (`log-out` + texto → `onLogout`). Botones icon = 38×38, radius 11,
     `border 1px var(--border)`, color `--dim`; hover tema → borde+texto `--gold`; hover Salir → fondo
     `--err-s`, texto/borde `--err`. *(No hay campana de notificaciones en este portal.)*
2. **Zona de contenido** sobre **aura**: círculo 560px, `filter: blur(80px)`, `opacity: var(--aura-op)`,
   `background: radial-gradient(circle, var(--brand-l), transparent 68%)`, arriba-derecha, animado con
   `auraFloat` (16s). Detrás (`z-index:0`); contenido en `z-index:1`.

---

## Screens / Estados

> Composición de la vista cargada (de arriba a abajo): **Ficha del estudiante** → **Banner de solvencia**
> → **Recorrido de defensas (stepper de 3 mesas)**.

### A. Ficha del estudiante (siempre visible cargado)
`screenshots/01-dark-encurso.png`, `09-light-encurso.png`
- Fila: avatar 64×64 (círculo, gradiente 135deg, iniciales "AS" 22px/700, `box-shadow: 0 0 0 3px
  rgba(103,186,244,.18), 0 10px 26px -10px rgba(46,108,166,.7)`).
- Centro: eyebrow "BIENVENIDA DE VUELTA" (`--brand-l`) · `datos.nombre` (25px/700) · línea con
  `graduation-cap` + `datos.maestria` · separador · `id-card` + cédula (`session.cedula`, tabular-nums).
- Derecha: tarjeta "DEFENSAS APROBADAS" (radius 16, padding 14px 18px, `--info-s`/`--info-b`,
  min-width 190): label `--brand-l` + "{aprobadas}/3" (aprobadas = mesas con estado `Aprobada`) + barra
  de progreso 7px (track `--field`, fill gradiente verde 180/90deg, `width = aprobadas/3*100%`,
  transición width .6s).
- **Título del proyecto** (`datos.titulo_proyecto`, puede no existir → ocultar bloque): tarjeta `--field`
  con ícono `book-text`/`notebook-text` + eyebrow "PROYECTO DE INVESTIGACIÓN" + texto en *itálica*
  entre comillas «».

### B. Banner de solvencia
`screenshots/01-dark-encurso.png` (solvente) · `03-dark-correccion.png` (pendiente) · `04-dark-graduado.png` (total)
Fila (radius 18, padding 18px 22px): cuadro-ícono 44px (radius 12, fondo `--card`, borde del color) +
contenido (tag-pill + título 15px/700 + descripción `--dim`). Lógica con `getNumeroProximaMesa` →
`proximaMesa`:
| caso | color | tag | título | descripción | extra |
|---|---|---|---|---|---|
| **Solvente** (pago verificado para `proximaMesa`) | `--ok` (verde) | "SOLVENTE" | "Pago verificado para {Mesa N}" | confirmación, habilitado para defender | chip con monto `datos.monto_m{n}` si existe |
| **Pendiente** (pago no verificado) | `--gold` (dorado) | "PAGO PENDIENTE" | "Aún no verificamos tu pago para {Mesa N}" | instrucción de contactar coordinación | chip monto si existe |
| **Completo** (`proximaMesa === null`) | `--ok` (verde) | "SOLVENCIA TOTAL" | "Todas tus mesas están verificadas" | felicitación, sin pendientes | — |
Ícono: `circle-check` (solvente/completo) · `triangle-alert` (pendiente).

### C. Recorrido de defensas — **stepper vertical de las 3 mesas** (la pieza central)
`screenshots/02..06`
- Header de sección: ícono 34×34 (radius 11, `--info-s`/`--info-b`, `sun-medium`/`compass`; hover →
  gradiente + `rotate(-6deg) scale(1.05)`) + eyebrow "TU PROGRESO" + "Recorrido de defensas".
- **Timeline vertical**: para cada mesa (1, 2, 3) una fila `display:flex; gap:16px`:
  - **Riel izquierdo** (columna 48px): **badge circular 46px** (estado) + **conector vertical** hacia
    el siguiente nodo (3px, radius 999, `min-height 34px`; **verde** `linear-gradient(180deg,#1E8A5B,#3DD68C)`
    si el tramo fue superado = la mesa de **este** nodo está `Aprobada`; si no, `--border-2`). El último
    nodo no lleva conector. El conector anima con `growLine` (scaleY 0→1, origin top).
  - **Tarjeta derecha** (`flex:1`, radius 20, padding 18px 22px): cabecera con label "Mesa I/II/III"
    (eyebrow `--mute`) + **pill de estado** (punto + label, colores según estado) y luego contenido
    según estado.
- El badge, la pill, el borde de la tarjeta y la sombra se colorean con el token del estado.
  Estados **programado**/**enCorreccion** llevan `border` del color + sombra suave
  `0 16px 38px -22px rgba(46,108,166,.5)`; los demás `border: 1px var(--border)`. Estados
  **bloqueado**/**pendiente**: tarjeta `--card-2`, `border-style: dashed`, `opacity .82`.

Mapa de **estado del nodo** (de `getEstadoNodo(tipoMesa, mesas)`) → presentación:

| `tipo` | token color | ícono badge (Lucide) | pill label | contenido de la tarjeta |
|---|---|---|---|---|
| `completado` | `--ok` verde (badge con ring `0 0 0 3px --ok-s`) | `check` | "Aprobada" | `calendar` + "Defendida el {fecha}" + pill "Aprobado" (verde, `check`) |
| `programado` | `--brand-l`/info azul | `calendar` (`calendar-days`) | "Programada" / "En curso" | fila `calendar`+fecha · `clock`+hora · `map-pin`+aula. **Si `Programada`**: botón "Ver comité completo" (`users`, chevron) → despliega comité |
| `enCorreccion` | `--gold` dorado | `pencil` (`square-pen`) | "Con correcciones" | texto explicativo + **chip de plazo** con `diasRestantes`: dorado normal; **rojo `--err`** si ≤ 3 días o vencido. Texto: "Quedan N días · vence {fecha}" / "Vence hoy · {fecha}" / "Plazo vencido el {fecha}" |
| `reprobado` | `--err` rojo | `circle-x` | "Reprobada" | `calendar` + fecha + nota de contactar coordinación |
| `suspendido` | `--err` rojo | `pause` | "Suspendida" | `calendar` + fecha + nota de contactar coordinación |
| `bloqueado` | `--mute` neutro (badge opacity .75) | `lock` | "Bloqueada" | "Se desbloquea al aprobar {Mesa anterior}." |
| `pendiente` | `--dim` neutro | `clock` (`circle-dashed`) | "Por programar" | "Disponible para programar. Coordina tu fecha de defensa con tu tutor." |

- La pill de estado **"En curso"** (mesa `En_Curso`) usa el punto con animación `livePulse` (azul, 1.8s).
- **Comité desplegable** (solo en mesas `Programada`): tras pulsar "Ver comité completo" se abre
  (anim `rvIn`) un bloque con borde superior: línea "Programa · {programa}" (`graduation-cap`) + **grid
  2 columnas** de 6 miembros — Tutor Principal/Suplente, Jurado 1 Principal/Suplente, Jurado 2
  Principal/Suplente. Cada miembro: chip `--field` con avatar 32px (iniciales, gradiente gris) + nombre
  13px/600 + rol 10.5px `--mute`. El chevron rota 180° al expandir. Ver `02-dark-stepper-comite.png`.

### D. Conectores entre nodos
Reflejan si el tramo fue superado: Mesa I→II verde si Mesa I `Aprobada`; Mesa II→III verde si Mesa II
`Aprobada`. Si no, gris (`--border-2`). En "Graduado" los tres están aprobados → ambos conectores
verdes (`04-dark-graduado.png`).

### E. Estados de carga / error
`screenshots/07-dark-loading.png`, `08-dark-error.png`
- **Cargando** (`loading === true`): skeletons con `shimmer` (gradiente 90deg `--card`→`--card-hov`→
  `--card`, `background-size:200% 100%`, 1.4s) replicando ficha (avatar+texto) + banner + 2 nodos, +
  spinner `loader-circle` (anim `spin` 1s) con "Cargando tu información…".
- **Error** (`error` no nulo): ícono `triangle-alert` 32px en círculo 74px (`--err-s`/`--err-b`/`--err`),
  título "No pudimos cargar tu información", texto, botón primario "Reintentar" (`rotate-cw`) → reintentar
  el fetch.
- **No hay estado "vacío":** siempre se renderizan los 3 nodos del stepper.

---

## Interacciones & animaciones (keyframes exactos)

```css
@keyframes auraFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-70px,60px) scale(1.12)} 66%{transform:translate(40px,-30px) scale(.95)} }
@keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(103,186,244,.55)} 70%{box-shadow:0 0 0 10px rgba(103,186,244,0)} 100%{box-shadow:0 0 0 0 rgba(103,186,244,0)} }
@keyframes rvIn      { from{transform:translateY(18px)} to{transform:none} }   /* entrada de cards; ¡SIN opacity para no esconder contenido si no corre! */
@keyframes shimmer   { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes growLine  { from{transform:scaleY(0)} to{transform:scaleY(1)} }      /* conectores del stepper, transform-origin:top */
@media (prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important} }
```
- Entrada de ficha/banner/nodos con `rvIn` (.5–.55s, `cubic-bezier(.16,1,.3,1)`), con `animation-delay`
  escalonado por nodo (≈0.06s·tipo).
- Transiciones de hover en botones/cards: `all .25–.3s cubic-bezier(.22,.61,.36,1)`.
- Hover botón primario: `translateY(-2px)` + sombra más fuerte. Hover icon-button de sección: gradiente +
  `rotate(-6deg) scale(1.05)`.

---

## State / lógica (preservar — ver `spec-original.md`)

No cambiar nada de esto; solo conectarlo al nuevo markup:
```js
const [datos, setDatos]     = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError]     = useState(null)
portalesService.getEstudiante(session.cedula)

diasRestantes(fechaLimiteStr)        // → nº de días hasta la fecha límite de corrección
getEstadoNodo(tipoMesa, mesas)       // → { tipo, mesa? }  (bloqueado/pendiente/programado/enCorreccion/completado/reprobado/suspendido)
getNumeroProximaMesa(v1, v2, v3)     // → 1|2|3|null  (gobierna el banner de solvencia)
const TIPO_LABEL = ['', 'Mesa I', 'Mesa II', 'Mesa III']
```
Props del componente: `{ session, onLogout }` — **no cambiar**.

Mapeo prototipo → real:
| UI prototipo | Mapea a |
|---|---|
| `theme: 'dark'\|'light'` | `ThemeToggle` existente (puede persistir en localStorage) |
| switcher "VISTA DEMO" | **eliminar**; el escenario lo dan `datos.mesas` + verificaciones de pago |
| `loading` / `error` | `loading` / `error` reales del fetch |
| nodos del stepper | `[1,2,3].map(t => getEstadoNodo(t, datos.mesas))` |
| banner | `getNumeroProximaMesa(...)` + verificación de pago de `proximaMesa` (+ `datos.monto_m{n}`) |
| comité desplegable | datos reales del comité de la mesa (tutor/jurados principal+suplente + programa) |

## Íconos usados (equivalentes Lucide)
`graduation-cap, moon, sun, log-out, calendar / calendar-days, clock, map-pin, users, check, pencil /
square-pen, circle-x, pause, lock, circle-dashed, circle-check, triangle-alert, rotate-cw, loader-circle,
book-text / notebook-text, id-card, compass / sun-medium, chevron-down`.
En el prototipo van como SVG inline; en React usa `lucide-react` con estos nombres (o copia los paths del
HTML de referencia para fidelidad exacta).

## Assets
Ninguna imagen externa. Logo/avatares son gradientes + iniciales. Fuente Sora desde Google Fonts.

## Archivos de referencia
- `Portal del Estudiante.dc.html` — diseño completo (abrir junto a `support.js`).
- `spec-original.md` — spec funcional original.
- `screenshots/01..10` — estados (dark: en curso, stepper+comité, corrección, graduado, inicio,
  suspendida, cargando, error; light: en curso, corrección).
