import { apiFetch } from '@/shared/lib/api'

export const usuariosService = {
  getAll:       ()         => apiFetch('/api/usuarios/'),
  create:       (data)     => apiFetch('/api/usuarios/',        { method: 'POST',   body: JSON.stringify(data) }),
  update:       (id, data) => apiFetch(`/api/usuarios/${id}`,  { method: 'PUT',    body: JSON.stringify(data) }),
  remove:       (id)       => apiFetch(`/api/usuarios/${id}`,  { method: 'DELETE' }),
  getMaestrias: ()         => apiFetch('/api/maestrias/'),
}
