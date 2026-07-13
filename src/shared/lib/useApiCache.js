import { useState, useEffect } from 'react'

// Cache en memoria compartida entre componentes durante la sesión.
// Se vacía al recargar la app (comportamiento correcto: Tauri reinicia limpio).
const _cache = new Map() // key → { data, expiresAt }

/**
 * Cachea el resultado de un fetch durante `ttlMs` milisegundos.
 * Evita recargar datos estáticos (maestrías, aulas, profesores) en cada navegación.
 *
 * @param {string}   key      - Clave única para este dato (ej. "maestrias", "aulas")
 * @param {Function} fetcher  - Función async que retorna los datos (ej. () => maestriasService.getAll())
 * @param {number}   ttlMs    - Tiempo de vida en ms (default: 60 segundos)
 */
export function useApiCache(key, fetcher, ttlMs = 60_000) {
  const cached = _cache.get(key)
  const initialData = cached && Date.now() < cached.expiresAt ? cached.data : null

  const [data, setData]       = useState(initialData)
  const [loading, setLoading] = useState(initialData === null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const cached = _cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      setData(cached.data)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then(d => {
        if (cancelled) return
        _cache.set(key, { data: d, expiresAt: Date.now() + ttlMs })
        setData(d)
      })
      .catch(e => {
        if (cancelled) return
        setError(e.detail ?? 'Error al cargar datos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [key, ttlMs])

  return { data: data ?? [], loading, error }
}

/**
 * Invalida una entrada del caché manualmente.
 * Útil después de una operación que modifica los datos cacheados.
 */
export function invalidateCache(key) {
  _cache.delete(key)
}

/**
 * Invalida todo el caché (ej. al cerrar sesión).
 */
export function clearAllCache() {
  _cache.clear()
}
