# CAPÍTULO IV: IMPLEMENTACIÓN Y ARQUITECTURA DEL SISTEMA

---

## 4.1 Marco Tecnológico

### 4.1.1 Stack Tecnológico

El sistema UPEL Mesa Manager fue construido sobre un conjunto de herramientas modernas de código abierto, seleccionadas por su madurez, soporte comunitario activo y adecuación al paradigma de arquitectura desacoplada. La Tabla 4.1 describe cada componente con su versión mínima requerida y licencia de distribución.

**Tabla 4.1. Componentes tecnológicos del sistema UPEL Mesa Manager.**

| Componente | Tecnología | Versión mínima | Licencia |
|---|---|---|---|
| Lenguaje backend | Python | 3.11 | PSF License |
| Framework API | FastAPI | 0.115.0 | MIT |
| Servidor ASGI | Uvicorn (standard) | 0.32.0 | BSD |
| Driver PostgreSQL | psycopg2-binary | 2.9.10 | LGPL |
| Validación de datos | Pydantic | 2.10.0 | MIT |
| Hashing de contraseñas | bcrypt | 4.2.0 | Apache 2.0 |
| Generación de reportes | ReportLab | 4.2.0 | BSD |
| Empaquetado ejecutable | PyInstaller | 6.11.0 | GPLv2+ |
| Motor de base de datos | PostgreSQL | 16 | PostgreSQL License |
| Framework de interfaz | React | 19.0 | MIT |
| Herramienta de build | Vite | 6.0 | MIT |
| Framework de escritorio | Tauri | 2.x | MIT / Apache 2.0 |
| Framework CSS | Tailwind CSS | 4.0 | MIT |
| Tipografía display | Playfair Display | — | SIL OFL |
| Tipografía cuerpo | IBM Plex Sans | — | SIL OFL |

**Paradigma de base de datos:** Relacional (RDBMS). PostgreSQL fue seleccionado sobre alternativas NoSQL por su soporte nativo a restricciones de integridad referencial (claves foráneas), tipos de dato precisos para la gestión de horarios (`DATE`, `TIME`) y garantías transaccionales ACID —propiedades esenciales en un sistema que debe detectar superposición de horarios y mantener consistencia en el ciclo de vida de las mesas de defensa.

**Herramientas auxiliares de desarrollo:**

- **Git**: control de versiones distribuido para seguimiento de cambios y coordinación de trabajo.
- **npm / Node.js 20+**: gestor de dependencias del frontend y servidor de desarrollo integrado de Vite.
- **Entorno virtual Python (venv)**: aislamiento de dependencias del backend, garantizando reproducibilidad del entorno de ejecución.
- **PyInstaller**: empaqueta el servidor FastAPI en un binario ejecutable autónomo, denominado *sidecar*, que se distribuye junto al instalador nativo generado por Tauri.

---

### 4.1.2 Paradigma de Aplicación — Arquitectura Sidecar Desktop

La solución adopta el patrón de **aplicación de escritorio con sidecar de servidor local**. Tauri levanta una ventana nativa con motor WebView que carga la interfaz React; simultáneamente, el binario FastAPI (sidecar) se ejecuta en segundo plano escuchando peticiones en `127.0.0.1:8000`. Esta arquitectura cumple dos objetivos: (1) evita exponer la base de datos a redes externas, ya que toda comunicación ocurre en la interfaz de loopback del sistema operativo; y (2) permite empaquetar la aplicación completa —frontend, backend y sus dependencias— en un único instalador para el usuario final.

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

La ventana de la aplicación se configura para abrirse automáticamente **maximizada** al iniciar, con un ancho base de 1280×768 píxeles y un mínimo de 1024×640, garantizando compatibilidad con los equipos de cómputo disponibles en la institución. El redimensionamiento está deshabilitado (`resizable: false`) para preservar la integridad del diseño de interfaz. Las decoraciones nativas del sistema operativo (barra de título, botones de control de ventana) están activas, mientras que la transparencia de fondo se mantiene desactivada para garantizar la legibilidad en todos los entornos.

---

## 4.2 Análisis Funcional

### 4.2.1 Módulos Eliminados versus Módulos Nuevos

La versión 2.0 del sistema implicó una reestructuración completa del diseño original. La Tabla 4.2 contrasta los conceptos presentes en la versión inicial con los módulos implementados en la versión actual, identificando la causa institucional que motivó cada cambio.

**Tabla 4.2. Análisis comparativo de módulos: versión 1.x versus versión 2.0.**

| Módulo / Concepto | Estado en v1.x | Módulo nuevo en v2.0 | Falla institucional resuelta |
|---|---|---|---|
| Gestión de maestrías | Inexistente; todos los estudiantes en una tabla plana sin distinción de programa | `features/maestrias` con catálogo de 8 programas de postgrado reales (IE, GE, PG, EAD, EEF, REC, INF, OE) | La UPEL opera 8 maestrías con coordinadores independientes; la ausencia de este módulo impedía el aislamiento operacional entre programas |
| Aislamiento de datos por rol | Acceso global sin restricción de maestría | Multi-tenancy implícito: `sesion.maestria_id` filtra cada consulta SQL | Un coordinador podía visualizar y modificar expedientes y mesas de estudiantes de otros programas académicos |
| Solvencia del estudiante | Columna booleana única `pago_mesa` por estudiante | 3 grupos de columnas `(recibo_mN, monto_mN, verificado_mN)` en la tabla `estudiantes` | El proceso real exige verificar el arancel de aval para cada una de las tres mesas de defensa en forma independiente; la implementación anterior solo admitía un pago global |
| Comité evaluador | Tres claves foráneas simples (tutor, jurado1, jurado2) en la mesa | 6 FK en `estudiantes` (comité fijado por resolución) + copia *snapshot* en `mesas_defensa` | El comité es designado por resolución académica antes de la defensa y es inmutable; su definición debe constar en el expediente del aspirante, no ser elegida al momento de programar la mesa |
| Anti-colisiones de horario | Verificación únicamente del aula | Motor de verificación 7-vías: aula + 6 docentes del comité (3 principales + 3 suplentes) | Los docentes suplentes podían quedar programados en dos mesas simultáneas sin que el sistema lo detectara, generando conflictos de asistencia |
| Ciclo de vida de la mesa | `Programada → Finalizada | Suspendida` (2 estados finales) | Autómata finito completo: `Programada → En_Curso → Aprobada | Con_Correcciones → Aprobada | Reprobada | Suspendida` | No existía distinción entre mesas en ejecución, con veredicto diferido (correcciones) o concluidas definitivamente, lo que dificultaba el monitoreo y los reportes |
| Registro de asistencia | Columnas booleanas por cargo sin validación de quórum | `registrar_quorum()` con validación de quórum mínimo ≥ 2 docentes presentes y registro del profesor que inicia el acto | Una defensa podía marcarse como iniciada sin cumplir el quórum reglamentario establecido por la normativa de postgrado |
| Portales de consulta | Inexistentes | `GET /portal/profesor/{cedula}` y `GET /portal/estudiante/{cedula}` (acceso público sin autenticación) | Docentes y aspirantes no podían consultar el estado de sus mesas sin poseer credenciales administrativas |
| Notificaciones por correo | Ninguna | Motor asíncrono SMTP: 7 destinatarios al programar mesa (`threading.Thread`) | Los integrantes del comité no recibían confirmación automática al programarse una defensa, dependiendo de comunicación informal |
| Dashboard analítico | Estadísticas globales sin filtro de programa | KPIs, heatmap de actividad (18 semanas), próximas defensas y reporte PDF filtrados por maestría | Los coordinadores visualizaban métricas del sistema completo en lugar de las correspondientes exclusivamente a su programa |
| Autenticación | SHA-256 sin salt | bcrypt con factor de costo 12 y migración transparente en primer login | SHA-256 sin salt es vulnerable a ataques por tabla arco iris; bcrypt incorpora salt aleatorio y costo computacional adaptable |

### 4.2.2 Nuevos Conceptos de Ingeniería Introducidos

**Arquitectura REST desacoplada.** El backend expone una interfaz HTTP estándar con verbos semánticos (GET, POST, PUT, PATCH, DELETE) y códigos de estado normativos (200, 201, 204, 400, 401, 403, 409). El frontend actúa exclusivamente como cliente consumidor de esta API; ninguna lógica de negocio —validaciones de horario, anti-colisiones, gestión de estados— reside en la capa de presentación. Este desacoplamiento permite que cualquier cliente alternativo (aplicación móvil, herramienta de integración) consuma los mismos endpoints sin modificaciones en el servidor.

**Persistencia relacional con integridad referencial a nivel de motor.** El esquema de base de datos emplea claves foráneas con la restricción `ON DELETE RESTRICT` y cláusulas `CHECK` definidas directamente en PostgreSQL. Esto garantiza que la base de datos rechace datos inconsistentes —un coordinador sin maestría asignada, un estado de mesa inválido, un componente del comité referenciando un docente inexistente— independientemente de la capa de aplicación que genere la operación.

**Separación de responsabilidades por capas (Layered Architecture).** Cada módulo funcional (*feature*) sigue el orden estricto de dependencias definido en la Tabla 4.3.

**Tabla 4.3. Capas de arquitectura del backend y sus responsabilidades.**

| Capa | Archivo | Responsabilidad | Dependencias permitidas |
|---|---|---|---|
| Modelos de dominio | `models.py` | Dataclasses puras que representan las entidades del sistema | Ninguna (biblioteca estándar de Python únicamente) |
| Repositorio | `repository.py` | Acceso a datos mediante SQL explícito; retorna modelos del dominio o lanza `psycopg2.Error` | `core.database`, `models.py` |
| Servicio | `service.py` | Orquesta repositorios y aplica reglas de negocio; retorna tupla `(bool, str)` | `repository.py`, `models.py` |
| Router | `api/routers/*.py` | Handlers HTTP; valida entrada con Pydantic, delega en el servicio, serializa la respuesta | `service.py`, `api/schemas/*.py` |

**Validación en tres niveles independientes.** La validación de entradas ocurre en tres capas que no se superponen: (1) esquemas Pydantic en la frontera HTTP, que rechazan formatos incorrectos antes de que la petición entre al sistema; (2) lógica de negocio en el service layer, que aplica reglas del dominio (horario permitido, quórum mínimo, solvencia verificada); y (3) restricciones SQL en la base de datos, que constituyen la última línea de defensa contra inconsistencias estructurales.

**Inyección de dependencias declarativa.** FastAPI resuelve automáticamente los requisitos de autenticación y autorización declarados en la firma de cada handler mediante el mecanismo `Depends`. Los alias tipados `SessionDep`, `JefaDep` y `CoordinadorDep` concentran la lógica de verificación en un único punto, eliminando código repetido y garantizando que cualquier cambio en las reglas de acceso se propague de forma automática a todos los endpoints que los utilizan.

**Máquina de estados explícita con transacciones atómicas.** El ciclo de vida de una mesa de defensa se modela como un autómata finito determinista con seis estados y transiciones estrictamente controladas. Cada transición es una función atómica ejecutada dentro de una transacción SQL: si la operación falla por cualquier motivo, el gestor de contexto `get_connection()` ejecuta automáticamente un `ROLLBACK`, dejando la base de datos en el estado anterior.

---

## 4.3 Arquitectura e Integración

### 4.3.1 Estructura de Directorios del Proyecto

La organización del repositorio refleja los principios de separación de responsabilidades descritos en la sección anterior. La Tabla 4.4 detalla los directorios principales y su propósito.

**Tabla 4.4. Estructura de directorios del proyecto UPEL Mesa Manager.**

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
│   ├── mesas/               Núcleo del sistema: programación, monitoreo
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
│   ├── App.jsx              Componente raíz: health check, gate de auth
│   ├── shared/
│   │   ├── lib/api.js       Cliente HTTP centralizado (apiFetch, ApiError)
│   │   ├── lib/session.js   Gestión de sesión en sessionStorage
│   │   └── components/      Layout, Sidebar (colapsable, SVG), Topbar, Modal, SearchableSelect
│   └── features/            Módulos de interfaz organizados por funcionalidad
│
└── src-tauri/
    ├── tauri.conf.json      Configuración de ventana, sidecar y empaquetado NSIS
    └── installer/           Recursos visuales del instalador (BMP 150×57 y 164×314)
```

### 4.3.2 Mecanismo de Conexión — API RESTful con Esquemas Pydantic

**Esquemas Pydantic como contrato de interfaz.** Cada endpoint HTTP define explícitamente un modelo de entrada (*request body*) y un modelo de salida (*response model*) mediante clases derivadas de `BaseModel` de Pydantic. Este contrato proporciona tres beneficios simultáneos: validación automática de tipos y formatos antes de que la petición alcance el router; serialización y deserialización JSON sin código adicional; y generación automática de documentación interactiva en formato OpenAPI, accesible en `/docs` durante el desarrollo.

El siguiente fragmento ilustra el contrato para la creación de una mesa de defensa:

```python
# api/schemas/mesas.py

class MesaCreate(BaseModel):
    id_estudiante: int
    id_aula: int
    fecha: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")   # Formato YYYY-MM-DD
    hora_inicio: str = Field(pattern=r"^\d{2}:\d{2}$")   # Formato HH:MM

class MesaOut(BaseModel):
    id: int
    tipo_mesa: int        # Deducido automáticamente por el backend (1, 2 o 3)
    estado: str           # Estado actual del ciclo de vida
    hora_fin: str         # Calculada a partir de tipo_mesa y hora_inicio
    # ... más de 40 campos adicionales de estudiante, aula y comité evaluador
```

**Acceso directo a SQL versus ORM.** El sistema utiliza el driver **psycopg2** con instrucciones SQL explícitas, en lugar de un mapeador objeto-relacional como SQLAlchemy. Esta decisión permite consultas altamente optimizadas con JOINs complejos —la consulta base de mesas combina siete tablas en un único `SELECT`— y control preciso sobre el plan de ejecución del motor PostgreSQL. El costo asociado es mayor verbosidad en el código de repositorio, mitigado por la centralización de la consulta base en una constante compartida `_SQL_MESAS_BASE`.

**Serialización de tipos numéricos (Pydantic v2).** A diferencia de la versión anterior de Pydantic, la versión 2.x serializa los campos de tipo `Decimal` de Python —empleados para representar valores monetarios precisos como los montos de solvencia— como cadenas de texto JSON en lugar de números de punto flotante. Esta decisión preserva la precisión decimal en la transferencia, pero requiere una conversión explícita en el cliente. Los componentes del frontend que muestran o calculan con estos valores aplican `Number(valor ?? 0).toFixed(2)` antes de cualquier operación aritmética, evitando errores de tipo que de otro modo colapsarían el árbol de componentes React con una pantalla en blanco.

**Transacciones gestionadas por context manager.** El módulo `core/database.py` implementa un generador de contexto que encapsula el ciclo completo de una transacción:

```python
# core/database.py

@contextmanager
def get_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()          # Confirma si no hubo excepción
    except Exception:
        conn.rollback()        # Revierte ante cualquier error
        raise
    finally:
        cur.close()
        conn.close()
```

Toda operación de escritura —crear, actualizar, registrar quórum, emitir veredicto, transicionar estado— ocurre dentro de este contexto. Ante cualquier excepción (fallo de validación, error de integridad referencial, violación de restricción), la base de datos revierte automáticamente todos los cambios del bloque, incluidas las verificaciones anti-colisión ejecutadas previamente en la misma transacción.

### 4.3.3 Flujo de Datos entre Cliente y Servidor

El flujo de una petición desde la interfaz de usuario hasta la base de datos y su retorno sigue la cadena de capas ilustrada a continuación:

```
[ Componente React ]
        │  importa
        ▼
[ *Service.js ]                ← src/features/<feature>/services/
        │  invoca
        ▼
[ apiFetch(ruta, opciones) ]   ← src/shared/lib/api.js
        │  inyecta: Authorization: Bearer <token>
        │  protocolo HTTP/JSON
        ▼
[ FastAPI Router ]             ← api/routers/<feature>.py
        │  valida con esquema Pydantic
        │  delega en
        ▼
[ Feature Service ]            ← features/<feature>/service.py
        │  aplica lógica de negocio
        │  llama
        ▼
[ Feature Repository ]         ← features/<feature>/repository.py
        │  ejecuta SQL con psycopg2
        ▼
[ PostgreSQL 16 ]
```

**Gestión centralizada de errores en el cliente.** La función `apiFetch` en `src/shared/lib/api.js` es el único punto de contacto entre los servicios del frontend y el servidor HTTP. Normaliza el manejo de respuestas: una respuesta con código 401 desencadena el cierre de sesión automático y recarga de la aplicación; cualquier otro error HTTP se convierte en un objeto `ApiError` con atributos `status` (código HTTP) y `detail` (mensaje del servidor), que el componente React muestra al usuario. Los componentes de interfaz nunca invocan `fetch` directamente; siempre delegan en el servicio correspondiente de su módulo.

**Health check y secuencia de arranque.** Al iniciarse, la aplicación Tauri ejecuta el sidecar FastAPI en segundo plano. El componente raíz `App.jsx` ejecuta un ciclo de hasta 20 intentos (uno por segundo) consultando `GET /health`. Solo cuando el backend responde con `{"status": "ok"}` se presenta la pantalla de inicio de sesión. Este mecanismo garantiza que el usuario nunca interactúe con el frontend mientras el servidor aún no está disponible, evitando errores de conexión en los primeros segundos del arranque.

### 4.3.4 Motor Anti-Colisiones 7-Vías

El componente técnicamente más exigente del sistema es la función privada `_verificar_choques_7vias()`, ubicada en `features/mesas/repository.py`. Su diseño responde a una restricción institucional real: en el proceso de defensa de la UPEL, cada defensa involucra hasta 7 participantes con ocupación exclusiva (1 aula + 6 docentes del comité). Ninguno puede estar comprometido en dos defensas simultáneas.

La función opera **dentro de la misma transacción** que `crear_mesa()` o `actualizar_mesa()`, garantizando que la verificación y la inserción sean atómicas:

1. **Verificación del aula:** consulta si el aula solicitada tiene mesas en estados bloqueantes (`Programada`, `En_Curso`, `Con_Correcciones`) con solapamiento temporal respecto al intervalo `[hora_inicio, hora_fin)`.

2. **Verificación de los 6 docentes del comité:** para cada uno de los seis miembros (tutor principal, tutor suplente, jurado 1 principal, jurado 1 suplente, jurado 2 principal, jurado 2 suplente), consulta si el docente aparece en alguna posición de comité en otra mesa con solapamiento temporal y estado bloqueante.

3. **Mensajes de error descriptivos:** ante un conflicto detectado, el sistema recupera el nombre completo del docente y su rol en la mesa conflictiva, devolviendo un mensaje preciso del tipo: *"Conflicto: Prof. [Nombre Apellido] ([Rol]) tiene mesa de HH:MM a HH:MM."*

Este diseño mitiga condiciones de carrera porque la verificación y la escritura ocurren en una única transacción con nivel de aislamiento `READ COMMITTED` (predeterminado en PostgreSQL). Si dos peticiones concurrentes intentan programar mesas que comparten recursos, la segunda encontrará bloqueada la fila insertada por la primera y esperará hasta que la transacción de la primera se confirme, momento en el cual detectará el conflicto y retrocederá.

**Filtro temporal para recursos vencidos.** Una limitación del diseño original era que mesas en estados bloqueantes cuya `hora_fin` ya había transcurrido continuaban ocupando recursos en el cálculo de colisiones. Este escenario se produce cuando el coordinador omite registrar el veredicto tras la defensa. La mejora consiste en incorporar la siguiente condición en ambas sub-queries de `_verificar_choques_7vias()`:

```sql
AND (m.fecha + m.hora_fin) > LOCALTIMESTAMP
```

La expresión `DATE + TIME` en PostgreSQL produce `TIMESTAMP WITHOUT TIME ZONE`; `LOCALTIMESTAMP` es igualmente sin zona horaria, garantizando que la comparación sea correcta independientemente de la configuración de `timezone` del servidor. Las mesas cuya ventana temporal ya venció se excluyen automáticamente del cálculo, liberando los recursos para nuevas programaciones. Como consecuencia directa, las mesas en estado `Con_Correcciones` —cuyo `hora_fin` siempre está en el pasado al momento de la consulta— dejan de bloquear recursos implícitamente sin necesidad de modificar el conjunto de estados bloqueantes.

---

### 4.3.5 Módulo de Incidencias Académicas

Las mesas en estado activo (`Programada` o `En_Curso`) cuya ventana temporal ha vencido representan incidencias que requieren intervención del coordinador. Para detectarlas y permitir su resolución, el sistema implementa un módulo complementario que atraviesa las cinco capas de la arquitectura backend y expone una interfaz de acción en el panel de control.

**Endpoint `GET /api/dashboard/pendientes-cierre`.** El endpoint detecta mesas activas vencidas mediante la condición inversa al filtro del motor de colisiones: `(m.fecha + m.hora_fin) < LOCALTIMESTAMP`. Retorna objetos `MesaPendienteCierreOut` con diez atributos: identificador, nombre del estudiante, título del proyecto, fecha, hora de inicio, hora de fin, aula, tipo de mesa, estado actual y programa de maestría. La cadena de implementación sigue el patrón estándar del sistema, como se detalla en la Tabla 4.7.

**Tabla 4.7. Capas de implementación del módulo de incidencias académicas.**

| Capa | Artefacto | Responsabilidad |
|---|---|---|
| Modelo de dominio | `features/dashboard/models.py` — `MesaPendienteCierre` | Dataclass con 10 campos del resultado de la consulta |
| Repositorio | `features/dashboard/repository.py` — `obtener_pendientes_cierre()` | SQL con filtro `(fecha + hora_fin) < LOCALTIMESTAMP`; admite filtro opcional por `maestria_id` |
| Servicio | `features/dashboard/service.py` — `obtener_pendientes_cierre()` | Envuelve el repositorio con captura de `psycopg2.Error`; retorna lista vacía ante fallo |
| Schema Pydantic | `api/schemas/dashboard.py` — `MesaPendienteCierreOut` | Contrato de serialización de los 10 campos hacia el cliente |
| Router HTTP | `api/routers/dashboard.py` | Inyecta `maestria_id` desde el token de sesión, siguiendo el mismo patrón que los demás endpoints del dashboard |

**Interfaz de acción en el panel de control.** En el frontend, el resultado del endpoint se materializa en tres elementos de interfaz dentro de `DashboardView.jsx`:

1. **Banner de alerta**: visible únicamente cuando existen mesas pendientes. Muestra el conteo de incidencias y un acceso a la lista detallada.

2. **Modal de lista**: presenta cada incidencia con sus datos de defensa y un botón de acción contextual determinado por el estado de la mesa. Las mesas en estado `En_Curso` ofrecen la opción de registrar el veredicto; las mesas en estado `Programada` ofrecen la opción de reprogramar.

3. **Formularios de resolución**: `VeredictoForm` permite seleccionar entre tres veredictos con retroalimentación visual por colores semánticos (Aprobado, Con Correcciones, Reprobado); si se selecciona Con Correcciones, el formulario calcula y muestra la fecha límite de entrega a partir de los días configurados. `ReprogramarForm` carga la lista de aulas disponibles al montarse, valida que la nueva fecha no caiga en fin de semana y envía los datos mediante el endpoint de edición de mesas existente. Tras cada operación exitosa, la lista de incidencias se actualiza automáticamente y la mesa resuelta desaparece del widget.

### 4.3.6 Componente Compartido `TableSkeleton`

Para los estados de carga de las vistas tabulares, el sistema incluye el componente `src/shared/components/TableSkeleton.jsx`. El componente recibe dos propiedades: `cols`, un array de descriptores de columna donde cada entrada especifica `bars` (array de clases de anchura de Tailwind CSS que se ciclan por fila) y `center` (alineación horizontal); y `rows`, el número de filas esqueleto a renderizar, con valor por defecto de cinco.

Los placeholders utilizan la animación `animate-pulse` con colores adaptativos `bg-slate-200 dark:bg-slate-700/50`, compatibles con el modo oscuro del sistema sin requerir clases condicionales. Los anchos variables de los placeholders se distribuyen mediante `rowIdx % bars.length`, generando variación visual entre filas sin necesidad de definir un valor para cada posición.

Se incluyen dos presets exportados: `COLS_ESTUDIANTES` para la vista de registro de estudiantes (7 columnas: identificación, nombre, cohorte, maestría, solvencia, estado y acciones) y `COLS_MESAS` para la vista de mesas de defensa (8 columnas: tipo, estudiante, tutor, aula, fecha, horario, estado y acciones). El componente es consumido por cualquier vista tabular que necesite representar un estado de carga antes de que los datos del servidor estén disponibles.

---

## 4.4 Instrucciones de Uso y Configuración

### 4.4.1 Requisitos del Sistema

| Componente | Requisito mínimo |
|---|---|
| Sistema operativo | Windows 10/11 (64-bit) o Ubuntu 20.04 LTS |
| Procesador | x86-64, 2 núcleos, 2 GHz |
| Memoria RAM | 4 GB |
| Almacenamiento | 500 MB (instalación) + espacio para base de datos |
| PostgreSQL | Versión 16, en ejecución local o en red LAN |
| Python | 3.11 o superior (entorno de desarrollo) |
| Node.js | 20 LTS o superior (entorno de desarrollo) |

### 4.4.2 Configuración del Entorno de Desarrollo

**Backend (Python / FastAPI):**

```bash
# Paso 1: Crear y activar entorno virtual
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

# Paso 2: Instalar dependencias
pip install -r requirements.txt

# Paso 3: Configurar parámetros de conexión a PostgreSQL
# Editar core/config.py con los valores de la instalación local:
#   host, port, user, password, database

# Paso 4: Inicializar base de datos con esquema y datos semilla
python config_db.py --recrear

# Paso 5: Iniciar servidor de desarrollo
uvicorn api.main:app --reload --port 8000
```

**Frontend (React / Vite):**

```bash
# Instalar dependencias de Node.js
npm install

# Iniciar servidor de desarrollo (hot-reload en puerto 5173)
npm run dev

# Generar build de producción
npm run build
```

**Variables de entorno para el sistema de notificaciones por correo:**

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=postgrado.upel.rubio@gmail.com
SMTP_PASSWORD=<contraseña_de_aplicación_Gmail>
```

Estas variables deben configurarse en el entorno del proceso que ejecuta el servidor FastAPI. Si las variables no están definidas, el sistema omite el envío de correos sin afectar la programación de la mesa.

**Build completo — Aplicación de escritorio:**

```bash
# Compilar el sidecar backend como ejecutable autónomo
python scripts/build_sidecar.py

# Empaquetar la aplicación Tauri (genera instalador .exe en Windows)
npm run tauri build
```

### 4.4.3 Credenciales de Prueba (datos semilla)

La ejecución de `python config_db.py --recrear` carga las siguientes credenciales de prueba en la base de datos:

| Rol | Cédula | Contraseña | Maestría asignada |
|---|---|---|---|
| Jefa Administradora | 00000000 | admin123 | Ninguna (acceso global) |
| Coordinador (IE) | 32785839 | 123412 | Innovación Educativa |
| Coordinador de prueba (GE) | 00000001 | coordinador123 | Gerencia Educacional |
| Coordinador de prueba (PG) | 00000002 | coordinador123 | Planificación Global |
| Coordinador de prueba (EAD) | 00000003 | coordinador123 | Educación, Ambiente y Desarrollo |
| Coordinador de prueba (EEF) | 00000004 | coordinador123 | Enseñanza de la Educación Física |
| Coordinador de prueba (REC) | 00000005 | coordinador123 | Recreación |
| Coordinador de prueba (INF) | 00000006 | coordinador123 | Informática Educativa |
| Coordinador de prueba (OE) | 00000007 | coordinador123 | Orientación Educativa |

---

## 4.5 Seguridad y Roles

### 4.5.1 Modelo de Autenticación

El sistema implementa autenticación basada en **tokens UUID generados en memoria del servidor**. El flujo de autenticación sigue los pasos descritos a continuación:

1. El cliente envía las credenciales al endpoint `POST /api/auth/login`.
2. El servidor valida la contraseña con `bcrypt.checkpw()`.
3. Si la validación es exitosa, genera un token UUID v4 aleatorio, lo asocia a un objeto `SessionContext` en el diccionario en memoria `_sessions`, y lo devuelve al cliente en el cuerpo de la respuesta.
4. El cliente almacena el token en `sessionStorage` del navegador, disponible únicamente en la pestaña activa y eliminado automáticamente al cerrar la ventana.
5. Toda petición subsiguiente incluye el header `Authorization: Bearer <token>`.
6. La dependencia `get_session()` recupera el contexto asociado al token; si el token no existe o es inválido, retorna `HTTP 401 Unauthorized`.

```python
# core/session.py

@dataclass
class SessionContext:
    rol: str              # 'Jefa', 'Coordinador' o 'Consultor'
    nombre: str           # Nombre completo del usuario autenticado
    cedula: str           # Cédula de identidad
    maestria_id: int | None  # None solo para el rol 'Jefa'
```

**Protección contra ataques de temporización.** Cuando la cédula proporcionada no existe en la base de datos, el sistema ejecuta igualmente una llamada a `bcrypt.checkpw()` contra un hash ficticio almacenado en la constante `_DUMMY_HASH`. Esto hace que el tiempo de respuesta sea estadísticamente equivalente al de un intento de login fallido con cédula existente, impidiendo que un atacante determine la existencia de un usuario mediante la diferencia de latencia en las respuestas.

**Migración transparente SHA-256 → bcrypt.** Los hashes almacenados con el algoritmo SHA-256 (utilizado en la versión anterior del sistema) se detectan por la ausencia del prefijo `$2b$` propio de bcrypt. En el primer inicio de sesión exitoso con un hash legacy, el sistema reemplaza silenciosamente la contraseña almacenada por un hash bcrypt con factor de costo 12, sin interrumpir la experiencia del usuario ni requerir intervención administrativa.

**El portal de consulta pública** (`GET /portal/profesor/{cedula}`, `GET /portal/estudiante/{cedula}`) opera sin autenticación, dado que expone únicamente información de agenda personal sin datos sensibles de terceros. Este diseño permite que docentes y aspirantes consulten sus defensas programadas desde cualquier dispositivo sin necesidad de credenciales.

### 4.5.2 Dependencias de Autorización (FastAPI Depends)

El módulo `api/deps.py` centraliza la lógica de autorización mediante tres dependencias declarativas que se inyectan en la firma de cada handler:

**Tabla 4.5. Dependencias de autorización del sistema.**

| Dependencia | Alias tipado | Validación | Uso |
|---|---|---|---|
| `get_session()` | `SessionDep` | Token válido en `_sessions` | Cualquier usuario autenticado |
| `require_jefa()` | `JefaDep` | `rol == "Jefa"` | Operaciones administrativas globales |
| `require_coordinador()` | `CoordinadorDep` | `rol == "Coordinador"` | Operaciones con filtrado por maestría |

```python
# api/deps.py (fragmento)

SessionDep     = Annotated[SessionContext, Depends(get_session)]
JefaDep        = Annotated[SessionContext, Depends(require_jefa)]
CoordinadorDep = Annotated[SessionContext, Depends(require_coordinador)]
```

El uso de alias tipados permite que FastAPI valide automáticamente el rol del usuario al resolver las dependencias, sin necesidad de código de verificación explícito en cada handler.

### 4.5.3 Mecanismo de Aislamiento por Maestría (Multi-tenancy)

El aislamiento de datos entre los coordinadores de distintas maestrías se implementa mediante el campo `maestria_id` del objeto `SessionContext`. En cada endpoint que retorna recursos de estudiantes o mesas, el router ejecuta la derivación:

```python
maestria_id = sesion.maestria_id if sesion.rol == "Coordinador" else None
```

Este valor se propaga al repositorio, donde determina si se añade una cláusula `WHERE e.maestria_id = %s` a la consulta SQL. La Jefa Administradora, cuyo `SessionContext` tiene `maestria_id = None`, obtiene siempre los datos globales del sistema.

Para operaciones sobre recursos individuales (editar expediente de un estudiante, actualizar solvencia), se aplica una verificación adicional mediante la función `pertenece_a_maestria(id_est, sesion.maestria_id)`, que consulta directamente la base de datos y retorna `HTTP 403 Forbidden` si el estudiante pertenece a un programa distinto al del coordinador autenticado.

### 4.5.4 Matriz Completa de Permisos

La Tabla 4.6 consolida el alcance de acceso de cada rol sobre todos los recursos del sistema.

**Tabla 4.6. Matriz de permisos del sistema UPEL Mesa Manager.**

| Recurso | Operación | Jefa (global) | Coordinador (por maestría) | Consultor (público) |
|---|---|:---:|:---:|:---:|
| **Usuarios** | Crear / Editar / Eliminar | ✓ | — | — |
| **Maestrías** | Listar | ✓ Todas | ✓ Todas | — |
| **Estudiantes** | Listar | ✓ Todos | ✓ Solo su maestría | — |
| **Estudiantes** | Crear | ✓ Especifica maestría | ✓ Forzado a su maestría | — |
| **Estudiantes** | Editar / Actualizar solvencia | ✓ Cualquiera | ✓ Si pertenece a su maestría | — |
| **Estudiantes** | Eliminar | ✓ | — | — |
| **Profesores** | CRUD completo | ✓ | — | — |
| **Aulas** | CRUD completo | ✓ | — | — |
| **Mesas** | Listar / Monitoreo | ✓ Todas | ✓ Solo su maestría | — |
| **Mesas** | Crear / Editar | ✓ | ✓ | — |
| **Mesas** | Suspender | ✓ | — | — |
| **Mesas** | Registrar quórum / Veredicto / Validar correcciones | ✓ | ✓ | — |
| **Dashboard** | KPIs / Actividad / Reporte PDF | ✓ Global | ✓ Su maestría | — |
| **Dashboard** | Incidencias académicas (mesas pendientes de cierre) | ✓ Global | ✓ Su maestría | — |
| **Portales    de consulta** | Consultar por cédula | — | — | ✓ Sin autenticación |

**Convenciones de la tabla:** ✓ = acceso permitido, — = acceso no disponible o no aplicable.

El aislamiento del rol Coordinador es completo en todas las operaciones de lectura y escritura: un coordinador autenticado en el sistema es estructuralmente incapaz de recuperar, modificar o programar mesas de estudiantes de un programa al que no está asignado, incluso si conoce el identificador numérico del recurso. Esta garantía está implementada tanto a nivel de SQL (cláusula `WHERE e.maestria_id = %s`) como a nivel de aplicación (función `pertenece_a_maestria()`), cumpliendo el principio de defensa en profundidad.

---

## 4.6 Diseño de Interfaz de Usuario

### 4.6.1 Componente Sidebar Colapsable

La barra lateral de navegación (`src/shared/components/Sidebar.jsx`) implementa un mecanismo de colapso/expansión controlado por estado local React. En estado expandido (ancho `256 px`) muestra el logotipo institucional, el identificador del sistema **SIP – UPEL**, los grupos de navegación con etiquetas de texto y el submenú jerárquico de la sección Registros. En estado colapsado (ancho `64 px`) reduce la barra a una columna de iconos centrados, ocultando las etiquetas mediante una transición animada del atributo CSS `width`.

El componente prescinde de librerías externas de iconografía. Todos los iconos de navegación (Principal, Estudiantes, Profesores, Aulas, Usuarios, Registros, Programar, Visualizar, Monitoreo, Cerrar sesión) se implementan como componentes React que retornan elementos SVG inline con `viewBox="0 0 24 24"`, trazo (`stroke`) de 1.75 px y puntas redondeadas, garantizando independencia de fuentes de red y coherencia visual con el sistema de diseño.

**Tooltips flotantes.** Cuando la barra está colapsada, al posicionar el cursor sobre un ítem de navegación aparece un tooltip con el nombre del módulo a la derecha del icono. Los tooltips se posicionan con `position: fixed` y coordenada vertical calculada mediante `getBoundingClientRect()` en el evento `onMouseEnter`, lo que evita el recorte de contenido (*overflow clipping*) por el contenedor scrollable del nav.

**Transición de ancho.** La animación de colapso utiliza la propiedad CSS `transition-[width]` con duración de 300 ms y curva `ease-in-out`, produciendo una transición fluida sin saltos visuales. El contenido textual del encabezado se oculta con `overflow: hidden` y `opacity: 0` sincrónicamente.

### 4.6.2 Scrollbars Minimalistas

El archivo de estilos globales `src/index.css` incluye un bloque de personalización de barras de desplazamiento compatible con los motores de renderizado Chromium (WebView2, motor de Tauri en Windows) y Gecko:

```css
::-webkit-scrollbar              { width: 5px; height: 5px; }
::-webkit-scrollbar-track        { background: transparent; }
::-webkit-scrollbar-thumb        { background: rgba(148,163,184,0.30); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover  { background: rgba(148,163,184,0.55); }
*                                { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.30) transparent; }
```

El grosor de 5 px y el `border-radius: 999px` producen una barra de tipo *píldora*, visualmente discreta y compatible con los fondos oscuros del modo noche (`slate-900`). La regla `scrollbar-width: thin` proporciona cobertura en navegadores basados en Gecko (Firefox), aunque Tauri en Windows utiliza exclusivamente WebView2.

---

## 4.7 Empaquetado e Instalador

### 4.7.1 Personalización del Instalador NSIS

El instalador de Windows se genera mediante **NSIS (Nullsoft Scriptable Install System)** como target de Tauri. La sección `bundle.windows.nsis` del archivo `src-tauri/tauri.conf.json` concentra toda la configuración del asistente de instalación:

```json
"bundle": {
  "publisher": "UPEL",
  "copyright": "© 2026 Universidad Pedagógica Experimental Libertador. Todos los derechos reservados.",
  "shortDescription": "Sistema de gestión de mesas de defensa para la UPEL.",
  "windows": {
    "nsis": {
      "languages": ["SpanishInternational"],
      "installMode": "currentUser",
      "installerIcon": "icons/icon.ico",
      "uninstallerIcon": "icons/icon.ico",
      "headerImage": "installer/headerImage.bmp",
      "sidebarImage": "installer/sidebarImage.bmp"
    }
  }
}
```

**Tabla 4.8. Parámetros de personalización del instalador NSIS.**

| Parámetro | Valor | Efecto |
|---|---|---|
| `languages` | `SpanishInternational` | Todos los textos del asistente en español latinoamericano |
| `installMode` | `currentUser` | Instalación sin privilegios de administrador, en el perfil del usuario activo |
| `installerIcon` / `uninstallerIcon` | `icons/icon.ico` | Ícono institucional en la barra de título del asistente y en el desinstalador |
| `headerImage` | `installer/headerImage.bmp` | Imagen de 150×57 px en la esquina superior derecha de las pantallas interiores |
| `sidebarImage` | `installer/sidebarImage.bmp` | Imagen de 164×314 px en el panel izquierdo de las pantallas de bienvenida y finalización |
| `publisher` | `"UPEL"` | Nombre del publicador visible en *Configuración → Aplicaciones* de Windows |
| `copyright` | `"© 2026 UPEL..."` | Texto legal en el pie de página de cada pantalla del asistente |

Las imágenes del instalador se almacenan en formato BMP sin canal alfa en la ruta `src-tauri/installer/`. NSIS requiere este formato para la renderización de las imágenes del asistente; los archivos fuente en PNG se convierten a BMP preservando las dimensiones exactas requeridas por el estándar NSIS.

**Configuración de compilación Rust.** Para evitar errores de agotamiento de memoria durante la compilación en modo *release* con `opt-level=3`, el archivo `src-tauri/Cargo.toml` establece `codegen-units = 4` en el perfil de release. Este valor distribuye la unidad de compilación en cuatro fragmentos, reduciendo el pico de memoria de LLVM sin impacto significativo en el tamaño del binario final.

---

*Fin del Capítulo IV*
