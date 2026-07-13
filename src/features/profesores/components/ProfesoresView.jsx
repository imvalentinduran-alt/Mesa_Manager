import { useState } from 'react'
import { profesoresService } from '@/features/profesores'
import {
  Users2,
  Fingerprint,
  UserRound,
  IdCard,
  BookOpen,
  User,
  Mail,
  UserPlus,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'

const PROGRAMAS = [
  'Innovación Educativa',
  'Gerencia Educacional',
  'Planificación Global',
  'Educación, Ambiente y Desarrollo',
  'Enseñanza de la Educación Física',
  'Recreación',
  'Informática Educativa',
  'Orientación Educativa',
]

const EMPTY = {
  cedula:             '',
  nombre:             '',
  apellido:           '',
  especialidad:       '',
  correo_electronico: '',
}

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

export default function ProfesoresView({ session }) {
  if (session?.rol !== 'Jefa') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm font-medium text-foreground">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Esta sección es exclusiva para el rol Jefa.</p>
      </div>
    )
  }

  const [form,   setForm]   = useState(EMPTY)
  const [estado, setEstado] = useState('idle')
  const [msg,    setMsg]    = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.cedula.length < 7) {
      setEstado('error')
      setMsg(`La cédula debe tener entre 7 y 10 dígitos (llevas ${form.cedula.length}).`)
      return
    }
    if (!form.correo_electronico.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico.trim())) {
      setEstado('error')
      setMsg('Ingresa un correo electrónico institucional válido.')
      return
    }
    setEstado('loading')
    try {
      await profesoresService.create({
        cedula:             form.cedula,
        nombre:             form.nombre,
        apellido:           form.apellido,
        especialidad:       form.especialidad,
        correo_electronico: form.correo_electronico.trim(),
      })
      setForm(EMPTY)
      setEstado('ok')
      setMsg(`${form.nombre} ${form.apellido}`)
    } catch (err) {
      setEstado('error')
      setMsg(err.detail ?? 'No se pudo registrar. Verifica los datos e intenta de nuevo.')
      setTimeout(() => setEstado('idle'), 2800)
    }
  }

  if (estado === 'ok') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-[24px] border border-border bg-card px-8 py-16 text-center shadow-card">
          <div className="relative mb-6 flex h-[90px] w-[90px] items-center justify-center rounded-full border border-emerald-500/[0.22] bg-emerald-500/[0.12]">
            <CheckCircle2 className="h-11 w-11 stroke-[2.4] text-emerald-500" />
          </div>
          <h2 className="text-[22px] font-bold text-foreground">Profesor registrado</h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">{msg}</span> fue incorporado al cuerpo de tutores y jurados correctamente.
          </p>
          <div className="mt-7">
            <button
              onClick={() => { setEstado('idle'); setMsg('') }}
              className="flex items-center gap-2 rounded-[14px] border border-border px-5 py-[15px] text-[13px] font-semibold text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary/40 transition-all"
            >
              <UserPlus className="h-[15px] w-[15px]" /> Registrar otro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="aura" />

      {/* Page header */}
      <div className="mb-[26px]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <Users2 className="h-[14px] w-[14px]" />
          Gestión de Profesores
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">
          Registrar nuevo profesor
        </h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Incorpora un docente al cuerpo de tutores y jurados. Su especialidad determina los comités a los que podrá ser asignado.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-[18px]">

        {/* Sección 1 — Identificación */}
        <SecCard icon={<Fingerprint className="h-[17px] w-[17px]" />} step="Paso 1" title="Identificación">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Lbl required count={{ val: `${form.cedula.length}/10`, ok: form.cedula.length >= 7 }}>
                Cédula de identidad
              </Lbl>
              <IconInput icon={<IdCard className="h-4 w-4" />}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="V-12.345.678"
                  value={form.cedula}
                  onChange={(e) => setForm(f => ({ ...f, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  required
                  className={INPUT}
                />
              </IconInput>
            </div>
            <div>
              <Lbl required>Especialidad</Lbl>
              <IconInput icon={<BookOpen className="h-4 w-4" />}>
                <select
                  value={form.especialidad}
                  onChange={set('especialidad')}
                  required
                  className={INPUT + ' cursor-pointer'}
                >
                  <option value="" disabled>Seleccionar…</option>
                  {PROGRAMAS.map(p => <option key={p}>{p}</option>)}
                </select>
              </IconInput>
            </div>
          </div>
        </SecCard>

        {/* Sección 2 — Datos personales */}
        <SecCard icon={<UserRound className="h-[17px] w-[17px]" />} step="Paso 2" title="Datos personales">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Lbl required>Nombre</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" placeholder="Carlos Alberto"
                  value={form.nombre} onChange={set('nombre')} required className={INPUT} />
              </IconInput>
            </div>
            <div>
              <Lbl required>Apellido</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" placeholder="Ramírez Soto"
                  value={form.apellido} onChange={set('apellido')} required className={INPUT} />
              </IconInput>
            </div>
            <div className="col-span-2">
              <Lbl required>Correo electrónico</Lbl>
              <IconInput icon={<Mail className="h-4 w-4" />}>
                <input type="email" placeholder="c.mendoza@upel.edu.ve"
                  value={form.correo_electronico} onChange={set('correo_electronico')} required className={INPUT} />
              </IconInput>
            </div>
          </div>
        </SecCard>

        {estado === 'error' && (
          <div className="flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/[0.22] dark:bg-red-500/[0.1]">
            <p className="text-[12.5px] text-red-700 dark:text-red-400">{msg}</p>
          </div>
        )}

        <div className="flex items-center gap-3.5">
          <button
            type="submit"
            disabled={estado === 'loading'}
            className="flex flex-1 items-center justify-center gap-2.5 rounded-[14px] bg-gradient-pill px-6 py-[15px] text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_rgba(46,108,166,.8)] transition-all disabled:opacity-50"
          >
            {estado === 'loading'
              ? 'Registrando…'
              : <><UserPlus className="h-[17px] w-[17px]" /> Registrar Profesor</>}
          </button>
          <button
            type="button"
            onClick={() => { setForm(EMPTY); setEstado('idle'); setMsg('') }}
            disabled={estado === 'loading'}
            className="flex items-center gap-2 rounded-[14px] border border-border px-5 py-[15px] text-[13px] font-semibold text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary/40 transition-all disabled:opacity-50"
          >
            <RotateCcw className="h-[15px] w-[15px]" /> Limpiar
          </button>
        </div>

      </form>
    </div>
  )
}
