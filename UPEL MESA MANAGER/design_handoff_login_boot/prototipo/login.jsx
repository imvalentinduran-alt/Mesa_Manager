// login.jsx — Login de dos paneles (UPEL Mesa Manager)
function MMLogin({ dark, demoError }) {
  const f = useLoginFlow({ demoError });
  const mode = dark ? 'dark' : 'light';
  const rootRef = React.useRef(null);

  // Partículas decorativas del panel de marca
  const dust = React.useMemo(() => (
    Array.from({ length: 9 }).map(() => ({
      left: Math.round(Math.random() * 100),
      top: Math.round(Math.random() * 100),
      delay: (Math.random() * 6).toFixed(2),
      dur: (4 + Math.random() * 5).toFixed(2),
      size: (2 + Math.random() * 2).toFixed(1),
    }))
  ), []);

  // Red de seguridad: garantiza visibilidad si el reloj de animación no avanza.
  React.useEffect(() => {
    const t = setTimeout(() => {
      rootRef.current && rootRef.current
        .querySelectorAll('.mm-rise, .mm-fade')
        .forEach(el => { el.style.animation = 'none'; });
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mm" data-mode={mode} data-screen-label="Login" ref={rootRef}>
      <div className="mm-stage">
        <div className="mm-card mm-fade">

          {/* Panel de marca */}
          <aside className="mm-brand">
            {/* Capa de vida: orbes y partículas */}
            <div className="mm-brand-fx" aria-hidden="true">
              <span className="mm-orb a"></span>
              <span className="mm-orb b"></span>
              <span className="mm-orb c"></span>
              {dust.map((d, i) => (
                <span key={i} className="mm-dust" style={{
                  left: `${d.left}%`, top: `${d.top}%`,
                  width: `${d.size}px`, height: `${d.size}px`,
                  animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`,
                }}></span>
              ))}
            </div>

            <div className="mm-brand-top mm-rise">
              <img src="assets/upel-white.png" alt="UPEL" />
              <div>
                <div className="mm-brand-k">UPEL · SIP</div>
                <div className="mm-brand-n">Mesa Manager</div>
              </div>
            </div>

            <div>
              <h2 className="mm-brand-h mm-rise" style={{ animationDelay: '.1s' }}>
                Acceso institucional
              </h2>
              <p className="mm-brand-sub mm-rise" style={{ animationDelay: '.2s' }}>
                Gestiona, programa y consulta defensas de maestría en un solo lugar.
              </p>

              <div className="mm-cert mm-rise" style={{ animationDelay: '.34s' }}>
                <Ic k="shield" size={13} />
                Conexión cifrada · Ambiente oficial UPEL
              </div>
            </div>
          </aside>

          {/* Panel de formulario */}
          <main className="mm-main">
            <div className="mm-formbox">
              <MMView flow={f}>
                {f.view === 'role'    && <MMRoles flow={f} />}
                {f.view === 'admin'   && <MMAdmin flow={f} />}
                {f.view === 'student' && <MMConsultor flow={f} />}
              </MMView>
            </div>
            <div className="mm-foot">Sistema Oficial UPEL — Versión 1.0</div>
          </main>

        </div>
      </div>
    </div>
  );
}

function MMRoles({ flow }) {
  return (
    <div>
      <h1 className="mm-title">Bienvenido de nuevo</h1>
      <p className="mm-sub">Selecciona tu tipo de acceso para continuar.</p>
      <div style={{ marginTop: 28 }}>
        <button className="mm-role" onClick={() => flow.switchView('admin')}>
          <span className="mm-role-ic"><Ic k="landmark" size={18} /></span>
          <span>
            <div className="mm-role-t">Acceso Administrativo</div>
            <div className="mm-role-s">Coordinador / Jefe de Programa</div>
          </span>
          <span className="mm-role-arrow"><Ic k="arrowR" size={16} /></span>
        </button>
        <button className="mm-role" onClick={() => flow.switchView('student')}>
          <span className="mm-role-ic"><Ic k="grad" size={18} /></span>
          <span>
            <div className="mm-role-t">Consulta Estudiantil / Profesor</div>
            <div className="mm-role-s">Acceso a tu agenda y notificaciones</div>
          </span>
          <span className="mm-role-arrow"><Ic k="arrowR" size={16} /></span>
        </button>
      </div>
    </div>
  );
}

function MMBtn({ flow, disabled }) {
  return (
    <button type="submit" className="mm-btn" disabled={disabled || flow.loading}>
      {flow.loading
        ? <span className="mm-spin" />
        : flow.success
          ? <React.Fragment><Ic k="check" size={16} /> Acceso verificado</React.Fragment>
          : <React.Fragment>Ingresar <Ic k="arrowR" size={15} /></React.Fragment>}
    </button>
  );
}

function MMAdmin({ flow: f }) {
  return (
    <form onSubmit={f.submitAdmin} noValidate>
      <button type="button" className="mm-back" onClick={() => f.switchView('role')}>
        <Ic k="arrowL" size={13} /> Cambiar tipo de acceso
      </button>
      <h1 className="mm-title">Acceso Administrativo</h1>
      <p className="mm-sub">Ingresa tus credenciales institucionales.</p>

      <div style={{ display: 'grid', gap: 16, marginTop: 26 }}>
        <div>
          <label className="mm-label">Cédula de identidad</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><Ic k="idCard" size={16} /></span>
            <input className={'mm-input' + (f.cedulaError || f.error ? ' err' : '')}
              type="text" inputMode="numeric" placeholder="V-12.345.678"
              value={f.cedula} disabled={f.loading}
              onChange={e => f.setCedula(e.target.value, 8)} />
          </div>
          {f.cedulaError && <p className="mm-hint">{f.cedulaError}</p>}
        </div>

        <div>
          <label className="mm-label">Contraseña</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><Ic k="lock" size={16} /></span>
            <input className={'mm-input' + (f.error ? ' err' : '')}
              type={f.showPassword ? 'text' : 'password'} placeholder="••••••••"
              value={f.contrasena} disabled={f.loading}
              onChange={e => f.setContrasena(e.target.value)} />
            <button type="button" className="mm-eye" tabIndex={-1}
              onClick={() => f.setShowPassword(v => !v)}>
              <Ic k={f.showPassword ? 'eyeOff' : 'eye'} size={16} />
            </button>
          </div>
        </div>

        <MMError msg={f.error} />
        <MMBtn flow={f} disabled={!f.cedula || !f.contrasena} />
      </div>
    </form>
  );
}

function MMConsultor({ flow: f }) {
  return (
    <form onSubmit={f.submitConsultor} noValidate>
      <button type="button" className="mm-back" onClick={() => f.switchView('role')}>
        <Ic k="arrowL" size={13} /> Cambiar tipo de acceso
      </button>
      <h1 className="mm-title">Consulta de Agenda</h1>
      <p className="mm-sub">Ingresa tu cédula para acceder a tus defensas asignadas.</p>

      <div style={{ display: 'grid', gap: 16, marginTop: 26 }}>
        <div>
          <label className="mm-label">Cédula de identidad</label>
          <div className="mm-input-wrap">
            <span className="mm-ico"><Ic k="idCard" size={16} /></span>
            <input className={'mm-input' + (f.cedulaError || f.error ? ' err' : '')}
              type="text" inputMode="numeric" placeholder="V-1.234.567 ó C.C. 1.094.567.890"
              value={f.cedula} disabled={f.loading}
              onChange={e => f.setCedula(e.target.value, 10)} />
          </div>
          {f.cedulaError && <p className="mm-hint">{f.cedulaError}</p>}
        </div>

        <MMError msg={f.error} />
        <MMBtn flow={f} disabled={!f.cedula} />
      </div>
    </form>
  );
}

window.MMLogin = MMLogin;
