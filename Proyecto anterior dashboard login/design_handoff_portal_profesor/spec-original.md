# Design Spec — Portal del Profesor
## `PortalProfesor.jsx` · UPEL Mesa Manager

---

## Qué es esta pantalla

El portal que ve un profesor cuando inicia sesión. No tiene sidebar ni navegación interna — es una pantalla standalone con su propio header. El profesor puede consultar sus mesas asignadas, iniciar una defensa el día que corresponde, y registrar el veredicto cuando la mesa está en curso.

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

---

## Contenido que debe existir (sin dictar posición)

### Identidad del portal
- Logo / nombre de la aplicación ("Mesa Manager · UPEL")
- Nombre completo del profesor autenticado (`datos.nombre`)
- Botón de cerrar sesión (`onLogout`) — visible siempre

### Resumen personal (datos de `datos`)
- Nombre completo del profesor
- Cédula
- Especialidad
- Conteo total de mesas asignadas (próximas + historial)

### Mesas próximas
Lista de mesas con `estado === 'Programada'` o `'En_Curso'`.

Cada mesa debe mostrar:
- Nombre del estudiante
- Título del proyecto de investigación (si existe)
- Tipo de mesa: Mesa I / Mesa II / Mesa III (de `tipo_mesa` numérico)
- Rol del profesor en esa mesa (`mesa.rol`)
- Fecha, hora de inicio, hora de fin, aula
- Estado actual con diferenciación visual clara entre Programada / En Curso

Acciones disponibles según estado:
- Si `Programada` **y** es el día de hoy → botón **"Iniciar mesa"** → abre `QuorumModal`
- Si `Programada` y NO es hoy → mensaje informativo (sin botón de acción)
- Si `En_Curso` → botón **"Registrar veredicto"** → abre `VeredictoModal`

### Historial de mesas
Mesas con estados que no son `Programada` ni `En_Curso` (concluidas, con correcciones, reprobadas, etc.).

Cada mesa del historial muestra:
- Nombre del estudiante
- Tipo de mesa y rol
- Fecha
- Estado final
- Veredicto si existe (`mesa.veredicto`)

### Estados de carga y error
- Estado de carga mientras se obtienen los datos (`loading === true`)
- Estado de error si falla la llamada (`error !== null`) con opción de reintentar
- Estado vacío si no hay mesas próximas

---

## Modales (no rediseñar internamente, solo invocarlos)

`QuorumModal` y `VeredictoModal` ya están implementados y funcionan — no se modifican internamente. Solo deben dispararse correctamente desde los botones de cada mesa.

---

## Lógica a preservar sin cambios

```js
// Estado y datos
const [datos, setDatos] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [quorumMesaId, setQuorumMesaId] = useState(null)
const [veredictoMesaId, setVeredictoMesaId] = useState(null)

// Carga de datos
portalesService.getProfesor(session.cedula)

// Separación de listas
const mesasProximas  = datos?.mesas.filter(m => ['Programada', 'En_Curso'].includes(m.estado)) ?? []
const mesasHistorial = datos?.mesas.filter(m => !['Programada', 'En_Curso'].includes(m.estado)) ?? []

// Helper de fecha (conservar exacto)
function esFechaHoy(fechaDDMMYYYY) {
  if (!fechaDDMMYYYY) return false
  const [d, m, y] = fechaDDMMYYYY.split('/').map(Number)
  const hoy = new Date()
  return hoy.getFullYear() === y && hoy.getMonth() + 1 === m && hoy.getDate() === d
}

// Constantes
const TIPO_MESA_LABEL = { 1: 'Mesa I', 2: 'Mesa II', 3: 'Mesa III' }
```

Props del componente: `{ session, onLogout }` — no cambiar.

---

## Tono y dirección creativa

Portal de uso profesional para docentes universitarios. Debe transmitir claridad, confianza y autoridad institucional sin ser frío. El profesor entra, ve lo que tiene que hacer hoy, actúa. Nada superfluo.

La pantalla es de uso frecuente pero breve — el profesor la abre para ver si tiene algo hoy, hace una acción y cierra. El diseño debe facilitar esa lectura inmediata: ¿tengo algo hoy? → sí/no → qué hacer.
