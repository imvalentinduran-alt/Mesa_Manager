import { useState, useEffect, useMemo, useCallback } from 'react'
import { mesasService } from '@/features/mesas'
import Modal from '@/shared/components/Modal'

// ── Paleta semántica de estados ───────────────────────────────────────────
const ESTADO_BADGE = {
  Programada:       'bg-primary/[0.12]      text-primary     border-primary/[0.22]',
  En_Curso:         'bg-emerald-400/[0.12]  text-emerald-400 border-emerald-400/[0.28]',
  Aprobada:         'bg-emerald-500/[0.12]  text-emerald-500 border-emerald-500/[0.22]',
  Con_Correcciones: 'bg-amber-500/[0.12]    text-amber-500   border-amber-500/[0.24]',
  Reprobada:        'bg-red-500/[0.12]      text-red-500     border-red-500/[0.22]',
  Suspendida:       'bg-secondary/40        text-muted-foreground border-border',
}
const ESTADO_LABEL = {
  En_Curso:         'En Curso',
  Con_Correcciones: 'Con Correcciones',
}
const ESTADO_STAT = {
  Programada:       'bg-primary/[0.12]     text-primary',
  En_Curso:         'bg-emerald-400/[0.12] text-emerald-400',
  Aprobada:         'bg-emerald-500/[0.12] text-emerald-500',
  Con_Correcciones: 'bg-amber-500/[0.12]   text-amber-500',
  Reprobada:        'bg-red-500/[0.12]     text-red-500',
  Suspendida:       'bg-secondary/40       text-muted-foreground',
}
const TIPO_BADGE = {
  1: 'bg-secondary/40 border border-border text-muted-foreground',
  2: 'bg-secondary/40 border border-border text-muted-foreground',
  3: 'bg-amber-500/[0.12] border border-amber-500/[0.24] text-amber-500',
}

// ── Iconos ─────────────────────────────────────────────────────────────────
const SearchIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const FilterIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const CloseIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const UserIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const DoorIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561z"/></svg>
const GradCapIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
const ActivityIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const AlertIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const CheckIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const RetryIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const XSmall     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// ── Helpers puros ──────────────────────────────────────────────────────────
function esParticipante(mesa, cedula) {
  if (!cedula) return false
  return [mesa.cedula_estudiante, mesa.cedula_tutor_principal, mesa.cedula_jurado1_principal, mesa.cedula_jurado2_principal]
    .includes(cedula)
}

function parseFechaToISO(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m}-${d}`
}

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function distribuirColumnas(mesasDelDia) {
  const sorted = [...mesasDelDia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const cols = []
  const result = sorted.map(m => {
    const idx = cols.findIndex(fin => fin <= m.hora_inicio)
    if (idx === -1) {
      cols.push(m.hora_fin)
      return { ...m, _col: cols.length - 1 }
    }
    cols[idx] = m.hora_fin
    return { ...m, _col: idx }
  })
  return { bloques: result, totalCols: Math.max(cols.length, 1) }
}

// ── Badges ─────────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center gap-[6px] text-[11px] font-semibold px-[11px] py-1 rounded-full border whitespace-nowrap
      ${ESTADO_BADGE[estado] ?? 'bg-secondary/40 text-muted-foreground border-border'}`}>
      <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-current" />
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  )
}

function TipoBadge({ tipo }) {
  return (
    <span className={`inline-flex items-center justify-center h-[26px] w-[26px] rounded-full text-[12px] font-bold
      ${TIPO_BADGE[tipo] ?? TIPO_BADGE[1]}`}>
      {tipo}
    </span>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 7 }, (_, i) => (
    <tr key={i} className="border-b border-border/50">
      {Array.from({ length: 8 }, (_, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-3 bg-secondary rounded animate-pulse"
            style={{ width: `${50 + ((i * 3 + j) * 11) % 40}%`, animationDelay: `${i * 55 + j * 18}ms` }} />
        </td>
      ))}
    </tr>
  ))
}

// ── Estilos ────────────────────────────────────────────────────────────────
const FILTER_INPUT      = 'h-11 rounded-xl border border-border bg-secondary/40 px-[14px] text-[13px] text-foreground outline-none transition-all cursor-pointer focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12] placeholder:text-muted-foreground/60'
const FILTER_INPUT_ICON = 'h-11 rounded-xl border border-border bg-secondary/40 pl-9 pr-[14px] text-[13px] text-foreground outline-none transition-all cursor-pointer focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'
const EMPTY_FILTERS = { estado: '', aula: '', fecha_desde: '', fecha_hasta: '' }

// ── Tira de color por estado (borde superior de cada tarjeta) ─────────────
const ESTADO_BAR = {
  Programada:       'bg-primary',
  En_Curso:         'bg-emerald-400',
  Aprobada:         'bg-emerald-500',
  Con_Correcciones: 'bg-amber-500',
  Reprobada:        'bg-red-500',
  Suspendida:       'bg-muted-foreground/40',
}

// ── CalendarioView — Agenda semanal dinámica ──────────────────────────────
function MiniCard({ mesa, onClick, cedulaSesion }) {
  const esMia = esParticipante(mesa, cedulaSesion)
  return (
    <button
      onClick={() => onClick(mesa)}
      className={`relative w-full text-left rounded-[11px] border overflow-hidden transition-all hover:-translate-y-[2px] hover:shadow-card focus-visible:outline-none
        ${esMia ? 'shadow-[0_0_0_2px_#caa33a] border-[rgba(202,163,58,.4)]' : 'border-border bg-secondary/40 hover:border-border/80'}`}
      style={{ padding: '11px 11px 10px' }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${ESTADO_BAR[mesa.estado] ?? 'bg-border'}`} />
      <div className="mt-[3px] text-[11px] font-bold text-foreground tabular-nums">{mesa.hora_inicio} – {mesa.hora_fin}</div>
      <div className="mt-[5px] text-[11.5px] font-semibold text-foreground leading-[1.3] line-clamp-2">
        {esMia && <span className="mr-1 align-middle rounded-full bg-[rgba(202,163,58,.14)] border border-[rgba(202,163,58,.34)] px-[6px] py-px text-[9px] font-bold text-[#caa33a]">TÚ</span>}
        {mesa.nombre_estudiante}
      </div>
      {mesa.maestria && <div className="mt-[3px] text-[10px] text-muted-foreground truncate">{mesa.maestria}</div>}
      <div className="mt-[8px] flex items-center gap-[6px] text-[10px] text-muted-foreground">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
          <path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/>
          <path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561z"/>
        </svg>
        <span className="flex-1 truncate">{mesa.aula}</span>
        <span className={`shrink-0 px-[7px] py-[2px] rounded-full text-[9px] font-bold border ${ESTADO_BADGE[mesa.estado] ?? 'bg-secondary/40 border-border text-muted-foreground'}`}>
          {(ESTADO_LABEL[mesa.estado] ?? mesa.estado).slice(0, 4)}
        </span>
      </div>
    </button>
  )
}

function CalendarioView({ mesas, weekStart, onMesaClick, cedulaSesion }) {
  const hoy = new Date().toISOString().split('T')[0]
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {weekDays.map((day, di) => {
        const iso   = day.toISOString().split('T')[0]
        const isHoy = iso === hoy
        const dn    = day.toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', '').toUpperCase()
        const dd    = day.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })
        const mesasDelDia = mesas
          .filter(m => parseFechaToISO(m.fecha) === iso)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

        return (
          <div key={di} className={`rounded-[14px] border overflow-hidden flex flex-col bg-card ${isHoy ? 'border-primary' : 'border-border'}`}>
            {/* .dhead */}
            <div className={`px-3 py-[11px] border-b border-border text-center ${isHoy ? 'bg-primary/[0.12]' : ''}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{dn}</div>
              <div className={`mt-[2px] text-[15px] font-bold tabular-nums ${isHoy ? 'text-primary' : 'text-foreground'}`}>{dd}</div>
            </div>
            {/* .dbody */}
            <div className={`flex flex-col gap-[9px] p-[10px] min-h-[200px] ${isHoy ? 'bg-primary/[0.03]' : ''}`}>
              {mesasDelDia.length === 0 ? (
                <div className="m-auto text-[11px] text-muted-foreground/60 select-none">Sin defensas</div>
              ) : (
                mesasDelDia.map(m => (
                  <MiniCard key={m.id} mesa={m} onClick={onMesaClick} cedulaSesion={cedulaSesion} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── MesaDetailModal ────────────────────────────────────────────────────────
function MesaDetailModal({ mesa, onClose, onCambiarEstado, onValidarCorrecciones, saving, isJefa }) {
  const Row = ({ label, children }) => (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-0.5">{label}</p>
      {children}
    </div>
  )
  return (
    <Modal open={!!mesa} onClose={onClose} title="Detalle de la mesa" width="max-w-md">
      {mesa && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Row label="Estudiante">
              <p className="text-sm font-semibold text-foreground col-span-2">{mesa.nombre_estudiante ?? mesa.estudiante}</p>
            </Row>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-0.5">Título</p>
              <p className="text-sm text-foreground leading-snug">{mesa.titulo_proyecto ?? mesa.titulo}</p>
            </div>
            <Row label="Tutor"><p className="text-sm text-foreground">{mesa.tutor_efectivo ?? mesa.tutor_principal ?? mesa.tutor}</p></Row>
            <Row label="Jurado 1"><p className="text-sm text-foreground">{mesa.jurado1_efectivo ?? mesa.jurado1_principal ?? mesa.jurado1}</p></Row>
            <Row label="Jurado 2"><p className="text-sm text-foreground">{mesa.jurado2_efectivo ?? mesa.jurado2_principal ?? mesa.jurado2}</p></Row>
            <Row label="Aula"><p className="text-sm text-foreground">{mesa.aula}</p></Row>
            <Row label="Fecha"><p className="text-sm text-foreground tabular-nums">{mesa.fecha}</p></Row>
            <Row label="Horario"><p className="text-sm text-foreground tabular-nums">{mesa.hora_inicio} – {mesa.hora_fin}</p></Row>
            <Row label="Tipo">
              <div className="flex items-center gap-1.5 mt-0.5">
                <TipoBadge tipo={mesa.tipo_mesa} />
                <span className="text-sm text-muted-foreground">Mesa {mesa.tipo_mesa}</span>
              </div>
            </Row>
            <Row label="Estado"><EstadoBadge estado={mesa.estado} /></Row>
            {mesa.veredicto && (
              <Row label="Veredicto"><p className="text-sm text-foreground">{mesa.veredicto}</p></Row>
            )}
            {mesa.fecha_limite_correccion && (
              <Row label="Límite corrección"><p className="text-sm text-foreground tabular-nums">{mesa.fecha_limite_correccion}</p></Row>
            )}
          </div>

          {(mesa.estado === 'Programada' && isJefa) && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => onCambiarEstado(mesa, 'Suspendida')} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors">
                <XSmall /> Suspender
              </button>
            </div>
          )}
          {mesa.estado === 'Con_Correcciones' && (
            <div className="flex justify-end pt-2 border-t border-border">
              <button onClick={() => onValidarCorrecciones(mesa)} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-xl hover:bg-amber-100 disabled:opacity-50 transition-colors">
                <CheckIcon /> Validar Correcciones → Aprobada
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── VeredictoModal ─────────────────────────────────────────────────────────
const VEREDICTO_OPCIONES = [
  {
    id: 'Aprobado',
    label: 'Aprobado',
    desc: 'La defensa fue aprobada sin observaciones.',
    color: { selected: 'border-green-200 bg-green-50', text: 'text-green-700', btn: 'bg-green-600 hover:bg-green-700' },
  },
  {
    id: 'Con_Correcciones',
    label: 'Aprobado con Correcciones',
    desc: 'Requiere correcciones antes de la entrega final.',
    color: { selected: 'border-amber-200 bg-amber-50', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
  },
  {
    id: 'Reprobado',
    label: 'Reprobado',
    desc: 'La defensa no fue aprobada.',
    color: { selected: 'border-red-200 bg-red-50', text: 'text-red-700', btn: 'bg-red-600 hover:bg-red-700' },
  },
]

function VeredictoModal({ mesa, veredicto, setVeredicto, dias, setDias, onClose, onConfirm, saving }) {
  const opcionActiva = VEREDICTO_OPCIONES.find(o => o.id === veredicto) ?? VEREDICTO_OPCIONES[0]

  const fechaLimite = (() => {
    const d = new Date()
    d.setDate(d.getDate() + dias)
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
  })()

  return (
    <Modal open={!!mesa} onClose={onClose} title="Veredicto de la defensa" width="max-w-md">
      {mesa && (
        <div className="space-y-5">
          <div className="px-4 py-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm font-semibold text-foreground">{mesa.estudiante}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mesa.fecha} · {mesa.hora_inicio}–{mesa.hora_fin} · {mesa.aula}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Veredicto</p>
            {VEREDICTO_OPCIONES.map(op => (
              <label key={op.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                  ${veredicto === op.id ? op.color.selected : 'border-border hover:bg-secondary/50'}`}>
                <input type="radio" name="veredicto" value={op.id}
                  checked={veredicto === op.id}
                  onChange={() => setVeredicto(op.id)}
                  className="mt-0.5 accent-primary" />
                <div>
                  <p className={`text-sm font-medium ${veredicto === op.id ? op.color.text : 'text-foreground'}`}>
                    {op.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{op.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {veredicto === 'Con_Correcciones' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/60">
              <label className="text-sm font-medium text-amber-800 shrink-0">Días para corrección:</label>
              <input type="number" value={dias} min={1} max={365}
                onChange={e => setDias(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-1.5 text-sm text-center border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white tabular-nums" />
              <span className="text-xs text-amber-700">Límite: {fechaLimite}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1 border-t border-border">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={saving}
              className={`px-4 py-2 text-sm rounded-xl text-white disabled:opacity-50 transition-colors ${opcionActiva.color.btn}`}>
              {saving ? 'Guardando…' : 'Confirmar veredicto'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function VisualizarView({ session }) {
  const cedulaSesion = session?.cedula ?? null
  const isJefa = session?.rol === 'Jefa'

  const [mesas,            setMesas]            = useState([])
  const [loading,          setLoading]          = useState(true)
  const [loadErr,          setLoadErr]          = useState(null)
  const [filters,          setFilters]          = useState(EMPTY_FILTERS)
  const [appliedFilters,   setAppliedFilters]   = useState(EMPTY_FILTERS)
  const [search,           setSearch]           = useState('')
  const [confirmChange,    setConfirmChange]    = useState(null)
  const [saving,           setSaving]           = useState(false)
  const [toast,            setToast]            = useState(null)
  const [viewMode,         setViewMode]         = useState('tabla')
  const [weekStart,        setWeekStart]        = useState(() => getMondayOf(new Date()))
  const [filterTutor,      setFilterTutor]      = useState('')
  const [filterAula,       setFilterAula]       = useState('')
  const [filterEstudiante, setFilterEstudiante] = useState('')
  const [mesaDetalle,           setMesaDetalle]           = useState(null)
  const [veredictoModal,        setVeredictoModal]        = useState(null)
  const [veredictoSeleccionado, setVeredictoSeleccionado] = useState('Aprobado')
  const [diasCorreccion,        setDiasCorreccion]        = useState(15)

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    const id = setTimeout(() => setToast(null), type === 'ok' ? 3000 : 5000)
    return () => clearTimeout(id)
  }, [])

  const openVeredictoModal = useCallback((mesa) => {
    setVeredictoSeleccionado('Aprobado')
    setDiasCorreccion(15)
    setVeredictoModal({ mesa })
  }, [])

  const load = useCallback(async (activeFilters = EMPTY_FILTERS) => {
    setLoading(true); setLoadErr(null)
    try   { setMesas(await mesasService.getAll(activeFilters)) }
    catch (e) { setLoadErr(e.detail ?? e.message ?? 'Error al cargar las mesas.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const setFilter   = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const handleApply = ()     => { setAppliedFilters(filters); load(filters) }
  const handleClear = ()     => {
    setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS)
    setSearch(''); setFilterTutor(''); setFilterAula(''); setFilterEstudiante('')
    load(EMPTY_FILTERS)
  }

  const hasActiveFilters =
    Object.values(appliedFilters).some(Boolean) ||
    !!filterTutor || !!filterAula || !!filterEstudiante || !!filters.estado

  const filteredMesas = useMemo(() => {
    let result = mesas
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        (m.nombre_estudiante ?? '').toLowerCase().includes(q) ||
        (m.titulo_proyecto   ?? '').toLowerCase().includes(q) ||
        (m.tutor_principal   ?? '').toLowerCase().includes(q)
      )
    }
    if (filterTutor)      result = result.filter(m => (m.tutor_principal   ?? '').toLowerCase().includes(filterTutor.toLowerCase()))
    if (filterAula)       result = result.filter(m => (m.aula              ?? '').toLowerCase().includes(filterAula.toLowerCase()))
    if (filterEstudiante) result = result.filter(m => (m.nombre_estudiante ?? '').toLowerCase().includes(filterEstudiante.toLowerCase()))
    if (filters.estado)   result = result.filter(m => m.estado === filters.estado)
    return result
  }, [mesas, search, filterTutor, filterAula, filterEstudiante, filters.estado])

  const tutoresUnicos     = useMemo(() => [...new Set(mesas.map(m => m.tutor_principal))].sort(),    [mesas])
  const aulasUnicas       = useMemo(() => [...new Set(mesas.map(m => m.aula))].sort(),               [mesas])
  const estudiantesUnicos = useMemo(() => [...new Set(mesas.map(m => m.nombre_estudiante))].sort(),  [mesas])

  const stats = useMemo(() => ({
    total:           mesas.length,
    programadas:     mesas.filter(m => m.estado === 'Programada').length,
    enCurso:         mesas.filter(m => m.estado === 'En_Curso').length,
    aprobadas:       mesas.filter(m => m.estado === 'Aprobada').length,
    conCorreccion:   mesas.filter(m => m.estado === 'Con_Correcciones').length,
    reprobadas:      mesas.filter(m => m.estado === 'Reprobada').length,
    suspendidas:     mesas.filter(m => m.estado === 'Suspendida').length,
  }), [mesas])

  const handleSuspender = async () => {
    if (!confirmChange) return
    setSaving(true)
    try {
      await mesasService.suspender(confirmChange.mesa.id)
      showToast('ok', 'Mesa suspendida.')
      setConfirmChange(null)
      load(appliedFilters)
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo suspender la mesa.')
    } finally { setSaving(false) }
  }

  const handleVeredictoConfirm = async () => {
    if (!veredictoModal) return
    setSaving(true)
    try {
      await mesasService.registrarVeredicto(veredictoModal.mesa.id, {
        veredicto: veredictoSeleccionado,
        dias_correccion: diasCorreccion,
      })
      showToast('ok', 'Veredicto registrado.')
      setVeredictoModal(null)
      load(appliedFilters)
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo registrar el veredicto.')
    } finally { setSaving(false) }
  }

  const handleValidarCorrecciones = async (mesa) => {
    setSaving(true)
    try {
      await mesasService.validarCorrecciones(mesa.id)
      showToast('ok', 'Correcciones validadas. Mesa aprobada.')
      load(appliedFilters)
    } catch (e) {
      showToast('err', e.detail ?? 'No se pudo validar.')
    } finally { setSaving(false) }
  }

  const handleMesaClick = (m) => setMesaDetalle(m)

  const handleCambiarEstadoDesdeDetalle = (mesa, targetEstado) => {
    setMesaDetalle(null)
    setConfirmChange({ mesa, targetEstado })
  }

  const semanaLabel = (() => {
    const lun = new Date(weekStart)
    const vie = new Date(weekStart)
    vie.setDate(vie.getDate() + 4)
    const fmt     = (d) => d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })
    const dayShort = (d) => {
      const s = d.toLocaleDateString('es-VE', { weekday: 'short' })
      return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '')
    }
    return `${dayShort(lun)} ${fmt(lun)} – ${dayShort(vie)} ${fmt(vie)}`
  })()

  const prevWeek = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d)
  }
  const nextWeek = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d)
  }

  const anyFilterActive = search || filterTutor || filterAula || filterEstudiante || filters.estado

  return (
    <div className="relative mx-auto max-w-[1400px] flex flex-col gap-4">
      <div className="aura" />

      {/* Cabecera de página */}
      <header className="mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>
          Operaciones
        </p>
        <h1 className="mt-2 text-[25px] font-bold tracking-tight text-foreground leading-tight">Visualizar mesas de defensa</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[520px] leading-relaxed">
          Consulta las defensas programadas en tabla o calendario semanal. Registra veredictos, valida correcciones y suspende mesas según tu rol.
        </p>
      </header>

      {/* Buscador */}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-[15px] text-muted-foreground/60">
          <SearchIcon />
        </span>
        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por estudiante, título o tutor…"
          className="w-full rounded-[13px] border border-border bg-card px-[44px] py-[13px] text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/[0.12]"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 grid h-[26px] w-[26px] place-items-center rounded-[8px] text-muted-foreground/60 transition-all hover:bg-secondary hover:text-foreground">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Barra de controles */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><UserIcon /></span>
          <select value={filterTutor} onChange={e => setFilterTutor(e.target.value)}
            className={FILTER_INPUT_ICON + ' w-44'}>
            <option value="">Todos los tutores</option>
            {tutoresUnicos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><DoorIcon /></span>
          <select value={filterAula} onChange={e => setFilterAula(e.target.value)}
            className={FILTER_INPUT_ICON + ' w-36'}>
            <option value="">Todas las aulas</option>
            {aulasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><GradCapIcon /></span>
          <select value={filterEstudiante} onChange={e => setFilterEstudiante(e.target.value)}
            className={FILTER_INPUT_ICON + ' w-44'}>
            <option value="">Todos los estudiantes</option>
            {estudiantesUnicos.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500"><ActivityIcon /></span>
          <select value={filters.estado} onChange={e => setFilter('estado', e.target.value)}
            className={FILTER_INPUT_ICON + ' w-44'}>
            <option value="">Todos los estados</option>
            <option value="Programada">Programada</option>
            <option value="En_Curso">En Curso</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Con_Correcciones">Con Correcciones</option>
            <option value="Reprobada">Reprobada</option>
            <option value="Suspendida">Suspendida</option>
          </select>
        </div>

        {viewMode === 'tabla' && (
          <>
            <div className="flex items-center gap-[7px]">
              <label className="text-[11px] font-semibold text-muted-foreground">Desde</label>
              <input type="date" value={filters.fecha_desde}
                onChange={e => setFilter('fecha_desde', e.target.value)}
                className={FILTER_INPUT + ' w-[140px] [color-scheme:dark]'} />
            </div>
            <div className="flex items-center gap-[7px]">
              <label className="text-[11px] font-semibold text-muted-foreground">Hasta</label>
              <input type="date" value={filters.fecha_hasta}
                onChange={e => setFilter('fecha_hasta', e.target.value)}
                className={FILTER_INPUT + ' w-[140px] [color-scheme:dark]'} />
            </div>
            <button onClick={handleApply} disabled={loading}
              className="inline-flex items-center gap-[7px] rounded-[30px] bg-gradient-pill px-[15px] py-[9px] text-[12.5px] font-semibold text-white shadow-[0_4px_14px_-5px_rgba(46,108,166,.7)] disabled:opacity-50 transition-all hover:brightness-110">
              <FilterIcon /> Aplicar
            </button>
          </>
        )}

        {hasActiveFilters && (
          <button onClick={handleClear}
            className="inline-flex items-center gap-[7px] rounded-[30px] border border-border px-[15px] py-[9px] text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-red-500/[0.22] hover:bg-red-500/[0.1] hover:text-red-500">
            <XSmall /> Limpiar
          </button>
        )}

        <div className="ml-auto inline-flex items-center gap-[3px] rounded-[11px] border border-border bg-secondary/40 p-1">
          {[
            { key: 'tabla',      label: 'Tabla',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
            { key: 'calendario', label: 'Calendario', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`inline-flex items-center gap-[7px] rounded-[8px] px-[15px] py-2 text-[12.5px] font-semibold transition-all
                ${viewMode === key
                  ? 'bg-gradient-pill text-white shadow-[0_2px_10px_-4px_rgba(46,108,166,.7)]'
                  : 'text-muted-foreground hover:text-foreground'
                }`}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación de semana — solo en modo calendario */}
      {viewMode === 'calendario' && (
        <div className="flex items-center justify-center gap-[16px] mb-2">
          <button onClick={prevWeek}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="min-w-[240px] text-center text-[14px] font-bold text-foreground tabular-nums">{semanaLabel}</span>
          <button onClick={nextWeek}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {!loading && !loadErr && (
        <div className="flex items-center gap-[11px] flex-wrap text-[12.5px]">
          <span className="font-bold text-foreground tabular-nums">
            {anyFilterActive ? filteredMesas.length : stats.total} mesas
          </span>
          <div className="h-4 w-px bg-border" />
          {[
            { label: 'Programadas',      count: stats.programadas,   estado: 'Programada'       },
            { label: 'En Curso',         count: stats.enCurso,       estado: 'En_Curso'         },
            { label: 'Aprobadas',        count: stats.aprobadas,     estado: 'Aprobada'         },
            { label: 'Con Correcciones', count: stats.conCorreccion, estado: 'Con_Correcciones' },
            { label: 'Reprobadas',       count: stats.reprobadas,    estado: 'Reprobada'        },
            { label: 'Suspendidas',      count: stats.suspendidas,   estado: 'Suspendida'       },
          ].map(({ label, count, estado }) => count > 0 && (
            <span key={estado}
              className={`inline-flex items-center gap-[6px] font-semibold px-[11px] py-[4px] rounded-full tabular-nums ${ESTADO_STAT[estado]}`}>
              <b className="font-extrabold">{count}</b> {label}
            </span>
          ))}
        </div>
      )}

      {/* Vista tabla */}
      {viewMode === 'tabla' && (
        <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
          {/* Barra de tabla */}
          <div className="flex items-center border-b border-border px-[22px] py-4">
            <div className="flex items-center gap-[9px] text-[14px] font-bold text-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              Mesas de defensa
              <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[10px] py-[3px] text-[11px] font-semibold text-primary">
                {loading ? '—' : `${filteredMesas.length} mesas`}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr className="bg-secondary/40">
                  {['', 'Estudiante', 'Tutor', 'Aula', 'Fecha', 'Horario', 'Estado', ''].map((h, i) => (
                    <th key={i} className="border-b border-border px-[18px] py-[13px] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows />}

                {!loading && loadErr && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <AlertIcon />
                      <p className="text-sm max-w-sm">{loadErr}</p>
                      <button onClick={() => load(appliedFilters)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
                        <RetryIcon /> Reintentar
                      </button>
                    </div>
                  </td></tr>
                )}

                {!loading && !loadErr && filteredMesas.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-[50px] text-center text-[13px] text-muted-foreground">
                    {search
                      ? `Sin resultados para "${search}".`
                      : hasActiveFilters
                        ? 'Ninguna mesa coincide con los filtros aplicados.'
                        : 'No hay mesas de defensa registradas aún.'
                    }
                  </td></tr>
                )}

                {!loading && !loadErr && filteredMesas.map(m => {
                  const isMine = esParticipante(m, cedulaSesion)
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 transition-colors hover:bg-secondary/30 group">
                      <td className={`px-[18px] py-[14px] ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}
                          style={isMine ? { boxShadow: 'inset 3px 0 0 #caa33a' } : undefined}>
                        <TipoBadge tipo={m.tipo_mesa} />
                      </td>
                      <td className={`px-[18px] py-[14px] min-w-[160px] ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}>
                        <div className="font-semibold text-[13px] text-foreground leading-tight flex items-center gap-[8px]">
                          {m.nombre_estudiante}
                          {isMine && <span className="rounded-full bg-[rgba(202,163,58,.14)] border border-[rgba(202,163,58,.34)] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[.04em] text-[#caa33a]">TU MESA</span>}
                        </div>
                        {m.titulo_proyecto && (
                          <span className="block mt-[2px] text-[12px] text-muted-foreground truncate max-w-[210px]" title={m.titulo_proyecto}>
                            {m.titulo_proyecto}
                          </span>
                        )}
                      </td>
                      <td className={`px-[18px] py-[14px] text-[12.5px] text-muted-foreground whitespace-nowrap ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}>{m.tutor_principal}</td>
                      <td className={`px-[18px] py-[14px] text-[12.5px] text-muted-foreground whitespace-nowrap ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}>{m.aula}</td>
                      <td className={`px-[18px] py-[14px] text-[12.5px] text-muted-foreground tabular-nums whitespace-nowrap ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}>{m.fecha}</td>
                      <td className={`px-[18px] py-[14px] whitespace-nowrap ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}>
                        <span className="inline-flex items-center gap-[6px] tabular-nums">
                          <b className="font-bold text-foreground text-[12.5px]">{m.hora_inicio}</b>
                          <span className="text-muted-foreground">→</span>
                          <b className="font-bold text-foreground text-[12.5px]">{m.hora_fin}</b>
                        </span>
                      </td>
                      <td className={`px-[18px] py-[14px] ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`}><EstadoBadge estado={m.estado} /></td>
                      <td className={`px-[18px] py-[14px] ${isMine ? 'bg-[rgba(202,163,58,.05)]' : ''}`} style={{ width: 160 }}>
                        <div className="flex gap-[6px] opacity-30 dark:opacity-0 group-hover:opacity-100 transition-opacity">
                          {m.estado === 'Programada' && isJefa && (
                            <button onClick={() => setConfirmChange({ mesa: m, targetEstado: 'Suspendida' })}
                              className="inline-flex items-center gap-[6px] text-[11.5px] font-semibold px-3 py-[6px] rounded-[9px] border border-red-500/[0.22] bg-red-500/[0.12] text-red-500 whitespace-nowrap transition-all hover:brightness-110">
                              <XSmall /> Suspender
                            </button>
                          )}
                          {m.estado === 'En_Curso' && (
                            <button onClick={() => openVeredictoModal(m)}
                              className="inline-flex items-center gap-[6px] text-[11.5px] font-semibold px-3 py-[6px] rounded-[9px] border border-emerald-400/[0.28] bg-emerald-400/[0.12] text-emerald-400 whitespace-nowrap transition-all">
                              <CheckIcon /> Veredicto
                            </button>
                          )}
                          {m.estado === 'Con_Correcciones' && (
                            <button onClick={() => handleValidarCorrecciones(m)} disabled={saving}
                              className="inline-flex items-center gap-[6px] text-[11.5px] font-semibold px-3 py-[6px] rounded-[9px] border border-amber-500/[0.24] bg-amber-500/[0.12] text-amber-500 whitespace-nowrap transition-all disabled:opacity-50">
                              <CheckIcon /> Validar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista calendario */}
      {viewMode === 'calendario' && (
        <>
          {loading && (
            <div className="rounded-2xl border border-border bg-card shadow-card p-10 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm">Cargando mesas…</p>
              </div>
            </div>
          )}
          {!loading && loadErr && (
            <div className="rounded-2xl border border-border bg-card shadow-card p-10 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <AlertIcon />
                <p className="text-sm max-w-sm">{loadErr}</p>
                <button onClick={() => load(appliedFilters)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
                  <RetryIcon /> Reintentar
                </button>
              </div>
            </div>
          )}
          {!loading && !loadErr && (
            <CalendarioView
              mesas={filteredMesas}
              weekStart={weekStart}
              onMesaClick={handleMesaClick}
              cedulaSesion={cedulaSesion}
            />
          )}
        </>
      )}

      {/* Modal detalle — se abre al clickear un bloque en el calendario */}
      <MesaDetailModal
        mesa={mesaDetalle}
        onClose={() => setMesaDetalle(null)}
        onCambiarEstado={handleCambiarEstadoDesdeDetalle}
        onValidarCorrecciones={(mesa) => { setMesaDetalle(null); handleValidarCorrecciones(mesa) }}
        saving={saving}
        isJefa={isJefa}
      />

      {/* Modal veredicto de defensa (Finalizar) */}
      <VeredictoModal
        mesa={veredictoModal?.mesa ?? null}
        veredicto={veredictoSeleccionado}
        setVeredicto={setVeredictoSeleccionado}
        dias={diasCorreccion}
        setDias={setDiasCorreccion}
        onClose={() => !saving && setVeredictoModal(null)}
        onConfirm={handleVeredictoConfirm}
        saving={saving}
      />

      {/* Modal confirmación de suspender */}
      <Modal open={!!confirmChange} onClose={() => !saving && setConfirmChange(null)}
        title="Suspender mesa" width="max-w-sm">
        {confirmChange && (
          <div className="space-y-5">
            <div className="px-4 py-3 rounded-xl border bg-red-50 border-red-100">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-1">
                Marcar como suspendida
              </p>
              <p className="text-sm font-medium text-foreground">
                {confirmChange.mesa.nombre_estudiante ?? confirmChange.mesa.estudiante}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {confirmChange.mesa.fecha} · {confirmChange.mesa.hora_inicio}–{confirmChange.mesa.hora_fin} · {confirmChange.mesa.aula}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La mesa quedará suspendida y será excluida de verificaciones de horario futuras.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmChange(null)} disabled={saving}
                className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSuspender} disabled={saving}
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
