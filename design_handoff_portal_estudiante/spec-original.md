# Design Spec — Portal del Estudiante
## `PortalEstudiante.jsx` · UPEL Mesa Manager

---

## Qué es esta pantalla

El portal que ve un estudiante cuando inicia sesión. No tiene sidebar ni navegación interna — es una pantalla standalone completa. El estudiante puede consultar su información académica, ver el estado de su solvencia de pago y seguir el progreso de sus tres mesas de defensa (Mesa I, II y III) a través de un recorrido visual tipo stepper.

---

## Stack y sistema de diseño

- React 19 + Tailwind CSS v4, sin librerías de UI externas
- Lucide-react para íconos
- Tokens del proyecto: `bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`, `border-border`, `bg-secondary`, `bg-gradient-pill`, `shadow-card`
- Dark mode vía clase `.dark` en `<html>` con prefijo `dark:` de Tailwind
- **Dark:** bg `#0A0B0E`, card `#121419`, primary `#67BAF4`, border `#1F2028`
- **Light:** bg `#EEF1F6`, card `#FFFFFF`, primary `#2E6CA6`, border `#DADDE4`
- Fuentes disponibles: Sora, IBM Plex Sans, Playfair Display
- La pantalla ocupa `min-h-screen` — tiene su propio layout completo
- Incluye `ThemeToggle` (componente existente que alterna dark/light)

---

## Contenido que debe existir (sin dictar posición)

### Identidad del portal
- Logo / nombre de la aplicación ("Mesa Manager · UPEL")
- Toggle de tema claro/oscuro (`ThemeToggle`)
- Botón de cerrar sesión (`onLogout`) — visible siempre

### Ficha del estudiante (datos de `datos`)
- Nombre completo (`datos.nombre`)
- Maestría / programa académico (`datos.maestria`)
- Título del proyecto de investigación (`datos.titulo_proyecto`) — puede no existir

### Banner de solvencia de pago
Indica si el estudiante tiene el pago verificado para su próxima mesa pendiente.

Lógica de `proximaMesa`: el número de la próxima mesa que el estudiante necesita completar (1, 2 o 3). Si ya completó las tres, `proximaMesa` es `null`.

Estados posibles del banner:
- **Solvente:** pago verificado para la próxima mesa → mostrar confirmación con monto si existe (`datos.monto_m1/m2/m3`)
- **Pendiente:** pago no verificado → advertencia con instrucción de contactar coordinación
- **Completo:** `proximaMesa === null` → todas las mesas verificadas, solvencia total

### Progreso de defensas — las tres mesas

El corazón de la pantalla. Tres nodos visuales (Mesa I, Mesa II, Mesa III) que representan el recorrido completo del estudiante, en orden. Mesa II se desbloquea solo si Mesa I está Aprobada; Mesa III solo si Mesa II está Aprobada.

Cada nodo tiene uno de estos estados:

| Estado | Qué significa |
|---|---|
| `bloqueado` | No puede acceder aún (mesa anterior no aprobada) |
| `pendiente` | Desbloqueado pero sin programar |
| `programado` | Tiene fecha asignada (Programada o En_Curso) |
| `enCorreccion` | Aprobada con correcciones — tiene plazo |
| `completado` | Aprobada definitivamente |
| `reprobado` | Reprobada |
| `suspendido` | Suspendida |

Cada nodo muestra información según su estado:
- **Programado:** fecha, hora, aula, estado (Programada / En Curso). Si está `Programada`, el nodo es expandible para ver el comité completo (tutor principal/suplente, jurado 1 principal/suplente, jurado 2 principal/suplente, programa)
- **En corrección:** días restantes hasta la fecha límite de corrección. Si quedan ≤ 3 días, urgencia visual. Si el plazo venció, indicarlo.
- **Completado:** fecha y veredicto
- **Reprobado / Suspendido:** fecha
- **Bloqueado / Pendiente:** estado neutro

Los conectores entre nodos reflejan si el tramo fue superado (Mesa I → II aprobada, Mesa II → III aprobada).

### Estados de carga y error
- Carga mientras se obtienen los datos: skeletons animados
- Error si falla la llamada: mensaje con opción visual de reintentar
- No hay estado "vacío" como tal — siempre hay al menos los tres nodos del stepper

---

## Lógica a preservar sin cambios

```js
// Estado
const [datos,   setDatos]   = useState(null)
const [loading, setLoading] = useState(true)
const [error,   setError]   = useState(null)

// Carga
portalesService.getEstudiante(session.cedula)

// Helper: días restantes hasta fecha límite de corrección
function diasRestantes(fechaLimiteStr) {
  if (!fechaLimiteStr) return null
  const [d, m, y] = fechaLimiteStr.split('/').map(Number)
  const limite = new Date(y, m - 1, d)
  const hoy    = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))
}

// Helper: estado de cada nodo del stepper
function getEstadoNodo(tipoMesa, mesas) {
  if (tipoMesa > 1) {
    const anterior = mesas.find(m => m.tipo_mesa === tipoMesa - 1)
    if (!anterior || anterior.estado !== 'Aprobada') return { tipo: 'bloqueado' }
  }
  const mesa = mesas.find(m => m.tipo_mesa === tipoMesa)
  if (!mesa) return { tipo: 'pendiente' }
  switch (mesa.estado) {
    case 'Programada':
    case 'En_Curso':         return { tipo: 'programado',   mesa }
    case 'Con_Correcciones': return { tipo: 'enCorreccion', mesa }
    case 'Aprobada':         return { tipo: 'completado',   mesa }
    case 'Reprobada':        return { tipo: 'reprobado',    mesa }
    case 'Suspendida':       return { tipo: 'suspendido',   mesa }
    default:                 return { tipo: 'pendiente' }
  }
}

// Helper: número de la próxima mesa
function getNumeroProximaMesa(v1, v2, v3) {
  if (!v1) return 1
  if (!v2) return 2
  if (!v3) return 3
  return null
}

// Constantes
const TIPO_LABEL = ['', 'Mesa I', 'Mesa II', 'Mesa III']
```

Props del componente: `{ session, onLogout }` — no cambiar.

---

## Tono y dirección creativa

Portal de consulta personal para un estudiante universitario de postgrado. La experiencia emocional importa aquí — el estudiante llega a esta pantalla para saber en qué punto de su proceso está, si puede avanzar, si tiene algo pendiente. El diseño debe ser claro, alentador y legible de un vistazo.

La pieza más importante es el recorrido de las tres mesas: el estudiante necesita entender inmediatamente en qué etapa está y qué sigue. Eso no significa que tenga que ser un stepper horizontal clásico — hay libertad total para reimaginar cómo se representa ese progreso visual.
