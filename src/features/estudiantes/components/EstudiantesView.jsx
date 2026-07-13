import { useState, useMemo } from 'react'
import { estudiantesService } from '@/features/estudiantes'
import { profesoresService  } from '@/features/profesores'
import { apiFetch           } from '@/shared/lib/api'
import { useApiCache        } from '@/shared/lib/useApiCache'
import SearchableSelect       from '@/shared/components/SearchableSelect'
import { AlertIcon, Spinner } from '@/shared/components/icons'
import {
  GraduationCap,
  Fingerprint,
  UserRound,
  BookMarked,
  UsersRound,
  IdCard,
  User,
  Mail,
  Calendar,
  BookUser,
  UserPlus,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'

const COMITE_KEYS = [
  'id_tutor_principal', 'id_tutor_suplente',
  'id_jurado1_principal', 'id_jurado1_suplente',
  'id_jurado2_principal', 'id_jurado2_suplente',
]
const COMITE_LABELS = {
  id_tutor_principal:   'Tutor — Principal',
  id_tutor_suplente:    'Tutor — Suplente',
  id_jurado1_principal: 'Jurado 1 — Principal',
  id_jurado1_suplente:  'Jurado 1 — Suplente',
  id_jurado2_principal: 'Jurado 2 — Principal',
  id_jurado2_suplente:  'Jurado 2 — Suplente',
}

const EMPTY_FORM = {
  nacionalidad: 'Venezolano', cedula: '', pasaporte: '',
  nombre: '', apellido: '',
  correo_electronico: '', cohorte: '', titulo_proyecto: '',
  maestria_id: '',
  id_tutor_principal:   '', id_tutor_suplente:    '',
  id_jurado1_principal: '', id_jurado1_suplente:  '',
  id_jurado2_principal: '', id_jurado2_suplente:  '',
}

const filterCedula = (raw, esVenezolano) =>
  raw.replace(/\D/g, '').slice(0, esVenezolano ? 8 : 10)

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

export default function EstudiantesView({ session }) {
  const isJefa = session?.rol === 'Jefa'

  const { data: profesores, error: errProfs } = useApiCache('profesores_activos', profesoresService.getActivos, 120_000)
  const { data: maestrias,  error: errMaest } = useApiCache(
    'maestrias',
    () => isJefa ? apiFetch('/api/maestrias/') : Promise.resolve([]),
    300_000,
  )
  const loadErr = errProfs || errMaest || null

  const [form,   setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const [creado, setCreado] = useState(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(null) }

  const comiteError = useMemo(() => {
    const ids = COMITE_KEYS.map(k => form[k]).filter(v => v !== '')
    if (ids.length === 6 && new Set(ids).size < 6)
      return 'Los 6 miembros del comité deben ser profesores distintos.'
    return null
  }, [form])

  const optsProf = useMemo(() => profesores.map(p => ({
    value: p.id,
    label: p.nombre_completo,
    searchText: `${p.nombre_completo} ${p.cedula ?? ''}`,
  })), [profesores])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (comiteError) { setError(comiteError); return }
    if (form.nacionalidad === 'Venezolano' && !/^\d{7,8}$/.test(form.cedula)) {
      setError(`La cédula venezolana debe tener 7 u 8 dígitos (llevas ${form.cedula.length}).`)
      return
    }
    if (form.nacionalidad === 'Colombiano' && !/^\d{10}$/.test(form.cedula)) {
      setError(`La C.C. colombiana debe tener exactamente 10 dígitos (llevas ${form.cedula.length}).`)
      return
    }
    if (form.nacionalidad === 'Colombiano' && !form.pasaporte.trim()) {
      setError('El número de pasaporte es obligatorio para estudiantes colombianos.')
      return
    }
    setSaving(true); setError(null)
    try {
      const payload = {
        cedula:               form.cedula,
        tipo_documento:       form.nacionalidad === 'Venezolano' ? 'Venezolano' : 'Colombiano',
        pasaporte:            form.nacionalidad === 'Colombiano' ? form.pasaporte : null,
        nombre:               form.nombre,
        apellido:             form.apellido,
        correo_electronico:   form.correo_electronico,
        cohorte:              form.cohorte,
        titulo_proyecto:      form.titulo_proyecto,
        id_tutor_principal:   Number(form.id_tutor_principal),
        id_tutor_suplente:    Number(form.id_tutor_suplente),
        id_jurado1_principal: Number(form.id_jurado1_principal),
        id_jurado1_suplente:  Number(form.id_jurado1_suplente),
        id_jurado2_principal: Number(form.id_jurado2_principal),
        id_jurado2_suplente:  Number(form.id_jurado2_suplente),
      }
      if (isJefa) payload.maestria_id = Number(form.maestria_id)
      const est = await estudiantesService.create(payload)
      setCreado(`${est.nombre} ${est.apellido}`)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.detail ?? 'No se pudo registrar el estudiante.')
    } finally { setSaving(false) }
  }

  if (creado) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-[24px] border border-border bg-card px-8 py-16 text-center shadow-card">
          <div className="relative mb-6 flex h-[90px] w-[90px] items-center justify-center rounded-full border border-emerald-500/[0.22] bg-emerald-500/[0.12]">
            <CheckCircle2 className="h-11 w-11 stroke-[2.4] text-emerald-500" />
          </div>
          <h2 className="text-[22px] font-bold text-foreground">Estudiante registrado</h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">{creado}</span> fue añadido al sistema y su comité evaluador quedó asignado correctamente.
          </p>
          <div className="mt-7">
            <button
              onClick={() => setCreado(null)}
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
          <GraduationCap className="h-[14px] w-[14px]" />
          Gestión de Estudiantes
        </div>
        <h1 className="mt-[9px] text-[25px] font-bold tracking-[-0.02em] text-foreground">
          Registrar nuevo estudiante
        </h1>
        <p className="mt-[6px] max-w-[520px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Completa la ficha del aspirante y asigna su comité evaluador. Todos los campos marcados son obligatorios.
        </p>
      </div>

      {loadErr && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/[0.22] dark:bg-red-500/[0.1] dark:text-red-400">
          <AlertIcon /> {loadErr}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-[18px]">

        {/* Sección 1 — Identificación */}
        <SecCard icon={<Fingerprint className="h-[17px] w-[17px]" />} step="Paso 1" title="Identificación">
          <div className="mb-[18px]">
            <Lbl>Nacionalidad</Lbl>
            <div className="inline-flex gap-1 rounded-[13px] border border-border bg-secondary/40 p-1">
              <button type="button"
                onClick={() => { setForm(f => ({ ...f, nacionalidad: 'Venezolano', cedula: '', pasaporte: '' })); setError(null) }}
                className={`flex items-center gap-2 rounded-[9px] px-[18px] py-[9px] text-[13px] font-semibold transition-all ${
                  form.nacionalidad === 'Venezolano'
                    ? 'bg-gradient-pill text-white shadow-[0_6px_16px_-6px_rgba(46,108,166,.7)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <span className="nat-flag">
                  <svg viewBox="0 0 30 20" aria-hidden="true" style={{width:'100%',height:'100%',display:'block'}}>
                    <defs><path id="veStar1" d="M0,-0.7 0.165,-0.227 0.666,-0.216 0.266,0.087 0.412,0.566 0,0.28 -0.412,0.566 -0.266,0.087 -0.666,-0.216 -0.165,-0.227Z"/></defs>
                    <rect width="30" height="20" fill="#CF142B"/>
                    <rect width="30" height="13.34" fill="#00247D"/>
                    <rect width="30" height="6.67" fill="#FCD116"/>
                    <g fill="#fff"><use href="#veStar1" x="8.6" y="10"/><use href="#veStar1" x="10.1" y="9.3"/><use href="#veStar1" x="11.5" y="8.8"/><use href="#veStar1" x="13.0" y="8.6"/><use href="#veStar1" x="14.3" y="8.6"/><use href="#veStar1" x="15.8" y="8.8"/><use href="#veStar1" x="17.2" y="9.3"/><use href="#veStar1" x="18.6" y="10"/></g>
                  </svg>
                </span>
                Venezolano
              </button>
              <button type="button"
                onClick={() => { setForm(f => ({ ...f, nacionalidad: 'Colombiano', cedula: '', pasaporte: '' })); setError(null) }}
                className={`flex items-center gap-2 rounded-[9px] px-[18px] py-[9px] text-[13px] font-semibold transition-all ${
                  form.nacionalidad === 'Colombiano'
                    ? 'bg-gradient-pill text-white shadow-[0_6px_16px_-6px_rgba(46,108,166,.7)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <span className="nat-flag">
                  <svg viewBox="0 0 30 20" aria-hidden="true" style={{width:'100%',height:'100%',display:'block'}}>
                    <rect width="30" height="20" fill="#CE1126"/>
                    <rect width="30" height="15" fill="#003893"/>
                    <rect width="30" height="10" fill="#FCD116"/>
                  </svg>
                </span>
                Colombiano
              </button>
            </div>
          </div>

          {form.nacionalidad === 'Venezolano' ? (
            <div>
              <Lbl required count={{ val: `${form.cedula.length}/8`, ok: form.cedula.length >= 7 }}>
                Cédula de identidad
              </Lbl>
              <IconInput icon={<IdCard className="h-4 w-4" />}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="V-12.345.678"
                  value={form.cedula}
                  onChange={e => set('cedula', filterCedula(e.target.value, true))}
                  required
                  className={INPUT}
                />
              </IconInput>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Lbl required>Cédula de ciudadanía</Lbl>
                <IconInput icon={<IdCard className="h-4 w-4" />}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="C.C. 1.094.567.890"
                    value={form.cedula}
                    onChange={e => set('cedula', filterCedula(e.target.value, false))}
                    required
                    className={INPUT}
                  />
                </IconInput>
              </div>
              <div>
                <Lbl required>Pasaporte</Lbl>
                <IconInput icon={<BookUser className="h-4 w-4" />}>
                  <input
                    type="text"
                    placeholder="AX-123456"
                    value={form.pasaporte}
                    onChange={e => set('pasaporte', e.target.value.toUpperCase().slice(0, 15))}
                    required
                    className={INPUT}
                  />
                </IconInput>
              </div>
            </div>
          )}
        </SecCard>

        {/* Sección 2 — Datos personales */}
        <SecCard icon={<UserRound className="h-[17px] w-[17px]" />} step="Paso 2" title="Datos personales">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Lbl required>Nombre</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Carlos Alberto" required className={INPUT} />
              </IconInput>
            </div>
            <div>
              <Lbl required>Apellido</Lbl>
              <IconInput icon={<User className="h-4 w-4" />}>
                <input type="text" value={form.apellido}
                  onChange={e => set('apellido', e.target.value)}
                  placeholder="Mendoza Pérez" required className={INPUT} />
              </IconInput>
            </div>
            <div>
              <Lbl required>Correo electrónico</Lbl>
              <IconInput icon={<Mail className="h-4 w-4" />}>
                <input type="email" value={form.correo_electronico}
                  onChange={e => set('correo_electronico', e.target.value)}
                  placeholder="estudiante@upel.edu.ve" required className={INPUT} />
              </IconInput>
            </div>
            <div>
              <Lbl required>Cohorte</Lbl>
              <IconInput icon={<Calendar className="h-4 w-4" />}>
                <input type="text" value={form.cohorte}
                  onChange={e => set('cohorte', e.target.value)}
                  placeholder="2026-I" required className={INPUT} />
              </IconInput>
            </div>
            <div className="col-span-2">
              <Lbl required>Título del proyecto</Lbl>
              <textarea
                value={form.titulo_proyecto}
                onChange={e => set('titulo_proyecto', e.target.value)}
                rows={2}
                placeholder="Estrategias didácticas mediadas por TIC para el fortalecimiento de la comprensión lectora…"
                className="min-h-[64px] w-full resize-none rounded-xl border border-border bg-secondary/40 px-[14px] py-3 text-[13.5px] leading-[1.5] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/[0.12]"
              />
            </div>
          </div>
        </SecCard>

        {/* Sección 3 — Programa (solo Jefa) */}
        {isJefa && (
          <SecCard icon={<BookMarked className="h-[17px] w-[17px]" />} step="Paso 3" title="Programa académico">
            <div>
              <Lbl required>Maestría</Lbl>
              <IconInput icon={<GraduationCap className="h-4 w-4" />}>
                <select
                  value={form.maestria_id}
                  onChange={e => set('maestria_id', e.target.value)}
                  required
                  className={INPUT + ' cursor-pointer'}>
                  <option value="" disabled>Seleccionar…</option>
                  {maestrias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </IconInput>
            </div>
          </SecCard>
        )}

        {/* Sección 4 — Comité evaluador */}
        <SecCard icon={<UsersRound className="h-[17px] w-[17px]" />} step={isJefa ? 'Paso 4' : 'Paso 3'} title="Comité evaluador">
          <div className="grid grid-cols-2 gap-4">
            {COMITE_KEYS.map(k => (
              <div key={k}>
                <Lbl required={k.includes('principal')}>{COMITE_LABELS[k]}</Lbl>
                <SearchableSelect
                  options={optsProf}
                  value={form[k]}
                  onChange={v => set(k, v)}
                  placeholder="Buscar profesor…"
                />
              </div>
            ))}
          </div>
        </SecCard>

        {(error || comiteError) && (
          <div className="flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/[0.22] dark:bg-red-500/[0.1]">
            <AlertIcon />
            <p className="text-[12.5px] text-red-700 dark:text-red-400">{error ?? comiteError}</p>
          </div>
        )}

        <div className="flex items-center gap-3.5">
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2.5 rounded-[14px] bg-gradient-pill px-6 py-[15px] text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(46,108,166,.7)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_rgba(46,108,166,.8)] transition-all disabled:opacity-50"
          >
            {saving ? <><Spinner /> Registrando…</> : <><UserPlus className="h-[17px] w-[17px]" /> Registrar Estudiante</>}
          </button>
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setError(null) }}
            disabled={saving}
            className="flex items-center gap-2 rounded-[14px] border border-border px-5 py-[15px] text-[13px] font-semibold text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary/40 transition-all disabled:opacity-50"
          >
            <RotateCcw className="h-[15px] w-[15px]" /> Limpiar
          </button>
        </div>

      </form>
    </div>
  )
}
