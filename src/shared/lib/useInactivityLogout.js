import { useEffect, useRef, useCallback } from 'react'
import { apiFetch } from './api'
import { clearSession } from './session'

const INACTIVITY_MS = 20 * 60 * 1000 // 20 minutos
const WARNING_MS    = 18 * 60 * 1000 // aviso a los 18 min

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']

/**
 * Cierra la sesión automáticamente tras 20 minutos de inactividad.
 * Emite un aviso a los 18 minutos via onWarning().
 *
 * @param {object} opts
 * @param {string}   opts.token      - Token de sesión activo
 * @param {function} opts.onWarning  - Callback al llegar a los 18 min (mostrar toast)
 * @param {function} opts.onLogout   - Callback al expirar (redirigir a login)
 */
export function useInactivityLogout({ token, onWarning, onLogout }) {
    const timerLogout  = useRef(null)
    const timerWarning = useRef(null)

    const reset = useCallback(() => {
        clearTimeout(timerLogout.current)
        clearTimeout(timerWarning.current)

        timerWarning.current = setTimeout(() => {
            onWarning?.()
        }, WARNING_MS)

        timerLogout.current = setTimeout(async () => {
            try {
                await apiFetch('/api/auth/logout', { method: 'POST' })
            } catch (_) {}
            clearSession()
            onLogout?.()
        }, INACTIVITY_MS)
    }, [token, onWarning, onLogout])

    useEffect(() => {
        EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
        reset()
        return () => {
            EVENTS.forEach(e => window.removeEventListener(e, reset))
            clearTimeout(timerLogout.current)
            clearTimeout(timerWarning.current)
        }
    }, [reset])
}
