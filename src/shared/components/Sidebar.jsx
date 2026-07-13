import { useState, useEffect } from 'react'
import logoUpelBlue from '@recursos/icons/upel-blue.png'
import Modal from './Modal'

// ── Wrapper SVG ───────────────────────────────────────────────────────────────
function Ico({ className = 'h-4 w-4', children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ── Iconos SVG inline ─────────────────────────────────────────────────────────
const IconChevronLeft = ({ className }) => (
  <Ico className={className}><polyline points="15 18 9 12 15 6" /></Ico>
)
const IconChevronRight = ({ className }) => (
  <Ico className={className}><polyline points="9 18 15 12 9 6" /></Ico>
)
const IconChevronDown = ({ className }) => (
  <Ico className={className}><polyline points="6 9 12 15 18 9" /></Ico>
)
const IconDashboard = ({ className }) => (
  <Ico className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Ico>
)
const IconStudents = ({ className }) => (
  <Ico className={className}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </Ico>
)
const IconProfessors = ({ className }) => (
  <Ico className={className}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
  </Ico>
)
const IconRoom = ({ className }) => (
  <Ico className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Ico>
)
const IconCalendar = ({ className }) => (
  <Ico className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="12" y1="14" x2="12" y2="18" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </Ico>
)
const IconEye = ({ className }) => (
  <Ico className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Ico>
)
const IconActivity = ({ className }) => (
  <Ico className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Ico>
)
const IconUserCog = ({ className }) => (
  <Ico className={className}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h2" />
    <circle cx="18.5" cy="17.5" r="2.5" />
    <path d="M18.5 14v1M18.5 21v1M15.5 17.5h1M21 17.5h1M16.4 15.4l.7.7M20 19l.7.7M16.4 19.6l.7-.7M20 16l.7-.7" />
  </Ico>
)
const IconBook = ({ className }) => (
  <Ico className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Ico>
)
const IconHistory = ({ className }) => (
  <Ico className={className}>
    <polyline points="12 8 12 12 14 14" />
    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
  </Ico>
)
const IconLogOut = ({ className }) => (
  <Ico className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Ico>
)

// ── Grupos de navegación ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Principal', icon: IconDashboard },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { id: 'estudiantes', label: 'Estudiantes', icon: IconStudents },
      { id: 'profesores',  label: 'Profesores',  icon: IconProfessors, soloJefa: true },
      { id: 'aulas',       label: 'Aulas',       icon: IconRoom,       soloJefa: true },
      { id: 'usuarios',    label: 'Usuarios',    icon: IconUserCog,    soloJefa: true },
      { id: 'historial',   label: 'Historial',   icon: IconHistory,    soloJefa: true },
      {
        id: 'registros',
        label: 'Registros',
        icon: IconBook,
        children: [
          { id: 'registros_estudiantes', label: 'Estudiantes' },
          { id: 'registros_profesores',  label: 'Profesores', soloJefa: true },
        ],
      },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { id: 'programar',  label: 'Programar',  icon: IconCalendar },
      { id: 'visualizar', label: 'Visualizar', icon: IconEye      },
      { id: 'monitoreo',  label: 'Monitoreo',  icon: IconActivity },
    ],
  },
]

function findParentId(activeView) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children?.some(c => c.id === activeView)) return item.id
    }
  }
  return null
}

// ── Tooltip flotante (fixed, evita clipping por overflow del padre) ────────────
function Tooltip({ label, targetY }) {
  if (!label) return null
  return (
    <div
      style={{ top: targetY, left: 68 }}
      className="pointer-events-none fixed z-[9999] -translate-y-1/2 rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl"
    >
      {/* Flecha izquierda */}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95" />
      {label}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Sidebar({ activeView, onNavigate, session, onLogout }) {
  const esJefa = session?.rol === 'Jefa'

  const [collapsed,   setCollapsed]   = useState(false)
  const [openItem,    setOpenItem]    = useState(() => findParentId(activeView))
  const [showConfirm, setShowConfirm] = useState(false)
  const [tooltip,     setTooltip]     = useState(null) // { label, y }

  useEffect(() => {
    const parent = findParentId(activeView)
    if (parent) setOpenItem(parent)
  }, [activeView])

  useEffect(() => {
    if (collapsed) setOpenItem(null)
  }, [collapsed])

  const showTip = (e, label) => {
    if (!collapsed) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ label, y: rect.top + rect.height / 2 })
  }
  const hideTip = () => setTooltip(null)

  // Clases de botón de nav reutilizables
  const navBtn = (active, isCollapsed) =>
    [
      'flex w-full items-center rounded-full text-sm font-medium transition-all duration-150',
      isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2.5',
      active
        ? 'bg-gradient-pill text-white shadow-pill'
        : [
            'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            !isCollapsed ? 'hover:translate-x-[3px]' : '',
          ].join(' '),
    ].join(' ')

  const subNavBtn = (active) =>
    active
      ? 'flex w-full items-center gap-3 rounded-full bg-gradient-pill px-4 py-2 text-sm font-medium text-white shadow-pill'
      : 'flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-[3px] transition-all'

  return (
    <aside
      className={[
        'relative flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={[
          'relative flex items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-0 py-[18px]' : 'gap-3 px-5 py-5',
        ].join(' ')}
      >
        <span className={`grid shrink-0 place-items-center transition-all duration-300 ${collapsed ? 'h-9 w-9' : 'h-11 w-11'}`}>
          <img src={logoUpelBlue} alt="UPEL" className="logo-upel max-h-full max-w-full object-contain" />
        </span>

        {/* Texto — se oculta con overflow al colapsar */}
        <div
          className={[
            'overflow-hidden whitespace-nowrap transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
          ].join(' ')}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            UPEL · SIP
          </div>
          <div className="text-[15px] font-bold tracking-tight text-sidebar-foreground leading-tight">
            Mesa Manager
          </div>
        </div>

        {/* Botón colapsar/expandir */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className="absolute -right-3.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-md transition-all duration-200 hover:scale-110 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed
            ? <IconChevronRight className="h-3 w-3" />
            : <IconChevronLeft  className="h-3 w-3" />
          }
        </button>
      </div>

      {/* ── Navegación ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-3">

            {/* Título de grupo — solo visible expandido */}
            <div
              className={[
                'overflow-hidden transition-all duration-200',
                collapsed ? 'h-0 mb-0 opacity-0' : 'mb-1.5 h-auto opacity-100',
              ].join(' ')}
            >
              <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.title}
              </div>
            </div>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (item.soloJefa && !esJefa) return null
                const NavIcon = item.icon

                /* ── Ítem con submenú ── */
                if (item.children) {
                  const isExpanded    = !collapsed && openItem === item.id
                  const isChildActive = item.children.some(c => c.id === activeView)

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => !collapsed && setOpenItem(isExpanded ? null : item.id)}
                        onMouseEnter={(e) => showTip(e, item.label)}
                        onMouseLeave={hideTip}
                        className={[
                          'flex w-full items-center rounded-full text-sm font-medium transition-all duration-150',
                          collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2.5',
                          isChildActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        ].join(' ')}
                      >
                        <NavIcon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <IconChevronDown
                              className={[
                                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                                isExpanded ? 'rotate-180' : '',
                              ].join(' ')}
                            />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <ul className="mt-1 space-y-0.5 pl-4">
                          {item.children.map(child => {
                            if (child.soloJefa && !esJefa) return null
                            const childActive = activeView === child.id
                            return (
                              <li key={child.id}>
                                <button
                                  onClick={() => onNavigate(child.id)}
                                  className={subNavBtn(childActive)}
                                >
                                  <span
                                    className={[
                                      'h-1.5 w-1.5 shrink-0 rounded-full',
                                      childActive ? 'bg-white' : 'bg-muted-foreground/40',
                                    ].join(' ')}
                                  />
                                  <span className={childActive ? 'text-glow' : ''}>{child.label}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                }

                /* ── Ítem simple ── */
                const active = activeView === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      onMouseEnter={(e) => showTip(e, item.label)}
                      onMouseLeave={hideTip}
                      className={navBtn(active, collapsed)}
                    >
                      <NavIcon className={active ? 'h-4 w-4 text-glow' : 'h-4 w-4'} />
                      {!collapsed && (
                        <span className={active ? 'text-glow' : ''}>{item.label}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer — cerrar sesión ──────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border px-2 py-4">
        <button
          onClick={() => setShowConfirm(true)}
          onMouseEnter={(e) => showTip(e, 'Cerrar sesión')}
          onMouseLeave={hideTip}
          className={[
            'flex w-full items-center rounded-full text-sm text-sidebar-foreground/70 transition-colors hover:bg-red-50 hover:text-red-500',
            collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-4 py-2.5',
          ].join(' ')}
        >
          <IconLogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>

      {/* ── Modal de confirmación de logout ────────────────────────────────── */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Cerrar sesión"
        width="max-w-sm"
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          ¿Estás seguro de que deseas cerrar sesión?
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-secondary text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Sí, salir
          </button>
        </div>
      </Modal>

      {/* ── Tooltip flotante (renderizado dentro del aside con position:fixed) */}
      {collapsed && tooltip && (
        <Tooltip label={tooltip.label} targetY={tooltip.y} />
      )}
    </aside>
  )
}
