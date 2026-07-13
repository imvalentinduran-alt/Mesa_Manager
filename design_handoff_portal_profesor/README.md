# Handoff: Portal del Profesor — UPEL Mesa Manager

## Objetivo (léelo primero)

Reemplazar **visualmente** el `PortalProfesor.jsx` que ya existe en el codebase por el diseño de este paquete.
**La lógica de negocio NO cambia.** Conserva intactos: `useState`, fetch de datos (`getProfesor`),
helpers (`esFechaHoy`, `TIPO_MESA_LABEL`, filtros de listas), props (`{ session, onLogout }`) y los
modales `QuorumModal` / `VeredictoModal` si ya existen — solo se reemplaza el JSX/markup y los estilos.

> **Instrucción explícita del cliente:** copiar el diseño **EXACTAMENTE** — animaciones, colores,
> tipografías, ventanas (modales), espaciados, todo. Es un mockup **hi-fi**: reprodúcelo pixel-perfect.

## Sobre los archivos de este paquete

- `Portal del Profesor.dc.html` — **referencia de diseño** (prototipo en HTML). Es la **fuente de verdad
  visual**. Ábrelo en el navegador (junto a `support.js`) para ver el diseño vivo, inspeccionar medidas,
  animaciones y estados. **No se copia tal cual al codebase**: hay que **recrearlo en el entorno real**
  (React + Tailwind v4 + tokens, según el proyecto) respetando sus patrones.
- `support.js` — runtime del prototipo (solo para que el HTML de referencia abra). **No portar.**
- `screenshots/` — capturas de cada estado (ver más abajo).

## Fidelidad: **HI-FI (pixel-perfect)**

Colores, tipografía, espaciados, radios, sombras y animaciones son finales. Reprodúcelos exactamente.
Todos los valores están abajo. Los íconos son **SVG inline estilo Lucide** (stroke `currentColor`,
`stroke-width` 2, linecap/linejoin `round`) — usa los mismos paths (o la librería `lucide-react` con los
nombres equivalentes indicados).

---

## Stack y tipografía

- **Fuente:** `Sora` (Google Fonts), pesos 300–800.
  `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap')`
- **Sin librería de iconos externa** en el prototipo: SVG inline. Equivalentes Lucide indicados por componente.
- El diseño es **dark por defecto** con **modo claro** conmutable. Toda la tematización va por **CSS custom
  properties** en el contenedor raíz vía atributo `data-mode="dark" | "light"`. Cambiar el atributo cambia
  todo el tema (sin tocar estilos por elemento).

### ⚠️ Detalle crítico de implementación del tema (no repetir un bug ya resuelto)
- El elemento raíz **declara** las variables Y las **consume**. **No** pongas `background`/`color` con
  `var(--bg)`/`var(--text)` en el *inline style* del raíz: en el elemento que declara las vars, esa
  autorreferencia no refleja el override de `[data-mode="light"]`. **Solución aplicada:** declarar
  `background`/`color` **literales** dentro de las reglas de tema (ver tokens) y NO ponerlos inline.
- **No** pongas `transition` de `background-color`/`color` en el raíz: con cada re-render de React la
  transición se reinicia y el color queda "a medias". El cambio de tema del raíz es **instantáneo**.
  (Las micro-transiciones de hover en botones/cards sí están bien.)

---

## Design Tokens

Definidos en el raíz por `data-mode`. En React/Tailwind v4 mapéalos a tus tokens existentes
(`bg-card`, etc.) o a variables CSS equivalentes.

### Modo OSCURO (`data-mode="dark"`) — por defecto
```
--bg:        #0A0B0E     (fondo de página — LITERAL en la regla, no via var inline)
--text:      #F2F3F5     (texto base — LITERAL)
--card:      #121419     (tarjetas / hero / modales)
--card-2:    #16181F     (filas de historial)
--card-hov:  #191C24     (hover de fila)
--border:    rgba(255,255,255,.07)
--border-2:  rgba(255,255,255,.12)
--dim:       #8A8F98     (texto secundario)
--mute:      #5C616B     (labels pequeños, iconos decorativos)
--brand-l:   #67BAF4     (azul claro: acentos, "EN CURSO", links)
--ok:        #3DD68C     --ok-s: rgba(61,214,140,.12)   --ok-b: rgba(61,214,140,.22)   (aprobado / éxito)
--gold:      #E3B341     --gold-s: rgba(227,179,65,.12) --gold-b: rgba(227,179,65,.28) (aprobado c/correcciones)
--err:       #F2685C     --err-s: rgba(242,104,92,.12)  --err-b: rgba(242,104,92,.24)  (suspendido / error)
--info-s:    rgba(103,186,244,.12)   --info-b: rgba(103,186,244,.22)   (chips/acentos azules)
--field:     rgba(255,255,255,.03)   (fondos sutiles, segmented control)
--divider:   #33373f
--shadow:    0 18px 40px -18px rgba(0,0,0,.7)
--topbar-bg: rgba(18,20,25,.82)   (con backdrop-filter: blur(12px))
--scrim:     rgba(6,7,10,.72)      (fondo del overlay de modal, con blur(4px))
--aura-op:   .42                   (opacidad del halo de fondo)
```

### Modo CLARO (`data-mode="light"`)
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
--brand-l:   #2E6CA6
--ok:        #169F6B     --ok-s: rgba(22,159,107,.1)    --ok-b: rgba(22,159,107,.2)
--gold:      #B8860B     --gold-s: rgba(184,134,11,.1)  --gold-b: rgba(184,134,11,.26)
--err:       #D6453B     --err-s: rgba(214,69,59,.1)    --err-b: rgba(214,69,59,.22)
--info-s:    rgba(46,108,166,.1)     --info-b: rgba(46,108,166,.2)
--field:     rgba(13,28,54,.02)
--divider:   #C8CDD6
--shadow:    0 16px 36px -20px rgba(20,40,80,.32)
--topbar-bg: rgba(255,255,255,.8)
--scrim:     rgba(20,30,55,.4)
--aura-op:   .24
```

### Gradiente de marca (logo, avatar, botones primarios)
```
Logo/avatar (135deg):   linear-gradient(135deg,#0B2138 0%,#1E466B 52%,#2E6CA6 120%)
Botón primario (120deg): linear-gradient(120deg,#1E466B,#2E6CA6)
Barra superior hero:     linear-gradient(120deg,#1E466B,#2E6CA6,#67BAF4)
Sombra botón primario:   0 12px 28px -10px rgba(46,108,166,.75)  (hover: 0 18px 38px -10px rgba(46,108,166,.9) + translateY(-2px))
```

### Escala / valores recurrentes
```
Radios:  botones 11–14px · chips 8px · pills/badges 999px · tarjetas 16–18px · hero/modal 22–24px · avatares 50%
Tipografía:
  - Eyebrow/label:   10–11px, weight 700, letter-spacing .14–.2em, UPPERCASE, color --mute o --brand-l
  - Texto base:      13–14px, weight 400, line-height 1.5, color --dim
  - Nombre/título:   17–25px, weight 700, letter-spacing -.01/-.02em
  - Números (stats): 24px, weight 700, font-variant-numeric: tabular-nums
Iconos: 14–21px en UI, 22px en opciones de veredicto, 28–32px en estados vacíos/error
```

---

## Layout general

Página de columna única, **sin sidebar** (portal standalone).

1. **Topbar** (sticky, alto 72px, `border-bottom`, fondo `--topbar-bg` + `backdrop-filter: blur(12px)`,
   `z-index:20`, padding 0 32px):
   - Izquierda: logo 40×40 (radius 11, gradiente 135deg, ícono `graduation-cap` 21px blanco) +
     eyebrow "MESA MANAGER" (`--brand-l`) sobre "UPEL · Portal del Profesor" (15px/700).
   - Derecha (gap 11px): botón campana (`bell`, badge rojo 7px arriba-derecha), botón tema
     (`moon`/`sun` según modo), botón **Salir** (`log-out` + texto). Botones icon = 38×38, radius 11,
     `border 1px var(--border)`, color `--dim`; hover campana/tema → borde+texto `--gold`; hover Salir →
     fondo `--err-s`, texto/borde `--err`.
2. **Zona de contenido** (`max-width:1080px`, centrada, padding 26px 32px 64px), sobre un **halo/aura**
   decorativo: círculo 560px, `filter: blur(80px)`, `opacity: var(--aura-op)`,
   `background: radial-gradient(circle, var(--brand-l), transparent 68%)`, posicionado arriba-derecha,
   animado con `auraFloat` (16s, infinito). Va detrás (`z-index:0`); el contenido va en `z-index:1`.
3. **Selector "VISTA DEMO"** (segmented control, alineado a la derecha): Hoy · Cargando · Error · Sin
   próximas. **Es solo del prototipo para previsualizar estados** — en producción **elimínalo**: esos
   estados los gobierna el backend (loading/error/lista vacía).

---

## Screens / Estados

> En el prototipo el estado de la mesa de hoy es una máquina: `programada → en_curso → concluida`.
> En el codebase, mapéalo al estado real de la mesa (`Programada` / `En_Curso` / `Concluida`) y a
> `esFechaHoy(mesa.fecha)`.

### A. Resumen del profesor (siempre visible en la vista "Hoy")
`screenshots/01-dark-programada.png`, `06-light-programada.png`
- Fila: avatar 64×64 (círculo, gradiente 135deg, iniciales "CM" 22px/700, `box-shadow: 0 0 0 3px
  rgba(103,186,244,.18), 0 10px 26px -10px rgba(46,108,166,.7)`).
- Centro: eyebrow "BIENVENIDO DE VUELTA" (`--brand-l`) · "Prof. {nombre}" (25px/700) · línea con
  `book-open` + especialidad · `id-card` + cédula (tabular-nums).
- Derecha: 3 stat-cards (min-width 96, radius 16, padding 13px 18px). **HOY** resaltada
  (`--info-s`/`--info-b`, label `--brand-l`); PRÓXIMAS y CONCLUIDAS neutras (`--field`/`--border`,
  label `--mute`). Número 24px/700 tabular-nums.
  - Conteos: derívalos de los datos reales (HOY = mesas de hoy programadas/en curso; PRÓXIMAS =
    programadas futuras; CONCLUIDAS = historial).

### B. Mesa de hoy — **PROGRAMADA / por iniciar**  → acción "Iniciar mesa"
`screenshots/01-dark-programada.png`
- `<section>` hero: `background --card`, `border 1px var(--info-b)`,
  `box-shadow: 0 22px 55px -22px rgba(46,108,166,.5)`, radius 24, overflow hidden.
- Barra superior 4px con gradiente de marca (120deg, …,#67BAF4).
- Cabecera (padding 26px 30px): chip **"HOY · POR INICIAR"** (pill `--info-s`/`--info-b`, texto
  `--brand-l`, ícono `clock` 13px) · horario "09:00 – 11:00" · a la derecha chips "Mesa II"
  (`--info-s`) y "Jurado 1" (`--field`).
- Cuerpo: label "ESTUDIANTE" (`--mute`) · nombre (23px/700) · título del proyecto en *itálica*
  (`--dim`, comillas «»). Lateral: `map-pin` + aula.
- **Botón "Iniciar mesa"** (primario, `play` 18px) → abre **Modal de Asistencia (Quórum)**.
- Mostrar este estado cuando la mesa es `Programada` **y** `esFechaHoy(fecha)` es true.
- Si la mesa programada **no** es hoy → mostrarla en "Próximas mesas" (sección E) **sin botón**.

### C. Mesa de hoy — **EN CURSO**  → acción "Registrar veredicto"
`screenshots/03-dark-encurso.png`
- Mismo hero, pero el chip es **"EN CURSO"**: punto 8px `--brand-l` con animación `livePulse`
  (1.8s, infinito) + texto `--brand-l`. Añade indicador `users` + "{n} presentes".
- Botón derecho **"Registrar veredicto"** (primario, ícono `gavel`) → abre **Modal de Veredicto**.
- Mostrar cuando la mesa es `En_Curso`.

### D. Mesa de hoy — **CONCLUIDA**
`screenshots/05-dark-concluida.png`
- `<section>` con barra superior 4px del **color del veredicto** (gradiente, ver modal):
  aprobado=verde, correcciones=dorado, suspendido=rojo.
- Contenido en fila: círculo 52px con ícono `circle-check` (color/soft/borde del veredicto) ·
  eyebrow "MESA CONCLUIDA · VEREDICTO REGISTRADO" + nombre estudiante (19px/700) · pill a la derecha
  con el **label del veredicto** (color/soft/borde correspondientes).
- Tras concluir, la mesa **baja al Historial** (sección F) como primera entrada.

### E. Próximas mesas (agenda / timeline)
`screenshots/05-dark-concluida.png` (se ve la fila de Luis)
- Header de sección: ícono 34×34 (radius 11, `--info-s`/`--info-b`, `calendar-clock`; hover →
  gradiente + `rotate(-6deg) scale(1.05)`) + eyebrow "AGENDA" + "Próximas mesas".
- Cada mesa = fila con **riel de fecha** a la izquierda (día 20px/700 + mes 10px + punto 13px borde
  `--mute` + línea vertical 2px `--border`) y tarjeta (`--card`, border, radius 18, padding 20px 22px;
  hover → `translateY(-2px)` + `--shadow`).
  - Chips tipo/rol + badge "PROGRAMADA" a la derecha (pill `--field`/`--border`).
  - Nombre 17px/700 · proyecto en itálica · pie con horario, `map-pin` + aula, y a la derecha
    `lock` + "Disponible el día de la defensa" (las programadas futuras **no** tienen botón de acción).
- **Comportamiento con muchas mesas:** hoy es una lista vertical que crece con el **scroll de la página**
  (no tiene scroll interno). Recomendación si hay muchas: agrupar por fecha (encabezados "Hoy / Esta
  semana / …") y/o "ver todas". (Pendiente de decisión del cliente — implementar como prefiera.)

### F. Historial
`screenshots/05-dark-concluida.png`
- Header de sección igual a "Próximas" pero ícono `history` + eyebrow "REGISTRO" + "Historial".
- Filas compactas (`--card-2`, border, radius 16, padding 15px 20px; hover → `--card-hov` +
  `translateX(3px)`): mini-fecha · separador 1px · nombre 15px/600 + línea "Mesa · rol · «proyecto»" ·
  pill de veredicto a la derecha (ej. "Aprobado" verde con `circle-check`).
- Al concluir una mesa hoy, **se antepone** su fila con el veredicto elegido.

### G. Estados de carga / error / vacío
`screenshots/` (no incluidos como archivo aparte; visibles vía el selector demo)
- **Cargando:** skeletons con animación `shimmer` (gradiente 90deg `--card`→`--card-hov`→`--card`,
  `background-size:200% 100%`, 1.4s infinito) replicando avatar+texto+hero, + spinner `loader-circle`
  (animación `spin` 1s) con "Cargando tus mesas…".
- **Error:** ícono `triangle-alert` 32px en círculo 74px (`--err-s`/`--err-b`/`--err`), título
  "No pudimos cargar tus mesas", texto, botón primario "Reintentar" (`rotate-cw`).
- **Sin próximas:** ícono `calendar-check-2` en cuadro 64px (`--info-s`), título "No tienes mesas
  próximas", texto. Tarjeta con `border: 1px dashed var(--border-2)`.

---

## Ventanas (Modales)

Overlay: `position:fixed; inset:0; z-index:60; background:var(--scrim); backdrop-filter:blur(4px);`
centrado (flex center), padding 32px. Click en el backdrop = cerrar. Click dentro del card =
`stopPropagation`. Animaciones: scrim `scrimIn` (.2s), card `modalIn` (.32s,
`cubic-bezier(.16,1,.3,1)`).
Card: `background --card`, `border 1px var(--border-2)`, radius 22, `box-shadow: 0 40px 100px -30px
rgba(0,0,0,.7)`, `max-height:88vh` con cuerpo `overflow-y:auto`.

### 1. Modal de Asistencia / Quórum  (`QuorumModal`)
`screenshots/02-dark-modal-asistencia.png`
- **Header:** ícono `users` 20px en cuadro 42px (`--info-s`/`--info-b`/`--brand-l`) · título
  "Asistencia de la mesa" (18px/700) · subtítulo "Para dar inicio se requieren **mínimo 2 profesores** y
  la presencia del **estudiante**." · botón cerrar (`x`, 34×34).
- **Cuerpo:** grupo "JURADO Y TUTORÍA" (6 filas) + grupo "ESTUDIANTE" (1 fila). Cada fila = botón
  toggle (full-width, radius 14, padding 12px 14px): avatar 40px (iniciales; gradiente azul si presente,
  gris `linear-gradient(135deg,#3a3f49,#23262d)` si ausente) · nombre 14px/600 (+ badge "TÚ" si es el
  profesor logueado) + rol (`--dim`) · checkbox 24px a la derecha (radius 8; marcado = gradiente azul +
  `check` blanco; sin marcar = `border 1.5px var(--border-2)`). Fila marcada: fondo `--info-s`, borde
  `--info-b`.
- **Footer:** a la izquierda dos requisitos con punto-indicador:
  - punto verde si profesores ≥ 2 (`--ok`/halo `--ok-s`) → "{n} de mín. 2 profesores"
  - punto verde si estudiante presente, **rojo** (`--err`/halo `--err-s`) si ausente → "Estudiante
    presente" / "Estudiante ausente — requerido"
  - Botón **"Dar inicio a la mesa"** (`play`): habilitado **solo** si `profesores≥2 && estudiantePresente`.
    Deshabilitado = fondo `--field`, texto `--mute`, `cursor:not-allowed`.
- **Datos:** las 7 personas (2 jurados principales, 1 tutor principal, 2 suplentes de jurado, 1 suplente
  de tutor, 1 estudiante) vienen de la mesa real. Los nombres del prototipo son de ejemplo.
- **Acción "Dar inicio":** llamar a la lógica real que pasa la mesa a `En_Curso` (registrar asistencia /
  quórum en backend). Luego cerrar modal y mostrar estado **C (EN CURSO)**.

### 2. Modal de Veredicto  (`VeredictoModal`)
`screenshots/04-dark-modal-veredicto.png`
- **Header:** ícono `gavel` en cuadro 42px (`--info-s`) · título "Registrar veredicto" · subtítulo
  "{estudiante} · {tipo de mesa}" · cerrar.
- **Cuerpo:** 3 opciones (botones full-width, radius 16, padding 15px 16px). Cada una: cuadro-ícono 44px
  (radius 12, soft/borde/color del veredicto) · título 15px/700 + descripción (`--dim`) · radio 22px a la
  derecha (border 2px; seleccionado = borde del color + punto 10px relleno). Seleccionada: fondo `soft`,
  borde del color.
  | id | label | color | ícono (Lucide) | descripción |
  |----|-------|-------|----------------|-------------|
  | `aprobado` | **Aprobado** | verde `--ok` | `circle-check` | "El proyecto cumple con todos los requisitos exigidos." |
  | `correcciones` | **Aprobado con correcciones** | dorado `--gold` | `pencil` (`square-pen`) | "Aprobado sujeto a los ajustes señalados por el jurado." |
  | `suspendido` | **Suspendido** | rojo `--err` | `circle-x` | "El proyecto no cumple con los requisitos exigidos." |
- **Footer:** botón "Cancelar" (ghost) + botón **"Confirmar veredicto"** (primario), habilitado solo si
  hay opción seleccionada.
- **Acción "Confirmar":** llamar a la lógica real que registra el veredicto y pasa la mesa a `Concluida`.
  Luego cerrar modal, mostrar estado **D (CONCLUIDA)** y anteponer la fila al Historial con el veredicto.

---

## Interacciones & animaciones (keyframes exactos)

```css
@keyframes auraFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-70px,60px) scale(1.12)} 66%{transform:translate(40px,-30px) scale(.95)} }
@keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(103,186,244,.55)} 70%{box-shadow:0 0 0 10px rgba(103,186,244,0)} 100%{box-shadow:0 0 0 0 rgba(103,186,244,0)} }
@keyframes rvIn      { from{transform:translateY(18px)} to{transform:none} }   /* entrada de cards; ¡sin opacity para no esconder contenido si no corre! */
@keyframes scrimIn   { from{opacity:0} to{opacity:1} }
@keyframes modalIn   { from{opacity:0;transform:translateY(22px) scale(.97)} to{opacity:1;transform:none} }
@keyframes shimmer   { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
@keyframes spin      { to{transform:rotate(360deg)} }
@media (prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important} }
```
- Transiciones de hover en botones/cards: `all .25–.3s cubic-bezier(.22,.61,.36,1)`.
- Hover botón primario: `translateY(-2px)` + sombra más fuerte (valores arriba).
- Hover icon-buttons de sección: gradiente + `rotate(-6deg) scale(1.05)`.
- Hover fila historial: `translateX(3px)`; hover tarjeta próxima: `translateY(-2px)` + `--shadow`.

---

## State (a conectar con lo que ya existe)

| Estado UI prototipo | Mapea a |
|---|---|
| `theme: 'dark'\|'light'` | preferencia de tema (puede persistir en localStorage) |
| `mesa: 'programada'\|'en_curso'\|'concluida'` | estado real de la mesa + `esFechaHoy(fecha)` |
| `modal: null\|'quorum'\|'veredicto'` | apertura de `QuorumModal` / `VeredictoModal` |
| `asistencia: { [personaId]: boolean }` | asistencia real de los 7 integrantes |
| `veredictoSel` / `veredictoFinal` | selección y veredicto registrado |

Reglas de habilitación:
- "Dar inicio": `profesoresPresentes >= 2 && asistencia[estudianteId] === true`.
- "Confirmar veredicto": `veredictoSel != null`.

## Íconos usados (equivalentes Lucide)
`graduation-cap, bell, moon, sun, log-out, clock, map-pin, play, gavel, users, calendar-clock, lock,
history, circle-check (check-circle-2), book-open, contact/id-card, x, check, triangle-alert, rotate-cw,
loader-circle, calendar-check-2, pencil/square-pen, circle-x`.
En el prototipo van como SVG inline; en React usa `lucide-react` con estos nombres (o copia los paths del
HTML de referencia para fidelidad exacta).

## Assets
Ninguna imagen externa. Logo/avatares son gradientes + iniciales. Banderas/imágenes: no aplica.
Fuente Sora desde Google Fonts.

## Archivos de referencia
- `Portal del Profesor.dc.html` — diseño completo (abrir junto a `support.js`).
- `screenshots/01..06` — estados (dark: programada, asistencia, en curso, veredicto, concluida; light:
  programada).
