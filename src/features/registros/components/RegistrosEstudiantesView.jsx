import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Pencil, Trash2, Download, Users } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { estudiantesService } from '@/features/estudiantes'
import { mesasService        } from '@/features/mesas'
import { profesoresService   } from '@/features/profesores'
import { apiFetch } from '@/shared/lib/api'
import { getToken } from '@/shared/lib/session'
import Modal                   from '@/shared/components/Modal'

// ── Helpers ───────────────────────────────────────────────────────────────
function proximaMesa(est) {
  if (!est.verificado_m1) return 1
  if (!est.verificado_m2) return 2
  return 3
}

function badgeSolvencia(est) {
  const n = proximaMesa(est)
  return { n, verificado: est[`verificado_m${n}`] }
}

function filterDocId(tipo, raw) {
  if (tipo === 'Cedula') return raw.replace(/\D/g, '').slice(0, 8)
  let val = ''
  for (let i = 0; i < raw.length && val.length < 7; i++) {
    if (val.length === 0) {
      if (/[a-zA-Z]/.test(raw[i])) val += raw[i].toUpperCase()
    } else {
      if (/\d/.test(raw[i])) val += raw[i]
    }
  }
  return val
}

async function exportarExcel(filtroMaestria, nombreMaestria) {
  const path     = filtroMaestria
    ? `/api/estudiantes/exportar-excel?maestria_id=${filtroMaestria}`
    : '/api/estudiantes/exportar-excel'
  const sufijo   = nombreMaestria ? nombreMaestria.replace(/\s+/g, '_') : 'Todos'
  const filename = `Estudiantes_${sufijo}.xlsx`

  await invoke('descargar_excel', {
    path,
    filename,
    token: getToken() ?? null,
  })
}

// ── Iconos inline ─────────────────────────────────────────────────────────
const CashIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const CheckIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const AlertIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const Spinner      = () => <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
const CalIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const ReceiptIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>
const HashIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
const CardIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
const BookMarkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="M9 10h6"/></svg>

// ── Badges ────────────────────────────────────────────────────────────────
function EstadoBadge({ asignado }) {
  return asignado ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-600">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      Asignado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-600">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Disponible
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="animate-pulse h-3.5 rounded bg-secondary" style={{ width: `${60 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Estilos compartidos ───────────────────────────────────────────────────
const INPUT = [
  'h-11 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground',
  'placeholder:text-muted-foreground/50 outline-none transition-all',
  'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15',
].join(' ')

const INPUT_ICON = [
  'h-11 w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-4 text-sm text-foreground',
  'placeholder:text-muted-foreground/50 outline-none transition-all',
  'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15',
].join(' ')

function IconInput({ icon, children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
        {icon}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

// ── Modal de Solvencia ────────────────────────────────────────────────────
function fmtFecha(d) {
  if (!d) return '—'
  const [y, m, dia] = String(d).split('-')
  return `${dia}/${m}/${y}`
}

function SolvenciaModal({ est, onClose, onSaved }) {
  const [tab,             setTab]             = useState(1)
  const [recibo,          setRecibo]          = useState('')
  const [monto,           setMonto]           = useState('')
  const [diaTransferencia, setDiaTransferencia] = useState('')
  const [reciboCaja,      setReciboCaja]      = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const [ok,     setOk]     = useState(null)

  // Al abrir con un estudiante distinto, saltar a la mesa pendiente y limpiar el form
  useEffect(() => {
    if (est) {
      setTab(proximaMesa(est))
      setRecibo(''); setMonto(''); setDiaTransferencia(''); setReciboCaja('')
      setError(null); setOk(null)
    }
  }, [est?.id])

  if (!est) return null

  const isVerified = est[`verificado_m${tab}`]

  const handleGuardar = async () => {
    if (!diaTransferencia || !recibo.trim() || !reciboCaja.trim() || !monto || Number(monto) <= 0) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setSaving(true); setError(null); setOk(null)
    try {
      await estudiantesService.updateSolvencia(est.id, {
        numero_mesa:       tab,
        recibo:            recibo.trim(),
        monto:             Number(monto),
        dia_transferencia: diaTransferencia,
        num_recibo_caja:   reciboCaja.trim(),
      })
      setOk(`Pago de Mesa ${tab} registrado y verificado.`)
      setRecibo(''); setMonto(''); setDiaTransferencia(''); setReciboCaja('')
      onSaved()
    } catch (e) {
      setError(e.detail ?? 'No se pudo registrar el pago.')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={!!est} onClose={onClose} title={`Solvencia — ${est.nombre_completo}`} width="max-w-lg">
      <div className="space-y-4">

        {/* Tabs con indicador de verificado */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl">
          {[1, 2, 3].map(n => (
            <button key={n}
              onClick={() => { setTab(n); setError(null); setOk(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                tab === n
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              Mesa {n}
              {est[`verificado_m${n}`] && <span className="text-green-500"><CheckIcon /></span>}
            </button>
          ))}
        </div>

        {isVerified ? (
          /* ── Solo lectura: pago ya registrado ── */
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-green-500/20">
              <span className="text-green-600"><CheckIcon /></span>
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                Pago verificado — Mesa {tab}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Fecha de transferencia
                </p>
                <p className="text-sm font-mono text-foreground">
                  {fmtFecha(est[`dia_transferencia_m${tab}`])}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  N° Recibo
                </p>
                <p className="text-sm font-mono text-foreground">
                  {est[`recibo_m${tab}`] || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  N° Recibo de Caja
                </p>
                <p className="text-sm font-mono text-foreground">
                  {est[`recibo_caja_m${tab}`] || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Monto
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Bs. {Number(est[`monto_m${tab}`] ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Formulario de registro ── */
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
              Registrar pago — Mesa {tab}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Día de la transferencia *</label>
                <IconInput icon={<CalIcon />}>
                  <input type="date" value={diaTransferencia} onChange={e => setDiaTransferencia(e.target.value)}
                    className={INPUT_ICON} />
                </IconInput>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Número de recibo *</label>
                <IconInput icon={<ReceiptIcon />}>
                  <input type="text" value={recibo} onChange={e => setRecibo(e.target.value)}
                    placeholder="Ej. REC-001234" className={INPUT_ICON} />
                </IconInput>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">N° Recibo de Caja *</label>
                <IconInput icon={<HashIcon />}>
                  <input type="text" value={reciboCaja} onChange={e => setReciboCaja(e.target.value)}
                    placeholder="Ej. RC-0045" className={INPUT_ICON} />
                </IconInput>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Monto *</label>
                <IconInput icon={<CardIcon />}>
                  <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                    min="0.01" step="0.01" placeholder="0.00" className={INPUT_ICON} />
                </IconInput>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="text-red-500 shrink-0"><AlertIcon /></span>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {ok && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
            <span className="text-green-600 shrink-0"><CheckIcon /></span>
            <p className="text-xs text-green-700 dark:text-green-400">{ok}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1 border-t border-border">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
            Cerrar
          </button>
          {!isVerified && (
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-pill text-white shadow-pill disabled:opacity-50 transition-colors">
              {saving ? <><Spinner /> Guardando…</> : `Registrar Mesa ${tab}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Modal de Comité ───────────────────────────────────────────────────────
function ComiteModal({ est, profesores, onClose }) {
  if (!est) return null
  const nombre = (id) => profesores.find(p => p.id === id)?.nombre_completo ?? '—'

  const principales = [
    { rol: 'Tutor',    nombre: nombre(est.id_tutor_principal)   },
    { rol: 'Jurado 1', nombre: nombre(est.id_jurado1_principal) },
    { rol: 'Jurado 2', nombre: nombre(est.id_jurado2_principal) },
  ]
  const suplentes = [
    { rol: 'Tutor',    nombre: nombre(est.id_tutor_suplente)   },
    { rol: 'Jurado 1', nombre: nombre(est.id_jurado1_suplente) },
    { rol: 'Jurado 2', nombre: nombre(est.id_jurado2_suplente) },
  ]

  return (
    <Modal open={!!est} onClose={onClose} title={`Comité — ${est.nombre_completo}`} width="max-w-lg">
      <div className="grid grid-cols-2 gap-4 pt-1">
        {[{ label: 'Principales', items: principales }, { label: 'Suplentes', items: suplentes }].map(({ label, items }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">{label}</p>
            <div className="space-y-2">
              {items.map(({ rol, nombre: n }) => (
                <div key={rol} className="px-3 py-2.5 bg-secondary border border-border rounded-xl">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-0.5">{rol}</p>
                  <p className="text-sm text-foreground truncate">{n}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <button onClick={onClose}
          className="px-5 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function RegistrosEstudiantesView({ session }) {
  const [lista,          setLista]          = useState([])
  const [asignados,      setAsignados]      = useState(new Set())
  const [maestrias,      setMaestrias]      = useState([])
  const [profesores,     setProfesores]     = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [error,          setError]          = useState(null)
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroMaestria, setFiltroMaestria] = useState('')

  const [editando,   setEditando]   = useState(null)
  const [editForm,   setEditForm]   = useState({})
  const [editEstado, setEditEstado] = useState('idle')
  const [editMsg,    setEditMsg]    = useState('')

  const [eliminando,  setEliminando]  = useState(null)
  const [elimEstado,  setElimEstado]  = useState('idle')
  const [elimMsg,     setElimMsg]     = useState('')

  const [modalSolvencia,  setModalSolvencia]  = useState(null)
  const [modalComite,     setModalComite]     = useState(null)
  const [exportando,      setExportando]      = useState(false)
  const [errorExport,     setErrorExport]     = useState(null)
  const [exitoExport,     setExitoExport]     = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const [estudiantes, idsAsignados, maestriasList, profList] = await Promise.all([
        estudiantesService.getAll(),
        mesasService.getEstudiantesAsignados().catch(() => []),
        apiFetch('/api/maestrias/').catch(() => []),
        profesoresService.getActivos(),
      ])
      setLista(estudiantes)
      setAsignados(new Set(idsAsignados))
      setMaestrias(maestriasList)
      setProfesores(profList)
    } catch (e) {
      setError(e.detail ?? 'No se pudo cargar la lista de estudiantes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const nombreMaestria = (id) => maestrias.find(m => m.id === id)?.nombre ?? '—'

  const listaFiltrada = useMemo(() => {
    let r = lista
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      r = r.filter(e =>
        e.cedula.toLowerCase().includes(q) ||
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(q)
      )
    }
    if (filtroMaestria) {
      r = r.filter(e => e.maestria_id === Number(filtroMaestria))
    }
    return r
  }, [lista, busqueda, filtroMaestria])

  // ── Edición ───────────────────────────────────────────────────────────────
  const abrirEditar = (est) => {
    setEditando(est)
    setEditForm({ ...est })
    setEditEstado('idle')
    setEditMsg('')
  }

  const setEdit = (field) => (e) => setEditForm(f => ({ ...f, [field]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setEditEstado('loading')
    try {
      await estudiantesService.update(editando.id, {
        tipo_documento:     editForm.tipo_documento,
        cedula:             editForm.cedula,
        nombre:             editForm.nombre,
        apellido:           editForm.apellido,
        correo_electronico: editForm.correo_electronico,
        cohorte:            editForm.cohorte,
        titulo_proyecto:    editForm.titulo_proyecto,
      })
      setEditando(null)
      await cargar()
    } catch (err) {
      setEditEstado('error')
      setEditMsg(err.detail ?? 'No se pudo guardar los cambios.')
      setTimeout(() => setEditEstado('idle'), 2800)
    }
  }

  // ── Eliminación ───────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    setElimEstado('loading'); setElimMsg('')
    try {
      await estudiantesService.remove(eliminando.id)
      setEliminando(null)
      await cargar()
    } catch (e) {
      setElimMsg(e?.detail ?? 'No se pudo eliminar el estudiante.')
    } finally {
      setElimEstado('idle')
    }
  }

  const esJefa = session?.rol === 'Jefa'

  return (
    <div className="relative mx-auto max-w-[1400px]">
      <div className="aura" />
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
          Registros
        </p>
        <h1 className="mt-2 text-[25px] font-bold tracking-tight text-foreground leading-tight">Estudiantes</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[520px] leading-relaxed">
          Consulta, edita y gestiona los expedientes del padrón. Administra solvencias de pago, revisa el comité evaluador y exporta el listado a Excel.
        </p>
      </header>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
            <BookMarkIcon />
          </div>
          <select
            value={filtroMaestria}
            onChange={e => setFiltroMaestria(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer"
          >
            <option value="">Todas las maestrías</option>
            {maestrias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <span className="text-xs font-semibold tabular-nums px-3.5 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
          {listaFiltrada.length} resultado{listaFiltrada.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={async () => {
            setExportando(true)
            setErrorExport(null)
            try {
              const efectivoMaestria = session?.rol === 'Coordinador'
                ? String(session.maestria_id)
                : filtroMaestria
              const nombreMaestria = efectivoMaestria
                ? (maestrias.find(m => m.id === Number(efectivoMaestria))?.nombre ?? null)
                : null
              await exportarExcel(efectivoMaestria, nombreMaestria)
              setExitoExport(true)
              setTimeout(() => setExitoExport(false), 4000)
            } catch (e) {
              if (e !== 'cancelado' && e?.message !== 'cancelado') {
                setErrorExport('No se pudo generar el Excel. Intenta de nuevo.')
                setTimeout(() => setErrorExport(null), 4000)
              }
            } finally {
              setExportando(false)
            }
          }}
          disabled={listaFiltrada.length === 0 || exportando}
          title="Exportar a Excel"
          className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          {exportando ? <Spinner /> : <Download className="h-3.5 w-3.5" />}
          {exportando ? 'Generando…' : 'Exportar Excel'}
        </button>
      </div>

      {/* Éxito de exportación */}
      {exitoExport && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <CheckIcon />
          Excel generado y guardado correctamente.
        </div>
      )}

      {/* Error de exportación */}
      {errorExport && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertIcon />
          {errorExport}
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-card">
          {error}
          <button onClick={cargar}
            className="rounded-full bg-gradient-pill px-4 py-1.5 text-xs font-medium text-white shadow-pill">
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto" style={{ transform: 'rotateX(180deg)' }}>
          <table className="w-full min-w-[1000px] text-sm" style={{ transform: 'rotateX(180deg)' }}>
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {['Identificación','Nombre Completo','Correo','Cohorte','Maestría','Solvencia','Estado','Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground last:text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargando
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : listaFiltrada.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                        {busqueda || filtroMaestria
                          ? 'Sin resultados para los filtros aplicados.'
                          : 'No hay estudiantes registrados aún.'}
                      </td>
                    </tr>
                  )
                  : listaFiltrada.map(est => {
                    const { n, verificado } = badgeSolvencia(est)
                    return (
                      <tr key={est.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-3.5">
                          {est.tipo_documento === 'Colombiano' ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100">C.C.</span>
                                <span className="font-mono text-foreground">{est.cedula}</span>
                              </div>
                              {est.pasaporte && (
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">Pas.</span>
                                  <span className="font-mono text-muted-foreground">{est.pasaporte}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-primary/[0.12] px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/[0.22]">V</span>
                              <span className="font-mono text-foreground">{est.cedula}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          {est.apellido}, {est.nombre}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block max-w-[190px] truncate text-xs text-muted-foreground"
                            title={est.correo_electronico}>
                            {est.correo_electronico || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{est.cohorte || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className="block max-w-[180px] truncate text-xs text-muted-foreground"
                            title={nombreMaestria(est.maestria_id)}>
                            {nombreMaestria(est.maestria_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            verificado
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {verificado ? <CheckIcon /> : null}
                            {verificado ? `Solvente M${n}` : `Pendiente M${n}`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <EstadoBadge asignado={asignados.has(est.id)} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => abrirEditar(est)}
                              title="Editar estudiante"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setModalComite(est)}
                              title="Ver comité evaluador"
                              className="flex h-8 items-center gap-1 px-2 rounded-lg text-[11px] font-medium text-violet-600 transition-all hover:bg-violet-500/10"
                            >
                              <Users className="h-3.5 w-3.5" /> Comité
                            </button>
                            <button
                              onClick={() => setModalSolvencia(est)}
                              title="Gestionar solvencia"
                              className="flex h-8 items-center gap-1 px-2 rounded-lg text-[11px] font-medium text-blue-600 transition-all hover:bg-blue-500/10"
                            >
                              <CashIcon /> Solvencia
                            </button>
                            {esJefa && (
                              <button
                                onClick={() => setEliminando(est)}
                                title="Eliminar estudiante"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Estudiante" width="max-w-2xl">
        {editando && (
          <form onSubmit={guardarEdicion} className="space-y-4 pt-1">
            <Field label="Cédula / Pasaporte">
              <input
                type="text"
                value={editForm.cedula ?? ''}
                onChange={e => setEditForm(f => ({
                  ...f,
                  cedula: filterDocId(f.tipo_documento, e.target.value),
                }))}
                required
                className={INPUT}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre(s)">
                <input type="text" value={editForm.nombre ?? ''} onChange={setEdit('nombre')} required className={INPUT} />
              </Field>
              <Field label="Apellido(s)">
                <input type="text" value={editForm.apellido ?? ''} onChange={setEdit('apellido')} required className={INPUT} />
              </Field>
            </div>

            <Field label="Correo electrónico">
              <input type="email" value={editForm.correo_electronico ?? ''} onChange={setEdit('correo_electronico')} required className={INPUT} />
            </Field>

            <Field label="Título del Proyecto">
              <input type="text" value={editForm.titulo_proyecto ?? ''} onChange={setEdit('titulo_proyecto')} className={INPUT} />
            </Field>

            <Field label="Cohorte">
              <input type="text" placeholder="Ej. 2026-I" value={editForm.cohorte ?? ''} onChange={setEdit('cohorte')} required className={INPUT} />
            </Field>

            {editEstado === 'error' && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                {editMsg}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditando(null)}
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={editEstado === 'loading'}
                className="rounded-full bg-gradient-pill px-6 py-2.5 text-sm font-medium text-white shadow-pill transition-transform active:scale-[0.99] disabled:opacity-60">
                {editEstado === 'loading' ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de comité */}
      <ComiteModal
        est={modalComite}
        profesores={profesores}
        onClose={() => setModalComite(null)}
      />

      {/* Modal de solvencia */}
      <SolvenciaModal
        est={modalSolvencia}
        onClose={() => setModalSolvencia(null)}
        onSaved={cargar}
      />

      {/* Modal de eliminación */}
      <Modal open={!!eliminando} onClose={() => { setEliminando(null); setElimMsg('') }} title="Eliminar Estudiante" width="max-w-sm">
        {eliminando && (
          <div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-semibold text-foreground">
                {eliminando.nombre} {eliminando.apellido}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            {elimMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertIcon />
                {elimMsg}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setEliminando(null); setElimMsg('') }}
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              {!elimMsg && (
                <button onClick={confirmarEliminar} disabled={elimEstado === 'loading'}
                  className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                  {elimEstado === 'loading' ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
