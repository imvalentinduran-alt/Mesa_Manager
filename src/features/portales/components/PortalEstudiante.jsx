import { useState, useEffect } from 'react'
import '@fontsource/sora/300.css'
import '@fontsource/sora/400.css'
import '@fontsource/sora/500.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'
import '@fontsource/sora/800.css'
import { portalesService } from '@/features/portales/services/portalesService'
import logoUpelBlue from '@recursos/icons/upel-blue.png'

// ── Helpers (sin cambios) ───────────────────────────────────────────────────
function diasRestantes(fechaLimiteStr) {
  if (!fechaLimiteStr) return null
  const [d, m, y] = fechaLimiteStr.split('/').map(Number)
  const limite = new Date(y, m - 1, d)
  const hoy    = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))
}

function getEstadoNodo(tipoMesa, mesas) {
  if (tipoMesa > 1) {
    const anterior = mesas.find(m => m.tipo_mesa === tipoMesa - 1)
    if (!anterior || anterior.estado !== 'Aprobada') return { tipo: 'bloqueado' }
  }
  const mesa = mesas.find(m => m.tipo_mesa === tipoMesa)
  if (!mesa) return { tipo: 'pendiente' }
  switch (mesa.estado) {
    case 'Programada':
    case 'En_Curso':         return { tipo: 'programado',   mesa }
    case 'Con_Correcciones': return { tipo: 'enCorreccion', mesa }
    case 'Aprobada':         return { tipo: 'completado',   mesa }
    case 'Reprobada':        return { tipo: 'reprobado',    mesa }
    case 'Suspendida':       return { tipo: 'suspendido',   mesa }
    default:                 return { tipo: 'pendiente' }
  }
}

function getNumeroProximaMesa(v1, v2, v3) {
  if (!v1) return 1
  if (!v2) return 2
  if (!v3) return 3
  return null
}

const TIPO_LABEL = ['', 'Mesa I', 'Mesa II', 'Mesa III']

// ── Helpers visuales ────────────────────────────────────────────────────────
function getIniciales(nombre) {
  if (!nombre) return '?'
  const p = nombre.replace(/^(?:Prof\.|Lic\.|Dr\.|Dra\.)\s*/i, '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

// ── CSS del portal ──────────────────────────────────────────────────────────
const PORTAL_CSS = `
[data-pe-root]{
  --bg:#0A0B0E;--card:#121419;--card-2:#16181F;--card-hov:#191C24;
  --border:rgba(255,255,255,.07);--border-2:rgba(255,255,255,.12);
  --text:#F2F3F5;--dim:#8A8F98;--mute:#5C616B;--brand-l:#67BAF4;
  --ok:#3DD68C;--ok-s:rgba(61,214,140,.12);--ok-b:rgba(61,214,140,.22);
  --gold:#E3B341;--gold-s:rgba(227,179,65,.12);--gold-b:rgba(227,179,65,.28);
  --err:#F2685C;--err-s:rgba(242,104,92,.12);--err-b:rgba(242,104,92,.24);
  --info-s:rgba(103,186,244,.12);--info-b:rgba(103,186,244,.22);
  --field:rgba(255,255,255,.03);--divider:#33373f;
  --shadow:0 18px 40px -18px rgba(0,0,0,.7);
  --topbar-bg:rgba(18,20,25,.82);--aura-op:.42;
  background:#0A0B0E;color:#F2F3F5
}
[data-pe-root][data-mode="light"]{
  --bg:#EEF1F6;--card:#FFFFFF;--card-2:#FFFFFF;--card-hov:#F6F8FB;
  --border:rgba(13,28,54,.09);--border-2:rgba(13,28,54,.16);
  --text:#10151E;--dim:#515A68;--mute:#6B7480;--brand-l:#1F5F9C;
  --ok:#0E8F5C;--ok-s:rgba(14,143,92,.15);--ok-b:rgba(14,143,92,.4);
  --gold:#8F6500;--gold-s:rgba(143,101,0,.14);--gold-b:rgba(143,101,0,.42);
  --err:#CE3A30;--err-s:rgba(206,58,48,.13);--err-b:rgba(206,58,48,.4);
  --info-s:rgba(31,95,156,.14);--info-b:rgba(31,95,156,.38);
  --field:rgba(13,28,54,.04);--divider:#C8CDD6;
  --shadow:0 16px 36px -20px rgba(20,40,80,.32);
  --topbar-bg:rgba(255,255,255,.8);--aura-op:.24;
  background:#EEF1F6;color:#10151E
}
@keyframes auraFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-70px,60px) scale(1.12)}66%{transform:translate(40px,-30px) scale(.95)}}
@keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(103,186,244,.55)}70%{box-shadow:0 0 0 10px rgba(103,186,244,0)}100%{box-shadow:0 0 0 0 rgba(103,186,244,0)}}
@keyframes rvIn{from{transform:translateY(18px)}to{transform:none}}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes peSpin{to{transform:rotate(360deg)}}
@keyframes growLine{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}

.pe-btn-theme{width:38px;height:38px;border-radius:11px;background:transparent;border:1px solid var(--border);color:var(--dim);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s cubic-bezier(.22,.61,.36,1)}
.pe-btn-theme:hover{border-color:rgba(227,179,65,.5);color:var(--gold)}
.pe-btn-exit{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:11px;background:transparent;border:1px solid var(--border);color:var(--dim);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .25s cubic-bezier(.22,.61,.36,1)}
.pe-btn-exit:hover{background:var(--err-s);color:var(--err);border-color:var(--err-b)}
.pe-btn-primary{display:inline-flex;align-items:center;gap:9px;padding:14px 24px;border-radius:14px;border:none;background:linear-gradient(120deg,#1E466B,#2E6CA6);color:#fff;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 12px 28px -10px rgba(46,108,166,.75);transition:all .28s cubic-bezier(.22,.61,.36,1)}
.pe-btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 38px -10px rgba(46,108,166,.9)}
.pe-expand-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:11px;background:var(--field);border:1px solid var(--border);color:var(--dim);font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s}
.pe-expand-btn:hover{background:var(--card-hov);color:var(--text)}
.pe-section-icon{transition:all .3s cubic-bezier(.22,.61,.36,1)}
.pe-section-icon:hover{background:linear-gradient(120deg,#1E466B,#2E6CA6)!important;color:#fff!important;border-color:transparent!important;transform:rotate(-6deg) scale(1.05)}
.pe-shimmer{background:linear-gradient(90deg,var(--card) 25%,var(--card-hov) 50%,var(--card) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite}
`

// ── Mapa de colores por tipo de nodo ───────────────────────────────────────
const NCOL = {
  completado:   { s:'var(--ok-s)',   b:'var(--ok-b)',   c:'var(--ok)'    },
  programado:   { s:'var(--info-s)', b:'var(--info-b)', c:'var(--brand-l)' },
  enCorreccion: { s:'var(--gold-s)', b:'var(--gold-b)', c:'var(--gold)'  },
  reprobado:    { s:'var(--err-s)',  b:'var(--err-b)',  c:'var(--err)'   },
  suspendido:   { s:'var(--err-s)',  b:'var(--err-b)',  c:'var(--err)'   },
  bloqueado:    { s:'var(--field)',  b:'var(--border)', c:'var(--mute)'  },
  pendiente:    { s:'var(--field)',  b:'var(--border)', c:'var(--dim)'   },
}

const PILL_LABEL = {
  completado:'Aprobada', enCorreccion:'Con correcciones',
  reprobado:'Reprobada', suspendido:'Suspendida',
  bloqueado:'Bloqueada', pendiente:'Por programar',
}

// ── Ícono del badge ─────────────────────────────────────────────────────────
function BadgeIcon({ tipo }) {
  const p = { width:20, height:20, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeLinecap:'round', strokeLinejoin:'round' }
  if (tipo === 'completado')
    return <svg {...p} strokeWidth="2.4"><path d="M20 6 9 17l-5-5"/></svg>
  if (tipo === 'programado')
    return <svg {...p} strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  if (tipo === 'enCorreccion')
    return <svg {...p} strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  if (tipo === 'reprobado')
    return <svg {...p} strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
  if (tipo === 'suspendido')
    return <svg {...p} strokeWidth="2"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
  if (tipo === 'bloqueado')
    return <svg {...p} strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  return <svg {...p} strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
}

// ── Nodo del stepper ────────────────────────────────────────────────────────
function NodoMesa({ tipoMesa, nodo, programa, isLast, superado }) {
  const { tipo, mesa } = nodo
  const [open, setOpen] = useState(false)

  const col       = NCOL[tipo]
  const enCurso   = mesa?.estado === 'En_Curso'
  const expandable= tipo === 'programado' && mesa?.estado === 'Programada'
  const isDim     = tipo === 'bloqueado' || tipo === 'pendiente'

  const dias    = tipo === 'enCorreccion' ? diasRestantes(mesa?.fecha_limite_correccion) : null
  const vencido = dias != null && dias < 0
  const urgente = dias != null && dias >= 0 && dias <= 3
  const pcol    = (vencido || urgente) ? NCOL.reprobado : NCOL.enCorreccion

  const plazoLabel = vencido
    ? `Plazo vencido el ${mesa?.fecha_limite_correccion}`
    : dias === 0
      ? `Vence hoy · ${mesa?.fecha_limite_correccion}`
      : `Quedan ${dias} día${dias === 1 ? '' : 's'} · vence ${mesa?.fecha_limite_correccion}`

  const pillLabel = tipo === 'programado' ? (enCurso ? 'En curso' : 'Programada') : PILL_LABEL[tipo]

  const comite = expandable ? [
    { rol:'Tutor · Principal',    nombre: mesa.tutor_principal,   ini: getIniciales(mesa.tutor_principal) },
    { rol:'Tutor · Suplente',     nombre: mesa.tutor_suplente,    ini: getIniciales(mesa.tutor_suplente) },
    { rol:'Jurado 1 · Principal', nombre: mesa.jurado1_principal, ini: getIniciales(mesa.jurado1_principal) },
    { rol:'Jurado 1 · Suplente',  nombre: mesa.jurado1_suplente,  ini: getIniciales(mesa.jurado1_suplente) },
    { rol:'Jurado 2 · Principal', nombre: mesa.jurado2_principal, ini: getIniciales(mesa.jurado2_principal) },
    { rol:'Jurado 2 · Suplente',  nombre: mesa.jurado2_suplente,  ini: getIniciales(mesa.jurado2_suplente) },
  ].filter(c => c.nombre) : []

  return (
    <div style={{display:'flex',gap:'16px',animation:'rvIn .5s cubic-bezier(.16,1,.3,1) both',animationDelay:`${0.06*tipoMesa}s`}}>

      {/* RAIL */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'48px',flexShrink:0}}>
        <div style={{
          width:'46px',height:'46px',borderRadius:'50%',flexShrink:0,
          display:'flex',alignItems:'center',justifyContent:'center',
          background:col.s, border:`1.5px solid ${col.b}`, color:col.c,
          boxShadow: tipo==='completado' ? '0 0 0 3px var(--ok-s)' : 'none',
          opacity: isDim ? 0.75 : 1, transition:'all .3s',
        }}>
          <BadgeIcon tipo={tipo} />
        </div>
        {!isLast && (
          <div style={{
            flex:'1 1 auto', width:'3px', minHeight:'34px', margin:'6px 0',
            borderRadius:'999px',
            background: superado ? 'linear-gradient(180deg,#1E8A5B,#3DD68C)' : 'var(--border-2)',
            transformOrigin:'top',
            animation:'growLine .5s ease both',
            animationDelay:`${0.06*tipoMesa+0.1}s`,
          }} />
        )}
      </div>

      {/* CARD */}
      <div style={{
        flex:1, minWidth:0,
        background: isDim ? 'var(--card-2)' : 'var(--card)',
        border:`1px solid ${(tipo==='programado'||tipo==='enCorreccion') ? col.b : 'var(--border)'}`,
        borderStyle: isDim ? 'dashed' : 'solid',
        borderRadius:'20px', padding:'18px 22px',
        marginBottom: !isLast ? '14px' : 0,
        boxShadow: (tipo==='programado'||tipo==='enCorreccion') ? '0 16px 38px -22px rgba(46,108,166,.5)' : 'none',
        opacity: isDim ? 0.82 : 1,
        transition:'all .3s cubic-bezier(.22,.61,.36,1)',
      }}>
        {/* Cabecera */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
          <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'.16em',color:'var(--mute)'}}>{TIPO_LABEL[tipoMesa]}</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'4px 11px',borderRadius:'999px',background:col.s,border:`1px solid ${col.b}`,color:col.c,fontSize:'11px',fontWeight:700,letterSpacing:'.04em'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:col.c,...(enCurso?{animation:'livePulse 1.8s ease-out infinite'}:{})}} />
            {pillLabel}
          </span>
        </div>

        {/* PROGRAMADO */}
        {tipo === 'programado' && mesa && (
          <div>
            <div style={{marginTop:'13px',display:'flex',alignItems:'center',gap:'18px',flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'13px',fontWeight:600,color:'var(--text)'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--brand-l)'}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {mesa.fecha}
              </span>
              <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'13px',color:'var(--dim)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                {mesa.hora_inicio}{mesa.hora_fin ? ` – ${mesa.hora_fin}` : ''}
              </span>
              <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'13px',color:'var(--dim)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {mesa.aula}
              </span>
            </div>

            {expandable && (
              <div>
                <button className="pe-expand-btn" style={{marginTop:'14px'}} onClick={() => setOpen(o => !o)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-12 0"/><circle cx="12" cy="11" r="4"/></svg>
                  {open ? 'Ocultar comité' : 'Ver comité completo'}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:'transform .25s',transform:open?'rotate(180deg)':'none'}}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {open && (
                  <div style={{marginTop:'14px',paddingTop:'16px',borderTop:'1px solid var(--border)',animation:'rvIn .35s ease both'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'var(--dim)',marginBottom:'13px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/></svg>
                      Programa · <strong style={{color:'var(--text)',fontWeight:600}}>{programa}</strong>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      {comite.map((c, i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'11px',padding:'10px 12px',borderRadius:'12px',background:'var(--field)',border:'1px solid var(--border)'}}>
                          <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#fff',background:'linear-gradient(135deg,#3a3f49,#23262d)'}}>{c.ini}</div>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:'13px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.nombre}</div>
                            <div style={{fontSize:'10.5px',color:'var(--mute)',fontWeight:600,letterSpacing:'.04em',marginTop:'1px'}}>{c.rol}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EN CORRECCIÓN */}
        {tipo === 'enCorreccion' && mesa && (
          <div style={{marginTop:'13px'}}>
            <p style={{margin:0,fontSize:'13.5px',color:'var(--dim)',lineHeight:1.55}}>Aprobada con correcciones. Debes consignar tu versión corregida dentro del plazo establecido.</p>
            {dias !== null && (
              <div style={{marginTop:'12px',display:'inline-flex',alignItems:'center',gap:'8px',padding:'9px 14px',borderRadius:'11px',background:pcol.s,border:`1px solid ${pcol.b}`,color:pcol.c,fontSize:'12.5px',fontWeight:700}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                {plazoLabel}
              </div>
            )}
          </div>
        )}

        {/* COMPLETADO */}
        {tipo === 'completado' && mesa && (
          <div style={{marginTop:'13px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'13px',color:'var(--dim)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Defendida el {mesa.fecha}
            </span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'6px 13px',borderRadius:'999px',background:'var(--ok-s)',border:'1px solid var(--ok-b)',color:'var(--ok)',fontSize:'12.5px',fontWeight:700}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              {mesa.veredicto ?? 'Aprobado'}
            </span>
          </div>
        )}

        {/* REPROBADO / SUSPENDIDO */}
        {(tipo === 'reprobado' || tipo === 'suspendido') && mesa && (
          <div style={{marginTop:'13px'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'13px',color:'var(--dim)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {mesa.fecha}
            </span>
            <p style={{margin:'9px 0 0',fontSize:'13px',color:'var(--dim)',lineHeight:1.55}}>
              {tipo === 'suspendido'
                ? 'La defensa fue suspendida. Comunícate con coordinación para los siguientes pasos.'
                : 'La defensa no aprobó. Comunícate con coordinación para reprogramar.'}
            </p>
          </div>
        )}

        {/* BLOQUEADO */}
        {tipo === 'bloqueado' && (
          <p style={{margin:'12px 0 0',fontSize:'13px',color:'var(--mute)',lineHeight:1.5}}>
            Se desbloquea al aprobar {TIPO_LABEL[tipoMesa - 1]}.
          </p>
        )}

        {/* PENDIENTE */}
        {tipo === 'pendiente' && (
          <p style={{margin:'12px 0 0',fontSize:'13px',color:'var(--dim)',lineHeight:1.5}}>
            Disponible para programar. Coordina tu fecha de defensa con tu tutor.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Portal principal ────────────────────────────────────────────────────────
export default function PortalEstudiante({ session, onLogout }) {
  const [datos,   setDatos]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [theme,   setTheme]   = useState(() => localStorage.getItem('pe-theme') ?? 'dark')

  const cargar = () => {
    setLoading(true)
    setError(null)
    portalesService.getEstudiante(session.cedula)
      .then(setDatos)
      .catch(e => setError(e.detail ?? 'No se pudo cargar la información.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    portalesService.getEstudiante(session.cedula)
      .then(setDatos)
      .catch(e => setError(e.detail ?? 'No se pudo cargar la información.'))
      .finally(() => setLoading(false))
  }, [session.cedula])

  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    localStorage.setItem('pe-theme', next)
    return next
  })

  const proximaMesa = datos
    ? getNumeroProximaMesa(datos.verificado_m1, datos.verificado_m2, datos.verificado_m3)
    : null

  const aprobadas = datos ? datos.mesas.filter(m => m.estado === 'Aprobada').length : 0
  const iniciales = datos ? getIniciales(datos.nombre) : '?'

  // Cómputo del banner
  let bannerKey = 'ok', bannerTag = '', bannerTitulo = '', bannerDesc = '', bannerMonto = null
  if (datos) {
    if (proximaMesa === null) {
      bannerTag   = 'SOLVENCIA TOTAL'
      bannerTitulo= 'Todas tus mesas están verificadas'
      bannerDesc  = 'Completaste el pago y la verificación de las tres defensas. No tienes pendientes administrativos. ¡Felicidades!'
    } else {
      const veri  = [datos.verificado_m1, datos.verificado_m2, datos.verificado_m3]
      const montos= [datos.monto_m1,      datos.monto_m2,      datos.monto_m3]
      bannerMonto = montos[proximaMesa - 1] ?? null
      if (veri[proximaMesa - 1]) {
        bannerTag   = 'SOLVENTE'
        bannerTitulo= `Pago verificado para ${TIPO_LABEL[proximaMesa]}`
        bannerDesc  = 'Tu pago está confirmado. Estás habilitado para presentar tu próxima defensa.'
      } else {
        bannerKey   = 'gold'
        bannerTag   = 'PAGO PENDIENTE'
        bannerTitulo= `Aún no verificamos tu pago para ${TIPO_LABEL[proximaMesa]}`
        bannerDesc  = 'Para habilitar tu próxima defensa, contacta a coordinación y regulariza tu solvencia antes de la fecha.'
      }
    }
  }
  const bcol = bannerKey === 'ok' ? NCOL.completado : NCOL.enCorreccion

  return (
    <>
      <style>{PORTAL_CSS}</style>
      <div
        data-pe-root=""
        data-mode={theme}
        style={{minHeight:'100vh',display:'flex',flexDirection:'column',fontFamily:"'Sora',system-ui,sans-serif"}}
      >

        {/* ══ TOPBAR ══════════════════════════════════════════════════════════ */}
        <header style={{height:'72px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',borderBottom:'1px solid var(--border)',background:'var(--topbar-bg)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:20}}>
          <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
            <span style={{display:'grid',placeItems:'center',width:'40px',height:'40px',flexShrink:0}}>
              <img src={logoUpelBlue} alt="UPEL" style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain',filter:theme==='dark'?'brightness(0) invert(1)':'none'}} />
            </span>
            <div style={{display:'flex',flexDirection:'column',gap:'3px',lineHeight:1}}>
              <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'.2em',color:'var(--brand-l)'}}>MESA MANAGER</span>
              <span style={{fontSize:'15px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>UPEL · Portal del Estudiante</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
            <button className="pe-btn-theme" onClick={toggleTheme} aria-label="Cambiar tema">
              {theme === 'dark'
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              }
            </button>
            <button className="pe-btn-exit" onClick={onLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
              Salir
            </button>
          </div>
        </header>

        {/* ══ BODY ════════════════════════════════════════════════════════════ */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          {/* Aura */}
          <div style={{position:'absolute',width:'560px',height:'560px',borderRadius:'50%',pointerEvents:'none',filter:'blur(80px)',opacity:'var(--aura-op)',zIndex:0,background:'radial-gradient(circle,var(--brand-l),transparent 68%)',top:'-200px',right:'8%',animation:'auraFloat 16s ease-in-out infinite'}} />

          <div style={{position:'relative',zIndex:1,maxWidth:'1000px',margin:'0 auto',padding:'26px 32px 64px'}}>

            {/* ── CARGANDO ──────────────────────────────────────────────── */}
            {loading && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
                  <div className="pe-shimmer" style={{width:'64px',height:'64px',borderRadius:'50%',flexShrink:0}} />
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div className="pe-shimmer" style={{width:'140px',height:'11px',borderRadius:'6px'}} />
                    <div className="pe-shimmer" style={{width:'280px',height:'22px',borderRadius:'8px',animationDelay:'.1s'}} />
                    <div className="pe-shimmer" style={{width:'220px',height:'12px',borderRadius:'6px',animationDelay:'.2s'}} />
                  </div>
                </div>
                <div className="pe-shimmer" style={{marginTop:'24px',height:'78px',borderRadius:'18px',animationDelay:'.15s'}} />
                <div style={{marginTop:'24px',display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div className="pe-shimmer" style={{height:'120px',borderRadius:'20px',animationDelay:'.25s'}} />
                  <div className="pe-shimmer" style={{height:'120px',borderRadius:'20px',animationDelay:'.35s'}} />
                </div>
                <div style={{marginTop:'18px',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',color:'var(--dim)',fontSize:'13px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'peSpin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg>
                  Cargando tu información…
                </div>
              </div>
            )}

            {/* ── ERROR ─────────────────────────────────────────────────── */}
            {error && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'70px 24px'}}>
                <div style={{width:'74px',height:'74px',borderRadius:'50%',background:'var(--err-s)',border:'1px solid var(--err-b)',color:'var(--err)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
                </div>
                <h2 style={{margin:'22px 0 8px',fontSize:'21px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>No pudimos cargar tu información</h2>
                <p style={{margin:0,fontSize:'13.5px',color:'var(--dim)',lineHeight:1.6,maxWidth:'380px'}}>Ocurrió un problema al consultar el servidor. Verifica tu conexión e inténtalo nuevamente.</p>
                <button className="pe-btn-primary" style={{marginTop:'24px'}} onClick={cargar}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
                  Reintentar
                </button>
              </div>
            )}

            {/* ── CARGADO ───────────────────────────────────────────────── */}
            {!loading && !error && datos && (
              <div>

                {/* Ficha del estudiante */}
                <div style={{display:'flex',alignItems:'center',gap:'20px',animation:'rvIn .55s cubic-bezier(.16,1,.3,1) both'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#0B2138 0%,#1E466B 52%,#2E6CA6 120%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:700,color:'#fff',flexShrink:0,boxShadow:'0 0 0 3px rgba(103,186,244,.18),0 10px 26px -10px rgba(46,108,166,.7)'}}>
                    {iniciales}
                  </div>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:'11px',fontWeight:700,letterSpacing:'.2em',color:'var(--brand-l)'}}>BIENVENIDA DE VUELTA</div>
                    <h2 style={{margin:'5px 0 5px',fontSize:'25px',fontWeight:700,letterSpacing:'-.02em',lineHeight:1.1,color:'var(--text)'}}>{datos.nombre}</h2>
                    <div style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'13px',color:'var(--dim)',flexWrap:'wrap'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/></svg>
                      {datos.maestria}
                      <span style={{color:'var(--divider)'}}>·</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)'}}><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h4M6 13h2M14 9h4M14 13h2"/></svg>
                      <span style={{fontVariantNumeric:'tabular-nums'}}>V-{session.cedula}</span>
                    </div>
                  </div>
                  {/* Defensas aprobadas */}
                  <div style={{marginLeft:'auto',display:'flex',flexDirection:'column',gap:'9px',padding:'14px 18px',borderRadius:'16px',background:'var(--info-s)',border:'1px solid var(--info-b)',minWidth:'190px',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'10px'}}>
                      <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'.14em',color:'var(--brand-l)'}}>DEFENSAS APROBADAS</span>
                      <span style={{fontSize:'18px',fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>
                        {aprobadas}<span style={{fontSize:'12px',color:'var(--dim)',fontWeight:600}}>/3</span>
                      </span>
                    </div>
                    <div style={{height:'7px',borderRadius:'999px',background:'var(--field)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.round(aprobadas/3*100)}%`,borderRadius:'999px',background:'linear-gradient(90deg,#1E8A5B,#3DD68C)',transition:'width .6s cubic-bezier(.16,1,.3,1)'}} />
                    </div>
                  </div>
                </div>

                {/* Título del proyecto */}
                {datos.titulo_proyecto && (
                  <div style={{marginTop:'16px',padding:'14px 18px',borderRadius:'14px',background:'var(--field)',border:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:'11px',animation:'rvIn .55s cubic-bezier(.16,1,.3,1) both',animationDelay:'.04s'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--mute)',flexShrink:0,marginTop:'2px'}}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.12em',color:'var(--mute)',marginBottom:'3px'}}>PROYECTO DE INVESTIGACIÓN</div>
                      <p style={{margin:0,fontSize:'14px',fontStyle:'italic',color:'var(--text)',lineHeight:1.5}}>«{datos.titulo_proyecto}»</p>
                    </div>
                  </div>
                )}

                {/* Banner de solvencia */}
                <div style={{marginTop:'20px',display:'flex',alignItems:'flex-start',gap:'15px',padding:'18px 22px',borderRadius:'18px',background:bcol.s,border:`1px solid ${bcol.b}`,animation:'rvIn .55s cubic-bezier(.16,1,.3,1) both',animationDelay:'.08s'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'12px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--card)',border:`1px solid ${bcol.b}`,color:bcol.c}}>
                    {bannerKey === 'ok'
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/></svg>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                      <span style={{display:'inline-flex',alignItems:'center',padding:'4px 11px',borderRadius:'999px',background:'var(--card)',border:`1px solid ${bcol.b}`,color:bcol.c,fontSize:'10px',fontWeight:700,letterSpacing:'.14em'}}>{bannerTag}</span>
                      {bannerMonto && (
                        <span style={{display:'inline-flex',alignItems:'center',padding:'4px 10px',borderRadius:'8px',background:'var(--field)',border:'1px solid var(--border)',color:'var(--dim)',fontSize:'11.5px',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{bannerMonto}</span>
                      )}
                    </div>
                    <div style={{marginTop:'6px',fontSize:'15px',fontWeight:700,color:'var(--text)'}}>{bannerTitulo}</div>
                    <p style={{margin:'4px 0 0',fontSize:'13px',color:'var(--dim)',lineHeight:1.55}}>{bannerDesc}</p>
                  </div>
                </div>

                {/* Cabecera de sección */}
                <div style={{display:'flex',alignItems:'center',gap:'13px',margin:'34px 0 20px'}}>
                  <div className="pe-section-icon" style={{width:'34px',height:'34px',borderRadius:'11px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div style={{lineHeight:1.15}}>
                    <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.18em',color:'var(--mute)'}}>TU PROGRESO</div>
                    <div style={{fontSize:'15.5px',fontWeight:700,color:'var(--text)'}}>Recorrido de defensas</div>
                  </div>
                </div>

                {/* Stepper */}
                <div>
                  {[1, 2, 3].map(t => (
                    <NodoMesa
                      key={t}
                      tipoMesa={t}
                      nodo={getEstadoNodo(t, datos.mesas)}
                      programa={datos.maestria}
                      isLast={t === 3}
                      superado={datos.mesas.some(m => m.tipo_mesa === t && m.estado === 'Aprobada')}
                    />
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
