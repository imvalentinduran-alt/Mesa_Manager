import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { isAuthenticated, getSession } from '@/shared/lib/session'
import BootScreen from '@/features/auth/components/BootScreen'
import LoginPage  from '@/features/auth/components/LoginPage'
import AppLayout  from '@/shared/components/AppLayout'

const MAX_INTENTOS  = 90
const INTERVALO_MS  = 1000
const MIN_BOOT_MS   = 2600  // garantiza que el ensamblaje del logo termine antes de salir
const FADE_OUT_MS   = 650   // duración del transition .mm-boot.leave

async function esperarAPI(onProgreso) {
  for (let i = 1; i <= MAX_INTENTOS; i++) {
    try {
      const ok = await invoke('check_api_health')
      if (ok) return 'ok'
    } catch {}
    onProgreso(i)
    await new Promise(r => setTimeout(r, INTERVALO_MS))
  }
  return 'timeout'
}

function PantallaError() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white select-none">
      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444"
            strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <p className="font-display text-slate-800 font-bold text-base">
            Servicio no disponible
          </p>
          <p className="font-body text-slate-400 text-sm mt-1 leading-relaxed">
            No se pudo iniciar el servicio interno. Cierra la aplicación y vuelve a abrirla.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-upel-navy text-white font-body text-sm rounded-lg hover:bg-upel-navy-dark transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [apiEstado, setApiEstado] = useState('cargando')
  const [intento,   setIntento]   = useState(0)
  const [session,   setSession]   = useState(null)
  const [bootLeave, setBootLeave] = useState(false)

  useEffect(() => {
    const t0 = Date.now()
    esperarAPI(setIntento).then(resultado => {
      const remaining = Math.max(0, MIN_BOOT_MS - (Date.now() - t0))
      setTimeout(() => {
        // Activa fade-out (.mm-boot.leave); apiEstado sigue 'cargando' → BootScreen visible
        setBootLeave(true)
        setTimeout(() => {
          // Tras el fade-out, cambia estado → React desmonta BootScreen
          setApiEstado(resultado === 'ok' ? 'ok' : 'error')
          if (resultado === 'ok' && isAuthenticated()) setSession(getSession())
        }, FADE_OUT_MS)
      }, remaining)
    })
  }, [])

  // Guard correcto: solo apiEstado controla si BootScreen está montado.
  // Durante el fade-out (650ms) apiEstado sigue siendo 'cargando', así que
  // BootScreen permanece visible con la clase .leave sin necesitar || bootLeave.
  if (apiEstado === 'cargando') return <BootScreen intento={intento} leave={bootLeave} />
  if (apiEstado === 'error')    return <PantallaError />

  if (!session) return <LoginPage onSuccess={setSession} />
  return <AppLayout session={session} onLogout={() => setSession(null)} />
}
