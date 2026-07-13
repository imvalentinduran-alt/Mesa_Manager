// boot.jsx — pantalla de carga: ensamblaje del logo UPEL con cada barra real
// (subtrazos del SVG, en window.UPEL_BARS). Cada barra vuela desde abajo desde
// un punto distinto, rota, y encaja con rebote; destello azul al unirse.
const VB = { x: 8, y: 67, w: 195, h: 146 };   // viewBox recortado al logo
const BOX_W = 178;
const BOX_H = Math.round(BOX_W * VB.h / VB.w); // ≈ 133

function MMBoot({ dark, onDone }) {
  const [leave, setLeave] = React.useState(false);
  const mode = dark ? 'dark' : 'light';
  const rootRef = React.useRef(null);
  const bars = (typeof window !== 'undefined' && window.UPEL_BARS) || [];

  // Dispersión inicial de cada barra (abajo, puntos distintos, rotación)
  const scatter = React.useMemo(() => bars.map(() => {
    const r = (a, b) => a + Math.random() * (b - a);
    return {
      sx: Math.round(r(-160, 160)),
      sy: Math.round(r(150, 300)),
      rot: Math.round(r(-42, 42)),
      d: +r(0, 1.0).toFixed(2),
    };
  }), [bars.length]);

  // Origen de rotación = centro real de cada barra (en px dentro del cuadro)
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('.mm-bar').forEach((svg) => {
      const path = svg.querySelector('path');
      if (!path) return;
      const b = path.getBBox();
      const ox = (b.x + b.width / 2 - VB.x) / VB.w * BOX_W;
      const oy = (b.y + b.height / 2 - VB.y) / VB.h * BOX_H;
      svg.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
    });
  }, []);

  React.useEffect(() => {
    // En la app real esto se dispara cuando check_api_health responde OK.
    const t1 = setTimeout(() => setLeave(true), 4700);
    const t2 = setTimeout(() => { setLeave(false); onDone && onDone(); }, 5400);
    // Red de seguridad: si el reloj de animación no avanza, mostramos el estado
    // ensamblado por temporizador (después de toda la secuencia prevista).
    const t3 = setTimeout(() => {
      if (!rootRef.current) return;
      rootRef.current.querySelectorAll('.mm-bar, .mm-boot-flash, .mm-boot-word span, .mm-boot-kicker, .mm-boot-status')
        .forEach(el => { el.style.animation = 'none'; el.style.opacity = ''; });
    }, 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const word = 'MESA MANAGER';

  return (
    <div className={'mm-boot' + (leave ? ' leave' : '')} data-mode={mode} data-screen-label="Pantalla de carga" ref={rootRef}>
      <div className="mm-boot-inner">

        <div className="mm-boot-logo" style={{ width: BOX_W, height: BOX_H }} aria-label="UPEL">
          <span className="mm-boot-flash"></span>
          {bars.map((d, i) => (
            <svg key={i} className="mm-bar" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
              style={{
                '--sx': `${scatter[i].sx}px`,
                '--sy': `${scatter[i].sy}px`,
                '--rot': `${scatter[i].rot}deg`,
                animationDelay: `${scatter[i].d}s`,
              }}>
              <path d={d}></path>
            </svg>
          ))}
        </div>

        <div className="mm-boot-word" aria-label="Mesa Manager">
          {word.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${2.5 + i * 0.05}s` }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
        <div className="mm-boot-kicker">Universidad Pedagógica Experimental Libertador</div>

        <div className="mm-boot-status">
          <span className="mm-boot-dot"></span>
          Iniciando servicio
        </div>
      </div>
    </div>
  );
}

window.MMBoot = MMBoot;
