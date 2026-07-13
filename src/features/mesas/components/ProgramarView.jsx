import { useState, useEffect, useMemo, useCallback } from 'react'
import { estudiantesService } from '@/features/estudiantes'
import { profesoresService  } from '@/features/profesores'
import { aulasService        } from '@/features/aulas'
import { mesasService        } from '@/features/mesas'
import SearchableSelect       from '@/shared/components/SearchableSelect'
import { AlertIcon, RetryIcon, Spinner, LockIcon, WarnIcon } from '@/shared/components/icons'
import { useApiCache } from '@/shared/lib/useApiCache'

// ── Inline SVG icons ───────────────────────────────────────────────────────
function Ico({ size = 17, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
const CalendarPlusIcon  = ({ size = 17 }) => <Ico size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></Ico>
const GraduationCapIcon = ({ size = 17 }) => <Ico size={size}><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></Ico>
const CalendarClockIcon = ({ size = 17 }) => <Ico size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="15" cy="15" r="3"/><path d="M15 13.5V15l1 1"/></Ico>
const CalendarCheckIcon = ({ size = 16 }) => <Ico size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></Ico>
const FileTextIcon      = ({ size = 13 }) => <Ico size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ico>
const UsersIcon         = ({ size = 13 }) => <Ico size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>
const InfoIcon          = ({ size = 13 }) => <Ico size={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Ico>

// ── Lógica de horario ──────────────────────────────────────────────────────
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function calcHoraFin(inicio) {
  if (!inicio) return null
  const [h, m] = inicio.split(':').map(Number)
  const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  return { m40: fmt(h * 60 + m + 40), m60: fmt(h * 60 + m + 60) }
}

function getDia(dateStr) {
  if (!dateStr) return null
  return DIAS[new Date(dateStr + 'T12:00:00').getDay()]
}

function isWeekday(dateStr) {
  const dia = getDia(dateStr)
  return !dia || !['Sábado', 'Domingo'].includes(dia)
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

function horaEnMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function getInitials(name) {
  if (!name || name === '—') return '?'
  return name
    .replace(/^(Dra?\.|MSc\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Estilos reutilizables ─────────────────────────────────────────────────
const FIELD_INPUT = [
  'h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm text-foreground',
  'placeholder:text-muted-foreground/50 outline-none transition-all',
  'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15',
].join(' ')

const COMITE_ROLES = [
  { key: 'id_tutor_principal',   label: 'Tutor Principal',    isTutor: true  },
  { key: 'id_jurado1_principal', label: 'Jurado 1 Principal', isTutor: false },
  { key: 'id_jurado2_principal', label: 'Jurado 2 Principal', isTutor: false },
]

const EMPTY = { id_estudiante: '', id_aula: '', fecha: '', hora_inicio: '' }

// ── SectionCard ────────────────────────────────────────────────────────────
function SectionCard({ icon, eyebrow, title, children }) {
  return (
    <div className="sec-card rounded-[24px] border border-border bg-card px-7 py-[26px] shadow-card mb-[18px]">
      <div className="mb-[22px] flex items-center gap-[13px]">
        <div className="sec-icon flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-primary/[0.22] bg-primary/[0.12] text-primary">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{eyebrow}</div>
          <div className="mt-0.5 text-[15.5px] font-bold text-foreground">{title}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function ProgramarView() {
  const [estudiantes,   setEstudiantes]   = useState([])
  const [idsElegibles,  setIdsElegibles]  = useState([])
  const { data: aulas,      loading: loadingAulas  } = useApiCache('aulas',             aulasService.getAll,          120_000)
  const { data: profesores, loading: loadingProfes } = useApiCache('profesores_activos', profesoresService.getActivos, 120_000)
  const [loadingData,   setLoadingData]   = useState(true)
  const [loadErr,       setLoadErr]       = useState(null)

  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [backendErr, setBackendErr] = useState(null)
  const [success,    setSuccess]    = useState(null)
  const [toast,      setToast]      = useState(null)

  const loadData = useCallback(async () => {
    setLoadingData(true); setLoadErr(null)
    try {
      const [estList, ids] = await Promise.all([
        estudiantesService.getAll(),
        mesasService.getEstudiantesAsignados(),
      ])
      setEstudiantes(estList)
      setIdsElegibles(ids)
    } catch (err) {
      setLoadErr(err.detail ?? 'Error al cargar los datos. Verifica que el backend esté activo.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Derivados ──────────────────────────────────────────────────────────
  const estudiantesElegibles = useMemo(
    () => estudiantes.filter(e =>
      !idsElegibles.includes(e.id) &&
      (e.verificado_m1 || e.verificado_m2 || e.verificado_m3)
    ),
    [estudiantes, idsElegibles]
  )

  const estudianteObj = useMemo(
    () => estudiantes.find(e => e.id === Number(form.id_estudiante)) ?? null,
    [estudiantes, form.id_estudiante]
  )

  const aulaObj = useMemo(
    () => aulas.find(a => a.id === Number(form.id_aula)) ?? null,
    [aulas, form.id_aula]
  )

  const dia           = getDia(form.fecha)
  const esFinDeSemana = form.fecha && !isWeekday(form.fecha)
  const horaFins      = form.hora_inicio ? calcHoraFin(form.hora_inicio) : null

  const mensajeHoraFueraRango = useMemo(() => {
    if (!form.hora_inicio) return null
    if (horaEnMinutos(form.hora_inicio) < horaEnMinutos('08:00'))
      return 'La hora de inicio no puede ser antes de las 8:00 AM.'
    if (horaFins && horaEnMinutos(horaFins.m60) > horaEnMinutos('13:00'))
      return `La mesa (si es tipo 3) finalizaría a las ${horaFins.m60}, superando el límite de la 1:00 PM.`
    return null
  }, [form.hora_inicio, horaFins])

  const canSubmit =
    !saving && !esFinDeSemana && !mensajeHoraFueraRango &&
    form.id_estudiante && form.id_aula && form.fecha && form.hora_inicio

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), type === 'ok' ? 3500 : 6000)
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setBackendErr(null)
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true); setBackendErr(null)
    try {
      const mesa = await mesasService.create({
        id_estudiante: Number(form.id_estudiante),
        id_aula:       Number(form.id_aula),
        fecha:         form.fecha,
        hora_inicio:   form.hora_inicio,
      })
      setSuccess({ estudianteObj, aulaObj, dia, ...form, mesa })
      showToast('ok', 'Mesa de defensa programada exitosamente.')
    } catch (err) {
      const msg = err.detail ?? 'No se pudo programar la mesa.'
      setBackendErr(msg)
    } finally {
      setSaving(false)
    }
  }

  const nombreProfesor = (id) =>
    profesores.find(p => p.id === id)?.nombre_completo ?? '—'

  const optsEstudiantes = useMemo(() => estudiantesElegibles.map(e => ({
    value: e.id,
    label: e.nombre_completo,
    searchText: `${e.nombre_completo} ${e.cedula ?? ''}`,
  })), [estudiantesElegibles])

  const optsAulas = useMemo(() => aulas.map(a => ({
    value: a.id,
    label: `${a.nombre_aula} — ${a.ubicacion}`,
    tiene_equipos: a.tiene_equipos,
  })), [aulas])

  // ── Panel de éxito ────────────────────────────────────────────────────
  if (success) {
    const { mesa } = success
    const cells = [
      { label: 'Día',     value: `${success.dia}, ${success.fecha?.split('-').reverse().join('/')}`, brand: false },
      { label: 'Horario', value: mesa ? `${mesa.hora_inicio} – ${mesa.hora_fin}` : '—',             brand: true  },
      { label: 'Aula',    value: success.aulaObj?.nombre_aula ?? '—',                               brand: false },
      { label: 'Tipo',    value: mesa ? `Mesa ${mesa.tipo_mesa}` : '—',                             brand: false },
    ]
    return (
      <div className="success show max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card shadow-card p-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="suc-ring w-[90px] h-[90px] rounded-full bg-emerald-500/[0.12] border-2 border-emerald-500/[0.28] flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                className="text-emerald-500">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-foreground">Mesa programada</h2>
          <p className="mt-1 text-[14px] font-semibold text-foreground">{success.estudianteObj?.nombre_completo}</p>
          <div className="mt-[26px] w-full max-w-[430px] grid grid-cols-2 gap-px bg-border border border-border rounded-[16px] overflow-hidden">
            {cells.map(({ label, value, brand }) => (
              <div key={label} className="bg-card px-[18px] py-4 text-left">
                <div className="mb-[6px] text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
                <div className={`text-[14px] font-semibold leading-snug ${brand ? 'text-primary' : 'text-foreground'}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <button
              onClick={() => { setSuccess(null); setForm(EMPTY) }}
              className="flex items-center gap-2 rounded-[14px] border border-border px-5 py-[14px] text-[13px] font-semibold text-muted-foreground transition-all hover:bg-secondary/40 hover:text-foreground"
            >
              <CalendarPlusIcon size={15} /> Programar otra mesa
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isLoading = loadingData || loadingAulas || loadingProfes

  // ── Error cargando datos ──────────────────────────────────────────────
  if (!isLoading && loadErr) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card shadow-card p-12 flex flex-col items-center gap-4 text-muted-foreground">
          <AlertIcon size={32} />
          <p className="text-sm text-center">{loadErr}</p>
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors text-foreground">
            <RetryIcon /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  const Skel = () => <div className="h-10 rounded-xl bg-secondary animate-pulse" />

  // ── Formulario ────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="aura" />
      {/* Page head */}
      <div className="mb-7">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
          <CalendarPlusIcon size={14} /> Operaciones
        </p>
        <h1 className="text-[25px] font-bold tracking-tight text-foreground">Programar mesa de defensa</h1>
        <p className="text-[13.5px] text-muted-foreground mt-1.5 max-w-[520px] leading-relaxed">
          Agenda formalmente la defensa de un estudiante. El comité evaluador se hereda del expediente; aquí solo defines el aula, la fecha y la hora de inicio.
        </p>
      </div>

      {/* Banner — sin elegibles */}
      {!isLoading && estudiantesElegibles.length === 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-[18px] border border-amber-500/[0.24] bg-amber-500/[0.12] px-[18px] py-[15px] text-[13px] font-semibold text-amber-500">
          <WarnIcon size={18} className="shrink-0" />
          No hay estudiantes con solvencia verificada para programar.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Sección 1: Estudiante ──────────────────────────────────── */}
        <SectionCard icon={<GraduationCapIcon />} eyebrow="Sección 1" title="Estudiante">
          {/* Select */}
          {!((!isLoading) && estudiantesElegibles.length === 0) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Estudiante <span className="text-red-500">*</span>
              </label>
              {isLoading ? <Skel /> : (
                <SearchableSelect
                  options={optsEstudiantes}
                  value={form.id_estudiante}
                  onChange={v => set('id_estudiante', v)}
                  placeholder="Buscar por nombre o cédula…"
                />
              )}
            </div>
          )}

          {/* Título del proyecto (read-only) */}
          {estudianteObj?.titulo_proyecto && (
            <div className="mt-4 rounded-[14px] border border-border bg-secondary/40 px-[18px] py-4">
              <div className="mb-[10px] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <FileTextIcon /> Título del proyecto
              </div>
              <p className="text-[13px] leading-[1.55] italic text-foreground">{estudianteObj.titulo_proyecto}</p>
            </div>
          )}

          {/* Comité evaluador (read-only) */}
          {estudianteObj && (
            <div className="mt-4 rounded-[14px] border border-border bg-secondary/40 px-[18px] py-4">
              <div className="mb-[10px] flex items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <UsersIcon /> Comité evaluador
                </div>
                <span className="ml-auto flex items-center gap-1 text-[9.5px] font-semibold text-primary">
                  <LockIcon size={11} /> heredado del expediente
                </span>
              </div>
              <div className="grid grid-cols-3 gap-[14px]">
                {COMITE_ROLES.map(({ key, label, isTutor }) => {
                  const nombre   = nombreProfesor(estudianteObj[key])
                  const initials = getInitials(nombre)
                  return (
                    <div key={key}>
                      <div className="mb-[6px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-primary">{label}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-[30px] w-[30px] shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${isTutor ? 'bg-gradient-pill text-white' : 'bg-primary/[0.12] border border-primary/[0.22] text-primary'}`}>
                          {initials}
                        </span>
                        <span className="text-[11.5px] font-semibold text-foreground leading-snug truncate">{nombre}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Sección 2: Sala y Horario ─────────────────────────────── */}
        <SectionCard icon={<CalendarClockIcon />} eyebrow="Sección 2" title="Sala y horario">
          {/* Aula */}
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Aula <span className="text-red-500">*</span>
            </label>
            {isLoading ? <Skel /> : (
              <SearchableSelect
                options={optsAulas}
                value={form.id_aula}
                onChange={v => set('id_aula', v)}
                placeholder="Buscar aula…"
                renderOption={opt => (
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{opt.label}</span>
                    {opt.tiene_equipos
                      ? <span className="text-[9.5px] font-bold px-2 py-px rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">Con equipos</span>
                      : <span className="text-[9.5px] font-bold px-2 py-px rounded-full bg-secondary border border-border text-muted-foreground shrink-0">Sin equipos</span>
                    }
                  </span>
                )}
              />
            )}
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type="date" value={form.fecha}
                  onChange={e => set('fecha', e.target.value)}
                  min={hoy()} required
                  className={`${FIELD_INPUT} ${esFinDeSemana ? 'border-amber-400 ring-2 ring-amber-300/20' : ''}`}
                />
                {dia && (
                  <span className={`absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[11.5px] font-semibold
                    ${esFinDeSemana ? 'text-amber-500' : 'text-primary'}`}>
                    {dia}
                  </span>
                )}
              </div>
              {esFinDeSemana && (
                <p className="flex items-center gap-1.5 text-[11.5px] text-amber-600 dark:text-amber-400 font-medium"
                   style={{ animation: 'modalIn 120ms ease-out' }}>
                  <WarnIcon size={13} className="shrink-0" />
                  Solo se programan mesas de lunes a viernes.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Hora de inicio <span className="text-red-500">*</span>
              </label>
              <input type="time" value={form.hora_inicio}
                onChange={e => set('hora_inicio', e.target.value)}
                min="08:00" max="13:00" step="600" required
                className={`${FIELD_INPUT} ${mensajeHoraFueraRango ? 'border-red-400 ring-2 ring-red-300/20' : ''}`}
              />
              {mensajeHoraFueraRango ? (
                <p className="flex items-center gap-1.5 text-[11.5px] text-red-600 dark:text-red-400 font-medium"
                   style={{ animation: 'modalIn 120ms ease-out' }}>
                  <AlertIcon size={13} className="shrink-0" /> {mensajeHoraFueraRango}
                </p>
              ) : horaFins ? (
                <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <InfoIcon size={13} className="shrink-0" />
                  Mesa 1/2: hasta <span className="font-bold tabular-nums text-foreground">{horaFins.m40}</span>
                  {' · '}Mesa 3: <span className="font-bold tabular-nums text-primary">{horaFins.m60}</span>
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        {/* ── Error backend ────────────────────────────────────────────── */}
        {backendErr && (
          <div className="mb-4 flex items-start gap-3 rounded-[16px] border border-red-500/[0.22] bg-red-500/[0.12] px-[17px] py-[15px] text-red-500">
            <AlertIcon size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-85">No se pudo programar</p>
              <p className="text-[13px] leading-relaxed">{backendErr}</p>
            </div>
          </div>
        )}

        {/* ── Footer: preview + submit ──────────────────────────────────── */}
        <div className="flex items-center gap-[18px] mt-2">
          <div className={`flex flex-1 items-center gap-[11px] min-w-0 text-[13px] ${canSubmit ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}>
            <span className={`h-[34px] w-[34px] shrink-0 rounded-[11px] flex items-center justify-center transition-colors
              ${canSubmit ? 'bg-primary/[0.12] border border-primary/[0.22] text-primary' : 'bg-secondary border border-border text-muted-foreground'}`}>
              <CalendarCheckIcon />
            </span>
            <span className="truncate">
              {canSubmit
                ? `${dia} ${form.fecha.split('-').reverse().join('/')} · ${form.hora_inicio}${aulaObj ? ` · ${aulaObj.nombre_aula}` : ''}`
                : 'Completa todos los campos para programar'
              }
            </span>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="shrink-0 min-w-[215px] flex items-center justify-center gap-2.5 rounded-[14px] bg-gradient-pill px-6 py-[13px] text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(46,108,166,.7)] transition-all hover:-translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {saving ? <><Spinner size={15} /> Programando…</> : <><CalendarPlusIcon size={17} /> Programar mesa</>}
          </button>
        </div>
      </form>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-[18px] py-[14px]',
            'rounded-2xl text-[13px] font-semibold max-w-[360px] shadow-card',
            toast.type === 'ok'
              ? 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400',
          ].join(' ')}
          style={{ animation: 'modalIn 300ms ease-out' }}
        >
          {toast.type === 'ok'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 8 12"/></svg>
            : <AlertIcon size={18} className="shrink-0" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
