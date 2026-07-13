import { apiFetch } from '@/shared/lib/api'

export const estudiantesService = {
  getAll:          ()         => apiFetch('/api/estudiantes/'),
  create:          (data)     => apiFetch('/api/estudiantes/',      { method: 'POST',   body: JSON.stringify(data) }),
  update:          (id, data) => apiFetch(`/api/estudiantes/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  remove:          (id)       => apiFetch(`/api/estudiantes/${id}`, { method: 'DELETE' }),
  updateSolvencia: (id, data) => apiFetch(`/api/estudiantes/${id}/solvencia`, { method: 'PATCH', body: JSON.stringify(data) }),
}
