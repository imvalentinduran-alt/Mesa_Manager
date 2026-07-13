// flow.jsx — lógica del flujo de login + iconos (UPEL Mesa Manager)
const { useState, useEffect, useRef } = React;

function formatCedula(value, max = 10) {
  const d = value.replace(/\D/g, '').slice(0, max);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
}

function Ic({ k, size = 16, sw = 2, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
      dangerouslySetInnerHTML={{ __html: MM_ICONS[k] }} />
  );
}

const MM_ICONS = {
  idCard:   '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4"/><line x1="14.5" y1="9" x2="18.5" y2="9"/><line x1="14.5" y1="13" x2="18.5" y2="13"/>',
  lock:     '<rect x="4.5" y="11" width="15" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  eye:      '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:   '<path d="M2.5 12s3.5-6 9.5-6c1.6 0 3 .4 4.3 1M21.5 12s-3.5 6-9.5 6c-1.6 0-3-.4-4.3-1"/><line x1="4.5" y1="19.5" x2="19.5" y2="4.5"/>',
  arrowR:   '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/>',
  arrowL:   '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="11 5 4 12 11 19"/>',
  shield:   '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><polyline points="8.5 12 11 14.5 15.5 9.5"/>',
  grad:     '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 3 20 8 4 8"/>',
  alert:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  check:    '<polyline points="4.5 12.5 9.5 17.5 19.5 6.5"/>',
};

// Máquina de estados — idéntica en función a LoginPage.jsx original
function useLoginFlow({ demoError }) {
  const [view, setView]                 = useState('role');
  const [direction, setDirection]       = useState('fwd');
  const [out, setOut]                   = useState(false);
  const [cedula, setCedulaRaw]          = useState('');
  const [contrasena, setContrasena]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState(null);
  const [cedulaError, setCedulaError]   = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms, fn) => timers.current.push(setTimeout(fn, ms));

  const order = { role: 0, admin: 1, student: 1 };

  const switchView = (next) => {
    setDirection(order[next] >= order[view] ? 'fwd' : 'back');
    setOut(true);
    after(190, () => {
      setView(next); setCedulaRaw(''); setContrasena('');
      setError(null); setCedulaError(null); setSuccess(false); setOut(false);
    });
  };

  const setCedula = (v, max) => {
    setCedulaRaw(formatCedula(v, max));
    setCedulaError(null); setError(null);
  };

  const submit = (kind) => (e) => {
    e.preventDefault();
    if (loading || success) return;
    const d = cedula.replace(/\D/g, '');
    const [lo, hi] = kind === 'admin' ? [7, 8] : [7, 10];
    if (d.length < lo || d.length > hi) {
      setCedulaError(kind === 'admin'
        ? 'La cédula debe tener 7 u 8 dígitos.'
        : 'La cédula debe tener entre 7 y 10 dígitos.');
      return;
    }
    setError(null); setLoading(true);
    after(1100, () => {
      setLoading(false);
      if (demoError) {
        setError(kind === 'admin'
          ? 'Credenciales incorrectas. Verifica tu cédula y contraseña.'
          : 'No se encontró ningún registro para esta cédula en el sistema.');
      } else {
        setSuccess(true);
        after(1800, () => setSuccess(false));
      }
    });
  };

  return {
    view, direction, out, switchView,
    cedula, setCedula, contrasena, setContrasena,
    showPassword, setShowPassword,
    loading, success, error, cedulaError,
    submitAdmin: submit('admin'), submitConsultor: submit('student'),
  };
}

function MMView({ flow, children }) {
  const ref = useRef(null);
  // Red de seguridad: si el reloj de animación no avanza (capturas, webviews
  // throttled), limpiamos las animaciones de entrada por temporizador para
  // garantizar que el contenido quede visible. No afecta el entorno real.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!ref.current) return;
      ref.current.style.animation = 'none';
      ref.current.querySelectorAll('.mm-rise, .mm-fade').forEach(el => { el.style.animation = 'none'; });
    }, 900);
    return () => clearTimeout(t);
  }, [flow.view]);
  return (
    <div key={flow.view} ref={ref}
      className={'mm-view ' + (flow.out ? (flow.direction === 'fwd' ? 'mm-out-f' : 'mm-out-b') : 'mm-in')}>
      {children}
    </div>
  );
}

function MMError({ msg }) {
  if (!msg) return null;
  return (
    <div className="mm-err">
      <Ic k="alert" size={15} />
      <span>{msg}</span>
    </div>
  );
}

// Limpieza: al terminar una animación de entrada se elimina, dejando el
// estilo base (visible) como estado final — capturas y clones del DOM
// nunca muestran el estado oculto inicial.
const MM_ENTER_ANIMS = new Set(['mmRise', 'mmFade', 'mmViewIn', 'mmStripIn', 'mmLetter', 'mmGlow']);
document.addEventListener('animationend', (e) => {
  if (MM_ENTER_ANIMS.has(e.animationName)) e.target.style.animation = 'none';
});

Object.assign(window, { formatCedula, Ic, MM_ICONS, useLoginFlow, MMView, MMError });
