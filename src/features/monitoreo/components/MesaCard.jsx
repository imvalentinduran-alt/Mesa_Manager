import { AulaIcon, ClockIcon, WarnIcon } from '@/shared/components/icons'

const PALETA = {
  En_Curso:         { bl: 'border-l-emerald-400', badge: 'text-emerald-400 bg-emerald-400/[0.12] border-emerald-400/[0.28]', dot: 'bg-emerald-400' },
  Programada:       { bl: 'border-l-primary',     badge: 'text-primary bg-primary/[0.12] border-primary/[0.22]',             dot: 'bg-primary'     },
  Aprobada:         { bl: 'border-l-emerald-500', badge: 'text-emerald-500 bg-emerald-500/[0.12] border-emerald-500/[0.22]', dot: 'bg-emerald-500' },
  Con_Correcciones: { bl: 'border-l-amber-500',   badge: 'text-amber-500 bg-amber-500/[0.12] border-amber-500/[0.24]',       dot: 'bg-amber-500'   },
  Reprobada:        { bl: 'border-l-red-500',     badge: 'text-red-500 bg-red-500/[0.12] border-red-500/[0.22]',             dot: 'bg-red-500'     },
  Suspendida:       { bl: 'border-l-muted-foreground/50', badge: 'text-muted-foreground bg-secondary/40 border-border',      dot: 'bg-muted-foreground/50' },
}

const ROLES_ASISTENCIA = [
  { key: 'estudiante', label: 'Est.' },
  { key: 'tutor',      label: 'Tut.' },
  { key: 'jurado1',    label: 'J1'   },
  { key: 'jurado2',    label: 'J2'   },
]

function esParticipante(mesa, cedula) {
  if (!cedula) return false
  return [mesa.cedula_estudiante, mesa.cedula_tutor, mesa.cedula_jurado1, mesa.cedula_jurado2]
    .includes(cedula)
}

export default function MesaCard({ mesa, onClick, cedulaSesion = null }) {
  const p            = PALETA[mesa.estado] ?? PALETA['Programada']
  const presentes    = Object.values(mesa.asistencia).filter(Boolean).length
  const participante = esParticipante(mesa, cedulaSesion)

  return (
    <button
      onClick={() => onClick(mesa)}
      className={`
        relative w-full text-left bg-secondary/40 border border-border border-l-4 ${p.bl}
        rounded-[13px] p-[13px_14px] transition-all duration-150
        hover:-translate-y-0.5 hover:shadow-card
        ${participante ? 'shadow-[0_0_0_2px_#caa33a]' : ''}
      `}
    >
      {/* mcd-top: code + overtime/min + status badge */}
      <div className="flex items-center gap-[8px]">
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground/70">
          {mesa.codigo}
        </span>

        {mesa.en_sobretiempo ? (
          <span className="inline-flex items-center gap-[4px] text-[10px] font-bold text-red-500 bg-red-500/[0.12] border border-red-500/[0.22] rounded-full px-[8px] py-[2px] animate-pulse">
            <WarnIcon className="h-[11px] w-[11px]" /> Tiempo
          </span>
        ) : mesa.estado === 'En_Curso' && mesa.minutos_restantes !== null ? (
          <span className="text-[10.5px] font-bold text-emerald-400 tabular-nums">
            {mesa.minutos_restantes} min
          </span>
        ) : null}

        <span className={`ml-auto inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[10px] font-semibold whitespace-nowrap ${p.badge}`}>
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current" />
          {mesa.estado.replace('_', ' ')}
        </span>
      </div>

      {/* mcd-name */}
      <div className="mt-[9px] flex items-center gap-[7px] text-[13px] font-semibold text-foreground min-w-0">
        <span className="truncate">{mesa.estudiante}</span>
        {participante && (
          <span className="shrink-0 rounded-full bg-[rgba(202,163,58,.14)] border border-[rgba(202,163,58,.34)] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[0.04em] text-[#caa33a]">
            Tu Mesa
          </span>
        )}
      </div>

      {/* mcd-tit */}
      {mesa.titulo && (
        <p className="mt-[3px] text-[11px] text-muted-foreground truncate" title={mesa.titulo}>
          {mesa.titulo}
        </p>
      )}

      {/* mcd-meta: aula + hora */}
      <div className="mt-[9px] flex items-center gap-[12px] text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-[5px] min-w-0">
          <AulaIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{mesa.aula}</span>
        </span>
        <span className="inline-flex items-center gap-[5px] shrink-0 tabular-nums">
          <ClockIcon className="h-3 w-3 shrink-0" />
          {mesa.hora_inicio}–{mesa.hora_fin}
        </span>
      </div>

      {/* mcd-att: attendance dots */}
      <div className="mt-[11px] pt-[10px] border-t border-border flex items-center gap-[9px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/70">
          Asistencia
        </span>
        <div className="flex gap-[5px]">
          {ROLES_ASISTENCIA.map(({ key, label }) => (
            <div key={key} title={label}
              className={`h-[9px] w-[9px] rounded-full transition-colors ${
                mesa.asistencia[key]
                  ? `${p.dot} border-transparent border-[1.5px]`
                  : 'border-[1.5px] border-border bg-transparent'
              }`}
            />
          ))}
        </div>
        <span className="ml-auto text-[11px] font-bold tabular-nums text-muted-foreground">
          {presentes}/4
        </span>
      </div>
    </button>
  )
}
