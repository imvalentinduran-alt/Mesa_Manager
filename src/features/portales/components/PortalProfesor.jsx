import { useState, useEffect, useMemo } from 'react'
import '@fontsource/sora/300.css'
import '@fontsource/sora/400.css'
import '@fontsource/sora/500.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'
import '@fontsource/sora/800.css'
import { portalesService } from '@/features/portales/services/portalesService'
import { mesasService } from '@/features/mesas/services/mesasService'
import {
  Moon, Sun, LogOut, Clock, MapPin, Play,
  Users, CalendarClock, Lock, History, BookOpen,
  X, Check, TriangleAlert, RotateCw, Loader2, CalendarCheck2,
} from 'lucide-react'
import logoUpelBlue from '@recursos/icons/upel-blue.png'

// ── Helpers (sin cambios) ───────────────────────────────────────────────────
function esFechaHoy(fechaDDMMYYYY) {
  if (!fechaDDMMYYYY) return false
  const [d, m, y] = fechaDDMMYYYY.split('/').map(Number)
  const hoy = new Date()
  return hoy.getFullYear() === y && hoy.getMonth() + 1 === m && hoy.getDate() === d
}

const TIPO_MESA_LABEL = { 1: 'Mesa I', 2: 'Mesa II', 3: 'Mesa III' }

const MESES_ABR = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function parseFecha(f) {
  if (!f) return { dia: '--', mes: '---' }
  const parts = f.split('/')
  const d = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  return { dia: d, mes: MESES_ABR[m - 1] ?? '---' }
}

function getIniciales(nombre) {
  if (!nombre) return '?'
  const p = nombre.replace(/^Prof\.\s*/i, '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

// ── Tokens de veredicto para pantalla ──────────────────────────────────────
const VTOK = {
  Aprobada:         { c:'var(--ok)',   s:'var(--ok-s)',   b:'var(--ok-b)',   bar:'linear-gradient(120deg,#1E8A5B,#3DD68C)', label:'Aprobado',         icon:'ok'   },
  Con_Correcciones: { c:'var(--gold)', s:'var(--gold-s)', b:'var(--gold-b)', bar:'linear-gradient(120deg,#B8860B,#E3B341)', label:'Con correcciones',  icon:'gold' },
  Reprobada:        { c:'var(--err)',  s:'var(--err-s)',  b:'var(--err-b)',  bar:'linear-gradient(120deg,#B23B33,#F2685C)', label:'Reprobado',         icon:'err'  },
  Suspendida:       { c:'var(--err)',  s:'var(--err-s)',  b:'var(--err-b)',  bar:'linear-gradient(120deg,#B23B33,#F2685C)', label:'Suspendido',        icon:'err'  },
}
function getVtok(estado) {
  return VTOK[estado] ?? { c:'var(--mute)', s:'var(--field)', b:'var(--border)', bar:'var(--border)', label: estado ?? '', icon:'none' }
}

// ── Íconos SVG inline (paths del prototipo para fidelidad exacta) ──────────
function IcoGavel({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.5 12.5-8 8a2.1 2.1 0 0 1-3-3l8-8"/>
      <path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>
    </svg>
  )
}
function IcoCircleCheck({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>
    </svg>
  )
}
function IcoPencil({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  )
}
function IcoCircleX({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
    </svg>
  )
}
function IcoUsers({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 21a8 8 0 0 0-12 0"/><circle cx="12" cy="11" r="4"/>
      <circle cx="12" cy="11" r="9" opacity=".25"/>
    </svg>
  )
}
function IcoIdCard({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <path d="M6 9h4M6 13h2M14 9h4M14 13h2"/>
    </svg>
  )
}

function VeredictoIcon({ tipo, size = 22, color }) {
  if (tipo === 'ok')   return <IcoCircleCheck size={size} color={color} />
  if (tipo === 'gold') return <IcoPencil      size={size} color={color} />
  if (tipo === 'err')  return <IcoCircleX     size={size} color={color} />
  return null
}

// ── CSS del portal (variables de tema + keyframes) ─────────────────────────
const PORTAL_CSS = `
[data-portal-root]{
  --bg:#0A0B0E;--text:#F2F3F5;--card:#121419;--card-2:#16181F;--card-hov:#191C24;
  --border:rgba(255,255,255,.07);--border-2:rgba(255,255,255,.12);
  --dim:#8A8F98;--mute:#5C616B;--brand-l:#67BAF4;
  --ok:#3DD68C;--ok-s:rgba(61,214,140,.12);--ok-b:rgba(61,214,140,.22);
  --gold:#E3B341;--gold-s:rgba(227,179,65,.12);--gold-b:rgba(227,179,65,.28);
  --err:#F2685C;--err-s:rgba(242,104,92,.12);--err-b:rgba(242,104,92,.24);
  --info-s:rgba(103,186,244,.12);--info-b:rgba(103,186,244,.22);
  --field:rgba(255,255,255,.03);--divider:#33373f;
  --shadow:0 18px 40px -18px rgba(0,0,0,.7);
  --topbar-bg:rgba(18,20,25,.82);--scrim:rgba(6,7,10,.72);--aura-op:.42;
  background:#0A0B0E;color:#F2F3F5;
}
[data-portal-root][data-mode="light"]{
  --bg:#EEF1F6;--text:#10151E;--card:#FFFFFF;--card-2:#FFFFFF;--card-hov:#F6F8FB;
  --border:rgba(13,28,54,.09);--border-2:rgba(13,28,54,.16);
  --dim:#515A68;--mute:#6B7480;--brand-l:#2E6CA6;
  --ok:#169F6B;--ok-s:rgba(22,159,107,.1);--ok-b:rgba(22,159,107,.2);
  --gold:#B8860B;--gold-s:rgba(184,134,11,.1);--gold-b:rgba(184,134,11,.26);
  --err:#D6453B;--err-s:rgba(214,69,59,.1);--err-b:rgba(214,69,59,.22);
  --info-s:rgba(46,108,166,.1);--info-b:rgba(46,108,166,.2);
  --field:rgba(13,28,54,.02);--divider:#C8CDD6;
  --shadow:0 16px 36px -20px rgba(20,40,80,.32);
  --topbar-bg:rgba(255,255,255,.8);--scrim:rgba(20,30,55,.4);--aura-op:.24;
  background:#EEF1F6;color:#10151E;
}
@keyframes auraFloat{
  0%,100%{transform:translate(0,0) scale(1)}
  33%{transform:translate(-70px,60px) scale(1.12)}
  66%{transform:translate(40px,-30px) scale(.95)}
}
@keyframes livePulse{
  0%{box-shadow:0 0 0 0 rgba(103,186,244,.55)}
  70%{box-shadow:0 0 0 10px rgba(103,186,244,0)}
  100%{box-shadow:0 0 0 0 rgba(103,186,244,0)}
}
@keyframes rvIn{from{transform:translateY(18px)}to{transform:none}}
@keyframes scrimIn{from{opacity:0}to{opacity:1}}
@keyframes modalIn{
  from{opacity:0;transform:translateY(22px) scale(.97)}
  to{opacity:1;transform:none}
}
@keyframes shimmer{
  0%{background-position:100% 0}100%{background-position:-100% 0}
}
@keyframes ppSpin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
[data-portal-root] *{box-sizing:border-box}
[data-portal-root] button{font-family:'Sora',system-ui,sans-serif}

[data-portal-root] .pp-btn-icon{
  width:38px;height:38px;min-width:40px;min-height:40px;border-radius:11px;
  background:transparent;border:1px solid var(--border);color:var(--dim);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  position:relative;transition:all .25s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-btn-icon:hover{border-color:rgba(227,179,65,.5);color:var(--gold)}

[data-portal-root] .pp-btn-exit{
  display:flex;align-items:center;gap:8px;padding:9px 14px;min-height:40px;
  border-radius:11px;background:transparent;border:1px solid var(--border);
  color:var(--dim);font-size:13px;font-weight:600;cursor:pointer;
  transition:all .25s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-btn-exit:hover{
  background:var(--err-s);color:var(--err);border-color:rgba(242,104,92,.4);
}
[data-portal-root][data-mode="light"] .pp-btn-exit:hover{
  border-color:rgba(214,69,59,.4);
}

[data-portal-root] .pp-btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  border-radius:14px;border:none;min-height:40px;
  background:linear-gradient(120deg,#1E466B,#2E6CA6);color:#fff;
  font-weight:600;cursor:pointer;
  box-shadow:0 12px 28px -10px rgba(46,108,166,.75);
  transition:all .28s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-btn-primary:hover{
  transform:translateY(-2px);box-shadow:0 18px 38px -10px rgba(46,108,166,.9);
}
[data-portal-root] .pp-btn-primary:disabled{
  background:var(--field);color:var(--mute);cursor:not-allowed;
  box-shadow:none;transform:none;
}

[data-portal-root] .pp-section-icon{
  width:34px;height:34px;flex-shrink:0;border-radius:11px;
  background:var(--info-s);border:1px solid var(--info-b);color:var(--brand-l);
  display:flex;align-items:center;justify-content:center;cursor:default;
  transition:all .3s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-section-icon:hover{
  background:linear-gradient(120deg,#1E466B,#2E6CA6);color:#fff;
  border-color:transparent;transform:rotate(-6deg) scale(1.05);
}

[data-portal-root] .pp-card-prox{
  background:var(--card);border:1px solid var(--border);
  border-radius:18px;padding:20px 22px;
  transition:all .3s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-card-prox:hover{
  border-color:var(--border-2);transform:translateY(-2px);box-shadow:var(--shadow);
}

[data-portal-root] .pp-row-hist{
  display:flex;align-items:center;gap:16px;
  background:var(--card-2);border:1px solid var(--border);
  border-radius:16px;padding:15px 20px;
  transition:all .25s cubic-bezier(.22,.61,.36,1);
}
[data-portal-root] .pp-row-hist:hover{
  background:var(--card-hov);transform:translateX(3px);
}

[data-portal-root] .pp-modal-close{
  width:34px;height:34px;min-width:34px;min-height:34px;border-radius:10px;
  background:transparent;border:1px solid var(--border);color:var(--dim);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  cursor:pointer;transition:all .2s;
}
[data-portal-root] .pp-modal-close:hover{background:var(--field);color:var(--text)}

[data-portal-root] .pp-toggle-row{
  display:flex;align-items:center;gap:13px;width:100%;
  border-radius:14px;cursor:pointer;text-align:left;min-height:40px;
  transition:all .2s cubic-bezier(.22,.61,.36,1);
}

[data-portal-root] .pp-shimmer{
  background:linear-gradient(90deg,var(--card) 25%,var(--card-hov) 50%,var(--card) 75%);
  background-size:200% 100%;animation:shimmer 1.4s ease infinite;
}
[data-portal-root] .pp-spin{animation:ppSpin 1s linear infinite}

[data-portal-root] .pp-btn-cancel{
  padding:13px 20px;border-radius:13px;background:transparent;
  border:1px solid var(--border);color:var(--dim);
  font-size:13.5px;font-weight:600;cursor:pointer;min-height:40px;
  transition:all .2s;
}
[data-portal-root] .pp-btn-cancel:hover{background:var(--field);color:var(--text)}
`

// ── Roles del QuorumModal (sin cambios) ────────────────────────────────────
const ROLES_QUORUM = [
  { key:'tutor',   label:'Tutor',    principal:'tutor_principal',   suplente:'tutor_suplente',   cPrincipal:'cedula_tutor_principal',   cSuplente:'cedula_tutor_suplente',   idPrincipal:'id_tutor_principal',   idSuplente:'id_tutor_suplente'   },
  { key:'jurado1', label:'Jurado 1', principal:'jurado1_principal', suplente:'jurado1_suplente', cPrincipal:'cedula_jurado1_principal', cSuplente:'cedula_jurado1_suplente', idPrincipal:'id_jurado1_principal', idSuplente:'id_jurado1_suplente' },
  { key:'jurado2', label:'Jurado 2', principal:'jurado2_principal', suplente:'jurado2_suplente', cPrincipal:'cedula_jurado2_principal', cSuplente:'cedula_jurado2_suplente', idPrincipal:'id_jurado2_principal', idSuplente:'id_jurado2_suplente' },
]

// ── QuorumModal — lógica intacta, markup rediseñado ────────────────────────
function QuorumModal({ mesaId, cedula, onClose, onSuccess }) {
  const [mesaCompleta, setMesaCompleta] = useState(null)
  const [loadingMesa,  setLoadingMesa]  = useState(true)
  const [asistencia,   setAsistencia]   = useState({ tutor:'principal', jurado1:'principal', jurado2:'principal' })
  const [asistEst,     setAsistEst]     = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    if (!mesaId) return
    mesasService.getAll()
      .then(list => setMesaCompleta(list.find(m => m.id === mesaId) ?? null))
      .finally(() => setLoadingMesa(false))
  }, [mesaId])

  const resolverIdRol = (rol, estado) => {
    if (!mesaCompleta) return null
    if (estado === 'principal') return mesaCompleta[rol.idPrincipal]
    if (estado === 'suplente')  return mesaCompleta[rol.idSuplente]
    return null
  }

  const idsPorRol = useMemo(() => ({
    tutor:   resolverIdRol(ROLES_QUORUM[0], asistencia.tutor),
    jurado1: resolverIdRol(ROLES_QUORUM[1], asistencia.jurado1),
    jurado2: resolverIdRol(ROLES_QUORUM[2], asistencia.jurado2),
  }), [mesaCompleta, asistencia])

  const idProfesorSesion = useMemo(() => {
    if (!mesaCompleta || !cedula) return null
    const campos = ROLES_QUORUM.flatMap(r => [
      [r.cPrincipal, r.idPrincipal],
      [r.cSuplente,  r.idSuplente],
    ])
    const par = campos.find(([ced]) => mesaCompleta[ced] === cedula)
    return par ? mesaCompleta[par[1]] : null
  }, [mesaCompleta, cedula])

  const presentes = Object.values(idsPorRol).filter(id => id !== null).length
  const quorumOk  = presentes >= 2 && idProfesorSesion !== null

  const handleSubmit = async () => {
    setSaving(true); setError(null)
    try {
      await mesasService.registrarQuorum(mesaId, {
        tutor_efectivo_id:        idsPorRol.tutor,
        jurado1_efectivo_id:      idsPorRol.jurado1,
        jurado2_efectivo_id:      idsPorRol.jurado2,
        asistencia_estudiante:    asistEst,
        iniciada_por_profesor_id: idProfesorSesion,
      })
      onSuccess(presentes + (asistEst ? 1 : 0))
      onClose()
    } catch (e) {
      setError(e.detail ?? 'No se pudo iniciar la mesa.')
    } finally { setSaving(false) }
  }

  const ini = (nombre = '') => {
    const p = nombre.replace(/^Prof\.\s*/i, '').trim().split(/\s+/)
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
  }

  return (
    <div
      onClick={onClose}
      style={{position:'fixed',inset:0,zIndex:60,background:'var(--scrim)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px',animation:'scrimIn .2s ease both'}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{width:'560px',maxWidth:'100%',maxHeight:'88vh',display:'flex',flexDirection:'column',borderRadius:'22px',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border-2)',boxShadow:'0 40px 100px -30px rgba(0,0,0,.7)',animation:'modalIn .32s cubic-bezier(.16,1,.3,1) both'}}
      >
        {/* Header */}
        <div style={{padding:'22px 26px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:'14px'}}>
          <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <IcoUsers size={20} />
          </div>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:'18px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>Asistencia de la mesa</h3>
            <p style={{margin:'4px 0 0',fontSize:'12.5px',color:'var(--dim)',lineHeight:1.5}}>
              Marca quién está presente. Para dar inicio se requieren <strong style={{color:'var(--text)'}}>mínimo 2 profesores</strong> y la presencia del <strong style={{color:'var(--text)'}}>estudiante</strong>.
            </p>
          </div>
          <button className="pp-modal-close" onClick={onClose}><X size={17} /></button>
        </div>

        {/* Body */}
        <div style={{padding:'14px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px',flex:1}}>
          {loadingMesa ? (
            [0,1,2,3].map(i => (
              <div key={i} className="pp-shimmer" style={{height:'64px',borderRadius:'14px'}} />
            ))
          ) : !mesaCompleta ? (
            <p style={{textAlign:'center',padding:'32px 0',color:'var(--err)',fontSize:'13px'}}>No se pudo cargar la mesa.</p>
          ) : (
            <>
              <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.16em',color:'var(--mute)',padding:'6px 8px 2px'}}>JURADO Y TUTORÍA</div>

              {ROLES_QUORUM.map(rol => {
                const nPrincipal = mesaCompleta[rol.principal] ?? `${rol.label} Principal`
                const nSuplente  = mesaCompleta[rol.suplente]  ?? `${rol.label} Suplente`
                const val = asistencia[rol.key]
                return [
                  { opt:'principal', nombre: nPrincipal, sublabel:`${rol.label} Principal` },
                  { opt:'suplente',  nombre: nSuplente,  sublabel:`${rol.label} Suplente`  },
                  { opt:'ausente',   nombre: 'Ausente',  sublabel: null                    },
                ].map(({ opt, nombre, sublabel }) => {
                  const activo = val === opt
                  const initials = opt !== 'ausente' ? ini(nombre) : '—'
                  return (
                    <button
                      key={`${rol.key}-${opt}`}
                      className="pp-toggle-row"
                      onClick={() => setAsistencia(a => ({ ...a, [rol.key]: opt }))}
                      style={{padding:'10px 14px',background:activo?'var(--info-s)':'var(--field)',border:`1px solid ${activo?'var(--info-b)':'var(--border)'}`}}
                    >
                      <div style={{width:'38px',height:'38px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',background:activo&&opt!=='ausente'?'linear-gradient(135deg,#1E466B,#2E6CA6)':'linear-gradient(135deg,#3a3f49,#23262d)'}}>
                        {initials}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'13.5px',fontWeight:600,color:'var(--text)'}}>
                          {opt === 'ausente' ? 'Ausente' : nombre}
                        </div>
                        {sublabel && <div style={{fontSize:'11px',color:'var(--dim)',marginTop:'2px'}}>{sublabel}</div>}
                      </div>
                      <div style={{width:'22px',height:'22px',borderRadius:'7px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',background:activo?'linear-gradient(120deg,#1E466B,#2E6CA6)':'transparent',border:`1.5px solid ${activo?'transparent':'var(--border-2)'}`}}>
                        {activo && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })
              })}

              <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.16em',color:'var(--mute)',padding:'12px 8px 2px'}}>ESTUDIANTE</div>

              {[
                { v:true,  nombre: mesaCompleta.nombre_estudiante ?? 'Estudiante' },
                { v:false, nombre: 'Ausente' },
              ].map(({ v, nombre }) => {
                const activo = asistEst === v
                return (
                  <button
                    key={String(v)}
                    className="pp-toggle-row"
                    onClick={() => setAsistEst(v)}
                    style={{padding:'12px 14px',background:activo?'var(--info-s)':'var(--field)',border:`1px solid ${activo?'var(--info-b)':'var(--border)'}`}}
                  >
                    <div style={{width:'40px',height:'40px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',background:activo&&v?'linear-gradient(135deg,#1E466B,#2E6CA6)':'linear-gradient(135deg,#3a3f49,#23262d)'}}>
                      {v ? ini(mesaCompleta.nombre_estudiante ?? '') : '—'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'14px',fontWeight:600,color:'var(--text)'}}>{nombre}</div>
                      <div style={{fontSize:'11.5px',color:'var(--dim)',marginTop:'2px'}}>Sustentante</div>
                    </div>
                    <div style={{width:'24px',height:'24px',borderRadius:'8px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',background:activo?'linear-gradient(120deg,#1E466B,#2E6CA6)':'transparent',border:`1.5px solid ${activo?'transparent':'var(--border-2)'}`}}>
                      {activo && <Check size={14} strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}

              {error && (
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 14px',borderRadius:'12px',background:'var(--err-s)',border:'1px solid var(--err-b)',color:'var(--err)',fontSize:'13px',marginTop:'4px'}}>
                  <TriangleAlert size={15} style={{flexShrink:0}} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 22px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'12px',color:'var(--dim)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'9px',height:'9px',borderRadius:'50%',flexShrink:0,background:presentes>=2?'var(--ok)':'var(--mute)',boxShadow:presentes>=2?'0 0 0 4px var(--ok-s)':'none',transition:'background .2s'}} />
              <span><strong style={{color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{presentes}</strong> de mín. 2 profesores</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'9px',height:'9px',borderRadius:'50%',flexShrink:0,background:asistEst?'var(--ok)':'var(--err)',boxShadow:asistEst?'0 0 0 4px var(--ok-s)':'0 0 0 4px var(--err-s)',transition:'background .2s'}} />
              <span>Estudiante {asistEst ? 'presente' : 'ausente — requerido'}</span>
            </div>
          </div>
          <button
            className="pp-btn-primary"
            onClick={handleSubmit}
            disabled={saving || !quorumOk}
            style={{marginLeft:'auto',padding:'13px 20px',fontSize:'13.5px',opacity:saving?.7:1}}
          >
            <Play size={17} /> {saving ? 'Iniciando…' : 'Dar inicio a la mesa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── VeredictoModal — lógica intacta, markup rediseñado ─────────────────────
const VEREDICTO_OPTS = [
  { id:'Aprobado',         label:'Aprobado',                  desc:'El proyecto cumple con todos los requisitos exigidos.',      key:'ok'   },
  { id:'Con_Correcciones', label:'Aprobado con correcciones', desc:'Aprobado sujeto a los ajustes señalados por el jurado.',     key:'gold' },
  { id:'Reprobado',        label:'Suspendido',                desc:'El proyecto no cumple con los requisitos exigidos.',          key:'err'  },
]
const V_TOK = {
  ok:   { c:'var(--ok)',   s:'var(--ok-s)',   b:'var(--ok-b)'   },
  gold: { c:'var(--gold)', s:'var(--gold-s)', b:'var(--gold-b)' },
  err:  { c:'var(--err)',  s:'var(--err-s)',  b:'var(--err-b)'  },
}

function VeredictoModal({ mesaId, mesa, onClose, onSuccess }) {
  const [veredicto, setVeredicto] = useState(null)
  const [dias,      setDias]      = useState(15)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  const fechaLimite = (() => {
    const d = new Date(); d.setDate(d.getDate() + dias)
    return d.toLocaleDateString('es-VE', { day:'2-digit', month:'short', year:'numeric' })
  })()

  const handleSubmit = async () => {
    if (!veredicto) return
    setSaving(true); setError(null)
    try {
      await mesasService.registrarVeredicto(mesaId, {
        veredicto,
        dias_correccion: veredicto === 'Con_Correcciones' ? dias : undefined,
      })
      onSuccess(); onClose()
    } catch (e) {
      setError(e.detail ?? 'No se pudo registrar el veredicto.')
    } finally { setSaving(false) }
  }

  const estudianteNombre = mesa?.estudiante ?? ''
  const tipoLabel        = mesa ? (TIPO_MESA_LABEL[mesa.tipo_mesa] ?? '') : ''

  return (
    <div
      onClick={onClose}
      style={{position:'fixed',inset:0,zIndex:60,background:'var(--scrim)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px',animation:'scrimIn .2s ease both'}}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{width:'540px',maxWidth:'100%',maxHeight:'88vh',display:'flex',flexDirection:'column',borderRadius:'22px',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border-2)',boxShadow:'0 40px 100px -30px rgba(0,0,0,.7)',animation:'modalIn .32s cubic-bezier(.16,1,.3,1) both'}}
      >
        {/* Header */}
        <div style={{padding:'22px 26px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:'14px'}}>
          <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <IcoGavel size={20} />
          </div>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:'18px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>Registrar veredicto</h3>
            <p style={{margin:'4px 0 0',fontSize:'12.5px',color:'var(--dim)',lineHeight:1.5}}>
              {estudianteNombre}{tipoLabel ? ` · ${tipoLabel}` : ''}
            </p>
          </div>
          <button className="pp-modal-close" onClick={onClose}><X size={17} /></button>
        </div>

        {/* Body */}
        <div style={{padding:'18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'11px',flex:1}}>
          {VEREDICTO_OPTS.map(opt => {
            const tok = V_TOK[opt.key]
            const sel = veredicto === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setVeredicto(opt.id)}
                style={{display:'flex',alignItems:'center',gap:'14px',width:'100%',padding:'15px 16px',borderRadius:'16px',cursor:'pointer',transition:'all .2s cubic-bezier(.22,.61,.36,1)',background:sel?tok.s:'var(--field)',border:`1.5px solid ${sel?tok.b:'var(--border)'}`,textAlign:'left'}}
              >
                <div style={{width:'44px',height:'44px',borderRadius:'12px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:tok.s,border:`1px solid ${tok.b}`,color:tok.c}}>
                  <VeredictoIcon tipo={opt.key} size={22} color={tok.c} />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'15px',fontWeight:700,color:'var(--text)'}}>{opt.label}</div>
                  <div style={{fontSize:'12px',color:'var(--dim)',marginTop:'3px',lineHeight:1.4}}>{opt.desc}</div>
                </div>
                <div style={{width:'22px',height:'22px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${sel?tok.c:'var(--border-2)'}`,transition:'all .2s'}}>
                  {sel && <span style={{width:'10px',height:'10px',borderRadius:'50%',background:tok.c,display:'block'}} />}
                </div>
              </button>
            )
          })}

          {veredicto === 'Con_Correcciones' && (
            <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:'var(--gold-s)',border:'1px solid var(--gold-b)',flexWrap:'wrap'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'var(--gold)',flexShrink:0}}>Días para corrección:</label>
              <input
                type="number" value={dias} min={1} max={365}
                onChange={e => setDias(Math.max(1, parseInt(e.target.value) || 1))}
                style={{width:'70px',padding:'6px 10px',fontSize:'13px',textAlign:'center',borderRadius:'10px',border:'1px solid var(--gold-b)',background:'transparent',color:'var(--text)',fontFamily:"'Sora',system-ui,sans-serif",fontVariantNumeric:'tabular-nums',outline:'none'}}
              />
              <span style={{fontSize:'12px',color:'var(--dim)',flexShrink:0}}>Límite: {fechaLimite}</span>
            </div>
          )}

          {error && (
            <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 14px',borderRadius:'12px',background:'var(--err-s)',border:'1px solid var(--err-b)',color:'var(--err)',fontSize:'13px'}}>
              <TriangleAlert size={15} style={{flexShrink:0}} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'16px 22px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'12px'}}>
          <button className="pp-btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            className="pp-btn-primary"
            onClick={handleSubmit}
            disabled={saving || !veredicto}
            style={{padding:'13px 22px',fontSize:'13.5px',opacity:saving?.7:1}}
          >
            {saving ? 'Guardando…' : 'Confirmar veredicto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PortalProfesor — datos intactos, markup rediseñado ─────────────────────
export default function PortalProfesor({ session, onLogout }) {
  const [datos,            setDatos]            = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [quorumMesaId,     setQuorumMesaId]     = useState(null)
  const [veredictoMesaId,  setVeredictoMesaId]  = useState(null)
  const [presentesCtx,     setPresentesCtx]     = useState(0)
  const [theme,            setTheme]            = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('pp-theme') : null) ?? 'dark'
  )

  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('pp-theme', next) } catch {}
    return next
  })

  const cargar = () => {
    setLoading(true); setError(null)
    portalesService.getProfesor(session.cedula)
      .then(setDatos)
      .catch(e => setError(e.detail ?? 'No se pudo cargar la información.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [session.cedula])

  // ── Listas (sin cambios) ──────────────────────────────────────────────────
  const mesasProximas  = datos?.mesas.filter(m => ['Programada', 'En_Curso'].includes(m.estado)) ?? []
  const mesasHistorial = datos?.mesas.filter(m => !['Programada', 'En_Curso'].includes(m.estado)) ?? []

  // Mesa destacada de hoy: En_Curso tiene prioridad sobre Programada hoy
  const mesaDeHoy = datos?.mesas.find(m =>
    m.estado === 'En_Curso' ||
    (m.estado === 'Programada' && esFechaHoy(m.fecha))
  ) ?? null

  // Mesa concluida hoy (para el hero-D después del veredicto)
  const mesaConcluidaHoy = datos?.mesas.find(m =>
    !['Programada', 'En_Curso'].includes(m.estado) && esFechaHoy(m.fecha)
  ) ?? null

  // Próximas = programadas que NO son hoy (la de hoy va al hero)
  const mesasFuturas = mesasProximas
    .filter(m => !(m.estado === 'Programada' && esFechaHoy(m.fecha)) && m.estado !== 'En_Curso')
    .sort((a, b) => {
      const tsDate = f => {
        if (!f) return 0
        const [d, m, y] = f.split('/').map(Number)
        return new Date(y, m - 1, d).getTime()
      }
      const tsTime = h => {
        if (!h) return 0
        const [hh, mm] = h.split(':').map(Number)
        return hh * 60 + mm
      }
      const dateDiff = tsDate(a.fecha) - tsDate(b.fecha)
      return dateDiff !== 0 ? dateDiff : tsTime(a.hora_inicio) - tsTime(b.hora_inicio)
    })

  // Stats
  const statHoy   = datos?.mesas.filter(m => esFechaHoy(m.fecha) && ['Programada','En_Curso'].includes(m.estado)).length ?? 0
  const statProx  = mesasFuturas.length
  const statConcl = mesasHistorial.length

  const nombre    = datos?.nombre ?? ''
  const iniciales = getIniciales(nombre)
  const cedulaFmt = session.cedula ? `V-${session.cedula}` : ''

  return (
    <>
      <style>{PORTAL_CSS}</style>
      <div
        data-portal-root=""
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
              <span style={{fontSize:'15px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>UPEL · Portal del Profesor</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
            <button className="pp-btn-icon" onClick={toggleTheme} title={theme==='dark'?'Modo claro':'Modo oscuro'}>
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="pp-btn-exit" onClick={onLogout}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>

        {/* ══ ZONA DE CONTENIDO ═══════════════════════════════════════════════ */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>

          {/* Aura decorativa */}
          <div style={{position:'absolute',width:'560px',height:'560px',borderRadius:'50%',pointerEvents:'none',filter:'blur(80px)',opacity:'var(--aura-op)',zIndex:0,background:'radial-gradient(circle,var(--brand-l),transparent 68%)',top:'-200px',right:'8%',animation:'auraFloat 16s ease-in-out infinite'}} />

          <div style={{position:'relative',zIndex:1,maxWidth:'1080px',margin:'0 auto',padding:'26px 32px 64px'}}>

            {/* ── CARGANDO ─────────────────────────────────────────────────── */}
            {loading && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
                  <div className="pp-shimmer" style={{width:'64px',height:'64px',borderRadius:'50%',flexShrink:0}} />
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div className="pp-shimmer" style={{width:'140px',height:'11px',borderRadius:'6px'}} />
                    <div className="pp-shimmer" style={{width:'260px',height:'22px',borderRadius:'8px'}} />
                    <div className="pp-shimmer" style={{width:'200px',height:'12px',borderRadius:'6px'}} />
                  </div>
                </div>
                <div className="pp-shimmer" style={{marginTop:'26px',height:'170px',borderRadius:'24px',width:'100%'}} />
                <div style={{marginTop:'18px',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',color:'var(--dim)',fontSize:'13px'}}>
                  <Loader2 size={16} className="pp-spin" /> Cargando tus mesas…
                </div>
              </div>
            )}

            {/* ── ERROR ────────────────────────────────────────────────────── */}
            {!loading && error && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'70px 24px'}}>
                <div style={{width:'74px',height:'74px',borderRadius:'50%',background:'var(--err-s)',border:'1px solid var(--err-b)',color:'var(--err)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <TriangleAlert size={32} />
                </div>
                <h2 style={{margin:'22px 0 8px',fontSize:'21px',fontWeight:700,letterSpacing:'-.01em',color:'var(--text)'}}>No pudimos cargar tus mesas</h2>
                <p style={{margin:0,fontSize:'13.5px',color:'var(--dim)',lineHeight:1.6,maxWidth:'380px'}}>Ocurrió un problema al consultar el servidor. Verifica tu conexión e inténtalo nuevamente.</p>
                <button className="pp-btn-primary" onClick={cargar} style={{marginTop:'24px',padding:'14px 24px',fontSize:'14px'}}>
                  <RotateCw size={16} /> Reintentar
                </button>
              </div>
            )}

            {/* ── CARGADO ──────────────────────────────────────────────────── */}
            {!loading && !error && datos && (
              <div>

                {/* Resumen del profesor */}
                <div style={{display:'flex',alignItems:'center',gap:'20px',animation:'rvIn .55s cubic-bezier(.16,1,.3,1) both',flexWrap:'wrap'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#0B2138 0%,#1E466B 52%,#2E6CA6 120%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:700,color:'#fff',boxShadow:'0 0 0 3px rgba(103,186,244,.18), 0 10px 26px -10px rgba(46,108,166,.7)'}}>
                    {iniciales}
                  </div>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:'11px',fontWeight:700,letterSpacing:'.2em',color:'var(--brand-l)'}}>BIENVENIDO DE VUELTA</div>
                    <h2 style={{margin:'5px 0 4px',fontSize:'25px',fontWeight:700,letterSpacing:'-.02em',lineHeight:1.1,color:'var(--text)'}}>
                      {nombre.startsWith('Prof.') ? nombre : `Prof. ${nombre}`}
                    </h2>
                    <div style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'13px',color:'var(--dim)',flexWrap:'wrap'}}>
                      {datos.especialidad && (
                        <>
                          <BookOpen size={14} style={{color:'var(--mute)',flexShrink:0}} />
                          <span>{datos.especialidad}</span>
                          <span style={{color:'var(--divider)'}}>·</span>
                        </>
                      )}
                      <IcoIdCard size={14} />
                      <span style={{fontVariantNumeric:'tabular-nums'}}>{cedulaFmt}</span>
                    </div>
                  </div>
                  <div style={{marginLeft:'auto',display:'flex',gap:'12px',flexShrink:0}}>
                    {[
                      { label:'HOY',        val:statHoy,   blue:true  },
                      { label:'PRÓXIMAS',   val:statProx,  blue:false },
                      { label:'CONCLUIDAS', val:statConcl, blue:false },
                    ].map(s => (
                      <div key={s.label} style={{display:'flex',flexDirection:'column',gap:'4px',padding:'13px 18px',borderRadius:'16px',minWidth:'96px',background:s.blue?'var(--info-s)':'var(--field)',border:`1px solid ${s.blue?'var(--info-b)':'var(--border)'}`}}>
                        <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'.14em',color:s.blue?'var(--brand-l)':'var(--mute)'}}>{s.label}</span>
                        <span style={{fontSize:'24px',fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums',color:'var(--text)'}}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── HERO: PROGRAMADA (por iniciar) ───────────────────────── */}
                {mesaDeHoy?.estado === 'Programada' && (
                  <section style={{marginTop:'26px',borderRadius:'24px',overflow:'hidden',position:'relative',background:'var(--card)',border:'1px solid var(--info-b)',boxShadow:'0 22px 55px -22px rgba(46,108,166,.5)',animation:'rvIn .55s cubic-bezier(.16,1,.3,1) both',animationDelay:'.06s'}}>
                    <div style={{height:'4px',background:'linear-gradient(120deg,#1E466B,#2E6CA6,#67BAF4)'}} />
                    <div style={{padding:'26px 30px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 13px',borderRadius:'999px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',fontSize:'11px',fontWeight:700,letterSpacing:'.12em'}}>
                          <Clock size={13} /> HOY · POR INICIAR
                        </span>
                        <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)'}}>
                          {mesaDeHoy.hora_inicio} – {mesaDeHoy.hora_fin}
                        </span>
                        <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'9px'}}>
                          <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',fontSize:'11.5px',fontWeight:600}}>
                            {TIPO_MESA_LABEL[mesaDeHoy.tipo_mesa] ?? 'Mesa'}
                          </span>
                          <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--field)',border:'1px solid var(--border)',color:'var(--dim)',fontSize:'11.5px',fontWeight:600}}>
                            {mesaDeHoy.rol}
                          </span>
                        </span>
                      </div>
                      <div style={{marginTop:'20px',display:'flex',alignItems:'flex-end',gap:'24px',flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:'280px'}}>
                          <div style={{fontSize:'11px',fontWeight:600,letterSpacing:'.1em',color:'var(--mute)',marginBottom:'5px'}}>ESTUDIANTE</div>
                          <div style={{fontSize:'23px',fontWeight:700,letterSpacing:'-.01em',lineHeight:1.15,color:'var(--text)'}}>{mesaDeHoy.estudiante}</div>
                          {mesaDeHoy.titulo && (
                            <p style={{margin:'10px 0 0',fontSize:'14px',fontStyle:'italic',color:'var(--dim)',lineHeight:1.5,maxWidth:'560px'}}>
                              «{mesaDeHoy.titulo}»
                            </p>
                          )}
                          {mesaDeHoy.aula && (
                            <div style={{marginTop:'14px',display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--dim)'}}>
                              <MapPin size={15} style={{color:'var(--mute)',flexShrink:0}} /> {mesaDeHoy.aula}
                            </div>
                          )}
                        </div>
                        <button
                          className="pp-btn-primary"
                          onClick={() => setQuorumMesaId(mesaDeHoy.id)}
                          style={{padding:'16px 28px',fontSize:'14.5px',flexShrink:0}}
                        >
                          <Play size={18} /> Iniciar mesa
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── HERO: EN CURSO ───────────────────────────────────────── */}
                {mesaDeHoy?.estado === 'En_Curso' && (
                  <section style={{marginTop:'26px',borderRadius:'24px',overflow:'hidden',position:'relative',background:'var(--card)',border:'1px solid var(--info-b)',boxShadow:'0 22px 55px -22px rgba(46,108,166,.5)',animation:'rvIn .45s cubic-bezier(.16,1,.3,1) both'}}>
                    <div style={{height:'4px',background:'linear-gradient(120deg,#1E466B,#2E6CA6,#67BAF4)'}} />
                    <div style={{padding:'26px 30px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 13px',borderRadius:'999px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',fontSize:'11px',fontWeight:700,letterSpacing:'.12em'}}>
                          <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--brand-l)',flexShrink:0,animation:'livePulse 1.8s ease-out infinite'}} />
                          EN CURSO
                        </span>
                        <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)'}}>
                          {mesaDeHoy.hora_inicio} – {mesaDeHoy.hora_fin}
                        </span>
                        {presentesCtx > 0 && (
                          <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'12.5px',color:'var(--dim)'}}>
                            <Users size={14} style={{flexShrink:0}} /> {presentesCtx} presentes
                          </span>
                        )}
                        <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'9px'}}>
                          <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',fontSize:'11.5px',fontWeight:600}}>
                            {TIPO_MESA_LABEL[mesaDeHoy.tipo_mesa] ?? 'Mesa'}
                          </span>
                          <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--field)',border:'1px solid var(--border)',color:'var(--dim)',fontSize:'11.5px',fontWeight:600}}>
                            {mesaDeHoy.rol}
                          </span>
                        </span>
                      </div>
                      <div style={{marginTop:'20px',display:'flex',alignItems:'flex-end',gap:'24px',flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:'280px'}}>
                          <div style={{fontSize:'11px',fontWeight:600,letterSpacing:'.1em',color:'var(--mute)',marginBottom:'5px'}}>ESTUDIANTE</div>
                          <div style={{fontSize:'23px',fontWeight:700,letterSpacing:'-.01em',lineHeight:1.15,color:'var(--text)'}}>{mesaDeHoy.estudiante}</div>
                          {mesaDeHoy.titulo && (
                            <p style={{margin:'10px 0 0',fontSize:'14px',fontStyle:'italic',color:'var(--dim)',lineHeight:1.5,maxWidth:'560px'}}>
                              «{mesaDeHoy.titulo}»
                            </p>
                          )}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:'12px',flexShrink:0}}>
                          {mesaDeHoy.aula && (
                            <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--dim)'}}>
                              <MapPin size={15} style={{color:'var(--mute)',flexShrink:0}} /> {mesaDeHoy.aula}
                            </div>
                          )}
                          <button
                            className="pp-btn-primary"
                            onClick={() => setVeredictoMesaId(mesaDeHoy.id)}
                            style={{padding:'15px 26px',fontSize:'14px'}}
                          >
                            <IcoGavel size={17} /> Registrar veredicto
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── HERO: CONCLUIDA (después del veredicto) ──────────────── */}
                {!mesaDeHoy && mesaConcluidaHoy && (() => {
                  const tok = getVtok(mesaConcluidaHoy.estado)
                  return (
                    <section style={{marginTop:'26px',borderRadius:'24px',overflow:'hidden',position:'relative',background:'var(--card)',border:'1px solid var(--border)',animation:'rvIn .45s cubic-bezier(.16,1,.3,1) both'}}>
                      <div style={{height:'4px',background:tok.bar}} />
                      <div style={{padding:'24px 30px',display:'flex',alignItems:'center',gap:'18px',flexWrap:'wrap'}}>
                        <div style={{width:'52px',height:'52px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:tok.s,border:`1px solid ${tok.b}`,color:tok.c}}>
                          <VeredictoIcon tipo={tok.icon} size={24} color={tok.c} />
                        </div>
                        <div style={{flex:1,minWidth:'220px'}}>
                          <div style={{fontSize:'11px',fontWeight:700,letterSpacing:'.14em',color:'var(--mute)'}}>MESA CONCLUIDA · VEREDICTO REGISTRADO</div>
                          <div style={{marginTop:'5px',fontSize:'19px',fontWeight:700,color:'var(--text)'}}>{mesaConcluidaHoy.estudiante}</div>
                        </div>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'9px 16px',borderRadius:'999px',fontSize:'13.5px',fontWeight:700,background:tok.s,border:`1px solid ${tok.b}`,color:tok.c,flexShrink:0}}>
                          {tok.label}
                        </span>
                      </div>
                    </section>
                  )
                })()}

                {/* ── PRÓXIMAS MESAS ────────────────────────────────────────── */}
                <div style={{display:'flex',alignItems:'center',gap:'13px',margin:'36px 0 18px'}}>
                  <div className="pp-section-icon"><CalendarClock size={17} /></div>
                  <div style={{lineHeight:1.15}}>
                    <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.18em',color:'var(--mute)'}}>AGENDA</div>
                    <div style={{fontSize:'15.5px',fontWeight:700,color:'var(--text)'}}>Próximas mesas</div>
                  </div>
                </div>

                {mesasFuturas.length === 0 ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'54px 24px',borderRadius:'24px',background:'var(--card)',border:'1px dashed var(--border-2)'}}>
                    <div style={{width:'64px',height:'64px',borderRadius:'18px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <CalendarCheck2 size={28} />
                    </div>
                    <h3 style={{margin:'20px 0 8px',fontSize:'18px',fontWeight:700,color:'var(--text)'}}>No tienes mesas próximas</h3>
                    <p style={{margin:0,fontSize:'13.5px',color:'var(--dim)',lineHeight:1.6,maxWidth:'360px'}}>Cuando se te asigne una mesa de defensa, aparecerá aquí con su fecha, aula y rol.</p>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                    {mesasFuturas.map(m => {
                      const { dia, mes } = parseFecha(m.fecha)
                      return (
                        <div key={m.id} style={{display:'flex',gap:'18px'}}>
                          {/* Riel de fecha */}
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'54px',flexShrink:0,paddingTop:'4px'}}>
                            <div style={{fontSize:'20px',fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums',color:'var(--text)'}}>{dia}</div>
                            <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.1em',color:'var(--dim)',marginTop:'2px'}}>{mes}</div>
                            <div style={{width:'13px',height:'13px',borderRadius:'50%',border:'2px solid var(--mute)',background:'var(--bg)',marginTop:'12px'}} />
                            <div style={{flex:1,width:'2px',background:'var(--border)',marginTop:'5px'}} />
                          </div>
                          {/* Tarjeta */}
                          <div className="pp-card-prox" style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:'9px',flexWrap:'wrap'}}>
                              <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--info-s)',border:'1px solid var(--info-b)',color:'var(--brand-l)',fontSize:'11.5px',fontWeight:600}}>
                                {TIPO_MESA_LABEL[m.tipo_mesa] ?? 'Mesa'}
                              </span>
                              <span style={{padding:'5px 11px',borderRadius:'8px',background:'var(--field)',border:'1px solid var(--border)',color:'var(--dim)',fontSize:'11.5px',fontWeight:600}}>
                                {m.rol}
                              </span>
                              <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 11px',borderRadius:'999px',background:'var(--field)',border:'1px solid var(--border)',color:'var(--dim)',fontSize:'11px',fontWeight:600,letterSpacing:'.06em'}}>
                                PROGRAMADA
                              </span>
                            </div>
                            <div style={{marginTop:'14px',fontSize:'17px',fontWeight:700,color:'var(--text)'}}>{m.estudiante}</div>
                            {m.titulo && (
                              <p style={{margin:'6px 0 0',fontSize:'13.5px',fontStyle:'italic',color:'var(--dim)',lineHeight:1.5,maxWidth:'600px'}}>
                                «{m.titulo}»
                              </p>
                            )}
                            <div style={{marginTop:'16px',paddingTop:'15px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'18px',flexWrap:'wrap'}}>
                              <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'12.5px',color:'var(--dim)'}}>
                                {m.hora_inicio} – {m.hora_fin}
                              </span>
                              {m.aula && (
                                <span style={{display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'12.5px',color:'var(--dim)'}}>
                                  <MapPin size={14} style={{color:'var(--mute)',flexShrink:0}} /> {m.aula}
                                </span>
                              )}
                              <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'7px',fontSize:'12px',color:'var(--mute)'}}>
                                <Lock size={13} style={{flexShrink:0}} /> Disponible el día de la defensa
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── HISTORIAL ─────────────────────────────────────────────── */}
                {mesasHistorial.length > 0 && (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:'13px',margin:'36px 0 18px'}}>
                      <div className="pp-section-icon"><History size={17} /></div>
                      <div style={{lineHeight:1.15}}>
                        <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.18em',color:'var(--mute)'}}>REGISTRO</div>
                        <div style={{fontSize:'15.5px',fontWeight:700,color:'var(--text)'}}>Historial</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      {mesasHistorial.map(m => {
                        const tok = getVtok(m.estado)
                        const { dia, mes } = parseFecha(m.fecha)
                        const tituloCorto = m.titulo
                          ? ` · «${m.titulo.length > 50 ? m.titulo.substring(0, 50) + '…' : m.titulo}»`
                          : ''
                        return (
                          <div key={`h-${m.id}`} className="pp-row-hist">
                            <div style={{textAlign:'center',width:'46px',flexShrink:0}}>
                              <div style={{fontSize:'17px',fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums',color:'var(--text)'}}>{dia}</div>
                              <div style={{fontSize:'9.5px',fontWeight:700,letterSpacing:'.1em',color:'var(--mute)',marginTop:'2px'}}>{mes}</div>
                            </div>
                            <div style={{width:'1px',height:'34px',background:'var(--border)',flexShrink:0}} />
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'15px',fontWeight:600,color:'var(--text)'}}>{m.estudiante}</div>
                              <div style={{fontSize:'12px',color:'var(--dim)',marginTop:'3px'}}>
                                {TIPO_MESA_LABEL[m.tipo_mesa] ?? 'Mesa'} · {m.rol}{tituloCorto}
                              </div>
                            </div>
                            <span style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'7px 13px',borderRadius:'999px',fontSize:'12px',fontWeight:600,flexShrink:0,background:tok.s,border:`1px solid ${tok.b}`,color:tok.c}}>
                              <VeredictoIcon tipo={tok.icon} size={14} color={tok.c} />
                              {tok.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

              </div>
            )}

          </div>
        </div>

        {/* ══ MODALES ══════════════════════════════════════════════════════════ */}
        {quorumMesaId && (
          <QuorumModal
            mesaId={quorumMesaId}
            cedula={session.cedula}
            onClose={() => setQuorumMesaId(null)}
            onSuccess={total => { setPresentesCtx(total); cargar() }}
          />
        )}
        {veredictoMesaId && (
          <VeredictoModal
            mesaId={veredictoMesaId}
            mesa={datos?.mesas.find(m => m.id === veredictoMesaId)}
            onClose={() => setVeredictoMesaId(null)}
            onSuccess={cargar}
          />
        )}

      </div>
    </>
  )
}
