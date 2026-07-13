# PROMPT PARA CLAUDE CODE — Portal del Estudiante (UPEL Mesa Manager)

Copia/pega esto en Claude Code (terminal) dentro del repo, después de descomprimir
`design_handoff_portal_estudiante/` en la raíz del proyecto.

---

Lee con atención `design_handoff_portal_estudiante/README.md`, el diseño de referencia
`design_handoff_portal_estudiante/Portal del Estudiante.dc.html` (ábrelo si puedes), la spec funcional
`design_handoff_portal_estudiante/spec-original.md` y todas las imágenes en
`design_handoff_portal_estudiante/screenshots/`.

Tu tarea: **reemplazar visualmente** el componente existente `PortalEstudiante.jsx` por ese diseño,
recreándolo **EXACTAMENTE / pixel-perfect** — colores, tipografía (Sora), espaciados, radios, sombras,
animaciones, el stepper vertical de las 3 mesas, el comité desplegable, el banner de solvencia y el modo
claro. Es un mockup hi-fi; reprodúcelo fielmente. Es el **hermano visual** del Portal del Profesor que ya
migraste: **reutiliza los mismos tokens y patrones** (Sora, azul institucional, auras, tarjetas).

**NO cambies la lógica de negocio.** Conserva intactos:
- el estado `useState`: `datos`, `loading`, `error`,
- el fetch `portalesService.getEstudiante(session.cedula)`,
- los helpers `diasRestantes`, `getEstadoNodo`, `getNumeroProximaMesa` y la constante `TIPO_LABEL`,
- las props `{ session, onLogout }`.

Solo reemplaza el **markup/JSX y los estilos**, y **enlaza** la UI a la lógica que ya existe:
- **Ficha**: `datos.nombre`, `datos.maestria`, `datos.titulo_proyecto` (oculta el bloque del proyecto si
  no existe), cédula desde `session.cedula`. "Defensas aprobadas" = nº de mesas con estado `Aprobada`.
- **Banner de solvencia**: con `getNumeroProximaMesa(...)` → `proximaMesa`. Solvente (pago verificado) /
  Pendiente (no verificado, contactar coordinación) / Completo (`proximaMesa === null`). Muestra el monto
  `datos.monto_m{n}` si existe.
- **Stepper de 3 mesas**: `[1,2,3].map(t => getEstadoNodo(t, datos.mesas))`. Cada nodo se pinta según su
  `tipo` (bloqueado / pendiente / programado / enCorreccion / completado / reprobado / suspendido) — ver
  la tabla del README. Mesa II se desbloquea solo si Mesa I `Aprobada`; Mesa III solo si Mesa II
  `Aprobada` (ya lo resuelve `getEstadoNodo`).
- **Comité desplegable**: solo en mesas `Programada`; al expandir muestra tutor principal/suplente,
  jurado 1 y 2 (principal+suplente) y el programa, con los datos reales de la mesa.
- **Plazo de corrección**: usa `diasRestantes(mesa.fecha_limite)`; si quedan ≤ 3 días o el plazo venció,
  pinta el chip en rojo (`--err`) con el texto correspondiente.
- **Conectores** entre nodos en verde cuando el tramo fue superado (mesa de ese nodo `Aprobada`).

**Quita** el selector "VISTA DEMO" (Inicio/En curso/Corrección/Suspendida/Graduado/Cargando/Error): es
solo del prototipo. El escenario real lo determinan `datos.mesas`, las verificaciones de pago, `loading`
y `error`. Conserva los diseños de **Cargando** (skeletons + spinner) y **Error** (reintentar) y
muéstralos según el estado real del fetch. No hay estado "vacío": siempre se renderizan los 3 nodos.

Usa los tokens, tipografía e íconos del README. Para los íconos usa `lucide-react` con los nombres
indicados (o copia los paths del HTML de referencia para fidelidad exacta).

### ⚠️ Tres detalles de implementación (evitan bugs ya resueltos en el prototipo)
1. **No** pongas `background: var(--bg)` ni `color: var(--text)` en el *inline style* del contenedor raíz
   que **declara** las variables de tema: en ese elemento la autorreferencia no refleja el override de
   `[data-mode="light"]`. Declara `background`/`color` **literales** dentro de las reglas de tema
   (`[data-portal-root]{...}` y `[data-portal-root][data-mode="light"]{...}`), como en el README.
2. **No** pongas `transition: background-color/color` en ese contenedor raíz: con cada re-render se
   reinicia y el color queda "a medias". El cambio de tema del raíz debe ser instantáneo. (Las
   transiciones de hover en botones/cards sí van bien.)
3. El keyframe de entrada `rvIn` usa **solo `transform`, sin `opacity`**. Si añades `opacity:0` con
   `fill: both` y la animación no corre (reduced-motion / captura), el contenido queda **invisible**.

### Modo claro — usa los acentos reforzados del README
Este portal **subió la saturación y las alfas** de los acentos en modo claro respecto al portal del
profesor (con alfas .1 sobre fondo casi-blanco los chips se veían lavados). Usa exactamente los valores
de `--ok/--gold/--err/--info-*/--brand-l` del bloque "Modo CLARO" del README.

Mantén accesibilidad: `@media (prefers-reduced-motion: reduce)` desactiva animaciones; hit-targets ≥ 40px;
contraste correcto en ambos modos (el gris `--mute` ya viene oscurecido en claro).

Al terminar, muéstrame un diff resumido de `PortalEstudiante.jsx` y confirma que la lógica de datos
(`getEstudiante`, los tres helpers y `getNumeroProximaMesa`) no cambió de comportamiento.
