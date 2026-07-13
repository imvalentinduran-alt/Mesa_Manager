import { useState } from 'react'
import EstudiantesTab from '@/features/estudiantes/components/EstudiantesTab'
import ProfesoresTab  from '@/features/profesores/components/ProfesoresTab'
import AulasTab       from '@/features/aulas/components/AulasTab'

const TABS = [
  { id: 'estudiantes', label: 'Estudiantes', Component: EstudiantesTab },
  { id: 'profesores',  label: 'Profesores',  Component: ProfesoresTab  },
  { id: 'aulas',       label: 'Aulas',       Component: AulasTab       },
]

export default function GestionView({ session }) {
  const [activeTab, setActiveTab] = useState('estudiantes')
  const { Component } = TABS.find(t => t.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-end gap-1 px-6 pt-4 border-b border-slate-200 bg-white shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              font-body text-sm font-medium px-5 py-2.5 border-b-2 -mb-px transition-colors duration-150
              ${activeTab === id
                ? 'border-upel-navy text-upel-navy'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content — monta solo el tab activo */}
      <div className="flex-1 overflow-y-auto">
        <Component session={session} />
      </div>
    </div>
  )
}
