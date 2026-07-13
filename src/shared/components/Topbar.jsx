import { useState, useEffect } from 'react'
import { apiFetch } from '@/shared/lib/api'
import ThemeToggle from './ThemeToggle'

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0][0]
  const ultima  = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

export default function Topbar({ session }) {
  const [maestria, setMaestria] = useState(null)

  useEffect(() => {
    if (session?.rol !== 'Coordinador' || !session.maestria_id) return
    apiFetch('/api/maestrias/')
      .then(list => {
        const m = list.find(x => x.id === session.maestria_id)
        if (m) setMaestria(m.nombre)
      })
      .catch(() => {})
  }, [session?.maestria_id, session?.rol])

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">

      <div className="flex-1">
        {session?.rol === 'Jefa' ? (
          <span className="text-xs text-muted-foreground">Vista general</span>
        ) : maestria ? (
          <span className="text-xs text-muted-foreground">
            Maestría: <span className="font-semibold text-foreground">{maestria}</span>
          </span>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-3 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
            {iniciales(session?.nombre)}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              {session?.nombre ?? 'Usuario'}
              <span className="rounded-md bg-gradient-pill px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
                {session?.rol?.toUpperCase() ?? 'ROL'}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {session?.cedula ? `V-${session.cedula}` : ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
