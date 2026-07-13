import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScrollText, Search, Layers, Zap, RotateCcw, List } from 'lucide-react'
import { historialService } from '../services/historialService'

const MODULOS  = ['Estudiantes', 'Profesores', 'Mesas', 'Aulas', 'Usuarios']
const ACCIONES = ['CREAR', 'EDITAR', 'ELIMINAR', 'EDITAR_SOLVENCIA']

const ABADGE = {
  CREAR:            'text-emerald-500 border-emerald-500/[0.22] bg-emerald-500/[0.12] dark:text-emerald-400',
  EDITAR:           'text-primary border-primary/[0.22] bg-primary/[0.12]',
  ELIMINAR:         'text-red-500 border-red-500/[0.22] bg-red-500/[0.12]',
  EDITAR_SOLVENCIA: 'text-amber-500 border-amber-500/[0.24] bg-amber-500/[0.12]',
}

const INPUT = 'h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'
const DATE_INPUT = 'h-11 w-full rounded-xl border border-border bg-secondary/40 px-[14px] text-[13.5px] text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12] cursor-pointer [color-scheme:dark] dark:[color-scheme:dark]'
const SELECT_PLAIN = 'h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-[14px] text-[13.5px] text-foreground outline-none transition-all cursor-pointer focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'

function IconInput({ icon, children }) {
  return (
    <div className="group relative flex items-center">
      <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
        {icon}
      </span>
      {children}
    </div>
  )
}

function AccionBadge({ accion }) {
  const cls = ABADGE[accion] ?? 'text-muted-foreground border-border bg-secondary/40'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-[10px] py-[5px] text-[10.5px] font-bold whitespace-nowrap ${cls}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {accion}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-[18px] py-[14px]">
          <div className="animate-pulse h-3 rounded bg-secondary" style={{ width: `${45 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function HistorialView({ session }) {
  if (session?.rol !== 'Jefa') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm font-medium text-foreground">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Esta sección es exclusiva para el rol Jefa.</p>
      </div>
    )
  }

  const [lista,    setLista]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  const [filtroModulo,  setFiltroModulo]  = useState('')
  const [filtroAccion,  setFiltroAccion]  = useState('')
  const [filtroDesde,   setFiltroDesde]   = useState('')
  const [filtroHasta,   setFiltroHasta]   = useState('')
  const [busqueda,      setBusqueda]      = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const data = await historialService.getAll({
        modulo: filtroModulo || undefined, accion: filtroAccion || undefined,
        desde:  filtroDesde  || undefined, hasta:  filtroHasta  || undefined,
      })
      setLista(data)
    } catch (e) { setError(e?.detail ?? 'No se pudo cargar el historial.') }
    finally { setCargando(false) }
  }, [filtroModulo, filtroAccion, filtroDesde, filtroHasta])

  useEffect(() => { cargar() }, [cargar])

  const listaFiltrada = useMemo(() => {
    if (!busqueda.trim()) return lista
    const q = busqueda.toLowerCase()
    return lista.filter(e =>
      e.usuario.toLowerCase().includes(q) || e.detalle.toLowerCase().includes(q)
    )
  }, [lista, busqueda])

  const limpiar = () => {
    setFiltroModulo(''); setFiltroAccion(''); setFiltroDesde(''); setFiltroHasta(''); setBusqueda('')
  }
  const hayFiltros = filtroModulo || filtroAccion || filtroDesde || filtroHasta || busqueda

  return (
    <div className="relative mx-auto max-w-[1240px]">
      <div className="aura" />

      {/* Page header */}
      <div className="mb-[26px]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <ScrollText className="h-[14px] w-[14px]" /> Auditoría
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">Historial de actividad</h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Registro cronológico de todas las acciones realizadas en el sistema. Filtra por usuario, módulo, tipo de acción o rango de fechas.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-[18px] rounded-[24px] border border-border bg-card px-7 py-6 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Buscar</label>
            <IconInput icon={<Search className="h-4 w-4" />}>
              <input type="text" placeholder="Usuario o detalle…"
                value={busqueda} onChange={e => setBusqueda(e.target.value)} className={INPUT} />
            </IconInput>
          </div>
          <div style={{ width: 185 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Módulo</label>
            <IconInput icon={<Layers className="h-4 w-4" />}>
              <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} className={SELECT_PLAIN}>
                <option value="">Todos</option>
                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </IconInput>
          </div>
          <div style={{ width: 185 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Acción</label>
            <IconInput icon={<Zap className="h-4 w-4" />}>
              <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)} className={SELECT_PLAIN}>
                <option value="">Todas</option>
                {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </IconInput>
          </div>
          <div style={{ width: 150 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Desde</label>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} className={DATE_INPUT} />
          </div>
          <div style={{ width: 150 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Hasta</label>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} className={DATE_INPUT} />
          </div>
          <button onClick={limpiar}
            className="flex h-11 items-center gap-2 rounded-[12px] border border-border px-4 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-red-500/[0.22] hover:bg-red-500/[0.1] hover:text-red-500">
            <RotateCcw className="h-[15px] w-[15px]" /> Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-[24px] border border-border bg-card px-6 py-4 text-[13.5px] text-muted-foreground shadow-card">
          {error}
          <button onClick={cargar} className="rounded-[12px] bg-gradient-pill px-4 py-1.5 text-xs font-semibold text-white">Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
        {/* tbl-bar */}
        <div className="flex items-center justify-between border-b border-border px-[22px] py-4">
          <div className="flex items-center gap-[9px] text-[14px] font-bold text-foreground">
            <List className="h-4 w-4 text-primary" />
            Eventos registrados
            <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[10px] py-[3px] text-[11px] font-semibold text-primary">
              {cargando ? '—' : `${listaFiltrada.length} registros`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 880 }}>
            <thead>
              <tr className="bg-secondary/40">
                {['Fecha / Hora', 'Usuario', 'Rol', 'Acción', 'Módulo', 'ID', 'Detalle'].map(h => (
                  <th key={h} className="border-b border-border px-[18px] py-[13px] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : listaFiltrada.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-[50px] text-center text-[13px] text-muted-foreground">
                        {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay actividad registrada aún.'}
                      </td>
                    </tr>
                  )
                  : listaFiltrada.map(entrada => {
                    const fecha = new Date(entrada.fecha)
                    const fechaStr = fecha.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    const horaStr  = fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <tr key={entrada.id} className="border-b border-border last:border-0 transition-colors hover:bg-secondary/30">
                        {/* Fecha / Hora */}
                        <td className="px-[18px] py-[14px]">
                          <div className="flex flex-col leading-[1.3]">
                            <span className="text-[12.5px] font-semibold text-foreground">{fechaStr}</span>
                            <span className="text-[11px] text-muted-foreground">{horaStr}</span>
                          </div>
                        </td>
                        {/* Usuario */}
                        <td className="px-[18px] py-[14px]">
                          <div className="flex items-center gap-[10px]">
                            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-primary/[0.22] bg-primary/[0.12] text-[10px] font-bold text-primary">
                              {entrada.usuario?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="text-[12.5px] font-semibold text-foreground">{entrada.usuario}</span>
                          </div>
                        </td>
                        {/* Rol */}
                        <td className="px-[18px] py-[14px]">
                          <span className="rounded-full border border-border bg-secondary/40 px-[9px] py-[3px] text-[10px] font-semibold tracking-[0.04em] text-muted-foreground">
                            {entrada.rol}
                          </span>
                        </td>
                        {/* Acción */}
                        <td className="px-[18px] py-[14px]"><AccionBadge accion={entrada.accion} /></td>
                        {/* Módulo */}
                        <td className="px-[18px] py-[14px] text-[12.5px] text-muted-foreground">{entrada.modulo}</td>
                        {/* ID */}
                        <td className="px-[18px] py-[14px]">
                          <span className="text-[11.5px] font-semibold text-primary">{entrada.registro_id ?? '—'}</span>
                        </td>
                        {/* Detalle */}
                        <td className="max-w-[300px] px-[18px] py-[14px] text-[12.5px] text-muted-foreground" title={entrada.detalle}>
                          <span className="block truncate">{entrada.detalle}</span>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
