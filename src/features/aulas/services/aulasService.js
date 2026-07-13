import { apiFetch } from '@/shared/lib/api'

export const aulasService = {
  getAll:  ()           => apiFetch('/api/aulas/'),
  create:  (data)       => apiFetch('/api/aulas/',       { method: 'POST',   body: JSON.stringify(data) }),
  update:  (id, data)   => apiFetch(`/api/aulas/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  remove:  (id)         => apiFetch(`/api/aulas/${id}`, { method: 'DELETE' }),
}
