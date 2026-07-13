# UPEL Mesa Manager — Auditoría Técnica de Arquitectura

> Sistema de gestión de mesas de defensa académica para la Universidad Pedagógica Experimental Libertador (UPEL). Arquitectura de escritorio con sidecar FastAPI + frontend React embebido en Tauri.

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Arquitectura General](#2-arquitectura-general)
3. [Módulo `mesas` — Núcleo del sistema](#3-módulo-mesas--núcleo-del-sistema)
4. [Módulo `estudiantes`](#4-módulo-estudiantes)
5. [Módulo `auth`](#5-módulo-auth)
6. [Infraestructura transversal](#6-infraestructura-transversal)
7. [Flujo completo de una petición](#7-flujo-completo-de-una-petición)
8. [Configuración y arranque](#8-configuración-y-arranque)
9. [Módulo `dashboard` — Incidencias y métricas](#9-módulo-dashboard--incidencias-y-métricas)

---

## 1. Stack Tecnológico

| Componente | Tecnología | Versión mínima |
|---|---|---|
| Lenguaje backend | Python | 3.11 |
| Framework API | FastAPI | 0.115.0 |
| Servidor ASGI | Uvicorn (standard) | 0.32.0 |
| Driver PostgreSQL | psycopg2-binary | 2.9.10 |
| Validación de datos | Pydantic | 2.10.0 |
| Hashing de contraseñas | bcrypt | 4.2.0 |
| Generación de reportes | ReportLab | 4.2.0 |
| Empaquetado ejecutable | PyInstaller | 6.11.0 |
| Motor de base de datos | PostgreSQL | 16 |
| Framework de interfaz | React | 19.0 |
| Herramienta de build | Vite | 6.0 |
| Framework de escritorio | Tauri | 2.x |
| Framework CSS | Tailwind CSS | 4.0 |
| Iconos | SVG inline (sin dependencia externa) | — |

---

## 2. Arquitectura General

La solución adopta el patrón de **aplicación de escritorio con sidecar de servidor local**. Tauri levanta una ventana nativa con motor WebView que carga la interfaz React; simultáneamente, el binario FastAPI (sidecar) se ejecuta en segundo plano escuchando en `127.0.0.1:8000`.

```
[ Usuario ]
      │
      ▼
[ Tauri WebView ]  ←→  [ React 19 / Vite ]
      │  HTTP/REST  127.0.0.1:8000
      ▼
[ FastAPI (sidecar) ]
      │  psycopg2 TCP  127.0.0.1:5432
      ▼
[ PostgreSQL 16 ]
```

### Estructura de directorios

```
TESIS-TAURI/
├── core/
│   ├── config.py            Parámetros de conexión a PostgreSQL
│   ├── database.py          Context manager transaccional
│   └── session.py           Dataclass SessionContext (estado de sesión activa)
│
├── features/
│   ├── auth/                Autenticación y gestión de credenciales
│   ├── maestrias/           Catálogo de programas de postgrado
│   ├── estudiantes/         Gestión académica de aspirantes y solvencias
│   ├── profesores/          Registro de docentes evaluadores
│   ├── aulas/               Administración de espacios físicos de defensa
│   ├── mesas/               Núcleo del sistema: programación y monitoreo
│   │   ├── horario.py       Reglas de horario y cálculo de hora_fin
│   │   └── correos.py       Motor asíncrono de notificaciones por correo
│   ├── usuarios/            Administradores del sistema (Jefa/Coordinador)
│   └── dashboard/           Métricas, KPIs y generación de reportes PDF
│
├── api/
│   ├── main.py              Aplicación FastAPI: CORS, lifespan, routers
│   ├── deps.py              Dependencias de autenticación y autorización
│   ├── routers/             Handlers HTTP organizados por módulo
│   └── schemas/             Modelos Pydantic de entrada/salida por módulo
│
├── config_db.py             DDL completo y datos semilla de la base de datos
│
├── src/                     Frontend React (Vite)
│   ├── App.jsx              Componente raíz: health check, gate de autenticación
│   ├── shared/
│   │   ├── lib/api.js       Cliente HTTP centralizado (apiFetch, ApiError)
│   │   ├── lib/session.js   Gestión de sesión en sessionStorage
│   │   └── components/      Layout, Sidebar (colapsable, SVG), Topbar, Modal, SearchableSelect, TableSkeleton
│   └── features/            Módulos de interfaz organizados por funcionalidad
│
└── src-tauri/
    ├── tauri.conf.json      Configuración de ventana, sidecar y empaquetado NSIS
    └── installer/           Recursos del instalador (headerImage.bmp 150×57, sidebarImage.bmp 164×314)
```

### Capas de arquitectura del backend

Cada módulo funcional sigue el orden estricto de dependencias:

| Capa | Archivo | Responsabilidad | Dependencias permitidas |
|---|---|---|---|
| Modelos de dominio | `models.py` | Dataclasses puras que representan entidades | Ninguna (stdlib Python únicamente) |
| Repositorio | `repository.py` | Acceso a datos mediante SQL explícito | `core.database`, `models.py` |
| Servicio | `service.py` | Orquesta repositorios y aplica reglas de negocio; retorna `(bool, str)` | `repository.py`, `models.py` |
| Router | `api/routers/*.py` | Handlers HTTP; valida con Pydantic, delega en el servicio | `service.py`, `api/schemas/*.py` |

---

## 3. Módulo `mesas` — Núcleo del sistema

**Propósito:** Resuelve el problema central del sistema: programar defensas académicas con garantía de no-colisión entre 7 recursos simultáneos (1 aula + 6 docentes), gestionar el ciclo de vida completo de una mesa (6 estados), y proveer portales de consulta pública.

### `features/mesas/repository.py`

#### La Query Base `_SQL_MESAS_BASE` — JOIN de 13 instancias de tablas

```python
FROM  mesas_defensa  m
JOIN  estudiantes    e    ON e.id    = m.id_estudiante
LEFT JOIN maestrias  ma   ON ma.id   = e.maestria_id
JOIN  aulas          a    ON a.id    = m.id_aula
JOIN  profesores     pt   ON pt.id   = m.id_tutor_principal
JOIN  profesores     pts  ON pts.id  = m.id_tutor_suplente
JOIN  profesores     pj1  ON pj1.id  = m.id_jurado1_principal
JOIN  profesores     pj1s ON pj1s.id = m.id_jurado1_suplente
JOIN  profesores     pj2  ON pj2.id  = m.id_jurado2_principal
JOIN  profesores     pj2s ON pj2s.id = m.id_jurado2_suplente
LEFT JOIN profesores pte  ON pte.id  = m.tutor_efectivo_id
LEFT JOIN profesores pj1e ON pj1e.id = m.jurado1_efectivo_id
LEFT JOIN profesores pj2e ON pj2e.id = m.jurado2_efectivo_id
```

La tabla `profesores` se referencia **13 veces** en el mismo `SELECT` usando aliases distintos (`pt`, `pts`, `pj1`, `pj1s`, etc.). Esto es un patrón de **self-join múltiple**: cada alias es una instancia lógica independiente de la misma tabla física.

- Los 6 `INNER JOIN` del comité son obligatorios — el comité siempre existe.
- Los 3 `LEFT JOIN` de asistencia efectiva (`pte`, `pj1e`, `pj2e`) son opcionales — solo se rellenan al registrar quórum.

La constante `_SQL_MESAS_BASE` es compartida por `obtener_detalladas()` y `obtener_monitoreo_hoy()`, a las que se agrega dinámicamente la cláusula `WHERE`. Esto evita duplicar 60+ líneas de SQL y garantiza coherencia de contrato.

---

#### `_verificar_choques_7vias()` — El componente crítico

```python
def _verificar_choques_7vias(
    cur, id_aula, fecha, hora_inicio, hora_fin,
    id_tutor_principal, id_tutor_suplente,
    id_jurado1_principal, id_jurado1_suplente,
    id_jurado2_principal, id_jurado2_suplente,
    id_mesa_excluir=None
) -> None:
```

Esta función es el corazón de seguridad del sistema. Recibe `cur` (cursor activo) en lugar de abrir su propia conexión — **eso es intencional y crítico**.

**Predicado de solapamiento temporal:**

```python
overlap = "(%s < m.hora_fin AND %s > m.hora_inicio)"
# Parámetros: hora_inicio_nueva, hora_fin_nueva
```

Detecta cualquier intersección de intervalos, incluyendo solapamientos parciales y totales. Implementa el teorema de Allen: dos intervalos `[A, B)` y `[C, D)` se solapan si y solo si `A < D AND B > C`.

**Verificación del aula:** consulta mesas con `_ESTADOS_BLOQUEANTES = ("Programada", "En_Curso", "Con_Correcciones")`. Las mesas `Aprobada`, `Reprobada` y `Suspendida` no bloquean el espacio físico.

**Verificación de los 6 docentes:** para cada miembro del comité, busca si aparece en **cualquier posición** de comité en otra mesa con solapamiento temporal. El mismo `id_prof` se repite 6 veces como parámetro porque un docente puede ocupar cualquiera de los 6 roles en otras mesas.

```python
for id_prof, rol in comite_roles:
    cur.execute(
        "WHERE m.fecha = %s AND m.estado = ANY(%s) AND [overlap] "
        "AND (m.id_tutor_principal = %s OR m.id_tutor_suplente = %s "
        "     OR m.id_jurado1_principal = %s OR m.id_jurado1_suplente = %s "
        "     OR m.id_jurado2_principal = %s OR m.id_jurado2_suplente = %s)",
        (fecha, estados, hora_inicio, hora_fin,
         id_prof, id_prof, id_prof, id_prof, id_prof, id_prof)
    )
```

**Por qué es segura frente a condiciones de carrera:** La función opera sobre el cursor `cur` ya dentro de la transacción de `crear_mesa()`. PostgreSQL con `READ COMMITTED` garantiza que filas insertadas por otra transacción concurrente no son visibles hasta su commit. Si dos peticiones compiten por el mismo horario/docente, la segunda verá la fila de la primera y lanzará `ValueError`.

**El parámetro `id_mesa_excluir`:** al editar una mesa existente, la propia mesa ya ocupa el espacio en la BD. Este parámetro agrega `AND m.id != %s` para que la verificación no se choque consigo misma.

#### Filtro temporal de mesas fantasma

Una mesa en estado `Programada` o `En_Curso` cuya `hora_fin` ya pasó puede bloquear falsamente el motor de colisiones — un escenario que ocurre cuando el coordinador olvida registrar el veredicto al concluir la defensa. Para mitigarlo, ambas sub-queries (aula y docentes) incluyen la condición:

```sql
AND (m.fecha + m.hora_fin) > LOCALTIMESTAMP
```

La expresión `DATE + TIME` produce `TIMESTAMP WITHOUT TIME ZONE` en PostgreSQL; `LOCALTIMESTAMP` también es sin zona horaria, haciendo la comparación limpia e independiente de la configuración de `timezone` del servidor. Como efecto colateral, las mesas en estado `Con_Correcciones` —cuyo `hora_fin` siempre queda en el pasado al momento de la consulta— dejan de bloquear recursos sin necesidad de eliminarlas de `_ESTADOS_BLOQUEANTES`.

---

#### `crear_mesa()` — Secuencia transaccional completa

```python
def crear_mesa(id_estudiante, id_aula, fecha, hora_inicio) -> int:
    with get_connection() as (_, cur):
        tipo_mesa = _deducir_tipo_mesa(cur, id_estudiante)   # 1, 2 o 3
        # Verifica solvencia para ese número de mesa específico
        cur.execute(f"SELECT verificado_m{tipo_mesa} FROM estudiantes WHERE id = %s", ...)
        hora_fin = calcular_hora_fin(hora_inicio, tipo_mesa)
        validar_horario_permitido(hora_inicio, hora_fin)
        # Lee snapshot del comité del expediente
        comite = cur.execute("SELECT id_tutor_principal, ... FROM estudiantes WHERE id = %s")
        _verificar_choques_7vias(cur, ...)
        cur.execute("INSERT INTO mesas_defensa (...) RETURNING id")
        return cur.fetchone()[0]
```

Todo ocurre dentro de **un único bloque `with get_connection()`**. Si `_verificar_choques_7vias` lanza `ValueError`, el context manager ejecuta `conn.rollback()` y ninguna fila se inserta. El número de mesa se deduce automáticamente contando las mesas `Aprobada` del estudiante — no hay campo editable por el usuario.

El **snapshot del comité** se copia del expediente al momento de crear la mesa. Si el expediente cambia después, la mesa mantiene el comité original — coherencia histórica garantizada por diseño.

---

#### Autómata finito de estados

| Desde | Hacia | Función |
|---|---|---|
| `Programada` | `En_Curso` | `registrar_quorum()` |
| `Programada` | `Suspendida` | `suspender_mesa()` |
| `En_Curso` | `Aprobada` | `registrar_veredicto("Aprobado")` |
| `En_Curso` | `Con_Correcciones` | `registrar_veredicto("Con_Correcciones")` |
| `En_Curso` | `Reprobada` | `registrar_veredicto("Reprobado")` |
| `Con_Correcciones` | `Aprobada` | `validar_correcciones()` |
| `En_Curso` | `Suspendida` | `suspender_mesa()` |
| `Con_Correcciones` | `Suspendida` | `suspender_mesa()` |

Cada función de transición usa `WHERE id = %s AND estado = 'EstadoEsperado'` en su `UPDATE`. Si la mesa ya cambió de estado, el `UPDATE` afecta 0 filas y `cur.rowcount == 0`. El servicio convierte ese `False` en un error HTTP descriptivo. Es una implementación de **Compare-and-Swap a nivel SQL**.

---

### `features/mesas/service.py`

La capa de servicio aplica solo reglas que requieren lógica Python pura (no SQL):

```python
def registrar_quorum(id_mesa, tutor_efectivo_id, jurado1_efectivo_id,
                     jurado2_efectivo_id, asistencia_estudiante,
                     iniciada_por_profesor_id) -> tuple[bool, str]:
    presentes = [id_ for id_ in [tutor_ef, jurado1_ef, jurado2_ef] if id_ is not None]
    if len(presentes) < 2:
        return False, "Se requiere quórum mínimo de 2 profesores..."
    if iniciada_por_profesor_id not in presentes:
        return False, "El profesor que inicia la mesa debe ser uno de los presentes."
```

Las dos reglas de quórum son lógica de negocio pura. No tienen sentido en SQL.

El servicio también despacha el correo asíncrono **después** del commit de la transacción:

```python
def registrar(id_estudiante, id_aula, fecha_str, hora_inicio_str):
    id_mesa = repository.crear_mesa(...)   # Commit de la transacción
    correos.enviar_notificacion_async(id_mesa)  # threading.Thread, no bloquea
    return True, "Mesa de defensa programada exitosamente."
```

Si el correo se enviara dentro de la transacción y SMTP fallara, el rollback eliminaría la mesa — comportamiento incorrecto. La separación es semánticamente correcta.

---

### `api/routers/mesas.py`

```
POST   /api/mesas/                          → registrar() → HTTP 201
PUT    /api/mesas/{id}                      → editar()
PATCH  /api/mesas/{id}/quorum              → SessionDep (cualquier autenticado)
PATCH  /api/mesas/{id}/veredicto           → SessionDep
PATCH  /api/mesas/{id}/validar-correcciones → SessionDep
PATCH  /api/mesas/{id}/suspender           → JefaDep (solo Jefa)
GET    /api/mesas/portal/profesor/{cedula}  → público, sin autenticación
GET    /api/mesas/portal/estudiante/{cedula} → público, sin autenticación
GET    /api/mesas/monitoreo                → SessionDep
```

El filtrado por maestría es transparente — `maestria_id` viene del token de sesión, no del request del cliente:

```python
@router.get("/")
def listar_mesas(sesion: SessionDep, ...):
    maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
    mesas = service.obtener_todas(maestria_id)
```

Un coordinador es estructuralmente incapaz de solicitar mesas de otra maestría, incluso si conoce el ID.

---

### Frontend: `ProgramarView.jsx` + `VisualizarView.jsx`

**`ProgramarView.jsx`** implementa un formulario progresivo en 4 pasos:

1. Selección de estudiante — filtra automáticamente candidatos con solvencia verificada y sin mesa activa (`getEstudiantesAsignados()`)
2. El comité se muestra en modo lectura con ícono de candado — comunica visualmente la inmutabilidad
3. Validaciones client-side preventivas: fecha no puede ser fin de semana, hora entre 08:00 y 13:00, `hora_fin` calculada no puede superar 13:00

Las validaciones del cliente son **preventivas** (UX), no de seguridad. El backend tiene validaciones independientes.

**`VisualizarView.jsx`** (903 líneas) gestiona estado complejo:

- **Filtros backend** (fecha_desde, fecha_hasta): enviados como query params al servidor
- **Filtros frontend** (tutor, aula, estudiante, estado): aplicados sobre datos cargados con `useMemo`
- **Dos vistas** (tabla y calendario semanal): el mismo array de datos, distinta representación
- **Máquina de estados de UI**: un objeto `{ [estado]: { label, color, icon } }` mapea los 6 estados del autómata a colores y badges — coherencia visual sin condicionales dispersos

---

## 4. Módulo `estudiantes`

**Propósito:** Gestiona el expediente académico del aspirante — el punto de partida causal de todo el sistema. Sin estudiante completo (comité de 6, solvencia verificada), no puede existir una mesa.

### `features/estudiantes/service.py` — Invariante del comité único

```python
def _validar_comite_unico(ids: list[int | None]) -> tuple[bool, str]:
    presentes = [i for i in ids if i is not None]
    if len(presentes) != len(set(presentes)):
        return False, "Todos los miembros del comité deben ser profesores distintos."
    return True, ""
```

Los 6 miembros del comité deben ser 6 personas diferentes. `set()` detecta duplicados en O(n). La validación ocurre en el servicio porque es una regla del dominio académico, no una restricción SQL ni de formato.

**Inmutabilidad del comité:** el router de `PUT /{id_est}` usa el esquema `EstudianteUpdate`, que excluye los campos del comité. Una vez designado por resolución académica, el comité no puede modificarse. Si se cambiara el comité en el expediente, las mesas ya programadas tendrían su snapshot desacoplado — la inmutabilidad preserva coherencia histórica.

### `features/estudiantes/repository.py` — Solvencia por mesa

```python
def obtener_para_mesa(maestria_id, numero_mesa) -> list[Estudiante]:
    # Filtra estudiantes con verificado_m{numero_mesa} = TRUE
    # y sin mesa activa (Programada, En_Curso, Con_Correcciones)
```

Este método alimenta el `SearchableSelect` de estudiantes en `ProgramarView`. Solo muestra candidatos realmente elegibles, eliminando una clase completa de errores del usuario.

### Aislamiento multi-tenancy

```python
def actualizar(id_est, maestria_id, ...):
    if not existe_en_maestria(id_est, maestria_id):
        raise PermissionError(...)
```

La función `existe_en_maestria()` es la segunda línea de defensa (la primera es la cláusula `WHERE` en el listado). Incluso si un coordinador conoce el ID numérico de un estudiante de otra maestría e intenta `PUT /api/estudiantes/99`, el repositorio verifica explícitamente la pertenencia antes de actualizar. Principio de **defensa en profundidad**.

### Frontend: `RegistrosEstudiantesView.jsx` — Modal de Solvencia

El modal de solvencia presenta lógica contextual según el estado de verificación del pago:

- **Mesa ya verificada** — muestra los datos del pago en modo lectura (número de recibo y monto formateado). No permite edición.
- **Mesa pendiente** — presenta el formulario de registro con inputs de recibo y monto.

Al abrirse, el modal auto-navega a la primera mesa sin verificar. El botón "Registrar" se oculta para tabs de mesas ya verificadas.

**Detalle de implementación:** Pydantic v2 serializa los campos `Decimal` de PostgreSQL como cadenas de texto JSON (`"450.50"` en lugar de `450.50`). El componente usa `Number(monto ?? 0).toFixed(2)` para convertir el valor antes de mostrarlo; llamar `.toFixed()` directamente sobre la cadena lanzaría `TypeError` y colapsaría el árbol de componentes React.

---

## 5. Módulo `auth`

**Propósito:** Gestiona autenticación (¿quién eres?) y autorización (¿qué puedes hacer?), con migración transparente de algoritmo de hashing legacy.

### `api/routers/auth.py` — Tres mecanismos de protección

**1. Protección anti-timing attack:**

```python
_DUMMY_HASH = bcrypt.hashpw(b"dummy", bcrypt.gensalt(rounds=12))

def login(...):
    fila = repository.buscar_fila_por_cedula(cedula)
    if fila is None:
        bcrypt.checkpw(contrasena.encode(), _DUMMY_HASH)  # Consume tiempo similar
        raise HTTPException(401)
```

Sin esto, un atacante mediría la diferencia de latencia: ~200ms (bcrypt ejecutado) indica usuario existente; ~1ms (retorno inmediato) indica usuario inexistente. El hash ficticio elimina esa diferencia.

**2. Migración transparente SHA-256 → bcrypt:**

```python
hash_almacenado = fila[4]
if hash_almacenado.startswith(("$2b$", "$2a$", "$2y$")):
    ok = bcrypt.checkpw(contrasena.encode(), hash_almacenado.encode())
else:
    ok = (hashlib.sha256(contrasena.encode()).hexdigest() == hash_almacenado)
    if ok:
        nuevo = bcrypt.hashpw(contrasena.encode(), bcrypt.gensalt(12)).decode()
        repository.actualizar_contrasena(cedula, nuevo)
```

El primer login exitoso con hash legacy actualiza silenciosamente el hash a bcrypt. La detección es por prefijo (`$2b$` es el prefijo estándar de bcrypt). El usuario no percibe nada.

**3. Sesiones en memoria con UUID v4:**

```python
# api/deps.py
_sessions: dict[str, SessionContext] = {}

def create_session(context: SessionContext) -> str:
    token = str(uuid.uuid4())
    _sessions[token] = context
    return token
```

Tokens UUID v4 (128 bits de entropía aleatoria), almacenados en un diccionario en memoria. Ventajas: revocación instantánea, sin base de datos adicional, tiempo de validación O(1). Si el proceso se reinicia, todas las sesiones se invalidan — comportamiento correcto para una app de escritorio donde servidor y cliente comparten el mismo ciclo de vida.

**El rol `Consultor` — acceso sin credenciales:**

```python
@router.post("/login-consultor")
def login_consultor(body: ConsultorRequest):
    resultado = repository.buscar_cedula_en_tablas(body.cedula)
    # Busca en estudiantes y profesores, NO en usuarios
    # Retorna tipo_consultor = "Estudiante" | "Profesor"
```

La "autenticación" es solo identificación por cédula en el directorio académico. El `SessionContext` resultante tiene `rol="Consultor"` y es rechazado en todos los endpoints de escritura vía `require_coordinador()` o `require_jefa()`.

---

### `api/deps.py` — Inyección de dependencias declarativa

```python
SessionDep     = Annotated[SessionContext, Depends(get_session)]
JefaDep        = Annotated[SessionContext, Depends(require_jefa)]
CoordinadorDep = Annotated[SessionContext, Depends(require_coordinador)]
```

FastAPI resuelve estas dependencias antes de llamar al handler. Si `get_session()` no encuentra el token, retorna `HTTP 401` sin que el handler llegue a ejecutarse. Si `require_jefa()` encuentra `rol != "Jefa"`, retorna `HTTP 403`. El handler asume siempre usuario válido y rol correcto — sin verificaciones redundantes.

```python
def ok_or_400(result: tuple[bool, str]):
    ok, msg = result
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
```

Convierte el patrón `(bool, str)` del service layer en excepciones HTTP sin código repetido. Uso en cada handler:

```python
ok_or_400(service.registrar(id_est, id_aula, fecha, hora_inicio))
```

---

## 6. Infraestructura transversal

### `core/database.py` — Atomicidad transaccional

```python
@contextmanager
def get_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise           # Re-lanza para que el service layer capture el error
    finally:
        cur.close()
        conn.close()
```

El `raise` en el bloque `except` es esencial: re-lanza la excepción original después del rollback. Sin él, los errores quedarían silenciados.

### `src/shared/lib/api.js` — Punto de contacto único con el servidor

```javascript
async function apiFetch(path, options = {}) {
    const token = getToken();
    // Inyecta token en cada request
    // 401 → auto-logout si hay sesión activa
    // Otros errores → ApiError con status y detail del servidor
}
```

Ningún componente llama a `fetch()` directamente. Esta centralización garantiza que el token siempre se inyecta, el logout por sesión expirada es automático y uniforme, y los errores del servidor se normalizan antes de llegar a los componentes.

### Matriz de permisos

| Recurso | Operación | Jefa (global) | Coordinador (por maestría) | Consultor (público) |
|---|---|:---:|:---:|:---:|
| **Usuarios** | Crear / Editar / Eliminar | ✓ | — | — |
| **Estudiantes** | Listar | ✓ Todos | ✓ Solo su maestría | — |
| **Estudiantes** | Crear | ✓ Especifica maestría | ✓ Forzado a su maestría | — |
| **Estudiantes** | Editar / Actualizar solvencia | ✓ Cualquiera | ✓ Si pertenece a su maestría | — |
| **Estudiantes** | Eliminar | ✓ | — | — |
| **Profesores** | CRUD completo | ✓ | — | — |
| **Aulas** | CRUD completo | ✓ | — | — |
| **Mesas** | Listar / Monitoreo | ✓ Todas | ✓ Solo su maestría | — |
| **Mesas** | Crear / Editar | ✓ | ✓ | — |
| **Mesas** | Suspender | ✓ | — | — |
| **Mesas** | Quórum / Veredicto / Correcciones | ✓ | ✓ | — |
| **Dashboard** | KPIs / Reporte PDF | ✓ Global | ✓ Su maestría | — |
| **Portales** | Consultar por cédula | — | — | ✓ Sin autenticación |

---

## 7. Flujo completo de una petición

### Ejemplo: Programar una mesa de defensa

```
ProgramarView.jsx
  └─ onSubmit → mesasService.create({ id_estudiante, id_aula, fecha, hora_inicio })
       └─ apiFetch("POST /api/mesas/", body)
            └─ FastAPI Router
                 └─ MesaCreate (Pydantic valida formatos: fecha YYYY-MM-DD, hora HH:MM)
                      └─ service.registrar(id_est, id_aula, fecha, hora_inicio)
                           └─ repository.crear_mesa(...)  [una sola transacción]
                                ├─ _deducir_tipo_mesa()       → tipo: 1, 2 o 3
                                ├─ verificar solvencia_m{tipo}
                                ├─ calcular_hora_fin()
                                ├─ validar_horario_permitido()
                                ├─ leer comité del expediente (snapshot)
                                └─ _verificar_choques_7vias()
                                     └─ INSERT INTO mesas_defensa RETURNING id
                           └─ correos.enviar_notificacion_async(id_mesa)
                 └─ HTTP 201 { id, tipo_mesa, hora_fin, estado, ... }
  └─ pantalla de éxito con resumen
```

**Semántica de errores por capa:**

| Capa | Código HTTP | Causa |
|---|---|---|
| Router (Pydantic) | `422 Unprocessable Entity` | Formato de datos inválido |
| Service layer | `400 Bad Request` | Regla de negocio violada (colisión, sin solvencia, horario inválido) |
| Base de datos | `500 Internal Server Error` | Error estructural (constraint, FK) |

Las tres capas son muros independientes, no redundantes entre sí.

---

## 8. Configuración y arranque

### Requisitos del sistema

| Componente | Requisito mínimo |
|---|---|
| Sistema operativo | Windows 10/11 (64-bit) o Ubuntu 20.04 LTS |
| Procesador | x86-64, 2 núcleos, 2 GHz |
| Memoria RAM | 4 GB |
| PostgreSQL | Versión 16, en ejecución local o en red LAN |
| Python | 3.11 o superior |
| Node.js | 20 LTS o superior |

### Backend (Python / FastAPI)

```bash
# Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1          # Windows PowerShell
source venv/bin/activate             # Linux / macOS

# Instalar dependencias
pip install -r requirements.txt

# Inicializar base de datos con esquema y datos semilla
python config_db.py --recrear

# Iniciar servidor de desarrollo
uvicorn api.main:app --reload --port 8000
```

### Frontend (React / Vite)

```bash
npm install
npm run dev          # Servidor de desarrollo en puerto 5173
npm run build        # Build de producción
```

### Variables de entorno — Sistema de correos

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=postgrado.upel.rubio@gmail.com
SMTP_PASSWORD=<contraseña_de_aplicación_Gmail>
```

Si las variables no están definidas, el sistema omite el envío de correos sin afectar la programación de la mesa.

### Build completo — Aplicación de escritorio

```bash
python scripts/build_sidecar.py   # Compila sidecar FastAPI como ejecutable autónomo
npm run tauri build               # Genera instalador .exe en Windows (~25 MB)
```

El instalador generado (`src-tauri/target/release/bundle/nsis/`) incluye:
- Interfaz en **español latinoamericano** (`SpanishInternational`)
- Imagen de bienvenida institucional (`sidebarImage.bmp`, 164×314 px)
- Imagen de cabecera en pantallas interiores (`headerImage.bmp`, 150×57 px)
- Publisher: **UPEL** / Copyright: **© 2026 Universidad Pedagógica Experimental Libertador**
- Instalación sin privilegios de administrador (`installMode: currentUser`)

Para actualizar las imágenes del instalador, reemplaza los PNG en `src-tauri/installer/` y ejecuta el script de conversión antes de hacer el build:

```powershell
# Convertir PNG a BMP con dimensiones exactas (PowerShell)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("installer/sidebarImage.png")
$bmp = New-Object System.Drawing.Bitmap(164, 314)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, 164, 314)
$bmp.Save("installer/sidebarImage.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
```

### Credenciales de prueba (datos semilla)

| Rol | Cédula | Contraseña | Maestría |
|---|---|---|---|
| Jefa Administradora | 00000000 | admin123 | Ninguna (acceso global) |
| Coordinador (IE) | 32785839 | 123412 | Innovación Educativa |
| Coordinador (GE) | 00000001 | coordinador123 | Gerencia Educacional |
| Coordinador (PG) | 00000002 | coordinador123 | Planificación Global |
| Coordinador (EAD) | 00000003 | coordinador123 | Educación, Ambiente y Desarrollo |
| Coordinador (EEF) | 00000004 | coordinador123 | Enseñanza de la Educación Física |
| Coordinador (REC) | 00000005 | coordinador123 | Recreación |
| Coordinador (INF) | 00000006 | coordinador123 | Informática Educativa |
| Coordinador (OE) | 00000007 | coordinador123 | Orientación Educativa |

La documentación interactiva de la API está disponible en `http://127.0.0.1:8000/docs` mientras el servidor de desarrollo está activo.

---

## 9. Módulo `dashboard` — Incidencias y métricas

### `GET /api/dashboard/pendientes-cierre` — Detección de mesas fantasma

Detecta mesas cuya ventana temporal ya venció pero que siguen en estado activo (`Programada` o `En_Curso`). Implementa la cadena estándar de capas del sistema:

| Capa | Artefacto | Detalle |
|---|---|---|
| Dominio | `features/dashboard/models.py` — `MesaPendienteCierre` | Dataclass con 10 campos: `id`, `estudiante`, `titulo`, `fecha`, `hora_inicio`, `hora_fin`, `aula`, `tipo_mesa`, `estado`, `maestria` |
| Repositorio | `features/dashboard/repository.py` — `obtener_pendientes_cierre()` | `WHERE estado IN ('Programada','En_Curso') AND (fecha + hora_fin) < LOCALTIMESTAMP` |
| Servicio | `features/dashboard/service.py` | Envuelve el repositorio con captura de `psycopg2.Error`; retorna `[]` en fallo |
| Schema | `api/schemas/dashboard.py` — `MesaPendienteCierreOut` | Serialización Pydantic de los 10 campos |
| Router | `api/routers/dashboard.py` | Inyecta `maestria_id` del token igual que todos los endpoints del dashboard |

El filtrado multi-tenancy es automático: los coordinadores reciben solo las incidencias de su programa; la Jefa ve el sistema completo.

### Widget de Incidencias en `DashboardView.jsx`

El frontend consume el endpoint al cargar el dashboard y presenta tres elementos:

**1. Banner de alerta ámbar** — visible únicamente cuando `incidencias.length > 0`. Muestra el contador y un botón "Ver incidencias". Usa `border-amber-500/40 bg-amber-500/5` (opacidad Tailwind) para compatibilidad con modo oscuro sin clases condicionales.

**2. Modal de lista** — una tarjeta por incidencia con nombre de estudiante, título del proyecto, fecha/hora/aula y un botón de acción determinado por el estado:

| Estado de la mesa | Acción | Componente |
|---|---|---|
| `En_Curso` | Registrar Veredicto | `VeredictoForm` |
| `Programada` | Reprogramar | `ReprogramarForm` |

**3. `VeredictoForm`** — 3 tarjetas de radio-button con color semántico (verde / ámbar / rojo). Cuando se selecciona `Con_Correcciones`, aparece un input de días con la fecha límite calculada en tiempo real. Llama a `mesasService.registrarVeredicto(id, {veredicto, dias_correccion})`.

**4. `ReprogramarForm`** — carga la lista de aulas del backend al montar el componente. Valida que la nueva fecha no sea fin de semana. Llama a `mesasService.editar(id, {id_aula, fecha, hora_inicio})`.

Tras cada operación exitosa, `incidencias` se refresca y la mesa resuelta desaparece del widget.

### `src/shared/components/TableSkeleton.jsx`

Componente genérico React para estados de carga de tablas. API:

```jsx
// Preset de estudiantes (7 cols) — valor por defecto
{loading && <TableSkeleton />}

// Preset de mesas (8 cols), 6 filas
{loading && <TableSkeleton cols={COLS_MESAS} rows={6} />}
```

Cada descriptor de columna define `bars` (array de clases Tailwind de anchura) y `center` (alineación). El componente cicla los anchos con `rowIdx % bars.length` para crear variación visual sin definir un valor por fila. Los placeholders usan `animate-pulse bg-slate-200 dark:bg-slate-700/50`, compatibles con modo oscuro sin clases condicionales.

Presets exportados: `COLS_ESTUDIANTES` (7 columnas: identificación, nombre, cohorte, maestría, solvencia, estado, acciones) y `COLS_MESAS` (8 columnas: tipo, estudiante, tutor, aula, fecha, horario, estado, acciones).
