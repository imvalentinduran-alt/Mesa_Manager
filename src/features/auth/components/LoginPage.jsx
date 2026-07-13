import { useState, useEffect, useMemo } from 'react'
import { login, loginConsultor } from '@/features/auth'
import { clearSession } from '@/shared/lib/session'
import { useTheme } from '@/shared/lib/ThemeContext'
import {
  Lock, Eye, EyeOff, Loader2, ShieldCheck,
  ArrowRight, ArrowLeft,
  GraduationCap, IdCard, Landmark,
} from 'lucide-react'

function formatCedula(value, max = 10) {
  const d = value.replace(/\D/g, '').slice(0, max)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
}

/* ── Componente principal ──────────────────────────────────────────────── */
export default function LoginPage({ onSuccess }) {
  const { darkMode } = useTheme()
  const mode = darkMode ? 'dark' : 'light'

  const [view,          setView]          = useState('role')
  const [transitioning, setTransitioning] = useState(false)
  const [direction,     setDirection]     = useState('forward')

  const [cedula,       setCedula]       = useState('')
  const [contrasena,   setContrasena]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [cedulaError,  setCedulaError]  = useState(null)
  const [interrupted,  setInterrupted]  = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('upel_session_interrupted')) {
      setInterrupted(true)
      sessionStorage.removeItem('upel_session_interrupted')
    }
  }, [])

  const clearErrors = () => { setError(null); setCedulaError(null) }

  const viewOrder = { role: 0, admin: 1, student: 1 }

  const switchView = (next) => {
    setDirection(viewOrder[next] >= viewOrder[view] ? 'forward' : 'backward')
    setTransitioning(true)
    window.setTimeout(() => {
      setView(next)
      setCedula('')
      setContrasena('')
      clearErrors()
      setTransitioning(false)
    }, 190)
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    const digits = cedula.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 8) {
      setCedulaError('La cédula debe tener 7 u 8 dígitos.')
      return
    }
    clearErrors()
    setLoading(true)
    try {
      const session = await login(digits, contrasena)
      if (session.rol !== 'Jefa' && session.rol !== 'Coordinador') {
        clearSession()
        setError('Acceso denegado. Este apartado es exclusivo para personal administrativo autorizado.')
        return
      }
      onSuccess(session)
    } catch (err) {
      if (err.status) {
        setError(err.detail ?? 'Credenciales incorrectas.')
      } else {
        setError('No se pudo conectar con el servidor. Espera un momento e intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConsultorSubmit = async (e) => {
    e.preventDefault()
    const digits = cedula.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 10) {
      setCedulaError('La cédula debe tener entre 7 y 10 dígitos.')
      return
    }
    clearErrors()
    setLoading(true)
    try {
      const session = await loginConsultor(digits)
      onSuccess(session)
    } catch (err) {
      if (err.status === 404) {
        setError('No se encontró ningún registro para esta cédula en el sistema.')
      } else if (err.status) {
        setError(err.detail ?? 'Error al consultar. Verifica los datos ingresados.')
      } else {
        setError('No se pudo conectar con el servidor. Espera un momento e intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Partículas decorativas del panel de marca (estables entre renders)
  const dust = useMemo(() =>
    Array.from({ length: 9 }).map(() => ({
      left:  Math.round(Math.random() * 100),
      top:   Math.round(Math.random() * 100),
      delay: (Math.random() * 6).toFixed(2),
      dur:   (4 + Math.random() * 5).toFixed(2),
      size:  (2 + Math.random() * 2).toFixed(1),
    })),
  [])

  const viewCls = transitioning
    ? direction === 'forward' ? 'mm-view mm-out-f' : 'mm-view mm-out-b'
    : 'mm-view mm-in'

  return (
    <div className="mm" data-mode={mode}>

      {/* Banner sesión interrumpida */}
      {interrupted && (
        <div
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--mm-err-soft)', border: '1px solid var(--mm-err)',
            color: 'var(--mm-err)', padding: '12px 16px', borderRadius: 14,
            fontSize: 13, maxWidth: 380, width: 'calc(100% - 32px)',
            fontFamily: 'var(--font-sora)',
          }}
        >
          <span style={{ flex: 1, lineHeight: 1.5 }}>
            El servidor se reinició y tu sesión fue cerrada. Por favor iniciá sesión nuevamente.
          </span>
          <button
            onClick={() => setInterrupted(false)}
            style={{ flexShrink: 0, fontWeight: 700, color: 'var(--mm-err)', fontSize: 16, lineHeight: 1 }}
          >✕</button>
        </div>
      )}

      <div className="mm-stage">
        <div className="mm-card mm-fade">

          {/* Panel de marca */}
          <aside className="mm-brand">
            <div className="mm-brand-fx" aria-hidden="true">
              <span className="mm-orb a" />
              <span className="mm-orb b" />
              <span className="mm-orb c" />
              {dust.map((d, i) => (
                <span
                  key={i}
                  className="mm-dust"
                  style={{
                    left:              `${d.left}%`,
                    top:               `${d.top}%`,
                    width:             `${d.size}px`,
                    height:            `${d.size}px`,
                    animationDelay:    `${d.delay}s`,
                    animationDuration: `${d.dur}s`,
                  }}
                />
              ))}
            </div>

            <div className="mm-brand-top mm-rise">
              <img src="/logo_upel.png" alt="UPEL"
                onError={e => { e.currentTarget.style.display = 'none' }} />
              <div>
                <div className="mm-brand-k">UPEL · SIP</div>
                <div className="mm-brand-n">Mesa Manager</div>
              </div>
            </div>

            <div>
              <h2 className="mm-brand-h mm-rise" style={{ animationDelay: '.1s' }}>
                Acceso institucional
              </h2>
              <p className="mm-brand-sub mm-rise" style={{ animationDelay: '.2s' }}>
                Gestiona, programa y consulta defensas de maestría en un solo lugar.
              </p>
              <div className="mm-cert mm-rise" style={{ animationDelay: '.34s' }}>
                <ShieldCheck size={13} />
                Conexión cifrada · Ambiente oficial UPEL
              </div>
            </div>
          </aside>

          {/* Panel de formulario */}
          <main className="mm-main">
            <div className="mm-formbox">
              <div key={view} className={viewCls}>
                {view === 'role' && (
                  <RoleSelector onPick={switchView} />
                )}
                {view === 'admin' && (
                  <CredentialForm
                    cedula={cedula}
                    setCedula={v => { setCedula(v); setCedulaError(null) }}
                    contrasena={contrasena}
                    setContrasena={v => { setContrasena(v); setError(null) }}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    loading={loading}
                    error={error}
                    cedulaError={cedulaError}
                    onSubmit={handleAdminSubmit}
                    onBack={() => switchView('role')}
                  />
                )}
                {view === 'student' && (
                  <ConsultorForm
                    cedula={cedula}
                    setCedula={v => { setCedula(v); setCedulaError(null) }}
                    loading={loading}
                    error={error}
                    cedulaError={cedulaError}
                    onSubmit={handleConsultorSubmit}
                    onBack={() => switchView('role')}
                  />
                )}
              </div>
            </div>
            <div className="mm-foot">Sistema Oficial UPEL — Versión 1.0</div>
          </main>

        </div>
      </div>
    </div>
  )
}

/* ── RoleSelector ──────────────────────────────────────────────────────── */
function RoleSelector({ onPick }) {
  return (
    <div>
      <h1 className="mm-title">Bienvenido de nuevo</h1>
      <p className="mm-sub">Selecciona tu tipo de acceso para continuar.</p>
      <div style={{ marginTop: 28 }}>
        <button className="mm-role" onClick={() => onPick('admin')}>
          <span className="mm-role-ic"><Landmark size={18} /></span>
          <span>
            <div className="mm-role-t">Acceso Administrativo</div>
            <div className="mm-role-s">Coordinador / Jefe de Programa</div>
          </span>
          <span className="mm-role-arrow"><ArrowRight size={16} /></span>
        </button>
        <button className="mm-role" onClick={() => onPick('student')}>
          <span className="mm-role-ic"><GraduationCap size={18} /></span>
          <span>
            <div className="mm-role-t">Consulta Estudiantil / Profesor</div>
            <div className="mm-role-s">Acceso a tu agenda y notificaciones</div>
          </span>
          <span className="mm-role-arrow"><ArrowRight size={16} /></span>
        </button>
      </div>
    </div>
  )
}

/* ── CredentialForm ────────────────────────────────────────────────────── */
function CredentialForm({
  cedula, setCedula,
  contrasena, setContrasena,
  showPassword, setShowPassword,
  loading, error, cedulaError,
  onSubmit, onBack,
}) {
  const isRbacError  = error?.includes('denegado')
  const hasAuthError = Boolean(error)

  return (
    <form onSubmit={onSubmit} noValidate>
      <button type="button" className="mm-back" onClick={onBack}>
        <ArrowLeft size={13} /> Cambiar tipo de acceso
      </button>
      <h1 className="mm-title" style={{ textAlign: 'left' }}>Acceso Administrativo</h1>
      <p className="mm-sub" style={{ textAlign: 'left' }}>
        Ingresa tus credenciales institucionales para continuar.
      </p>

      <div style={{ display: 'grid', gap: 16, marginTop: 26 }}>
        <div>
          <label className="mm-label">Cédula de identidad</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><IdCard size={16} /></span>
            <input
              className={`mm-input${cedulaError || (hasAuthError && !isRbacError) ? ' err' : ''}`}
              type="text" inputMode="numeric" autoComplete="username"
              placeholder="V-12.345.678"
              value={cedula} disabled={loading} required
              onChange={e => setCedula(formatCedula(e.target.value, 8))}
            />
          </div>
          {cedulaError && <p className="mm-hint">{cedulaError}</p>}
        </div>

        <div>
          <label className="mm-label">Contraseña</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><Lock size={16} /></span>
            <input
              className={`mm-input${hasAuthError && !isRbacError ? ' err' : ''}`}
              type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              placeholder="••••••••"
              value={contrasena} disabled={loading} required
              onChange={e => setContrasena(e.target.value)}
            />
            <button type="button" className="mm-eye" tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          className="mm-btn"
          disabled={loading || !cedula || !contrasena}
        >
          {loading
            ? <span className="mm-spin" />
            : <><span>Ingresar</span><ArrowRight size={15} /></>}
        </button>
      </div>
    </form>
  )
}

/* ── ConsultorForm ─────────────────────────────────────────────────────── */
function ConsultorForm({
  cedula, setCedula,
  loading, error, cedulaError,
  onSubmit, onBack,
}) {
  const hasError = Boolean(cedulaError || error)

  return (
    <form onSubmit={onSubmit} noValidate>
      <button type="button" className="mm-back" onClick={onBack}>
        <ArrowLeft size={13} /> Cambiar tipo de acceso
      </button>
      <h1 className="mm-title" style={{ textAlign: 'left' }}>Consulta de Agenda</h1>
      <p className="mm-sub" style={{ textAlign: 'left' }}>
        Ingresa tu cédula para acceder a tus defensas asignadas.
      </p>

      <div style={{ display: 'grid', gap: 16, marginTop: 26 }}>
        <div>
          <label className="mm-label">Cédula de identidad</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><IdCard size={16} /></span>
            <input
              className={`mm-input${hasError ? ' err' : ''}`}
              type="text" inputMode="numeric" autoComplete="username"
              placeholder="V-1.234.567 ó C.C. 1.094.567.890"
              value={cedula} disabled={loading} required
              onChange={e => setCedula(formatCedula(e.target.value, 10))}
            />
          </div>
          {cedulaError && <p className="mm-hint">{cedulaError}</p>}
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          className="mm-btn"
          disabled={loading || !cedula}
        >
          {loading
            ? <span className="mm-spin" />
            : <><span>Ingresar</span><ArrowRight size={15} /></>}
        </button>
      </div>
    </form>
  )
}

/* ── ErrorBox ──────────────────────────────────────────────────────────── */
function ErrorBox({ msg }) {
  return (
    <div className="mm-err-box">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  )
}
