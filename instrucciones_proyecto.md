# Instrucciones del Proyecto - Sistema de Gestión de Mesas de Defensa de Maestría

## Contexto Académico
- Proyecto de Ingeniería Informática para la **UPEL** (Universidad Pedagógica Experimental Libertador).
- Sistema de Gestión de Mesas de Defensa de Maestría.

## Tecnologías
- **Backend:** Python 3, PostgreSQL, psycopg2
- **Frontend:** CustomTkinter

## Restricciones de Horario
- Días hábiles: Lunes a Viernes.
- Rango permitido: 8:00 AM a 1:00 PM (formato 24h: 08:00 – 13:00).
- Duración según tipo de mesa:
  - Mesa 1 y Mesa 2: 40 minutos.
  - Mesa 3: 60 minutos (1 hora).

## Reglas de Negocio

### Cálculo Automático
- El sistema debe calcular `hora_fin` automáticamente a partir de `hora_inicio` y el tipo de mesa.

### Validaciones de Conflictos (choques)
El sistema debe verificar que no existan solapamientos de horario para:
1. **Aula**: misma aula ocupada en el mismo rango de tiempo.
2. **Alumno**: mismo alumno asignado a dos mesas en el mismo rango de tiempo.
3. **Profesores**: ningún profesor puede estar en dos mesas en el mismo rango de tiempo.

### Roles de Profesores
- Un profesor no puede repetir rol dentro de la misma mesa (ej: no puede ser tutor y jurado a la vez).

## Estados de Mesa
- `Programada`: mesa creada y pendiente de realizarse.
- `Finalizada`: mesa ejecutada con éxito.
- `Suspendida`: mesa cancelada o postergada.

## Formato de Datos Obligatorio
| Campo    | Formato            | Ejemplo        |
|----------|--------------------|----------------|
| Cédulas  | Solo números       | `12345678`     |
| Fechas   | `AAAA-MM-DD`       | `2026-06-15`   |
| Horas    | 24h `HH:MM`        | `08:00`, `10:40` |
