import { apiFetch } from '@/shared/lib/api'

export const mesasService = {
  getAll(filtros = {}) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    )
    const query = params.toString() ? `?${params}` : ''
    return apiFetch(`/api/mesas/${query}`)
  },

  getEstudiantesAsignados: () => apiFetch('/api/mesas/estudiantes-asignados'),

  create: (data) =>
    apiFetch('/api/mesas/', { method: 'POST', body: JSON.stringify(data) }),

  editar: (id, data) =>
    apiFetch(`/api/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  registrarQuorum: (id, data) =>
    apiFetch(`/api/mesas/${id}/quorum`, { method: 'PATCH', body: JSON.stringify(data) }),

  registrarVeredicto: (id, data) =>
    apiFetch(`/api/mesas/${id}/veredicto`, { method: 'PATCH', body: JSON.stringify(data) }),

  validarCorrecciones: (id) =>
    apiFetch(`/api/mesas/${id}/validar-correcciones`, { method: 'PATCH' }),

  suspender: (id) =>
    apiFetch(`/api/mesas/${id}/suspender`, { method: 'PATCH' }),
}
