import { apiFetch } from '@/shared/lib/api'
import { setSession, clearSession } from '@/shared/lib/session'

/**
 * @param {string} cedula
 * @param {string} contrasena
 * @returns {Promise<{token, rol, nombre, cedula}>}
 */
export async function login(cedula, contrasena) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ cedula, contrasena }),
  })
  setSession(data)
  return data
}

export async function loginConsultor(cedula) {
  const data = await apiFetch('/api/auth/login-consultor', {
    method: 'POST',
    body: JSON.stringify({ cedula }),
  })
  setSession(data)
  return data
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  clearSession()
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}
