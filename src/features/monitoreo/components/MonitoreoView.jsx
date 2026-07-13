import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { monitoreoService } from '@/features/monitoreo'
import { mesasService } from '@/features/mesas/services/mesasService'
import Modal from '@/shared/components/Modal'
import MesaCard from './MesaCard'
import { ChevronLeft, ChevronRight, RefreshIcon, CheckIcon, XIcon, AlertIcon, FilterIcon } from '@/shared/components/icons'
import MesaDetalleModal from './MesaDetalleModal'

const POLL_SECS = 30

// ── Calendario ────────────────────────────────────────────────────────────
const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEM   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DIAS_LARGO = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']

// ── Paleta de tira de color (borde superior de tarjetas de agenda) ────────
const ESTADO_BAR = {
  Por_Iniciar:      'bg-blue-400',
  Programada:       'bg-blue-500',
  En_Curso:         'bg-emerald-500',
  Aprobada:         'bg-green-500',
  Con_Correcciones: 'bg-amber-400',
  Reprobada:        'bg-red-500',
  Suspendida:       'bg-slate-300',
}
const ESTADO_LABEL = {
  Por_Iniciar:      'Por Iniciar',
  En_Curso:         'En Curso',
  Con_Correcciones: 'Con Correcciones',
}

// ── Paleta de estados ─────────────────────────────────────────────────────
const ESTADO_CARD = {
  Por_Iniciar:      { borde: 'border-blue-200',    fondo: 'bg-blue-50/60',    texto: 'text-blue-900'         },
  Programada:       { borde: 'border-blue-200',    fondo: 'bg-blue-50/60',    texto: 'text-blue-900'         },
  En_Curso:         { borde: 'border-emerald-200', fondo: 'bg-emerald-50/60', texto: 'text-emerald-900'      },
  Aprobada:         { borde: 'border-green-200',   fondo: 'bg-green-50/60',   texto: 'text-green-900'        },
  Con_Correcciones: { borde: 'border-amber-200',   fondo: 'bg-amber-50/60',   texto: 'text-amber-900'        },
  Reprobada:        { borde: 'border-red-200',     fondo: 'bg-red-50/60',     texto: 'text-red-900'          },
  Suspendida:       { borde: 'border-border',      fondo: 'bg-secondary',     texto: 'text-muted-foreground' },
}
// ── Filtros ───────────────────────────────────────────────────────────────
const UBICACIONES   = ['Doctorado', 'Docencia', 'Extensión', 'Postgrado']
const FILTROS_VACIO = { estudiante: '', profesor: '', rolProfesor: 'Cualquiera', aula: '', ubicacion: '' }

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}
function generarCeldas(year, month) {
  const offset    = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const totalDias = new Date(year, month, 0).getDate()
  const celdas    = Array(offset).fill(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}
function formatearDiaLargo(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const nombreDia = DIAS_LARGO[(new Date(y, m - 1, d).getDay() + 6) % 7]
  return `${nombreDia} ${d} de ${MESES[m - 1]} de ${y}`
}

function filtrarMesas(mesas, { estudiante, profesor, rolProfesor, aula, ubicacion }) {
  return mesas.filter(m => {
    if (estudiante && !(m.nombre_estudiante ?? m.estudiante ?? '').toLowerCase().includes(estudiante.toLowerCase())) return false
    if (profesor) {
      const q        = profesor.toLowerCase()
      const enTutor  = (m.tutor_principal ?? m.tutor ?? '').toLowerCase().includes(q)
      const enJurado = (m.jurado1_principal ?? m.jurado1 ?? '').toLowerCase().includes(q)
                    || (m.jurado2_principal ?? m.jurado2 ?? '').toLowerCase().includes(q)
      if (rolProfesor === 'Tutor'      && !enTutor)              return false
      if (rolProfesor === 'Jurado'     && !enJurado)             return false
      if (rolProfesor === 'Cualquiera' && !enTutor && !enJurado) return false
    }
    if (aula      && !m.aula.toLowerCase().includes(aula.toLowerCase()))   return false
    if (ubicacion && m.ubicacion !== ubicacion)                             return false
    return true
  })
}


// ── Iconos ─────────────────────────────────────────────────────────────────
// ChevL/ChevR son alias locales para que el JSX del paginador no cambie
const ChevL = () => <ChevronLeft size={16} />
const ChevR = () => <ChevronRight size={16} />

// ── Panel de filtros ──────────────────────────────────────────────────────
const INPUT_CLS = 'w-full h-9 px-[10px] text-[12.5px] text-foreground bg-secondary/40 border border-border rounded-[10px] outline-none focus:ring-2 focus:ring-primary/[0.12] focus:border-primary transition-colors placeholder:text-muted-foreground/60'

function FiltersPanel({ filters, onChange, onClear, activos }) {
  const set = (k, v) => onChange({ ...filters, [k]: v })
  return (
    <div className="rounded-[16px] border border-border bg-card p-[18px] flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Estudiante</label>
          <input type="text" value={filters.estudiante}
            onChange={e => set('estudiante', e.target.value)}
            placeholder="Buscar nombre…" className={INPUT_CLS} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Profesor</label>
          <div className="flex gap-1.5">
            <input type="text" value={filters.profesor}
              onChange={e => set('profesor', e.target.value)}
              placeholder="Buscar nombre…" className={INPUT_CLS + ' flex-1'} />
            <select value={filters.rolProfesor}
              onChange={e => set('rolProfesor', e.target.value)}
              className={INPUT_CLS + ' w-28 cursor-pointer'}>
              <option>Cualquiera</option>
              <option>Tutor</option>
              <option>Jurado</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Aula</label>
          <input type="text" value={filters.aula}
            onChange={e => set('aula', e.target.value)}
            placeholder="Buscar aula…" className={INPUT_CLS} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Ubicación</label>
          <select value={filters.ubicacion}
            onChange={e => set('ubicacion', e.target.value)}
            className={INPUT_CLS + ' cursor-pointer'}>
            <option value="">Todas</option>
            {UBICACIONES.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {activos > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {activos} filtro{activos > 1 ? 's' : ''} activo{activos > 1 ? 's' : ''}
          </span>
          <button onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
            <XIcon /> Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

// ── Skeleton de agenda diaria ─────────────────────────────────────────────
function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[75, 55, 85, 65].map((w, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
          style={{ animationDelay: `${i * 90}ms` }}>
          <div className="h-[3px] bg-secondary animate-pulse" />
          <div className="p-4 flex flex-col gap-2.5">
            <div className="h-3.5 w-28 bg-secondary rounded animate-pulse" />
            <div className="h-4 bg-secondary rounded animate-pulse" style={{ width: `${w}%` }} />
            <div className="h-3 w-1/3 bg-secondary rounded animate-pulse" />
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
              <div className="h-5 w-24 bg-secondary rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tarjeta de mesa en vista de agenda diaria (.acard) ────────────────────
function MesaAgendaCard({ mesa, cedulaSesion, onDetalle }) {
  const esMia    = esParticipante(mesa, cedulaSesion)
  const barColor = ESTADO_BAR[mesa.estado] ?? 'bg-border'

  return (
    <div
      onClick={() => onDetalle?.(mesa)}
      className={`relative bg-card border rounded-[18px] overflow-hidden transition-all hover:border-border/80 hover:-translate-y-[1px] hover:shadow-card
        ${onDetalle ? 'cursor-pointer' : ''}
        ${esMia ? 'shadow-[0_0_0_2px_#caa33a] border-[rgba(202,163,58,.35)]' : 'border-border'}`}
      style={{ padding: '17px 19px 15px' }}
    >
      {/* .astrip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${barColor}`} />

      {/* .a-top */}
      <div className="flex items-center gap-[10px] text-[13px] font-bold text-foreground tabular-nums">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary shrink-0">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {mesa.hora_inicio} – {mesa.hora_fin}
        {esMia && (
          <span className="ml-auto rounded-full bg-[rgba(202,163,58,.14)] border border-[rgba(202,163,58,.34)] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[.04em] text-[#caa33a]">
            TU MESA
          </span>
        )}
      </div>

      {/* .a-name */}
      <p className="mt-[9px] text-[14.5px] font-bold text-foreground">
        {mesa.nombre_estudiante || <span className="text-muted-foreground/50 font-normal">Estudiante no asignado</span>}
      </p>

      {/* .a-mae */}
      {mesa.maestria && (
        <p className="mt-[3px] text-[12px] font-semibold text-primary">{mesa.maestria}</p>
      )}

      {/* .a-tit */}
      {mesa.titulo_proyecto && (
        <p className="mt-[3px] text-[12.5px] text-muted-foreground truncate">{mesa.titulo_proyecto}</p>
      )}

      {/* .a-foot */}
      <div className="mt-[13px] pt-[13px] border-t border-border flex items-center gap-[8px] text-[12.5px] text-muted-foreground">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
          <path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/>
          <path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561z"/>
        </svg>
        <span className="flex-1 truncate">{mesa.aula}</span>
      </div>
    </div>
  )
}

// ── Vista de agenda diaria ────────────────────────────────────────────────
function TimelineDiaria({ mesas, cedulaSesion, onDetalle }) {
  const ordenadas = useMemo(
    () => [...mesas].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    [mesas]
  )

  if (ordenadas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-[10px] py-[60px] text-center">
        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-border bg-secondary/40 text-muted-foreground">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-muted-foreground">No hay mesas programadas este día.</p>
        <p className="text-[12.5px] text-muted-foreground/60">Regresa al calendario para seleccionar otro día.</p>
      </div>
    )
  }

  return (
    <div className="timeline flex flex-col gap-[12px] max-w-[760px]">
      {ordenadas.map(m => (
        <MesaAgendaCard key={m.id} mesa={m} cedulaSesion={cedulaSesion} onDetalle={onDetalle} />
      ))}
    </div>
  )
}

// ── Calendario mensual ────────────────────────────────────────────────────
function CalendarioMensual({ year, month, mesasMes, loading, onDiaClick, onMesAnterior, onMesSiguiente, onHoy }) {
  const hoy       = new Date()
  const esEsteMes = hoy.getFullYear() === year && hoy.getMonth() + 1 === month

  const conteosPorDia = useMemo(() => {
    const counts = {}
    mesasMes.forEach(m => {
      const [dd, mm, yyyy] = m.fecha.split('/')
      if (parseInt(yyyy) === year && parseInt(mm) === month)
        counts[parseInt(dd)] = (counts[parseInt(dd)] || 0) + 1
    })
    return counts
  }, [mesasMes, year, month])

  const celdas = useMemo(() => generarCeldas(year, month), [year, month])

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header — mantiene bg-upel-navy como elemento de marca intencional */}
      <div className="bg-upel-navy px-5 py-3.5 flex items-center justify-between">
        <button onClick={onMesAnterior}
          className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ChevL />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-white font-bold text-base">{MESES[month - 1]} {year}</h2>
          {!esEsteMes && (
            <button onClick={onHoy}
              className="text-[11px] text-upel-gold border border-upel-gold/40 rounded px-2 py-0.5 hover:bg-upel-gold/10 transition-colors">
              Hoy
            </button>
          )}
        </div>
        <button onClick={onMesSiguiente}
          className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ChevR />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEM.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={`v-${i}`} />
            const esHoy    = esEsteMes && dia === hoy.getDate()
            const count    = conteosPorDia[dia] ?? 0
            const hayMesas = count > 0
            return (
              <button key={dia}
                onClick={() => hayMesas && onDiaClick(year, month, dia)}
                disabled={loading || !hayMesas}
                className={[
                  'flex flex-col items-center justify-center rounded-xl py-2 min-h-[54px] transition-colors duration-100',
                  esHoy    ? 'ring-2 ring-upel-gold ring-offset-1' : '',
                  hayMesas ? 'hover:bg-primary/5 cursor-pointer' : 'cursor-default opacity-40',
                ].join(' ')}
              >
                <span className={`text-sm tabular-nums ${esHoy ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                  {dia}
                </span>
                {hayMesas && (
                  <span className="mt-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-pill text-white text-[10px] font-bold tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 pb-3.5 flex items-center gap-2 border-t border-border pt-3">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-pill text-white text-[9px] font-bold">n</span>
        <span className="text-xs text-muted-foreground">= total de mesas ese día · click para ver el timeline</span>
      </div>
    </div>
  )
}

// ── Panel Kanban ──────────────────────────────────────────────────────────
const COLUMNA_CONFIG = {
  en_curso:   { label: 'En Curso',   dot: 'bg-emerald-400',           count: 'bg-emerald-400/[0.12] text-emerald-400' },
  programada: { label: 'Programada', dot: 'bg-primary',               count: 'bg-primary/[0.12] text-primary'         },
  concluida:  { label: 'Concluida',  dot: 'bg-muted-foreground/50',   count: 'bg-secondary/40 text-muted-foreground'  },
}

function PanelKanban({ columnas, totales, onCardClick, cedulaSesion }) {
  return (
    <div className="kanban grid grid-cols-1 md:grid-cols-3 gap-[16px] items-start">
      {Object.entries(COLUMNA_CONFIG).map(([key, cfg]) => {
        const mesas = columnas?.[key] ?? []
        return (
          <div key={key} className="kcol rounded-[18px] border border-border bg-card flex flex-col overflow-hidden" style={{ maxHeight: '72vh' }}>
            {/* .kcol-head */}
            <div className="flex items-center gap-[9px] px-[17px] py-[15px] border-b border-border">
              <div className={`h-[9px] w-[9px] shrink-0 rounded-full ${cfg.dot}`} />
              <span className="text-[13.5px] font-bold text-foreground">{cfg.label}</span>
              <span className={`ml-auto text-[11.5px] font-bold tabular-nums px-[10px] py-[2px] rounded-full ${cfg.count}`}>
                {totales?.[key] ?? 0}
              </span>
            </div>
            {/* .kcol-body */}
            <div className="flex flex-col gap-[11px] p-[13px] overflow-y-auto">
              {mesas.length === 0 ? (
                <p className="kcol-empty py-[28px] text-center text-[12px] text-muted-foreground/50">Sin mesas</p>
              ) : (
                mesas.map(m => <MesaCard key={m.id} mesa={m} onClick={onCardClick} cedulaSesion={cedulaSesion} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Helper highlight ──────────────────────────────────────────────────────
function esParticipante(mesa, cedula) {
  if (!cedula) return false
  return [
    mesa.cedula_estudiante,
    mesa.cedula_tutor_principal ?? mesa.cedula_tutor,
    mesa.cedula_jurado1_principal ?? mesa.cedula_jurado1,
    mesa.cedula_jurado2_principal ?? mesa.cedula_jurado2,
  ].includes(cedula)
}

// ── Componente principal ──────────────────────────────────────────────────
export default function MonitoreoView({ session }) {
  const cedulaSesion = session?.cedula ?? null
  const ahora  = new Date()

  const [vista,   setVista]   = useState('calendario')
  const [navDate, setNavDate] = useState({ year: ahora.getFullYear(), month: ahora.getMonth() + 1 })
  const [diaISO,  setDiaISO]  = useState(null)

  const [mesasMes,   setMesasMes]   = useState([])
  const [loadingMes, setLoadingMes] = useState(true)
  const [errorMes,   setErrorMes]   = useState(null)

  const [mesasDia,   setMesasDia]   = useState([])
  const [loadingDia, setLoadingDia] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [errorDia,   setErrorDia]   = useState(null)
  const [countdown,  setCountdown]  = useState(POLL_SECS)

  const [confirm,     setConfirm]     = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState(null)
  const [filters,     setFilters]     = useState(FILTROS_VACIO)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Panel operativo
  const [panel,        setPanel]        = useState(null)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [errorPanel,   setErrorPanel]   = useState(null)
  const [mesaDetalle,  setMesaDetalle]  = useState(null)

  const pollRef      = useRef(null)
  const countdownRef = useRef(null)
  const panelPollRef = useRef(null)

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), type === 'ok' ? 3000 : 5000)
  }, [])

  const mesasMesFiltradas = useMemo(() => filtrarMesas(mesasMes, filters), [mesasMes, filters])
  const mesasDiaFiltradas = useMemo(() => filtrarMesas(mesasDia, filters), [mesasDia, filters])
  const filtrosActivos    = useMemo(() =>
    Object.entries(filters).filter(([k, v]) => v && !(k === 'rolProfesor' && v === 'Cualquiera')).length,
  [filters])

  const loadMes = useCallback(async () => {
    setLoadingMes(true); setErrorMes(null)
    try   { setMesasMes(await monitoreoService.getMesasMes(navDate.year, navDate.month)) }
    catch (e) { setErrorMes(e.detail ?? 'No se pudo cargar el calendario.') }
    finally   { setLoadingMes(false) }
  }, [navDate.year, navDate.month])

  useEffect(() => { loadMes() }, [loadMes])

  const resetCountdown = useCallback(() => {
    clearInterval(countdownRef.current)
    setCountdown(POLL_SECS)
    countdownRef.current = setInterval(() => setCountdown(c => (c > 1 ? c - 1 : 0)), 1000)
  }, [])

  const loadDia = useCallback(async (manual = false) => {
    if (!diaISO) return
    if (manual) setRefreshing(true)
    setErrorDia(null)
    try   { setMesasDia(await monitoreoService.getMesasDia(diaISO)) }
    catch (e) { setErrorDia(e.detail ?? 'No se pudo cargar las mesas.') }
    finally   { setLoadingDia(false); setRefreshing(false); resetCountdown() }
  }, [diaISO, resetCountdown])

  useEffect(() => {
    if (vista !== 'dia' || !diaISO) return
    setLoadingDia(true)
    loadDia()
    pollRef.current = setInterval(() => loadDia(), POLL_SECS * 1000)
    return () => { clearInterval(pollRef.current); clearInterval(countdownRef.current) }
  }, [vista, diaISO, loadDia])

  const loadPanel = useCallback(async () => {
    setErrorPanel(null)
    try   { setPanel(await monitoreoService.getMonitoreo()) }
    catch (e) { setErrorPanel(e.detail ?? 'No se pudo cargar el panel.') }
    finally   { setLoadingPanel(false) }
  }, [])

  useEffect(() => {
    if (vista !== 'panel') return
    setLoadingPanel(true)
    loadPanel()
    panelPollRef.current = setInterval(loadPanel, POLL_SECS * 1000)
    return () => clearInterval(panelPollRef.current)
  }, [vista, loadPanel])

  // Recalcula minutos_restantes / en_sobretiempo localmente cada minuto
  // para que el indicador de tiempo sea fluido entre polls del backend.
  useEffect(() => {
    if (vista !== 'panel') return
    const tick = () => {
      setPanel(prev => {
        if (!prev || prev.columnas.en_curso.length === 0) return prev
        const ahora = new Date()
        const enCursoActualizado = prev.columnas.en_curso.map(m => {
          const horaFin = new Date()
          const [h, min] = m.hora_fin.split(':').map(Number)
          horaFin.setHours(h, min, 0, 0)
          const diffSeg = (horaFin - ahora) / 1000
          return {
            ...m,
            minutos_restantes: Math.max(0, Math.floor(diffSeg / 60)),
            en_sobretiempo:    diffSeg < 0,
          }
        })
        return { ...prev, columnas: { ...prev.columnas, en_curso: enCursoActualizado } }
      })
    }
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [vista])

  const handleValidarCorrecciones = useCallback((id_mesa) => {
    setPanel(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columnas: {
          ...prev.columnas,
          concluida: prev.columnas.concluida.map(m =>
            m.id === id_mesa ? { ...m, estado: 'Aprobada' } : m
          ),
        },
      }
    })
    showToast('ok', 'Correcciones validadas.')
    setTimeout(loadPanel, 1000)
  }, [loadPanel, showToast])

  const irADia = (year, month, dia) => { setDiaISO(toISO(year, month, dia)); setVista('dia') }
  const volverCalendario = () => {
    clearInterval(pollRef.current); clearInterval(countdownRef.current)
    setVista('calendario'); setMesasDia([]); setDiaISO(null)
  }
  const mesAnterior  = () => setNavDate(({ year, month }) =>
    month === 1  ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  const mesSiguiente = () => setNavDate(({ year, month }) =>
    month === 12 ? { year: year + 1, month: 1  } : { year, month: month + 1 })
  const irAHoy = () => { const n = new Date(); setNavDate({ year: n.getFullYear(), month: n.getMonth() + 1 }) }

  const handleSuspenderDia = async () => {
    if (!confirm) return
    setSaving(true)
    try {
      await mesasService.suspender(confirm.mesa.id)
      showToast('ok', 'Mesa suspendida.')
      setConfirm(null); loadDia(); loadMes()
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo suspender la mesa.')
    } finally { setSaving(false) }
  }

  return (
    <div className="relative mx-auto max-w-[1400px] flex flex-col gap-5">
      <div className="aura" />

      {/* Cabecera de página */}
      <header className="mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="19" cy="6" r="3"/><path d="M22 12v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
          Operaciones
        </p>
        <h1 className="mt-2 text-[25px] font-bold tracking-tight text-foreground leading-tight">Monitoreo de defensas</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[520px] leading-relaxed">
          Seguimiento en tiempo real de las mesas: calendario mensual, agenda diaria y panel operativo con actualización automática.
        </p>
      </header>

      {/* Tabs de vista */}
      <div className="inline-flex items-center gap-[3px] p-1 bg-secondary/40 border border-border rounded-[13px] w-fit">
        <button
          onClick={() => { if (vista === 'panel') setVista('calendario') }}
          className={`inline-flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-semibold rounded-[9px] transition-all ${
            vista !== 'panel'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          Calendario
        </button>
        <button
          onClick={() => {
            clearInterval(pollRef.current); clearInterval(countdownRef.current)
            setVista('panel')
          }}
          className={`inline-flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-semibold rounded-[9px] transition-all ${
            vista === 'panel'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Panel Operativo
        </button>
      </div>

      {/* Barra de filtros — solo en vista calendario / día */}
      {vista !== 'panel' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`inline-flex items-center gap-2 text-[12.5px] font-semibold px-[15px] py-[9px] rounded-[30px] border transition-all ${
                filtersOpen || filtrosActivos > 0
                  ? 'bg-gradient-pill text-white border-transparent shadow-[0_4px_14px_-5px_rgba(46,108,166,.7)]'
                  : 'text-muted-foreground border-border hover:bg-secondary/40'
              }`}
            >
              <FilterIcon />
              Filtros
              {filtrosActivos > 0 && (
                <span className="ml-0.5 inline-grid place-items-center min-w-[18px] h-[18px] px-[5px] rounded-[30px] bg-white/[0.22] text-[10px] font-bold">
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>
          {filtersOpen && (
            <FiltersPanel filters={filters} onChange={setFilters}
              onClear={() => setFilters(FILTROS_VACIO)} activos={filtrosActivos} />
          )}
        </div>
      )}

      {/* Vista: Calendario */}
      {vista === 'calendario' && (
        errorMes ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertIcon />
            <p className="text-sm">{errorMes}</p>
            <button onClick={loadMes}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
              <RefreshIcon /> Reintentar
            </button>
          </div>
        ) : (
          <CalendarioMensual
            year={navDate.year} month={navDate.month}
            mesasMes={mesasMesFiltradas} loading={loadingMes}
            onDiaClick={irADia}
            onMesAnterior={mesAnterior} onMesSiguiente={mesSiguiente} onHoy={irAHoy}
          />
        )
      )}

      {/* Vista: Día */}
      {vista === 'dia' && (
        <>
          {/* .dia-head */}
          <div className="flex items-center gap-[16px] flex-wrap">
            <button onClick={volverCalendario}
              className="inline-flex items-center gap-[7px] rounded-[11px] border border-border px-[15px] py-[9px] text-[13px] font-semibold text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary shrink-0">
              <ChevL /> Calendario
            </button>
            <p className="text-[16px] font-bold text-foreground capitalize first-letter:uppercase">
              {diaISO && formatearDiaLargo(diaISO)}
            </p>
            <div className="ml-auto inline-flex items-center gap-[7px] text-[12px] text-muted-foreground">
              <div className={`h-2 w-2 shrink-0 rounded-full ${loadingDia ? 'bg-muted-foreground/30' : 'bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,.2)]'}`} />
              {loadingDia ? 'Cargando…' : `Actualiza en ${countdown}s`}
            </div>
            <button onClick={() => loadDia(true)} disabled={loadingDia || refreshing}
              className="inline-flex items-center gap-[7px] rounded-[11px] border border-border px-[15px] py-[9px] text-[12.5px] font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-40 shrink-0">
              <RefreshIcon spin={refreshing} /> Actualizar
            </button>
          </div>

          {loadingDia ? (
            <AgendaSkeleton />
          ) : errorDia ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertIcon />
              <p className="text-sm">{errorDia}</p>
              <button onClick={() => loadDia()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
                <RefreshIcon /> Reintentar
              </button>
            </div>
          ) : (
            <TimelineDiaria mesas={mesasDiaFiltradas} cedulaSesion={cedulaSesion} onDetalle={setMesaDetalle} />
          )}

          <p className="text-[11.5px] text-muted-foreground/40 text-center max-w-[760px]">
            Actualización automática cada {POLL_SECS} s
          </p>
        </>
      )}

      {/* Vista: Panel operativo */}
      {vista === 'panel' && (
        <>
          <div className="flex items-center gap-4">
            <p className="text-[15px] font-bold text-foreground">
              Hoy — <b className="text-primary font-bold tabular-nums">{panel?.fecha ?? '…'}</b>
            </p>
            <div className="flex-1" />
            <button onClick={() => { setLoadingPanel(true); loadPanel() }}
              disabled={loadingPanel}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40 px-4 py-2 rounded-xl border border-border hover:bg-primary/5 transition-colors">
              <RefreshIcon spin={loadingPanel} /> Actualizar
            </button>
          </div>

          {loadingPanel && !panel ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card h-64 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : errorPanel ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertIcon />
              <p className="text-sm">{errorPanel}</p>
              <button onClick={() => { setLoadingPanel(true); loadPanel() }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
                <RefreshIcon /> Reintentar
              </button>
            </div>
          ) : (
            <PanelKanban
              columnas={panel?.columnas}
              totales={panel?.totales}
              onCardClick={setMesaDetalle}
              cedulaSesion={cedulaSesion}
            />
          )}

          <p className="text-xs text-muted-foreground/50 text-center">
            Actualización automática cada {POLL_SECS} s · Haz clic en una tarjeta para ver el detalle
          </p>
        </>
      )}

      {/* Modal detalle de mesa */}
      <MesaDetalleModal
        mesa={mesaDetalle}
        onClose={() => setMesaDetalle(null)}
        session={session}
        onValidarCorrecciones={handleValidarCorrecciones}
      />

      {/* Modal confirmación suspender */}
      <Modal open={!!confirm} onClose={() => !saving && setConfirm(null)}
        title="Suspender mesa" width="max-w-sm">
        {confirm && (
          <div className="space-y-5">
            <div className="px-4 py-3 rounded-xl border bg-red-50 border-red-100">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-1">
                Marcar como suspendida
              </p>
              <p className="text-sm font-medium text-foreground">{confirm.mesa.nombre_estudiante}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {confirm.mesa.fecha} · {confirm.mesa.hora_inicio}–{confirm.mesa.hora_fin} · {confirm.mesa.aula}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La mesa quedará suspendida y será excluida de verificaciones de horario futuras.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirm(null)} disabled={saving}
                className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSuspenderDia} disabled={saving}
                className="px-4 py-2 text-sm rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium
          ${toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
          style={{ animation: 'modalIn 200ms ease-out' }}>
          {toast.type === 'ok' ? <CheckIcon /> : <AlertIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
