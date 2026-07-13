# CHECKLIST DE IMPLEMENTACIÓN — obligatorio

> **Claude Code: este es tu contrato de trabajo.** No marques una casilla como hecha
> hasta que el resultado en React se vea **idéntico** a la captura correspondiente en
> `screenshots/`. Compara lado a lado. Si algo difiere (layout, color, espaciado,
> tipografía, badge, estado), corrígelo antes de continuar.
>
> Regla de oro: **si el HTML de `designs/` lo tiene, el React lo tiene.** Nada de
> simplificar, omitir o "dejar para después".

---

## FASE 0 — Preparación
- [ ] Leí `README.md` completo (las 8 secciones).
- [ ] Abrí los 11 archivos de `designs/*.html` en el navegador y vi su comportamiento.
- [ ] Copié `assets/upel-white.png` y `assets/upel-blue.png` a la carpeta de assets del proyecto.
- [ ] Tengo identificada la tabla de tokens del §3 y los componentes compartidos
      (`SearchableSelect`, `Modal`, `Sidebar`, `Topbar`, `ThemeToggle`).

---

## FASE 1 — Cambios globales (§2) · afectan TODAS las pantallas

### 1.1 Logo UPEL en el Sidebar
- [ ] Eliminé el cuadro azul con la "M".
- [ ] Puse el logo **sin recuadro**: `upel-white.png` en modo oscuro, `upel-blue.png` en claro.
- [ ] El intercambio por tema funciona (probé `.dark` on/off).
- [ ] El texto "UPEL · SIP / Mesa Manager" se conserva al lado.
- [ ] Al colapsar el sidebar el logo queda centrado y no se deforma.

### 1.2 Quitar campana
- [ ] Eliminé por completo el botón de campana (`bell` + `bell-dot`) del Topbar.
- [ ] No quedó ningún placeholder; el Topbar solo tiene tema + perfil.

### 1.3 Badge de maestría por rol
- [ ] Para rol **Jefa** el breadcrumb muestra `Vista general` (NO "Maestría: …").
- [ ] Para rol **Coordinador** muestra `Maestría: {su maestría}`.
- [ ] Ningún otro rol renderiza ese texto.

> ✅ **Verificación Fase 1:** abrí 3 pantallas distintas y confirmé logo + sin campana + badge correcto en todas.

---

## FASE 2 — Programar (`ProgramarView.jsx`) · §4.1 · captura `01-Programar.png`
- [ ] Layout de **1 columna `max-w-3xl`**, 3 secciones numeradas.
- [ ] **Sección 1 – Estudiante:** `SearchableSelect` que lista solo **elegibles**
      (sin mesa activa + con solvencia verificada).
- [ ] Al elegir estudiante aparecen 2 paneles **read-only**: Título del proyecto + Comité
      (Tutor, Jurado 1, Jurado 2 principales) con candado.
- [ ] Si no hay elegibles → banner ámbar y el select se oculta.
- [ ] **Sección 2 – Aula:** `SearchableSelect` con badge "Con equipos / Sin equipos".
- [ ] **Fecha:** `min` = hoy, muestra día de la semana, **bloquea + alerta si sábado/domingo**.
- [ ] **Hora:** rango 08:00–13:00; hint en vivo (Mesa 1/2 = +40, Mesa 3 = +60); error si tipo 3 pasa de 13:00.
- [ ] **Pie:** resumen inline en vivo; botón deshabilitado hasta validar todo.
- [ ] Submit: simula POST; **colisión de aula** → caja de error + toast.
- [ ] Éxito: tarjeta de confirmación (Día/Horario/Aula/Tipo) + botón "Programar otra".
- [ ] Reemplacé `const ROL='Jefa'` por `getSession().rol`.

> ✅ Comparé con `01-Programar.png` y se ve idéntico.

---

## FASE 3 — Visualizar (`VisualizarView.jsx`) · §4.2 · capturas `02-*` y `03-*`
- [ ] Toggle pill **Tabla / Calendario** arriba-derecha.
- [ ] Buscador (estudiante/título/tutor) + dropdowns Tutor, Aula, Estudiante, Estado.
- [ ] Rango **Desde/Hasta** (solo Tabla) con botones **Aplicar** y **Limpiar**.
- [ ] **Stats** de conteo por estado en pills de color.
- [ ] **Tabla 8 columnas:** tipo (badge 1/2/3), Estudiante (+"Tu Mesa"), Tutor, Aula,
      Fecha, Horario, Estado, Acciones en hover.
- [ ] Acciones según estado y rol: Suspender / Veredicto / Validar.
- [ ] Fila resaltada dorada si el usuario participa.
- [ ] **Calendario semanal:** 5 columnas Lun–Vie, cards con tira de color, navegación de semana.
- [ ] **Modal Detalle** (grid 2 cols + acciones).
- [ ] **Modal Veredicto:** 3 radios coloreados + caja de días de corrección con preview de fecha límite; botón coloreado según opción.
- [ ] **Modal Suspender** (confirmación).
- [ ] Acción **Validar correcciones** (directa, con toast).
- [ ] Estados vacíos (sin resultados / sin filtros) y skeletons en carga.

> ✅ Comparé con `02-Visualizar-tabla.png`, `02-Visualizar-tabla-rows.png` y `03-Visualizar-calendario.png`.

---

## FASE 4 — Monitoreo (`MonitoreoView.jsx`) · §4.3 · capturas `04/05/06`
- [ ] Tabs **Calendario / Panel Operativo** (la vista **Día** se entra desde el Calendario).
- [ ] **Calendario mensual:** header `bg-upel-navy`, flechas ‹ › + botón "Hoy",
      grid Lun–Dom, pill de conteo por día, hoy con ring dorado.
- [ ] Click en día con mesas → **Vista Día**.
- [ ] **Vista Día:** botón "‹ Calendario", fecha larga, **timeline** de cards por hora.
- [ ] **Poll cada 30 s** con countdown regresivo visible + botón Actualizar (spin).
- [ ] Skeletons en carga; estado vacío si el día no tiene mesas.
- [ ] Suspender mesa si Programada + rol Jefa.
- [ ] **Panel Operativo (Kanban):** 3 columnas En Curso / Programada / Concluida.
- [ ] Card: código `DEF-2026-NNN`, badge estado, **minutos transcurridos** o **alerta de
      sobretiempo** pulsante, borde izq. de color, aula + horario, **dots de asistencia n/4**.
- [ ] **Poll 30 s** + recálculo de minutos cada 60 s.
- [ ] Click en card → modal Detalle (con "Validar correcciones" si Con_Correcciones).
- [ ] **Filtros colapsables:** Estudiante, Profesor (+ rol Tutor/Jurado), Aula, Ubicación, con badge de conteo.
- [ ] **`clearInterval` al desmontar y al cambiar de tab/vista** (sin polls colgados).

> ✅ Comparé con `04-Monitoreo-calendario.png`, `05-Monitoreo-panel.png`, `06-Monitoreo-dia.png`.

---

## FASE 5 — Registros de Estudiantes · §4.4 · capturas `07` y `08`
- [ ] Tabla de **8 columnas:** Identificación (badge V/C.C./Pasaporte + número mono),
      Nombre, Correo, Cohorte, Maestría, Solvencia (Solvente/Pendiente + nº mesa),
      Estado (Asignado/Disponible), Acciones.
- [ ] **Toolbar:** buscador (nombre/cédula) + filtro maestría + contador + **Exportar Excel**
      (spinner, banner de éxito, deshabilitado sin resultados).
- [ ] Skeletons en carga + estado vacío diferenciado (`colspan=8`).
- [ ] **Modal Editar** (formato de documento según tipo V/C.C.).
- [ ] **Modal Comité** (Principales + Suplentes).
- [ ] **Modal Solvencia:** tabs Mesa 1/2/3 — detalle del pago verificado **o** formulario
      de registro con validación (fecha, recibo, recibo de caja, monto > 0).
- [ ] **Modal Eliminar** (confirmación; **solo rol Jefa**).

> ✅ Comparé con `07-RegistrosEstudiantes.png` y `08-RegistrosEstudiantes-modal-solvencia.png`.

---

## FASE 6 — Estética de las 7 pantallas restantes
Estas pantallas **ya existen y funcionan**, pero su aspecto NO necesariamente coincide
con los prototipos. Tu trabajo aquí es **estético**: abrir cada HTML de `designs/` + su
captura, y ajustar el componente React hasta que **se vea idéntico** — colores,
espaciado, tipografía, tamaños, tarjetas, tablas, badges, chips, inputs, sombras,
radios y estados hover. **No rompas la lógica ni la conexión a datos**, solo el look.

- [ ] **Dashboard** → igual a `00-Dashboard.png` (tarjetas de stats, layout, badge "Vista general").
- [ ] **Estudiantes (alta)** → igual a `09-Estudiantes.png` (formulario, secciones, segmented, selects).
- [ ] **Profesores (alta)** → igual a `10-Profesores.png`.
- [ ] **Aulas** → igual a `11-Aulas.png` (tarjetas/grid de aulas, formulario).
- [ ] **Usuarios** → igual a `12-Usuarios.png` (tabla/gestión de usuarios).
- [ ] **Registros Profesores** → igual a `13-RegistrosProfesores.png` (tabla + acciones).
- [ ] **Historial** → igual a `14-Historial.png`.

> Para cada una: si tu pantalla actual difiere del prototipo (aunque funcione bien),
> **cámbiala para que iguale a la captura**. Reutiliza los tokens del §3 del README.

> ✅ **Verificación Fase 6:** abrí las 7 pantallas en el navegador y cada una coincide con su captura.

---

## CIERRE
- [ ] Corrí `npm run dev` y revisé cada pantalla contra su captura.
- [ ] Probé modo claro y oscuro en todas.
- [ ] Conecté `apiFetch` real (o dejé TODOs claros donde falte backend).
- [ ] Reemplacé TODOS los `const ROL='Jefa'` por el rol real de sesión.
- [ ] No quedó ninguna variable CSS del prototipo ni la fuente Sora en el código final.

**Cuando termines, entrega la lista de archivos modificados/creados por fase.**
