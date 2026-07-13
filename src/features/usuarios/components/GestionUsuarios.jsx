import { useState, useEffect, useCallback } from 'react'
import {
  UserCog, UserPlus, UsersRound, Trash2, Pencil,
  IdCard, User, Shield, KeyRound, BookMarked, Mail,
} from 'lucide-react'
import { usuariosService } from '@/features/usuarios'
import Modal from '@/shared/components/Modal'

const ROLES    = ['Coordinador', 'Jefa']
const CEDULA_MAX = 8

function filterCedula(raw) { return raw.replace(/\D/g, '').slice(0, CEDULA_MAX) }
function iniciales(nombre, apellido) { return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() }

const EMPTY      = { cedula: '', nombre: '', apellido: '', rol: '', contrasena: '', maestria_id: null }
const EMPTY_EDIT = { cedula: '', nombre: '', apellido: '', rol: '', maestria_id: null, contrasena: '' }

const INPUT = 'h-11 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-[14px] text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]'

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

function Lbl({ children, required, count }) {
  return (
    <label className="mb-[7px] flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
      {children}
      {required && <span className="text-red-500">*</span>}
      {count !== undefined && (
        <span className={`ml-auto text-[10.5px] font-medium tabular-nums ${count.ok ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>
          {count.val}
        </span>
      )}
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

function RolBadge({ rol }) {
  if (rol === 'Jefa') return (
    <span className="rounded-full border border-amber-500/[0.28] bg-amber-500/[0.12] px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-amber-500 dark:text-amber-400">
      Jefa
    </span>
  )
  return (
    <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-primary">
      Coordinador
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-border bg-card px-5 py-4 shadow-card">
      <div className="animate-pulse h-[46px] w-[46px] rounded-full bg-secondary shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="animate-pulse h-4 w-36 rounded bg-secondary" />
        <div className="animate-pulse h-3 w-24 rounded bg-secondary" />
      </div>
      <div className="animate-pulse h-5 w-20 rounded-full bg-secondary" />
    </div>
  )
}

export default function GestionUsuarios({ session }) {
  if (session?.rol !== 'Jefa') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm font-medium text-foreground">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Esta sección es exclusiva para el rol Jefa.</p>
      </div>
    )
  }

  const [usuarios,  setUsuarios]  = useState([])
  const [maestrias, setMaestrias] = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)

  const [newId,   setNewId]   = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [estado,  setEstado]  = useState('idle')
  const [msg,     setMsg]     = useState('')

  const [eliminando, setEliminando] = useState(null)
  const [elimEstado, setElimEstado] = useState('idle')

  const [editando,   setEditando]   = useState(null)
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT)
  const [editEstado, setEditEstado] = useState('idle')
  const [editMsg,    setEditMsg]    = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const [lista, mstrs] = await Promise.all([usuariosService.getAll(), usuariosService.getMaestrias()])
      setUsuarios(lista); setMaestrias(mstrs)
    } catch (e) { setError(e.detail ?? 'No se pudo cargar la lista de usuarios.') }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const onRolChange = (e) => {
    const rol = e.target.value
    setForm(f => ({ ...f, rol, maestria_id: rol === 'Jefa' ? null : f.maestria_id }))
  }

  const onSubmit = async (e) => {
    e.preventDefault(); setEstado('loading')
    try {
      const nuevo = await usuariosService.create({
        cedula: form.cedula, nombre: form.nombre, apellido: form.apellido,
        rol: form.rol, contrasena: form.contrasena,
        maestria_id: form.rol === 'Coordinador' ? Number(form.maestria_id) : null,
      })
      setForm(EMPTY); setEstado('ok'); setMsg('Usuario registrado correctamente.')
      await cargar()
      if (nuevo?.id) { setNewId(nuevo.id); setTimeout(() => setNewId(null), 600) }
    } catch (err) {
      setEstado('error'); setMsg(err.detail ?? 'No se pudo registrar. Verifica los datos e intenta de nuevo.')
    } finally { setTimeout(() => setEstado('idle'), 2800) }
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setEditForm({ cedula: u.cedula, nombre: u.nombre, apellido: u.apellido, rol: u.rol, maestria_id: u.maestria_id ?? null, contrasena: '' })
    setEditEstado('idle'); setEditMsg('')
  }

  const onEditRolChange = (e) => {
    const rol = e.target.value
    setEditForm(f => ({ ...f, rol, maestria_id: rol === 'Jefa' ? null : f.maestria_id }))
  }

  const onEditSubmit = async (e) => {
    e.preventDefault(); setEditEstado('loading')
    try {
      await usuariosService.update(editando.id, {
        cedula: editForm.cedula, nombre: editForm.nombre, apellido: editForm.apellido,
        rol: editForm.rol, maestria_id: editForm.rol === 'Coordinador' ? Number(editForm.maestria_id) : null,
        contrasena: editForm.contrasena || null,
      })
      setEditando(null); await cargar()
    } catch (err) { setEditEstado('error'); setEditMsg(err.detail ?? 'No se pudo actualizar.') }
  }

  const confirmarEliminar = async () => {
    setElimEstado('loading')
    try { await usuariosService.remove(eliminando.id); setEliminando(null); await cargar() }
    catch { }
    finally { setElimEstado('idle') }
  }

  const nombreMaestria = (id) => maestrias.find(m => m.id === id)?.nombre ?? null

  return (
    <div className="relative mx-auto max-w-[1000px]">
      <div className="aura" />

      {/* Page header */}
      <div className="mb-[26px]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <UserCog className="h-[14px] w-[14px]" /> Administración
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">
          Gestión de usuarios
        </h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Crea y administra las cuentas del personal con acceso al sistema. Los coordinadores quedan asociados a una maestría específica.
        </p>
      </div>

      {/* Formulario de registro */}
      <form onSubmit={onSubmit}>
        <SecCard icon={<UserPlus className="h-[17px] w-[17px]" />} step="Nuevo" title="Crear usuario">
          <div className="grid grid-cols-3 gap-4">

            {/* Cédula */}
            <div>
              <Lbl required count={{ val: `${form.cedula.length}/${CEDULA_MAX}`, ok: form.cedula.length >= 7 }}>
                Cédula
              </Lbl>
              <IconInput icon={<IdCard className="h-4 w-4" />}>
                <input type="text" inputMode="numeric" placeholder="V-12.345.678"
                  value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: filterCedula(e.target.value) }))}
                  required minLength={7} className={INPUT} />
              </IconInput>
            </div>

            {/* Nombre */}
            <div>
              <Lbl required>Nombre</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" placeholder="Ana" value={form.nombre} onChange={set('nombre')} required className={INPUT} />
              </IconInput>
            </div>

            {/* Apellido */}
            <div>
              <Lbl required>Apellido</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" placeholder="Suárez" value={form.apellido} onChange={set('apellido')} required className={INPUT} />
              </IconInput>
            </div>

            {/* Rol */}
            <div>
              <Lbl required>Rol</Lbl>
              <IconInput icon={<Shield className="h-4 w-4" />}>
                <select value={form.rol} onChange={onRolChange} required className={INPUT + ' cursor-pointer'}>
                  <option value="" disabled>Seleccionar…</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </IconInput>
            </div>

            {/* Contraseña (span 2) */}
            <div className="col-span-2">
              <Lbl required>Contraseña inicial</Lbl>
              <IconInput icon={<KeyRound className="h-4 w-4" />}>
                <input type="password" placeholder="Mínimo 6 caracteres"
                  value={form.contrasena} onChange={set('contrasena')} minLength={6} required className={INPUT} />
              </IconInput>
            </div>

            {/* Maestría (condicional, full) */}
            {form.rol === 'Coordinador' && (
              <div className="col-span-3">
                <Lbl required>Maestría asignada</Lbl>
                <IconInput icon={<BookMarked className="h-4 w-4" />}>
                  <select value={form.maestria_id ?? ''} onChange={e => setForm(f => ({ ...f, maestria_id: e.target.value }))}
                    required className={INPUT + ' cursor-pointer'}>
                    <option value="" disabled>Seleccionar maestría…</option>
                    {maestrias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </IconInput>
              </div>
            )}

            {/* Submit full-width */}
            <div className="col-span-3">
              {(estado === 'error' || estado === 'ok') && (
                <p className={`mb-4 rounded-[14px] px-4 py-3 text-[12.5px] border ${estado === 'ok'
                  ? 'border-emerald-500/[0.22] bg-emerald-500/[0.1] text-emerald-600 dark:text-emerald-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400'}`}>
                  {msg}
                </p>
              )}
              <button type="submit" disabled={estado === 'loading'}
                className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-gradient-pill py-[15px] text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_rgba(46,108,166,.8)] transition-all disabled:opacity-50">
                <UserPlus className="h-[17px] w-[17px]" />
                {estado === 'loading' ? 'Registrando…' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </SecCard>
      </form>

      {/* Error de carga */}
      {error && (
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-border bg-card px-6 py-4 text-[13.5px] text-muted-foreground shadow-card">
          {error}
          <button onClick={cargar}
            className="rounded-[12px] bg-gradient-pill px-4 py-1.5 text-xs font-semibold text-white">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid head */}
      <div className="mt-[30px] mb-4 flex items-center gap-[9px]">
        <UsersRound className="h-[17px] w-[17px] text-primary" />
        <h2 className="text-[15px] font-bold text-foreground">Usuarios del sistema</h2>
        {!cargando && (
          <span className="rounded-full border border-primary/[0.22] bg-primary/[0.12] px-[9px] py-0.5 text-[11px] font-semibold text-primary">
            {usuarios.length}
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-[10px]">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          : usuarios.map(u => (
            <div key={u.id}
              className={`user-row group relative flex items-center gap-4 overflow-hidden rounded-[18px] border border-border bg-card px-5 py-4 shadow-card transition-all duration-[220ms] hover:translate-x-1 hover:border-border/80 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)] ${u.id === newId ? 'adding' : ''}`}>

              {/* Left stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] origin-top scale-y-0 bg-gradient-pill transition-transform duration-[300ms] group-hover:scale-y-100" />

              {/* Avatar */}
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-pill shadow-[0_8px_20px_-8px_rgba(46,108,166,.6)]">
                <span className="text-[15px] font-bold text-white">{iniciales(u.nombre, u.apellido)}</span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[9px] text-[14.5px] font-bold text-foreground">
                  {u.apellido}, {u.nombre}
                  <RolBadge rol={u.rol} />
                </div>
                <div className="mt-[3px] flex items-center gap-[7px] text-[12px] text-muted-foreground">
                  <IdCard className="h-3 w-3 shrink-0" />
                  {u.cedula}
                  {u.maestria_id && nombreMaestria(u.maestria_id) && (
                    <>
                      <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40 shrink-0" />
                      <span className="text-primary/70">{nombreMaestria(u.maestria_id)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex translate-x-2 items-center gap-1.5 opacity-30 dark:opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                <button onClick={() => abrirEditar(u)} title="Editar"
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/[0.12] hover:text-primary">
                  <Pencil className="h-[15px] w-[15px]" />
                </button>
                <button onClick={() => setEliminando(u)} title="Eliminar"
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-all hover:border-red-500 hover:bg-red-500/[0.12] hover:text-red-500">
                  <Trash2 className="h-[15px] w-[15px]" />
                </button>
              </div>
            </div>
          ))}

        {!cargando && !error && usuarios.length === 0 && (
          <p className="rounded-[24px] border border-border bg-card py-12 text-center text-[13.5px] text-muted-foreground shadow-card">
            No hay usuarios registrados aún.
          </p>
        )}
      </div>

      {/* Modal edición */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Usuario" width="max-w-lg">
        {editando && (
          <form onSubmit={onEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Lbl required>Nombre</Lbl>
                <IconInput icon={<User className="h-4 w-4" />}>
                  <input type="text" value={editForm.nombre}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} required className={INPUT} />
                </IconInput>
              </div>
              <div>
                <Lbl required>Apellido</Lbl>
                <IconInput icon={<User className="h-4 w-4" />}>
                  <input type="text" value={editForm.apellido}
                    onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))} required className={INPUT} />
                </IconInput>
              </div>
            </div>

            <div>
              <Lbl required>Rol</Lbl>
              <IconInput icon={<Shield className="h-4 w-4" />}>
                <select value={editForm.rol} onChange={onEditRolChange} required className={INPUT + ' cursor-pointer'}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </IconInput>
            </div>

            {editForm.rol === 'Coordinador' && (
              <div>
                <Lbl required>Maestría asignada</Lbl>
                <IconInput icon={<BookMarked className="h-4 w-4" />}>
                  <select value={editForm.maestria_id ?? ''} onChange={e => setEditForm(f => ({ ...f, maestria_id: e.target.value }))}
                    required className={INPUT + ' cursor-pointer'}>
                    <option value="" disabled>Seleccionar…</option>
                    {maestrias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </IconInput>
              </div>
            )}

            <div>
              <Lbl>Nueva contraseña <span className="ml-1 text-[10.5px] font-normal text-muted-foreground/60">(dejar en blanco para no cambiar)</span></Lbl>
              <IconInput icon={<KeyRound className="h-4 w-4" />}>
                <input type="password" placeholder="••••••••" value={editForm.contrasena}
                  onChange={e => setEditForm(f => ({ ...f, contrasena: e.target.value }))}
                  minLength={editForm.contrasena ? 6 : undefined} className={INPUT} />
              </IconInput>
            </div>

            {editEstado === 'error' && (
              <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">{editMsg}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditando(null)}
                className="flex-1 rounded-[14px] border border-border py-3 text-[13px] font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all justify-center flex">
                Cancelar
              </button>
              <button type="submit" disabled={editEstado === 'loading'}
                className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-gradient-pill py-3 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {editEstado === 'loading' ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal eliminación */}
      <Modal open={!!eliminando} onClose={() => setEliminando(null)} title="Eliminar Usuario" width="max-w-sm">
        {eliminando && (
          <div>
            <div className="mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-red-500/[0.22] bg-red-500/[0.12] mx-auto">
              <UserCog className="h-[26px] w-[26px] text-red-500" />
            </div>
            <p className="text-center text-[13.5px] leading-[1.5] text-muted-foreground">
              ¿Eliminar la cuenta de{' '}
              <span className="font-semibold text-foreground">{eliminando.nombre} {eliminando.apellido}</span>?
              Perderá el acceso al sistema de inmediato.
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
