const KEYS = {
  TOKEN:          'upel_token',
  ROL:            'upel_rol',
  NOMBRE:         'upel_nombre',
  CEDULA:         'upel_cedula',
  MAESTRIA_ID:    'upel_maestria_id',
  TIPO_CONSULTOR: 'upel_tipo_consultor',
}

export function setSession({ token, rol, nombre, cedula, maestria_id = null, tipo_consultor = null }) {
  sessionStorage.setItem(KEYS.TOKEN,  token)
  sessionStorage.setItem(KEYS.ROL,    rol)
  sessionStorage.setItem(KEYS.NOMBRE, nombre)
  sessionStorage.setItem(KEYS.CEDULA, cedula)
  if (maestria_id !== null)    sessionStorage.setItem(KEYS.MAESTRIA_ID,    String(maestria_id))
  else                         sessionStorage.removeItem(KEYS.MAESTRIA_ID)
  if (tipo_consultor !== null) sessionStorage.setItem(KEYS.TIPO_CONSULTOR, tipo_consultor)
  else                         sessionStorage.removeItem(KEYS.TIPO_CONSULTOR)
}

export function clearSession() {
  Object.values(KEYS).forEach(k => sessionStorage.removeItem(k))
  // El caché de API se invalida junto con la sesión para que el próximo
  // usuario (si la app se reutiliza) no vea datos del anterior.
  import('@/shared/lib/useApiCache').then(m => m.clearAllCache())
}

export function getToken() {
  return sessionStorage.getItem(KEYS.TOKEN)
}

export function getSession() {
  const token = getToken()
  if (!token) return null
  const maestriaRaw = sessionStorage.getItem(KEYS.MAESTRIA_ID)
  return {
    token,
    rol:            sessionStorage.getItem(KEYS.ROL),
    nombre:         sessionStorage.getItem(KEYS.NOMBRE),
    cedula:         sessionStorage.getItem(KEYS.CEDULA),
    maestria_id:    maestriaRaw ? Number(maestriaRaw) : null,
    tipo_consultor: sessionStorage.getItem(KEYS.TIPO_CONSULTOR),
  }
}

export function isAuthenticated() {
  return Boolean(getToken())
}
