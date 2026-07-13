/**
 * TableSkeleton — estado de carga para tablas.
 *
 * Uso básico (preset de estudiantes):
 *   {loading ? <TableSkeleton /> : <MiTabla />}
 *
 * Con preset de mesas:
 *   {loading ? <TableSkeleton cols={COLS_MESAS} rows={6} /> : <MiTabla />}
 *
 * Columna personalizada:
 *   cols={[{ header: 'Nombre', bars: ['w-32', 'w-24', 'w-36', 'w-28', 'w-40'] }]}
 *   Cada entrada de `bars` es la anchura del placeholder en esa fila (cicla si hay más filas).
 */

// ── Presets de columnas ───────────────────────────────────────────────────────

/** Tabla Registros › Estudiantes  (7 columnas) */
export const COLS_ESTUDIANTES = [
  {
    header: 'Identificación',
    bars:   ['w-16', 'w-20', 'w-14', 'w-18', 'w-16'],
  },
  {
    header: 'Nombre Completo',
    bars:   ['w-32', 'w-40', 'w-28', 'w-36', 'w-44'],
  },
  {
    header: 'Cohorte',
    bars:   ['w-14', 'w-12', 'w-16', 'w-10', 'w-14'],
  },
  {
    header: 'Maestría',
    bars:   ['w-44', 'w-32', 'w-48', 'w-36', 'w-40'],
  },
  {
    header: 'Solvencia',
    bars:   ['w-20', 'w-24', 'w-16', 'w-22', 'w-18'],
  },
  {
    header: 'Estado',
    bars:   ['w-16', 'w-20', 'w-14', 'w-18', 'w-16'],
  },
  {
    header: 'Acciones',
    bars:   ['w-20', 'w-20', 'w-20', 'w-20', 'w-20'],
    center: true,
  },
]

/** Tabla Visualizar › Mesas de Defensa  (8 columnas) */
export const COLS_MESAS = [
  {
    header: 'Tipo',
    bars:   ['w-10', 'w-10', 'w-10', 'w-10', 'w-10'],
  },
  {
    header: 'Estudiante',
    bars:   ['w-36', 'w-28', 'w-44', 'w-32', 'w-40'],
  },
  {
    header: 'Tutor',
    bars:   ['w-32', 'w-24', 'w-36', 'w-20', 'w-28'],
  },
  {
    header: 'Aula',
    bars:   ['w-16', 'w-14', 'w-18', 'w-12', 'w-16'],
  },
  {
    header: 'Fecha',
    bars:   ['w-20', 'w-20', 'w-20', 'w-20', 'w-20'],
  },
  {
    header: 'Horario',
    bars:   ['w-16', 'w-16', 'w-16', 'w-16', 'w-16'],
  },
  {
    header: 'Estado',
    bars:   ['w-20', 'w-24', 'w-16', 'w-22', 'w-20'],
  },
  {
    header: 'Acciones',
    bars:   ['w-24', 'w-24', 'w-24', 'w-24', 'w-24'],
    center: true,
  },
]

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {{ cols: typeof COLS_ESTUDIANTES, rows: number }} props
 */
export default function TableSkeleton({ cols = COLS_ESTUDIANTES, rows = 5 }) {
  return (
    <table className="w-full text-sm">

      {/* Cabecera */}
      <thead>
        <tr className="border-b border-border bg-secondary/40">
          {cols.map((col, i) => (
            <th
              key={i}
              className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground ${
                col.center ? 'text-center' : 'text-left'
              }`}
            >
              {/* Placeholder del encabezado, ligeramente más corto que el texto */}
              <div className="h-2.5 w-3/5 rounded animate-pulse bg-slate-200 dark:bg-slate-700/50" />
            </th>
          ))}
        </tr>
      </thead>

      {/* Filas de datos */}
      <tbody className="divide-y divide-border">
        {Array.from({ length: rows }, (_, rowIdx) => (
          <tr key={rowIdx}>
            {cols.map((col, colIdx) => {
              // Ciclar entre los anchos definidos para variar la apariencia por fila
              const w = col.bars?.[rowIdx % col.bars.length] ?? 'w-1/2'
              return (
                <td
                  key={colIdx}
                  className={`px-4 py-3.5 ${col.center ? 'flex justify-center' : ''}`}
                >
                  <div
                    className={`h-3.5 rounded-md animate-pulse bg-slate-200 dark:bg-slate-700/50 ${w}`}
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>

    </table>
  )
}
