import { useMemo, useLayoutEffect, useRef } from 'react'
import { useTheme } from '@/shared/lib/ThemeContext'
import { UPEL_BARS } from '@/features/auth/lib/upelBars'

const VB     = { x: 8, y: 67, w: 195, h: 146 }
const BOX_W  = 260
const BOX_H  = Math.round(BOX_W * VB.h / VB.w)  // ≈ 195
const WORD   = 'MESA MANAGER'

export default function BootScreen({ intento, leave }) {
  const { darkMode } = useTheme()
  const mode         = darkMode ? 'dark' : 'light'
  const rootRef      = useRef(null)

  const scatter = useMemo(() =>
    UPEL_BARS.map(() => {
      const r = (a, b) => a + Math.random() * (b - a)
      return {
        sx:  Math.round(r(-160, 160)),
        sy:  Math.round(r(150, 300)),
        rot: Math.round(r(-42, 42)),
        d:   +r(0, 1.0).toFixed(2),
      }
    }),
  [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.querySelectorAll('.mm-bar').forEach(svg => {
      const path = svg.querySelector('path')
      if (!path) return
      const b  = path.getBBox()
      const ox = (b.x + b.width  / 2 - VB.x) / VB.w * BOX_W
      const oy = (b.y + b.height / 2 - VB.y) / VB.h * BOX_H
      svg.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`
    })
  }, [])

  return (
    <div
      ref={rootRef}
      className={`mm-boot${leave ? ' leave' : ''}`}
      data-mode={mode}
    >
      <div className="mm-boot-inner">

        <div className="mm-boot-logo" style={{ width: BOX_W, height: BOX_H }} aria-label="UPEL">
          <span className="mm-boot-flash" />
          {UPEL_BARS.map((d, i) => (
            <svg
              key={i}
              className="mm-bar"
              viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
              style={{
                '--sx': `${scatter[i].sx}px`,
                '--sy': `${scatter[i].sy}px`,
                '--rot': `${scatter[i].rot}deg`,
                animationDelay: `${scatter[i].d}s`,
              }}
            >
              <path d={d} />
            </svg>
          ))}
        </div>

        <div className="mm-boot-word" aria-label="Mesa Manager">
          {WORD.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${2.5 + i * 0.05}s` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </div>

        <div className="mm-boot-kicker">
          Universidad Pedagógica Experimental Libertador
        </div>

        <div className="mm-boot-status">
          <span className="mm-boot-dot" />
          Iniciando servicio{intento > 0 ? ` · ${intento}/90` : '…'}
        </div>

      </div>
    </div>
  )
}
