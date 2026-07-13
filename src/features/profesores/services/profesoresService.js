import { apiFetch } from '@/shared/lib/api'

export const profesoresService = {
  getAll:     ()         => apiFetch('/api/profesores/'),
  getActivos: ()         => apiFetch('/api/profesores/?activos=true'),
  create:     (data)     => apiFetch('/api/profesores/',       { method: 'POST',   body: JSON.stringify(data) }),
  update:     (id, data) => apiFetch(`/api/profesores/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  remove:     (id)       => apiFetch(`/api/profesores/${id}`, { method: 'DELETE' }),
}
