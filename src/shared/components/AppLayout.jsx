import { useState, useCallback } from 'react'
import { logout } from '@/features/auth'
import Sidebar      from './Sidebar'
import Topbar       from './Topbar'
import { useInactivityLogout } from '@/shared/lib/useInactivityLogout'

// ── Vistas ────────────────────────────────────────────────────────────────────
import { DashboardView }  from '@/features/dashboard'

// Gestión
import EstudiantesView  from '@/features/estudiantes/components/EstudiantesView'
import ProfesoresView   from '@/features/profesores/components/ProfesoresView'
import AulasView        from '@/features/aulas/components/AulasView'
import GestionUsuarios  from '@/features/usuarios/components/GestionUsuarios'

// Registros
import RegistrosEstudiantesView from '@/features/registros/components/RegistrosEstudiantesView'
import RegistrosProfesoresView  from '@/features/registros/components/RegistrosProfesoresView'

// Operaciones
import ProgramarView  from '@/features/mesas/components/ProgramarView'
import VisualizarView from '@/features/mesas/components/VisualizarView'
import MonitoreoView  from '@/features/monitoreo/components/MonitoreoView'

// Historial
import { HistorialView } from '@/features/historial'

// Portales de consulta pública
import PortalEstudiante from '@/features/portales/components/PortalEstudiante'
import PortalProfesor   from '@/features/portales/components/PortalProfesor'

const VIEWS = {
  dashboard:   DashboardView,
  estudiantes: EstudiantesView,
  profesores:  ProfesoresView,
  aulas:       AulasView,
  usuarios:               GestionUsuarios,
  registros_estudiantes:  RegistrosEstudiantesView,
  registros_profesores:   RegistrosProfesoresView,
  programar:              ProgramarView,
  visualizar:  VisualizarView,
  monitoreo:   MonitoreoView,
  historial:   HistorialView,
}

export default function AppLayout({ session, onLogout }) {
  const [activeView,   setActiveView]   = useState('dashboard')
  const [showWarning,  setShowWarning]  = useState(false)

  // useCallback es necesario para que useInactivityLogout no reinicie los
  // timers en cada render (el hook incluye estas funciones en sus dependencias).
  const handleLogout = useCallback(async () => {
    await logout()
    onLogout()
  }, [onLogout])

  const handleWarning = useCallback(() => setShowWarning(true), [])

  useInactivityLogout({
    token:     session?.token,
    onWarning: handleWarning,
    onLogout:  handleLogout,
  })

  const warningBanner = showWarning && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                    bg-amber-50 border border-amber-300 text-amber-800
                    px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm w-full mx-4">
      <span className="flex-1">
        ⏱ Tu sesión expirará en <strong>2 minutos</strong> por inactividad.
      </span>
      <button
        onClick={() => setShowWarning(false)}
        className="shrink-0 text-amber-600 hover:text-amber-900 font-bold leading-none"
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  )

  // Consultores van a su portal sin Sidebar
  if (session?.tipo_consultor === 'Estudiante') {
    return (
      <>
        {warningBanner}
        <PortalEstudiante session={session} onLogout={handleLogout} />
      </>
    )
  }
  if (session?.tipo_consultor === 'Profesor') {
    return (
      <>
        {warningBanner}
        <PortalProfesor session={session} onLogout={handleLogout} />
      </>
    )
  }

  const CurrentView = VIEWS[activeView]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {warningBanner}

      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        session={session}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} />

        <main className="flex-1 overflow-y-auto p-6">
          <CurrentView session={session} onLogout={handleLogout} />
        </main>
      </div>
    </div>
  )
}
