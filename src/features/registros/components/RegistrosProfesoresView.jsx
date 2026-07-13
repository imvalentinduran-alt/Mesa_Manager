import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, Search, Pencil, Trash2, Download, CheckCircle2,
  RotateCcw, BookMarked, Activity, IdCard, User, Mail, BookOpen,
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { profesoresService } from '@/features/profesores'
import { getToken } from '@/shared/lib/session'
import Modal from '@/shared/components/Modal'

async function exportarExcel() {
  await invoke('descargar_excel', {
    path:     '/api/profesores/exportar-excel',
    filename: 'Profesores.xlsx',
    token:    getToken() ?? null,
  })
}

const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

const ESPECIALIDADES = [
  'Innovación Educativa', 'Gerencia Educacional', 'Planificación Global',
  'Educación, Ambiente y Desarrollo', 'Enseñanza de la Educación Física',
  'Recreación', 'Informática Educativa', 'Orientación Educativa',
]

const INPUT = 'h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'
const INPUT_PLAIN = 'h-11 w-full rounded-xl border border-border bg-secondary/40 px-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'

function IconInput({ icon, children, iconClass = 'text-muted-foreground/60' }) {
  return (
    <div className="group relative flex items-center">
      <span className={`pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary ${iconClass}`}>
        {icon}
      </span>
      {children}
    </div>
  )
}

function Switch({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${checked ? 'bg-gradient-pill' : 'bg-secondary'}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-[18px] py-[14px]">
          <div className="animate-pulse h-3.5 rounded bg-secondary" style={{ width: `${55 + (i * 19) % 45}%` }} />
        </td>
      ))}
    </tr>
  )
}

function LoadChips({ num_tutor, num_jurado }) {
  const t = num_tutor ?? 0
  const j = num_jurado ?? 0
  if (!t && !j) return <span className="text-[12px] text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-[7px]">
      {t > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-primary/[0.22] bg-primary/[0.12] px-[10px] py-[4px] text-[11px] font-semibold text-primary">
          <Users className="h-3 w-3" /> <b>{t}</b> tutor{t !== 1 ? 'es' : ''}
        </span>
      )}
      {j > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-secondary/40 px-[10px] py-[4px] text-[11px] font-semibold text-muted-foreground">
          <Users className="h-3 w-3" /> <b>{j}</b> jurado{j !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

function EstadoBadge({ activo }) {
  return activo ? (
    <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-emerald-500">
      <span className="h-2 w-2 animate-[pulse_1.8s_ease_infinite] rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(61,214,140,0.12)]" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      Inactivo
    </span>
  )
}

export default function RegistrosProfesoresView({ session }) {
  if (session?.rol !== 'Jefa') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm font-medium text-foreground">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Esta sección es exclusiva para el rol Jefa.</p>
      </div>
    )
  }

  const [lista,              setLista]              = useState([])
  const [cargando,           setCargando]           = useState(true)
  const [error,              setError]              = useState(null)
  const [busqueda,           setBusqueda]           = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [filtroEstado,       setFiltroEstado]       = useState('')

  const [exportando,  setExportando]  = useState(false)
  const [errorExport, setErrorExport] = useState(null)
  const [exitoExport, setExitoExport] = useState(false)

  const [editando,   setEditando]   = useState(null)
  const [editForm,   setEditForm]   = useState({})
  const [editEstado, setEditEstado] = useState('idle')
  const [editMsg,    setEditMsg]    = useState('')

  const [eliminando, setEliminando] = useState(null)
  const [elimEstado, setElimEstado] = useState('idle')
  const [elimMsg,    setElimMsg]    = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try { setLista(await profesoresService.getAll()) }
    catch (e) { setError(e.detail ?? 'No se pudo cargar la lista de profesores.') }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const listaFiltrada = useMemo(() => {
    let r = lista
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      r = r.filter(p =>
        p.cedula.toLowerCase().includes(q) ||
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        (p.correo_electronico ?? '').toLowerCase().includes(q)
      )
    }
    if (filtroEspecialidad) r = r.filter(p => p.especialidad === filtroEspecialidad)
    if (filtroEstado === 'activo')   r = r.filter(p => p.is_active)
    if (filtroEstado === 'inactivo') r = r.filter(p => !p.is_active)
    return r
  }, [lista, busqueda, filtroEspecialidad, filtroEstado])

  const abrirEditar = (prof) => {
    setEditando(prof); setEditForm({ ...prof }); setEditEstado('idle'); setEditMsg('')
  }
  const setEdit = (field) => (e) => setEditForm(f => ({ ...f, [field]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault(); setEditEstado('loading')
    try {
      await profesoresService.update(editando.id, {
        cedula:             editForm.cedula,
        nombre:             editForm.nombre,
        apellido:           editForm.apellido,
        especialidad:       editForm.especialidad,
        correo_electronico: editForm.correo_electronico ?? '',
        is_active:          editForm.is_active ?? true,
      })
      setEditando(null); await cargar()
    } catch (err) {
      setEditEstado('error'); setEditMsg(err.detail ?? 'No se pudo guardar los cambios.')
      setTimeout(() => setEditEstado('idle'), 2800)
    }
  }

  const confirmarEliminar = async () => {
    setElimEstado('loading'); setElimMsg('')
    try { await profesoresService.remove(eliminando.id); setEliminando(null); await cargar() }
    catch (e) { setElimMsg(e?.detail ?? 'No se pudo eliminar el profesor.') }
    finally { setElimEstado('idle') }
  }

  const limpiarFiltros = () => { setBusqueda(''); setFiltroEspecialidad(''); setFiltroEstado('') }
  const hayFiltros = busqueda || filtroEspecialidad || filtroEstado

  return (
    <div className="relative mx-auto max-w-[1240px]">
      <div className="aura" />

      {/* Page header */}
      <div className="mb-[26px]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <Users className="h-[14px] w-[14px]" /> Registros
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">Cuerpo docente</h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Consulta todos los profesores registrados, su especialidad y la carga de mesas que tienen asignada como tutores o jurados.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-[18px] rounded-[24px] border border-border bg-card px-7 py-6 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Buscar</label>
            <IconInput icon={<Search className="h-4 w-4" />}>
              <input type="text" placeholder="Nombre, cédula o correo…"
                value={busqueda} onChange={e => setBusqueda(e.target.value)} className={INPUT} />
            </IconInput>
          </div>
          <div style={{ width: 185 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Especialidad</label>
            <IconInput icon={<BookMarked className="h-4 w-4" />} iconClass="text-emerald-500">
              <select value={filtroEspecialidad} onChange={e => setFiltroEspecialidad(e.target.value)}
                className={INPUT + ' cursor-pointer'}>
                <option value="">Todas</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </IconInput>
          </div>
          <div style={{ width: 150 }}>
            <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Estado</label>
            <IconInput icon={<Activity className="h-4 w-4" />} iconClass="text-emerald-500">
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className={INPUT + ' cursor-pointer'}>
                <option value="">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </IconInput>
          </div>
          <button onClick={limpiarFiltros}
            className="flex h-11 items-center gap-2 rounded-[12px] border border-border px-4 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-red-500/[0.22] hover:bg-red-500/[0.1] hover:text-red-500">
            <RotateCcw className="h-[15px] w-[15px]" /> Limpiar
          </button>
        </div>
      </div>

      {/* Banners */}
      {exitoExport && (
        <div className="mb-3 flex items-center gap-2 rounded-[14px] border border-emerald-500/[0.22] bg-emerald-500/[0.1] px-4 py-2.5 text-[13px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Excel generado y guardado correctamente.
        </div>
      )}
      {errorExport && (
        <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">{errorExport}</div>
      )}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-[24px] border border-border bg-card px-6 py-4 text-[13.5px] text-muted-foreground shadow-card">
          {error}
          <button onClick={cargar} className="rounded-[12px] bg-gradient-pill px-4 py-1.5 text-xs font-semibold text-white">Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
        {/* Table bar */}
        <div className="flex items-center justify-between border-b border-border px-[22px] py-4">
          <div className="flex items-center gap-[9px] text-[14px] font-bold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Profesores registrados
            <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[10px] py-[3px] text-[11px] font-semibold text-primary">
              {cargando ? '—' : `${listaFiltrada.length} registros`}
            </span>
          </div>
          <button
            onClick={async () => {
              setExportando(true); setErrorExport(null)
              try { await exportarExcel(); setExitoExport(true); setTimeout(() => setExitoExport(false), 4000) }
              catch (e) {
                if (e !== 'cancelado' && e?.message !== 'cancelado') {
                  setErrorExport('No se pudo generar el Excel. Intenta de nuevo.')
                  setTimeout(() => setErrorExport(null), 4000)
                }
              } finally { setExportando(false) }
            }}
            disabled={exportando || lista.length === 0}
            className="flex items-center gap-2 rounded-[10px] border border-border px-3.5 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-all hover:border-primary/[0.22] hover:bg-primary/[0.08] hover:text-primary disabled:pointer-events-none disabled:opacity-40">
            <Download className="h-[14px] w-[14px]" />
            {exportando ? 'Generando…' : 'Exportar Excel'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 880 }}>
            <thead>
              <tr className="bg-secondary/40">
                {['Profesor', 'Especialidad', 'Correo', 'Carga de mesas', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="border-b border-border px-[18px] py-[13px] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : listaFiltrada.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-[50px] text-center text-[13px] text-muted-foreground">
                        {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay profesores registrados aún.'}
                      </td>
                    </tr>
                  )
                  : listaFiltrada.map(prof => (
                    <tr key={prof.id} className="border-b border-border last:border-0 transition-colors hover:bg-secondary/30">
                      {/* Profesor */}
                      <td className="px-[18px] py-[14px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-primary/[0.22] bg-primary/[0.12] text-[10px] font-bold text-primary">
                            {(prof.nombre?.[0] ?? '') + (prof.apellido?.[0] ?? '')}
                          </div>
                          <div>
                            <div className="text-[12.5px] font-semibold text-foreground">{prof.apellido}, {prof.nombre}</div>
                            <div className="text-[11.5px] font-semibold text-primary">{prof.cedula}</div>
                          </div>
                        </div>
                      </td>
                      {/* Especialidad */}
                      <td className="px-[18px] py-[14px] text-[12.5px] text-muted-foreground">{prof.especialidad || '—'}</td>
                      {/* Correo */}
                      <td className="px-[18px] py-[14px] text-[12px] text-muted-foreground">{prof.correo_electronico || '—'}</td>
                      {/* Carga */}
                      <td className="px-[18px] py-[14px]">
                        <LoadChips num_tutor={prof.num_tutor} num_jurado={prof.num_jurado} />
                      </td>
                      {/* Estado */}
                      <td className="px-[18px] py-[14px]">
                        <EstadoBadge activo={prof.is_active} />
                      </td>
                      {/* Acciones */}
                      <td className="px-[18px] py-[14px]">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => abrirEditar(prof)} title="Editar"
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary">
                            <Pencil className="h-[14px] w-[14px]" />
                          </button>
                          <button onClick={() => setEliminando(prof)} title="Eliminar"
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-red-500 hover:bg-red-500/[0.12] hover:text-red-500">
                            <Trash2 className="h-[14px] w-[14px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal edición */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Profesor" width="max-w-lg">
        {editando && (
          <form onSubmit={guardarEdicion} className="space-y-4 pt-1">
            <div>
              <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Cédula</label>
              <div className="group relative flex items-center">
                <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60"><IdCard className="h-4 w-4" /></span>
                <input type="text" inputMode="numeric"
                  value={editForm.cedula ?? ''} onChange={e => setEditForm(f => ({ ...f, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  required className={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Nombre</label>
                <div className="group relative flex items-center">
                  <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60"><User className="h-4 w-4" /></span>
                  <input type="text" value={editForm.nombre ?? ''} onChange={setEdit('nombre')} required className={INPUT} />
                </div>
              </div>
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Apellido</label>
                <div className="group relative flex items-center">
                  <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60"><User className="h-4 w-4" /></span>
                  <input type="text" value={editForm.apellido ?? ''} onChange={setEdit('apellido')} required className={INPUT} />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Especialidad</label>
              <div className="group relative flex items-center">
                <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60"><BookOpen className="h-4 w-4" /></span>
                <select value={editForm.especialidad ?? ''} onChange={setEdit('especialidad')} required className={INPUT + ' cursor-pointer'}>
                  <option value="" disabled>Seleccione…</option>
                  {ESPECIALIDADES.map(esp => <option key={esp}>{esp}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-[7px] block text-[12px] font-semibold text-muted-foreground">Correo Electrónico</label>
              <div className="group relative flex items-center">
                <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted-foreground/60"><Mail className="h-4 w-4" /></span>
                <input type="email" value={editForm.correo_electronico ?? ''} onChange={setEdit('correo_electronico')}
                  placeholder="c.mendoza@upel.edu.ve" required className={INPUT} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Disponible para mesas</p>
                <p className="text-[11.5px] text-muted-foreground">Solo profesores activos aparecen al programar.</p>
              </div>
              <Switch checked={editForm.is_active ?? true} onChange={val => setEditForm(f => ({ ...f, is_active: val }))} />
            </div>
            {editEstado === 'error' && (
              <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">{editMsg}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditando(null)}
                className="flex flex-1 items-center justify-center rounded-[14px] border border-border py-3 text-[13px] font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={editEstado === 'loading'}
                className="flex flex-1 items-center justify-center rounded-[14px] bg-gradient-pill py-3 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {editEstado === 'loading' ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal eliminación */}
      <Modal open={!!eliminando} onClose={() => { setEliminando(null); setElimMsg('') }} title="Eliminar Profesor" width="max-w-sm">
        {eliminando && (
          <div>
            <div className="mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-red-500/[0.22] bg-red-500/[0.12] mx-auto">
              <Trash2 className="h-[26px] w-[26px] text-red-500" />
            </div>
            <p className="text-center text-[13.5px] leading-[1.5] text-muted-foreground">
              ¿Eliminar a <span className="font-semibold text-foreground">{eliminando.nombre} {eliminando.apellido}</span>? Esta acción no se puede deshacer.
            </p>
            {elimMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">
                <AlertIcon /> {elimMsg}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setEliminando(null); setElimMsg('') }}
                className="flex-1 rounded-[12px] border border-border py-3 text-[13.5px] font-semibold text-muted-foreground hover:bg-secondary/40 transition-all">
                Cancelar
              </button>
              {!elimMsg && (
                <button onClick={confirmarEliminar} disabled={elimEstado === 'loading'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-red-600 py-3 text-[13.5px] font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                  <Trash2 className="h-[15px] w-[15px]" />
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
