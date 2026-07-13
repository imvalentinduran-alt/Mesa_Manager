import { apiFetch } from '@/shared/lib/api'

export const historialService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString()
    return apiFetch(`/api/auditoria/${query ? '?' + query : ''}`)
  },
}
