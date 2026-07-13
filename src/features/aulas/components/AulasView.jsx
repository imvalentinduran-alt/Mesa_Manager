import { useState, useEffect, useCallback } from 'react'
import {
  DoorOpen, MapPin, Pencil, Trash2, Plus,
  Hash, BookOpen, Monitor, MonitorOff,
} from 'lucide-react'
import { aulasService } from '@/features/aulas'
import Modal from '@/shared/components/Modal'

const UBICACIONES = ['Docencia', 'Extensión', 'Postgrado', 'Doctorado']
const EMPTY = { nombre_aula: '', ubicacion: '', tiene_equipos: false }

const INPUT = 'h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'
const INPUT_PLAIN = 'h-11 w-full rounded-xl border border-border bg-secondary/40 px-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'

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

function Lbl({ children }) {
  return (
    <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">
      {children}
    </label>
  )
}

function SecCard({ icon, step, title, children }) {
  return (
    <div className="sec-card rounded-[24px] border border-border bg-card px-7 py-[26px] shadow-card">
      <div className="mb-[22px] flex items-center gap-[13px]">
        <div className="sec-icon flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-primary/[0.22] bg-primary/[0.12] text-primary">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{step}</div>
          <div className="mt-0.5 text-[15.5px] font-bold text-foreground">{title}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-secondary/40 px-[14px] h-11 transition-colors hover:border-border/80 select-none">
      <div className="relative shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`h-[21px] w-[38px] rounded-full transition-colors duration-200 ${checked ? 'bg-emerald-500' : 'bg-border'}`} />
        <div className={`absolute top-[2px] left-[2px] h-[17px] w-[17px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[17px]' : ''}`} />
      </div>
      <span className="text-[12.5px] font-semibold text-muted-foreground whitespace-nowrap">Con equipos</span>
    </label>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[18px] border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="animate-pulse h-[46px] w-[46px] rounded-[13px] bg-secondary" />
        <div className="flex gap-1.5">
          <div className="animate-pulse h-[30px] w-[30px] rounded-[9px] bg-secondary" />
          <div className="animate-pulse h-[30px] w-[30px] rounded-[9px] bg-secondary" />
        </div>
      </div>
      <div className="animate-pulse mt-4 h-5 w-24 rounded bg-secondary" />
      <div className="animate-pulse mt-2 h-3 w-16 rounded bg-secondary" />
      <div className="animate-pulse mt-4 h-6 w-20 rounded-full bg-secondary" />
    </div>
  )
}

function EditForm({ aula, onSave, onClose }) {
  const [form,   setForm]   = useState({ nombre_aula: aula.nombre_aula, ubicacion: aula.ubicacion, tiene_equipos: aula.tiene_equipos })
  const [estado, setEstado] = useState('idle')
  const [msg,    setMsg]    = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setEstado('loading')
    try {
      await aulasService.update(aula.id, form)
      onSave()
    } catch (err) {
      setEstado('error')
      setMsg(err.detail ?? 'No se pudo actualizar. Intenta de nuevo.')
    } finally {
      if (estado !== 'error') setEstado('idle')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Lbl>Nombre del Aula</Lbl>
        <IconInput icon={<Hash className="h-4 w-4" />}>
          <input type="text" placeholder="Ej: Aula 201"
            value={form.nombre_aula} onChange={set('nombre_aula')} required className={INPUT} />
        </IconInput>
      </div>
      <div>
        <Lbl>Ubicación</Lbl>
        <IconInput icon={<BookOpen className="h-4 w-4" />}>
          <select value={form.ubicacion} onChange={set('ubicacion')} required className={INPUT + ' cursor-pointer'}>
            {UBICACIONES.map(u => <option key={u}>{u}</option>)}
          </select>
        </IconInput>
      </div>
      <div>
        <Lbl>Equipos audiovisuales</Lbl>
        <Toggle checked={form.tiene_equipos} onChange={e => setForm(f => ({ ...f, tiene_equipos: e.target.checked }))} />
      </div>

      {estado === 'error' && (
        <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">{msg}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="rounded-[14px] border border-border px-6 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all">
          Cancelar
        </button>
        <button type="submit" disabled={estado === 'loading'}
          className="rounded-[14px] bg-gradient-pill px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
          {estado === 'loading' ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

export default function AulasView({ session }) {
  if (session?.rol !== 'Jefa') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm font-medium text-foreground">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Esta sección es exclusiva para el rol Jefa.</p>
      </div>
    )
  }

  const [aulas,    setAulas]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  const [aulaData, setAulaData] = useState(EMPTY)
  const [estado,   setEstado]   = useState('idle')
  const [msg,      setMsg]      = useState('')

  const [newId,      setNewId]      = useState(null)
  const [editando,   setEditando]   = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [elimEstado, setElimEstado] = useState('idle')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try { setAulas(await aulasService.getAll()) }
    catch (e) { setError(e.detail ?? 'No se pudo cargar el inventario de aulas.') }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const set = (field) => (e) => setAulaData(f => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setEstado('loading')
    try {
      const nueva = await aulasService.create({ nombre_aula: aulaData.nombre_aula, ubicacion: aulaData.ubicacion, tiene_equipos: aulaData.tiene_equipos })
      setAulaData(EMPTY)
      setEstado('ok')
      setMsg('Aula registrada correctamente.')
      await cargar()
      if (nueva?.id) { setNewId(nueva.id); setTimeout(() => setNewId(null), 600) }
    } catch (err) {
      setEstado('error')
      setMsg(err.detail ?? 'No se pudo registrar. Verifica los datos e intenta de nuevo.')
    } finally {
      setTimeout(() => setEstado('idle'), 2800)
    }
  }

  const confirmarEliminar = async () => {
    setElimEstado('loading')
    try { await aulasService.remove(eliminando.id); setEliminando(null); await cargar() }
    catch { setElimEstado('error') }
    finally { setElimEstado('idle') }
  }

  return (
    <div className="relative mx-auto max-w-[1000px]">
      <div className="aura" />

      {/* Page header */}
      <div className="mb-[26px]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <DoorOpen className="h-[14px] w-[14px]" /> Gestión de Aulas
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">
          Inventario de espacios
        </h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Registra y administra los salones disponibles para programar defensas de maestría.
        </p>
      </div>

      {/* Registro inline */}
      <form onSubmit={onSubmit}>
        <SecCard icon={<DoorOpen className="h-[17px] w-[17px]" />} step="Paso 1" title="Registrar espacio">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1.4fr 1fr auto auto', alignItems: 'end' }}>
            <div>
              <Lbl>Nombre del Aula</Lbl>
              <IconInput icon={<Hash className="h-4 w-4" />}>
                <input type="text" placeholder="Ej: Aula 201"
                  value={aulaData.nombre_aula} onChange={set('nombre_aula')} required className={INPUT} />
              </IconInput>
            </div>
            <div>
              <Lbl>Ubicación</Lbl>
              <IconInput icon={<BookOpen className="h-4 w-4" />}>
                <select value={aulaData.ubicacion} onChange={set('ubicacion')} required className={INPUT + ' cursor-pointer'}>
                  <option value="" disabled>Seleccionar…</option>
                  {UBICACIONES.map(u => <option key={u}>{u}</option>)}
                </select>
              </IconInput>
            </div>
            <div>
              <Lbl>A/V</Lbl>
              <Toggle checked={aulaData.tiene_equipos} onChange={e => setAulaData(f => ({ ...f, tiene_equipos: e.target.checked }))} />
            </div>
            <div>
              <button type="submit" disabled={estado === 'loading'}
                className="flex h-11 items-center gap-2 whitespace-nowrap rounded-[12px] bg-gradient-pill px-[18px] text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(46,108,166,.8)] transition-all disabled:opacity-60">
                <Plus className="h-4 w-4" />
                {estado === 'loading' ? 'Guardando…' : 'Agregar'}
              </button>
            </div>
          </div>

          {(estado === 'error' || estado === 'ok') && (
            <p className={`mt-4 rounded-[14px] px-4 py-3 text-[12.5px] border ${estado === 'ok'
              ? 'border-emerald-500/[0.22] bg-emerald-500/[0.1] text-emerald-600 dark:text-emerald-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400'}`}>
              {msg}
            </p>
          )}
        </SecCard>
      </form>

      {/* Error de carga */}
      {error && (
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-border bg-card px-6 py-4 text-[13.5px] text-muted-foreground shadow-card">
          {error}
          <button onClick={cargar}
            className="rounded-[12px] bg-gradient-pill px-4 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(46,108,166,.6)]">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid head */}
      <div className="mt-[30px] mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-[9px] text-[15px] font-bold text-foreground">
          <DoorOpen className="h-[17px] w-[17px] text-primary" />
          Inventario de Aulas
          {!cargando && (
            <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[9px] py-0.5 text-[11px] font-semibold text-primary">
              {aulas.length}
            </span>
          )}
        </h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cargando
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : aulas.map(a => (
            <div key={a.id} className={`aula-card group relative overflow-hidden rounded-[18px] border border-border bg-card p-5 shadow-card transition-all duration-[280ms] hover:-translate-y-[5px] hover:border-border/80 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)] ${a.id === newId ? 'adding' : ''}`}>

              {/* Top stripe on hover */}
              <div className="absolute left-0 top-0 right-0 h-[3px] origin-left scale-x-0 bg-gradient-pill transition-transform duration-[350ms] group-hover:scale-x-100" />

              {/* Icon + actions row */}
              <div className="flex items-start justify-between">
                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border border-primary/30 dark:border-primary/[0.22] bg-primary dark:bg-primary/[0.12] text-white dark:text-primary transition-all duration-[300ms] group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:bg-gradient-pill group-hover:text-white group-hover:border-transparent">
                  <DoorOpen className="h-[22px] w-[22px]" />
                </div>
                <div className="flex translate-x-1.5 items-center gap-1.5 opacity-30 dark:opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  <button onClick={() => setEditando(a)} title="Editar"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary">
                    <Pencil className="h-[14px] w-[14px]" />
                  </button>
                  <button onClick={() => setEliminando(a)} title="Eliminar"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-red-500 hover:bg-red-500/[0.12] hover:text-red-500">
                    <Trash2 className="h-[14px] w-[14px]" />
                  </button>
                </div>
              </div>

              <div className="mt-4 text-[16px] font-bold leading-tight text-foreground">{a.nombre_aula}</div>

              <div className="mt-[7px] flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <MapPin className="h-[14px] w-[14px] shrink-0" /> {a.ubicacion ?? '—'}
              </div>

              <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11px] font-semibold ${
                a.tiene_equipos
                  ? 'border border-emerald-500/[0.22] bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400'
                  : 'border border-border bg-secondary/40 text-muted-foreground'
              }`}>
                {a.tiene_equipos
                  ? <><Monitor className="h-[12px] w-[12px]" /> Con equipos</>
                  : <><MonitorOff className="h-[12px] w-[12px]" /> Sin equipos</>}
              </div>
            </div>
          ))}

        {!cargando && !error && aulas.length === 0 && (
          <p className="col-span-full py-12 text-center text-[13.5px] text-muted-foreground">
            No hay aulas registradas aún.
          </p>
        )}
      </div>

      {/* Modal edición */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Aula" width="max-w-md">
        {editando && (
          <EditForm aula={editando} onSave={() => { setEditando(null); cargar() }} onClose={() => setEditando(null)} />
        )}
      </Modal>

      {/* Modal eliminación */}
      <Modal open={!!eliminando} onClose={() => setEliminando(null)} title="Eliminar Aula" width="max-w-sm">
        {eliminando && (
          <div>
            <div className="mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-red-500/[0.22] bg-red-500/[0.12] mx-auto">
              <Trash2 className="h-[26px] w-[26px] text-red-500" />
            </div>
            <p className="text-center text-[13.5px] leading-[1.5] text-muted-foreground">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="font-semibold text-foreground">{eliminando.nombre_aula}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setEliminando(null)}
                className="flex-1 rounded-[12px] border border-border py-3 text-[13.5px] font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} disabled={elimEstado === 'loading'}
                className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-red-600 py-3 text-[13.5px] font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                <Trash2 className="h-[15px] w-[15px]" />
                {elimEstado === 'loading' ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
