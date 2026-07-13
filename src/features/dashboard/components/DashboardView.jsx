import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Gavel,
  CalendarCheck,
  CalendarClock,
  Trophy,
  GraduationCap,
  Activity,
  Users2,
  Clock,
  MapPin,
  DoorOpen,
  ChevronRight,
  History,
  FileText,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
} from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { mesasService } from '@/features/mesas'
import { apiFetch } from '@/shared/lib/api'
import Modal from '../../../shared/components/Modal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function periodoActual() {
  const s = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatNum(n) {
  return n == null ? '—' : n.toLocaleString('es-ES')
}

function formatFechaDMY(dmy) {
  if (!dmy) return '—'
  const [d, m, y] = dmy.split('/')
  return new Date(`${y}-${m}-${d}T00:00:00`)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

function formatISOaDMY(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fechaDia(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').getDate()
}

function fechaMes(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00')
    .toLocaleDateString('es-ES', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
}

// ── Badges ──────────────────────────────────────────────────────────────────

const ESTADO_CLS = {
  Programada:       'bg-blue-50   text-blue-700   border-blue-200',
  En_Curso:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  Aprobada:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  Con_Correcciones: 'bg-amber-50  text-amber-700  border-amber-200',
  Reprobada:        'bg-red-50    text-red-600    border-red-200',
  Suspendida:       'bg-secondary text-muted-foreground border-border',
}

function EstadoBadgeProxima({ estado }) {
  const cls = ESTADO_CLS[estado] ?? ESTADO_CLS.Suspendida
  const label = estado === 'Con_Correcciones' ? 'Con Correcciones' : estado
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ── Modal de detalle de próxima mesa ─────────────────────────────────────────

const TIPO_CLS = {
  1: 'bg-secondary text-muted-foreground',
  2: 'bg-secondary text-muted-foreground',
  3: 'bg-amber-50  text-amber-700',
}

function ProximaMesaModal({ mesa, onClose }) {
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
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-0.5">Estudiante</p>
              <p className="text-sm font-semibold text-foreground">{mesa.estudiante}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-0.5">Título</p>
              <p className="text-sm text-foreground leading-snug">{mesa.titulo || '—'}</p>
            </div>
            <Row label="Tutor"><p className="text-sm text-foreground">{mesa.tutor}</p></Row>
            <Row label="Jurado 1"><p className="text-sm text-foreground">{mesa.jurado1}</p></Row>
            <Row label="Jurado 2"><p className="text-sm text-foreground">{mesa.jurado2}</p></Row>
            <Row label="Aula"><p className="text-sm text-foreground">{mesa.aula}</p></Row>
            <Row label="Fecha"><p className="text-sm text-foreground tabular-nums">{formatISOaDMY(mesa.fecha)}</p></Row>
            <Row label="Horario"><p className="text-sm text-foreground tabular-nums">{mesa.hora_inicio} – {mesa.hora_fin}</p></Row>
            <Row label="Tipo">
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${TIPO_CLS[mesa.tipo_mesa] ?? TIPO_CLS[1]}`}>
                  {mesa.tipo_mesa}
                </span>
                <span className="text-sm text-muted-foreground">Mesa {mesa.tipo_mesa}</span>
              </div>
            </Row>
            <Row label="Estado"><EstadoBadgeProxima estado={mesa.estado} /></Row>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

const PALETTE = [
  'bg-secondary/40',
  'bg-primary/[0.15]',
  'bg-primary/[0.38]',
  'bg-primary/[0.62]',
  'bg-primary',
]

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function toISO(d) { return d.toISOString().slice(0, 10) }

function generarCeldas(porFecha) {
  const hoy    = new Date()
  const dow    = hoy.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  const lunes  = new Date(hoy)
  lunes.setDate(hoy.getDate() + offset)

  const inicio = new Date(lunes)
  inicio.setDate(lunes.getDate() - 17 * 7)

  return Array.from({ length: 18 * 7 }, (_, i) => {
    const d         = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const iso       = toISO(d)
    const count     = porFecha[iso] ?? 0
    const futuro    = d > hoy
    const nivel     = futuro ? 0
      : count >= 5 ? 4
      : count >= 3 ? 3
      : count >= 2 ? 2
      : count >= 1 ? 1
      : 0
    const semana    = Math.floor(i / 7) + 1
    const diaNombre = DIAS_ES[d.getDay()]
    return { iso, count, nivel, futuro, semana, diaNombre }
  })
}

function Heatmap({ porFecha }) {
  const celdas  = generarCeldas(porFecha)
  const gridRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (!gridRef.current) return
    const cells = gridRef.current.querySelectorAll('.hm-cell')
    cells.forEach(el => el.classList.remove('pop'))
    cells.forEach((el, i) => setTimeout(() => el.classList.add('pop'), i * 8))
  }, [porFecha])

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 mr-1.5 shrink-0">
          {['Lun', '', 'Mié', '', 'Vie', '', 'Dom'].map((d, i) => (
            <div key={i} className="h-[15px] w-5 text-[9.5px] text-muted-foreground/60 flex items-center leading-none">{d}</div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div ref={gridRef} className="grid grid-flow-col grid-rows-7 gap-1">
            {celdas.map((c) => (
              <div
                key={c.iso}
                className={`hm-cell h-[15px] w-[15px] rounded-[3.5px] ${c.futuro ? 'bg-secondary/20' : PALETTE[c.nivel]}`}
                onMouseEnter={c.futuro ? undefined : (e) => setTooltip({
                  x: e.clientX, y: e.clientY,
                  text: `${c.count} defensa${c.count !== 1 ? 's' : ''} · ${c.diaNombre}, sem ${c.semana}`,
                })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex justify-between pl-7 text-[10px] text-muted-foreground/60">
        <span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
      </div>
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-[9px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
          style={{ left: tooltip.x + 10, top: tooltip.y - 36 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ── Badge de estado ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
  const dot = <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
  if (estado === 'Defendida_Con_Correcciones') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-[5px] text-[11px] font-semibold text-amber-600 dark:border-amber-500/[0.24] dark:bg-amber-500/[0.12] dark:text-amber-400">
        {dot}Con Correcciones
      </span>
    )
  }
  if (estado === 'Finalizada') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-[5px] text-[11px] font-semibold text-emerald-600 dark:border-emerald-500/[0.22] dark:bg-emerald-500/[0.12] dark:text-emerald-400">
        {dot}Aprobado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-[5px] text-[11px] font-semibold text-muted-foreground">
      {dot}{estado ?? 'Concluida'}
    </span>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="animate-pulse h-9 w-9 rounded-xl bg-white/10" />
        <div className="animate-pulse h-5 w-12 rounded-full bg-white/10" />
      </div>
      <div className="animate-pulse mt-5 h-8 w-20 rounded bg-white/10" />
      <div className="animate-pulse mt-2 h-3 w-28 rounded bg-white/10" />
    </div>
  )
}

function RowSkeleton() {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: 5 }).map((_, j) => (
        <td key={j} className="px-4 py-[15px]">
          <div className="animate-pulse h-3 w-24 rounded bg-secondary" />
        </td>
      ))}
    </tr>
  )
}

// ── Estilos de input compartidos ─────────────────────────────────────────────
const INP = 'h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15'

// ── Form: Registrar Veredicto ─────────────────────────────────────────────────
const VEREDICTO_OPTS = [
  { id: 'Aprobado',         label: 'Aprobado',                  desc: 'La defensa fue aprobada sin observaciones.',           ring: 'border-green-500/40  bg-green-500/10',  txt: 'text-green-700 dark:text-green-400'  },
  { id: 'Con_Correcciones', label: 'Aprobado con Correcciones',  desc: 'Requiere correcciones antes de la entrega final.',     ring: 'border-amber-500/40  bg-amber-500/10',  txt: 'text-amber-700 dark:text-amber-400'  },
  { id: 'Reprobado',        label: 'Reprobado',                  desc: 'La defensa no fue aprobada.',                          ring: 'border-red-500/40    bg-red-500/10',    txt: 'text-red-700 dark:text-red-400'      },
]

function VeredictoForm({ mesa, onClose, onSuccess }) {
  const [veredicto, setVeredicto] = useState('Aprobado')
  const [dias,      setDias]      = useState(15)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  if (!mesa) return null

  const fechaLimite = (() => {
    const d = new Date()
    d.setDate(d.getDate() + Number(dias || 15))
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  })()

  const handleSubmit = async () => {
    setSaving(true); setError(null)
    try {
      await mesasService.registrarVeredicto(mesa.id, {
        veredicto,
        dias_correccion: Number(dias) || 15,
      })
      onSuccess()
    } catch (e) {
      setError(e.detail ?? 'No se pudo registrar el veredicto.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <div>
        <p className="text-xs font-medium text-foreground mb-0.5">{mesa.estudiante}</p>
        <p className="text-[11px] text-muted-foreground">{mesa.fecha} · {mesa.hora_inicio}–{mesa.hora_fin} · {mesa.aula}</p>
      </div>
      <div className="space-y-2">
        {VEREDICTO_OPTS.map(op => (
          <button key={op.id} type="button" onClick={() => setVeredicto(op.id)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              veredicto === op.id ? `${op.ring} border-2` : 'border-border bg-card hover:bg-secondary/40'
            }`}>
            <p className={`text-sm font-semibold ${veredicto === op.id ? op.txt : 'text-foreground'}`}>{op.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{op.desc}</p>
          </button>
        ))}
      </div>

      {veredicto === 'Con_Correcciones' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <label className="text-xs font-medium text-foreground block">Días para correcciones</label>
          <input type="number" value={dias} min={1} onChange={e => setDias(e.target.value)} className={INP} />
          <p className="text-[11px] text-muted-foreground">Fecha límite: <span className="font-medium text-foreground">{fechaLimite}</span></p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-1 border-t border-border">
        <button onClick={onClose} disabled={saving}
          className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-pill text-white shadow-pill disabled:opacity-50 transition-colors">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Confirmar Veredicto'}
        </button>
      </div>
    </div>
  )
}

// ── Form: Reprogramar Mesa ────────────────────────────────────────────────────
function ReprogramarForm({ mesa, onClose, onSuccess }) {
  const hoyISO = new Date().toISOString().slice(0, 10)

  const [aulas,  setAulas]  = useState([])
  const [idAula, setIdAula] = useState('')
  const [fecha,  setFecha]  = useState('')
  const [hora,   setHora]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    if (!mesa) return
    apiFetch('/api/aulas/').then(setAulas).catch(() => {})
  }, [mesa?.id])

  if (!mesa) return null

  const esFindeSemana = (iso) => {
    if (!iso) return false
    const d = new Date(iso + 'T12:00:00')
    return d.getDay() === 0 || d.getDay() === 6
  }

  const handleSubmit = async () => {
    if (!idAula || !fecha || !hora) { setError('Completa todos los campos.'); return }
    if (esFindeSemana(fecha))        { setError('No se puede programar en fin de semana.'); return }
    setSaving(true); setError(null)
    try {
      await mesasService.editar(mesa.id, {
        id_aula:     Number(idAula),
        fecha,
        hora_inicio: hora,
      })
      onSuccess()
    } catch (e) {
      setError(e.detail ?? 'No se pudo reprogramar la mesa.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <div>
        <p className="text-xs font-medium text-foreground mb-0.5">{mesa.estudiante}</p>
        <p className="text-[11px] text-muted-foreground">Mesa {mesa.tipo_mesa} · actualmente: {mesa.fecha} {mesa.hora_inicio}–{mesa.hora_fin}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Aula *</label>
        <select value={idAula} onChange={e => setIdAula(e.target.value)} className={INP + ' cursor-pointer'}>
          <option value="">Selecciona un aula…</option>
          {aulas.map(a => <option key={a.id} value={a.id}>{a.nombre_aula}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Nueva fecha *</label>
          <input type="date" value={fecha} min={hoyISO}
            onChange={e => { setFecha(e.target.value); setError(null) }}
            className={INP + (esFindeSemana(fecha) ? ' border-red-500' : '')} />
          {esFindeSemana(fecha) && <p className="text-[11px] text-red-500 mt-0.5">Debe ser día hábil (lun-vie)</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Hora inicio *</label>
          <input type="time" value={hora} min="08:00" max="13:00"
            onChange={e => { setHora(e.target.value); setError(null) }}
            className={INP} />
          <p className="text-[11px] text-muted-foreground mt-0.5">Rango: 08:00 – 13:00</p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-1 border-t border-border">
        <button onClick={onClose} disabled={saving}
          className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-pill text-white shadow-pill disabled:opacity-50 transition-colors">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Reprogramar Mesa'}
        </button>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardView() {
  const containerRef = useRef(null)
  const [kpis,         setKpis]         = useState(null)
  const [proximas,     setProximas]     = useState(null)
  const [recientes,    setRecientes]    = useState(null)
  const [heatmapData,  setHeatmapData]  = useState({})
  const [cargando,          setCargando]          = useState(true)
  const [generandoPDF,      setGenerandoPDF]      = useState(false)
  const [pdfMsg,            setPdfMsg]            = useState(null) // { ok, texto }
  const [selectedMesa,      setSelectedMesa]      = useState(null)
  const [incidencias,       setIncidencias]       = useState(null)
  const [incModal,          setIncModal]          = useState(false)
  const [veredictoTarget,   setVeredictoTarget]   = useState(null)
  const [reprogramarTarget, setReprogramarTarget] = useState(null)

  useEffect(() => {
    Promise.all([
      dashboardService.getKPIs(),
      dashboardService.getProximas(),
      dashboardService.getRecientes(),
      dashboardService.getActividad(),
    ])
      .then(([k, p, r, h]) => {
        setKpis(k)
        setProximas(p)
        setRecientes(r)
        setHeatmapData(h)
      })
      .catch(() => {
        setKpis({ total_historico: 0, defensas_mes: 0, tasa_aprobacion: 0, estudiantes_registrados: 0, nombre_mes: '' })
        setProximas([])
        setRecientes([])
      })
      .finally(() => setCargando(false))

    dashboardService.getPendientesCierre()
      .then(setIncidencias)
      .catch(() => setIncidencias([]))
  }, [])

  /* ── Reveal escalonado al montar ────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return
    const els = containerRef.current.querySelectorAll('[data-rv]')
    els.forEach((el, i) => setTimeout(() => el.classList.add('in'), 120 + i * 100))
  }, [])

  async function handleGenerarReporte() {
    if (generandoPDF) return
    setGenerandoPDF(true)
    setPdfMsg(null)
    try {
      const rutaGuardada = await dashboardService.descargarReporte()
      setPdfMsg({ ok: true, texto: `Reporte guardado en: ${rutaGuardada}` })
    } catch (e) {
      const msg = e?.message ?? String(e)
      if (msg !== 'cancelado') {
        setPdfMsg({ ok: false, texto: 'No se pudo generar el reporte. Verificá que el servidor esté activo.' })
      }
    } finally {
      setGenerandoPDF(false)
    }
  }

  const CARDS = kpis ? (() => {
    const mes       = kpis.nombre_mes
    const deltaMes  = kpis.defensas_mes - kpis.defensas_mes_anterior
    const deltaTasa = Math.round((kpis.tasa_aprobacion - kpis.tasa_anterior) * 10) / 10
    return [
      {
        label: 'Total de Defensas',
        value: formatNum(kpis.total_historico),
        delta: kpis.defensas_mes > 0 ? `+${kpis.defensas_mes} en ${mes}` : `Sin defensas en ${mes}`,
        trend: kpis.defensas_mes > 0 ? 'up' : 'flat',
        icon: Gavel,
      },
      {
        label: 'Defensas del Mes',
        value: formatNum(kpis.defensas_mes),
        delta: deltaMes > 0 ? `+${deltaMes} vs. anterior`
             : deltaMes < 0 ? `${deltaMes} vs. anterior`
             : kpis.defensas_mes_anterior === 0 ? `Primer ${mes} con datos`
             : `= que ${mes === kpis.nombre_mes ? 'anterior' : mes}`,
        trend: deltaMes > 0 ? 'up' : deltaMes < 0 ? 'down' : 'flat',
        icon: CalendarCheck,
      },
      {
        label: 'Tasa de Aprobación',
        value: `${kpis.tasa_aprobacion}%`,
        delta: deltaTasa > 0 ? `+${deltaTasa} pts vs. anterior`
             : deltaTasa < 0 ? `${deltaTasa} pts vs. anterior`
             : kpis.tasa_anterior === 0 ? 'Sin datos anteriores'
             : 'Igual que anterior',
        trend: deltaTasa > 0 ? 'up' : deltaTasa < 0 ? 'down' : 'flat',
        icon: Trophy,
      },
      {
        label: 'Estudiantes Registrados',
        value: formatNum(kpis.estudiantes_registrados),
        delta: kpis.estudiantes_mes > 0 ? `+${kpis.estudiantes_mes} en ${mes}` : `Sin altas en ${mes}`,
        trend: kpis.estudiantes_mes > 0 ? 'up' : 'flat',
        icon: GraduationCap,
      },
    ]
  })() : null

  return (
    <div ref={containerRef} className="relative mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="aura" />

      {/* ── Hero analytical card ─────────────────────────────────────────── */}
      <section data-rv="0" className="rv relative overflow-hidden rounded-3xl bg-gradient-brand p-8 text-white shadow-card">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4 mb-[26px]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              <LayoutDashboard className="h-[13px] w-[13px]" />
              Panel General
            </div>
            <h1 className="mt-[7px] text-[23px] font-bold tracking-[-0.01em]">
              Resumen de <span className="text-[#9FCBF0]">defensas de maestría</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-[7px] text-[11.5px] font-medium text-[#BFD8F0] backdrop-blur shrink-0">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative h-[7px] w-[7px] rounded-full bg-green-400" />
            </span>
            Datos en tiempo real
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {cargando || !CARDS
            ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
            : CARDS.map((m) => {
                const Icon = m.icon
                return (
                  <div
                    key={m.label}
                    className="kpi rounded-[18px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.12]">
                      <Icon className="h-[19px] w-[19px] text-white" />
                    </div>
                    <div className="mt-4 text-[34px] font-bold leading-none tracking-[-0.02em]">{m.value}</div>
                    <div className="mt-2 text-[12.5px] text-[#AFCAE6]">{m.label}</div>
                  </div>
                )
              })}
        </div>
      </section>

      {/* ── Incidencias Académicas ───────────────────────────────────────── */}
      {incidencias?.length > 0 && (
        <section className="rounded-2xl border border-amber-400/40 dark:border-amber-500/[0.28] bg-amber-50 dark:bg-amber-950/60 p-4 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="banner-ic flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-amber-300/60 dark:border-amber-500/[0.24] bg-amber-100 dark:bg-amber-500/[0.18] text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Incidencias académicas pendientes
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Hay{' '}
                  <span className="font-bold text-amber-500">{incidencias.length}</span>{' '}
                  mesa{incidencias.length !== 1 ? 's' : ''} con cierre de veredicto pendiente o reprogramación requerida.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIncModal(true)}
              className="flex items-center gap-1.5 rounded-[10px] border border-amber-500/40 px-4 py-[9px] text-[12.5px] font-semibold text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shrink-0 whitespace-nowrap"
            >
              Ver incidencias <ChevronRight className="h-[15px] w-[15px]" />
            </button>
          </div>
        </section>
      )}

      {/* ── Fila central ─────────────────────────────────────────────────── */}
      <section data-rv="1" className="rv grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">

        {/* Heatmap de densidad */}
        <div className="rounded-2xl border border-border bg-card p-[22px] shadow-card lg:col-span-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                <Activity className="h-[17px] w-[17px] text-primary" />
                Actividad de defensas
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Últimas 18 semanas · agrupado por día
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground/70">
              menos
              <span className="h-[11px] w-[11px] rounded-[3px] bg-secondary/60 inline-block" />
              <span className="h-[11px] w-[11px] rounded-[3px] bg-primary/[0.15] inline-block" />
              <span className="h-[11px] w-[11px] rounded-[3px] bg-primary/[0.38] inline-block" />
              <span className="h-[11px] w-[11px] rounded-[3px] bg-primary/[0.62] inline-block" />
              <span className="h-[11px] w-[11px] rounded-[3px] bg-primary inline-block" />
              más
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            {cargando
              ? <div className="animate-pulse h-24 rounded-lg bg-secondary" />
              : <Heatmap porFecha={heatmapData} />
            }
          </div>
        </div>

        {/* Próximas mesas */}
        <div className="rounded-2xl border border-border bg-card p-[22px] shadow-card lg:col-span-2">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <CalendarClock className="h-[17px] w-[17px] text-primary" />
            Próximas Mesas
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Defensas programadas esta semana</p>

          {cargando ? (
            <div className="mt-4 flex flex-col gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 px-3 py-3">
                  <div className="animate-pulse h-12 w-[46px] rounded-xl bg-secondary shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse h-3 w-32 rounded bg-secondary" />
                    <div className="animate-pulse h-3 w-20 rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : proximas?.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sin defensas programadas para hoy.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {(proximas ?? []).map((m) => (
                <div
                  key={m.id}
                  className="next group flex items-center gap-3.5 px-3 py-3 rounded-[13px] cursor-pointer hover:bg-secondary/40 -mx-1"
                  onClick={() => setSelectedMesa(m)}
                >
                  <div className="flex h-12 w-[46px] flex-col items-center justify-center rounded-[11px] border border-primary/[0.22] bg-primary/[0.12] shrink-0">
                    <span className="text-[18px] font-bold leading-none text-primary">{fechaDia(m.fecha)}</span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary/80">{fechaMes(m.fecha)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {m.estudiante}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      {m.hora_inicio}
                      <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
                      <MapPin className="h-3 w-3 shrink-0" />
                      {m.aula}
                    </div>
                  </div>
                  <ChevronRight className="next-arr h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProximaMesaModal mesa={selectedMesa} onClose={() => setSelectedMesa(null)} />

      {/* ── Modal: lista de incidencias ──────────────────────────────────── */}
      <Modal open={incModal} onClose={() => setIncModal(false)}
        title="Mesas con Cierre Académico Pendiente" width="max-w-2xl">
        {incidencias && (
          <div className="space-y-3">
            {incidencias.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin incidencias pendientes.</p>
            ) : incidencias.map(inc => (
              <div key={inc.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{inc.estudiante}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{inc.titulo || '—'}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {inc.fecha} · {inc.hora_inicio}–{inc.hora_fin}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{inc.aula}</span>
                    <EstadoBadgeProxima estado={inc.estado} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{inc.maestria} · Mesa {inc.tipo_mesa}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {inc.estado === 'En_Curso' && (
                    <button
                      onClick={() => { setVeredictoTarget(inc); setIncModal(false) }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckSquare className="h-3.5 w-3.5" /> Registrar Veredicto
                    </button>
                  )}
                  {inc.estado === 'Programada' && (
                    <button
                      onClick={() => { setReprogramarTarget(inc); setIncModal(false) }}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reprogramar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Modal: registrar veredicto ───────────────────────────────────── */}
      <Modal open={!!veredictoTarget} onClose={() => setVeredictoTarget(null)}
        title="Registrar Veredicto" width="max-w-sm">
        <VeredictoForm
          mesa={veredictoTarget}
          onClose={() => setVeredictoTarget(null)}
          onSuccess={() => {
            setVeredictoTarget(null)
            dashboardService.getPendientesCierre().then(setIncidencias).catch(() => {})
          }}
        />
      </Modal>

      {/* ── Modal: reprogramar mesa ──────────────────────────────────────── */}
      <Modal open={!!reprogramarTarget} onClose={() => setReprogramarTarget(null)}
        title="Reprogramar Mesa" width="max-w-md">
        <ReprogramarForm
          mesa={reprogramarTarget}
          onClose={() => setReprogramarTarget(null)}
          onSuccess={() => {
            setReprogramarTarget(null)
            dashboardService.getPendientesCierre().then(setIncidencias).catch(() => {})
          }}
        />
      </Modal>

      {/* ── Defensas recientes ───────────────────────────────────────────── */}
      <section data-rv="2" className="rv rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between px-6 pt-[22px] pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
              <History className="h-[17px] w-[17px] text-primary" />
              Defensas Recientes
            </h2>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Últimas mesas registradas en el sistema
            </p>
          </div>
          <button
            onClick={handleGenerarReporte}
            disabled={generandoPDF}
            className="inline-flex items-center gap-2 rounded-[11px] bg-gradient-pill px-[17px] py-2.5 text-[12.5px] font-semibold text-white shadow-pill hover:scale-[1.035] hover:shadow-[0_12px_26px_-8px_rgba(46,108,166,.8)] transition-all disabled:opacity-70"
          >
            {generandoPDF
              ? <><Loader2 className="h-[15px] w-[15px] animate-spin" /> Generando PDF...</>
              : <><FileText className="h-[15px] w-[15px]" /> Generar reporte</>
            }
          </button>
        </div>

        {pdfMsg && (
          <div className={`mx-6 mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            pdfMsg.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <span className="break-all">{pdfMsg.texto}</span>
            <button onClick={() => setPdfMsg(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
          </div>
        )}

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-4 pb-[14px] pt-0 border-b border-border">ID</th>
                <th className="px-4 pb-[14px] pt-0 border-b border-border">Estudiante</th>
                <th className="px-4 pb-[14px] pt-0 border-b border-border">Fecha</th>
                <th className="px-4 pb-[14px] pt-0 border-b border-border">Aula</th>
                <th className="px-4 pb-[14px] pt-0 border-b border-border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              ) : recientes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    No hay defensas concluidas aún.
                  </td>
                </tr>
              ) : (
                (recientes ?? []).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border transition-colors hover:bg-secondary/40 last:border-0"
                  >
                    <td className="px-4 py-[15px]">
                      <span className="text-[12.5px] font-semibold text-primary tabular-nums">
                        {`DEF-${String(r.id).padStart(4, '0')}`}
                      </span>
                    </td>
                    <td className="px-4 py-[15px] text-[13px] font-semibold text-foreground">
                      {r.estudiante}
                    </td>
                    <td className="px-4 py-[15px] text-[13px] text-muted-foreground tabular-nums">
                      {formatFechaDMY(r.fecha)}
                    </td>
                    <td className="px-4 py-[15px]">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <DoorOpen className="h-[13px] w-[13px]" />
                        {r.aula}
                      </span>
                    </td>
                    <td className="px-4 py-[15px]">
                      <EstadoBadge estado={r.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
