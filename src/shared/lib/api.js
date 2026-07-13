import { invoke } from '@tauri-apps/api/core'
import { getToken, clearSession } from './session'

export async function apiFetch(path, options = {}) {
  const token  = getToken()
  const method = (options.method ?? 'GET').toUpperCase()
  const body   = options.body ?? null

  let result
  try {
    result = await invoke('api_proxy', {
      method,
      path,
      body:  body  ?? null,
      token: token ?? null,
    })
  } catch (e) {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Espera un momento e intenta de nuevo.')
  }

  const { status, data } = result

  if (status === 401) {
    if (getToken()) {
      // El servidor perdió la sesión (reinicio de Railway). Guardamos un flag
      // para que LoginPage muestre un mensaje explicativo en lugar de un reload silencioso.
      sessionStorage.setItem('upel_session_interrupted', '1')
      clearSession()
      window.location.reload()
      return
    }
    throw new ApiError(401, data?.detail ?? 'Credenciales incorrectas.')
  }

  if (status === 204) return null

  if (status >= 400) {
    let detail = data?.detail ?? 'Error desconocido'
    if (Array.isArray(detail)) {
      detail = detail.map(d => {
        const campo = Array.isArray(d.loc)
          ? d.loc.filter(s => s !== 'body').join('.')
          : null
        return campo ? `${campo}: ${d.msg}` : (d.msg ?? JSON.stringify(d))
      }).join(' · ')
    }
    throw new ApiError(status, detail)
  }

  return data
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

export async function apiFetchBlob(path, options = {}) {
  const token  = getToken()
  const method = (options.method ?? 'GET').toUpperCase()

  let bytes
  try {
    bytes = await invoke('api_proxy_blob', {
      method,
      path,
      token: token ?? null,
    })
  } catch (e) {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  return new Blob([new Uint8Array(bytes)])
}
